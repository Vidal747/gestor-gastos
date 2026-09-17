'use client';

import { useActionState, useState } from 'react';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { Table } from '@heroui/react/table';
import { TextField } from '@heroui/react/textfield';
import Decimal from 'decimal.js';

import { createPurchaseAction, previewPurchaseAction } from '@/app/actions/cards';
import { formatCOP, formatDate } from '@/lib/format';
import type { ActionResult } from '@/lib/actionResult';
import type { CalendarDate } from '@/lib/finance';

type PreviewRow = {
  installmentNumber: number;
  principal: Decimal;
  interest: Decimal;
  total: Decimal;
  dueDate: CalendarDate;
};

type FormState = ActionResult<{ id?: string; schedule?: PreviewRow[] }>;

const todayIso = () => new Date().toISOString().slice(0, 10);

export function PurchaseForm({ cardId }: { cardId: string }) {
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [state, formAction, pending] = useActionState(async (_prev: FormState | null, formData: FormData): Promise<FormState> => {
    const intent = String(formData.get('intent'));
    if (intent === 'preview') {
      const result = await previewPurchaseAction(formData);
      if (result.ok) {
        setPreview(result.data.schedule);
      }
      return result;
    }
    const result = await createPurchaseAction(formData);
    if (result.ok) {
      setPreview(null);
    }
    return result;
  }, null as FormState | null);

  return (
    <Form action={formAction} className="mt-4 flex flex-col gap-4">
      <input name="cardId" type="hidden" value={cardId} />
      <TextField isRequired fullWidth name="description">
        <Label>Qué compraste</Label>
        <Input placeholder="Mercado, vuelo, celular…" />
      </TextField>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField isRequired fullWidth name="totalAmount">
          <Label>Valor</Label>
          <Input inputMode="decimal" />
        </TextField>
        <TextField isRequired fullWidth defaultValue={todayIso()} name="purchaseDate" type="date">
          <Label>Fecha de la compra</Label>
          <Input />
        </TextField>
      </div>
      <TextField isRequired fullWidth defaultValue="6" name="installments" type="number">
        <Label>Número de cuotas</Label>
        <Input min={1} />
      </TextField>
      {preview ? (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Vista previa de cuotas">
              <Table.Header>
                <Table.Column isRowHeader>#</Table.Column>
                <Table.Column>Vence</Table.Column>
                <Table.Column>Capital</Table.Column>
                <Table.Column>Interés</Table.Column>
                <Table.Column>Total</Table.Column>
              </Table.Header>
              <Table.Body>
                {preview.map((row) => (
                  <Table.Row key={row.installmentNumber}>
                    <Table.Cell>{row.installmentNumber}</Table.Cell>
                    <Table.Cell>{formatDate(new Date(row.dueDate.year, row.dueDate.month - 1, row.dueDate.day))}</Table.Cell>
                    <Table.Cell>{formatCOP(row.principal)}</Table.Cell>
                    <Table.Cell>{formatCOP(row.interest)}</Table.Cell>
                    <Table.Cell>{formatCOP(row.total)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      ) : null}
      {state && !state.ok ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{state.message}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button name="intent" type="submit" value="preview" variant="secondary">
          Ver cuotas
        </Button>
        <Button isPending={pending} name="intent" type="submit" value="create">
          {pending ? 'Guardando…' : 'Registrar compra'}
        </Button>
      </div>
    </Form>
  );
}
