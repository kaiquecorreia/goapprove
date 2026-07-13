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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  const session = await requireRulesAccessSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }

  const { ruleId } = await params;
  const body = await req.json();

  try {
    const token = await resolveBackendAccessToken(session);
    const { data } = await internalApiClient.patch(`/rules/${ruleId}`, body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao atualizar regra' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> },
) {
  const session = await requireRulesAccessSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }

  const { ruleId } = await params;

  try {
    const token = await resolveBackendAccessToken(session);
    const { data } = await internalApiClient.delete(`/rules/${ruleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao desativar regra' }, { status: 500 });
  }
}
