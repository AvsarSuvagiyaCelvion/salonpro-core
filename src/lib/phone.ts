/**
 * Canonical helper to normalize mobile numbers across SalonPro.
 * - Strips all non-digit characters
 * - Drops leading country code (91) if 12 digits
 * - Drops leading 0 if 11 digits
 * - Requires exactly 10 digits
 * Returns 10-digit string if valid, otherwise null.
 */
export function normalizeMobile(input: string | null | undefined): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return digits;
  }
  return null;
}

