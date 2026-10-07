import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { requireSession, unauthorizedResponse } from '@/lib/apiAuth';
import { internalApiClient } from '@/services/api';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalidCompanyResponse() {
  return NextResponse.json({ message: 'Empresa inválida' }, { status: 400 });
}

// Access is ADMINISTRATOR-only (middleware.ts), and an administrator may
// configure any company, so the target company comes from the request.
export async function GET(req: NextRequest) {
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
  }

  const companyId = req.nextUrl.searchParams.get('companyId') ?? '';

  if (!UUID_PATTERN.test(companyId)) {
    return invalidCompanyResponse();
  }

  try {
    const { data } = await internalApiClient.get(`/onboarding/company/${companyId}/integration`, {
      params: { actingExternalIntegrationUser: session.externalIntegrationUser },
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao buscar integração' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
  }

  const body = await req.json();
  const companyId = typeof body.companyId === 'string' ? body.companyId : '';

  if (!UUID_PATTERN.test(companyId)) {
    return invalidCompanyResponse();
  }

  try {
    const { data } = await internalApiClient.patch(`/onboarding/company/${companyId}/integration`, {
      actingExternalIntegrationUser: session.externalIntegrationUser,
      baseUrl: body.baseUrl,
      clientId: body.clientId,
      clientSecret: body.clientSecret || undefined,
      ionApiUrl: body.ionApiUrl || undefined,
      serviceClientId: body.serviceClientId || undefined,
      serviceClientSecret: body.serviceClientSecret || undefined,
      serviceAccountKey: body.serviceAccountKey || undefined,
      serviceAccountSecret: body.serviceAccountSecret || undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao atualizar integração' }, { status: 500 });
  }
}
