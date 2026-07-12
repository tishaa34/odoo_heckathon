/**
 * Minimal duration parser: "15m", "7d", "24h", "3600s", "500ms".
 * Returns milliseconds. Falls back to treating a bare number as ms.
 */
const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export default function ms(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/.exec(value.trim());
  if (!match) return 0;
  const amount = Number(match[1]);
  const unit = match[2] ?? 'ms';
  return amount * UNIT_MS[unit];
}
