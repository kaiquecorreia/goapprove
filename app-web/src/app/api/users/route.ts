import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { internalApiClient } from '@/services/api';

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const { data } = await internalApiClient.post('/user', body);
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao criar usuário' }, { status: 500 });
  }
}
