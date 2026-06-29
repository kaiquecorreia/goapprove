import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/Sheet';
import { Separator } from '@/components/ui/Separator';
import { formatDateTime } from '@/lib/format/date';
import type { AuditEvent } from '@/lib/mock/types';
import styles from './styles.module.scss';

interface AuditDetailSheetProps {
  event: AuditEvent | null;
  onOpenChange: (open: boolean) => void;
}

export function AuditDetailSheet({ event, onOpenChange }: AuditDetailSheetProps) {
  return (
    <Sheet open={event !== null} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        {event && (
          <>
            <SheetHeader>
              <SheetTitle>Detalhe do evento</SheetTitle>
              <SheetDescription>{event.correlationId}</SheetDescription>
            </SheetHeader>

            <div className={styles.fields}>
              <div className={styles.field}>
                <span className={styles.label}>Data/Hora</span>
                <span>{formatDateTime(event.at)}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Usuário</span>
                <span>{event.user}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Ação</span>
                <span>{event.action}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>Entidade</span>
                <span>
                  {event.entity} · {event.entityId}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>IP</span>
                <span>{event.ip}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.label}>User agent</span>
                <span>{event.userAgent}</span>
              </div>
            </div>

            {(event.before || event.after) && (
              <>
                <Separator className={styles.separator} />
                <div className={styles.snapshots}>
                  <div>
                    <span className={styles.label}>Antes</span>
                    <pre className={styles.pre}>{JSON.stringify(event.before ?? {}, null, 2)}</pre>
                  </div>
                  <div>
                    <span className={styles.label}>Depois</span>
                    <pre className={styles.pre}>{JSON.stringify(event.after ?? {}, null, 2)}</pre>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
