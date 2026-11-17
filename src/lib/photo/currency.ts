/** Normalize boundary markers only; never parse, convert or reformat the amount. */
export function displayPrice(text: string, selectedCurrency: string) {
  const currency = selectedCurrency.trim();
  const escaped = currency.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const marker = `(?:${escaped ? `${escaped}|` : ''}R\\$|US\\$|CA\\$|AU\\$|BRL|USD|EUR|GBP|\\p{Sc})`;
  const boundary = new RegExp(`^(?:${marker}\\s*)+|(?:\\s*${marker})+$`, 'gu');
  const amount = text.trim().replace(boundary, '').trim();
  return amount ? `${currency} ${amount}`.trim() : '';
}