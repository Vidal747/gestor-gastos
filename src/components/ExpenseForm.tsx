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
import { Typography } from '@heroui/react/typography';

import { createExpenseAction } from '@/app/actions/expenses';
import { formatCOP } from '@/lib/format';
import type { ActionResult } from '@/lib/actionResult';

type Person = { id: string; name: string };

type Participant = { userId: string; percentage: number };

const todayIso = () => new Date().toISOString().slice(0, 10);

export function ExpenseForm({ people }: { people: Person[] }) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [usePercentages, setUsePercentages] = useState(true);

  const [state, formAction, pending] = useActionState(
    async (_prev: ActionResult<unknown> | null, formData: FormData) => {
      return createExpenseAction(formData);
    },
    null as ActionResult<unknown> | null,
  );

  const togglePerson = (userId: string) => {
    setParticipants((prev) => {
      if (prev.some((p) => p.userId === userId)) {
        return prev.filter((p) => p.userId !== userId);
      }
      return [...prev, { userId, percentage: 0 }];
    });
  };

  const setPercentage = (userId: string, value: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.userId === userId ? { ...p, percentage: value } : p)),
    );
  };

  const totalPct = participants.reduce((sum, p) => sum + p.percentage, 0);

  if (people.length === 0) {
    return (
      <Typography color="muted" type="body-sm">
        Primero vinculá personas en Relaciones para dividir gastos.
      </Typography>
    );
  }

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <TextField isRequired fullWidth name="description">
        <Label>Qué gastaron</Label>
        <Input placeholder="Cena, supermercado, arriendo…" />
      </TextField>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField isRequired fullWidth name="totalAmount">
          <Label>Valor total</Label>
          <Input inputMode="decimal" />
        </TextField>
        <TextField isRequired fullWidth defaultValue={todayIso()} name="date" type="date">
          <Label>Fecha</Label>
          <Input />
        </TextField>
      </div>
      <input name="paymentMethod" type="hidden" value="CASH" />
      <Select className="w-full" defaultSelectedKey="FOOD" name="category">
        <Label>Categoría</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {[
              { key: 'FOOD', label: 'Comida' },
              { key: 'HOUSING', label: 'Vivienda' },
              { key: 'TRANSPORT', label: 'Transporte' },
              { key: 'UTILITIES', label: 'Servicios' },
              { key: 'ENTERTAINMENT', label: 'Entretenimiento' },
              { key: 'HEALTH', label: 'Salud' },
              { key: 'SHOPPING', label: 'Compras' },
              { key: 'TRAVEL', label: 'Viaje' },
              { key: 'OTHER', label: 'Otro' },
            ].map((cat) => (
              <ListBox.Item key={cat.key} id={cat.key} textValue={cat.label}>
                {cat.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      <div className="rounded-2xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <Label className="text-sm">Dividir entre</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              type="button"
              variant={usePercentages ? 'primary' : 'ghost'}
              onPress={() => setUsePercentages(true)}
            >
              %
            </Button>
            <Button
              size="sm"
              type="button"
              variant={!usePercentages ? 'primary' : 'ghost'}
              onPress={() => setUsePercentages(false)}
            >
              =
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          {people.map((person) => {
            const isSelected = participants.some((p) => p.userId === person.id);
            const pct = participants.find((p) => p.userId === person.id)?.percentage ?? 0;
            return (
              <div key={person.id} className="flex items-center gap-3">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <input
                    checked={isSelected}
                    className="h-4 w-4"
                    name="participantUserIds"
                    type="checkbox"
                    value={person.id}
                    onChange={() => togglePerson(person.id)}
                  />
                  {person.name}
                </label>
                {isSelected && usePercentages ? (
                  <input
                    className="w-16 rounded-lg border border-border bg-transparent px-2 py-1 text-sm text-right"
                    name="participantPercentages"
                    type="number"
                    value={pct || ''}
                    onChange={(e) => setPercentage(person.id, Number(e.target.value))}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
        {usePercentages && participants.length > 0 ? (
          <p className={`mt-2 text-xs ${Math.abs(totalPct - 100) > 0.01 ? 'text-danger' : 'text-muted'}`}>
            Total: {totalPct}% {Math.abs(totalPct - 100) > 0.01 ? '(debe sumar 100%)' : '✓'}
          </p>
        ) : null}
      </div>

      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      {state && state.ok ? (
        <Alert status="success">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Gasto registrado</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit">
        {pending ? 'Guardando…' : 'Registrar gasto'}
      </Button>
    </Form>
  );
}
