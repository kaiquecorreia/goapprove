'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Power, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { formatDate } from '@/lib/format/date';
import { CONFLICT_STRATEGIES, RULE_FIELDS_BY_SOURCE, RULE_OPERATORS } from '@/lib/mock/rules';
import type { RuleCriterion } from '@/lib/mock/types';
import { feedback } from '@/services/feedback';
import { deactivateRule, setRuleStatus } from '@/services/rulesClient';
import { RuleBuilderSheet } from '@/components/domain/RuleBuilderSheet';
import type { Company, Rule, User } from '@/lib/mock/types';

const operatorLabel = (operator: string) =>
  RULE_OPERATORS.find((option) => option.value === operator)?.label ?? operator;

const fieldLabel = (criterion: RuleCriterion) => {
  const fieldOptions =
    criterion.sourceType === 'PO_HEADER' || criterion.sourceType === 'PO_LINE'
      ? RULE_FIELDS_BY_SOURCE[criterion.sourceType]
      : null;

  return fieldOptions?.find((option) => option.value === criterion.field)?.label ?? criterion.field;
};

const conflictStrategyLabel = (strategy: string) =>
  CONFLICT_STRATEGIES.find((option) => option.value === strategy)?.label ?? strategy;

export function RulesTable({
  rules,
  companies,
  users,
}: {
  rules: Rule[];
  companies: Company[];
  users: User[];
}) {
  const router = useRouter();
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!ruleToDelete) return;

    setSubmitting(true);
    try {
      await deactivateRule(ruleToDelete.id);
      feedback.success(`Regra "${ruleToDelete.name}" desativada com sucesso!`);
      setRuleToDelete(null);
      router.refresh();
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Falha ao desativar regra.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (rule: Rule) => {
    setActivatingId(rule.id);
    try {
      await setRuleStatus(rule.id, 'ACTIVE');
      feedback.success(`Regra "${rule.name}" ativada com sucesso!`);
      router.refresh();
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Falha ao ativar regra.');
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead align="right">Prioridade</TableHead>
            <TableHead>Vigência</TableHead>
            <TableHead>Critérios</TableHead>
            <TableHead>Estratégia</TableHead>
            <TableHead>Status</TableHead>
            <TableHead align="right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell>{rule.code}</TableCell>
              <TableCell>{rule.name}</TableCell>
              <TableCell align="right">{rule.priority}</TableCell>
              <TableCell>
                {formatDate(rule.validFrom)}
                {rule.validTo ? ` – ${formatDate(rule.validTo)}` : ''}
              </TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                  {rule.criteria.map((criterion, index) => (
                    <Badge key={index} variant="outline">
                      {fieldLabel(criterion)} {operatorLabel(criterion.operator)}{' '}
                      {criterion.value ?? criterion.valueList?.join(', ') ?? ''}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{conflictStrategyLabel(rule.conflictStrategy)}</TableCell>
              <TableCell>
                <Badge variant={rule.status === 'Ativa' ? 'success' : 'secondary'}>
                  {rule.status}
                </Badge>
              </TableCell>
              <TableCell align="right">
                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                  <RuleBuilderSheet
                    rule={rule}
                    companies={companies}
                    users={users}
                    trigger={
                      <Button variant="ghost" size="icon" aria-label={`Editar regra ${rule.name}`}>
                        <Pencil size={16} />
                      </Button>
                    }
                  />
                  {rule.status === 'Ativa' ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Desativar regra ${rule.name}`}
                      onClick={() => setRuleToDelete(rule)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Ativar regra ${rule.name}`}
                      isLoading={activatingId === rule.id}
                      onClick={() => handleActivate(rule)}
                    >
                      <Power size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(ruleToDelete)} onOpenChange={(open) => !open && setRuleToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Desativar regra{ruleToDelete ? ` "${ruleToDelete.name}"` : ''}
            </DialogTitle>
            <DialogDescription>
              A regra deixará de ser aplicada a novas ordens de compra. Essa ação pode ser revertida
              reativando a regra depois.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleToDelete(null)} disabled={submitting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={submitting}>
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
