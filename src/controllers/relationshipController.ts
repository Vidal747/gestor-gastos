import Decimal from 'decimal.js';

import { createConflictError, createNotFoundError, createValidationError } from '@/lib/errors';
import { formatInviteCode, normalizeInviteCode } from '@/lib/inviteCode';
import { canonicalUserPair, relationshipNet } from '@/lib/relationshipNet';
import { toMoney } from '@/lib/finance';

export type RelationshipUser = { id: string; name: string; inviteCode: string };

export type RelationshipStore = {
  user: {
    findUnique: (args: { where: { id: string } | { inviteCode: string } }) => Promise<RelationshipUser | null>;
  };
  userConnection: {
    findUnique: (args: {
      where: { lowUserId_highUserId: { lowUserId: string; highUserId: string } };
    }) => Promise<{ lowUserId: string; highUserId: string } | null>;
    findMany: (args: {
      where: { OR: Array<{ lowUserId: string } | { highUserId: string }> };
    }) => Promise<Array<{ lowUserId: string; highUserId: string }>>;
    create: (args: { data: { lowUserId: string; highUserId: string; createdByUserId: string } }) => Promise<unknown>;
  };
  debt: {
    findMany: (args: { where: { OR: Array<{ ownerUserId: string } | { counterpartyUserId: string }> } }) => Promise<
      Array<{
        ownerUserId: string;
        ownerRole: 'DEBTOR' | 'CREDITOR';
        counterpartyUserId: string | null;
        remainingAmount: Decimal | string | number;
      }>
    >;
  };
};

export type RelationshipView = {
  peer: { id: string; name: string; inviteCode: string; inviteCodeLabel: string };
  net: Decimal;
  direction: 'i_owe' | 'they_owe' | 'even';
};

const parseCode = (code: string): string => {
  const normalized = normalizeInviteCode(code);
  if (normalized.length !== 6) {
    throw createValidationError('El código debe tener 6 caracteres.');
  }
  return normalized;
};

export const connectByCode = async (
  code: string,
  currentUserId: string,
  deps: { prisma: RelationshipStore },
): Promise<RelationshipView> => {
  const inviteCode = parseCode(code);
  const peer = await deps.prisma.user.findUnique({ where: { inviteCode } });
  if (!peer) {
    throw createNotFoundError('No encontramos a nadie con ese código.');
  }
  if (peer.id === currentUserId) {
    throw createValidationError('Ese código es el tuyo.');
  }

  const pair = canonicalUserPair(currentUserId, peer.id);
  const existing = await deps.prisma.userConnection.findUnique({
    where: { lowUserId_highUserId: pair },
  });
  if (existing) {
    throw createConflictError('Ya tienes una relación con esta persona.');
  }

  await deps.prisma.userConnection.create({
    data: { ...pair, createdByUserId: currentUserId },
  });

  const list = await listRelationships(currentUserId, deps);
  const view = list.find((item) => item.peer.id === peer.id);
  if (!view) {
    throw createNotFoundError('No encontramos a nadie con ese código.');
  }
  return view;
};

export const listRelationships = async (
  currentUserId: string,
  deps: { prisma: RelationshipStore },
): Promise<RelationshipView[]> => {
  const rows = await deps.prisma.userConnection.findMany({
    where: { OR: [{ lowUserId: currentUserId }, { highUserId: currentUserId }] },
  });
  const debts = await deps.prisma.debt.findMany({
    where: { OR: [{ ownerUserId: currentUserId }, { counterpartyUserId: currentUserId }] },
  });

  const views: RelationshipView[] = [];
  for (const row of rows) {
    const peerId = row.lowUserId === currentUserId ? row.highUserId : row.lowUserId;
    const peer = await deps.prisma.user.findUnique({ where: { id: peerId } });
    if (!peer) {
      continue;
    }
    const signed = relationshipNet({ currentUserId, peerUserId: peerId, debts });
    const abs = toMoney(signed.abs());
    views.push({
      peer: {
        id: peer.id,
        name: peer.name,
        inviteCode: peer.inviteCode,
        inviteCodeLabel: formatInviteCode(peer.inviteCode),
      },
      net: abs,
      direction: signed.gt(0) ? 'they_owe' : signed.lt(0) ? 'i_owe' : 'even',
    });
  }

  return views.sort((left, right) => left.peer.name.localeCompare(right.peer.name, 'es'));
};
