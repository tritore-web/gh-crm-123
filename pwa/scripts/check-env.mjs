#!/usr/bin/env node
// Informa qué variables de entorno están presentes y cuáles faltan. NUNCA imprime valores.
// Lee .env.local y .env (si existen) y el entorno del proceso (que tiene prioridad).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = 'pwa';
const CURRENT_HITO = 4; // Se sube en cada hito; solo se exigen las variables con since <= CURRENT_HITO.

const VARIABLES = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', since: 2, secret: false, check: (v) => /^https:\/\/[^\s/]+/.test(v), hint: 'debe empezar por https://' },
  { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', since: 2, secret: false },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', since: 2, secret: true },
  { name: 'APP_ORIGIN', since: 2, secret: false, check: (v) => /^https:\/\/[^\s/]+$/.test(v), hint: 'https://… sin barra final' },
  { name: 'N8N_API_SECRET', since: 4, secret: true },
  { name: 'N8N_WEBHOOK_SECRET', since: 4, secret: true },
  { name: 'N8N_WEBHOOK_URL', since: 4, secret: false, check: (v) => /^https:\/\/[^\s]+$/.test(v), hint: 'debe empezar por https://' },
  { name: 'RESEND_FROM', since: 4, secret: false },
  { name: 'SUMMARY_TEST_RECIPIENT', since: 4, secret: false },
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readEnvFile(file) {
  const values = {};
  if (!existsSync(file)) return values;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

const fromFiles = { ...readEnvFile(resolve(root, '.env')), ...readEnvFile(resolve(root, '.env.local')) };
const valueOf = (name) => (process.env[name] !== undefined && process.env[name] !== '' ? process.env[name] : fromFiles[name]);

let missing = 0;
console.log(`check:env · ${APP} · variables del Hito ${CURRENT_HITO} (no se imprimen valores)\n`);
for (const variable of VARIABLES) {
  const value = valueOf(variable.name);
  const required = variable.since <= CURRENT_HITO;
  let status;
  if (value === undefined || value === '') {
    status = required ? 'FALTA' : `pendiente (se necesita desde el Hito ${variable.since})`;
    if (required) missing += 1;
  } else if (variable.check && !variable.check(value)) {
    status = `presente, pero el formato no parece correcto (${variable.hint})`;
    missing += 1;
  } else {
    status = 'presente';
  }
  console.log(`  ${variable.name.padEnd(34)} ${status}${variable.secret ? '  [secreta]' : ''}`);
}

if (missing > 0) {
  console.log(`\n${missing} variable(s) por resolver. Ver .env.example y BUILD_PLAN.md §1.1.`);
  process.exit(1);
}
console.log('\nTodas las variables del hito están configuradas.');
