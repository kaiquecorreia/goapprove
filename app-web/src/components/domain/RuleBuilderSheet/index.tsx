'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Separator } from '@/components/ui/Separator';
import { CriteriaBuilder } from '@/components/domain/CriteriaBuilder';
import { ApprovalLevelsBuilder } from '@/components/domain/ApprovalLevelsBuilder';
import { feedback } from '@/services/feedback';
import { createRule, updateRule, type RuleConditionPayload } from '@/services/rulesClient';
import { CONFLICT_STRATEGIES, RULE_TYPE_OPTIONS } from '@/lib/mock/rules';
import { ruleSchema, type RuleFormData } from '@/app/rules/schema';
import type { Company, Rule, User } from '@/lib/mock/types';

interface RuleBuilderSheetProps {
  trigger: ReactNode;
  companies: Company[];
  users: User[];
  rule?: Rule;
}

function buildDefaultValues(rule?: Rule): RuleFormData {
  if (!rule) {
    return {
      code: '',
      name: '',
      description: '',
      companyId: '',
      priority: 10,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: '',
      ruleType: 'STANDARD',
      conflictStrategy: 'HIGHEST_PRIORITY',
      criteria: [{ sourceType: 'PO_HEADER', field: '', operator: 'EQUALS', value: '' }],
      levels: [{ mode: 'ANY', approverUserIds: [] }],
    };
  }

  return {
    code: rule.code,
    name: rule.name,
    description: rule.description ?? '',
    companyId: rule.companyId,
    priority: rule.priority,
    validFrom: rule.validFrom.slice(0, 10),
    validTo: rule.validTo ? rule.validTo.slice(0, 10) : '',
    ruleType: rule.ruleType,
    conflictStrategy: rule.conflictStrategy,
    criteria: rule.criteria.map((criterion) => ({
      sourceType: criterion.sourceType,
      field: criterion.field,
      operator: criterion.operator,
      value: criterion.value ?? '',
      valueTo: criterion.valueTo ?? '',
      valueList: criterion.valueList?.join(', ') ?? '',
    })),
    levels: rule.levels.map((level) => ({
      mode: level.mode,
      approverUserIds: level.approvers.map((approver) => approver.userId),
    })),
  };
}

export function RuleBuilderSheet({ trigger, companies, users, rule }: RuleBuilderSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: buildDefaultValues(rule),
  });

  const ruleType = watch('ruleType');
  const isAutoApprove = ruleType === 'AUTO_APPROVE';

  useEffect(() => {
    if (open) {
      reset(buildDefaultValues(rule));
    }
  }, [open, rule, reset]);

  useEffect(() => {
    if (isAutoApprove) {
      setValue('levels', []);
    }
  }, [isAutoApprove, setValue]);

  const onSubmit = async (data: RuleFormData) => {
    const conditions: RuleConditionPayload[] = data.criteria.map((criterion) => ({
      sourceType: criterion.sourceType,
      field: criterion.field,
      operator: criterion.operator,
      value: criterion.value,
      valueTo: criterion.valueTo,
      valueList: criterion.valueList
        ? criterion.valueList
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
        : undefined,
    }));

    const payload = {
      code: data.code,
      name: data.name,
      description: data.description || undefined,
      companyId: data.companyId,
      priority: data.priority,
      validFrom: data.validFrom,
      validTo: data.validTo || undefined,
      ruleType: data.ruleType,
      conflictStrategy: data.conflictStrategy,
      conditions,
      levels: data.levels.map((level, index) => ({
        levelNumber: index + 1,
        mode: level.mode,
        approverUserIds: level.approverUserIds,
      })),
    };

    try {
      if (rule) {
        await updateRule(rule.id, payload);
        feedback.success(`Regra "${data.name}" atualizada com sucesso!`);
      } else {
        await createRule(payload);
        feedback.success(`Regra "${data.name}" criada com sucesso!`);
        reset(buildDefaultValues());
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      feedback.error(
        err instanceof Error ? err.message : `Falha ao ${rule ? 'atualizar' : 'criar'} regra.`,
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent size="lg">
        <SheetHeader>
          <SheetTitle>
            {rule ? `Editar regra "${rule.name}"` : 'Nova regra de aprovação'}
          </SheetTitle>
          <SheetDescription>
            {rule
              ? 'Atualize os critérios e níveis de aprovação desta regra.'
              : 'Defina critérios e níveis de aprovação aplicáveis às OCs recebidas.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
            <div>
              <Label htmlFor="code">Código da regra</Label>
              <Input id="code" error={errors.code?.message} {...register('code')} />
            </div>
            <div>
              <Label htmlFor="name">Nome da regra</Label>
              <Input id="name" error={errors.name?.message} {...register('name')} />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" {...register('description')} />
          </div>

          <div>
            <Label htmlFor="companyId">Empresa</Label>
            <Select
              id="companyId"
              options={companies.map((company) => ({
                label: company.name,
                value: company.companyId,
              }))}
              placeholder="Selecione a empresa"
              error={errors.companyId?.message}
              {...register('companyId')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                error={errors.priority?.message}
                {...register('priority')}
              />
            </div>
            <div>
              <Label htmlFor="validFrom">Início da vigência</Label>
              <Input
                id="validFrom"
                type="date"
                error={errors.validFrom?.message}
                {...register('validFrom')}
              />
            </div>
            <div>
              <Label htmlFor="validTo">Fim da vigência (opcional)</Label>
              <Input id="validTo" type="date" {...register('validTo')} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <Label htmlFor="ruleType">Tipo de regra</Label>
              <Select id="ruleType" options={RULE_TYPE_OPTIONS} {...register('ruleType')} />
            </div>
            <div>
              <Label htmlFor="conflictStrategy">Estratégia de conflito</Label>
              <Select
                id="conflictStrategy"
                options={CONFLICT_STRATEGIES}
                {...register('conflictStrategy')}
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label>Critérios</Label>
            <CriteriaBuilder control={control} register={register} setValue={setValue} />
            {errors.criteria?.message && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>
                {errors.criteria.message}
              </span>
            )}
          </div>

          <Separator />

          {isAutoApprove ? (
            <div>
              <Label>Níveis de aprovação</Label>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Pedidos que casarem com esta regra serão aprovados automaticamente, sem aprovador
                humano.
              </p>
            </div>
          ) : (
            <div>
              <Label>Níveis de aprovação</Label>
              <ApprovalLevelsBuilder control={control} register={register} users={users} />
              {errors.levels?.message && (
                <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>
                  {errors.levels.message}
                </span>
              )}
            </div>
          )}

          <SheetFooter>
            <Button type="submit" isLoading={isSubmitting}>
              {rule ? 'Salvar alterações' : 'Salvar regra'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
