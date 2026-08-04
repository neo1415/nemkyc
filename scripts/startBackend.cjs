const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const { spawn } = require('node:child_process');
const dotenv = require('dotenv');

const repositoryRoot = path.resolve(__dirname, '..');
const backendEntry = path.join(repositoryRoot, 'apps', 'backend', 'server.js');
const legacyEnv = path.resolve(repositoryRoot, '..', 'n-server', '.env');
const canonicalEnv = path.join(repositoryRoot, 'apps', 'backend', '.env');

function loadDevelopmentEnvironment() {
  const merged = {};

  for (const candidate of [legacyEnv, canonicalEnv]) {
    if (fs.existsSync(candidate)) {
      Object.assign(merged, dotenv.parse(fs.readFileSync(candidate)));
    }
  }

  if (!fs.existsSync(legacyEnv) && !fs.existsSync(canonicalEnv)) {
    console.error(
      'Backend environment not found. Create apps/backend/.env from apps/backend/.env.example.',
    );
    process.exit(1);
  }

  // Explicit shell variables take precedence over values from environment files.
  return { ...merged, ...process.env };
}

function assertPortAvailable(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();

    probe.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(
          new Error(
            `Port ${port} is already in use. The backend may already be running at http://localhost:${port}.`,
          ),
        );
        return;
      }

      reject(error);
    });

    probe.listen(port, () => {
      probe.close(resolve);
    });
  });
}

async function main() {
  const env = loadDevelopmentEnvironment();
  const port = Number(env.PORT || 3001);

  try {
    await assertPortAvailable(port);
  } catch (error) {
    console.error(error.message);
    console.error('Stop the existing backend process, then run npm run dev:server again.');
    process.exit(1);
  }

  const child = spawn(process.execPath, [backendEntry], {
    cwd: repositoryRoot,
    env,
    stdio: 'inherit',
  });

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      if (!child.killed) {
        child.kill(signal);
      }
    });
  }

  child.once('error', (error) => {
    console.error('Unable to start the backend:', error.message);
    process.exitCode = 1;
  });

  child.once('exit', (code, signal) => {
    process.exitCode = signal ? 1 : (code ?? 1);
  });
}

main().catch((error) => {
  console.error('Unable to start the backend:', error.message);
  process.exit(1);
});
