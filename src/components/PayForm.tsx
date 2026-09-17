'use client';

import { useFormStatus } from 'react-dom';
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
}: {
  kind: 'debt' | 'purchase';
  id: string;
  maxAmount: string;
}) {
  const action = async (formData: FormData): Promise<void> => {
    await (kind === 'debt' ? payDebtAction(formData) : payPurchaseAction(formData));
  };

  return (
    <Form action={action} className="flex flex-col gap-4">
      {kind === 'debt' ? <input name="debtId" type="hidden" value={id} /> : <input name="purchaseId" type="hidden" value={id} />}
      <TextField isRequired fullWidth name="amount">
        <Label>Valor a pagar (hasta {maxAmount})</Label>
        <Input inputMode="decimal" />
      </TextField>
      <TextField fullWidth name="notes">
        <Label>Nota opcional</Label>
        <Input />
      </TextField>
      <SubmitButton />
    </Form>
  );
}
