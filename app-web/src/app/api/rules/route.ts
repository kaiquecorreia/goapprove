import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AxiosError } from 'axios';

import { baseAuthOptions } from '@/lib/auth';
import { resolveBackendAccessToken } from '@/lib/backendAuth';
import { internalApiClient } from '@/services/api';
import { ERoutePath, canAccessRoute } from '@/config/navigation';

async function requireRulesAccessSession() {
  const session = await getServerSession(baseAuthOptions);

  if (!session?.role || !canAccessRoute(session.role, ERoutePath.RULES)) {
    return null;
  }

  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireRulesAccessSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }

  const companyId = req.nextUrl.searchParams.get('companyId') ?? undefined;

  try {
    const token = await resolveBackendAccessToken(session);
    const { data } = await internalApiClient.get('/rules', {
      params: companyId ? { companyId } : undefined,
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao listar regras' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireRulesAccessSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }

  const body = await req.json();

  try {
    const token = await resolveBackendAccessToken(session);
    const { data } = await internalApiClient.post('/rules', body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao criar regra' }, { status: 500 });
  }
}
