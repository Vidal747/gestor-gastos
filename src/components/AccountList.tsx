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

import { deleteAccountAction, updateAccountAction } from '@/app/actions/accounts';
import { formatCOP } from '@/lib/format';
import type { ActionResult } from '@/lib/actionResult';

type AccountItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  isDefault: boolean;
  balance: Decimal;
};

type TypeOption = { key: string; label: string };

export function AccountList({
  accounts,
  types,
}: {
  accounts: AccountItem[];
  types: TypeOption[];
}) {
  if (accounts.length === 0) {
    return <p className="text-sm text-muted">Todavía no hay cuentas registradas.</p>;
  }

  return (
    <ul className="grid gap-2">
      {accounts.map((account) => (
        <AccountRow key={account.id} account={account} types={types} />
      ))}
    </ul>
  );
}

function AccountRow({ account, types }: { account: AccountItem; types: TypeOption[] }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [updateState, updateAction, updatePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      const result = await updateAccountAction(formData);
      if (result.ok) {
        setEditing(false);
      }
      return result;
    },
    null as ActionResult<{ id: string }> | null,
  );

  const [deleteState, deleteAction, deletePending] = useActionState(
    async (_prev: ActionResult<{ id: string }> | null, formData: FormData) => {
      return deleteAccountAction(formData);
    },
    null as ActionResult<{ id: string }> | null,
  );

  const typeLabel = types.find((t) => t.key === account.type)?.label ?? account.type;

  if (editing) {
    return (
      <li className="rounded-2xl border border-border p-4">
        <Form action={updateAction} className="flex flex-col gap-3">
          <input name="accountId" type="hidden" value={account.id} />
          <TextField fullWidth defaultValue={account.name} name="name">
            <Label>Nombre</Label>
            <Input />
          </TextField>
          <Select className="w-full" defaultSelectedKey={account.type} name="type">
            <Label>Tipo</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {types.map((t) => (
                  <ListBox.Item key={t.key} id={t.key} textValue={t.label}>
                    {t.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
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
          <input name="accountId" type="hidden" value={account.id} />
          <p className="text-sm text-muted">
            {account.isDefault
              ? 'No se puede eliminar la cuenta por defecto.'
              : '¿Eliminar esta cuenta?'}
          </p>
          {deleteState && !deleteState.ok ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{deleteState.message}</Alert.Title>
              </Alert.Content>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            {!account.isDefault ? (
              <Button isPending={deletePending} type="submit" variant="danger">
                {deletePending ? '…' : 'Eliminar'}
              </Button>
            ) : null}
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
        <p className="truncate text-sm font-medium">
          {account.name}
          {account.isDefault ? ' · por defecto' : ''}
        </p>
        <p className="text-xs text-muted">{typeLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-serif text-lg">{formatCOP(account.balance)}</span>
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
