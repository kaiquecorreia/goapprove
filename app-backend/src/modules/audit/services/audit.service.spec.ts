import { TransactionService } from '../../../shared/prisma/transaction.service';
import { AuditContextService } from '../context/audit-context.service';
import { CreateAuditEventInput } from '../repositories/audit.repository';
import { AuditService } from './audit.service';
import { AuditWriter } from './audit-writer.service';

describe('AuditService', () => {
  let auditContext: AuditContextService;
  let transactionService: { onCommit: jest.Mock };
  let writer: { enqueue: jest.Mock; writeNow: jest.Mock };
  let service: AuditService;

  beforeEach(() => {
    auditContext = new AuditContextService();
    // Default: no transaction, so callbacks run immediately.
    transactionService = { onCommit: jest.fn((cb: () => void) => cb()) };
    writer = { enqueue: jest.fn(), writeNow: jest.fn() };

    service = new AuditService(
      auditContext,
      transactionService as unknown as TransactionService,
      writer as unknown as AuditWriter,
    );
  });

  function enqueued(): CreateAuditEventInput {
    const [[row]] = writer.enqueue.mock.calls as CreateAuditEventInput[][];

    return row;
  }

  it('fills actor, ip, user agent and correlation id from the request context', () => {
    auditContext.run(
      {
        correlationId: 'c0000000-0000-4000-8000-000000000000',
        ip: '187.45.12.9',
        userAgent: 'Mozilla/5.0',
        httpMethod: 'PATCH',
        httpPath: '/rules/abc',
        actor: {
          type: 'USER',
          userId: 'user-1',
          label: 'Ana Souza',
          companyId: 'company-1',
        },
      },
      () => service.log({ action: 'rule.update', entity: 'Rule' }),
    );

    expect(enqueued()).toMatchObject({
      action: 'rule.update',
      entity: 'Rule',
      actorUserId: 'user-1',
      actorLabel: 'Ana Souza',
      actorType: 'USER',
      // Falls back to the acting user's company.
      companyId: 'company-1',
      ip: '187.45.12.9',
      userAgent: 'Mozilla/5.0',
      correlationId: 'c0000000-0000-4000-8000-000000000000',
      httpMethod: 'PATCH',
      httpPath: '/rules/abc',
      severity: 'info',
    });
  });

  it('falls back to a system actor outside a request', () => {
    service.log({ action: 'workflow.rule_applied', entity: 'PurchaseOrder' });

    expect(enqueued()).toMatchObject({
      actorType: 'SYSTEM',
      actorLabel: 'system',
      actorUserId: null,
      correlationId: null,
    });
  });

  it('picks up a before snapshot stashed by a service', () => {
    auditContext.run(
      {
        correlationId: 'c0000000-0000-4000-8000-000000000000',
        ip: null,
        userAgent: null,
        httpMethod: null,
        httpPath: null,
        actor: { type: 'SYSTEM', label: 'system' },
      },
      () => {
        auditContext.setBefore({ name: 'Old name' });
        service.log({ action: 'rule.update', entity: 'Rule' });
      },
    );

    expect(enqueued().before).toEqual({ name: 'Old name' });
  });

  it('redacts credentials before they reach the writer', () => {
    service.log({
      action: 'user.update',
      entity: 'User',
      after: { email: 'a@b.com', password: 'hunter2' },
    });

    expect(enqueued().after).toEqual({
      email: 'a@b.com',
      password: '[REDACTED]',
    });
  });

  it('defers the write until the surrounding transaction commits', () => {
    const queued: Array<() => void> = [];
    transactionService.onCommit.mockImplementation((cb: () => void) =>
      queued.push(cb),
    );

    service.log({ action: 'rule.update', entity: 'Rule' });

    expect(writer.enqueue).not.toHaveBeenCalled();

    queued.forEach((cb) => cb());
    expect(writer.enqueue).toHaveBeenCalledTimes(1);
  });

  it('writes critical events immediately rather than buffering', () => {
    service.log({
      action: 'workflow.decision_recorded',
      entity: 'PurchaseOrder',
      critical: true,
    });

    expect(writer.writeNow).toHaveBeenCalledTimes(1);
    expect(writer.enqueue).not.toHaveBeenCalled();
  });

  it('never throws, so it cannot mask an error in a catch block', () => {
    writer.enqueue.mockImplementation(() => {
      throw new Error('database is down');
    });

    expect(() =>
      service.log({
        action: 'workflow.ln_sync_failed',
        entity: 'PurchaseOrder',
      }),
    ).not.toThrow();
  });

  it('lets an explicit actor override the request context', () => {
    service.log({
      action: 'workflow.decision_recorded',
      entity: 'PurchaseOrder',
      actor: { type: 'USER', userId: 'substitute-1', label: 'Substitute' },
    });

    expect(enqueued()).toMatchObject({
      actorUserId: 'substitute-1',
      actorLabel: 'Substitute',
    });
  });
});
