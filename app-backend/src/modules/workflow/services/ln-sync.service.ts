import { Injectable, Logger } from '@nestjs/common';
import { CompanyIntegration, Provider } from '@prisma/client';

import { CryptoService } from '../../../shared/crypto/crypto.service';
import { AuditService } from '../../audit/services/audit.service';
import { CompanyIntegrationRepository } from '../../onboarding/repositories/company-integration.repository';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowWithRelations } from '../types/workflow-with-relations';
import {
  LnApiCallError,
  LnApiClient,
  LnApiConfig,
  LnApprovalResultPayload,
  LnCallDetails,
} from './ln-api-client';
import { buildLnApprovalResult } from './ln-approval-result';

// Everything recorded in the audit trail (metadata.ln) about one delivery
// attempt, so a failure can be investigated from the audit screen alone.
export type LnSyncDetails =
  | {
      stage: 'CONFIG';
      integrationFound: boolean;
      integrationActive: boolean;
      missingFields: string[];
    }
  | (LnCallDetails & { payload: LnApprovalResultPayload });

// Any reason the result could not be delivered to LN: missing/incomplete
// integration, SSO or LN refusing the call, network errors.
export class LnSyncError extends Error {
  constructor(
    message: string,
    readonly details: LnSyncDetails,
  ) {
    super(message);
  }
}

const REQUIRED_INTEGRATION_FIELDS = [
  'baseUrl',
  'ionApiUrl',
  'serviceClientId',
  'serviceClientSecret',
  'serviceAccountKey',
  'serviceAccountSecret',
] as const;

@Injectable()
export class LnSyncService {
  private readonly logger = new Logger(LnSyncService.name);

  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly companyIntegrationRepository: CompanyIntegrationRepository,
    private readonly cryptoService: CryptoService,
    private readonly lnApiClient: LnApiClient,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Delivers the workflow's final result to LN, throwing LnSyncError on any
   * failure. Writes nothing: callers decide what a failure means (a human
   * decision is rolled back; automatic flows are marked FAILED instead).
   */
  async send(workflow: WorkflowWithRelations): Promise<LnSyncDetails> {
    const integration =
      await this.companyIntegrationRepository.findByCompanyAndProvider(
        workflow.purchaseOrder.companyId,
        Provider.INFOR,
      );

    if (!integration || !integration.active) {
      throw new LnSyncError(
        'Nenhuma integração ativa com o LN configurada para a empresa',
        {
          stage: 'CONFIG',
          integrationFound: !!integration,
          integrationActive: !!integration?.active,
          missingFields: integration ? [] : [...REQUIRED_INTEGRATION_FIELDS],
        },
      );
    }

    const missingFields = REQUIRED_INTEGRATION_FIELDS.filter(
      (field) => !integration[field],
    );

    if (missingFields.length > 0) {
      throw new LnSyncError(
        `Integração com o LN incompleta: faltam ${missingFields.join(', ')}`,
        {
          stage: 'CONFIG',
          integrationFound: true,
          integrationActive: true,
          missingFields,
        },
      );
    }

    const payload = buildLnApprovalResult(workflow);

    try {
      const call = await this.lnApiClient.sendApprovalResult(
        this.buildLnApiConfig(integration),
        payload,
      );
      return { ...call, payload };
    } catch (error) {
      if (error instanceof LnApiCallError) {
        throw new LnSyncError(error.message, { ...error.details, payload });
      }

      throw error;
    }
  }

  /**
   * Fire-and-record variant for flows that must not depend on LN (automatic
   * approval/rejection on receipt, manual retry): failures are stored as
   * FAILED for a later retry instead of being thrown.
   */
  async sendResult(workflowId: string): Promise<void> {
    const workflow = await this.workflowRepository.findById(workflowId);

    if (!workflow) {
      this.logger.warn(`Cannot sync workflow ${workflowId}: not found`);
      return;
    }

    let details: LnSyncDetails;

    try {
      details = await this.send(workflow);
    } catch (error) {
      if (error instanceof LnSyncError) {
        await this.markFailed(workflow, error);
        return;
      }
      throw error;
    }

    await this.markSynced(workflow, details);
  }

