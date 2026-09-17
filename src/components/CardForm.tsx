'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { createCardAction } from '@/app/actions/cards';
import type { ActionResult } from '@/lib/actionResult';

type CreatedCard = { id: string };

export function CardForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult<CreatedCard> | null, formData: FormData) => {
    const result = await createCardAction(formData);
    if (result.ok) {
      router.push(`/tarjetas/${result.data.id}`);
    }
    return result;
  }, null as ActionResult<CreatedCard> | null);

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <TextField isRequired fullWidth name="name">
        <Label>Cómo la reconoces</Label>
        <Input placeholder="Visa personal, Master del trabajo…" />
      </TextField>
      <TextField isRequired fullWidth name="bank">
        <Label>Banco</Label>
        <Input />
      </TextField>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField isRequired fullWidth name="creditLimit">
          <Label>Cupo</Label>
          <Input inputMode="decimal" />
        </TextField>
        <TextField isRequired fullWidth name="annualRate">
          <Label>IEA anual (%)</Label>
          <Input inputMode="decimal" placeholder="24" />
        </TextField>
        <TextField isRequired fullWidth name="cutoffDay" type="number">
          <Label>Día de corte (1-28)</Label>
          <Input max={28} min={1} />
        </TextField>
        <TextField isRequired fullWidth name="dueDay" type="number">
          <Label>Día de pago (1-28)</Label>
          <Input max={28} min={1} />
        </TextField>
      </div>
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit">
        {pending ? 'Guardando…' : 'Crear tarjeta'}
      </Button>
    </Form>
  );
}
