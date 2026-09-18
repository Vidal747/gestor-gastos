'use client';

import { useActionState, useState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { deleteCardAction, updateCardAction } from '@/app/actions/cards';
import type { ActionResult } from '@/lib/actionResult';

export function EditCardForm({
  card,
}: {
  card: {
    id: string;
    name: string;
    bank: string;
    creditLimit: string;
    cutoffDay: number;
    dueDay: number;
    hasPurchases: boolean;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      const result = await updateCardAction(formData);
      if (result.ok) {
        setEditing(false);
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      return deleteCardAction(formData);
    },
    null as ActionResult<{ id: string }> | null,
  );

  if (editing) {
    return (
      <Form action={updateAction} className="flex flex-col gap-4">
        <input name="cardId" type="hidden" value={card.id} />
        <TextField isRequired fullWidth defaultValue={card.name} name="name">
          <Label>Cómo la reconoces</Label>
          <Input />
        </TextField>
        <TextField isRequired fullWidth defaultValue={card.bank} name="bank">
          <Label>Banco</Label>
          <Input />
        </TextField>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField isRequired fullWidth defaultValue={card.creditLimit} name="creditLimit">
            <Label>Cupo</Label>
            <Input inputMode="decimal" />
          </TextField>
          <TextField isRequired fullWidth defaultValue={String(card.cutoffDay)} name="cutoffDay" type="number">
            <Label>Día de corte</Label>
            <Input max={28} min={1} />
          </TextField>
          <TextField isRequired fullWidth defaultValue={String(card.dueDay)} name="dueDay" type="number">
            <Label>Día de pago</Label>
            <Input max={28} min={1} />
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
        <input name="cardId" type="hidden" value={card.id} />
        <p className="text-sm text-muted">
          {card.hasPurchases
            ? 'No se puede eliminar una tarjeta con compras activas. Liquidá o cancelá las compras primero.'
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
          {!card.hasPurchases ? (
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
