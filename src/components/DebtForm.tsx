'use client';

import { useActionState, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Fieldset } from '@heroui/react/fieldset';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { ListBox } from '@heroui/react/list-box';
import { Select } from '@heroui/react/select';
import { TextField } from '@heroui/react/textfield';
import { ToggleButton } from '@heroui/react/toggle-button';
import { ToggleButtonGroup } from '@heroui/react/toggle-button-group';
import { Typography } from '@heroui/react/typography';

import { createDebtAction } from '@/app/actions/debts';
import type { ActionResult } from '@/lib/actionResult';
import { buildMonthlyDebtSchedule, toCalendarDate } from '@/lib/finance';
import { formatCOP } from '@/lib/format';

type Person = { id: string; name: string; inviteCodeLabel: string };
type Row = { key: string; amount: string; due: string };

const newRow = (): Row => ({ key: `${Date.now()}-${Math.random().toString(16).slice(2)}`, amount: '', due: '' });

export function DebtForm({ people, defaultPeerId }: { people: Person[]; defaultPeerId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'person' | 'outsider'>(defaultPeerId || people.length > 0 ? 'person' : 'outsider');
  const [scheduleKind, setScheduleKind] = useState<'monthly' | 'manual'>('monthly');
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [dueDay, setDueDay] = useState('30');
  const [count, setCount] = useState('12');
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
    const result = await createDebtAction(formData);
    if (result.ok) {
      router.push(`/deudas/${result.data.id}`);
    }
    return result;
  }, null as ActionResult<{ id: string }> | null);

  const preview = useMemo(() => {
    const day = Number(dueDay);
    const months = Number(count);
    if (!monthlyAmount || !Number.isInteger(day) || day < 1 || day > 31 || !Number.isInteger(months) || months < 1) {
      return [];
    }
    try {
      return buildMonthlyDebtSchedule({
        amount: monthlyAmount,
        dueDay: day,
        count: months,
        from: toCalendarDate(new Date()),
      });
    } catch {
      return [];
    }
  }, [monthlyAmount, dueDay, count]);

  return (
    <Form action={formAction} className="flex flex-col gap-4">
      <input name="scheduleKind" type="hidden" value={scheduleKind} />
      <TextField isRequired fullWidth name="description">
        <Label>¿Qué fue?</Label>
        <Input placeholder="Cena, arriendo, préstamo…" />
      </TextField>
      <ToggleButtonGroup
        disallowEmptySelection
        isDetached
        selectedKeys={new Set([mode])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (next === 'person' || next === 'outsider') {
            setMode(next);
          }
        }}
      >
        <ToggleButton id="person">Una persona vinculada</ToggleButton>
        <ToggleButton id="outsider">Banco u otra entidad</ToggleButton>
      </ToggleButtonGroup>
      {mode === 'person' && people.length === 0 ? (
        <Typography color="muted" type="body-sm">
          Primero vincula a alguien en Personas. O elige banco u otra entidad.
        </Typography>
      ) : null}
      {mode === 'person' && people.length > 0 ? (
        <Select
          isRequired
          className="w-full"
          defaultSelectedKey={defaultPeerId}
          name="counterpartyUserId"
          placeholder="Elige una persona"
        >
          <Label>Con quién</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {people.map((person) => (
                <ListBox.Item key={person.id} id={person.id} textValue={`${person.name} ${person.inviteCodeLabel}`}>
                  {person.name} · {person.inviteCodeLabel}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      ) : null}
      {mode === 'outsider' ? (
        <TextField isRequired fullWidth name="counterpartyName">
          <Label>Nombre</Label>
          <Input placeholder="Bancolombia, tienda, papá…" />
        </TextField>
      ) : null}
      <Select className="w-full" defaultSelectedKey="DEBTOR" name="ownerRole">
        <Label>El sentido de la cuenta</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="DEBTOR" textValue="Yo debo">
              Yo debo
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="CREDITOR" textValue="Me deben">
              Me deben
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      <ToggleButtonGroup
        disallowEmptySelection
        isDetached
        selectedKeys={new Set([scheduleKind])}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (next === 'monthly' || next === 'manual') {
            setScheduleKind(next);
          }
        }}
      >
        <ToggleButton id="monthly">Se cobra cada mes</ToggleButton>
        <ToggleButton id="manual">Cuotas a mano</ToggleButton>
      </ToggleButtonGroup>
      {scheduleKind === 'monthly' ? (
        <>
          <TextField isRequired fullWidth name="installmentAmount" value={monthlyAmount} onChange={setMonthlyAmount}>
            <Label>Cuota</Label>
            <Input inputMode="decimal" placeholder="200000" />
          </TextField>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField isRequired fullWidth name="dueDay" value={dueDay} onChange={setDueDay}>
              <Label>Día de cobro (1-31)</Label>
              <Input max={31} min={1} type="number" />
            </TextField>
            <TextField isRequired fullWidth name="count" value={count} onChange={setCount}>
              <Label>Por cuántos meses</Label>
              <Input max={60} min={1} type="number" />
            </TextField>
          </div>
          {preview.length > 0 ? (
            <Typography color="muted" type="body-sm">
              {preview.length} cuotas de {formatCOP(preview[0].amount)}. Total {formatCOP(preview[0].amount.mul(preview.length))}.
              Primera vence el {preview[0].dueDate.day}/{preview[0].dueDate.month}/{preview[0].dueDate.year}.
            </Typography>
          ) : null}
        </>
      ) : (
        <>
          <TextField isRequired fullWidth name="originalAmount">
            <Label>Valor total</Label>
            <Input inputMode="decimal" />
          </TextField>
          <Fieldset>
            <Fieldset.Legend>Cuotas</Fieldset.Legend>
            <Fieldset.Group>
              {rows.map((row, index) => (
                <div key={row.key} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <TextField isRequired fullWidth name="installmentAmount">
                    <Label>Monto</Label>
                    <Input defaultValue={row.amount} />
                  </TextField>
                  <TextField isRequired fullWidth name="installmentDue" type="date">
                    <Label>Vence</Label>
                    <Input defaultValue={row.due} />
                  </TextField>
                  {rows.length > 1 ? (
                    <Button
                      className="self-end"
                      type="button"
                      variant="ghost"
                      onPress={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                    >
                      Quitar
                    </Button>
                  ) : null}
                </div>
              ))}
            </Fieldset.Group>
            <Fieldset.Actions>
              <Button type="button" variant="secondary" onPress={() => setRows((current) => [...current, newRow()])}>
                Otra cuota
              </Button>
            </Fieldset.Actions>
          </Fieldset>
        </>
      )}
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <Button isPending={pending} type="submit">
        {pending ? 'Guardando…' : 'Crear deuda'}
      </Button>
    </Form>
  );
}
