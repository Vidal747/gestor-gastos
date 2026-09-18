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

import { createIncomeAction } from '@/app/actions/incomes';
import type { ActionResult } from '@/lib/actionResult';

const CATEGORIES = [
  { key: 'SALARY', label: 'Salario' },
  { key: 'FREELANCE', label: 'Freelance' },
  { key: 'REFUND', label: 'Reembolso' },
  { key: 'SALE', label: 'Venta' },
  { key: 'EXTRA', label: 'Extra' },
  { key: 'OTHER', label: 'Otro' },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

export function IncomeForm({ onCreated }: { onCreated?: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      const result = await createIncomeAction(formData);
      if (result.ok) {
        onCreated?.();
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <TextField isRequired fullWidth name="description">
        <Label>De dónde vino</Label>
        <Input placeholder="Salario enero, freelance diseño…" />
      </TextField>
      <Select className="w-full" defaultSelectedKey="SALARY" name="category">
        <Label>Categoría</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {CATEGORIES.map((cat) => (
              <ListBox.Item key={cat.key} id={cat.key} textValue={cat.label}>
                {cat.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField isRequired fullWidth name="amount">
          <Label>Valor</Label>
          <Input inputMode="decimal" />
        </TextField>
        <TextField isRequired fullWidth defaultValue={todayIso()} name="date" type="date">
          <Label>Fecha</Label>
          <Input />
        </TextField>
      </div>
      <TextField fullWidth name="notes">
        <Label>Nota (opcional)</Label>
        <Input />
      </TextField>
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit">
        {pending ? 'Guardando…' : 'Registrar ingreso'}
      </Button>
    </Form>
  );
}
