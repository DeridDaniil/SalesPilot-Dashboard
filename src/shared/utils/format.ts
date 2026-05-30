/* ── Formatting helpers ── */

const rubFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Format a number as Russian rubles, e.g. 4200000 → "4 200 000 ₽". */
export function formatRub(value: number): string {
  return rubFormatter.format(Number.isFinite(value) ? value : 0);
}

/** Compact ruble form for dense UI like chart axes, e.g. 4200000 → "4,2 млн ₽". */
export function formatRubCompact(value: number): string {
  return `${compactFormatter.format(Number.isFinite(value) ? value : 0)} ₽`;
}
