'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

import styles from './styles.module.scss';
import { integrationSchema, type IntegrationFormData } from './schema';
import { feedback } from '@/services/feedback';

const GENERIC_ERROR_MESSAGE = 'Não foi possível carregar a integração.';

export default function OnboardingPage() {
  const [error, setError] = useState('');
  const [hasSecret, setHasSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: { baseUrl: '', clientId: '', clientSecret: '' },
  });

  useEffect(() => {
    async function loadIntegration() {
      try {
        const { data } = await axios.get('/api/integration');
        reset({ baseUrl: data.baseUrl, clientId: data.clientId ?? '', clientSecret: '' });
        setHasSecret(data.hasSecret);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError(GENERIC_ERROR_MESSAGE);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadIntegration();
  }, [reset]);

  const onSubmit = async (data: IntegrationFormData) => {
    setError('');

    try {
      await feedback.promise(axios.patch('/api/integration', data), {
        loading: 'Salvando...',
        success: 'Integração atualizada com sucesso!',
        error: 'Falha ao atualizar a integração.',
      });
      setHasSecret(true);
      reset({ ...data, clientSecret: '' });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(GENERIC_ERROR_MESSAGE);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>Integração com a Infor</h1>
        <p className={styles.subtitle}>
          Configure as credenciais de autenticação OAuth da sua empresa com a Infor.
        </p>

        {error && <div className={styles.error}>{error}</div>}

        {!isLoading && (
          <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.inputGroup}>
              <label htmlFor="baseUrl">URL base</label>
              <input
                type="text"
                id="baseUrl"
                placeholder="https://mingle-sso.inforcloudsuite.com:443/SEU_TENANT"
                className={errors.baseUrl ? styles.inputError : ''}
                {...register('baseUrl')}
              />
              {errors.baseUrl && (
                <span className={styles.errorMessage}>{errors.baseUrl.message}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="clientId">Client ID</label>
              <input type="text" id="clientId" {...register('clientId')} />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="clientSecret">Client Secret</label>
              <input
                type="password"
                id="clientSecret"
                placeholder={hasSecret ? '••••••••' : ''}
                {...register('clientSecret')}
              />
              <span className={styles.hint}>
                {hasSecret
                  ? 'Deixe em branco para manter o secret atual.'
                  : 'Nenhum secret configurado ainda.'}
              </span>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
