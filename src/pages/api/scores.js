export const prerender = false;

import { readBoard, scoreRows, submitScore } from '../../lib/scores.js';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export async function GET() {
  try {
    const scores = scoreRows(await readBoard());
    return new Response(JSON.stringify({ ok: true, scores }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 502, headers });
  }
}

export async function POST({ request }) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const result = await submitScore(body.address, body.zone, body.score, body.hero);
  return new Response(JSON.stringify(result), { status: result.ok ? 200 : 400, headers });
}
