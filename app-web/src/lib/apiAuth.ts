import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';

import { baseAuthOptions } from '@/lib/auth';

export async function requireSession() {
  return getServerSession(baseAuthOptions);
}

export function unauthorizedResponse() {
  return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
}
