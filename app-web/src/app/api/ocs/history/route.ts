import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { withAuthenticatedRoute } from '@/lib/apiRoute';
import { internalApiClient } from '@/services/api';

const FORWARDED_PARAMS = [
  'page',
  'limit',
  'search',
  'status',
  'companyId',
  'supplierCode',
  'requesterCode',
  'costCenter',
  'dateFrom',
  'dateTo',
] as const;

export const GET = withAuthenticatedRoute(async (req: NextRequest, _ctx, { token }) => {
  const params: Record<string, string> = {};
  for (const key of FORWARDED_PARAMS) {
    const value = req.nextUrl.searchParams.get(key);
    if (value) params[key] = value;
  }

  try {
    const { data } = await internalApiClient.get('/workflows/history', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao listar histórico de OCs' }, { status: 500 });
  }
});
