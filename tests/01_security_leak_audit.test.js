import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { N8nClient } from '../mcp-n8n-local/dist/client.js';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

test('Seguridad: Cero secretos o tokens en archivos trackeados por Git', () => {
  // Obtener la lista de todos los archivos trackeados en git
  const trackedFilesOutput = execSync('git ls-files', { cwd: ROOT_DIR, encoding: 'utf-8' });
  const trackedFiles = trackedFilesOutput
    .split('\n')
    .map(f => f.trim())
    .filter(f => f.length > 0 && !f.endsWith('.pdf') && !f.startsWith('tests/')); // Excluir binarios y archivos de testing

  const LEAK_PATTERNS = [
    { name: 'UAB DCC LLM API Key (uth-*)', regex: /uth-[a-f0-9]{32,}/i },
    { name: 'Typeform Token real (tfp_*)', regex: /tfp_[a-zA-Z0-9_-]{40,}/ },
    { name: 'OpenAI Secret Key (sk-*)', regex: /\bsk-[A-Za-z0-9]{32,}\b/ },
    { name: 'JWT Secret Token n8n (eyJhbGci...)', regex: /eyJhbGciOi[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/ }
  ];

  const leaks = [];

  for (const relPath of trackedFiles) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');

    for (const pattern of LEAK_PATTERNS) {
      if (pattern.regex.test(content)) {
        leaks.push({
          file: relPath,
          pattern: pattern.name
        });
      }
    }
  }

  assert.equal(
    leaks.length,
    0,
    `Se detectaron posibles secretos en archivos que se van a subir a GitHub: ${JSON.stringify(leaks, null, 2)}`
  );
});

test('Seguridad: .gitignore incluye todas las reglas de exclusión críticas', () => {
  const gitignorePath = path.join(ROOT_DIR, '.gitignore');
  assert.ok(fs.existsSync(gitignorePath), 'El archivo .gitignore debe existir en la raíz');

  const content = fs.readFileSync(gitignorePath, 'utf-8');

  // Reglas indispensables para un repositorio público / hackathon
  const requiredRules = [
    '.env',
    'node_modules',
    'dist',
    '*.sqlite',
    'start-n8n.bat'
  ];

  for (const rule of requiredRules) {
    assert.ok(
      content.includes(rule),
      `Regla requerida ausente en .gitignore: '${rule}'`
    );
  }
});

test('Seguridad: Plantillas .env.example contienen exclusivamente placeholders seguros', () => {
  const envExamplePaths = [
    path.join(ROOT_DIR, '.env.example'),
    path.join(ROOT_DIR, 'mcp-n8n-local', '.env.example')
  ];

  for (const envPath of envExamplePaths) {
    assert.ok(fs.existsSync(envPath), `Plantilla requerida no existe: ${envPath}`);
    const content = fs.readFileSync(envPath, 'utf-8');

    assert.doesNotMatch(content, /uth-[a-f0-9]{30,}/i, 'No debe haber claves reales de UAB en .env.example');
    assert.doesNotMatch(content, /tfp_[a-zA-Z0-9]{30,}/, 'No debe haber tokens reales de Typeform en .env.example');
    assert.doesNotMatch(content, /eyJhbGciOi/, 'No debe haber JWTs en .env.example');

    // Debe contener placeholders estándar
    assert.match(content, /your_n8n_api_key_here/);
    assert.match(content, /your_uab_hackathon_llm_key_here/);
  }
});

test('Seguridad: Workflows en n8n utilizan expresiones $env y no guardan tokens en texto plano', async () => {
  const client = new N8nClient();
  const list = await client.request('GET', '/workflows');
  assert.ok(Array.isArray(list.data), 'Debe listar workflows en n8n');

  for (const wf of list.data) {
    const detail = await client.request('GET', `/workflows/${wf.id}`);
    const jsonStr = JSON.stringify(detail);

    assert.ok(
      !/uth-[a-f0-9]{30,}/i.test(jsonStr),
      `El workflow '${wf.name}' (${wf.id}) tiene una API key de UAB en texto plano`
    );
    assert.ok(
      !/tfp_[a-zA-Z0-9_-]{35,}/.test(jsonStr),
      `El workflow '${wf.name}' (${wf.id}) tiene un token de Typeform en texto plano`
    );
  }
});
