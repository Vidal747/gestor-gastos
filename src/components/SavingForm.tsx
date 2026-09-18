'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { createSavingAction } from '@/app/actions/savings';
import type { ActionResult } from '@/lib/actionResult';

type Person = { id: string; name: string };

export function SavingForm({ people }: { people: Person[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
    const result = await createSavingAction(formData);
    if (result.ok) {
      router.push(`/ahorros/${result.data.id}`);
    }
    return result;
  }, null as ActionResult<{ id: string }> | null);

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <TextField isRequired fullWidth name="name">
        <Label>Nombre</Label>
        <Input placeholder="Viaje, fondo de emergencias…" />
      </TextField>
      <TextField fullWidth name="description">
        <Label>Para qué (opcional)</Label>
        <Input />
      </TextField>
      <TextField isRequired fullWidth name="targetAmount">
        <Label>Meta</Label>
        <Input inputMode="decimal" />
      </TextField>
      <TextField fullWidth name="targetDate" type="date">
        <Label>Fecha objetivo (opcional)</Label>
        <Input />
      </TextField>
      {people.length > 0 ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm text-muted">Compartir con</legend>
          {people.map((person) => (
            <label key={person.id} className="flex items-center gap-2 text-sm">
              <input name="participantUserIds" type="checkbox" value={person.id} />
              {person.name}
            </label>
          ))}
        </fieldset>
      ) : null}
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit">
        {pending ? 'Guardando…' : 'Crear ahorro'}
      </Button>
    </Form>
  );
}