  async markSynced(
    workflow: WorkflowWithRelations,
    details: LnSyncDetails,
  ): Promise<void> {
    await this.workflowRepository.updateWorkflow(workflow.workflowId, {
      lnSyncStatus: 'SYNCED',
      lnSyncAttempts: workflow.lnSyncAttempts + 1,
      lnSyncedAt: new Date(),
      lnLastError: null,
    });

    this.auditService.log({
      action: 'workflow.ln_sync_sent',
      entity: 'PurchaseOrder',
      entityId: workflow.purchaseOrderId,
      companyId: workflow.purchaseOrder.companyId,
      severity: 'success',
      message: 'Resultado da aprovação enviado ao LN com sucesso.',
      metadata: { ...this.buildAuditMetadata(workflow), ln: details },
    });
  }

  /**
   * Records a human decision that was rolled back because LN refused it.
   * Written immediately (logNow), outside the rolled-back transaction, so the
   * attempt still shows on the order's timeline.
   */
  async recordBlockedDecision(
    workflow: WorkflowWithRelations,
    error: LnSyncError,
  ): Promise<void> {
    this.logger.error(
      `LN sync failed for workflow ${workflow.workflowId}, decision rolled back: ${error.message}`,
    );

    await this.auditService.logNow({
      action: 'workflow.ln_sync_failed',
      entity: 'PurchaseOrder',
      entityId: workflow.purchaseOrderId,
      companyId: workflow.purchaseOrder.companyId,
      severity: 'error',
      message: `Decisão não registrada: o envio ao LN falhou. ${error.message}`,
      metadata: {
        ...this.buildAuditMetadata(workflow),
        decisionRolledBack: true,
        ln: error.details,
      },
    });
  }

  private async markFailed(
    workflow: WorkflowWithRelations,
    error: LnSyncError,
  ): Promise<void> {
    this.logger.error(
      `LN sync failed for workflow ${workflow.workflowId}: ${error.message}`,
    );

    await this.workflowRepository.updateWorkflow(workflow.workflowId, {
      lnSyncStatus: 'FAILED',
      lnSyncAttempts: workflow.lnSyncAttempts + 1,
      lnLastError: error.message,
    });

    // Reached from a catch block: AuditService.log() never throws, so it
    // cannot mask the original failure.
    this.auditService.log({
      action: 'workflow.ln_sync_failed',
      entity: 'PurchaseOrder',
      entityId: workflow.purchaseOrderId,
      companyId: workflow.purchaseOrder.companyId,
      severity: 'error',
      message: error.message,
      metadata: { ...this.buildAuditMetadata(workflow), ln: error.details },
    });
  }

  // Only called once REQUIRED_INTEGRATION_FIELDS are known to be present.
  private buildLnApiConfig(integration: CompanyIntegration): LnApiConfig {
    return {
      ssoUrl: integration.baseUrl,
      ionApiUrl: integration.ionApiUrl!,
      clientId: integration.serviceClientId!,
      clientSecret: this.cryptoService.decrypt(
        integration.serviceClientSecret!,
      ),
      serviceAccountKey: integration.serviceAccountKey!,
      serviceAccountSecret: this.cryptoService.decrypt(
        integration.serviceAccountSecret!,
      ),
    };
  }

  // requestId/batchId let a sync event be traced back to the LN request.
  private buildAuditMetadata(workflow: WorkflowWithRelations) {
    return {
      workflowId: workflow.workflowId,
      orderNumber: workflow.purchaseOrder.orderNumber,
      requestId: workflow.purchaseOrder.requestId,
      batchId: workflow.purchaseOrder.batchId,
      lnSyncAttempt: workflow.lnSyncAttempts + 1,
    };
  }
}
