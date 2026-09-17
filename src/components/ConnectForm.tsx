'use client';

import { useActionState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { connectByCodeAction } from '@/app/actions/relationships';
import type { ActionResult } from '@/lib/actionResult';

export function ConnectForm() {
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult<unknown> | null, formData: FormData) => {
    return connectByCodeAction(formData);
  }, null as ActionResult<unknown> | null);

  return (
    <Form action={formAction} className="mt-4 flex flex-col gap-4">
      <TextField isRequired fullWidth name="code">
        <Label>Código de la otra persona</Label>
        <Input autoCapitalize="characters" placeholder="K7P-M2Q" />
      </TextField>
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Listo, ya quedaron vinculados.</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit">
        {pending ? 'Vinculando…' : 'Agregar persona'}
      </Button>
    </Form>
  );
}
