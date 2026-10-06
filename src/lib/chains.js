/**
 * Read-only Hemi mainnet block for the Relay Zone chip.
 * Chain id 43111, RPC https://rpc.hemi.network/rpc.
 * No signing, no broadcasts.
 */

const HEMI = 'https://rpc.hemi.network/rpc';

let cache = { at: 0, body: null };

async function getJson(url, options = {}, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: { accept: 'application/json', ...(options.headers || {}) },
    });
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function loadChains() {
  const now = Date.now();
  if (cache.body && now - cache.at < 12000) return cache.body;

  const errors = [];
  const hemi = await getJson(HEMI, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_blockNumber',
      params: [],
    }),
  }).catch((err) => {
    errors.push(`hemi: ${err.message}`);
    return null;
  });

  const body = {
    ok: true,
    readOnly: true,
    fetchedAt: new Date().toISOString(),
    hemi: hemi?.result
      ? { chainId: 43111, block: Number.parseInt(hemi.result, 16) }
      : null,
    errors,
  };

  cache = { at: now, body };
  return body;
}
