'use client';

import { Button } from '@heroui/react/button';

import { formatInviteCode } from '@/lib/inviteCode';

export function CopyCode({ code }: { code: string }) {
  const label = formatInviteCode(code);
  return (
    <Button
      type="button"
      variant="secondary"
      onPress={() => {
        void navigator.clipboard.writeText(label);
      }}
    >
      Copiar {label}
    </Button>
  );
}
