'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';

// interface User {
//   id: string;
//   email: string;
//   name: string;
//   avatar?: string | null;
//   whatsapp?: string;
//   minimalProfileCompleted?: boolean;
// }

interface AuthContextType {
  // user: User | null;
  // loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithInfor: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // const [user, setUser] = useState<User | null>(null);
  // const [loading, setLoading] = useState(true);
  const router = useRouter();

  const login = async (identifier: string, password: string) => {
    const result = await signIn('credentials', {
      identifier,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      console.error('Login failed:', result?.error);
      throw new Error('Usuário ou senha inválidos');
    }

    router.push('/');
  };

  const loginWithInfor = async () => {
    await signIn('infor', { callbackUrl: '/' });
  };

  const logout = async () => {
    try {
      await signOut({ callbackUrl: '/login' });
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        // user,
        // loading,
        login,
        loginWithInfor,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
