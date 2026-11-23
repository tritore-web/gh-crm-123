#!/usr/bin/env node
// Guardia automática de seguridad (CLAUDE.md §4.2). Falla (código 1) si encuentra alguna de las 8 situaciones.
// Es una revisión por patrones: no sustituye a la revisión humana, pero impide los descuidos más graves.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'src');
const CODE_EXT = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'coverage', '.vercel']);
const ADMIN_FILE = 'src/lib/supabase/admin.ts';

const rel = (file) => relative(root, file).split(sep).join('/');

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const read = (file) => readFileSync(file, 'utf8');
const srcFiles = walk(SRC).filter((f) => CODE_EXT.test(f));
const rootFiles = readdirSync(root)
  .map((n) => join(root, n))
  .filter((f) => statSync(f).isFile() && (CODE_EXT.test(f) || /\.(?:json|css)$/.test(f)) && !f.endsWith('package-lock.json'));
const exampleEnvFiles = readdirSync(root).filter((n) => /^\.env.*\.example$/.test(n)).map((n) => join(root, n));

/** Sustituye comentarios por espacios conservando saltos de línea (para no dar falsos positivos con texto de comentarios). */
function stripComments(text) {
  let out = '';
  let i = 0;
  let quote = null;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (quote) {
      out += c;
      if (c === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
    } else if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
      i += 1;
    } else if (c === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
    } else if (c === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        out += text[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      i += 2;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

const findings = [];
const add = (rule, file, line, detail) => {
  const name = isAbsolute(file) ? rel(file) : file;
  if (!findings.some((f) => f.rule === rule && f.file === name && f.line === line)) findings.push({ rule, file: name, line, detail });
};

function scanLines(rule, files, regex, detail, { strip = true, skip } = {}) {
  for (const file of files) {
    const raw = read(file);
    const lines = (strip ? stripComments(raw) : raw).split('\n');
    const rawLines = raw.split('\n');
    lines.forEach((line, index) => {
      if (!regex.test(line)) return;
      if (skip?.(rawLines, index)) return;
      add(rule, file, index + 1, detail);
    });
  }
}

// 1. Clave de servicio fuera de los archivos permitidos
{
  const allowed = (file) => rel(file) === ADMIN_FILE || rel(file).startsWith('scripts/');
  scanLines(
    '1 · Clave de servicio fuera de admin.ts, scripts/ y los archivos de ejemplo',
    [...srcFiles, ...rootFiles].filter((f) => !allowed(f)),
    /SUPABASE_SERVICE_ROLE_KEY|service_role/i,
    'aparece la clave de servicio',
    { strip: false },
  );
}

// 2. Archivos 'use client' que alcanzan admin.ts o 'server-only'
{
  const resolveImport = (from, spec) => {
    const base = spec.startsWith('@/') ? join(SRC, spec.slice(2)) : spec.startsWith('.') ? resolve(dirname(from), spec) : null;
    if (!base) return null;
    for (const candidate of [base, ...['.ts', '.tsx', '.js', '.jsx', '.mjs'].map((e) => base + e), ...['index.ts', 'index.tsx'].map((e) => join(base, e))]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    return null;
  };
  const importRe = /(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;
  const info = new Map();
  for (const file of srcFiles) {
    const text = stripComments(read(file));
    const specs = [];
    for (const m of text.matchAll(importRe)) specs.push(m[1] ?? m[2] ?? m[3]);
    info.set(file, {
      client: /^\s*['"]use client['"]/.test(text),
      serverBoundary: /^\s*['"]use server['"]/.test(text),
      serverOnly: specs.includes('server-only') || rel(file) === ADMIN_FILE,
      deps: specs.map((s) => resolveImport(file, s)).filter(Boolean),
    });
  }
  for (const [file, data] of info) {
    if (!data.client) continue;
    const seen = new Set([file]);
    const queue = [...data.deps];
    while (queue.length) {
      const current = queue.shift();
      if (seen.has(current)) continue;
      seen.add(current);
      const node = info.get(current);
      if (!node) continue;
      if (node.serverOnly) {
        add('2 · Archivo cliente que importa código solo de servidor', file, 1, `alcanza ${rel(current)}`);
        break;
      }
      if (node.serverBoundary) continue; // una acción de servidor no se empaqueta en el navegador
      queue.push(...node.deps);
    }
  }
}

// 3. NEXT_PUBLIC_* con nombres de secreto
{
  const files = [...srcFiles, ...rootFiles.filter((f) => !rel(f).startsWith('scripts/')), ...exampleEnvFiles];
  for (const file of files) {
    read(file).split('\n').forEach((line, index) => {
      for (const m of line.matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
        if (m[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') continue;
        if (/SERVICE|SECRET|KEY|PASSWORD|TOKEN/.test(m[0])) add('3 · Variable pública con nombre de secreto', file, index + 1, m[0]);
      }
    });
  }
}

// 4. Palabras prohibidas en la interfaz
scanLines(
  '4 · Palabra prohibida en la interfaz (eliminar, borrar, suprimir, papelera)',
  srcFiles.filter((f) => rel(f).startsWith('src/app/') || rel(f).startsWith('src/components/')),
  /eliminar|borrar|suprimir|papelera/i,
  'texto de interfaz prohibido',
);

// 5. Borrado físico
{
  const marker = (rawLines, index) => /COMPENSACION_ALTA_FALLIDA/.test(rawLines[index]) || (index > 0 && /COMPENSACION_ALTA_FALLIDA/.test(rawLines[index - 1]));
  for (const regex of [/\.delete\s*\(\s*\)\s*\.(?:eq|in|match|neq|is|filter|gt|lt|gte|lte|or|not)\s*\(/, /\.from\s*\([^)]*\)\s*\.delete\s*\(/, /\bdeleteUser\b/, /\bDELETE\b|\bTRUNCATE\b/, /\bdelete\s+from\b/i]) {
    scanLines('5 · Borrado físico (.delete, deleteUser, DELETE, TRUNCATE)', srcFiles, regex, 'operación de borrado', { skip: marker });
  }
}

// 6. Rol leído de un sitio que no es profiles
scanLines(
  '6 · Rol leído de user_metadata, app_metadata, JWT, getSession/getClaims o cookies propias',
  srcFiles,
  /user_metadata|app_metadata|\bjwt\b|getSession\s*\(|getClaims\s*\(|\.user\.role\b|cookie[^;\n]{0,60}\brole\b|\brole\b[^;\n]{0,60}cookie/i,
  'el rol solo se lee de la tabla profiles',
);

// 7. Secretos comparados con ===, ==, !== o != en src/app/api
{
  const comparison = /(?:===|!==|==|!=)/;
  const secretWord = /secret|token|bearer|authorization|x-crm-secret|api_key|N8N_/i;
  for (const file of srcFiles.filter((f) => rel(f).startsWith('src/app/api/'))) {
    stripComments(read(file)).split('\n').forEach((line, index) => {
      if (comparison.test(line) && secretWord.test(line)) add('7 · Secreto comparado sin safeEqual en src/app/api', file, index + 1, 'todo secreto pasa por safeEqual');
    });
  }
}

// 8. Archivos .env* rastreados por git
{
  try {
    const tracked = execFileSync('git', ['ls-files', '--', '.'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .filter(Boolean);
    for (const file of tracked) {
      const name = file.split('/').pop() ?? '';
      if (name.startsWith('.env') && name !== '.env.example') add('8 · Archivo .env rastreado por git', file, 0, 'solo .env.example puede estar en git');
    }
  } catch {
    console.warn('Aviso: no se pudo consultar git; la regla 8 no se comprobó.');
  }
}

if (findings.length > 0) {
  console.error('check:security · HALLAZGOS\n');
  const byRule = new Map();
  for (const f of findings) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);
  for (const [rule, list] of byRule) {
    console.error(`✖ ${rule}`);
    for (const f of list) console.error(`    ${f.file}${f.line ? `:${f.line}` : ''} — ${f.detail}`);
  }
  console.error(`\n${findings.length} hallazgo(s). Corrígelos antes de confirmar el hito.`);
  process.exit(1);
}
console.log('check:security · OK · 8 reglas comprobadas, sin hallazgos');
