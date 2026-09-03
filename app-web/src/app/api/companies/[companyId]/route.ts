import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { withAuthenticatedRoute } from '@/lib/apiRoute';
import { internalApiClient } from '@/services/api';

export const PATCH = withAuthenticatedRoute<{ companyId: string }>(
  async (req: NextRequest, { params }, { token }) => {
    const { companyId } = await params;
    const body = await req.json();

    try {
      const { data } = await internalApiClient.patch(`/company/${companyId}`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return NextResponse.json(data);
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        return NextResponse.json(error.response.data, { status: error.response.status });
      }

      return NextResponse.json({ message: 'Erro ao atualizar empresa' }, { status: 500 });
    }
  },
);
