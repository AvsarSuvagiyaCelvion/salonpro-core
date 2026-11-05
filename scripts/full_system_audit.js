const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://salonpro-plum.vercel.app';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'audit_screenshots');
const ARTIFACT_DIR = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\91e0305b-2513-4873-9270-baab6bb254be';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function runAudit() {
  console.log('🚀 Starting Full SalonPro System Audit & Visual Verification...');
  console.log(`Target: ${BASE_URL}\n`);

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome',
  });

  const auditReport = [];

  // Helper to test a page
  async function testPage(page, urlPath, pageName, viewportKey, theme = 'dark') {
    const vp = VIEWPORTS[viewportKey];
    await page.setViewportSize(vp);

    const consoleErrors = [];
    const onConsole = (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    };
    page.on('console', onConsole);

    const fullUrl = `${BASE_URL}${urlPath}`;
    let status = 'PASSED';
    let overflow = false;
    let screenshotName = `${pageName}_${viewportKey}_${theme}.png`;
    let screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);

    try {
      // Set theme in localStorage before navigation
      await page.addInitScript((t) => {
        try {
          localStorage.setItem('salonpro_theme', t);
          if (t === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        } catch (e) {}
      }, theme);

      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1000); // Wait for animations to settle

      // Check for horizontal overflow (causing content cut-off)
      overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Capture screenshot
      await page.screenshot({
        path: screenshotPath,
        fullPage: false, // captures the initial above-the-fold viewport
      });

      // Also copy to artifact dir so user can preview directly
      try {
        const artifactPath = path.join(ARTIFACT_DIR, screenshotName);
        fs.copyFileSync(screenshotPath, artifactPath);
      } catch (e) {}

      if (overflow) {
        status = 'WARNING (Horizontal Overflow)';
      }
    } catch (err) {
      status = `FAILED: ${err.message}`;
    } finally {
      page.off('console', onConsole);
    }

    const result = {
      path: urlPath,
      name: pageName,
      viewport: `${viewportKey} (${vp.width}x${vp.height})`,
      theme,
      status,
      overflow,
      consoleErrors: consoleErrors.length,
      screenshot: screenshotName,
    };

    console.log(`[${status}] ${pageName} (${viewportKey}, ${theme}) - Overflow: ${overflow ? 'YES' : 'NO'}`);
    auditReport.push(result);
    return result;
  }

  // 1. PUBLIC MARKETING & AUTH PAGES
  console.log('\n--- Auditing Public Marketing & Auth Pages ---');
  const pubContext = await browser.newContext();
  const pubPage = await pubContext.newPage();

  await testPage(pubPage, '/', 'LandingPage', 'desktop', 'dark');
  await testPage(pubPage, '/', 'LandingPage', 'mobile', 'dark');
  await testPage(pubPage, '/', 'LandingPage', 'desktop', 'light');

  await testPage(pubPage, '/login', 'OwnerLogin', 'desktop', 'dark');
  await testPage(pubPage, '/login', 'OwnerLogin', 'mobile', 'dark');

  await testPage(pubPage, '/register-salon', 'RegisterSalon', 'desktop', 'dark');
  await testPage(pubPage, '/register-salon', 'RegisterSalon', 'mobile', 'dark');

  await testPage(pubPage, '/admin/login', 'AdminLogin', 'desktop', 'dark');
  await testPage(pubPage, '/admin/login', 'AdminLogin', 'mobile', 'dark');

  await testPage(pubPage, '/terms', 'TermsPage', 'desktop', 'dark');
  await testPage(pubPage, '/privacy', 'PrivacyPage', 'desktop', 'dark');

  // 2. PUBLIC BOOKING WIZARD & CUSTOMER PORTAL
  console.log('\n--- Auditing Booking Flow & Customer Portal ---');
  await testPage(pubPage, '/portal', 'CustomerPortal', 'desktop', 'dark');
  await testPage(pubPage, '/portal', 'CustomerPortal', 'mobile', 'dark');

  await testPage(pubPage, '/dixa-beauty-salon', 'BookingWizard', 'desktop', 'dark');
  await testPage(pubPage, '/dixa-beauty-salon', 'BookingWizard', 'mobile', 'dark');

  await pubContext.close();

  // 3. SALON OWNER ERP DASHBOARD (/app)
  console.log('\n--- Auditing Salon Owner ERP Dashboard (/app) ---');
  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();

  // Login as Dixa Beauty Salon Owner
  await ownerPage.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  const testOwnerEmail = process.env.TEST_OWNER_EMAIL || process.env.OWNER_EMAIL || 'dixa@gmail.com';
  const testOwnerPassword = process.env.TEST_OWNER_PASSWORD || process.env.OWNER_PASSWORD || 'Salon@123';
  await ownerPage.fill('input[type="email"]', testOwnerEmail);
  await ownerPage.fill('input[type="password"]', testOwnerPassword);
  await ownerPage.click('button[type="submit"]');
  await ownerPage.waitForURL('**/app**', { timeout: 15000 });
  console.log('✓ Successfully authenticated Salon Owner session');

  const appSubpages = [
    { path: '/app', name: 'ERP_Dashboard' },
    { path: '/app/appointments', name: 'ERP_Appointments' },
    { path: '/app/billing', name: 'ERP_POS_Billing' },
    { path: '/app/live', name: 'ERP_Live_Kanban' },
    { path: '/app/customers', name: 'ERP_Customers_CRM' },
    { path: '/app/staff', name: 'ERP_Staff_Management' },
    { path: '/app/services', name: 'ERP_Services_Catalog' },
    { path: '/app/products', name: 'ERP_Products_Inventory' },
    { path: '/app/memberships', name: 'ERP_Memberships' },
    { path: '/app/reports', name: 'ERP_Daily_Reports' },
    { path: '/app/subscription', name: 'ERP_Subscription' },
    { path: '/app/settings', name: 'ERP_Salon_Settings' },
  ];

  for (const sp of appSubpages) {
    await testPage(ownerPage, sp.path, sp.name, 'desktop', 'dark');
    await testPage(ownerPage, sp.path, sp.name, 'mobile', 'dark');
  }

  await ownerContext.close();

  // 4. PLATFORM SUPER ADMIN PANEL (/admin)
  console.log('\n--- Auditing Super Admin Panel (/admin) ---');
  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  // Login as Super Admin
  await adminPage.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle' });
  const testAdminEmail = process.env.TEST_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'avsarsuvagiya968@gmail.com';
  const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || 'Admin@123';
  await adminPage.fill('input[type="email"]', testAdminEmail);
  await adminPage.fill('input[type="password"]', testAdminPassword);
  await adminPage.click('button[type="submit"]');
  await adminPage.waitForURL('**/admin**', { timeout: 15000 });
  console.log('✓ Successfully authenticated Super Admin session');

  const adminSubpages = [
    { path: '/admin', name: 'Admin_Overview' },
    { path: '/admin/salons', name: 'Admin_Salons' },
    { path: '/admin/owners', name: 'Admin_Owners' },
    { path: '/admin/analytics', name: 'Admin_Analytics' },
    { path: '/admin/plans', name: 'Admin_Plans' },
    { path: '/admin/security', name: 'Admin_Security' },
  ];

  for (const ap of adminSubpages) {
    await testPage(adminPage, ap.path, ap.name, 'desktop', 'dark');
    await testPage(adminPage, ap.path, ap.name, 'mobile', 'dark');
  }

  await adminContext.close();
  await browser.close();

  console.log('\n🎉 Audit Completed! Saving summary report...');
  const reportPath = path.join(SCREENSHOT_DIR, 'audit_summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2), 'utf8');

  console.log(`Audit Summary saved to: ${reportPath}`);
}

runAudit().catch(console.error);

