import { SignJWT } from 'jose';
import { BASE_URL, SESSION_SECRET } from './config.ts';

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(SESSION_SECRET);
}

// Token creation helpers
export async function createOwnerToken(payload: {
  userId: string;
  salonId: string;
  email: string;
  role: 'owner' | 'staff';
  salonSlug?: string;
}): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function createCustomerToken(payload: {
  customerId: string;
  mobile: string;
  name: string;
  salonId: string;
}): Promise<string> {
  return await new SignJWT({ ...payload, role: 'customer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecretKey());
}

export async function createAdminToken(payload: { email: string }): Promise<string> {
  return await new SignJWT({ ...payload, role: 'super_admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecretKey());
}

export async function createExpiredToken(payload: Record<string, any>): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
    .sign(getSecretKey());
}

export async function createTamperedToken(payload: Record<string, any>): Promise<string> {
  const fakeSecret = new TextEncoder().encode('wrong-tampered-secret-key-1234567890');
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(fakeSecret);
}

export interface ClientResponse {
  status: number;
  ok: boolean;
  statusText: string;
  headers: Headers;
  data: any;
  text: string;
}

export class QAClient {
  private cookieJar: Map<string, string> = new Map();
  public baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setCookie(name: string, value: string): void {
    this.cookieJar.set(name, value);
  }

  getCookie(name: string): string | undefined {
    return this.cookieJar.get(name);
  }

  clearCookies(): void {
    this.cookieJar.clear();
  }

  private buildCookieHeader(): string {
    const pairs: string[] = [];
    for (const [k, v] of this.cookieJar.entries()) {
      pairs.push(`${k}=${v}`);
    }
    return pairs.join('; ');
  }

  private captureCookies(headers: Headers): void {
    const rawCookies = headers.getSetCookie?.() || [];
    if (rawCookies.length > 0) {
      for (const cookieStr of rawCookies) {
        const firstPart = cookieStr.split(';')[0];
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx > 0) {
          const k = firstPart.slice(0, eqIdx).trim();
          const v = firstPart.slice(eqIdx + 1).trim();
          this.cookieJar.set(k, v);
        }
      }
    } else {
      const setCookie = headers.get('set-cookie');
      if (setCookie) {
        const firstPart = setCookie.split(';')[0];
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx > 0) {
          this.cookieJar.set(firstPart.slice(0, eqIdx).trim(), firstPart.slice(eqIdx + 1).trim());
        }
      }
    }
  }

  async request(
    method: string,
    endpoint: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      formData?: FormData;
      retries?: number;
    } = {}
  ): Promise<ClientResponse> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const retries = options.retries ?? 2;

    let attempt = 0;
    while (attempt <= retries) {
      attempt++;
      try {
        const headers: Record<string, string> = {
          ...options.headers,
        };

        const cookieHeader = this.buildCookieHeader();
        if (cookieHeader && !headers['Cookie'] && !headers['cookie']) {
          headers['Cookie'] = cookieHeader;
        }

        let body: any = undefined;
        if (options.formData) {
          body = options.formData;
        } else if (options.body !== undefined) {
          if (typeof options.body === 'string') {
            body = options.body;
          } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(options.body);
          }
        }

        const res = await fetch(url, {
          method,
          headers,
          body,
        });

        this.captureCookies(res.headers);

        const rawText = await res.text();
        let parsedData: any = null;
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          parsedData = rawText;
        }

        return {
          status: res.status,
          ok: res.ok,
          statusText: res.statusText,
          headers: res.headers,
          data: parsedData,
          text: rawText,
        };
      } catch (err: any) {
        const isTransient =
          err.code === 'ECONNRESET' ||
          err.code === 'ETIMEDOUT' ||
          err.cause?.code === 'ECONNRESET' ||
          err.cause?.code === 'ETIMEDOUT';

        if (isTransient && attempt <= retries) {
          await new Promise((r) => setTimeout(r, 200 * attempt));
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Request failed after ${retries} retries`);
  }

  get(endpoint: string, headers?: Record<string, string>) {
    return this.request('GET', endpoint, { headers });
  }

  post(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request('POST', endpoint, { body, headers });
  }

  patch(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request('PATCH', endpoint, { body, headers });
  }

  put(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request('PUT', endpoint, { body, headers });
  }

  delete(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.request('DELETE', endpoint, { body, headers });
  }

  postFormData(endpoint: string, formData: FormData, headers?: Record<string, string>) {
    return this.request('POST', endpoint, { formData, headers });
  }
}

