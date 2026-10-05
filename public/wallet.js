/**
 * Hemi wallet connect.
 * Docs: MetaMask or Rabby, then Hemi mainnet.
 * Chain id 43111, RPC https://rpc.hemi.network/rpc, gas token ETH.
 * This button only requests the account and the network. It does not sign or send.
 */
const HEMI_CHAIN_ID = 43111;
const HEMI_CHAIN_HEX = '0xa867';
const HEMI_CHAIN = {
  chainId: HEMI_CHAIN_HEX,
  chainName: 'Hemi',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.hemi.network/rpc'],
  blockExplorerUrls: ['https://explorer.hemi.xyz'],
};

const walletButton = document.getElementById('wallet-connect');
const walletNote = document.getElementById('wallet-note');

function walletProvider() {
  const eth = window.ethereum;
  if (!eth) return null;
  const list = eth.providers;
  if (Array.isArray(list) && list.length) {
    return list.find((item) => item.isMetaMask || item.isRabby) || list[0];
  }
  return eth;
}

function shortWallet(addr) {
  const hex = String(addr || '');
  if (hex.length < 12) return hex;
  return `${hex.slice(0, 6)}…${hex.slice(-4)}`;
}

function setWalletNote(text) {
  if (!walletNote) return;
  walletNote.textContent = text;
}

function paintWallet(address, chainId) {
  const onHemi = chainId === HEMI_CHAIN_ID;
  if (!walletButton) return;
  walletButton.classList.toggle('is-on', !!address && onHemi);
  if (!address) {
    walletButton.textContent = 'Connect wallet';
    setWalletNote('Best clears stay in this browser. Connecting does not sign or spend.');
    return;
  }
  walletButton.textContent = onHemi ? shortWallet(address) : 'Switch to Hemi';
  setWalletNote(onHemi
    ? `Connected on Hemi mainnet. Best clears stay in this browser under relay-zone-best. Nothing is signed or spent.`
    : 'This wallet is on another network. Hemi mainnet is chain 43111.');
}

async function ensureHemi(provider) {
  const current = await provider.request({ method: 'eth_chainId' });
  if (Number.parseInt(current, 16) === HEMI_CHAIN_ID) return HEMI_CHAIN_ID;
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: HEMI_CHAIN_HEX }],
    });
  } catch (err) {
    if (err?.code !== 4902) throw err;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [HEMI_CHAIN],
    });
  }
  const next = await provider.request({ method: 'eth_chainId' });
  return Number.parseInt(next, 16);
}

async function readWallet() {
  const provider = walletProvider();
  if (!provider) {
    paintWallet(null, null);
    return;
  }
  try {
    const accounts = await provider.request({ method: 'eth_accounts' });
    const chain = await provider.request({ method: 'eth_chainId' });
    paintWallet(accounts?.[0] || null, Number.parseInt(chain, 16));
  } catch {
    paintWallet(null, null);
  }
}

async function connectWallet() {
  const provider = walletProvider();
  if (!provider) {
    paintWallet(null, null);
    setWalletNote('No wallet in this browser. Hemi’s docs use MetaMask or Rabby.');
    return;
  }
  if (walletButton) walletButton.disabled = true;
  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const chainId = await ensureHemi(provider);
    paintWallet(accounts?.[0] || null, chainId);
  } catch (err) {
    const refused = err?.code === 4001;
    setWalletNote(refused
      ? 'The wallet request was declined. Nothing was signed or spent.'
      : 'The wallet did not switch to Hemi mainnet. Nothing was signed or spent.');
  } finally {
    if (walletButton) walletButton.disabled = false;
  }
}

function watchWallet() {
  const provider = walletProvider();
  if (!provider || provider.__relayWatch) return;
  provider.__relayWatch = true;
  provider.on?.('accountsChanged', () => { readWallet(); });
  provider.on?.('chainChanged', () => { readWallet(); });
}

if (walletButton) {
  walletButton.addEventListener('click', () => { connectWallet(); });
  readWallet();
  watchWallet();
  window.addEventListener('ethereum#initialized', () => {
    watchWallet();
    readWallet();
  });
}
