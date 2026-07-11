import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '@prisma/client';

import { CryptoService } from '../../../shared/crypto/crypto.service';
import { CompanyIntegrationRepository } from '../../onboarding/repositories/company-integration.repository';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowWithRelations } from '../types/workflow-with-relations';
import { LnApiClient } from './ln-api-client';

@Injectable()
export class LnSyncService {
  private readonly logger = new Logger(LnSyncService.name);

  constructor(
    private readonly workflowRepository: WorkflowRepository,
    private readonly companyIntegrationRepository: CompanyIntegrationRepository,
    private readonly cryptoService: CryptoService,
    private readonly lnApiClient: LnApiClient,
  ) {}

  async sendResult(workflowId: string): Promise<void> {
    const workflow = await this.workflowRepository.findById(workflowId);

    if (!workflow) {
      this.logger.warn(`Cannot sync workflow ${workflowId}: not found`);
      return;
    }

    const integration =
      await this.companyIntegrationRepository.findByCompanyAndProvider(
        workflow.purchaseOrder.companyId,
        Provider.INFOR,
      );

    if (!integration || !integration.active) {
      await this.markFailed(
        workflow.workflowId,
        workflow.lnSyncAttempts,
        'No active LN integration configured for company',
      );
      return;
    }

    try {
      await this.lnApiClient.sendApprovalResult(
        integration.baseUrl,
        integration.clientId,
        integration.clientSecret
          ? this.cryptoService.decrypt(integration.clientSecret)
          : null,
        this.buildPayload(workflow),
      );

      await this.workflowRepository.updateWorkflow(workflow.workflowId, {
        lnSyncStatus: 'SYNCED',
        lnSyncedAt: new Date(),
        lnLastError: null,
      });

      await this.workflowRepository.addAuditEvent({
        workflowId: workflow.workflowId,
        type: 'LN_SYNC_SENT',
        severity: 'success',
        message: 'Approval result sent to LN successfully.',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error sending result to LN';

      await this.markFailed(
        workflow.workflowId,
        workflow.lnSyncAttempts,
        message,
      );
    }
  }

  private async markFailed(
    workflowId: string,
    previousAttempts: number,
    message: string,
  ): Promise<void> {
    this.logger.error(`LN sync failed for workflow ${workflowId}: ${message}`);

    await this.workflowRepository.updateWorkflow(workflowId, {
      lnSyncStatus: 'FAILED',
      lnSyncAttempts: previousAttempts + 1,
      lnLastError: message,
    });

    await this.workflowRepository.addAuditEvent({
      workflowId,
      type: 'LN_SYNC_FAILED',
      severity: 'error',
      message,
    });
  }

  private buildPayload(workflow: WorkflowWithRelations) {
    const decision = workflow.status === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    return {
      orderNumber: workflow.purchaseOrder.orderNumber,
      companyExternalCode:
        workflow.purchaseOrder.company.externalIntegrationCode,
      decision,
      decidedAt: (workflow.finalizedAt ?? new Date()).toISOString(),
      approvals: workflow.levels.flatMap((level) =>
        level.approvers
          .filter((a) => a.status === 'APPROVED' || a.status === 'REJECTED')
          .map((a) => {
            const matchingDecision = level.decisions.find(
              (d) => d.assignedUserId === a.userId,
            );

            return {
              level: level.level,
              userId: a.userId,
              externalIntegrationUser: a.user.externalIntegrationUser,
              decision: a.status,
              comment: matchingDecision?.comment ?? null,
              decidedAt: (a.decidedAt ?? new Date()).toISOString(),
            };
          }),
      ),
    } as const;
  }
}
