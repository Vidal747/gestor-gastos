'use client';

import { useActionState, useState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { deleteSavingAction, updateSavingAction } from '@/app/actions/savings';
import type { ActionResult } from '@/lib/actionResult';

export function EditSavingForm({
  saving,
}: {
  saving: {
    id: string;
    name: string;
    description: string | null;
    targetAmount: string;
    targetDate: string | null;
    hasContributions: boolean;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      const result = await updateSavingAction(formData);
      if (result.ok) {
        setEditing(false);
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      return deleteSavingAction(formData);
    },
    null as ActionResult<{ id: string }> | null,
  );

  if (editing) {
    return (
      <Form action={updateAction} className="flex flex-col gap-4">
        <input name="savingGoalId" type="hidden" value={saving.id} />
        <TextField isRequired fullWidth defaultValue={saving.name} name="name">
          <Label>Nombre</Label>
          <Input />
        </TextField>
        <TextField fullWidth defaultValue={saving.description ?? ''} name="description">
          <Label>Para qué (opcional)</Label>
          <Input />
        </TextField>
        <TextField isRequired fullWidth defaultValue={saving.targetAmount} name="targetAmount">
          <Label>Meta</Label>
          <Input inputMode="decimal" />
        </TextField>
        <TextField fullWidth defaultValue={saving.targetDate ?? ''} name="targetDate" type="date">
          <Label>Fecha objetivo (opcional)</Label>
          <Input />
        </TextField>
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
        <input name="savingGoalId" type="hidden" value={saving.id} />
        <p className="text-sm text-muted">
          {saving.hasContributions
            ? 'No se puede eliminar un ahorro con aportes registrados.'
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
          {!saving.hasContributions ? (
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
