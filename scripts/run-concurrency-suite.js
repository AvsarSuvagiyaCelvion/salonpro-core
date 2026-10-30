const { spawn } = require('child_process');
const http = require('http');

function waitForServer(port, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/api/health`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for Next.js server'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log('Starting Next.js production server on port 3000...');
  const server = spawn('npx.cmd', ['next', 'start', '-p', '3000'], {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });

  try {
    await waitForServer(3000);
    console.log('Server is UP and ready on port 3000. Running concurrency suite...');

    // Execute test-concurrency-20.js
    const testProcess = spawn('node', ['scripts/test-concurrency-20.js'], {
      stdio: 'inherit',
      env: { ...process.env, TEST_APP_URL: 'http://localhost:3000' },
      shell: true,
    });

    const exitCode = await new Promise((resolve) => {
      testProcess.on('close', resolve);
    });

    console.log('Test process exited with code:', exitCode);
    process.exit(exitCode || 0);
  } finally {
    console.log('Shutting down server...');
    if (server.pid) {
      try {
        process.kill(server.pid);
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

