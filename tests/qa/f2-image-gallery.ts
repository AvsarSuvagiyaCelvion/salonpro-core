import crypto from 'crypto';
import { QAClient, createExpiredToken } from './client.ts';
import { query } from './config.ts';
import type { QADataFixtures, TestResult } from './types.ts';

// Helper binary generators for image validation
function createMinimalJpeg(): Buffer {
  return Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
    0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
    0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
    0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xd9,
  ]);
}

function createMinimalPng(): Buffer {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

function createMinimalWebp(): Buffer {
  // RIFF (4) + size (4) + WEBP (4) + VP8 (4)
  const header = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d,
    0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x02, 0x00, 0x34, 0x25,
  ]);
  return header;
}

export async function runFeature2Tests(fixtures: QADataFixtures): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const record = (
    id: string,
    name: string,
    passed: boolean,
    reason: string,
    startTime: number,
    extra?: { classification?: TestResult['classification']; expected?: string; actual?: string; likelyFile?: string; error?: string }
  ) => {
    results.push({
      id,
      feature: 'F2',
      name,
      status: passed ? 'PASS' : 'FAIL',
      reason,
      durationMs: Date.now() - startTime,
      ...extra,
    });
  };

  const ownerClient = new QAClient();
  ownerClient.setCookie('StudioDesk_session', fixtures.owner1.token);

  const owner2Client = new QAClient();
  owner2Client.setCookie('StudioDesk_session', fixtures.owner2.token);

  const customerClient = new QAClient();
  customerClient.setCookie('StudioDesk_customer_session', fixtures.customerA.token);

  const anonClient = new QAClient();

  // --------------------------------------------------------------------------
  // F2-01: Demo salon simulation - returns simulated success without DB/storage writes
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Demo salon owner client
      const demoOwnerClient = new QAClient();
      const demoToken = await (await import('./client.ts')).createOwnerToken({
        userId: crypto.randomUUID(),
        salonId: '00000000-0000-0000-0000-000000000001',
        email: 'demo@StudioDesk.test',
        role: 'owner',
        salonSlug: 'dixa-beauty-salon',
      });
      demoOwnerClient.setCookie('StudioDesk_session', demoToken);

      const fd = new FormData();
      const blob = new Blob([new Uint8Array(createMinimalJpeg())], { type: 'image/jpeg' });
      fd.append('file', blob, 'demo-logo.jpg');
      fd.append('type', 'logo');

      const res = await demoOwnerClient.postFormData('/api/upload', fd);

      const pass = res.status === 200 && res.data?.demo === true && typeof res.data?.url === 'string';

      if (pass) {
        record('F2-01', 'Demo salon simulation: returns simulated success without storage writes', true, 'Demo upload returned mock success with demo flag', t0);
      } else {
        record('F2-01', 'Demo salon simulation', false, `Status ${res.status}, data: ${JSON.stringify(res.data)}`, t0, {
          classification: 'APP BUG',
          expected: 'Status 200 with demo: true',
          actual: `Status ${res.status}, data=${JSON.stringify(res.data)}`,
          likelyFile: 'src/app/api/upload/route.ts',
        });
      }
    } catch (err: any) {
      record('F2-01', 'Demo salon simulation', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F2-02: Rejection checks: >400 KB, 0 bytes, fake extension (exe), SVG, HTML
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. > 400 KB file (420 KB)
      const bigBuffer = Buffer.concat([createMinimalJpeg(), Buffer.alloc(430 * 1024)]);
      const fdBig = new FormData();
      fdBig.append('file', new Blob([bigBuffer], { type: 'image/jpeg' }), 'large.jpg');
      const resBig = await ownerClient.postFormData('/api/upload', fdBig);

      // 2. 0 bytes file
      const fdZero = new FormData();
      fdZero.append('file', new Blob([], { type: 'image/jpeg' }), 'zero.jpg');
      const resZero = await ownerClient.postFormData('/api/upload', fdZero);

      // 3. Fake extension: Windows MZ executable renamed as .jpg
      const exeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0xff]);
      const fdExe = new FormData();
      fdExe.append('file', new Blob([exeBuffer], { type: 'image/jpeg' }), 'malicious.jpg');
      const resExe = await ownerClient.postFormData('/api/upload', fdExe);

      // 4. SVG injection
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const fdSvg = new FormData();
      fdSvg.append('file', new Blob([svgBuffer], { type: 'image/svg+xml' }), 'image.svg');
      const resSvg = await ownerClient.postFormData('/api/upload', fdSvg);

      // 5. Missing file field
      const fdEmpty = new FormData();
      fdEmpty.append('type', 'logo');
      const resEmpty = await ownerClient.postFormData('/api/upload', fdEmpty);

      // 6. No auth
      const resNoAuth = await anonClient.postFormData('/api/upload', fdEmpty);

      const pass = resBig.status === 400 &&
        resZero.status === 400 &&
        resExe.status === 400 &&
        resSvg.status === 400 &&
        resEmpty.status === 400 &&
        resNoAuth.status === 401;

      if (pass) {
        record('F2-02', 'Upload rejections: >400KB, 0 bytes, EXE magic bytes, SVG, missing file, unauth', true, 'All invalid file uploads correctly rejected', t0);
      } else {
        record('F2-02', 'Upload rejections', false, `big=${resBig.status}, zero=${resZero.status}, exe=${resExe.status}, svg=${resSvg.status}, empty=${resEmpty.status}, noAuth=${resNoAuth.status}`, t0, {
          classification: 'APP BUG',
          expected: 'All 400 except unauth 401',
          actual: `big=${resBig.status}, zero=${resZero.status}, exe=${resExe.status}, svg=${resSvg.status}, empty=${resEmpty.status}, noAuth=${resNoAuth.status}`,
          likelyFile: 'src/app/api/upload/route.ts',
        });
      }
    } catch (err: any) {
      record('F2-02', 'Upload rejections', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F2-03: Folder Isolation & Delete Security
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. Salon 1 owner attempts to delete file belonging to Salon 2
      const deleteCrossSalonRes = await ownerClient.delete('/api/upload', {
        storage_path: `salons/${fixtures.salon2.id}/logo-xyz.jpg`,
      });

      // 2. Customer attempts to delete file in salon owner folder
      const deleteOwnerByCustomerRes = await customerClient.delete('/api/upload', {
        storage_path: `salons/${fixtures.salon1.id}/logo-xyz.jpg`,
      });

      // 3. Path traversal attempt (../)
      const deleteTraversalRes = await ownerClient.delete('/api/upload', {
        storage_path: `salons/${fixtures.salon1.id}/../../etc/passwd`,
      });

      const pass = deleteCrossSalonRes.status === 403 &&
        deleteOwnerByCustomerRes.status === 403 &&
        deleteTraversalRes.status === 403;

      if (pass) {
        record('F2-03', 'Storage delete isolation: cross-tenant, customer-to-owner, traversal blocked (403)', true, 'Strict directory prefix validation enforced', t0);
      } else {
        record('F2-03', 'Storage delete isolation', false, `crossSalon=${deleteCrossSalonRes.status}, customerToOwner=${deleteOwnerByCustomerRes.status}, traversal=${deleteTraversalRes.status}`, t0, {
          classification: 'APP BUG',
          expected: 'All status 403 Forbidden',
          actual: `crossSalon=${deleteCrossSalonRes.status}, customerToOwner=${deleteOwnerByCustomerRes.status}, traversal=${deleteTraversalRes.status}`,
          likelyFile: 'src/app/api/upload/route.ts',
        });
      }
    } catch (err: any) {
      record('F2-03', 'Storage delete isolation', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F2-04: Gallery limit - 5 photos OK, 6th rejected
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // Seed 5 photos directly for Salon 1
      await query('DELETE FROM salon_photos WHERE salon_id = $1::uuid', [fixtures.salon1.id]);

      for (let i = 1; i <= 5; i++) {
        await query(`
          INSERT INTO salon_photos (id, salon_id, url, storage_path, sort_order)
          VALUES ($1::uuid, $2::uuid, $3::text, $4::text, $5::int)
        `, [
          crypto.randomUUID(),
          fixtures.salon1.id,
          `https://mneftepouqtsyfwgfsyb.supabase.co/storage/v1/object/public/salon-media/salons/${fixtures.salon1.id}/gallery/photo-${i}.webp`,
          `salons/${fixtures.salon1.id}/gallery/photo-${i}.webp`,
          i,
        ]);
      }

      // Try uploading 6th gallery photo via /api/upload
      const fd = new FormData();
      fd.append('file', new Blob([new Uint8Array(createMinimalJpeg())], { type: 'image/jpeg' }), 'photo-6.jpg');
      fd.append('type', 'gallery');

      const resUpload6 = await ownerClient.postFormData('/api/upload', fd);

      // Try adding 6th via /api/settings/photos
      const resSettingsPhoto6 = await ownerClient.post('/api/settings/photos', {
        url: `https://mneftepouqtsyfwgfsyb.supabase.co/storage/v1/object/public/salon-media/salons/${fixtures.salon1.id}/gallery/photo-6.webp`,
        storage_path: `salons/${fixtures.salon1.id}/gallery/photo-6.webp`,
      });

      const pass = resUpload6.status === 400 && resSettingsPhoto6.status === 400;

      if (pass) {
        record('F2-04', 'Gallery limit: 5 photos maximum, 6th photo rejected by upload & settings API', true, 'Enforced MAX_GALLERY_PHOTOS = 5', t0);
      } else {
        record('F2-04', 'Gallery limit enforcement', false, `upload6=${resUpload6.status}, settings6=${resSettingsPhoto6.status}`, t0, {
          classification: 'APP BUG',
          expected: 'Both status 400',
          actual: `upload6=${resUpload6.status}, settings6=${resSettingsPhoto6.status}`,
          likelyFile: 'src/app/api/upload/route.ts',
        });
      }
    } catch (err: any) {
      record('F2-04', 'Gallery limit check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F2-05: Stored URL rules & Public API gallery return
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. Reject data: URI in logo_url via /api/settings
      const resDataUri = await ownerClient.put('/api/settings', {
        logo_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });

      // 2. Public API returns salon gallery photos
      const publicRes = await anonClient.get(`/api/public/${fixtures.salon1.slug}`);
      const photos = publicRes.data?.photos || [];

      const pass = resDataUri.status === 400 &&
        publicRes.status === 200 &&
        Array.isArray(photos) &&
        photos.length === 5;

      if (pass) {
        record('F2-05', 'Stored URL rules (data: URI rejected) & public API returns gallery', true, 'data: URI blocked with 400 and public API returned 5 gallery photos', t0);
      } else {
        record('F2-05', 'Stored URL rules and public API gallery', false, `dataUriStatus=${resDataUri.status}, publicStatus=${publicRes.status}, photosCount=${photos.length}`, t0, {
          classification: 'APP BUG',
          expected: 'resDataUri=400, publicRes=200, photos.length=5',
          actual: `resDataUri=${resDataUri.status}, publicRes=${publicRes.status}, photos=${photos.length}`,
          likelyFile: 'src/app/api/settings/route.ts',
        });
      }
    } catch (err: any) {
      record('F2-05', 'Stored URL rules check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  return results;
}

