import { Request } from 'express';

import { AuditLogInput } from '../services/audit.service';
import { AuditOptions } from '../decorators/audit.decorator';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function readPath(path: string, request: Request, result: unknown): unknown {
  const [root, ...rest] = path.split('.');
  const base =
    root === 'result' ? result : (request as unknown as UnknownRecord)[root];

  return rest.reduce<unknown>(
    (acc, key) => (isRecord(acc) ? acc[key] : undefined),
    base,
  );
}

function toId(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return typeof value === 'number' ? String(value) : null;
}

// "PurchaseOrder" -> "purchaseOrderId"
function conventionalKey(entity: string): string {
  return `${entity.charAt(0).toLowerCase()}${entity.slice(1)}Id`;
}

function pick(source: unknown, key: string): unknown {
  return isRecord(source) ? source[key] : undefined;
}

function resolveEntityId(
  options: AuditOptions,
  request: Request,
  result: unknown,
): string | null {
  if (options.entityIdFrom) {
    return toId(readPath(options.entityIdFrom, request, result));
  }

  const key = conventionalKey(options.entity);

  return toId(
    pick(result, key) ??
      pick(request.params, key) ??
      pick(request.params, 'id') ??
      pick(request.body, key),
  );
}

function resolveCompanyId(
  options: AuditOptions,
  request: Request,
  result: unknown,
): string | null {
  if (options.companyIdFrom) {
    return toId(readPath(options.companyIdFrom, request, result));
  }

  // Falls through to the actor's company inside AuditService when null.
  return toId(
    pick(result, 'companyId') ??
      pick(request.params, 'companyId') ??
      pick(request.body, 'companyId'),
  );
}

export function buildAuditEntry(
  options: AuditOptions,
  request: Request,
  result: unknown,
  error?: unknown,
): AuditLogInput {
  const failed = error !== undefined;

  const metadata: Record<string, unknown> = {};

  if (options.captureBody && request.body) {
    metadata.request = request.body;
  }

  if (failed) {
    metadata.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return {
    action: options.action,
    entity: options.entity,
    entityId: resolveEntityId(options, request, result),
    companyId: resolveCompanyId(options, request, result),
    severity: failed ? 'error' : (options.severity ?? 'info'),
    message: options.message ?? null,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    // "before" comes from the ALS when a service recorded one.
    after:
      failed || options.captureAfter === false
        ? undefined
        : (result ?? undefined),
    critical: options.critical,
  };
}
