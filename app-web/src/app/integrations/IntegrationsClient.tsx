'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

import styles from './styles.module.scss';
import { integrationSchema, type IntegrationFormData } from './schema';
import { feedback } from '@/services/feedback';
import { RefreshButton } from '@/components/ui/RefreshButton';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { Select } from '@/components/ui/Select';

const GENERIC_ERROR_MESSAGE = 'Não foi possível carregar a integração.';

const EMPTY_FORM: IntegrationFormData = {
  baseUrl: '',
  clientId: '',
  clientSecret: '',
  ionApiUrl: '',
  serviceClientId: '',
  serviceClientSecret: '',
  serviceAccountKey: '',
  serviceAccountSecret: '',
};

export interface IntegrationCompanyOption {
  companyId: string;
  name: string;
  externalIntegrationCode: string;
}

interface IntegrationsClientProps {
  companies: IntegrationCompanyOption[];
  defaultCompanyId: string;
}

export function IntegrationsClient({ companies, defaultCompanyId }: IntegrationsClientProps) {
  const [companyId, setCompanyId] = useState(defaultCompanyId);
  const [isConfigured, setIsConfigured] = useState(true);
  const [error, setError] = useState('');
  // Only read by the commented-out SSO login fields below; kept so they can be
  // restored without rewiring state.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasSecret, setHasSecret] = useState(false);
  const [hasServiceClientSecret, setHasServiceClientSecret] = useState(false);
  const [hasServiceAccountSecret, setHasServiceAccountSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationSchema),
    defaultValues: EMPTY_FORM,
  });

  // Switching companies quickly can resolve requests out of order; only the
  // latest one may fill the form.
  const latestRequest = useRef(0);

  const loadIntegration = useCallback(async () => {
    if (!companyId) {
      setHasLoadedOnce(true);
      setIsLoading(false);
      return;
    }

    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setError('');

    try {
      const { data } = await axios.get('/api/integration', { params: { companyId } });
      if (requestId !== latestRequest.current) return;
      setIsConfigured(true);
      reset({
        baseUrl: data.baseUrl,
        clientId: data.clientId ?? '',
        clientSecret: '',
        ionApiUrl: data.ionApiUrl ?? '',
        serviceClientId: data.serviceClientId ?? '',
        serviceClientSecret: '',
        serviceAccountKey: data.serviceAccountKey ?? '',
        serviceAccountSecret: '',
      });
      setHasSecret(data.hasSecret);
      setHasServiceClientSecret(data.hasServiceClientSecret);
      setHasServiceAccountSecret(data.hasServiceAccountSecret);
    } catch (err) {
      if (requestId !== latestRequest.current) return;

      reset(EMPTY_FORM);
      setHasSecret(false);
      setHasServiceClientSecret(false);
      setHasServiceAccountSecret(false);

      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setIsConfigured(false);
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(GENERIC_ERROR_MESSAGE);
      }
    } finally {
      if (requestId === latestRequest.current) {
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    }
  }, [companyId, reset]);

  useEffect(() => {
    loadIntegration();
  }, [loadIntegration]);

  const onSubmit = async (data: IntegrationFormData) => {
    setError('');

    try {
      const { data: updated } = await feedback
        .promise(axios.patch('/api/integration', { ...data, companyId }), {
          loading: 'Salvando...',
          success: 'Integração atualizada com sucesso!',
          error: 'Falha ao atualizar a integração.',
        })
        .unwrap();
      setIsConfigured(true);
      setHasSecret(updated.hasSecret);
      setHasServiceClientSecret(updated.hasServiceClientSecret);
      setHasServiceAccountSecret(updated.hasServiceAccountSecret);
      reset({ ...data, clientSecret: '', serviceClientSecret: '', serviceAccountSecret: '' });
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
        <div className={styles.titleRow}>
          <h1 className={styles.title}>Integrações</h1>
          <RefreshButton onRefresh={loadIntegration} isLoading={isLoading} />
        </div>
        <p className={styles.subtitle}>
          Configure as credenciais de autenticação OAuth de cada empresa com a Infor.
        </p>

        <div className={styles.inputGroup}>
          <label htmlFor="companyId">Empresa</label>
          <Select
            id="companyId"
            value={companyId}
            placeholder="Selecione uma empresa"
            disabled={isSubmitting}
            onChange={(event) => setCompanyId(event.target.value)}
            options={companies.map((company) => ({
              value: company.companyId,
              label: `${company.name} (${company.externalIntegrationCode})`,
            }))}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {!companyId ? (
          <p className={styles.stateMessage}>Nenhuma empresa cadastrada.</p>
        ) : !hasLoadedOnce ? (
          <p className={styles.stateMessage}>Carregando…</p>
        ) : (
          <LoadingOverlay isLoading={isLoading}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
              {!isConfigured && (
                <p className={styles.notice}>
                  Esta empresa ainda não tem integração. Preencha os dados e salve para criá-la.
                </p>
              )}

              {/*
                Login via Infor (SSO) — client "Web Application" do ION API, usado pelo
                NextAuth (lib/auth.ts). Oculto por enquanto: o portal só configura o envio
                de aprovações ao LN. Os valores salvos continuam intactos.

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
              */}

              <h2 className={styles.sectionTitle}>Envio de aprovações ao LN</h2>
              <p className={styles.subtitle}>
                Credenciais do client &quot;Backend Service&quot; do ION API (arquivo .ionapi),
                usadas pelo portal para comunicar ao LN as decisões das OCs.
              </p>

              <div className={styles.inputGroup}>
                <label htmlFor="baseUrl">URL do SSO</label>
                <input
                  type="text"
                  id="baseUrl"
                  placeholder="https://mingle-sso.inforcloudsuite.com:443/SEU_TENANT"
                  className={errors.baseUrl ? styles.inputError : ''}
                  {...register('baseUrl')}
                />
                <span className={styles.hint}>
                  Campos &quot;pu&quot; + &quot;ti&quot; do .ionapi. O token é obtido em
                  /as/token.oauth2 a partir desta URL.
                </span>
                {errors.baseUrl && (
                  <span className={styles.errorMessage}>{errors.baseUrl.message}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="ionApiUrl">URL do ION API</label>
                <input
                  type="text"
                  id="ionApiUrl"
                  placeholder="https://mingle-ionapi.inforcloudsuite.com/SEU_TENANT"
                  {...register('ionApiUrl')}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="serviceClientId">Client ID (ci)</label>
                <input type="text" id="serviceClientId" {...register('serviceClientId')} />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="serviceClientSecret">Client Secret (cs)</label>
                <input
                  type="password"
                  id="serviceClientSecret"
                  placeholder={hasServiceClientSecret ? '••••••••' : ''}
                  {...register('serviceClientSecret')}
                />
                <span className={styles.hint}>
                  {hasServiceClientSecret
                    ? 'Deixe em branco para manter o secret atual.'
                    : 'Nenhum secret configurado ainda.'}
                </span>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="serviceAccountKey">Service Account Access Key (saak)</label>
                <input type="text" id="serviceAccountKey" {...register('serviceAccountKey')} />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="serviceAccountSecret">Service Account Secret Key (sask)</label>
                <input
                  type="password"
                  id="serviceAccountSecret"
                  placeholder={hasServiceAccountSecret ? '••••••••' : ''}
                  {...register('serviceAccountSecret')}
                />
                <span className={styles.hint}>
                  {hasServiceAccountSecret
                    ? 'Deixe em branco para manter o secret atual.'
                    : 'Nenhum secret configurado ainda.'}
                </span>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </LoadingOverlay>
        )}
      </div>
    </div>
  );
}
