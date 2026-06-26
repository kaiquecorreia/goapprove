'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import axios from 'axios';

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

  const login = async () => {
    try {
      // TODO: Implement login

      router.push('/');
    } catch (error: unknown) {
      // TODO: Handle error
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const status = error.response.status;
          if (status === 401 || status === 403) {
            console.error('Login failed: Invalid credentials');
            throw new Error('WhatsApp/e-mail ou senha inválidos');
          } else if (status === 429) {
            console.error('Login failed: Too many attempts');
            throw new Error('Muitas tentativas de login. Por favor, tente novamente mais tarde.');
          } else {
            console.error(`Login failed with status ${status}:`, error.response.data);
            throw new Error('Login falhou. Por favor, tente novamente.');
          }
        } else {
          console.error('Login failed: Network issue or server not responding');
          throw new Error('Erro de rede. Por favor, verifique sua conexão e tente novamente.');
        }
      }
      if (error instanceof Error) {
        throw error;
      }
      console.error('Login failed:', error);
      throw new Error('Ocorreu um erro inesperado. Por favor, tente novamente.');
    }
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
