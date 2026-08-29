import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { requireSession, unauthorizedResponse } from '@/lib/apiAuth';
import { resolveBackendAccessToken } from '@/lib/backendAuth';
import { internalApiClient } from '@/services/api';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
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
  const session = await requireSession();

  if (!session) {
    return unauthorizedResponse();
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
