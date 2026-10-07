import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

export type LnDecision = 'APPROVED' | 'REJECTED';

export interface LnApprover {
  level: number;
  userId: string;
  lnUserId: string;
  name: string;
  decision: LnDecision;
  decisionDate: string;
  comment: string;
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

// Decrypted Backend Service credentials, as they come from the .ionapi file.
export interface LnApiConfig {
  ssoUrl: string; // pu + tenant, e.g. https://mingle-sso.inforcloudsuite.com:443/TENANT
  ionApiUrl: string; // iu + tenant, e.g. https://mingle-ionapi.inforcloudsuite.com/TENANT
  clientId: string; // ci
  clientSecret: string; // cs
  serviceAccountKey: string; // saak
  serviceAccountSecret: string; // sask
}

const APPROVAL_RESPONSE_PATH =
  '/LN/lnapi/odata/txckx.Goapprove/ApprovalResponse';
// Kept short: a human decision waits on this call inside a DB transaction.
const TIMEOUT_MS = 15_000;

export type LnCallStage = 'TOKEN' | 'APPROVAL_RESPONSE';

// What an investigator needs to understand one HTTP call to Infor. Never holds
// credentials: the token request body (client secret, service account secret)
// and the bearer token are deliberately left out.
export interface LnCallDetails {
  stage: LnCallStage;
  method: 'POST';
  url: string;
  httpStatus: number | null;
  responseBody: unknown;
  durationMs: number;
  /** Network-level error code when there was no HTTP response (e.g. ECONNREFUSED, ECONNABORTED). */
  errorCode?: string;
}

export class LnApiCallError extends Error {
  constructor(
    message: string,
    readonly details: LnCallDetails,
  ) {
    super(message);
  }
}

/**
 * Posts the approval result to LN through ION API. Deliberately minimal: a
 * fresh token is fetched on every call (no cache, no refresh) — results are
 * sent once per finalized workflow, and failures are retried manually.
 */
@Injectable()
export class LnApiClient {
  constructor(private readonly httpService: HttpService) {}

  /** Resolves with the details of the ApprovalResponse call on success. */
  async sendApprovalResult(
    config: LnApiConfig,
    payload: LnApprovalResultPayload,
  ): Promise<LnCallDetails> {
    const token = await this.fetchToken(config);
    const url = `${trimSlash(config.ionApiUrl)}${APPROVAL_RESPONSE_PATH}`;
    const startedAt = Date.now();

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          timeout: TIMEOUT_MS,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Content-Language': 'en-US',
            'X-Infor-LnCompany': payload.companyCode,
          },
        }),
      );

      return {
        stage: 'APPROVAL_RESPONSE',
        method: 'POST',
        url,
        httpStatus: response.status,
        responseBody: response.data as unknown,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      throw toCallError(
        'Falha ao enviar resultado ao LN',
        'APPROVAL_RESPONSE',
        url,
        startedAt,
        error,
      );
    }
  }

  private async fetchToken(config: LnApiConfig): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      username: config.serviceAccountKey,
      password: config.serviceAccountSecret,
    });
    const url = `${trimSlash(config.ssoUrl)}/as/token.oauth2`;
    const startedAt = Date.now();

    let response: { status: number; data: { access_token?: string } };

    try {
      response = await firstValueFrom(
        this.httpService.post<{ access_token?: string }>(url, body.toString(), {
          timeout: TIMEOUT_MS,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );
    } catch (error) {
      throw toCallError(
        'Falha ao autenticar no Infor SSO',
        'TOKEN',
        url,
        startedAt,
        error,
      );
    }

    const accessToken = response.data?.access_token;

    if (typeof accessToken !== 'string' || !accessToken) {
      throw new LnApiCallError('Infor SSO não retornou access_token', {
        stage: 'TOKEN',
        method: 'POST',
        url,
        httpStatus: response.status,
        // The body may hold a token-like value under another key; only its
        // shape is useful here.
        responseBody: { keys: Object.keys(response.data ?? {}) },
        durationMs: Date.now() - startedAt,
      });
    }

    return accessToken;
  }
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

// Surfaces the upstream status and body (e.g. SSO's error_description) both
// in the message, so lnLastError is actionable, and as structured details for
// the audit trail.
function toCallError(
  prefix: string,
  stage: LnCallStage,
  url: string,
  startedAt: number,
  error: unknown,
): LnApiCallError {
  const durationMs = Date.now() - startedAt;

  if (isAxiosError(error)) {
    if (error.response) {
      const data: unknown = error.response.data;
      const detail =
        typeof data === 'string' ? data : JSON.stringify(data ?? '');

      return new LnApiCallError(
        `${prefix}: HTTP ${error.response.status} ${detail}`.slice(0, 1000),
        {
          stage,
          method: 'POST',
          url,
          httpStatus: error.response.status,
          responseBody: data,
          durationMs,
        },
      );
    }

    return new LnApiCallError(`${prefix}: ${error.message}`, {
      stage,
      method: 'POST',
      url,
      httpStatus: null,
      responseBody: null,
      durationMs,
      errorCode: error.code,
    });
  }

  return new LnApiCallError(
    `${prefix}: ${error instanceof Error ? error.message : String(error)}`,
    {
      stage,
      method: 'POST',
      url,
      httpStatus: null,
      responseBody: null,
      durationMs,
    },
  );
}
