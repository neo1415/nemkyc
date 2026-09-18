#!/usr/bin/env node
/**
 * One-command safety net for the server.js split.
 *   1. node --check on server.js and every file under src/
 *   2. no undefined identifiers anywhere (scripts/free-vars.cjs)
 *   3. the live Express route table is byte-identical to scripts/route-table.baseline.jsonl
 * Exit code is non-zero on any failure. Run `npm test` separately.
 */
'use strict';
const { execFileSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
process.chdir(root);

function listCjs(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listCjs(full, out);
    else if (/\.(cjs|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = ['server.js', ...listCjs(path.join(root, 'src')).map((f) => path.relative(root, f))];
let failed = false;

// 1. syntax
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    failed = true;
    console.error(`SYNTAX  ${f}\n${r.stderr}`);
  }
}
console.log(`syntax   ${files.length} files ${failed ? 'FAILED' : 'ok'}`);

// 2. free variables
const fv = spawnSync(process.execPath, [path.join(__dirname, 'free-vars.cjs'), ...files], { encoding: 'utf8' });
const undefinedLines = fv.stdout.split('\n').filter((l) => l && !l.startsWith('#') );
if (fv.status !== 0) {
  failed = true;
  console.error(fv.stdout);
}
console.log(`freevars ${undefinedLines.length === 0 ? 'ok' : `${undefinedLines.length} undefined identifier(s)`}`);

// 3. route table
const baselinePath = path.join(__dirname, 'route-table.baseline.jsonl');
let table = '';
try {
  table = execFileSync(process.execPath, [path.join(__dirname, 'route-table.cjs')], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    timeout: 120000,
  });
} catch (e) {
  failed = true;
  console.error(`routes   could not build the app: ${e.message}`);
}
if (table) {
  table = table.split('\n').filter((l) => l.startsWith('{')).join('\n') + '\n';
  const baseline = fs.readFileSync(baselinePath, 'utf8');
  if (table === baseline) {
    console.log(`routes   identical to baseline (${baseline.split('\n').filter(Boolean).length} layers)`);
  } else {
    failed = true;
    const a = baseline.split('\n');
    const b = table.split('\n');
    const max = Math.max(a.length, b.length);
    let shown = 0;
    for (let i = 0; i < max && shown < 12; i++) {
      if (a[i] !== b[i]) {
        console.error(`routes   line ${i + 1}\n  baseline: ${a[i]}\n  current : ${b[i]}`);
        shown++;
      }
    }
    fs.writeFileSync(path.join(__dirname, 'route-table.current.jsonl'), table);
    console.error('routes   DIFFERS from baseline (full table written to scripts/route-table.current.jsonl)');
  }
}

process.exit(failed ? 1 : 0);
