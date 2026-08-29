import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { internalApiClient } from '@/services/api';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const body = await req.json();

  try {
    await internalApiClient.patch(`/user/${userId}/password`, body);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao definir senha' }, { status: 500 });
  }
}
