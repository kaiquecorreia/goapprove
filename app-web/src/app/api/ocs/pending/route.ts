import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AxiosError } from 'axios';

import { baseAuthOptions } from '@/lib/auth';
import { resolveBackendAccessToken } from '@/lib/backendAuth';
import { internalApiClient } from '@/services/api';
import { ERoutePath, canAccessRoute } from '@/config/navigation';

async function requirePendingOcsAccessSession() {
  const session = await getServerSession(baseAuthOptions);

  if (!session?.role || !canAccessRoute(session.role, ERoutePath.OCS_PENDING)) {
    return null;
  }

  return session;
}

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
  const session = await requirePendingOcsAccessSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
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
