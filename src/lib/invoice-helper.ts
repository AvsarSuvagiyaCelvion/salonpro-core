/**
 * SalonPro Invoice Branding & Numbering Helper
 * Resolves salon-specific prefixes and formats sequential invoice numbers.
 */

/**
 * Resolves the invoice prefix for a salon.
 * Priority:
 * 1. Explicit salon.invoice_prefix if configured (sanitized: uppercase alphanumeric + hyphens, 2-10 chars)
 * 2. Clean uppercase prefix derived from salon.slug (e.g. "palak-beauty-parlour" -> "PALAK")
 * 3. Clean uppercase prefix derived from salon.name (e.g. "Dixa Beauty Salon" -> "DIXA")
 * 4. Fallback: "INV"
 */
export function getSalonInvoicePrefix(salon: {
  invoice_prefix?: string | null;
  slug?: string | null;
  name?: string | null;
}): string {
  if (salon?.invoice_prefix && typeof salon.invoice_prefix === 'string' && salon.invoice_prefix.trim()) {
    const cleaned = salon.invoice_prefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (cleaned.length >= 2) return cleaned.slice(0, 10);
  }

  // Fallback 1: First segment of slug (e.g. "palak-beauty-parlour" -> "PALAK")
  if (salon?.slug && typeof salon.slug === 'string') {
    const slugParts = salon.slug.split('-').filter(Boolean);
    const firstPart = slugParts[0]?.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (firstPart && firstPart.length >= 2) {
      return firstPart.slice(0, 8);
    }
  }

  // Fallback 2: First word of salon name (e.g. "Dixa Beauty Salon" -> "DIXA")
  if (salon?.name && typeof salon.name === 'string') {
    const words = salon.name.trim().split(/\s+/).filter(Boolean);
    const firstWord = words[0]?.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (firstWord && firstWord.length >= 2) {
      return firstWord.slice(0, 8);
    }
  }

  return 'INV';
}

/**
 * Generates formatted invoice number (e.g. "PALAK-2026-0001")
 */
export function formatInvoiceNumber(
  prefix: string,
  year: number,
  sequence: number
): string {
  const cleanPrefix = (prefix || 'INV').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return `${cleanPrefix}-${year}-${sequence.toString().padStart(4, '0')}`;
}
