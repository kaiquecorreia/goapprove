'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { formatDateTime } from '@/lib/format/date';
import { cx } from '@/lib/cx';
import { getAuditEvents } from '@/services/auditClient';
import { feedback } from '@/services/feedback';
import type { AuditEvent, AuditSeverity } from '@/lib/mock/types';
import styles from './styles.module.scss';

interface AuditDetailSheetProps {
  event: AuditEvent | null;
  onOpenChange: (open: boolean) => void;
  /** Opens another event in this same sheet (e.g. one from the same request). */
  onSelectEvent?: (event: AuditEvent) => void;
}

const EMPTY = '—';

const SEVERITY: Record<AuditSeverity, { label: string; variant: BadgeVariant }> = {
  info: { label: 'Informação', variant: 'info' },
  success: { label: 'Sucesso', variant: 'success' },
  warning: { label: 'Atenção', variant: 'warning' },
  error: { label: 'Erro', variant: 'destructive' },
};

const ACTOR_TYPE_LABEL: Record<string, string> = {
  USER: 'Usuário',
  INTEGRATION: 'Integração (ERP)',
  SYSTEM: 'Sistema',
};

const LN_STAGE_LABEL: Record<string, string> = {
  CONFIG: 'Configuração da integração (nenhuma chamada foi feita)',
  TOKEN: 'Autenticação no Infor SSO (obtenção do token)',
  APPROVAL_RESPONSE: 'Envio do resultado ao LN (ApprovalResponse)',
};

// Shape written by the backend's LnSyncService into metadata.ln.
interface LnDetails {
  stage?: string;
  method?: string;
  url?: string;
  httpStatus?: number | null;
  responseBody?: unknown;
  durationMs?: number;
  errorCode?: string;
  payload?: unknown;
  integrationFound?: boolean;
  integrationActive?: boolean;
  missingFields?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toJson(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cx(styles.field, wide && styles.wide)}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{children}</span>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <pre className={styles.pre}>{toJson(value)}</pre>
    </div>
  );
}

