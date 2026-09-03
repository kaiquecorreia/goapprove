import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { withAuthenticatedRoute } from '@/lib/apiRoute';
import { internalApiClient } from '@/services/api';

export const GET = withAuthenticatedRoute(async (req: NextRequest, _ctx, { token }) => {
  const companyId = req.nextUrl.searchParams.get('companyId') ?? undefined;

  try {
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
});

export const POST = withAuthenticatedRoute(async (req: NextRequest, _ctx, { token }) => {
  const body = await req.json();

  try {
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
});
