'use client';

import { ReactNode } from 'react';
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
import { createRule, type RuleConditionPayload } from '@/services/rulesClient';
import { CONFLICT_STRATEGIES } from '@/lib/mock/rules';
import { ruleSchema, type RuleFormData } from '@/app/rules/schema';
import type { Company, User } from '@/lib/mock/types';

interface RuleBuilderSheetProps {
  trigger: ReactNode;
  companies: Company[];
  users: User[];
}

export function RuleBuilderSheet({ trigger, companies, users }: RuleBuilderSheetProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      companyId: '',
      priority: 10,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: '',
      conflictStrategy: 'HIGHEST_PRIORITY',
      criteria: [{ sourceType: 'PO_HEADER', field: '', operator: 'EQUALS', value: '' }],
      levels: [{ mode: 'ANY', approverUserIds: [] }],
    },
  });

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

    try {
      await createRule({
        code: data.code,
        name: data.name,
        description: data.description || undefined,
        companyId: data.companyId,
        priority: data.priority,
        validFrom: data.validFrom,
        validTo: data.validTo || undefined,
        conflictStrategy: data.conflictStrategy,
        conditions,
        levels: data.levels.map((level, index) => ({
          levelNumber: index + 1,
          mode: level.mode,
          approverUserIds: level.approverUserIds,
        })),
      });

      feedback.success(`Regra "${data.name}" criada com sucesso!`);
      reset();
      router.refresh();
    } catch (err) {
      feedback.error(err instanceof Error ? err.message : 'Falha ao criar regra.');
    }
  };

  return (
    <Sheet>
      <SheetTrigger>{trigger}</SheetTrigger>
      <SheetContent size="lg">
        <SheetHeader>
          <SheetTitle>Nova regra de aprovação</SheetTitle>
          <SheetDescription>
            Defina critérios e níveis de aprovação aplicáveis às OCs recebidas.
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

          <div>
            <Label htmlFor="conflictStrategy">Estratégia de conflito</Label>
            <Select
              id="conflictStrategy"
              options={CONFLICT_STRATEGIES}
              {...register('conflictStrategy')}
            />
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

          <div>
            <Label>Níveis de aprovação</Label>
            <ApprovalLevelsBuilder control={control} register={register} users={users} />
            {errors.levels?.message && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>
                {errors.levels.message}
              </span>
            )}
          </div>

          <SheetFooter>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar regra
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
