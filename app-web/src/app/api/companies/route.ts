import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { withAuthenticatedRoute } from '@/lib/apiRoute';
import { internalApiClient } from '@/services/api';

export const POST = withAuthenticatedRoute(async (req: NextRequest, _ctx, { token }) => {
  const body = await req.json();

  try {
    const { data } = await internalApiClient.post('/company', body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof AxiosError && error.response) {
      return NextResponse.json(error.response.data, { status: error.response.status });
    }

    return NextResponse.json({ message: 'Erro ao criar empresa' }, { status: 500 });
  }
});
