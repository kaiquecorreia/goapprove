'use client';

import { Control, UseFormRegister, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { APPROVAL_MODES } from '@/app/rules/schema';
import type { RuleFormData } from '@/app/rules/schema';
import styles from './styles.module.scss';

interface ApprovalLevelsBuilderProps {
  control: Control<RuleFormData>;
  register: UseFormRegister<RuleFormData>;
}

export function ApprovalLevelsBuilder({ control, register }: ApprovalLevelsBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'levels' });

  return (
    <div className={styles.builder}>
      {fields.map((field, index) => (
        <div key={field.id} className={styles.row}>
          <span className={styles.levelBadge}>N{index + 1}</span>
          <Select
            options={APPROVAL_MODES.map((value) => ({ label: value, value }))}
            placeholder="Modo"
            {...register(`levels.${index}.mode`)}
          />
          <Input
            placeholder="Aprovadores (separados por vírgula)"
            {...register(`levels.${index}.approvers`)}
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
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Plus size={14} />}
        onClick={() => append({ mode: 'ANY', approvers: '' })}
      >
        Adicionar nível
      </Button>
    </div>
  );
}
