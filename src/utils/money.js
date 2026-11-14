export function formatMoney(amountCents) {
  const cents = Number(amountCents);
  if (Number.isNaN(cents)) {
    return '$0.00';
  }
  return `$${(cents / 100).toFixed(2)}`;
}