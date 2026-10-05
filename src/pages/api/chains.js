export const prerender = false;

import { loadChains } from '../../lib/chains.js';

const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export async function GET() {
  try {
    const body = await loadChains();
    return new Response(JSON.stringify(body), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 502, headers });
  }
}
