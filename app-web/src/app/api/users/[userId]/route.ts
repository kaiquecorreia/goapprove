import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { AxiosError } from 'axios';

import { baseAuthOptions } from '@/lib/auth';
import { internalApiClient } from '@/services/api';
import { ERoutePath, canAccessRoute } from '@/config/navigation';

async function requireUsersAccessSession() {
  const session = await getServerSession(baseAuthOptions);

  if (!session?.role || !canAccessRoute(session.role, ERoutePath.USERS)) {
    return null;
  }

  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await requireUsersAccessSession();

  if (!session) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }

  const { userId } = await params;
  const body = await req.json();

  try {
    const { data } = await internalApiClient.patch(`/user/${userId}`, body);
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
