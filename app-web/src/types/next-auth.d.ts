import 'next-auth';
import 'next-auth/jwt';
import { EUserRole } from '@/config/navigation';

type AuthMethod = 'credentials' | 'infor';

declare module 'next-auth' {
  interface Session {
    // 'credentials' sessions carry our own backend JWT in accessToken; 'infor'
    // sessions carry the Infor OAuth token there instead.
    authMethod?: AuthMethod;
    accessToken?: string;
    role?: EUserRole;
    companyId?: string;
    externalIntegrationUser?: string;
  }

  interface User {
    role?: EUserRole;
    companyId?: string;
    externalIntegrationUser?: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    authMethod?: AuthMethod;
    accessToken?: string;
    role?: EUserRole;
    companyId?: string;
    externalIntegrationUser?: string;
  }
}
