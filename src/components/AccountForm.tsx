'use client';

import { useActionState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { ListBox } from '@heroui/react/list-box';
import { Select } from '@heroui/react/select';
import { TextField } from '@heroui/react/textfield';

import { createAccountAction } from '@/app/actions/accounts';
import type { ActionResult } from '@/lib/actionResult';

const TYPES = [
  { key: 'CHECKING', label: 'Cuenta corriente' },
  { key: 'SAVINGS', label: 'Ahorros' },
  { key: 'CASH', label: 'Efectivo' },
  { key: 'CREDIT', label: 'Crédito' },
  { key: 'INVESTMENT', label: 'Inversión' },
  { key: 'OTHER', label: 'Otra' },
];

const typeLabel = (key: string) => TYPES.find((t) => t.key === key)?.label ?? key;

export function AccountForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      return createAccountAction(formData);
    },
    null as ActionResult<{ id: string }> | null,
  );

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <TextField isRequired fullWidth name="name">
        <Label>Nombre</Label>
        <Input placeholder="Bancolombia, Nequi, efectivo…" />
      </TextField>
      <Select className="w-full" defaultSelectedKey="CHECKING" name="type">
        <Label>Tipo</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {TYPES.map((t) => (
              <ListBox.Item key={t.key} id={t.key} textValue={t.label}>
                {t.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit">
        {pending ? 'Guardando…' : 'Crear cuenta'}
      </Button>
    </Form>
  );
}

export { typeLabel, TYPES };
