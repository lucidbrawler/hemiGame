import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const ADDR = /^0x[0-9a-f]{40}$/;
const FILE = join(process.cwd(), '.data', 'scores.json');
const MAX = 20;
const CAP = 100000;

let chain = Promise.resolve();

function clean(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    const addr = String(key).toLowerCase();
    const score = Number(value);
    if (!ADDR.test(addr) || !Number.isFinite(score) || score <= 0 || score > CAP) continue;
    out[addr] = Math.max(out[addr] || 0, Math.round(score));
  }
  return out;
}

function trim(scores) {
  return Object.fromEntries(
    Object.entries(scores)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX),
  );
}

export function scoreRows(scores) {
  return Object.entries(scores).map(([address, score]) => ({ address, score }));
}

async function readFileScores() {
  try {
    return clean(JSON.parse(await readFile(FILE, 'utf8')));
  } catch {
    return {};
  }
}

async function writeFileScores(scores) {
  await mkdir(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(scores));
  await rename(tmp, FILE);
}

async function blobStore() {
  if (!process.env.NETLIFY && !process.env.NETLIFY_BLOBS_CONTEXT && !globalThis.netlifyBlobsContext) return null;
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore('relay-zone-scores');
  } catch {
    return null;
  }
}

export async function readBoard() {
  const store = await blobStore();
  if (store) {
    try {
      return trim(clean(await store.get('board', { type: 'json' })));
    } catch {
      /* The file board still serves local play. */
    }
  }
  return trim(await readFileScores());
}

async function writeBoard(scores) {
  const next = trim(scores);
  const store = await blobStore();
  if (store) {
    try {
      await store.setJSON('board', next);
      return next;
    } catch {
      /* Fall through to the file board. */
    }
  }
  await writeFileScores(next);
  return next;
}

export function submitScore(address, score) {
  const addr = String(address || '').toLowerCase();
  const n = Math.round(Number(score));
  if (!ADDR.test(addr) || !Number.isFinite(n) || n <= 0 || n > CAP) {
    return Promise.resolve({ ok: false, error: 'bad score' });
  }
  const run = chain.then(async () => {
    const scores = await readBoard();
    if (n > (scores[addr] || 0)) scores[addr] = n;
    return writeBoard(scores);
  });
  chain = run.then(() => {}, () => {});
  return run.then((scores) => ({ ok: true, scores: scoreRows(scores) }));
}
