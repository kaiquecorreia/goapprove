'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
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
import { deactivateRule } from '@/services/rulesClient';
import type { Rule } from '@/lib/mock/types';

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

export function RulesTable({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Desativar regra ${rule.name}`}
                  disabled={rule.status === 'Inativa'}
                  onClick={() => setRuleToDelete(rule)}
                >
                  <Trash2 size={16} />
                </Button>
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
