import NextAuth from 'next-auth';
import { NextRequest } from 'next/server';

import { buildDynamicAuthOptions } from '@/lib/auth';

// The Infor OAuth provider config (baseUrl/clientId/clientSecret) depends on
// which company the user identified in /login/infor — so it's rebuilt per
// request instead of using a single static NextAuthOptions object.
async function handler(req: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const options = await buildDynamicAuthOptions();
  return NextAuth(options)(req, context);
}

export { handler as GET, handler as POST };
