import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { requireSession, unauthorizedResponse } from '@/lib/apiAuth';
import { internalApiClient } from '@/services/api';

export async function GET() {
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
  }

  try {
    const { data } = await internalApiClient.get(
      `/onboarding/company/${session.companyId}/integration`,
      {
        params: { actingExternalIntegrationUser: session.externalIntegrationUser },
      },
    );

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

  try {
    const { data } = await internalApiClient.patch(
      `/onboarding/company/${session.companyId}/integration`,
      {
        actingExternalIntegrationUser: session.externalIntegrationUser,
        baseUrl: body.baseUrl,
        clientId: body.clientId,
        clientSecret: body.clientSecret || undefined,
      },
    );

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao atualizar integração' }, { status: 500 });
  }
}
