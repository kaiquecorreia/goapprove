'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Textarea } from '@/components/ui/Textarea';
import { feedback } from '@/services/feedback';
import { createCompany, updateCompany } from '@/services/companiesClient';
import {
  COMPANY_ENVIRONMENT_LABELS,
  COMPANY_ENVIRONMENT_OPTIONS,
  companySchema,
  type CompanyFormData,
} from '@/app/companies/schema';
import type { Company } from '@/lib/mock/types';

function buildDefaultValues(company?: Company): CompanyFormData {
  return {
    externalIntegrationCode: company?.externalIntegrationCode ?? '',
    name: company?.name ?? '',
    environment: company?.environment ?? COMPANY_ENVIRONMENT_OPTIONS[0],
    cnpj: company?.cnpj ?? '',
    status: company?.status ?? true,
    externalIntegrationUrlBase: company?.externalIntegrationUrlBase ?? '',
    notes: company?.notes ?? '',
  };
}

interface CompanyFormDialogProps {
  trigger?: ReactNode;
  company?: Company;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CompanyFormDialog({
  trigger,
  company,
  open,
  onOpenChange,
}: CompanyFormDialogProps) {
  const router = useRouter();
  const isEditing = !!company;

  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? !!open : internalOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: buildDefaultValues(company),
  });

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaultValues(company));
    }
  }, [isOpen, company, reset]);

  const onSubmit = async (data: CompanyFormData) => {
    const payload = {
      externalIntegrationCode: data.externalIntegrationCode,
      name: data.name,
      environment: data.environment,
      cnpj: data.cnpj || undefined,
      status: data.status,
      externalIntegrationUrlBase: data.externalIntegrationUrlBase || undefined,
      notes: data.notes || undefined,
    };

    try {
      if (isEditing && company) {
        await updateCompany(company.companyId, payload);
        feedback.success(`Empresa ${data.name} atualizada com sucesso!`);
      } else {
        await createCompany(payload);
        feedback.success(`Empresa ${data.name} criada com sucesso!`);
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao salvar empresa.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados de integração desta empresa.'
              : 'Cadastre uma nova empresa integrada ao ERP Infor LN.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <div>
            <Label htmlFor="externalIntegrationCode">Código de integração</Label>
            <Input
              id="externalIntegrationCode"
              placeholder="EXT_COMPANY_001"
              error={errors.externalIntegrationCode?.message}
              {...register('externalIntegrationCode')}
            />
          </div>

          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome da empresa"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div>
            <Label htmlFor="environment">Ambiente</Label>
            <Select
              id="environment"
              options={COMPANY_ENVIRONMENT_OPTIONS.map((environment) => ({
                label: COMPANY_ENVIRONMENT_LABELS[environment],
                value: environment,
              }))}
              error={errors.environment?.message}
              {...register('environment')}
            />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="12345678000195"
              error={errors.cnpj?.message}
              {...register('cnpj')}
            />
          </div>

          <div>
            <Label htmlFor="externalIntegrationUrlBase">URL de integração</Label>
            <Input
              id="externalIntegrationUrlBase"
              placeholder="https://api.empresa.com"
              error={errors.externalIntegrationUrlBase?.message}
              {...register('externalIntegrationUrlBase')}
            />
          </div>

          <div>
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre esta empresa (opcional)"
              error={errors.notes?.message}
              {...register('notes')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Switch id="status" {...register('status')} />
            <Label htmlFor="status" style={{ margin: 0 }}>
              Empresa ativa
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Salvar alterações' : 'Salvar empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
