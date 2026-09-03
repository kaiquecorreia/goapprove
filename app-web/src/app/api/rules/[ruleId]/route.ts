import { NextRequest, NextResponse } from 'next/server';
import { AxiosError } from 'axios';

import { withAuthenticatedRoute } from '@/lib/apiRoute';
import { internalApiClient } from '@/services/api';

export const PATCH = withAuthenticatedRoute<{ ruleId: string }>(
  async (req: NextRequest, { params }, { token }) => {
    const { ruleId } = await params;
    const body = await req.json();

    try {
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
  },
);

export const DELETE = withAuthenticatedRoute<{ ruleId: string }>(
  async (_req: NextRequest, { params }, { token }) => {
    const { ruleId } = await params;

    try {
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
  },
);
