'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { feedback } from '@/services/feedback';
import { setUserPassword } from '@/services/usersClient';
import { setPasswordSchema, type SetPasswordFormData } from '@/app/users/setPasswordSchema';

interface SetPasswordDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetPasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: SetPasswordDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SetPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await setUserPassword(userId, data.password);
      feedback.success(`Senha de ${userName} atualizada com sucesso!`);
      reset();
      onOpenChange(false);
    } catch (error) {
      feedback.error(error instanceof Error ? error.message : 'Falha ao definir senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir/resetar senha</DialogTitle>
          <DialogDescription>
            Defina uma nova senha para {userName}. Ela será usada no próximo login.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
        >
          <div>
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo de 8 caracteres"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Repita a nova senha"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
          </div>

          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>
              Salvar senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
