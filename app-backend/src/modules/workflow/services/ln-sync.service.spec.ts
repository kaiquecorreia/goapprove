import { CryptoService } from '../../../shared/crypto/crypto.service';
import { AuditService } from '../../audit/services/audit.service';
import { CompanyIntegrationRepository } from '../../onboarding/repositories/company-integration.repository';
import { WorkflowRepository } from '../repositories/workflow.repository';
import { WorkflowWithRelations } from '../types/workflow-with-relations';
import { LnApiCallError, LnApiClient } from './ln-api-client';
import { LnSyncError, LnSyncService } from './ln-sync.service';

const workflow = {
  workflowId: 'workflow-1',
  purchaseOrderId: 'po-1',
  status: 'APPROVED',
  finalizedAt: new Date('2026-10-07T15:00:00.000Z'),
  lnSyncAttempts: 0,
  levels: [],
  purchaseOrder: {
    companyId: 'company-1',
    orderNumber: 'CN0004072',
    requestId: 'REQ-1',
    batchId: 'BATCH-1',
    company: { externalIntegrationCode: '3101' },
  },
} as unknown as WorkflowWithRelations;

const completeIntegration = {
  active: true,
  baseUrl: 'https://sso/TENANT',
  ionApiUrl: 'https://ionapi/TENANT',
  serviceClientId: 'ci',
  serviceClientSecret: 'enc-cs',
  serviceAccountKey: 'saak',
  serviceAccountSecret: 'enc-sask',
};

describe('LnSyncService.send', () => {
  let integrationRepository: { findByCompanyAndProvider: jest.Mock };
  let lnApiClient: { sendApprovalResult: jest.Mock };
  let service: LnSyncService;

  beforeEach(() => {
    integrationRepository = { findByCompanyAndProvider: jest.fn() };
    lnApiClient = { sendApprovalResult: jest.fn() };
    service = new LnSyncService(
      {} as WorkflowRepository,
      integrationRepository as unknown as CompanyIntegrationRepository,
      { decrypt: (v: string) => v.replace('enc-', '') } as CryptoService,
      lnApiClient as unknown as LnApiClient,
      {} as AuditService,
    );
  });

  it('integração incompleta: lista exatamente os campos que faltam', async () => {
    integrationRepository.findByCompanyAndProvider.mockResolvedValue({
      ...completeIntegration,
      ionApiUrl: null,
      serviceAccountSecret: null,
    });

    const error = (await service
      .send(workflow)
      .catch((e: unknown) => e)) as LnSyncError;

    expect(error).toBeInstanceOf(LnSyncError);
    expect(error.details).toEqual({
      stage: 'CONFIG',
      integrationFound: true,
      integrationActive: true,
      missingFields: ['ionApiUrl', 'serviceAccountSecret'],
    });
    expect(lnApiClient.sendApprovalResult).not.toHaveBeenCalled();
  });

  it('falha na chamada: anexa o payload enviado aos detalhes do erro', async () => {
    integrationRepository.findByCompanyAndProvider.mockResolvedValue(
      completeIntegration,
    );
    lnApiClient.sendApprovalResult.mockRejectedValue(
      new LnApiCallError('Falha ao enviar resultado ao LN: HTTP 404', {
        stage: 'APPROVAL_RESPONSE',
        method: 'POST',
        url: 'https://ionapi/TENANT/LN/lnapi/odata/txckx.Goapprove/ApprovalResponse',
        httpStatus: 404,
        responseBody: { error: { message: 'comment must not be null' } },
        durationMs: 80,
      }),
    );

    const error = (await service
      .send(workflow)
      .catch((e: unknown) => e)) as LnSyncError;

    expect(error.details).toEqual(
      expect.objectContaining({
        stage: 'APPROVAL_RESPONSE',
        httpStatus: 404,
        payload: expect.objectContaining({
          companyCode: '3101',
          purchaseOrderNumber: 'CN0004072',
          requestId: 'REQ-1',
        }) as unknown,
      }),
    );
  });
});
