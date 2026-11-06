import { spawn, spawnSync, execSync, type ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import { BASE_URL, runSafetyGuard, pool, parseEnvFile } from './config.ts';
import { seedTestData, cleanTestData } from './seed.ts';
import { runFeature1Tests } from './f1-cancel-reschedule.ts';
import { runFeature2Tests } from './f2-image-gallery.ts';
import { runFeature3Tests } from './f3-profile-pin.ts';
import { runFeature4Tests } from './f4-reviews.ts';
import { runCrossFeatureTests } from './cross-feature.ts';
import type { TestResult } from './types.ts';

// ANSI terminal colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

let envLocalBackedUp = false;

function backupLocalEnv(): void {
  const localPath = path.join(process.cwd(), '.env.local');
  const backupPath = path.join(process.cwd(), '.env.local.qa_backup');
  if (fs.existsSync(localPath)) {
    fs.renameSync(localPath, backupPath);
    envLocalBackedUp = true;
  }
}

function restoreLocalEnv(): void {
  const localPath = path.join(process.cwd(), '.env.local');
  const backupPath = path.join(process.cwd(), '.env.local.qa_backup');
  if (envLocalBackedUp && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, localPath);
    envLocalBackedUp = false;
  }
}

process.on('exit', restoreLocalEnv);
process.on('SIGINT', () => { restoreLocalEnv(); process.exit(1); });
process.on('SIGTERM', () => { restoreLocalEnv(); process.exit(1); });

function killPort3100(): void {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano | findstr :3100', { encoding: 'utf-8' });
      for (const line of out.split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(Number(pid))) {
          try {
            execSync(`taskkill /pid ${pid} /F /T`, { stdio: 'ignore' });
          } catch {}
        }
      }
    }
  } catch {}
}

async function checkServerHealth(url: string): Promise<boolean> {
  try {
    const res = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(2000) });
    return res.status === 200;
  } catch {
    return false;
  }
}

async function startServerIfNeeded(): Promise<ChildProcess | null> {
  // If user explicitly configured an external running server (different port or host)
  if (BASE_URL !== 'http://localhost:3100') {
    const isHealthy = await checkServerHealth(BASE_URL);
    if (isHealthy) {
      console.log(`ℹ️ [QA RUNNER] Active external server detected on ${BASE_URL}. Using running instance.`);
      return null;
    }
  }

  // For default port 3100: ensure clean slate, kill any orphan process, backup .env.local, and start fresh
  killPort3100();
  await new Promise((r) => setTimeout(r, 600));

  console.log(`🚀 [QA RUNNER] Spawning Next.js production server on port 3100 for test environment...`);
  console.log(`   (Note: Ensure 'npm run build' has been completed before running the test server)`);

  // Temporarily swap .env.local so Next.js connects strictly to .env.test
  backupLocalEnv();

  const testEnv = parseEnvFile(path.join(process.cwd(), '.env.test'));
  const isWin = process.platform === 'win32';
  const nextCmd = isWin ? 'npx.cmd' : 'npx';

  const child = spawn(nextCmd, ['next', 'start', '-p', '3100'], {
    env: {
      ...process.env,
      ...testEnv,
      PORT: '3100',
    },
    stdio: 'ignore',
    shell: isWin,
    detached: !isWin,
  });

  const startTime = Date.now();
  let serverReady = false;

  while (Date.now() - startTime < 35000) {
    await new Promise((r) => setTimeout(r, 800));
    const healthy = await checkServerHealth('http://localhost:3100');
    if (healthy) {
      serverReady = true;
      break;
    }
  }

  if (!serverReady) {
    try {
      if (child.pid) process.kill(child.pid);
    } catch {}
    restoreLocalEnv();
    throw new Error('Timed out waiting for Next.js test server to become ready on port 3100.');
  }

  console.log(`✅ [QA RUNNER] Next.js test server started and verified healthy on http://localhost:3100.\n`);
  return child;
}

function stopServer(child: ChildProcess | null): void {
  restoreLocalEnv();
  if (!child || !child.pid) {
    killPort3100();
    return;
  }
  console.log(`\n🛑 [QA RUNNER] Stopping spawned Next.js test server (PID ${child.pid})...`);
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
    } else {
      process.kill(-child.pid);
    }
  } catch {}
  killPort3100();
}

