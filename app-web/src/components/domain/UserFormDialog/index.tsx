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
import { Checkbox } from '@/components/ui/Checkbox';
import { feedback } from '@/services/feedback';
import { createUser, updateUser } from '@/services/usersClient';
import { USER_ROLE_LABELS } from '@/lib/userRoleLabels';
import { USER_ROLE_OPTIONS, userSchema, type UserFormData } from '@/app/users/schema';
import type { Company, User } from '@/lib/mock/types';

function buildDefaultValues(user?: User): UserFormData {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    externalIntegrationUser: user?.externalIntegrationUser ?? '',
    role: user?.role ?? USER_ROLE_OPTIONS[1],
    active: user?.active ?? true,
    approvalLimit: user?.approvalLimit ?? 0,
    companyIds: user?.companies.map((link) => link.companyId) ?? [],
    substituteIds:
      user?.substitutes
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map((link) => link.substituteId) ?? [],
  };
}

interface UserFormDialogProps {
  trigger?: ReactNode;
  user?: User;
  companies: Company[];
  users: User[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserFormDialog({
  trigger,
  user,
  companies,
  users,
  open,
  onOpenChange,
}: UserFormDialogProps) {
  const router = useRouter();
  const isEditing = !!user;

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
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: buildDefaultValues(user),
  });

  useEffect(() => {
    if (isOpen) {
      reset(buildDefaultValues(user));
    }
  }, [isOpen, user, reset]);

  const companyIds = watch('companyIds');
  const substituteIds = watch('substituteIds');

  const toggleCompany = (companyId: string) => {
    setValue(
      'companyIds',
      companyIds.includes(companyId)
        ? companyIds.filter((id) => id !== companyId)
        : [...companyIds, companyId],
    );
  };

  const toggleSubstitute = (substituteId: string) => {
    setValue(
      'substituteIds',
      substituteIds.includes(substituteId)
        ? substituteIds.filter((id) => id !== substituteId)
        : [...substituteIds, substituteId],
    );
  };

  const onSubmit = async (data: UserFormData) => {
    const payload = {
      name: data.name,
      email: data.email,
      externalIntegrationUser: data.externalIntegrationUser,
      role: data.role,
      active: data.active,
      approvalLimit: data.approvalLimit,
      companyIds: data.companyIds,
      substituteIds: data.substituteIds,
    };

    try {
      if (isEditing && user) {
        await updateUser(user.userId, payload);
        feedback.success(`Usuário ${data.name} atualizado com sucesso!`);
      } else {
        await createUser(payload);
        feedback.success(`Usuário ${data.name} criado com sucesso!`);
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao salvar usuário.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize os dados de acesso deste usuário.'
              : 'Cadastre um novo usuário do GoApprove.'}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome completo"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div>
            <Label htmlFor="externalIntegrationUser">Usuário de integração (Infor)</Label>
            <Input
              id="externalIntegrationUser"
              placeholder="usuario@empresa.com"
              error={errors.externalIntegrationUser?.message}
              {...register('externalIntegrationUser')}
            />
          </div>

          <div>
            <Label htmlFor="role">Perfil</Label>
            <Select
              id="role"
              options={USER_ROLE_OPTIONS.map((role) => ({
                label: USER_ROLE_LABELS[role],
                value: role,
              }))}
              error={errors.role?.message}
              {...register('role')}
            />
          </div>

          <div>
            <Label htmlFor="approvalLimit">Limite de aprovação (R$)</Label>
            <Input
              id="approvalLimit"
              type="number"
              step="0.01"
              error={errors.approvalLimit?.message}
              {...register('approvalLimit')}
            />
          </div>

          <div>
            <Label>Empresas</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {companies.map((company) => (
                <label
                  key={company.companyId}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Checkbox
                    checked={companyIds.includes(company.companyId)}
                    onChange={() => toggleCompany(company.companyId)}
                  />
                  {company.name}
                </label>
              ))}
            </div>
            {errors.companyIds && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                {errors.companyIds.message}
              </span>
            )}
          </div>

          <div>
            <Label>Substitutos (em ordem de prioridade)</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {users
                .filter((candidate) => candidate.userId !== user?.userId)
                .map((candidate) => (
                  <label
                    key={candidate.userId}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Checkbox
                      checked={substituteIds.includes(candidate.userId)}
                      onChange={() => toggleSubstitute(candidate.userId)}
                    />
                    {candidate.name}
                  </label>
                ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Switch id="active" {...register('active')} />
            <Label htmlFor="active" style={{ margin: 0 }}>
              Usuário ativo
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              {isEditing ? 'Salvar alterações' : 'Salvar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
