'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@heroui/react/button';
import { Form } from '@heroui/react/form';
import { Input } from '@heroui/react/input';
import { Label } from '@heroui/react/label';
import { TextField } from '@heroui/react/textfield';

import { addSavingContributionAction } from '@/app/actions/savings';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button isPending={pending} type="submit">
      {pending ? 'Registrando…' : 'Registrar aporte'}
    </Button>
  );
}

export function ContributionForm({ savingGoalId }: { savingGoalId: string }) {
  const action = async (formData: FormData): Promise<void> => {
    await addSavingContributionAction(formData);
  };

  return (
    <Form action={action} className="flex flex-col gap-4">
      <input name="savingGoalId" type="hidden" value={savingGoalId} />
      <TextField isRequired fullWidth name="amount">
        <Label>Valor</Label>
        <Input inputMode="decimal" />
      </TextField>
      <TextField fullWidth name="description">
        <Label>Nota opcional</Label>
        <Input />
      </TextField>
      <SubmitButton />
    </Form>
  );
}
