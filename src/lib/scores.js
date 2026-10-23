import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// One high score per stage, marked with the hero who set it.
// Shape: { "0x…": { hemi: { score, hero }, ... } }. hero is "hemigo" or "orami".
// A bare number from an older board is kept as a score with no hero.
const ADDR = /^0x[0-9a-f]{40}$/;
const ZONES = ['hemi', 'wart', 'cart', 'gale', 'crown'];
const FILE = join(process.cwd(), '.data', 'scores.json');
const MAX = 20;
const CAP = 100000;

let chain = Promise.resolve();

function readMark(value) {
  const raw = value && typeof value === 'object' && !Array.isArray(value) ? value.score : value;
  const score = Math.round(Number(raw));
  if (!Number.isFinite(score) || score <= 0 || score > CAP) return null;
  const hero = value?.hero === 'hemigo' || value?.hero === 'orami' ? value.hero : '';
  return { score, hero };
}

function betterMark(current, next) {
  if (!current) return next;
  if (!next) return current;
  if (next.score > current.score) return next;
  if (current.score > next.score) return current;
  return current.hero ? current : next;
}

function cleanStages(value) {
  const stages = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return stages;
  for (const zone of ZONES) {
    const mark = readMark(value[zone]);
    if (mark) stages[zone] = mark;
  }
  return stages;
}

function clean(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    const addr = String(key).toLowerCase();
    const stages = cleanStages(value);
    if (!ADDR.test(addr) || !Object.keys(stages).length) continue;
    const prev = out[addr] || {};
    for (const [zone, mark] of Object.entries(stages)) {
      prev[zone] = betterMark(prev[zone], mark);
    }
    out[addr] = prev;
  }
  return out;
}

function trim(scores) {
  const keep = new Set();
  for (const zone of ZONES) {
    const ranked = Object.entries(scores)
      .filter(([, stages]) => stages[zone]?.score > 0)
      .sort((a, b) => b[1][zone].score - a[1][zone].score || a[0].localeCompare(b[0]))
      .slice(0, MAX);
    for (const [addr] of ranked) keep.add(addr);
  }
  return Object.fromEntries([...keep].sort().map((addr) => [addr, scores[addr]]));
}

export function scoreRows(scores) {
  return Object.entries(scores).map(([address, stages]) => ({ address, stages }));
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

export function submitScore(address, zone, score, hero) {
  const addr = String(address || '').toLowerCase();
  const stage = String(zone || '');
  const n = Math.round(Number(score));
  const who = hero == null || hero === '' ? '' : String(hero);
  if (!ADDR.test(addr) || !ZONES.includes(stage) || !Number.isFinite(n) || n <= 0 || n > CAP
    || (who !== '' && who !== 'hemigo' && who !== 'orami')) {
    return Promise.resolve({ ok: false, error: 'bad score' });
  }
  const run = chain.then(async () => {
    const scores = await readBoard();
    const prev = { ...(scores[addr] || {}) };
    prev[stage] = betterMark(prev[stage], { score: n, hero: who });
    scores[addr] = prev;
    return writeBoard(scores);
  });
  chain = run.then(() => {}, () => {});
  return run.then((scores) => ({ ok: true, scores: scoreRows(scores) }));
}
