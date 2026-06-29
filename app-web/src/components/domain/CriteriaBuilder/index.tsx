'use client';

import { Control, UseFormRegister, useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { RULE_FIELDS, RULE_OPERATORS } from '@/lib/mock/rules';
import type { RuleFormData } from '@/app/rules/schema';
import styles from './styles.module.scss';

interface CriteriaBuilderProps {
  control: Control<RuleFormData>;
  register: UseFormRegister<RuleFormData>;
}

export function CriteriaBuilder({ control, register }: CriteriaBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'criteria' });

  return (
    <div className={styles.builder}>
      {fields.map((field, index) => (
        <div key={field.id} className={styles.row}>
          <Select
            options={RULE_FIELDS.map((value) => ({ label: value, value }))}
            placeholder="Campo"
            {...register(`criteria.${index}.field`)}
          />
          <Select
            options={RULE_OPERATORS.map((value) => ({ label: value, value }))}
            placeholder="Operador"
            {...register(`criteria.${index}.operator`)}
          />
          <Input placeholder="Valor" {...register(`criteria.${index}.value`)} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remover critério"
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
        onClick={() => append({ field: '', operator: '', value: '' })}
      >
        Adicionar critério
      </Button>
    </div>
  );
}
