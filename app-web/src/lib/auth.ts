import { NextAuthOptions } from 'next-auth';
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';

import { internalApiClient } from '@/services/api';

export const INFOR_LOOKUP_COOKIE = 'infor_login_ctx';

export interface InforLoginContext {
  externalIntegrationUser: string;
  companyId: string;
  role: string;
  email: string;
}

export interface InforIntegrationConfig {
  companyId: string;
  role: string;
  email: string;
  baseUrl: string;
  clientId?: string;
  clientSecret?: string;
}

interface InforProfile {
  sub: string;
  preferred_username?: string;
  name?: string;
}

export async function fetchInforIntegrationConfig(
  externalIntegrationUser: string,
): Promise<InforIntegrationConfig | null> {
  try {
    const { data } = await internalApiClient.get<InforIntegrationConfig>(
      '/auth/integration-lookup',
      { params: { externalIntegrationUser } },
    );
    return data;
  } catch {
    return null;
  }
}

export async function readInforLoginContext(): Promise<InforLoginContext | null> {
  const store = await cookies();
  const raw = store.get(INFOR_LOOKUP_COOKIE)?.value;

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as InforLoginContext;
  } catch {
    return null;
  }
}

const baseCallbacks: NextAuthOptions['callbacks'] = {
  async jwt({ token, account }) {
    if (account?.access_token) {
      token.accessToken = account.access_token;
    }

    const loginContext = await readInforLoginContext();
    if (loginContext) {
      token.companyId = loginContext.companyId;
      token.role = loginContext.role;
      token.externalIntegrationUser = loginContext.externalIntegrationUser;
    }

    return token;
  },
  async session({ session, token }) {
    if (token.accessToken) session.accessToken = token.accessToken as string;
    if (token.companyId) session.companyId = token.companyId as string;
    if (token.role) session.role = token.role as string;
    if (token.externalIntegrationUser) {
      session.externalIntegrationUser = token.externalIntegrationUser as string;
    }
    return session;
  },
};

// Base config: enough for getServerSession() to decode an already-issued
// session/JWT elsewhere in the app, without needing the dynamic Infor provider.
export const baseAuthOptions: NextAuthOptions = {
  providers: [],
  callbacks: baseCallbacks,
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

// Built fresh per request: the Infor provider's OAuth endpoints/credentials
// depend on which company the user identified in /login/infor belongs to.
export async function buildDynamicAuthOptions(): Promise<NextAuthOptions> {
  const loginContext = await readInforLoginContext();
  const integration = loginContext
    ? await fetchInforIntegrationConfig(loginContext.externalIntegrationUser)
    : null;

  return {
    ...baseAuthOptions,
    debug: true,
    providers: [
      {
        id: 'infor',
        name: 'Infor OS',
        type: 'oauth',
        idToken: true,
        issuer: 'https://mingle-sso.inforcloudsuite.com:443',
        jwks_endpoint: 'https://mingle-sso.inforcloudsuite.com/ext/infor/oauthtoken/jwks',
        authorization: {
          url: `${integration?.baseUrl ?? ''}/as/authorization.oauth2`,
          params: {
            response_type: 'code',
          },
        },
        token: `${integration?.baseUrl ?? ''}/as/token.oauth2`,
        userinfo: {
          async request({ tokens }) {
            if (!tokens.id_token) {
              throw new Error('id_token não foi devolvido pelo Infor OS.');
            }
            return jwtDecode<InforProfile>(tokens.id_token);
          },
        },
        profile(profile: InforProfile, tokens) {
          if (!tokens.id_token) {
            throw new Error('id_token não foi devolvido pelo Infor OS.');
          }
          const decoded = jwtDecode<InforProfile>(tokens.id_token);
          return {
            id: decoded.sub,
            name: decoded.name ?? decoded.sub,
            email: decoded.preferred_username ?? null,
          };
        },
        clientId: integration?.clientId,
        clientSecret: integration?.clientSecret,
      },
    ],
    callbacks: {
      ...baseCallbacks,
      async signIn({ profile }) {
        if (!loginContext) {
          return false;
        }

        const inforProfile = profile as InforProfile | undefined;

        // Cross-check the Infor identity against the user looked up in
        // /login/infor before the OAuth redirect, so an attacker can't look up
        // a valid `externalIntegrationUser` and then authenticate as someone else.
        if (
          !inforProfile?.preferred_username ||
          inforProfile.preferred_username.toLowerCase() !== loginContext.email.toLowerCase()
        ) {
          return false;
        }

        return true;
      },
    },
  };
}
