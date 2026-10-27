import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'supersecret-session-key-salonpro-2026-xyz'
);

export const COOKIE_NAME = 'salonpro_session';

export async function createSessionToken(payload: { email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

export const CUSTOMER_COOKIE_NAME = 'salonpro_customer_session';

export async function createCustomerSessionToken(payload: {
  customerId: string;
  mobile: string;
  name: string;
  salonId: string;
}) {
  return await new SignJWT({ ...payload, role: 'customer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

export async function verifyCustomerSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (payload.role !== 'customer') return null;
    return payload as unknown as {
      customerId: string;
      mobile: string;
      name: string;
      salonId: string;
      role: string;
    };
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// MAIN ADMIN (SUPER ADMIN) AUTHENTICATION REALM
// -------------------------------------------------------------
export const ADMIN_COOKIE_NAME = 'salonpro_admin_session';

export async function createAdminSessionToken(payload: { email: string; role?: string }) {
  return await new SignJWT({ ...payload, role: 'super_admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifyAdminSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    if (payload.role !== 'super_admin') return null;
    return payload as unknown as {
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}


