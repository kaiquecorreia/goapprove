'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import axios from 'axios';

import Logo from '../../../components/Logo';
import { useAuth } from '../../../contexts/AuthContext';
import styles from '../styles.module.scss';
import { loginInforSchema, type LoginInforFormData } from './schema';

const GENERIC_ERROR_MESSAGE = 'Usuário não encontrado ou não autorizado.';

export default function LoginInforPage() {
  const { loginWithInfor } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInforFormData>({
    resolver: zodResolver(loginInforSchema),
    defaultValues: { externalIntegrationUser: '' },
  });

  const onSubmit = async (data: LoginInforFormData) => {
    setError('');
    setIsSubmitting(true);

    try {
      await axios.post('/api/auth/infor/lookup', data);
      await loginWithInfor();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(GENERIC_ERROR_MESSAGE);
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.inputGroup}>
            <label htmlFor="externalIntegrationUser">Usuário Infor</label>
            <input
              type="text"
              id="externalIntegrationUser"
              placeholder="Digite seu usuário cadastrado"
              className={errors.externalIntegrationUser ? styles.inputError : ''}
              {...register('externalIntegrationUser')}
            />
            {errors.externalIntegrationUser && (
              <span className={styles.errorMessage}>{errors.externalIntegrationUser.message}</span>
            )}
          </div>

          <button type="submit" className={styles.inforButton} disabled={isSubmitting}>
            <Building2 size={20} />
            {isSubmitting ? 'Verificando...' : 'Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
