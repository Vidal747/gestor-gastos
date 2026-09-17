import Decimal from 'decimal.js';

import { toMoney } from '@/lib/finance';

export const formatCOP = (value: Decimal | number | string): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(toMoney(value).toFixed(0)));

export const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

export const statusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'PARTIALLY_PAID':
      return 'En curso';
    case 'PAID':
      return 'Saldada';
    case 'OPEN':
      return 'Por pagar';
    case 'OVERDUE':
      return 'Vencida';
    case 'ACTIVE':
      return 'Activa';
    default:
      return status;
  }
};

export const relationshipCopy = (direction: 'i_owe' | 'they_owe' | 'even', amount: Decimal): string => {
  if (direction === 'even') {
    return 'Están a paz';
  }
  if (direction === 'i_owe') {
    return `Le debes ${formatCOP(amount)}`;
  }
  return `Te debe ${formatCOP(amount)}`;
};

export const statusChipColor = (status: string): 'default' | 'accent' | 'success' | 'warning' | 'danger' => {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'OVERDUE':
      return 'danger';
    case 'PARTIALLY_PAID':
      return 'accent';
    case 'PENDING':
    case 'OPEN':
      return 'warning';
    default:
      return 'default';
  }
};

export const directionChipColor = (
  direction: 'i_owe' | 'they_owe' | 'even',
): 'default' | 'success' | 'danger' => {
  if (direction === 'i_owe') {
    return 'danger';
  }
  if (direction === 'they_owe') {
    return 'success';
  }
  return 'default';
};

export const debtStance = (
  debt: {
    ownerUserId: string;
    ownerRole: 'DEBTOR' | 'CREDITOR';
    ownerName: string;
    counterpartyLabel: string;
  },
  currentUserId: string,
): { iOwe: boolean; otherName: string; headline: string } => {
  const iOwe = debt.ownerUserId === currentUserId ? debt.ownerRole === 'DEBTOR' : debt.ownerRole === 'CREDITOR';
  const otherName = debt.ownerUserId === currentUserId ? debt.counterpartyLabel : debt.ownerName;
  return {
    iOwe,
    otherName,
    headline: iOwe ? `Le debes a ${otherName}` : `Te debe ${otherName}`,
  };
};
