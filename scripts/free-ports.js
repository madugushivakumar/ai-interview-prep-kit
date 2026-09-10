#!/usr/bin/env node
/**
 * Cross-platform script to detect and terminate any processes occupying specified ports.
 * Usage: node scripts/free-ports.js [port1] [port2] ...
 * Default: 3000 8000
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2).map(Number).filter(p => !isNaN(p) && p > 0);
const ports = args.length > 0 ? args : [3000, 8000];

function freePort(port) {
  const isWin = process.platform === 'win32';
  try {
    if (isWin) {
      let pids = [];
      try {
        const psCmd = `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique"`;
        const output = execSync(psCmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
        if (output) {
          pids = output.split(/\r?\n/).map(s => parseInt(s.trim(), 10)).filter(p => !isNaN(p) && p > 0);
        }
      } catch {
        // Fallback to netstat if PowerShell Get-NetTCPConnection is unavailable
        try {
          const netstatOut = execSync('netstat -ano -p tcp', { encoding: 'utf8' });
          const lines = netstatOut.split(/\r?\n/);
          for (const line of lines) {
            if (line.includes(`:${port}`) && line.includes('LISTENING')) {
              const parts = line.trim().split(/\s+/);
              const pid = parseInt(parts[parts.length - 1], 10);
              if (!isNaN(pid) && pid > 0 && !pids.includes(pid)) {
                pids.push(pid);
              }
            }
          }
        } catch {}
      }

      const currentPid = process.pid;
      const targetPids = pids.filter(pid => pid !== currentPid);

      if (targetPids.length === 0) {
        console.log(`[Port Manager] Port ${port} is free.`);
        return;
      }

      for (const pid of targetPids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[Port Manager] Terminated process (PID ${pid}) occupying port ${port}.`);
        } catch {
          // Process may have already stopped
        }
      }
    } else {
      // Unix / macOS
      try {
        execSync(`lsof -ti :${port} | xargs kill -9`, { stdio: 'ignore' });
        console.log(`[Port Manager] Terminated process occupying port ${port}.`);
      } catch {
        console.log(`[Port Manager] Port ${port} is free.`);
      }
    }
  } catch (err) {
    console.warn(`[Port Manager] Note: Could not check port ${port}: ${err.message}`);
  }
}

for (const port of ports) {
  freePort(port);
}
