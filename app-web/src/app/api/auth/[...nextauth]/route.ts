import NextAuth, { NextAuthOptions } from 'next-auth';
import { jwtDecode } from 'jwt-decode';

interface InforProfile {
  sub: string;
  email?: string;
  name?: string;
  tenant?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: 'infor',
      name: 'Infor OS',
      type: 'oauth',
      idToken: true,
      issuer: 'https://mingle-sso.inforcloudsuite.com:443',
      jwks_endpoint: `https://mingle-sso.inforcloudsuite.com/ext/infor/oauthtoken/jwks`,
      authorization: {
        url: `${process.env.INFOR_ISSUER_URL}/as/authorization.oauth2`,
        params: {
          response_type: 'code',
        },
      },
      token: `${process.env.INFOR_ISSUER_URL}/as/token.oauth2`,
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
          email: decoded.email ?? null,
        };
      },
      clientId: process.env.INFOR_CLIENT_ID,
      clientSecret: process.env.INFOR_CLIENT_SECRET,
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account && account.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      console.log(session, token);
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