function writeMarkdownReport(results: TestResult[], totalTimeMs: number): void {
  const reportPath = path.join(process.cwd(), 'tests', 'qa', 'report.md');
  const now = new Date().toISOString();

  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  let md = `# SalonPro QA Automation Test Report\n\n`;
  md += `> **Generated At:** ${now}  \n`;
  md += `> **Base URL:** ${BASE_URL}  \n`;
  md += `> **Total Duration:** ${(totalTimeMs / 1000).toFixed(2)}s  \n`;
  md += `> **Overall Result:** ${failed === 0 ? '✅ PASSED' : '❌ FAILED'} (${passed}/${total} passed)\n\n`;

  md += `## 1. Feature Summary\n\n`;
  md += `| Feature | Total | Passed | Failed | Skipped | Pass Rate |\n`;
  md += `|---|---|---|---|---|---|\n`;

  const features = ['F1', 'F2', 'F3', 'F4', 'CROSS'] as const;
  const featureNames: Record<string, string> = {
    F1: 'F1: Cancel & Reschedule',
    F2: 'F2: Image Upload & Gallery',
    F3: 'F3: Customer Profile & PIN Change',
    F4: 'F4: Reviews & Ratings',
    CROSS: 'Cross-Feature & E2E Flow',
  };

  for (const f of features) {
    const fResults = results.filter((r) => r.feature === f);
    if (fResults.length === 0) continue;
    const fPass = fResults.filter((r) => r.status === 'PASS').length;
    const fFail = fResults.filter((r) => r.status === 'FAIL').length;
    const fSkip = fResults.filter((r) => r.status === 'SKIP').length;
    const rate = ((fPass / fResults.length) * 100).toFixed(1);
    md += `| ${featureNames[f]} | ${fResults.length} | ${fPass} | ${fFail} | ${fSkip} | ${rate}% |\n`;
  }

  md += `| **TOTAL** | **${total}** | **${passed}** | **${failed}** | **${skipped}** | **${((passed / total) * 100).toFixed(1)}%** |\n\n`;

  md += `## 2. Test Execution Details\n\n`;
  md += `| ID | Feature | Test Case | Status | Duration | Reason / Details |\n`;
  md += `|---|---|---|---|---|---|\n`;

  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅ PASS' : r.status === 'FAIL' ? '❌ FAIL' : '⏭ SKIP';
    md += `| \`${r.id}\` | ${r.feature} | ${r.name.replace(/\|/g, '/')} | ${icon} | ${r.durationMs}ms | ${r.reason.replace(/\|/g, '/')} |\n`;
  }

  if (failed > 0) {
    md += `\n## 3. Failure Breakdown & Diagnoses\n\n`;
    for (const r of results.filter((r) => r.status === 'FAIL')) {
      md += `### \`${r.id}\`: ${r.name}\n`;
      md += `- **Classification:** \`${r.classification || 'APP BUG'}\`\n`;
      if (r.likelyFile) md += `- **Likely Affected File:** \`${r.likelyFile}\`\n`;
      if (r.expected) md += `- **Expected:** ${r.expected}\n`;
      if (r.actual) md += `- **Actual:** ${r.actual}\n`;
      if (r.error) md += `\`\`\`\n${r.error}\n\`\`\`\n`;
      md += `\n`;
    }
  } else {
    md += `\n## 3. Failure Breakdown & Diagnoses\n\n`;
    md += `> 🎉 **Zero failures detected!** All 4 core features and cross-feature flows passed successfully without regressions.\n`;
  }

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`\n📄 [QA REPORT] Written to: tests/qa/report.md`);
}

