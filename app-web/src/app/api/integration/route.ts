import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AxiosError } from 'axios';

import { baseAuthOptions } from '@/lib/auth';
import { internalApiClient } from '@/services/api';

async function requireOwnerOrAdminSession() {
  const session = await getServerSession(baseAuthOptions);

  if (
    !session?.companyId ||
    !session?.externalIntegrationUser ||
    (session.role !== 'OWNER' && session.role !== 'ADMINISTRATOR')
  ) {
    return null;
  }

  return session;
}

export async function GET() {
  const session = await requireOwnerOrAdminSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
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
  const session = await requireOwnerOrAdminSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
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
