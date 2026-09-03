import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { withAuthenticatedRoute } from '@/lib/apiRoute';
import { internalApiClient } from '@/services/api';

export const GET = withAuthenticatedRoute<{ id: string }>(
  async (_req: NextRequest, { params }, { token }) => {
    const { id } = await params;

    try {
      const { data } = await internalApiClient.get(`/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return NextResponse.json(data);
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return NextResponse.json(error.response.data, { status: error.response.status });
      }

      return NextResponse.json({ message: 'Erro ao carregar a OC' }, { status: 500 });
    }
  },
);
