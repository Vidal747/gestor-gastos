'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert } from '@heroui/react/alert';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { payPurchaseAction } from '@/app/actions/cards';
import { payDebtAction } from '@/app/actions/debts';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button isPending={pending} type="submit">
      {pending ? 'Registrando…' : 'Registrar pago'}
    </Button>
  );
}

export function PayForm({
  kind,
  id,
  maxAmount,
  defaultAmount,
  onSuccess,
}: {
  kind: 'debt' | 'purchase';
  id: string;
  maxAmount: string;
  defaultAmount?: string;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const action = async (formData: FormData): Promise<void> => {
    setError(null);
    const result = await (kind === 'debt' ? payDebtAction(formData) : payPurchaseAction(formData));
    if (result.ok) {
      onSuccess?.();
    } else {
      setError(result.message);
    }
  };

  return (
    <Form action={action} className="flex flex-col gap-4">
      {kind === 'debt' ? <input name="debtId" type="hidden" value={id} /> : <input name="purchaseId" type="hidden" value={id} />}
      <TextField isRequired fullWidth name="amount">
        <Label>Valor a pagar (hasta {maxAmount})</Label>
        <Input inputMode="decimal" defaultValue={defaultAmount} placeholder="250000" />
      </TextField>
      <p className="-mt-2 text-xs text-muted">Acepta formato colombiano: 250.000 o 250.000,50</p>
      <TextField fullWidth name="notes">
        <Label>Nota opcional</Label>
        <Input />
      </TextField>
      {error ? (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
        </Alert>
      ) : null}
      <SubmitButton />
    </Form>
  );
}
