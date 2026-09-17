'use client';

import { useActionState, useState } from 'react';
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

type Person = { id: string; name: string; inviteCodeLabel: string };
type Row = { amount: string; due: string };

export function DebtForm({ people, defaultPeerId }: { people: Person[]; defaultPeerId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<'person' | 'outsider'>(defaultPeerId || people.length > 0 ? 'person' : 'outsider');
  const [rows, setRows] = useState<Row[]>([{ amount: '', due: '' }]);
  const [state, formAction, pending] = useActionState(async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
    const result = await createDebtAction(formData);
    if (result.ok) {
      router.push(`/deudas/${result.data.id}`);
    }
    return result;
  }, null as ActionResult<{ id: string }> | null);

  return (
    <Form action={formAction} className="flex flex-col gap-4">
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
      <TextField isRequired fullWidth name="originalAmount">
        <Label>Valor total</Label>
        <Input inputMode="decimal" />
      </TextField>
      <Fieldset>
        <Fieldset.Legend>Cuotas</Fieldset.Legend>
        <Fieldset.Group>
          {rows.map((row, index) => (
            <div key={index} className="grid gap-3 sm:grid-cols-2">
              <TextField isRequired fullWidth name="installmentAmount">
                <Label>Monto</Label>
                <Input defaultValue={row.amount} />
              </TextField>
              <TextField isRequired fullWidth name="installmentDue" type="date">
                <Label>Vence</Label>
                <Input defaultValue={row.due} />
              </TextField>
            </div>
          ))}
        </Fieldset.Group>
        <Fieldset.Actions>
          <Button type="button" variant="secondary" onPress={() => setRows((current) => [...current, { amount: '', due: '' }])}>
            Otra cuota
          </Button>
        </Fieldset.Actions>
      </Fieldset>
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
