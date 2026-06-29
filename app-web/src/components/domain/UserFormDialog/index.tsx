'use client';

import { ReactNode } from 'react';
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
import { feedback } from '@/services/feedback';
import { mockCompanies } from '@/lib/mock/companies';
import { mockUsers } from '@/lib/mock/users';
import { USER_PROFILES, userSchema, type UserFormData } from '@/app/users/schema';

export function UserFormDialog({ trigger }: { trigger: ReactNode }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      profile: 'Aprovador',
      company: mockCompanies[0]?.name ?? '',
      approvalLimit: 0,
      substitute: '',
      active: true,
    },
  });

  const onSubmit = async (data: UserFormData) => {
    await feedback.promise(Promise.resolve(data), {
      loading: 'Criando usuário...',
      success: `Usuário ${data.name} criado com sucesso!`,
      error: 'Falha ao criar usuário.',
    });
    reset();
  };

  return (
    <Dialog>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>Cadastre um novo usuário do GoApprove.</DialogDescription>
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
            <Label htmlFor="profile">Perfil</Label>
            <Select
              id="profile"
              options={USER_PROFILES.map((profile) => ({ label: profile, value: profile }))}
              error={errors.profile?.message}
              {...register('profile')}
            />
          </div>

          <div>
            <Label htmlFor="company">Empresa</Label>
            <Select
              id="company"
              options={mockCompanies.map((company) => ({
                label: company.name,
                value: company.name,
              }))}
              error={errors.company?.message}
              {...register('company')}
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
            <Label htmlFor="substitute">Substituto (opcional)</Label>
            <Select
              id="substitute"
              placeholder="Nenhum"
              options={mockUsers.map((user) => ({ label: user.name, value: user.name }))}
              {...register('substitute')}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Switch id="active" defaultChecked {...register('active')} />
            <Label htmlFor="active" style={{ margin: 0 }}>
              Usuário ativo
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
