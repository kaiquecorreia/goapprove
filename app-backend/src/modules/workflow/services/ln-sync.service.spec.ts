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
  let lnApiClient: {
    sendApprovalResult: jest.Mock;
    approvePurchaseOrder: jest.Mock;
  };
  let service: LnSyncService;

  beforeEach(() => {
    integrationRepository = { findByCompanyAndProvider: jest.fn() };
    lnApiClient = {
      sendApprovalResult: jest.fn(),
      approvePurchaseOrder: jest.fn(),
    };
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
    expect(lnApiClient.approvePurchaseOrder).not.toHaveBeenCalled();
  });

  it('workflow aprovado: aprova a OC no LN pela action Approve', async () => {
    integrationRepository.findByCompanyAndProvider.mockResolvedValue(
      completeIntegration,
    );
    lnApiClient.approvePurchaseOrder.mockResolvedValue({
      stage: 'APPROVE',
      method: 'POST',
      url: 'https://ionapi/TENANT/...',
      httpStatus: 204,
      responseBody: '',
      durationMs: 50,
    });

    const details = await service.send(workflow);

    const expectedRequest = {
      companyCode: '3101',
      purchaseOrderNumber: 'CN0004072',
      body: {
        ApplyApprovalRules: false,
        CheckAmountUpto: 0,
        CheckAmountUptoCurrency: 'BRL',
      },
    };
    expect(lnApiClient.approvePurchaseOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        ionApiUrl: 'https://ionapi/TENANT',
        clientSecret: 'cs',
      }),
      expectedRequest,
    );
    expect(lnApiClient.sendApprovalResult).not.toHaveBeenCalled();
    expect(details).toEqual(
      expect.objectContaining({ stage: 'APPROVE', payload: expectedRequest }),
    );
  });

  it('workflow rejeitado: continua enviando pelo ApprovalResponse', async () => {
    integrationRepository.findByCompanyAndProvider.mockResolvedValue(
      completeIntegration,
    );
    lnApiClient.sendApprovalResult.mockResolvedValue({
      stage: 'APPROVAL_RESPONSE',
      method: 'POST',
      url: 'https://ionapi/TENANT/LN/lnapi/odata/txckx.Goapprove/ApprovalResponse',
      httpStatus: 200,
      responseBody: {},
      durationMs: 50,
    });

    await service.send({ ...workflow, status: 'REJECTED' });

    expect(lnApiClient.sendApprovalResult).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        purchaseOrderNumber: 'CN0004072',
        decision: 'REJECTED',
      }),
    );
    expect(lnApiClient.approvePurchaseOrder).not.toHaveBeenCalled();
  });

  it('falha na chamada: anexa o payload enviado aos detalhes do erro', async () => {
    integrationRepository.findByCompanyAndProvider.mockResolvedValue(
      completeIntegration,
    );
    lnApiClient.approvePurchaseOrder.mockRejectedValue(
      new LnApiCallError('Falha ao aprovar a ordem de compra no LN: HTTP 404', {
        stage: 'APPROVE',
        method: 'POST',
        url: "https://ionapi/TENANT/LN/lnapi/odata/tdapi.purPurchaseOrder/Orders(PurchaseOrder='CN0004072')/tdapi.purPurchaseOrder.Approve",
        httpStatus: 404,
        responseBody: { error: { message: 'Order not found' } },
        durationMs: 80,
      }),
    );

    const error = (await service
      .send(workflow)
      .catch((e: unknown) => e)) as LnSyncError;

    expect(error.details).toEqual(
      expect.objectContaining({
        stage: 'APPROVE',
        httpStatus: 404,
        payload: expect.objectContaining({
          companyCode: '3101',
          purchaseOrderNumber: 'CN0004072',
        }) as unknown,
      }),
    );
  });
});
