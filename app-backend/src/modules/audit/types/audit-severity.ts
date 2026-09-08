// Kept lowercase and as a plain union rather than a Prisma enum: the web
// timeline casts this value straight into TimelineEvent['type'].
export type AuditSeverity = 'info' | 'success' | 'warning' | 'error';

export const AUDIT_SEVERITIES: AuditSeverity[] = [
  'info',
  'success',
  'warning',
  'error',
];
