// Formatting helpers used across tables, cards and charts.

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const INR2 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });

export function toNumber(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : Number(v);
}

/** Compact currency (₹) — used in KPI cards / tables. */
export function currency(v: string | number | null | undefined, symbol = '₹'): string {
  return `${symbol}${INR.format(toNumber(v))}`;
}

export function currencyPrecise(v: string | number | null | undefined, symbol = '₹'): string {
  return `${symbol}${INR2.format(toNumber(v))}`;
}

export function number(v: string | number | null | undefined): string {
  return INR.format(toNumber(v));
}

export function percent(v: number | null | undefined, digits = 1): string {
  if (v == null) return '—';
  return `${v.toFixed(digits)}%`;
}

export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(v: string | Date | null | undefined): string {
  if (!v) return '—';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Input[type=date] value (yyyy-mm-dd) from an ISO string. */
export function toDateInputValue(v: string | Date | null | undefined): string {
  if (!v) return '';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function isLicenseExpired(expiry: string | Date): boolean {
  return new Date(expiry).getTime() < Date.now();
}

export function daysUntil(v: string | Date): number {
  const diff = new Date(v).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
