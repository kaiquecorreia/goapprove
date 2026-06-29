'use client';

import { ReactNode } from 'react';
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
import { Separator } from '@/components/ui/Separator';
import { CriteriaBuilder } from '@/components/domain/CriteriaBuilder';
import { ApprovalLevelsBuilder } from '@/components/domain/ApprovalLevelsBuilder';
import { feedback } from '@/services/feedback';
import { CONFLICT_STRATEGY_OPTIONS, ruleSchema, type RuleFormData } from '@/app/rules/schema';

export function RuleBuilderSheet({ trigger }: { trigger: ReactNode }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      priority: 10,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: '',
      conflictStrategy: 'Maior prioridade',
      criteria: [{ field: '', operator: '', value: '' }],
      levels: [{ mode: 'ANY', approvers: '' }],
    },
  });

  const onSubmit = async (data: RuleFormData) => {
    await feedback.promise(Promise.resolve(data), {
      loading: 'Criando regra...',
      success: `Regra "${data.name}" criada com sucesso!`,
      error: 'Falha ao criar regra.',
    });
    reset();
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
          <div>
            <Label htmlFor="name">Nome da regra</Label>
            <Input id="name" error={errors.name?.message} {...register('name')} />
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
              options={CONFLICT_STRATEGY_OPTIONS.map((value) => ({ label: value, value }))}
              {...register('conflictStrategy')}
            />
          </div>

          <Separator />

          <div>
            <Label>Critérios</Label>
            <CriteriaBuilder control={control} register={register} />
            {errors.criteria?.message && (
              <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>
                {errors.criteria.message}
              </span>
            )}
          </div>

          <Separator />

          <div>
            <Label>Níveis de aprovação</Label>
            <ApprovalLevelsBuilder control={control} register={register} />
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
