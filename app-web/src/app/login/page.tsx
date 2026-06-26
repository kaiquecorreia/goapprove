'use client';

import Logo from '../../components/Logo';
import styles from './styles.module.scss';
import { useAuth } from '../../contexts/AuthContext';
import { Building2 } from 'lucide-react';
import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from './schema';
import { AxiosError } from 'axios';
import { feedback } from '@/services/feedback';

const INVALID_LOGIN_MESSAGE = 'Falha ao fazer login. Verifique suas credenciais.';

function LoginContent() {
  const { login, loginWithInfor } = useAuth();
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      let errorMessage = '';
      switch (errorParam) {
        case 'auth_failed':
          errorMessage = 'Falha na autenticação com Google. Tente novamente.';
          break;
        case 'callback_failed':
          errorMessage = 'Erro no processo de autenticação. Tente novamente.';
          break;
        case 'missing_tokens':
          errorMessage = 'Dados de autenticação incompletos. Tente novamente.';
          break;
        default:
          errorMessage = 'Erro desconhecido durante a autenticação.';
      }
      setError(errorMessage);
      feedback.error(errorMessage);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');

    try {
      await feedback.promise(login(data.identifier, data.password), {
        loading: 'Entrando...',
        success: 'Login realizado com sucesso!',
        error: INVALID_LOGIN_MESSAGE,
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMessage = err.response?.data?.message || INVALID_LOGIN_MESSAGE;
        setError(errorMessage);
      } else {
        setError(INVALID_LOGIN_MESSAGE);
      }
      console.log('[LOGIN PAGE] error: ', err);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>
        {error && <div className={styles.error}>{error}</div>}

        <button type="button" className={styles.inforButton} onClick={loginWithInfor}>
          <Building2 size={20} />
          Login com Infor
        </button>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label htmlFor="identifier">Usário</label>
            <input
              type="text"
              id="identifier"
              placeholder="Digite seu usuário"
              className={errors.identifier ? styles.inputError : ''}
              {...register('identifier')}
            />
            {errors.identifier && (
              <span className={styles.errorMessage}>{errors.identifier.message}</span>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              placeholder="Digite sua senha"
              className={errors.password ? styles.inputError : ''}
              {...register('password')}
            />
            {errors.password && (
              <span className={styles.errorMessage}>{errors.password.message}</span>
            )}
          </div>
          <button type="submit" className={styles.loginButton}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.loginContainer}>
          <div className={styles.loginBox}>
            <div className={styles.logoContainer}>
              <Logo />
            </div>
            <p>Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
