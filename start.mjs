#!/usr/bin/env node

/**
 * Startup Showcase Local Launcher
 * Runs both the backend API server and frontend Vite dev server concurrently,
 * streams logs cleanly, opens the browser, and cleanly stops all processes on exit.
 */

import { spawn, exec } from 'node:child_process';
import { createServer } from 'node:net';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const noOpen = args.includes('--no-open');
const isProd = args.includes('--prod') || args.includes('--preview');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

const tag = (name, color) => `${color}[${name}]${colors.reset} `;

console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}          STARTUP SHOWCASE - LOCAL LAUNCHER           ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

// 1. Check Node.js version
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 5)) {
  console.warn(`${colors.yellow}[WARNING] Node.js ${process.version} detected. Node.js >= 22.5.0 is recommended for built-in SQLite support.${colors.reset}\n`);
}

// Helper to test if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(true);
        else resolve(false);
      })
      .once('listening', () => {
        tester.close(() => resolve(false));
      })
      .listen(port, '0.0.0.0');
  });
}

// Open URL in default browser
function openBrowser(url) {
  if (noOpen) return;
  const platform = process.platform;
  let command;
  if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else if (platform === 'darwin') {
    command = `open "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }
  exec(command, () => {});
}

const childProcesses = [];
let isShuttingDown = false;

function killProcess(child) {
  if (!child || child.killed) return;
  if (process.platform === 'win32') {
    try {
      exec(`taskkill /pid ${child.pid} /T /F`, () => {});
    } catch {
      child.kill('SIGKILL');
    }
  } else {
    child.kill('SIGTERM');
  }
}

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${colors.yellow}Shutting down servers...${colors.reset}`);
  for (const child of childProcesses) {
    killProcess(child);
  }
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

async function start() {
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const npxCmd = isWindows ? 'npx.cmd' : 'npx';

  if (isProd) {
    console.log(`${tag('Showcase', colors.cyan)}Starting in production / standalone server mode...`);
    const serverProc = spawn(process.execPath, ['server/index.mjs'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: false
    });
    childProcesses.push(serverProc);
    serverProc.on('exit', (code) => {
      if (!isShuttingDown) process.exit(code ?? 0);
    });

    setTimeout(() => {
      console.log(`\n${colors.green}✔ Application ready at: ${colors.bold}http://localhost:3001${colors.reset}\n`);
      openBrowser('http://localhost:3001');
    }, 1200);
    return;
  }

  // Development mode: Run API server (port 3001) + Vite dev server (port 5173)
  const port3001InUse = await isPortInUse(3001);
  if (port3001InUse) {
    // Check if it's already responding as our API
    try {
      const res = await fetch('http://127.0.0.1:3001/api/startups');
      if (res.ok) {
        console.log(`${tag('API', colors.cyan)}Detected existing Startup Showcase API server already active on http://localhost:3001.`);
      } else {
        console.warn(`${tag('API', colors.yellow)}Port 3001 is already in use by another application.`);
      }
    } catch {
      console.warn(`${tag('API', colors.yellow)}Port 3001 is currently occupied. Proceeding with Vite frontend.`);
    }
  } else {
    console.log(`${tag('API', colors.cyan)}Starting Backend API server (port 3001)...`);
    const apiProc = spawn(process.execPath, ['server/index.mjs'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false
    });
    childProcesses.push(apiProc);

    apiProc.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) console.log(`${tag('API', colors.cyan)}${text}`);
    });

    apiProc.stderr.on('data', (data) => {
      const text = data.toString().trim();
      if (text) console.error(`${tag('API', colors.red)}${text}`);
    });

    apiProc.on('exit', (code) => {
      if (!isShuttingDown && code !== 0) {
        console.error(`${tag('API', colors.red)}API server exited with code ${code}`);
      }
    });
  }

  // Check Vite port 5173
  const port5173InUse = await isPortInUse(5173);
  if (port5173InUse) {
    console.log(`${tag('Vite', colors.green)}Port 5173 is already in use, Vite will automatically select next available port.`);
  }

  console.log(`${tag('Vite', colors.green)}Starting Vite frontend dev server...`);
  const viteBin = resolve(__dirname, 'node_modules/vite/bin/vite.js');
  const viteProc = spawn(process.execPath, [viteBin], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false
  });
  childProcesses.push(viteProc);

  let browserOpened = false;

  const handleViteOutput = (data) => {
    const raw = data.toString();
    const lines = raw.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      console.log(`${tag('Vite', colors.green)}${line}`);
      // Strip ANSI escape codes so formatted port numbers (e.g. bolded in Vite 8) match correctly
      const cleanLine = line.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      const match = cleanLine.match(/(https?:\/\/(?:localhost|127\.0\.0\.1):\d+)/i);
      if (match && !browserOpened) {
        browserOpened = true;
        const url = match[1];
        console.log(`\n${colors.bold}${colors.green}✔ Frontend ready at: ${colors.cyan}${url}${colors.reset}`);
        console.log(`${colors.bold}${colors.cyan}✔ Backend API ready at: ${colors.cyan}http://localhost:3001/api${colors.reset}`);
        console.log(`${colors.gray}Press Ctrl+C to stop all servers.${colors.reset}\n`);
        openBrowser(url);
      }
    }
  };

  viteProc.stdout.on('data', handleViteOutput);
  viteProc.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.error(`${tag('Vite', colors.red)}${text}`);
  });

  viteProc.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`${tag('Vite', colors.yellow)}Vite stopped with exit code ${code}`);
      cleanup();
    }
  });

  // Fallback timer to open browser if Vite URL regex was somehow missed
  setTimeout(() => {
    if (!browserOpened && !noOpen) {
      browserOpened = true;
      console.log(`\n${colors.green}✔ Opening browser at: http://localhost:5173${colors.reset}\n`);
      openBrowser('http://localhost:5173');
    }
  }, 4000);
}

start().catch((err) => {
  console.error(`${colors.red}Launcher error:${colors.reset}`, err);
  cleanup();
});
