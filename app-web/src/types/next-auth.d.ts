import 'next-auth';
import 'next-auth/jwt';
import { EUserRole } from '@/config/navigation';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    role?: EUserRole;
    companyId?: string;
    externalIntegrationUser?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    role?: EUserRole;
    companyId?: string;
    externalIntegrationUser?: string;
  }
}
