import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

export type LnDecision = 'APPROVED' | 'REJECTED';

export interface LnApprover {
  level: number;
  userId: string;
  lnUserId: string;
  name: string;
  decision: LnDecision;
  decisionDate: string;
  comment: string | null;
}

export interface LnApprovalResultPayload {
  companyCode: string;
  requestId: string;
  batchId: string;
  purchaseOrderNumber: string;
  decision: LnDecision;
  decisionDate: string;
  finalStatusPortal: LnDecision;
  approvers: LnApprover[];
}

/**
 * The real LN outbound contract (token endpoint, scopes, result path) isn't
 * available in this codebase. This client posts the result with basic client
 * credentials as a placeholder — validate against actual LN API docs before
 * relying on this in production.
 */
@Injectable()
export class LnApiClient {
  constructor(private readonly httpService: HttpService) {}

  async sendApprovalResult(
    baseUrl: string,
    clientId: string | null,
    clientSecret: string | null,
    payload: LnApprovalResultPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.httpService.post(
        `${baseUrl}/purchase-orders/approval-result`,
        payload,
        {
          auth:
            clientId && clientSecret
              ? { username: clientId, password: clientSecret }
              : undefined,
        },
      ),
    );
  }
}