function useRelatedEvents(event: AuditEvent | null) {
  const [related, setRelated] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const correlationId =
    event && event.correlationId && event.correlationId !== EMPTY ? event.correlationId : null;

  useEffect(() => {
    if (!correlationId) {
      setRelated([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getAuditEvents({ page: 1, limit: 50, correlationId })
      .then((page) => {
        if (!cancelled) setRelated(page.items);
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [correlationId]);

  return { related: related.filter((item) => item.id !== event?.id), loading, correlationId };
}

export function AuditDetailSheet({ event, onOpenChange, onSelectEvent }: AuditDetailSheetProps) {
  const { related, loading: relatedLoading, correlationId } = useRelatedEvents(event);

  const copyEvent = async () => {
    if (!event) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(event, null, 2));
      feedback.success('Evento copiado para a área de transferência.');
    } catch {
      feedback.error('Não foi possível copiar o evento.');
    }
  };

  const severity = event ? (SEVERITY[event.severity] ?? SEVERITY.info) : SEVERITY.info;
  const ln: LnDetails | null = isRecord(event?.metadata?.ln)
    ? (event.metadata.ln as LnDetails)
    : null;
  const otherMetadata = event?.metadata
    ? Object.fromEntries(Object.entries(event.metadata).filter(([key]) => key !== 'ln'))
    : {};
  const isPurchaseOrder = event?.entity === 'PurchaseOrder' && event.entityId !== EMPTY;

  return (
    <Sheet open={event !== null} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        {event && (
          <>
            <SheetHeader>
              <SheetTitle>{event.action}</SheetTitle>
              <SheetDescription>
                {formatDateTime(event.at)} · {event.entity}
              </SheetDescription>
            </SheetHeader>

            <div className={styles.toolbar}>
              <Badge variant={severity.variant}>{severity.label}</Badge>
              <div className={styles.toolbarActions}>
                {isPurchaseOrder && (
                  <Link href={`/ocs/${event.entityId}`} className={styles.linkButton}>
                    <ExternalLink size={14} /> Abrir OC
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Copy size={14} />}
                  onClick={copyEvent}
                >
                  Copiar JSON
                </Button>
              </div>
            </div>

            {event.message && (
              <div className={cx(styles.message, styles[`message_${event.severity}`])}>
                <span className={styles.label}>Mensagem</span>
                <p>{event.message}</p>
              </div>
            )}

            {otherMetadata.decisionRolledBack === true && (
              <div className={cx(styles.message, styles.message_warning)}>
                A decisão do aprovador foi <strong>desfeita</strong>: a OC continua pendente e nada
                foi gravado além deste registro.
              </div>
            )}

            <Separator className={styles.separator} />

            <h3 className={styles.sectionTitle}>Contexto</h3>
            <div className={styles.grid}>
              <Field label="Data/Hora">{formatDateTime(event.at)}</Field>
              <Field label="Ação">{event.action}</Field>
              <Field label="Entidade">{event.entity}</Field>
              <Field label="ID da entidade">{event.entityId}</Field>
              <Field label="Empresa">
                {event.companyName ?? EMPTY}
                {event.companyId && <span className={styles.muted}> · {event.companyId}</span>}
              </Field>
              <Field label="Executado por">
                {event.user}
                <span className={styles.muted}>
                  {' '}
                  · {ACTOR_TYPE_LABEL[event.actorType] ?? event.actorType}
                </span>
              </Field>
              <Field label="Requisição de origem" wide>
                {event.httpMethod || event.httpPath
                  ? `${event.httpMethod ?? ''} ${event.httpPath ?? ''}`.trim()
                  : 'Processo interno (sem requisição HTTP)'}
              </Field>
              <Field label="IP">{event.ip}</Field>
              <Field label="Correlation ID">{event.correlationId}</Field>
              <Field label="User agent" wide>
                {event.userAgent}
              </Field>
              <Field label="ID do evento" wide>
                {event.id}
              </Field>
            </div>

            {ln && (
              <>
                <Separator className={styles.separator} />
                <h3 className={styles.sectionTitle}>Chamada ao LN</h3>
                <div className={styles.grid}>
                  <Field label="Etapa" wide>
                    {LN_STAGE_LABEL[ln.stage ?? ''] ?? ln.stage ?? EMPTY}
                  </Field>
                  {ln.stage === 'CONFIG' ? (
                    <>
                      <Field label="Integração encontrada">
                        {ln.integrationFound ? 'Sim' : 'Não'}
                      </Field>
                      <Field label="Integração ativa">{ln.integrationActive ? 'Sim' : 'Não'}</Field>
                      <Field label="Campos não configurados" wide>
                        {ln.missingFields?.length ? ln.missingFields.join(', ') : EMPTY}
                      </Field>
                    </>
                  ) : (
                    <>
                      <Field label="Status HTTP">{ln.httpStatus ?? 'Sem resposta'}</Field>
                      <Field label="Duração">
                        {ln.durationMs !== undefined ? `${ln.durationMs} ms` : EMPTY}
                      </Field>
                      <Field label="Endpoint" wide>
                        {ln.method} {ln.url}
                      </Field>
                      {ln.errorCode && (
                        <Field label="Erro de rede" wide>
                          {ln.errorCode}
                        </Field>
                      )}
                    </>
                  )}
                </div>
                {ln.stage !== 'CONFIG' && ln.responseBody !== undefined && (
                  <JsonBlock label="Resposta recebida" value={ln.responseBody ?? 'Sem corpo'} />
                )}
                {ln.payload !== undefined && (
                  <JsonBlock label="Payload enviado ao LN" value={ln.payload} />
                )}
              </>
            )}

            {Object.keys(otherMetadata).length > 0 && (
              <>
                <Separator className={styles.separator} />
                <JsonBlock label="Detalhes adicionais" value={otherMetadata} />
              </>
            )}

            {(event.before || event.after) && (
              <>
                <Separator className={styles.separator} />
                <div className={styles.snapshots}>
                  <JsonBlock label="Antes" value={event.before ?? {}} />
                  <JsonBlock label="Depois" value={event.after ?? {}} />
                </div>
              </>
            )}

            {correlationId && (
              <>
                <Separator className={styles.separator} />
                <h3 className={styles.sectionTitle}>Outros eventos da mesma requisição</h3>
                {relatedLoading ? (
                  <p className={styles.muted}>Carregando…</p>
                ) : related.length === 0 ? (
                  <p className={styles.muted}>Nenhum outro evento com este correlation ID.</p>
                ) : (
                  <ul className={styles.related}>
                    {related.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className={styles.relatedItem}
                          onClick={() => onSelectEvent?.(item)}
                          disabled={!onSelectEvent}
                        >
                          <span className={styles.relatedHeader}>
                            <Badge variant={(SEVERITY[item.severity] ?? SEVERITY.info).variant}>
                              {item.action}
                            </Badge>
                            <span className={styles.muted}>{formatDateTime(item.at)}</span>
                          </span>
                          {item.message && (
                            <span className={styles.relatedMessage}>{item.message}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
