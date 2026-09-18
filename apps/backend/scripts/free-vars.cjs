#!/usr/bin/env node
/**
 * Lists identifiers a CommonJS file uses without defining (ESLint no-undef with Node globals).
 * Used while splitting server.js: every name printed for an extracted module must come from `ctx`
 * or a require(), and every name printed for server.js itself must be re-imported from a module.
 *   node scripts/free-vars.cjs src/routes/identity.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { Linter } = require('eslint');
const globals = require('globals');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: free-vars.cjs <file.cjs> [...]');
  process.exit(2);
}

const linter = new Linter({ configType: 'flat' });
let exit = 0;
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const messages = linter.verify(
    code,
    [
      {
        files: ['**/*.cjs', '**/*.js'],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: 'commonjs',
          // `crypto` is deliberately NOT a global here: Node's WebCrypto global lacks randomBytes/createHash,
          // so every module must require('crypto') explicitly.
          globals: { ...globals.node, ...globals.es2021, crypto: 'off' },
        },
        rules: { 'no-undef': 'error' },
      },
    ],
    { filename: path.resolve(file) }
  );
  const names = new Map();
  for (const m of messages) {
    const match = /'([^']+)' is not defined/.exec(m.message);
    if (!match) continue;
    if (!names.has(match[1])) names.set(match[1], []);
    names.get(match[1]).push(m.line);
  }
  console.log(`# ${path.relative(process.cwd(), file)}: ${names.size} undefined identifier(s)`);
  for (const [name, lines] of [...names.entries()].sort()) {
    console.log(`${name}\t${lines.slice(0, 5).join(',')}${lines.length > 5 ? ',…' : ''}`);
  }
  if (names.size) exit = 1;
}
process.exit(exit);
