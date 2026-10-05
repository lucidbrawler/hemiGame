/**
 * Read-only chain summary for the Relay Zone chips.
 * Same public endpoints the Hemi, Warthog, and Cartesi tools use.
 * No signing, no broadcasts, no pool secrets.
 */

const DEFI = 'https://warthog-defitestnet.duckdns.org';
const MAINNET = 'https://warthognode.duckdns.org';
const POOL = 'https://cartesi-bridge.duckdns.org/api/pool';
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

function shortAddr(addr) {
  const hex = String(addr || '').replace(/^0x/, '');
  if (hex.length < 12) return hex || null;
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

export async function loadChains() {
  const now = Date.now();
  if (cache.body && now - cache.at < 12000) return cache.body;

  const errors = [];
  const [defiHead, mainHead, pool, hemi] = await Promise.all([
    getJson(`${DEFI}/chain/head`).catch((err) => {
      errors.push(`warthog-defi: ${err.message}`);
      return null;
    }),
    getJson(`${MAINNET}/chain/head`).catch((err) => {
      errors.push(`warthog: ${err.message}`);
      return null;
    }),
    getJson(POOL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'pool3p_status' }),
    }).catch((err) => {
      errors.push(`cartesi: ${err.message}`);
      return null;
    }),
    getJson(HEMI, {
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
    }),
  ]);

  let balance = null;
  const poolAddress = pool?.address || null;
  if (poolAddress) {
    balance = await getJson(`${DEFI}/account/${poolAddress}/wart_balance`).catch((err) => {
      errors.push(`wart-balance: ${err.message}`);
      return null;
    });
  }

  const defi = defiHead?.data?.chainHead || defiHead?.chainHead || null;
  const main = mainHead?.data || null;
  const bal = balance?.data || balance || null;
  const seats = pool?.seatsReady || null;

  const body = {
    ok: true,
    readOnly: true,
    fetchedAt: new Date().toISOString(),
    warthog: {
      defiHeight: defi?.height ?? null,
      defiSynced: defiHead?.data?.synced ?? null,
      mainnetHeight: main?.height ?? null,
      poolAddress,
      poolShort: shortAddr(poolAddress),
      accountId: bal?.account?.accountId ?? null,
      available: bal?.wart?.total?.str ?? null,
      locked: bal?.wart?.locked?.str ?? null,
    },
    cartesi: pool
      ? {
          address: pool.address,
          short: shortAddr(pool.address),
          clientBorn: !!pool.clientBorn,
          orbitLive: pool.orbit?.liveCount ?? null,
          orbitN: pool.orbit?.nOfN ?? null,
          packFloor: pool.packFloor ?? null,
          seat1: !!(seats && seats['1']),
          seat2: !!(seats && seats['2']),
          hasD1: !!pool.hasD1,
          hasD2: !!pool.hasD2,
          hasFullKey: !!pool.hasFullKey,
        }
      : null,
    hemi: hemi?.result
      ? { chainId: 43111, block: Number.parseInt(hemi.result, 16) }
      : null,
    errors,
  };

  cache = { at: now, body };
  return body;
}
