'use client';

import { Control, UseFormRegister, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { RULE_OPERATORS, RULE_SOURCE_TYPES } from '@/lib/mock/rules';
import type { RuleFormData } from '@/app/rules/schema';
import styles from './styles.module.scss';

interface CriteriaBuilderProps {
  control: Control<RuleFormData>;
  register: UseFormRegister<RuleFormData>;
}

interface CriterionRowProps {
  control: Control<RuleFormData>;
  register: UseFormRegister<RuleFormData>;
  index: number;
  onRemove: () => void;
}

function CriterionRow({ control, register, index, onRemove }: CriterionRowProps) {
  const operator = useWatch({ control, name: `criteria.${index}.operator` });
  const showBetween = operator === 'BETWEEN';
  const showList = operator === 'IN_LIST' || operator === 'NOT_IN_LIST';
  const showValue = !showBetween && !showList && operator !== 'EXISTS' && operator !== 'NOT_EXISTS';

  return (
    <div className={styles.criterionCard}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Critério {index + 1}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remover critério"
          onClick={onRemove}
        >
          <Trash2 size={16} />
        </Button>
      </div>
      <div className={styles.fieldsGrid}>
        <Select
          options={RULE_SOURCE_TYPES}
          placeholder="Origem"
          {...register(`criteria.${index}.sourceType`)}
        />
        <Input placeholder="Campo (ex: totalAmount)" {...register(`criteria.${index}.field`)} />
        <Select
          options={RULE_OPERATORS}
          placeholder="Operador"
          {...register(`criteria.${index}.operator`)}
        />
        {showValue && <Input placeholder="Valor" {...register(`criteria.${index}.value`)} />}
        {showBetween && (
          <>
            <Input placeholder="Valor (de)" {...register(`criteria.${index}.value`)} />
            <Input placeholder="Até" {...register(`criteria.${index}.valueTo`)} />
          </>
        )}
        {showList && (
          <Input
            placeholder="Lista (separados por vírgula)"
            {...register(`criteria.${index}.valueList`)}
          />
        )}
      </div>
    </div>
  );
}

export function CriteriaBuilder({ control, register }: CriteriaBuilderProps) {
  const { fields, append, remove } = useFieldArray({ control, name: 'criteria' });

  return (
    <div className={styles.builder}>
      {fields.map((field, index) => (
        <CriterionRow
          key={field.id}
          control={control}
          register={register}
          index={index}
          onRemove={() => remove(index)}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Plus size={14} />}
        onClick={() =>
          append({ sourceType: 'PO_HEADER', field: '', operator: 'EQUALS', value: '' })
        }
      >
        Adicionar critério
      </Button>
    </div>
  );
}
