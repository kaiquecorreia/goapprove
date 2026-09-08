import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

import {
  AuditRepository,
  CreateAuditEventInput,
} from '../repositories/audit.repository';

/**
 * Batches audit writes so the trail costs the request nothing.
 *
 * Rows are append-only and independent, which makes them an ideal fit for
 * createMany: one statement and one grouped WAL flush per batch instead of a
 * round trip per event. Durability is preserved by a short flush window, a
 * shutdown flush, a log-based fallback when the insert fails, and writeNow()
 * for events that cannot tolerate any window at all.
 */
@Injectable()
export class AuditWriter implements OnApplicationShutdown {
  private readonly logger = new Logger(AuditWriter.name);

  private buffer: CreateAuditEventInput[] = [];
  private timer: NodeJS.Timeout | null = null;
  private flushing: Promise<void> | null = null;

  private static readonly FLUSH_INTERVAL_MS = 200;
  private static readonly FLUSH_SIZE = 100;
  private static readonly MAX_BUFFER = 5_000;

  constructor(private readonly repository: AuditRepository) {}

  enqueue(row: CreateAuditEventInput): void {
    // Better to lose the trail than to take the process down with it.
    if (this.buffer.length >= AuditWriter.MAX_BUFFER) {
      this.logger.error(
        `Audit buffer overflow (${AuditWriter.MAX_BUFFER}); dropping ${row.action}`,
      );
      return;
    }

    this.buffer.push(row);

    if (this.buffer.length >= AuditWriter.FLUSH_SIZE) {
      void this.flush();
      return;
    }

    if (!this.timer) {
      this.timer = setTimeout(() => {
        this.timer = null;
        void this.flush();
      }, AuditWriter.FLUSH_INTERVAL_MS);

      // Never hold the event loop open just for a pending flush.
      this.timer.unref();
    }
  }

  async flush(): Promise<void> {
    if (this.flushing) {
      return this.flushing;
    }

    if (this.buffer.length === 0) {
      return;
    }

    const batch = this.buffer;
    this.buffer = [];

    this.flushing = this.repository
      .createMany(batch)
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to persist ${batch.length} audit events`,
          error as Error,
        );
        this.logFallback(batch);
      })
      .finally(() => {
        this.flushing = null;
      });

    return this.flushing;
  }

  // For events that must be durable before the response is sent.
  async writeNow(row: CreateAuditEventInput): Promise<void> {
    try {
      await this.repository.createMany([row]);
    } catch (error) {
      this.logger.error(
        `Failed to persist critical audit event ${row.action}`,
        error as Error,
      );
      this.logFallback([row]);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    await this.flush();
  }

  // Last resort: recoverable from aggregated logs, so nothing vanishes quietly.
  private logFallback(batch: CreateAuditEventInput[]): void {
    for (const row of batch) {
      this.logger.warn(`AUDIT_FALLBACK ${JSON.stringify(row)}`);
    }
  }
}
