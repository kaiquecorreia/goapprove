// Purchase order amounts are Decimal(15, 2) and travel as strings so that no
// precision is lost between Postgres and the browser. The dashboard needs to
// subtract them (the "Outras" slice is the grand total minus the listed
// companies), so the arithmetic is done on integer cents rather than on floats.

const CENTS = 100n;

export function toCents(amount: string): bigint {
  const negative = amount.startsWith('-');
  const [whole, fraction = ''] = amount.replace('-', '').split('.');
  const paddedFraction = `${fraction}00`.slice(0, 2);
  const value = BigInt(whole || '0') * CENTS + BigInt(paddedFraction);

  return negative ? -value : value;
}

export function fromCents(cents: bigint): string {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / CENTS;
  const fraction = (absolute % CENTS).toString().padStart(2, '0');

  return `${negative ? '-' : ''}${whole}.${fraction}`;
}

export function sumAmounts(amounts: string[]): string {
  return fromCents(
    amounts.reduce((total, amount) => total + toCents(amount), 0n),
  );
}

export function subtractAmounts(minuend: string, subtrahend: string): string {
  return fromCents(toCents(minuend) - toCents(subtrahend));
}
