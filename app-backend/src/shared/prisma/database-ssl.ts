export function isDatabaseSslEnabled(): boolean {
  return (process.env.DATABASE_SSL ?? '').trim().toLowerCase() === 'true';
}
