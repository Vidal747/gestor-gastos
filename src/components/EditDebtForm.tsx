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

import { deleteDebtAction, updateDebtAction } from '@/app/actions/debts';
import type { ActionResult } from '@/lib/actionResult';

type Person = { id: string; name: string; inviteCodeLabel: string };

export function EditDebtForm({
  debt,
  people,
  currentUserId,
}: {
  debt: {
    id: string;
    description: string;
    ownerRole: 'DEBTOR' | 'CREDITOR';
    counterpartyUserId: string | null;
    counterpartyName: string | null;
    counterpartyLabel: string;
  };
  people: Person[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const hasPayments = debt.counterpartyLabel !== 'alguien';

  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      const result = await updateDebtAction(formData);
      if (result.ok) {
        setEditing(false);
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      return deleteDebtAction(formData);
    },
    null as ActionResult<{ id: string }> | null,
  );

  if (editing) {
    return (
      <Form action={updateAction} className="flex flex-col gap-4">
        <input name="debtId" type="hidden" value={debt.id} />
        <TextField isRequired fullWidth defaultValue={debt.description} name="description">
          <Label>Descripción</Label>
          <Input />
        </TextField>
        <Select className="w-full" defaultSelectedKey={debt.ownerRole} name="ownerRole">
          <Label>Sentido</Label>
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
        {debt.counterpartyUserId && people.length > 0 ? (
          <Select className="w-full" defaultSelectedKey={debt.counterpartyUserId} name="counterpartyUserId">
            <Label>Con quién</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {people.map((person) => (
                  <ListBox.Item key={person.id} id={person.id} textValue={person.name}>
                    {person.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        ) : null}
        {debt.counterpartyName ? (
          <TextField fullWidth defaultValue={debt.counterpartyName} name="counterpartyName">
            <Label>Nombre de la entidad</Label>
            <Input />
          </TextField>
        ) : null}
        {updateState && !updateState.ok ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{updateState.message}</Alert.Title>
            </Alert.Content>
          </Alert>
        ) : null}
        <div className="flex gap-3">
          <Button isPending={updatePending} type="submit">
            {updatePending ? 'Guardando…' : 'Guardar'}
          </Button>
          <Button type="button" variant="ghost" onPress={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </Form>
    );
  }

  if (confirming) {
    return (
      <Form action={deleteAction} className="flex flex-col gap-4">
        <input name="debtId" type="hidden" value={debt.id} />
        <p className="text-sm text-muted">
          {hasPayments
            ? 'Esta deuda tiene pagos registrados. No se puede eliminar.'
            : '¿Estás seguro? Esta acción no se puede deshacer.'}
        </p>
        {deleteState && !deleteState.ok ? (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{deleteState.message}</Alert.Title>
            </Alert.Content>
          </Alert>
        ) : null}
        <div className="flex gap-3">
          {!hasPayments ? (
            <Button isPending={deletePending} type="submit" variant="danger">
              {deletePending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" onPress={() => setConfirming(false)}>
            Cancelar
          </Button>
        </div>
      </Form>
    );
  }

  return (
    <div className="flex gap-3">
      <Button type="button" variant="secondary" onPress={() => setEditing(true)}>
        Editar
      </Button>
      <Button type="button" variant="ghost" onPress={() => setConfirming(true)}>
        Eliminar
      </Button>
    </div>
  );
}
