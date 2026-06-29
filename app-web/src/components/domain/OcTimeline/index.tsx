import { formatDateTime } from '@/lib/format/date';
import type { TimelineEvent } from '@/lib/mock/types';
import { cx } from '@/lib/cx';
import styles from './styles.module.scss';

export function OcTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className={styles.timeline}>
      {events.map((event, index) => (
        <div key={`${event.at}-${index}`} className={styles.item}>
          <span className={cx(styles.dot, styles[event.type])} />
          <div className={styles.content}>
            <span className={styles.date}>{formatDateTime(event.at)}</span>
            <span className={styles.label}>{event.label}</span>
            {event.detail && <span className={styles.detail}>{event.detail}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
