'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './not-found.module.scss';
import errorStyles from './error.module.scss';
import Logo from '../components/Logo';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoContainer}>
          <Logo />
        </div>
        <h1 className={styles.title}>Algo deu errado</h1>
        <p className={styles.description}>
          Não foi possível carregar esta página. Tente novamente ou faça login de novo.
        </p>
        <div className={errorStyles.actions}>
          <button type="button" onClick={() => reset()} className={styles.button}>
            Tentar novamente
          </button>
          <Link href="/login" className={styles.button}>
            Fazer login novamente
          </Link>
        </div>
      </div>
    </div>
  );
}
