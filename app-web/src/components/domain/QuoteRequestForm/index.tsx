'use client';

import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NumericFormat } from 'react-number-format';
import { Plus, Save, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { feedback } from '@/services/feedback';
import { mockQuoteCompanies, mockWarehouses } from '@/lib/mock/quotes';
import {
  quoteRequestSchema,
  type QuoteLineFormData,
  type QuoteRequestFormData,
} from '@/app/quotes/new/schema';
import styles from './styles.module.scss';

const INITIAL_LINE_COUNT = 3;
// Mock-only: simulates the latency of sending the quote to suppliers.
const MOCK_SEND_DELAY_MS = 800;

function createEmptyLine(): QuoteLineFormData {
  return { itemCode: '', quantity: 0, expectedDate: '' };
}

function buildDefaultValues(): QuoteRequestFormData {
  return {
    quoteCode: '',
    warehouse: '',
    company: '',
    receiptDate: '',
    expectedResponseDate: '',
    lines: Array.from({ length: INITIAL_LINE_COUNT }, createEmptyLine),
  };
}

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className={styles.required}>*</span>
    </Label>
  );
}

export function QuoteRequestForm() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<QuoteRequestFormData>({
    resolver: zodResolver(quoteRequestSchema),
    defaultValues: buildDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });

  const allSelected = fields.length > 0 && selectedIds.size === fields.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(fields.map((field) => field.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeLine = (index: number, id: string) => {
    remove(index);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const removeSelected = () => {
    const indexes = fields
      .map((field, index) => (selectedIds.has(field.id) ? index : -1))
      .filter((index) => index >= 0);
    remove(indexes);
    setSelectedIds(new Set());
  };

  const resetForm = () => {
    reset(buildDefaultValues());
    setSelectedIds(new Set());
  };

  const onInvalid = () => {
    feedback.error('Revise os campos destacados antes de continuar.');
  };

  const onSave = async (data: QuoteRequestFormData) => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, MOCK_SEND_DELAY_MS));
    console.info('[mock] Rascunho de cotação salvo', data);
    feedback.success(`Rascunho da cotação "${data.quoteCode}" salvo.`);
    setIsSaving(false);
  };

  const onSend = async (data: QuoteRequestFormData) => {
    setIsSending(true);
    await new Promise((resolve) => setTimeout(resolve, MOCK_SEND_DELAY_MS));
    console.info('[mock] Cotação enviada aos fornecedores', data);
    feedback.success(`Cotação "${data.quoteCode}" enviada aos fornecedores.`);
    setIsSending(false);
    resetForm();
  };

  const isBusy = isSaving || isSending;

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSend, onInvalid)} noValidate>
      <Card>
        <CardContent>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Capa</h2>
          </div>

          <div className={styles.headerGrid}>
            <div>
              <RequiredLabel htmlFor="quoteCode">Cotação</RequiredLabel>
              <Input
                id="quoteCode"
                placeholder="Ex.: SC-000123"
                error={errors.quoteCode?.message}
                {...register('quoteCode')}
              />
            </div>
            <div>
              <RequiredLabel htmlFor="warehouse">Armazém</RequiredLabel>
              <Select
                id="warehouse"
                options={mockWarehouses}
                placeholder="Selecione o armazém"
                error={errors.warehouse?.message}
                {...register('warehouse')}
              />
            </div>
            <div>
              <RequiredLabel htmlFor="company">Empresa</RequiredLabel>
              <Select
                id="company"
                options={mockQuoteCompanies}
                placeholder="Selecione a empresa"
                error={errors.company?.message}
                {...register('company')}
              />
            </div>
            <div>
              <RequiredLabel htmlFor="receiptDate">Data de Recebimento</RequiredLabel>
              <Input
                id="receiptDate"
                type="date"
                error={errors.receiptDate?.message}
                {...register('receiptDate')}
              />
            </div>
            <div>
              <RequiredLabel htmlFor="expectedResponseDate">
                Data da Resposta Esperada
              </RequiredLabel>
              <Input
                id="expectedResponseDate"
                type="date"
                error={errors.expectedResponseDate?.message}
                {...register('expectedResponseDate')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Linhas</h2>
            <div className={styles.sectionActions}>
              {selectedIds.size > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  leftIcon={<Trash2 size={16} />}
                  onClick={removeSelected}
                >
                  Excluir selecionadas ({selectedIds.size})
                </Button>
              )}
              <Button
                type="button"
                leftIcon={<Plus size={16} />}
                onClick={() => append(createEmptyLine())}
              >
                Nova Linha
              </Button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={styles.checkboxColumn}>
                    <Checkbox
                      aria-label="Selecionar todas as linhas"
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      disabled={fields.length === 0}
                    />
                  </TableHead>
                  <TableHead>Código de Item</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Data de Recebimento Esperado</TableHead>
                  <TableHead align="center" className={styles.actionsColumn}>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const lineErrors = errors.lines?.[index];
                  return (
                    <TableRow key={field.id}>
                      <TableCell className={styles.checkboxColumn}>
                        <Checkbox
                          aria-label={`Selecionar linha ${index + 1}`}
                          checked={selectedIds.has(field.id)}
                          onChange={() => toggleOne(field.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label={`Código do item da linha ${index + 1}`}
                          placeholder={`Ex.: ITM-${String(index + 1).padStart(3, '0')}`}
                          error={lineErrors?.itemCode?.message}
                          {...register(`lines.${index}.itemCode`)}
                        />
                      </TableCell>
                      <TableCell>
                        <Controller
                          control={control}
                          name={`lines.${index}.quantity`}
                          render={({ field: quantityField, fieldState }) => (
                            <NumericFormat
                              customInput={Input}
                              aria-label={`Quantidade da linha ${index + 1}`}
                              thousandSeparator="."
                              decimalSeparator=","
                              decimalScale={2}
                              fixedDecimalScale
                              allowNegative={false}
                              placeholder="0,00"
                              value={quantityField.value}
                              onValueChange={(values) =>
                                quantityField.onChange(values.floatValue ?? 0)
                              }
                              onBlur={quantityField.onBlur}
                              getInputRef={quantityField.ref}
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label={`Data de recebimento esperado da linha ${index + 1}`}
                          type="date"
                          error={lineErrors?.expectedDate?.message}
                          {...register(`lines.${index}.expectedDate`)}
                        />
                      </TableCell>
                      <TableCell align="center" className={styles.actionsColumn}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover linha ${index + 1}`}
                          onClick={() => removeLine(index, field.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {fields.length === 0 && (
            <p className={styles.emptyMessage}>
              Nenhuma linha adicionada. Clique em &quot;Nova Linha&quot; para incluir itens.
            </p>
          )}
          {errors.lines?.root?.message && (
            <p className={styles.errorMessage}>{errors.lines.root.message}</p>
          )}
          {errors.lines?.message && <p className={styles.errorMessage}>{errors.lines.message}</p>}
        </CardContent>
      </Card>

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={resetForm} disabled={isBusy}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="secondary"
          leftIcon={<Save size={16} />}
          isLoading={isSaving}
          disabled={isSending}
          onClick={handleSubmit(onSave, onInvalid)}
        >
          Salvar
        </Button>
        <Button
          type="submit"
          leftIcon={<Send size={16} />}
          isLoading={isSending}
          disabled={isSaving}
        >
          Enviar Cotação
        </Button>
      </div>
    </form>
  );
}
