'use client';

import { useActionState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { loginAction, registerAction } from '@/app/actions/auth';
import type { ActionResult } from '@/lib/actionResult';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const action = mode === 'login' ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult<unknown> | null, formData: FormData) => {
    return action(formData);
  }, null as ActionResult<unknown> | null);

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      {mode === 'register' ? (
        <TextField isRequired fullWidth name="name">
          <Label>Nombre</Label>
          <Input autoComplete="name" />
        </TextField>
      ) : null}
      <TextField isRequired fullWidth name="email" type="email">
        <Label>Email</Label>
        <Input autoComplete="email" />
      </TextField>
      <TextField isRequired fullWidth minLength={8} name="password" type="password">
        <Label>Contraseña</Label>
        <Input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      </TextField>
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button fullWidth isPending={pending} type="submit">
        {pending ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
      </Button>
    </Form>
  );
}
