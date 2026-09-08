import { AsyncLocalStorage } from 'async_hooks';

import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export type AuditActorType = 'USER' | 'INTEGRATION' | 'SYSTEM';

export interface AuditActor {
  type: AuditActorType;
  userId?: string;
  label: string;
  role?: UserRole;
  companyId?: string;
}

export interface AuditRequestContext {
  correlationId: string;
  ip: string | null;
  userAgent: string | null;
  httpMethod: string | null;
  httpPath: string | null;
  // Mutable on purpose. The middleware opens this scope before the guards run,
  // so request.user does not exist yet; AuditContextInterceptor promotes the
  // actor afterwards by mutating this same object. An interceptor cannot open
  // the scope itself -- als.run(store, () => next.handle()) returns an
  // Observable that is subscribed to outside the run(), losing the store.
  actor: AuditActor;
  before?: unknown;
}

// Module constant, mirroring ClsService: guarantees a single storage even if
// the provider is instantiated by more than one injector.
const auditContextLocalStorage = new AsyncLocalStorage<AuditRequestContext>();

@Injectable()
export class AuditContextService {
  public readonly storage = auditContextLocalStorage;

  run<T>(context: AuditRequestContext, fn: () => T): T {
    return auditContextLocalStorage.run(context, fn);
  }

  // Undefined outside a request (jobs, retries, seeds). Callers must cope.
  get(): AuditRequestContext | undefined {
    return auditContextLocalStorage.getStore();
  }

  setActor(actor: AuditActor): void {
    const store = auditContextLocalStorage.getStore();

    if (store) {
      store.actor = actor;
    }
  }

  // Lets a service record a "before" snapshot without threading a parameter
  // through the whole call chain.
  setBefore(snapshot: unknown): void {
    const store = auditContextLocalStorage.getStore();

    if (store) {
      store.before = snapshot;
    }
  }
}
