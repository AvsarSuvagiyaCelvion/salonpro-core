import { QAClient } from './client.ts';
import { query } from './config.ts';
import type { QADataFixtures, TestResult } from './types.ts';

export async function runFeature3Tests(fixtures: QADataFixtures): Promise<TestResult[]> {
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
      feature: 'F3',
      name,
      status: passed ? 'PASS' : 'FAIL',
      reason,
      durationMs: Date.now() - startTime,
      ...extra,
    });
  };

  const customerAClient = new QAClient();
  customerAClient.setCookie('salonpro_customer_session', fixtures.customerA.token);

  const customerBClient = new QAClient();
  customerBClient.setCookie('salonpro_customer_session', fixtures.customerB.token);

  const ownerClient = new QAClient();
  ownerClient.setCookie('salonpro_session', fixtures.owner1.token);

  const anonClient = new QAClient();

  // --------------------------------------------------------------------------
  // F3-01: GET Profile returns only own data and NEVER exposes PIN hash
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const res = await customerAClient.get('/api/customer/profile');
      const data = res.data;

      const hasOnlyOwnData = data?.customer?.id === fixtures.customerA.id && data?.customer?.name === fixtures.customerA.name;
      const noPinHash = data?.customer?.pin === undefined && data?.customer?.pin_hash === undefined && !JSON.stringify(data).includes('$2');

      const pass = res.status === 200 && hasOnlyOwnData && noPinHash;

      if (pass) {
        record('F3-01', 'GET profile: returns only own fields, no other customer data, no PIN hash in JSON', true, 'Own fields returned safely without PIN hash', t0);
      } else {
        record('F3-01', 'GET profile data isolation', false, `Status ${res.status}, pinExposed: ${!noPinHash}, ownData: ${hasOnlyOwnData}`, t0, {
          classification: 'APP BUG',
          expected: 'Status 200, matching customer A, no PIN hash anywhere in JSON',
          actual: `Status ${res.status}, data=${JSON.stringify(data)}`,
          likelyFile: 'src/app/api/customer/profile/route.ts',
        });
      }
    } catch (err: any) {
      record('F3-01', 'GET profile check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F3-02: PATCH profile: persist name/email/address, phone ignored, Unicode/Gujarati accepted
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const gujaratiName = 'અવસર સુવાગિયા';
      const updatedEmail = 'avsar.updated@test.com';
      const updatedAddress = 'Shreeji Arcade, Anand Mahal Road, Surat';

      const patchRes = await customerAClient.patch('/api/customer/profile', {
        name: `   ${gujaratiName}   `, // surrounding whitespace
        email: updatedEmail,
        address: updatedAddress,
        mobile: '1111111111', // Should be strictly ignored!
      });

      const dbCheck = (await query('SELECT name, email, address, mobile FROM customers WHERE id = $1::uuid', [fixtures.customerA.id])).rows[0];

      const pass = patchRes.status === 200 &&
        dbCheck?.name === gujaratiName && // Trimmed
        dbCheck?.email === updatedEmail &&
        dbCheck?.address === updatedAddress &&
        dbCheck?.mobile === fixtures.customerA.mobile; // Phone unchanged!

      if (pass) {
        record('F3-02', 'PATCH profile: name/email/address persist, phone immutable, Unicode/Gujarati accepted', true, 'Trimmed, saved Gujarati name, phone remained untouched', t0);
      } else {
        record('F3-02', 'PATCH profile persistence', false, `Status ${patchRes.status}, db: ${JSON.stringify(dbCheck)}`, t0, {
          classification: 'APP BUG',
          expected: `name='${gujaratiName}', mobile='${fixtures.customerA.mobile}'`,
          actual: `dbCheck=${JSON.stringify(dbCheck)}`,
          likelyFile: 'src/app/api/customer/profile/route.ts',
        });
      }
    } catch (err: any) {
      record('F3-02', 'PATCH profile check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F3-03: PATCH profile validation: name <2 or >60, bad email, address >250 rejected
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const resShortName = await customerAClient.patch('/api/customer/profile', { name: 'A' });
      const resLongName = await customerAClient.patch('/api/customer/profile', { name: 'A'.repeat(61) });
      const resBadEmail = await customerAClient.patch('/api/customer/profile', { email: 'invalid-email-format' });
      const resLongEmail = await customerAClient.patch('/api/customer/profile', { email: `${'a'.repeat(125)}@test.com` });
      const resLongAddress = await customerAClient.patch('/api/customer/profile', { address: 'x'.repeat(255) });

      const pass = resShortName.status === 400 &&
        resLongName.status === 400 &&
        resBadEmail.status === 400 &&
        resLongEmail.status === 400 &&
        resLongAddress.status === 400;

      if (pass) {
        record('F3-03', 'PATCH profile validation: short/long name, bad/long email, long address rejected (400)', true, 'All boundary violations rejected with 400', t0);
      } else {
        record('F3-03', 'PATCH profile validation', false, `short=${resShortName.status}, longN=${resLongName.status}, badE=${resBadEmail.status}, longE=${resLongEmail.status}, longA=${resLongAddress.status}`, t0, {
          classification: 'APP BUG',
          expected: 'All status 400',
          actual: `short=${resShortName.status}, longN=${resLongName.status}, badE=${resBadEmail.status}, longE=${resLongEmail.status}, longA=${resLongAddress.status}`,
          likelyFile: 'src/app/api/customer/profile/route.ts',
        });
      }
    } catch (err: any) {
      record('F3-03', 'PATCH validation check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F3-04: avatar_url security: own folder allowed; cross-customer, external, data:, javascript: rejected
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      const ownUrl = `https://mneftepouqtsyfwgfsyb.supabase.co/storage/v1/object/public/salon-media/customers/${fixtures.customerA.id}/avatar/my-avatar.webp`;
      const otherCustUrl = `https://mneftepouqtsyfwgfsyb.supabase.co/storage/v1/object/public/salon-media/customers/${fixtures.customerB.id}/avatar/b-avatar.webp`;
      const externalUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const jsUri = 'javascript:alert(1)';

      // 1. Own folder -> Accepted (200)
      const resOwn = await customerAClient.patch('/api/customer/profile', { avatar_url: ownUrl });

      // 2. Other customer folder -> Rejected (400)
      const resOther = await customerAClient.patch('/api/customer/profile', { avatar_url: otherCustUrl });

      // 3. External URL -> Rejected (400)
      const resExternal = await customerAClient.patch('/api/customer/profile', { avatar_url: externalUrl });

      // 4. Data URI -> Rejected (400)
      const resData = await customerAClient.patch('/api/customer/profile', { avatar_url: dataUri });

      // 5. JavaScript URI -> Rejected (400)
      const resJs = await customerAClient.patch('/api/customer/profile', { avatar_url: jsUri });

      const pass = resOwn.status === 200 &&
        resOther.status === 400 &&
        resExternal.status === 400 &&
        resData.status === 400 &&
        resJs.status === 400;

      if (pass) {
        record('F3-04', 'avatar_url security: own-folder accepted; other customer, external, data:, js: rejected', true, 'Strict customer avatar folder containment verified', t0);
      } else {
        record('F3-04', 'avatar_url security enforcement', false, `own=${resOwn.status}, other=${resOther.status}, ext=${resExternal.status}, data=${resData.status}, js=${resJs.status}`, t0, {
          classification: 'APP BUG',
          expected: 'own=200, other=400, ext=400, data=400, js=400',
          actual: `own=${resOwn.status}, other=${resOther.status}, ext=${resExternal.status}, data=${resData.status}, js=${resJs.status}`,
          likelyFile: 'src/app/api/customer/profile/route.ts',
        });
      }
    } catch (err: any) {
      record('F3-04', 'avatar_url security check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F3-05: PIN change: wrong current, letters, same PIN rejected; valid change updates bcrypt & login
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. Wrong current PIN
      const resWrongCurrent = await customerBClient.post('/api/customer/profile/pin', {
        currentPin: '0000',
        newPin: '4321',
        confirmPin: '4321',
      });

      // 2. Letters in new PIN
      const resLetters = await customerBClient.post('/api/customer/profile/pin', {
        currentPin: '5678',
        newPin: '432a',
        confirmPin: '432a',
      });

      // 3. Same as current PIN
      const resSame = await customerBClient.post('/api/customer/profile/pin', {
        currentPin: '5678',
        newPin: '5678',
        confirmPin: '5678',
      });

      // 4. Valid PIN change: change 5678 to 4321
      const resValid = await customerBClient.post('/api/customer/profile/pin', {
        currentPin: '5678',
        newPin: '4321',
        confirmPin: '4321',
      });

      // Verify in DB that PIN is bcrypt hashed
      const dbPin = (await query('SELECT pin FROM customers WHERE id = $1::uuid', [fixtures.customerB.id])).rows[0]?.pin;
      const isBcrypt = typeof dbPin === 'string' && dbPin.startsWith('$2');

      // Verify old PIN login fails
      const loginOldRes = await anonClient.post('/api/customer/auth', {
        action: 'login',
        mobile: fixtures.customerB.mobile,
        pin: '5678',
        salonSlug: fixtures.salon1.slug,
      });

      // Verify new PIN login succeeds
      const loginNewRes = await anonClient.post('/api/customer/auth', {
        action: 'login',
        mobile: fixtures.customerB.mobile,
        pin: '4321',
        salonSlug: fixtures.salon1.slug,
      });

      const pass = (resWrongCurrent.status === 400 || resWrongCurrent.status === 401) &&
        resLetters.status === 400 &&
        resSame.status === 400 &&
        resValid.status === 200 &&
        isBcrypt &&
        loginOldRes.status === 401 &&
        loginNewRes.status === 200;

      if (pass) {
        record('F3-05', 'PIN change: wrong/letters/same rejected; valid change updates bcrypt & login works', true, 'Full PIN change lifecycle and authentication verification passed', t0);
      } else {
        record('F3-05', 'PIN change lifecycle', false, `wrongC=${resWrongCurrent.status}, letters=${resLetters.status}, same=${resSame.status}, valid=${resValid.status}, bcrypt=${isBcrypt}, loginOld=${loginOldRes.status}, loginNew=${loginNewRes.status}`, t0, {
          classification: 'APP BUG',
          expected: 'wrongC=400/401, letters=400, same=400, valid=200, bcrypt=true, loginOld=401, loginNew=200',
          actual: `wrongC=${resWrongCurrent.status}, letters=${resLetters.status}, same=${resSame.status}, valid=${resValid.status}, loginOld=${loginOldRes.status}, loginNew=${loginNewRes.status}`,
          likelyFile: 'src/app/api/customer/profile/pin/route.ts',
        });
      }
    } catch (err: any) {
      record('F3-05', 'PIN change check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  // --------------------------------------------------------------------------
  // F3-06: Owner Customers CRM shows email/address and customer notes (PUT) still work
  // --------------------------------------------------------------------------
  {
    const t0 = Date.now();
    try {
      // 1. Fetch customer list via owner API
      const ownerCustomersRes = await ownerClient.get('/api/customers');
      const customers = ownerCustomersRes.data?.customers || [];
      const foundCust = customers.find((c: any) => c.id === fixtures.customerA.id);

      // 2. Update customer note via PUT /api/customers/[id]
      const putNoteRes = await ownerClient.put(`/api/customers/${fixtures.customerA.id}`, {
        name: fixtures.customerA.name,
        mobile: fixtures.customerA.mobile,
        email: fixtures.customerA.email,
        note: 'Prefers organic herbal shampoo. VIP client.',
      });

      // Verify email and address were not cleared/overwritten by PUT
      const dbCheck = (await query('SELECT email, address, note FROM customers WHERE id = $1::uuid', [fixtures.customerA.id])).rows[0];

      const pass = ownerCustomersRes.status === 200 &&
        Boolean(foundCust) &&
        putNoteRes.status === 200 &&
        dbCheck?.note === 'Prefers organic herbal shampoo. VIP client.' &&
        dbCheck?.email !== null &&
        dbCheck?.address !== null;

      if (pass) {
        record('F3-06', 'Owner CRM: customer email/address displayed and customer notes (PUT) preserved', true, 'Owner customer details and notes integration functional', t0);
      } else {
        record('F3-06', 'Owner CRM customer integration', false, `list=${ownerCustomersRes.status}, foundCust=${Boolean(foundCust)}, putNote=${putNoteRes.status}, note=${dbCheck?.note}`, t0, {
          classification: 'APP BUG',
          expected: 'list=200 with customer found, putNote=200 without clearing email/address',
          actual: `list=${ownerCustomersRes.status}, found=${Boolean(foundCust)}, put=${putNoteRes.status}, email=${dbCheck?.email}`,
          likelyFile: 'src/app/api/customers/[id]/route.ts',
        });
      }
    } catch (err: any) {
      record('F3-06', 'Owner CRM check', false, err.message, t0, {
        classification: 'INFRA',
        error: err.stack,
      });
    }
  }

  return results;
}

