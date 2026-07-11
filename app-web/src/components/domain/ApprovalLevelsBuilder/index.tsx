'use client';

import { Control, Controller, UseFormRegister, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { APPROVAL_MODE_OPTIONS } from '@/lib/mock/rules';
import type { RuleFormData } from '@/app/rules/schema';
import type { User } from '@/lib/mock/types';
import styles from './styles.module.scss';

interface ApprovalLevelsBuilderProps {
  control: Control<RuleFormData>;
  register: UseFormRegister<RuleFormData>;
  users: User[];
}

export function ApprovalLevelsBuilder({ control, register, users }: ApprovalLevelsBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'levels' });
  const companyId = useWatch({ control, name: 'companyId' });

  const eligibleUsers = users.filter(
    (user) =>
      ['APPROVER', 'ADMINISTRATOR', 'OWNER'].includes(user.role) &&
      user.active &&
      (!companyId || user.companies.some((c) => c.companyId === companyId)),
  );

  return (
    <div className={styles.builder}>
      {fields.map((field, index) => (
        <div key={field.id} className={styles.levelCard}>
          <div className={styles.cardHeader}>
            <span className={styles.levelBadge}>N{index + 1}</span>
            <Select
              wrapperClassName={styles.modeSelect}
              options={APPROVAL_MODE_OPTIONS}
              placeholder="Modo"
              {...register(`levels.${index}.mode`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover nível"
              onClick={() => remove(index)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
          <Controller
            control={control}
            name={`levels.${index}.approverUserIds`}
            render={({ field: approverField, fieldState }) => (
              <MultiSelect
                options={eligibleUsers.map((user) => ({ label: user.name, value: user.userId }))}
                value={approverField.value ?? []}
                onChange={approverField.onChange}
                placeholder="Selecione os aprovadores"
                emptyMessage="Selecione uma empresa para listar aprovadores."
                error={fieldState.error?.message}
              />
            )}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Plus size={14} />}
        onClick={() => append({ mode: 'ANY', approverUserIds: [] })}
      >
        Adicionar nível
      </Button>
    </div>
  );
}
