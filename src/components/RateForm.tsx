'use client';

import { useActionState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { updateCardRateAction } from '@/app/actions/cards';
import type { ActionResult } from '@/lib/actionResult';

export function RateForm({ cardId, currentPercent }: { cardId: string; currentPercent: string }) {
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult<unknown> | null, formData: FormData) => {
    return updateCardRateAction(formData);
  }, null as ActionResult<unknown> | null);

  return (
    <Form action={formAction} className="mt-4 flex flex-col gap-4">
      <input name="cardId" type="hidden" value={cardId} />
      <TextField isRequired fullWidth defaultValue={currentPercent} name="annualRate">
        <Label>IEA vigente (%)</Label>
        <Input inputMode="decimal" />
      </TextField>
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit" variant="secondary">
        {pending ? 'Actualizando…' : 'Actualizar IEA'}
      </Button>
    </Form>
  );
}
