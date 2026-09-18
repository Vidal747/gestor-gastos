'use client';

import { useActionState, useState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { ListBox } from '@heroui/react/list-box';
import { Select } from '@heroui/react/select';
import { TextField } from '@heroui/react/textfield';
import Decimal from 'decimal.js';

import { deleteIncomeAction, updateIncomeAction } from '@/app/actions/incomes';
import { formatCOP, formatDate } from '@/lib/format';
import type { ActionResult } from '@/lib/actionResult';

const CATEGORIES = [
  { key: 'SALARY', label: 'Salario' },
  { key: 'FREELANCE', label: 'Freelance' },
  { key: 'REFUND', label: 'Reembolso' },
  { key: 'SALE', label: 'Venta' },
  { key: 'EXTRA', label: 'Extra' },
  { key: 'OTHER', label: 'Otro' },
];

const categoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? key;

type IncomeItem = {
  id: string;
  description: string;
  category: string;
  amount: Decimal;
  date: Date;
  notes: string | null;
};

export function IncomeList({ incomes }: { incomes: IncomeItem[] }) {
  if (incomes.length === 0) {
    return <p className="text-sm text-muted">Todavía no hay ingresos registrados.</p>;
  }

  return (
    <ul className="grid gap-2">
      {incomes.map((income) => (
        <IncomeRow key={income.id} income={income} />
      ))}
    </ul>
  );
}

function IncomeRow({ income }: { income: IncomeItem }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      const result = await updateIncomeAction(formData);
      if (result.ok) {
        setEditing(false);
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      return deleteIncomeAction(formData);
    },
    null as ActionResult<{ id: string }> | null,
  );

  if (editing) {
    return (
      <li className="rounded-2xl border border-border p-4">
        <Form action={updateAction} className="flex flex-col gap-3">
          <input name="incomeId" type="hidden" value={income.id} />
          <TextField fullWidth defaultValue={income.description} name="description">
            <Label>Descripción</Label>
            <Input />
          </TextField>
          <Select className="w-full" defaultSelectedKey={income.category} name="category">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField fullWidth defaultValue={income.amount.toFixed(2)} name="amount">
              <Label>Valor</Label>
              <Input inputMode="decimal" />
            </TextField>
            <TextField
              fullWidth
              defaultValue={income.date.toISOString().slice(0, 10)}
              name="date"
              type="date"
            >
              <Label>Fecha</Label>
              <Input />
            </TextField>
          </div>
          {updateState && !updateState.ok ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{updateState.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            <Button isPending={updatePending} type="submit">
              {updatePending ? '…' : 'Guardar'}
            </Button>
            <Button type="button" variant="ghost" onPress={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </Form>
      </li>
    );
  }

  if (confirming) {
    return (
      <li className="rounded-2xl border border-danger/30 p-4">
        <Form action={deleteAction} className="flex flex-col gap-3">
          <input name="incomeId" type="hidden" value={income.id} />
          <p className="text-sm text-muted">¿Eliminar este ingreso?</p>
          {deleteState && !deleteState.ok ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{deleteState.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            <Button isPending={deletePending} type="submit" variant="danger">
              {deletePending ? '…' : 'Eliminar'}
            </Button>
            <Button type="button" variant="ghost" onPress={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </Form>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl p-4 hover:bg-surface">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{income.description}</p>
        <p className="text-xs text-muted">
          {formatDate(income.date)} · {categoryLabel(income.category)}
          {income.notes ? ` · ${income.notes}` : ''}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-serif text-lg text-success">{formatCOP(income.amount)}</span>
        <Button variant="ghost" onPress={() => setEditing(true)}>
          ✎
        </Button>
        <Button variant="ghost" onPress={() => setConfirming(true)}>
          ✕
        </Button>
      </div>
    </li>
  );
}
