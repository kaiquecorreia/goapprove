import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { requireSession, unauthorizedResponse } from '@/lib/apiAuth';
import { resolveBackendAccessToken } from '@/lib/backendAuth';
import { internalApiClient } from '@/services/api';

export async function GET(req: NextRequest) {
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
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
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
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