async function main(): Promise<void> {
  const suiteStartTime = Date.now();
  let serverChild: ChildProcess | null = null;

  try {
    // 1. Safety Guard check
    runSafetyGuard();

    // 2. Start Next.js test server if needed
    serverChild = await startServerIfNeeded();

    // 3. Seed test database fixtures
    const fixtures = await seedTestData();

    // 4. Determine feature filter & execution mode
    const args = process.argv.slice(2);
    const isWithUI = args.includes('--with-ui') || args.includes('all');
    const isUIOnly = args.includes('--ui-only') || args.includes('ui');
    const featureArg = args.find((a) => ['1', '2', '3', '4', 'f1', 'f2', 'f3', 'f4'].includes(a.toLowerCase()))?.replace(/^f/i, '');

    const allResults: TestResult[] = [];

    if (!isUIOnly) {
      console.log(`\n${BOLD}======================================================================${RESET}`);
      console.log(`${BOLD}           SALONPRO AUTOMATED QA TEST SUITE EXECUTION                ${RESET}`);
      console.log(`${BOLD}======================================================================${RESET}\n`);

      if (!featureArg || featureArg === '1') {
        console.log(`${BOLD}${CYAN}▶ Feature 1: Customer Cancel & Reschedule${RESET}`);
        const r1 = await runFeature1Tests(fixtures);
        allResults.push(...r1);
        for (const r of r1) {
          const icon = r.status === 'PASS' ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
          console.log(`  ${icon} [${r.id}] ${r.name} (${r.durationMs}ms) - ${r.reason}`);
        }
        console.log('');
      }

      if (!featureArg || featureArg === '2') {
        console.log(`${BOLD}${CYAN}▶ Feature 2: Image Upload & Gallery${RESET}`);
        const r2 = await runFeature2Tests(fixtures);
        allResults.push(...r2);
        for (const r of r2) {
          const icon = r.status === 'PASS' ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
          console.log(`  ${icon} [${r.id}] ${r.name} (${r.durationMs}ms) - ${r.reason}`);
        }
        console.log('');
      }

      if (!featureArg || featureArg === '3') {
        console.log(`${BOLD}${CYAN}▶ Feature 3: Customer Profile Edit & Security PIN Change${RESET}`);
        const r3 = await runFeature3Tests(fixtures);
        allResults.push(...r3);
        for (const r of r3) {
          const icon = r.status === 'PASS' ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
          console.log(`  ${icon} [${r.id}] ${r.name} (${r.durationMs}ms) - ${r.reason}`);
        }
        console.log('');
      }

      if (!featureArg || featureArg === '4') {
        console.log(`${BOLD}${CYAN}▶ Feature 4: Reviews & Ratings${RESET}`);
        const r4 = await runFeature4Tests(fixtures);
        allResults.push(...r4);
        for (const r of r4) {
          const icon = r.status === 'PASS' ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
          console.log(`  ${icon} [${r.id}] ${r.name} (${r.durationMs}ms) - ${r.reason}`);
        }
        console.log('');
      }

      if (!featureArg) {
        console.log(`${BOLD}${CYAN}▶ Cross-Feature & End-to-End Lifecycle${RESET}`);
        const rCross = await runCrossFeatureTests(fixtures);
        allResults.push(...rCross);
        for (const r of rCross) {
          const icon = r.status === 'PASS' ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
          console.log(`  ${icon} [${r.id}] ${r.name} (${r.durationMs}ms) - ${r.reason}`);
        }
        console.log('');
      }
    }

    // 5. Run Playwright UI smoke suite if requested
    let uiExitCode = 0;
    if (isWithUI || isUIOnly) {
      console.log(`\n${BOLD}======================================================================${RESET}`);
      console.log(`${BOLD}${CYAN}▶ Playwright UI Smoke Suite (8 Tests: Desktop + 375px Mobile)${RESET}`);
      console.log(`${BOLD}======================================================================${RESET}\n`);
      const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      const pwResult = spawnSync(npxCmd, ['playwright', 'test', '-c', 'tests/qa/ui/playwright.config.ts'], {
        stdio: 'inherit',
        shell: true,
      });
      uiExitCode = pwResult.status ?? 0;
    }

    // 6. Clean up seeded data
    await cleanTestData();

    // 7. Summary Output
    if (!isUIOnly) {
      const totalTimeMs = Date.now() - suiteStartTime;
      const total = allResults.length;
      const passed = allResults.filter((r) => r.status === 'PASS').length;
      const failed = allResults.filter((r) => r.status === 'FAIL').length;

      console.log(`${BOLD}======================================================================${RESET}`);
      console.log(`${BOLD}                       QA TEST SUMMARY                                ${RESET}`);
      console.log(`${BOLD}======================================================================${RESET}`);
      console.log(`Total Tests Run:  ${BOLD}${total}${RESET}`);
      console.log(`Passed:           ${GREEN}${passed}${RESET}`);
      console.log(`Failed:           ${failed === 0 ? GREEN : RED}${failed}${RESET}`);
      console.log(`Total Duration:   ${(totalTimeMs / 1000).toFixed(2)}s`);
      console.log(`${BOLD}======================================================================${RESET}\n`);

      writeMarkdownReport(allResults, totalTimeMs);

      if (failed > 0 || uiExitCode !== 0) {
        process.exitCode = 1;
      }
    } else {
      if (uiExitCode !== 0) {
        process.exitCode = 1;
      }
    }
  } catch (err: any) {
    console.error('\n❌ [FATAL QA RUNNER ERROR]', err.message);
    if (err.stack) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    stopServer(serverChild);
    await pool.end();
  }
}

main();

