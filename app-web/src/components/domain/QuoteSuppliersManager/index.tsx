'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PatternFormat } from 'react-number-format';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { feedback } from '@/services/feedback';
import type { QuoteSupplier } from '@/lib/mock/quotes';
import { quoteSupplierSchema, type QuoteSupplierFormData } from '@/app/quotes/new/schema';
import styles from './styles.module.scss';

const EMPTY_SUPPLIER: QuoteSupplierFormData = { name: '', cnpj: '', email: '', phone: '' };

interface QuoteSuppliersManagerProps {
  suppliers: QuoteSupplier[];
  onAdd: (supplier: QuoteSupplier) => void;
  onRemove: (supplierId: string) => void;
}

export function QuoteSuppliersManager({ suppliers, onAdd, onRemove }: QuoteSuppliersManagerProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<QuoteSupplierFormData>({
    resolver: zodResolver(quoteSupplierSchema),
    defaultValues: EMPTY_SUPPLIER,
  });

  const onSubmit = (data: QuoteSupplierFormData) => {
    if (suppliers.some((supplier) => supplier.cnpj === data.cnpj)) {
      setError('cnpj', { message: 'Já existe um fornecedor com este CNPJ' });
      return;
    }
    onAdd({ id: crypto.randomUUID(), ...data });
    feedback.success(`Fornecedor "${data.name}" cadastrado.`);
    reset(EMPTY_SUPPLIER);
  };

  return (
    <div className={styles.container}>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Novo Fornecedor</h2>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.wideField}>
                <Label htmlFor="supplierName">
                  Razão Social <span className={styles.required}>*</span>
                </Label>
                <Input
                  id="supplierName"
                  placeholder="Ex.: Fornecedor Exemplo LTDA"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>
              <div>
                <Label htmlFor="supplierCnpj">
                  CNPJ <span className={styles.required}>*</span>
                </Label>
                <Controller
                  control={control}
                  name="cnpj"
                  render={({ field, fieldState }) => (
                    <PatternFormat
                      id="supplierCnpj"
                      customInput={Input}
                      format="##.###.###/####-##"
                      placeholder="00.000.000/0000-00"
                      value={field.value}
                      onValueChange={(values) => field.onChange(values.formattedValue)}
                      onBlur={field.onBlur}
                      getInputRef={field.ref}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <div>
                <Label htmlFor="supplierEmail">
                  E-mail <span className={styles.required}>*</span>
                </Label>
                <Input
                  id="supplierEmail"
                  type="email"
                  placeholder="cotacoes@fornecedor.com.br"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              <div>
                <Label htmlFor="supplierPhone">Telefone</Label>
                <Controller
                  control={control}
                  name="phone"
                  render={({ field }) => (
                    <PatternFormat
                      id="supplierPhone"
                      customInput={Input}
                      format="(##) #####-####"
                      placeholder="(00) 00000-0000"
                      value={field.value}
                      onValueChange={(values) => field.onChange(values.formattedValue)}
                      onBlur={field.onBlur}
                      getInputRef={field.ref}
                    />
                  )}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="outline" onClick={() => reset(EMPTY_SUPPLIER)}>
                Limpar
              </Button>
              <Button type="submit" leftIcon={<Plus size={16} />}>
                Cadastrar Fornecedor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Fornecedores Cadastrados ({suppliers.length})</h2>
          </div>

          <div className={styles.tableWrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead align="center" className={styles.actionsColumn}>
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>{supplier.name}</TableCell>
                    <TableCell>{supplier.cnpj}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>{supplier.phone || '—'}</TableCell>
                    <TableCell align="center" className={styles.actionsColumn}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover fornecedor ${supplier.name}`}
                        onClick={() => onRemove(supplier.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {suppliers.length === 0 && (
            <p className={styles.emptyMessage}>Nenhum fornecedor cadastrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
