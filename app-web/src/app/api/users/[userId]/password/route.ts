import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { withAuthenticatedRoute } from '@/lib/apiRoute';
import { internalApiClient } from '@/services/api';

export const PATCH = withAuthenticatedRoute<{ userId: string }>(
  async (req: NextRequest, { params }, { token }) => {
    const { userId } = await params;
    const body = await req.json();

    try {
      await internalApiClient.patch(`/user/${userId}/password`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return NextResponse.json(error.response.data, { status: error.response.status });
      }

      return NextResponse.json({ message: 'Erro ao definir senha' }, { status: 500 });
    }
  },
);
