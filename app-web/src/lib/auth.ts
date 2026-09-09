import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { jwtDecode } from 'jwt-decode';
import { cookies } from 'next/headers';

import { internalApiClient } from '@/services/api';
import { EUserRole } from '@/config/navigation';

export const INFOR_LOOKUP_COOKIE = 'infor_login_ctx';

// The Infor OAuth flow is kept in the codebase for a future re-launch, but
// disabled by default — gate every entry point behind this flag.
export function isInforLoginEnabled(): boolean {
  return process.env.ENABLE_INFOR_LOGIN === 'true';
}

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

interface BackendLoginResponse {
  accessToken: string;
  userId: string;
  name: string;
  role: EUserRole;
  email: string;
  companyId?: string;
}

// req.headers here are the browser's own headers on the NextAuth callback
// request — the one point in the login flow that isn't proxied through
// withAuthenticatedRoute, so the real IP/User-Agent are extracted by hand.
function readHeader(
  headers: Record<string, unknown> | undefined,
  name: string,
): string | undefined {
  const value = headers?.[name];
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

const credentialsProvider = CredentialsProvider({
  id: 'credentials',
  name: 'Credentials',
  credentials: {
    identifier: { label: 'Usuário', type: 'text' },
    password: { label: 'Senha', type: 'password' },
  },
  async authorize(credentials, req) {
    if (!credentials?.identifier || !credentials?.password) {
      return null;
    }

    const forwardedFor = readHeader(req?.headers, 'x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim() ?? readHeader(req?.headers, 'x-real-ip');
    const userAgent = readHeader(req?.headers, 'user-agent');

    try {
      const { data } = await internalApiClient.post<BackendLoginResponse>(
        '/auth/login',
        {
          email: credentials.identifier,
          password: credentials.password,
        },
        {
          headers: {
            ...(ip && { 'x-forwarded-for': ip }),
            ...(userAgent && { 'user-agent': userAgent }),
          },
        },
      );

      return {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        companyId: data.companyId,
        accessToken: data.accessToken,
      };
    } catch {
      return null;
    }
  },
});

const baseCallbacks: NextAuthOptions['callbacks'] = {
  async jwt({ token, account, user }) {
    if (account?.access_token) {
      token.accessToken = account.access_token;
    }

    // First sign-in via the Credentials provider: the backend already handed
    // us a ready-to-use JWT, no need to read the Infor lookup cookie at all.
    if (user?.accessToken) {
      token.accessToken = user.accessToken;
      token.name = user.name;
      token.role = user.role;
      token.companyId = user.companyId;
      return token;
    }

    const loginContext = await readInforLoginContext();
    if (loginContext) {
      token.companyId = loginContext.companyId;
      token.role = loginContext.role as EUserRole;
      token.externalIntegrationUser = loginContext.externalIntegrationUser;
    }

    return token;
  },
  async session({ session, token }) {
    if (token.name && session.user) session.user.name = token.name;
    if (token.accessToken) session.accessToken = token.accessToken as string;
    if (token.companyId) session.companyId = token.companyId as string;
    if (token.role) session.role = token.role as EUserRole;
    if (token.externalIntegrationUser) {
      session.externalIntegrationUser = token.externalIntegrationUser as string;
    }
    return session;
  },
};

// Base config: enough for getServerSession() to decode an already-issued
// session/JWT elsewhere in the app, without needing the dynamic Infor provider.
export const baseAuthOptions: NextAuthOptions = {
  providers: [credentialsProvider],
  callbacks: baseCallbacks,
  pages: { signIn: '/login' },
  // Backend JWTs expire in 12h (AppJwtModule) and are only minted once, at
  // sign-in — bound the NextAuth session to the same window so the middleware
  // bounces to /login on its own instead of pages crashing on a 401 from a
  // session that's technically still "valid" but carries a dead backend token.
  session: { maxAge: 60 * 60 * 12 },
  secret: process.env.NEXTAUTH_SECRET,
};

// Built fresh per request: the Infor provider's OAuth endpoints/credentials
// depend on which company the user identified in /login/infor belongs to.
export async function buildDynamicAuthOptions(): Promise<NextAuthOptions> {
  // Infor login is disabled by default (kept for a future re-launch) — never
  // register the dynamic OAuth provider while the flag is off, even if a
  // stale lookup cookie is still present.
  if (!isInforLoginEnabled()) {
    return baseAuthOptions;
  }

  const loginContext = await readInforLoginContext();
  const integration = loginContext
    ? await fetchInforIntegrationConfig(loginContext.externalIntegrationUser)
    : null;

  // No login context yet (e.g. a plain session check before /login/infor was
  // visited) — there's no baseUrl to build OAuth endpoint URLs from, so fall
  // back to the providerless config instead of registering an Infor provider
  // with invalid (non-absolute) authorization/token URLs.
  if (!integration) {
    return baseAuthOptions;
  }

  return {
    ...baseAuthOptions,
    debug: true,
    providers: [
      ...baseAuthOptions.providers,
      {
        id: 'infor',
        name: 'Infor OS',
        type: 'oauth',
        idToken: true,
        issuer: 'https://mingle-sso.inforcloudsuite.com:443',
        jwks_endpoint: 'https://mingle-sso.inforcloudsuite.com/ext/infor/oauthtoken/jwks',
        authorization: {
          url: `${integration.baseUrl}/as/authorization.oauth2`,
          params: {
            response_type: 'code',
          },
        },
        token: `${integration.baseUrl}/as/token.oauth2`,
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
        clientId: integration.clientId,
        clientSecret: integration.clientSecret,
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
