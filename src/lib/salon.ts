export function clearSalonCache() {
  // In-memory tenant cache invalidated
}

export async function getDefaultSalonId(): Promise<string> {
  throw new Error('getDefaultSalonId is deprecated and disabled for tenant security.');
}

