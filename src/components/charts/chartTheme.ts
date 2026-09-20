export const CHART_COLORS = {
  purple: '#ab6bc3',
  purpleDeep: '#5a1d7a',
  purpleSoft: '#73378b',
  green: '#6fc97a',
  red: '#e57373',
  amber: '#f0c674',
  blue: '#7aa5d2',
  muted: '#a0a0a0',
  grid: 'rgba(171, 107, 195, 0.15)',
  track: 'rgba(171, 107, 195, 0.12)',
} as const;

export const tooltipStyle = {
  backgroundColor: '#1c1c1e',
  border: '1px solid rgba(171, 107, 195, 0.25)',
  borderRadius: 12,
  fontSize: 12,
  color: '#e8e8e8',
} as const;

export const axisTickStyle = { fill: '#a0a0a0', fontSize: 11 } as const;

export const truncateLabel = (value: string, max = 12): string =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;
