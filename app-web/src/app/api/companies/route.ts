import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AxiosError } from 'axios';

import { baseAuthOptions } from '@/lib/auth';
import { internalApiClient } from '@/services/api';
import { ERoutePath, canAccessRoute } from '@/config/navigation';

async function requireCompaniesAccessSession() {
  const session = await getServerSession(baseAuthOptions);

  if (!session?.role || !canAccessRoute(session.role, ERoutePath.COMPANIES)) {
    return null;
  }

  return session;
}

export async function POST(req: NextRequest) {
  const session = await requireCompaniesAccessSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }

  const body = await req.json();

  try {
    const { data } = await internalApiClient.post('/company', body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao criar empresa' }, { status: 500 });
  }
}
