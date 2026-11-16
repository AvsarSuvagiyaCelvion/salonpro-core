import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import {
  verifySessionToken,
  COOKIE_NAME,
  verifyAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '@/lib/auth';

// Reserved subdomains that are part of the platform, not a tenant salon
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'admin',
  'api',
  'app',
  'login',
  'register',
  'register-salon',
  'assets',
  'static',
  'mail',
  'support',
  'docs',
  'status',
]);

// Public endpoints that do NOT require authentication
const PUBLIC_API_PREFIXES = [
  '/api/public/',
  '/api/demo/',
  '/api/health',
  '/api/plans',
  '/api/login',
  '/api/register',
  '/api/logout',
  '/api/customer/',
  '/api/upload',
  '/api/media/',
  '/api/admin/auth',
  '/api/admin/logout',
  '/api/subscription/razorpay/webhook',
];

/**
 * Extracts the tenant slug from the Host header.
 * Supports:
 * - Localhost dev: <slug>.localhost:3000
 * - Production: <slug>.salonpro.in
 * - Vercel previews: <slug>.<project>.vercel.app
 */
export function extractTenantFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(':')[0].toLowerCase();

  // 1. Local development: e.g. priya.localhost:3000
  if (hostname.endsWith('.localhost')) {
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
    }
    return null;
  }

  // 2. Production root domain: e.g. priya.salonpro.in
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salonpro.in').toLowerCase();
  if (hostname.endsWith(`.${rootDomain}`)) {
    const sub = hostname.slice(0, -(rootDomain.length + 1));
    const parts = sub.split('.');
    const tenantSlug = parts[parts.length - 1];
    if (tenantSlug && !RESERVED_SUBDOMAINS.has(tenantSlug)) {
      return tenantSlug;
    }
    return null;
  }

  // 3. Vercel deployment preview: e.g. priya.salonpro.vercel.app
  if (hostname.endsWith('.vercel.app')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const sub = parts[0];
      if (!RESERVED_SUBDOMAINS.has(sub)) return sub;
    }
  }

  return null;
}

interface CustomDomainEntry {
  slug: string | null;
  cachedAt: number;
}
const customDomainCache = new Map<string, CustomDomainEntry>();
const CUSTOM_DOMAIN_TTL = 60 * 1000; // 60-second in-memory cache

async function resolveCustomDomain(hostname: string): Promise<string | null> {
  const cached = customDomainCache.get(hostname);
  if (cached && Date.now() - cached.cachedAt < CUSTOM_DOMAIN_TTL) {
    return cached.slug;
  }

  try {
    const res = await query(
      `SELECT slug FROM salons WHERE custom_domain = $1 AND custom_domain_verified = true LIMIT 1`,
      [hostname]
    );
    const slug = res.rows.length > 0 ? res.rows[0].slug : null;
    customDomainCache.set(hostname, { slug, cachedAt: Date.now() });
    return slug;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();
  const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'salonpro.in').toLowerCase();
  let tenantSlug = extractTenantFromHost(host);

  // When host is not a subdomain of ROOT_DOMAIN, look up verified custom domain
  if (!tenantSlug) {
    const isStandardHost =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === rootDomain ||
      hostname === `www.${rootDomain}` ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith(`.${rootDomain}`) ||
      hostname.endsWith('.localhost');

    if (!isStandardHost) {
      tenantSlug = await resolveCustomDomain(hostname);
      if (!tenantSlug && !pathname.startsWith('/api/')) {
        // If unverified or not found, redirect to the root landing page
        const redirectUrl = new URL('/', `https://${rootDomain}`);
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Set up mutated request headers to pass tenant and host context downstream
  const requestHeaders = new Headers(request.headers);
  // Strip incoming client headers to prevent spoofing
  requestHeaders.delete('x-tenant-slug');
  requestHeaders.delete('x-current-host');

  requestHeaders.set('x-current-host', host);
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }

  // 1. MAIN ADMIN PANEL WEB PAGES (/admin)
  if (pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminSession = adminToken ? await verifyAdminSessionToken(adminToken) : null;

    if (pathname === '/admin/login') {
      if (adminSession) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (!adminSession) {
      const adminLoginUrl = new URL('/admin/login', request.url);
      adminLoginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // 2. SALON OWNER & STAFF WEB PAGES (/app)
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (pathname.startsWith('/app')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // If already logged in as salon owner, redirect /login or /salon-owner to /app
  if (pathname === '/login' || pathname === '/salon-owner') {
    if (session) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // 3. API ROUTE PROTECTION (/api/*)
  if (pathname.startsWith('/api/')) {
    // CSRF Defense: For state-changing requests, enforce that Origin matches the target host or allowed platform domains
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (stateChangingMethods.includes(request.method) && pathname !== '/api/subscription/razorpay/webhook') {
      const origin = request.headers.get('origin');
      if (origin) {
        try {
          const originHost = new URL(origin).host.toLowerCase().split(':')[0];
          const reqHost = host.toLowerCase().split(':')[0];

          const isAllowedOrigin =
            originHost === reqHost ||
            originHost.endsWith(`.${rootDomain}`) ||
            originHost.endsWith('.vercel.app') ||
            originHost === 'localhost' ||
            originHost.endsWith('.localhost') ||
            originHost === '127.0.0.1';

          if (!isAllowedOrigin) {
            return NextResponse.json(
              { error: 'Forbidden: Cross-site request rejected (CSRF check failed).' },
              { status: 403 }
            );
          }
        } catch {
          return NextResponse.json(
            { error: 'Forbidden: Malformed request origin header.' },
            { status: 403 }
          );
        }
      }
    }

    // Check if endpoint is public
    const isPublic = PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isPublic) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Admin API routes (/api/admin/*)
    if (pathname.startsWith('/api/admin/')) {
      const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
      const adminSession = adminToken ? await verifyAdminSessionToken(adminToken) : null;
      if (!adminSession) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin session required' },
          { status: 401 }
        );
      }
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Tenant API routes (/api/*)
    let hasToken = false;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7).trim();
      const verified = await verifySessionToken(bearerToken);
      if (verified) hasToken = true;
    }

    if (!hasToken && session) {
      hasToken = true;
    }

    if (!hasToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid session required' },
        { status: 401 }
      );
    }

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  }

  // 4. TENANT SUBDOMAIN REWRITES
  // When a visitor hits <slug>.salonpro.in or <slug>.localhost:3000
  if (tenantSlug) {
    // Path "/" -> rewrite to tenant showcase & booking page "/[slug]"
    if (pathname === '/') {
      const rewriteUrl = new URL(`/${tenantSlug}`, request.url);
      return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      });
    }

    // Path "/book" -> rewrite to "/book/[slug]"
    if (pathname === '/book' || pathname === '/book/') {
      const rewriteUrl = new URL(`/book/${tenantSlug}`, request.url);
      return NextResponse.rewrite(rewriteUrl, {
        request: { headers: requestHeaders },
      });
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

// Keep export for backward compatibility if any tooling looks for middleware
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml, robots.txt
     * - image assets (.svg, .png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
