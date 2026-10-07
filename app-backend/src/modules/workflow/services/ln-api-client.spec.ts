import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import {
  LnApiCallError,
  LnApiClient,
  LnApiConfig,
  LnApprovalResultPayload,
} from './ln-api-client';

const config: LnApiConfig = {
  ssoUrl: 'https://mingle-sso.inforcloudsuite.com:443/TENANT_TST/',
  ionApiUrl: 'https://mingle-ionapi.inforcloudsuite.com/TENANT_TST',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  serviceAccountKey: 'saak',
  serviceAccountSecret: 'sask',
};

const payload: LnApprovalResultPayload = {
  companyCode: '3101',
  requestId: 'CKX-3101-CN0004071-1',
  batchId: 'CKX-3101-20261004-1',
  purchaseOrderNumber: 'CN0004071',
  decision: 'APPROVED',
  decisionDate: '2026-10-04T16:10:00.000Z',
  finalStatusPortal: 'APPROVED',
  approvers: [],
};

function response<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
}

function axiosError(status: number, data: unknown): AxiosError {
  return new AxiosError(
    `Request failed with status code ${status}`,
    'ERR_BAD_RESPONSE',
    undefined,
    undefined,
    { ...response(data, status), statusText: 'Error' },
  );
}

describe('LnApiClient', () => {
  let httpService: { post: jest.Mock };
  let client: LnApiClient;

  beforeEach(() => {
    httpService = { post: jest.fn() };
    client = new LnApiClient(httpService as unknown as HttpService);
  });

  it('obtém um token via password grant e envia o resultado ao endpoint OData do LN', async () => {
    httpService.post
      .mockReturnValueOnce(of(response({ access_token: 'tok-123' })))
      .mockReturnValueOnce(of(response({})));

    await client.sendApprovalResult(config, payload);

    const [tokenUrl, tokenBody, tokenOptions] = httpService.post.mock
      .calls[0] as [string, string, { headers: Record<string, string> }];
    expect(tokenUrl).toBe(
      'https://mingle-sso.inforcloudsuite.com:443/TENANT_TST/as/token.oauth2',
    );
    expect(Object.fromEntries(new URLSearchParams(tokenBody))).toEqual({
      grant_type: 'password',
      client_id: 'client-id',
      client_secret: 'client-secret',
      username: 'saak',
      password: 'sask',
    });
    expect(tokenOptions.headers['Content-Type']).toBe(
      'application/x-www-form-urlencoded',
    );

    expect(httpService.post).toHaveBeenLastCalledWith(
      'https://mingle-ionapi.inforcloudsuite.com/TENANT_TST/LN/lnapi/odata/txckx.Goapprove/ApprovalResponse',
      payload,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok-123',
          'Content-Language': 'en-US',
          'X-Infor-LnCompany': '3101',
        }) as unknown,
      }),
    );
  });

  it('falha no SSO: propaga status e error_description, sem chamar o LN', async () => {
    httpService.post.mockReturnValueOnce(
      throwError(() =>
        axiosError(400, {
          error: 'invalid_grant',
          error_description: 'Bad credentials',
        }),
      ),
    );

    await expect(client.sendApprovalResult(config, payload)).rejects.toThrow(
      /Falha ao autenticar no Infor SSO: HTTP 400 .*Bad credentials/,
    );
    expect(httpService.post).toHaveBeenCalledTimes(1);
  });

  it('falha no SSO: detalhes estruturados sem nenhuma credencial', async () => {
    httpService.post.mockReturnValueOnce(
      throwError(() => axiosError(401, { error: 'invalid_client' })),
    );

    const error: unknown = await client
      .sendApprovalResult(config, payload)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(LnApiCallError);
    const { details } = error as LnApiCallError;
    expect(details).toEqual(
      expect.objectContaining({
        stage: 'TOKEN',
        method: 'POST',
        url: 'https://mingle-sso.inforcloudsuite.com:443/TENANT_TST/as/token.oauth2',
        httpStatus: 401,
        responseBody: { error: 'invalid_client' },
      }),
    );
    const serialized = JSON.stringify(details);
    for (const secret of ['client-secret', 'sask', 'saak']) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('sucesso: devolve os detalhes da chamada ao LN', async () => {
    httpService.post
      .mockReturnValueOnce(of(response({ access_token: 'tok-123' })))
      .mockReturnValueOnce(of(response({ status: 'OK' }, 201)));

    await expect(client.sendApprovalResult(config, payload)).resolves.toEqual(
      expect.objectContaining({
        stage: 'APPROVAL_RESPONSE',
        httpStatus: 201,
        responseBody: { status: 'OK' },
      }),
    );
  });

  it('SSO sem access_token: erro explícito', async () => {
    httpService.post.mockReturnValueOnce(of(response({})));

    await expect(client.sendApprovalResult(config, payload)).rejects.toThrow(
      'Infor SSO não retornou access_token',
    );
  });

  it('falha no LN: propaga status e corpo da resposta', async () => {
    httpService.post
      .mockReturnValueOnce(of(response({ access_token: 'tok-123' })))
      .mockReturnValueOnce(
        throwError(() =>
          axiosError(500, { error: { message: 'Order not found' } }),
        ),
      );

    await expect(client.sendApprovalResult(config, payload)).rejects.toThrow(
      /Falha ao enviar resultado ao LN: HTTP 500 .*Order not found/,
    );
  });
});
