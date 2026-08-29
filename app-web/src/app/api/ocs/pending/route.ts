import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { requireSession, unauthorizedResponse } from '@/lib/apiAuth';
import { resolveBackendAccessToken } from '@/lib/backendAuth';
import { internalApiClient } from '@/services/api';

const FORWARDED_PARAMS = [
  'page',
  'limit',
  'search',
  'companyId',
  'supplierCode',
  'requesterCode',
  'costCenter',
] as const;

export async function GET(req: NextRequest) {
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
  }

  const params: Record<string, string> = {};
  for (const key of FORWARDED_PARAMS) {
    const value = req.nextUrl.searchParams.get(key);
    if (value) params[key] = value;
  }

  try {
    const token = await resolveBackendAccessToken(session);
    const { data } = await internalApiClient.get('/workflows/pending', {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao listar OCs pendentes' }, { status: 500 });
  }
}
