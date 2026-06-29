import { mockAuditEvents } from '@/lib/mock';
import type { AuditEvent } from '@/lib/mock/types';

export function getAuditEvents(): AuditEvent[] {
  return mockAuditEvents;
}
