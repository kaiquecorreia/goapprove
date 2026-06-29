import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { internalApiClient } from '@/services/api';
import { INFOR_LOOKUP_COOKIE } from '@/lib/auth';

interface IntegrationLookupResponse {
  companyId: string;
  role: string;
  email: string;
}

export async function POST(req: NextRequest) {
  const { externalIntegrationUser } = await req.json();

  if (!externalIntegrationUser || typeof externalIntegrationUser !== 'string') {
    return NextResponse.json({ message: 'Usuário é obrigatório' }, { status: 400 });
  }

  try {
    const { data } = await internalApiClient.get<IntegrationLookupResponse>(
      '/auth/integration-lookup',
      { params: { externalIntegrationUser } },
    );

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      INFOR_LOOKUP_COOKIE,
      JSON.stringify({
        externalIntegrationUser,
        companyId: data.companyId,
        role: data.role,
        email: data.email,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 60 * 10,
      },
    );

    return response;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return NextResponse.json(
        { message: 'Usuário não encontrado ou não autorizado' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: 'Erro ao validar usuário. Tente novamente.' },
      { status: 500 },
    );
  }
}
