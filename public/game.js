/**
 * Relay Zones.
 * Five Hemi stages: Hemi Rise, Hemi Span, Hemi Deep, Hemi Gale, Hemi Crown.
 * Each one is longer and harder. Gale and Crown skimmers fire down on a slant.
 * Space jumps. E attacks. The mouse wheel cycles owned weapons. Hold Q to guard.
 * F confirms the relay. I pauses on the armor bag. Chain chips are display-only.
 * Health is five Hemi marks. Gold armor hits harder. Blue armor is faster.
 * Pick Hemigo or Orami, then a map. Both use the same gear.
 * The Hemi block you start on plants one glowing page and the boss at the door.
 * An even block calls a Shard. An odd block calls a Hex.
 */
const GRAV = 1700;
const VIEW_W = 480;
const VIEW_H = 270;
const G = 860;
const SHAFT = 90;

const HEMIGO = {
  id: 'hemigo',
  name: 'Hemigo',
  maxHp: 5,
  speed: 146,
  jumpV: 500,
  range: 36,
  body: 'assets/pilot.png',
  slash: '#ffe7a3',
};
HEMIGO.single = (HEMIGO.jumpV * HEMIGO.jumpV) / (2 * GRAV);

const ORAMI = {
  id: 'orami',
  name: 'Orami',
  maxHp: 5,
  speed: 146,
  jumpV: 500,
  range: 36,
  body: 'assets/orami/idle.png',
  slash: '#ffb15a',
};
ORAMI.single = HEMIGO.single;

const HEROES = { hemigo: HEMIGO, orami: ORAMI, pilot: HEMIGO };
const HERO_KEY = 'relay-zone-hero';
const WEAR_KEY = 'relay-zone-wear';
const ORAMI_WALK_N = 9;
const KIT_WALK_N = 8;
const KIT_IDLE_HAND = { x: 11, y: -24 };
const KIT_JUMP_HAND = { x: 12, y: -34 };
const KIT_WALK_HAND = [
  { x: 10, y: -28 },
  { x: 7, y: -26 },
  { x: 12, y: -28 },
  { x: 14, y: -28 },
  { x: 16, y: -28 },
  { x: 16, y: -28 },
  { x: 13, y: -28 },
  { x: 10, y: -26 },
];
let pickedHero = 'hemigo';

function heroById(id) {
  return id === 'orami' ? ORAMI : HEMIGO;
}

function resolveHero() {
  const query = qs.get('hero');
  if (query === 'orami' || query === 'hemigo' || query === 'pilot') return heroById(query);
  return heroById(pickedHero);
}

function setPickedHero(id, persist) {
  pickedHero = heroById(id).id;
  if (persist) {
    try { localStorage.setItem(HERO_KEY, pickedHero); } catch { /* this visit still keeps the pick */ }
  }
  document.querySelectorAll('.runner').forEach((node) => {
    const on = node.dataset.hero === pickedHero;
    node.classList.toggle('is-picked', on);
    node.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

const ITEM_META = [
  { id: 'blade', name: 'Sword', src: 'assets/gold/18.png', who: 'Hemi', arm: 'sword' },
  { id: 'axe', name: 'Axe', src: 'assets/weapons/axe.png', who: 'Hemi', arm: 'axe' },
  { id: 'gun', name: 'Rifle', src: 'assets/weapons/rifle.png', who: 'Hemi', arm: 'gun' },
  { id: 'spark', name: 'Spark', src: 'assets/blue/16.png', who: 'Hemi' },
  { id: 'shield', name: 'Shield', src: 'assets/weapons/shield.png' },
];
const ARMOR = [
  { id: 'goldhelm', name: 'Gold Helm', src: 'assets/gold/06.png', worn: 'assets/worn/gold-helm.png', slot: 'helm', kit: 'gold', stat: 'Sword and axe +1' },
  { id: 'goldplate', name: 'Gold Plate', src: 'assets/gold/10.png', side: 'assets/worn/gold-body.png', slot: 'chest', kit: 'gold', stat: 'Sword and axe +2' },
  { id: 'bluehelm', name: 'Blue Helm', src: 'assets/blue/01.png', worn: 'assets/worn/blue-helm.png', slot: 'helm', kit: 'blue', stat: 'Run faster' },
  { id: 'blueplate', name: 'Blue Plate', src: 'assets/blue/09.png', side: 'assets/worn/blue-body.png', slot: 'chest', kit: 'blue', stat: 'Swing and shoot faster' },
];
const ALL_META = [...ITEM_META, ...ARMOR];
const ARM_ORDER = ['sword', 'axe', 'gun'];
const THEME = {
  hemi: {
    sky0: '#123044', sky1: '#071018', star: '#7ee7ff', ink: '#7ee7ff', word: 'HEMI',
    gate: '#102433', bar: '#7ee7ff', doorOn: '#7ee7ff', doorOff: '#1a3344',
  },
  wart: {
    sky0: '#3a2410', sky1: '#120a04', star: '#ffc107', ink: '#ffc107', word: 'WART',
    gate: '#2a1608', bar: '#ffc107', doorOn: '#ffc107', doorOff: '#2a1a0c',
  },
  cart: {
    sky0: '#2a1848', sky1: '#100818', star: '#e0b0ff', ink: '#e0b0ff', word: 'CART',
    gate: '#241433', bar: '#e0b0ff', doorOn: '#e0b0ff', doorOff: '#2a1844',
  },
};

const PAL = {
  wart: { body: '#a56b28', top: '#ffc107', mortar: '#5a3814' },
  hemi: { body: '#2f6ea8', top: '#7ee7ff', mortar: '#17385c' },
  cart: { body: '#7a44a8', top: '#e0b0ff', mortar: '#3d2058' },
  ceil: { body: '#3a354c', top: '#8d86a8', mortar: '#221e30' },
  glide: { body: '#245c78', top: '#d6ff4a', mortar: '#123246' },
};

const qs = new URLSearchParams(location.search);

const el = {
  select: document.getElementById('select'),
  play: document.getElementById('play'),
  win: document.getElementById('win'),
  startHemi: document.getElementById('start-hemi'),
  startWart: document.getElementById('start-wart'),
  startCart: document.getElementById('start-cart'),
  startGale: document.getElementById('start-gale'),
  startCrown: document.getElementById('start-crown'),
  selectNote: document.getElementById('select-note'),
  zoneCount: document.getElementById('zone-count'),
  again: document.getElementById('again'),
  quit: document.getElementById('quit'),
  bagOpen: document.getElementById('bag-open'),
  bag: document.getElementById('bag'),
  bagGrid: document.getElementById('bag-grid'),
  bagClose: document.getElementById('bag-close'),
  bagHelm: document.getElementById('bag-helm'),
  bagChest: document.getElementById('bag-chest'),
  bagHelmEmpty: document.getElementById('bag-helm-empty'),
  bagChestEmpty: document.getElementById('bag-chest-empty'),
  bagPilot: document.getElementById('bag-pilot'),
  bagCaption: document.getElementById('bag-caption'),
  bagStat: document.getElementById('bag-stat'),
  zoneName: document.getElementById('zone-name'),
  vital: document.getElementById('vital'),
  score: document.getElementById('score'),
  goal: document.getElementById('goal'),
  best: document.getElementById('best-score'),
  winEyebrow: document.getElementById('win-eyebrow'),
  winTitle: document.getElementById('win-title'),
  inv: document.getElementById('inv'),
  chips: document.getElementById('chips'),
  selectChips: document.getElementById('select-chips'),
  winChips: document.getElementById('win-chips'),
  winCopy: document.getElementById('win-copy'),
  frame: document.getElementById('frame'),
  canvas: document.getElementById('view'),
  toast: document.getElementById('toast'),
  prompt: document.getElementById('prompt'),
  stickZone: document.getElementById('stick-zone'),
  stickBase: document.getElementById('stick-base'),
  stickThumb: document.getElementById('stick-thumb'),
  sim: document.getElementById('sim-out'),
};

const ctx = el.canvas.getContext('2d');
let viewW = VIEW_W;
let viewH = VIEW_H;
const images = {};

function loadImage(src) {
  if (images[src]) return images[src];
  const img = new Image();
  img.src = src;
  images[src] = img;
  return img;
}

loadImage(HEMIGO.body);
loadImage(ORAMI.body);
for (const body of ['bare', 'gold', 'blue']) {
  for (const helm of ['none', 'gold', 'blue']) {
    const look = `${body}-${helm}`;
    loadImage(`assets/orami/${look}-idle.png`);
    loadImage(`assets/orami/${look}-walk.png`);
    loadImage(`assets/orami/${look}-jump.png`);
  }
}
for (const look of ['gold', 'blue', 'gold-blue', 'blue-gold']) {
  loadImage(`assets/kits/${look}-idle.png`);
  loadImage(`assets/kits/${look}-walk.png`);
  loadImage(`assets/kits/${look}-jump.png`);
}
loadImage('assets/flyer/glide.png');
loadImage('assets/flyer/flap.png');
for (const item of ALL_META) loadImage(item.src);
for (const piece of ARMOR) {
  if (piece.worn) loadImage(piece.worn);
  if (piece.side) loadImage(piece.side);
}
loadImage('assets/worn/pilot-head.png');
loadImage('assets/js1/14.png');
loadImage('assets/wisp/00.png');

const input = {
  left: false,
  right: false,
  jumpQueued: false,
  jumpRelease: false,
  attackQueued: false,
  useQueued: false,
  stickX: 0,
  stickY: 0,
  shieldHeld: false,
};

const keys = new Set();
const stick = { id: null, dx: 0, dy: 0 };

let state = null;
let chains = null;
let raf = 0;
let lastNow = 0;

function ember(id, name, x, y) {
  return {
    id,
    kind: 'ember',
    name,
    x,
    y,
    w: 28,
    h: 26,
    hp: 3,
    max: 3,
    dir: -1,
    speed: 0,
    sprite: 'assets/wisp/00.png',
    artLeft: true,
    drawH: 46,
    plated: false,
    cooldown: 0.8,
  };
}

function librarian(id, x, minX, maxX, hp, speed, hopCd) {
  return {
    id,
    kind: 'librarian',
    name: 'Librarian',
    x,
    y: G - 32,
    baseY: G - 32,
    w: 30,
    h: 32,
    hp,
    max: hp,
    minX,
    maxX,
    dir: 1,
    speed,
    sprite: 'assets/js1/14.png',
    drawH: 54,
    plated: false,
    hopCd: hopCd == null ? 1.65 + (Math.abs(Math.round(x)) % 9) * 0.08 : hopCd,
    hopEvery: 1.85 + (Math.abs(Math.round(x)) % 5) * 0.17,
    hopV: -250,
    vy: 0,
    grounded: true,
  };
}

function placeEmber(id, name, x) {
  const foe = ember(id, name, x, G - 30);
  foe.cooldown = 1.3;
  return foe;
}

function placeFlyer(id, x, shoot) {
  const y = G - 98;
  const seed = Math.abs(Math.round(x));
  const span = shoot ? 118 : 78;
  return {
    id,
    kind: 'flyer',
    name: 'Skimmer',
    x,
    y,
    baseY: y,
    w: 36,
    h: 20,
    hp: 3,
    max: 3,
    minX: x - span,
    maxX: x + span,
    dir: seed % 2 === 0 ? 1 : -1,
    speed: (shoot ? 44 : 32) + (seed % 5) * 3,
    phase: (seed % 7) * 0.55,
    bob: shoot ? 12 : 7,
    sprite: 'assets/flyer/glide.png',
    flap: 'assets/flyer/flap.png',
    drawH: 46,
    plated: false,
    shoot: !!shoot,
    cooldown: shoot ? 0.55 + (seed % 6) * 0.2 : 0,
  };
}

function buildStage(tier) {
  const gap = 52;
  const aW = 520;
  const bW = 460;
  const cW = 700;
  const bX = aW + gap;
  const cX = bX + bW + gap;
  const hallX = cX + cW + gap;
  const shafts = tier + 1;
  const sparkX = hallX + 5400 + (tier - 1) * 780;
  const ledge0 = sparkX + 240;
  const ledgeStep = 150;
  const ledgeW = 340;
  const topX = ledge0 + (shafts - 1) * ledgeStep;
  const topY = G - SHAFT * shafts;
  const topEnd = topX + ledgeW;
  const preGate = tier >= 5 ? 1200 : tier >= 4 ? 1040 : tier >= 3 ? 880 : 580;
  const gateX = topEnd + preGate;
  const exitX = gateX + 340;
  const names = ['', 'Hemi Rise', 'Hemi Span', 'Hemi Deep', 'Hemi Gale', 'Hemi Crown'];
  const doors = ['', 'RISE', 'SPAN', 'DEEP', 'GALE', 'CROWN'];
  const zones = ['', 'hemi', 'wart', 'cart', 'gale', 'crown'];
  const one = (id, x, y, w, h) => ({ id, x, y, w, h, oneWay: true, kind: 'hemi' });
  const glide = (id, x, y, w, slide, phase, bob) => ({
    id,
    x,
    y,
    homeX: x,
    homeY: y,
    w,
    h: 14,
    oneWay: true,
    kind: 'glide',
    slide,
    phase,
    rate: 0.9,
    bob: bob || 0,
  });
  const platforms = [
    one('a', 0, G, aW, 180),
    one('b', bX, G, bW, 180),
    one('c', cX, G, cW, 180),
    one('hall', hallX, G, exitX + 280 - hallX, 200),
  ];
  for (let i = 0; i < shafts; i += 1) {
    platforms.push(one(`h${i}`, ledge0 + i * ledgeStep, G - SHAFT * (i + 1), ledgeW, 16));
  }
  if (tier >= 3) {
    platforms.push({ id: 'ceil', x: hallX + 2050, y: G - 78, w: 640, h: 22, oneWay: false, kind: 'ceil' });
  }
  if (tier >= 4) {
    platforms.push(glide('glide-a', hallX + 1100, G - 64, 168, 92, 0.2, 6));
    platforms.push(glide('glide-b', hallX + 3340, G - 58, 156, 84, 1.6, 4));
    platforms.push({ id: 'ceil-b', x: hallX + 4180, y: G - 86, w: 500, h: 20, oneWay: false, kind: 'ceil' });
  }
  if (tier >= 5) {
    platforms.push(glide('glide-c', hallX + 5280, G - 66, 160, 80, 0.8, 6));
    platforms.push(glide('glide-d', hallX + 6020, G - 118, 140, 70, 2.2, 0));
    platforms.push({ id: 'ceil-c', x: hallX + 7240, y: G - 96, w: 420, h: 18, oneWay: false, kind: 'ceil' });
  }
  const plateX = hallX + 860;
  const items = [
    { id: 'shield', x: 170, y: G - 32, got: false },
    { id: 'blade', x: bX + 150, y: G - 36, got: false },
    { id: 'goldhelm', x: cX + 110, y: G - 34, got: false },
    { id: 'bluehelm', x: cX + 280, y: G - 34, got: false },
    { id: 'goldplate', x: cX + 500, y: G - 34, got: false },
    { id: 'spark', x: sparkX, y: G - 28, got: false },
    { id: 'blueplate', x: gateX - 200, y: G - 34, got: false },
    { id: 'axe', x: hallX + 2280, y: G - 32, got: false },
    { id: 'gun', x: gateX - 260, y: G - 32, got: false },
  ];
  const pace = 24 + tier * 6;
  const enemies = [
    librarian('lib-open', 400, 368, 452, 2, 18, 0.55),
    librarian('lib-b', bX + 300, bX + 230, bX + bW - 40, 2, pace, null),
    librarian('lib-h1', hallX + 340, hallX + 220, hallX + 500, 2 + tier, pace, null),
    librarian('lib-h2', hallX + 1680, hallX + 1500, hallX + 1900, 2 + tier, pace + 4, null),
    librarian('lib-h3', hallX + 2920, hallX + 2740, hallX + 3140, 2 + tier, pace + 2, null),
  ];
  if (tier >= 2) {
    enemies.push(librarian('lib-h4', hallX + 3900, hallX + 3720, hallX + 4120, 3 + tier, pace + 6, null));
  }
  if (tier >= 3) {
    enemies.push(librarian('lib-h5', hallX + 4900, hallX + 4720, hallX + 5140, 4 + tier, pace + 8, null));
  }
  if (tier >= 4) {
    enemies.push(librarian('lib-h6', hallX + 5600, hallX + 5420, hallX + 5840, 4 + tier, pace + 8, null));
  }
  if (tier >= 5) {
    enemies.push(librarian('lib-h7', hallX + 6800, hallX + 6620, hallX + 7100, 5 + tier, pace + 10, null));
  }
  enemies.push({
    id: 'plate',
    kind: 'plate',
    name: 'Bound Librarian',
    x: plateX,
    y: G - 36,
    baseY: G - 36,
    w: 34,
    h: 36,
    hp: 6 + (tier - 1) * 4,
    max: 6 + (tier - 1) * 4,
    minX: plateX - 110,
    maxX: plateX + 110,
    dir: -1,
    speed: 16 + tier * 4,
    sprite: 'assets/js1/14.png',
    drawH: 54,
    plated: true,
    hopCd: 1.85,
    hopEvery: 2.35,
    hopV: -210,
    vy: 0,
    grounded: true,
  });
  enemies.push(placeEmber('cinder', 'Cinder', hallX + 1760));
  if (tier >= 2) enemies.push(placeEmber('ash', 'Ash', hallX + 3180));
  if (tier >= 3) enemies.push(placeEmber('soot', 'Soot', hallX + 4520));
  if (tier >= 4) enemies.push(placeEmber('flare', 'Flare', hallX + 2500));
  if (tier >= 5) enemies.push(placeEmber('brand', 'Brand', hallX + 5900));
  const slant = tier >= 4;
  enemies.push(placeFlyer('skim-a', hallX + 1240, slant));
  enemies.push(placeFlyer('skim-b', hallX + 3560, slant));
  if (tier >= 2) enemies.push(placeFlyer('skim-c', hallX + 4980, slant));
  if (tier >= 3) {
    enemies.push(placeFlyer('skim-d', hallX + 6360, slant));
    enemies.push(placeFlyer('skim-e', gateX - 520, slant));
  }
  if (tier >= 4) enemies.push(placeFlyer('skim-f', hallX + 3000, true));
  if (tier >= 5) enemies.push(placeFlyer('skim-g', hallX + 6600, true));
  if (tier >= 3) {
    enemies.push({
      id: 'wisp',
      kind: 'turret',
      name: 'Wisp',
      x: gateX - 300,
      y: G - 36,
      baseY: G - 36,
      w: 40,
      h: 28,
      hp: 4,
      max: 4,
      dir: -1,
      sprite: 'assets/wisp/00.png',
      artLeft: true,
      drawH: 58,
      plated: false,
      cooldown: 1.45,
    });
  }
  if (tier >= 5) {
    enemies.push({
      id: 'wisp-b',
      kind: 'turret',
      name: 'Wisp',
      x: gateX - 680,
      y: G - 36,
      baseY: G - 36,
      w: 40,
      h: 28,
      hp: 5,
      max: 5,
      dir: -1,
      sprite: 'assets/wisp/00.png',
      artLeft: true,
      drawH: 58,
      plated: false,
      cooldown: 1.05,
    });
  }
  const relay = { x: topX + 170, y: topY, r: 52 };
  const stageName = names[tier];
  const signs = [
    { x: 78, text: stageName, once: 'Empty hands. Space jumps. E attacks. The wheel cycles weapons. F confirms the relay. I opens armor.' },
    { x: 168, text: 'Shield', once: 'Shield. Hold Q. Fireballs from the front bounce off.' },
    { x: bX + 150, text: 'Sword', once: 'Sword in hand. E cuts a slash. Librarians pace and hop.' },
    { x: cX + 110, text: 'Helm', once: 'Gold helm. It adds one damage to the sword and the axe. Press I to look at it. The rise pauses.' },
    { x: hallX + 1240, text: 'Skimmer', once: tier >= 4
      ? 'Skimmers cruise above the floor and fire down on a slant. Jump, then E. Hold Q if the bolt is in front of you.'
      : 'Skimmers cruise above the floor. Jump, then E.' },
    { x: hallX + 2280, text: 'Axe', once: 'Axe before the gate. E chops. The wheel still swaps weapons.' },
    { x: sparkX, text: 'Spark', once: 'Hemi spark. Press Space again in the air. One hop will not clear the shaft.' },
    { x: gateX - 260, text: 'Rifle', once: 'Rifle before the gate. E fires. The wheel still swaps weapons.' },
    { x: relay.x, y: relay.y, text: 'Relay', once: 'Hemi relay. F confirms the block this run started on. The gate on the floor stays shut until then.' },
    { x: gateX - 20, text: 'Gate', once: 'The boss waits just behind this gate. The door stays shut until the Shard or the Hex drops.' },
  ];
  if (tier >= 4) {
    signs.push({
      x: hallX + 1100,
      text: 'Drift',
      once: 'These spans slide. Ride one to clear a librarian. One hop still will not clear a shaft.',
    });
  }
  if (tier >= 5) {
    signs.push({
      x: hallX + 6020,
      text: 'Crown',
      once: 'The high span needs the spark. The boss throws a wider volley on each later rise.',
    });
  }
  return {
    zone: zones[tier],
    tier,
    name: stageName,
    door: doors[tier],
    platforms,
    items,
    enemies,
    signs,
    beacons: [{ id: 'hemi', x: relay.x, y: relay.y, label: 'Hemi relay' }],
    relay,
    gate: { x: gateX, y: G - 210, w: 26, h: 210 },
    exit: { x: exitX, w: 90 },
    checks: [cX, hallX + 180, plateX - 60, sparkX - 80, gateX - 240],
    words: [[200, 760], [hallX + 200, 760], [sparkX - 40, 720], [gateX - 20, 760]],
  };
}

const ZONE_TIER = { hemi: 1, wart: 2, cart: 3, gale: 4, crown: 5 };
const ZONE_ORDER = ['hemi', 'wart', 'cart', 'gale', 'crown'];
const ZONE_TITLES = {
  hemi: 'Hemi Rise',
  wart: 'Hemi Span',
  cart: 'Hemi Deep',
  gale: 'Hemi Gale',
  crown: 'Hemi Crown',
};

function readWear() {
  try {
    const raw = JSON.parse(localStorage.getItem(WEAR_KEY) || '{}');
    const helm = raw.helm === 'goldhelm' || raw.helm === 'bluehelm' ? raw.helm : null;
    const chest = raw.chest === 'goldplate' || raw.chest === 'blueplate' ? raw.chest : null;
    return { helm, chest };
  } catch {
    return { helm: null, chest: null };
  }
}

function writeWear(armor) {
  const helm = armor?.helm === 'goldhelm' || armor?.helm === 'bluehelm' ? armor.helm : null;
  const chest = armor?.chest === 'goldplate' || armor?.chest === 'blueplate' ? armor.chest : null;
  try { localStorage.setItem(WEAR_KEY, JSON.stringify({ helm, chest })); } catch { /* this visit still wears it */ }
}

function bossRest(parity, tier) {
  const base = parity === 'odd' ? 1.2 : 1.75;
  return Math.max(0.48, base - (Math.max(1, tier) - 1) * 0.24);
}

function bossBoltCount(tier) {
  return Math.max(1, Math.min(5, tier || 1));
}

function fireBossVolley(enemy, origin, dir) {
  const tier = state.level.tier || 1;
  const odd = enemy.parity === 'odd';
  const speed = odd ? 168 : 136;
  const color = odd ? '#ff9a3c' : '#9aefff';
  const patterns = [
    { vx: 1, vy: 0, oy: 8, ox: 14 },
    { vx: 0.78, vy: 0.62, oy: 10, ox: 22 },
    { vx: 0.84, vy: -0.48, oy: 2, ox: 18 },
    { vx: 0.58, vy: 0.92, oy: 14, ox: 26 },
    { vx: 0.92, vy: 0.34, oy: 6, ox: 20 },
  ];
  const n = bossBoltCount(tier);
  for (let i = 0; i < n; i += 1) {
    const pat = patterns[i];
    state.shots.push({
      x: origin + dir * pat.ox,
      y: enemy.y + pat.oy,
      w: 12,
      h: 8,
      vx: dir * speed * pat.vx,
      vy: speed * pat.vy,
      life: 2.4,
      color,
      friendly: false,
    });
  }
}


function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const PAGE_WORTH = [80, 140, 200];

function pageSpots() {
  const y = G - 26;
  return [
    { x: 230, y },
    { x: 290, y },
    { x: 350, y },
  ];
}

function stampRun() {
  const h = chains?.hemi;
  const w = chains?.warthog;
  const c = chains?.cartesi;
  const block = Number(h?.block);
  const height = Number(w?.defiHeight);
  const hasBlock = Number.isFinite(block) && block > 0;
  const hasHeight = Number.isFinite(height) && height > 0;
  const orbitLive = c && c.orbitLive != null ? Number(c.orbitLive) : null;
  const orbitN = c && c.orbitN != null ? Number(c.orbitN) : null;
  return {
    block: hasBlock ? block : 0,
    chainId: h?.chainId || 43111,
    height: hasHeight ? height : 0,
    slot: hasBlock ? block % 3 : 0,
    worth: hasHeight ? PAGE_WORTH[height % 3] : 80,
    orbitLive: Number.isFinite(orbitLive) ? orbitLive : null,
    orbitN: Number.isFinite(orbitN) ? orbitN : null,
    mark: hasBlock ? String(block).slice(-3) : '··',
  };
}

function plantPage(level, stamp) {
  const spot = pageSpots()[stamp.slot % 3];
  level.page = {
    x: spot.x,
    y: spot.y,
    worth: stamp.worth,
    mark: stamp.block ? `HEMI #${stamp.block}` : 'HEMI',
    got: false,
  };
}

function plantBoss(level, stamp) {
  const even = !stamp.block || stamp.block % 2 === 0;
  const tier = level.tier || 1;
  const y = G - 32;
  const home = level.gate.x + 118;
  const hp = (even ? 6 : 8) + (tier - 1) * 4;
  level.enemies.push({
    id: 'boss',
    kind: 'boss',
    name: even ? 'Shard' : 'Hex',
    parity: even ? 'even' : 'odd',
    x: home,
    y,
    baseY: y,
    w: 34,
    h: 32,
    hp,
    max: hp,
    minX: level.gate.x + 46,
    maxX: level.exit.x - 78,
    dir: -1,
    speed: (even ? 26 : 36) + tier * 6,
    sprite: 'assets/wisp/00.png',
    artLeft: true,
    drawH: 78,
    plated: false,
    hopCd: even ? 1.55 : 1.2,
    hopEvery: even ? 1.8 : 1.28,
    hopV: even ? -280 : -330,
    vy: 0,
    grounded: true,
    cooldown: Math.max(0.4, (even ? 1.4 : 1.0) - (tier - 1) * 0.16),
  });
}

function startGame(zoneId) {
  const zone = ZONE_TIER[zoneId] ? zoneId : 'hemi';
  const hero = resolveHero();
  const level = buildStage(ZONE_TIER[zone]);
  const wear = readWear();
  for (const item of level.items) {
    if (item.id === wear.helm || item.id === wear.chest) item.got = true;
  }
  const stamp = stampRun();
  plantPage(level, stamp);
  plantBoss(level, stamp);
  state = {
    mode: 'play',
    zone,
    hero,
    player: {
      x: 72,
      y: G - 30,
      w: 22,
      h: 30,
      vx: 0,
      vy: 0,
      face: 1,
      onGround: false,
      hp: 5,
      iframes: 0,
      airtime: 0,
      airJumps: 0,
      attackCd: 0,
      attackT: 0,
      attackDur: 0.2,
      attackKind: '',
      attackHit: false,
      gait: 0,
    },
    level,
    weapon: null,
    maxHp: 5,
    armor: { helm: wear.helm, chest: wear.chest },
    inv: {
      eye: false,
      blade: false,
      axe: false,
      gun: false,
      spark: false,
      filament: false,
      goldhelm: wear.helm === 'goldhelm',
      goldplate: wear.chest === 'goldplate',
      bluehelm: wear.helm === 'bluehelm',
      blueplate: wear.chest === 'blueplate',
      shield: false,
    },
    shieldPing: 0,
    sealOpen: false,
    powered: false,
    shots: [],
    fireHits: 0,
    cam: { x: 0, y: 0 },
    shake: 0,
    checkpoint: { x: 72, y: G - 30 },
    nextCheck: 0,
    time: 0,
    score: 0,
    pops: [],
    stamp,
    toastUntil: 0,
    lastToast: '',
    lastToastAt: 0,
    prompt: '',
    promptId: '',
    jumpBuffer: 0,
    peak: 0,
    riseOrigin: null,
    maxSingle: 0,
    maxDouble: 0,
    hopPeak: 0,
    simT: 0,
    stuckT: 0,
    stuckX: 72,
    wantDouble: false,
    usedPrompt: '',
  };
  fit();
  state.cam.y = Math.max(180, state.player.y - viewH * 0.62);
  el.select.hidden = true;
  el.win.hidden = true;
  el.play.hidden = false;
  el.bag.hidden = true;
  document.body.dataset.zone = zone;
  renderHud();
  const even = !stamp.block || stamp.block % 2 === 0;
  const stamped = stamp.block
    ? `Hemi #${stamp.block} is ${even ? 'even' : 'odd'}`
    : 'Hemi is quiet, so this run is even';
  const bossName = even ? 'Shard' : 'Hex';
  const wornNames = [wear.helm, wear.chest]
    .map((id) => ARMOR.find((piece) => piece.id === id)?.name)
    .filter(Boolean);
  const wornLine = wornNames.length ? ` ${wornNames.join(' and ')} still on.` : '';
  toast(`${stamped}. A ${bossName} waits behind the gate.${wornLine} The sword is ahead on ${level.name}.`);
}

const CLEAR_KEY = 'relay-zone-clears';
const BEST_KEY = 'relay-zone-best';

function bestScore() {
  const n = Number(localStorage.getItem(BEST_KEY) || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function noteBest(score) {
  if (score > bestScore()) localStorage.setItem(BEST_KEY, String(score));
}

function paintBest() {
  if (!el.best) return;
  const n = bestScore();
  el.best.hidden = !n;
  el.best.textContent = n ? `Best clear ${n}` : '';
}

function goalLine() {
  if (!state) return '';
  const boss = state.level?.enemies?.find((enemy) => enemy.kind === 'boss' && enemy.hp > 0);
  let line = 'The gate is open. Walk through the door';
  if (!state.inv.blade) line = 'Find the sword';
  else if (!state.inv.spark) line = 'Find the spark. One hop will not clear the shaft';
  else if (!state.powered) line = 'Climb the shaft and confirm the relay';
  else if (boss) line = `Drop the ${boss.name}, then take the door`;
  const page = state.level?.page;
  if (page && !page.got) line += ' · grab the glowing page ahead';
  return line;
}

function addScore(n, x, y) {
  if (!state || !n) return;
  state.score += n;
  state.pops.push({ x, y: y - 8, text: `+${n}`, life: 0.7 });
  if (state.pops.length > 14) state.pops.shift();
  paintScore();
}

function paintScore() {
  if (!state) return;
  if (el.score) el.score.textContent = String(state.score);
  if (el.goal) el.goal.textContent = goalLine();
}

function clearedZones() {
  try {
    const raw = JSON.parse(localStorage.getItem(CLEAR_KEY) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function markClear(zone) {
  const next = new Set(clearedZones());
  next.add(zone);
  localStorage.setItem(CLEAR_KEY, JSON.stringify([...next]));
}

function renderZonePicks() {
  const done = new Set(clearedZones());
  if (el.startCart) el.startCart.hidden = false;
  if (el.startGale) el.startGale.hidden = false;
  if (el.startCrown) el.startCrown.hidden = false;
  if (el.zoneCount) el.zoneCount.textContent = 'Five Hemi stages';
  for (const [id, node] of [
    ['hemi', el.startHemi],
    ['wart', el.startWart],
    ['cart', el.startCart],
    ['gale', el.startGale],
    ['crown', el.startCrown],
  ]) {
    const mark = node?.querySelector('.zone-clear');
    if (mark) mark.hidden = !done.has(id);
  }
}

function showSelect(note) {
  state = null;
  delete document.body.dataset.zone;
  el.play.hidden = true;
  el.win.hidden = true;
  el.bag.hidden = true;
  el.select.hidden = false;
  renderZonePicks();
  paintBest();
  if (el.selectNote) {
    el.selectNote.hidden = !note;
    el.selectNote.textContent = note || '';
  }
}

function toast(msg) {
  const now = performance.now();
  if (state && state.lastToast === msg && now - state.lastToastAt < 1400) return;
  if (state) {
    state.lastToast = msg;
    state.lastToastAt = now;
    state.toastUntil = now + 2600;
  }
  el.toast.textContent = msg;
  el.toast.classList.add('show');
}

function renderHud() {
  if (!state) return;
  const { player, inv } = state;
  el.zoneName.textContent = state.level.name;
  paintVital();
  el.inv.innerHTML = ITEM_META.map((item) => {
    const on = inv[item.id] ? 'on' : '';
    const armed = item.arm && state.weapon === item.arm ? ' armed' : '';
    const title = armed ? `${item.name} in hand` : inv[item.id] ? `${item.name} carried` : item.name;
    const arm = item.arm ? ` data-arm="${item.arm}"` : '';
    return `<img class="slot ${on}${armed}"${arm} alt="${title}" title="${title}" src="${item.src}" />`;
  }).join('');
}

function paintVital() {
  const src = 'assets/ui/hemi.png';
  const hp = Math.max(0, Math.min(5, state.player.hp));
  el.vital.innerHTML = Array.from({ length: 5 }, (_, i) =>
    `<img class="pip${i < hp ? '' : ' off'}" src="${src}" alt="" />`,
  ).join('');
  el.vital.setAttribute('aria-label', `${hp} of 5 health`);
  paintScore();
}

function applyArmor() {
  state.maxHp = 5;
  if (state.player.hp > state.maxHp) state.player.hp = state.maxHp;
  renderHud();
}

function renderBag() {
  if (!state) return;
  const helm = ARMOR.find((piece) => piece.id === state.armor.helm);
  const chest = ARMOR.find((piece) => piece.id === state.armor.chest);
  el.bagHelm.hidden = !helm;
  el.bagHelmEmpty.hidden = !!helm;
  el.bagChest.hidden = !chest;
  el.bagChestEmpty.hidden = !!chest;
  if (helm) {
    el.bagHelm.src = helm.src;
    el.bagHelm.alt = helm.name;
  }
  if (chest) {
    el.bagChest.src = chest.src;
    el.bagChest.alt = chest.name;
  }
  const worn = [helm?.name, chest?.name].filter(Boolean);
  const who = state.hero?.name || 'Hemigo';
  el.bagCaption.textContent = `${who}. ${worn.length ? worn.join(' · ') : 'Nothing equipped yet.'}`;
  if (el.bagPilot) {
    const look = kitLook();
    el.bagPilot.src = state.hero?.id === 'orami'
      ? `assets/orami/${oramiLook()}-idle.png`
      : look
        ? `assets/kits/${look}-idle.png`
        : 'assets/pilot.png';
    el.bagPilot.alt = who;
  }
  const wornStats = [helm?.stat, chest?.stat].filter(Boolean);
  el.bagStat.textContent = wornStats.length
    ? wornStats.join(' · ')
    : 'Gold armor hits harder. Blue armor is faster. Health stays five marks.';
  el.bagGrid.innerHTML = ARMOR.map((piece) => {
    const owned = !!state.inv[piece.id];
    const equipped = state.armor[piece.slot] === piece.id;
    const cls = `piece${equipped ? ' equipped' : ''}${owned ? '' : ' locked'}`;
    const note = !owned ? 'In the zone' : equipped ? 'Equipped' : 'Equip';
    return `<button type="button" class="${cls}" data-armor="${piece.id}" ${owned ? '' : 'disabled'}><img src="${piece.src}" alt="" /><span>${piece.name}</span><small>${note}</small><small>${piece.stat}</small></button>`;
  }).join('');
}

function releaseInputs() {
  keys.clear();
  input.left = false;
  input.right = false;
  input.jumpQueued = false;
  input.jumpRelease = false;
  input.attackQueued = false;
  input.useQueued = false;
  input.shieldHeld = false;
  if (state) state.jumpBuffer = 0;
}

function setBag(open) {
  if (!state) return;
  if (open && state.mode === 'play') {
    state.mode = 'bag';
    releaseInputs();
    renderBag();
    el.bag.hidden = false;
  } else if (!open && state.mode === 'bag') {
    state.mode = 'play';
    releaseInputs();
    el.bag.hidden = true;
  }
}

function toggleBag() {
  if (!state) return;
  setBag(state.mode !== 'bag');
}

function toggleArmor(id) {
  if (!state || state.mode !== 'bag') return;
  const meta = ARMOR.find((piece) => piece.id === id);
  if (!meta || !state.inv[id]) {
    toast('That piece is still in the zone.');
    return;
  }
  if (state.armor[meta.slot] === id) state.armor[meta.slot] = null;
  else state.armor[meta.slot] = id;
  applyArmor();
  writeWear(state.armor);
  renderBag();
  toast(state.armor[meta.slot] === id ? `${meta.name} equipped.` : `${meta.name} taken off.`);
}

function chipList(target) {
  const bits = [];
  const w = chains?.warthog;
  const c = chains?.cartesi;
  const h = chains?.hemi;
  const run = state?.stamp;
  const height = run ? run.height : w?.defiHeight;
  const orbitLive = run ? run.orbitLive : c?.orbitLive;
  const orbitN = run ? run.orbitN : c?.orbitN;
  const block = run ? run.block : h?.block;
  if (height) {
    const wart = !run && w?.available ? ` · ${Number(w.available).toFixed(0)}` : '';
    bits.push(`<span class="chip wart">WART #${height}${wart}</span>`);
  } else bits.push('<span class="chip quiet">WART quiet</span>');
  if (run ? orbitLive != null : !!c) bits.push(`<span class="chip cart">Orbit ${orbitLive ?? '?'}/${orbitN ?? '?'}</span>`);
  else bits.push('<span class="chip quiet">Orbit quiet</span>');
  if (block) bits.push(`<span class="chip hemi">${run ? 'Run' : 'Hemi'} #${block}</span>`);
  else bits.push(`<span class="chip quiet">${run ? 'Run quiet' : 'Hemi quiet'}</span>`);
  target.innerHTML = bits.join('');
}

function renderChips() {
  chipList(el.chips);
  chipList(el.selectChips);
  if (!el.win.hidden) chipList(el.winChips);
}

async function pullChains() {
  try {
    const res = await fetch('/api/chains');
    chains = await res.json();
  } catch {
    chains = null;
  }
  renderChips();
}

function solids() {
  const list = state.level.platforms.filter((p) => !p.oneWay);
  if (!state.sealOpen) list.push(state.level.gate);
  for (const enemy of state.level.enemies) {
    if (enemy.plated && enemy.hp > 0) list.push(enemy);
  }
  return list;
}

function landables() {
  return state.level.platforms.filter((p) => p.oneWay);
}

function requestJump() {
  if (state && state.mode === 'play') state.jumpBuffer = 0.18;
}

function requestAttack() {
  input.attackQueued = true;
}

function requestUse() {
  input.useQueued = true;
}

function armNow() {
  if (state.weapon === 'sword' || state.weapon === 'axe' || state.weapon === 'gun') return state.weapon;
  if (state.inv.blade) return 'sword';
  if (state.inv.axe) return 'axe';
  return 'fist';
}

function attackBox(body) {
  const kind = body.attackKind || armNow();
  const reach = kind === 'axe' ? 44 : kind === 'sword' ? 40 : 16;
  let h = kind === 'axe' ? 30 : 18;
  let y = kind === 'axe' ? body.y + 2 : body.y + 8;
  if (!body.onGround) {
    y -= 26;
    h += 26;
  }
  if (body.face < 0) return { x: body.x - reach, y, w: reach, h };
  return { x: body.x + body.w, y, w: reach, h };
}

function downedLine(enemy) {
  if (enemy.kind === 'boss') return `${enemy.name} drops. The door is open.`;
  if (enemy.plated) return 'The librarian drops. The hall is open.';
  return `${enemy.name || 'Librarian'} down.`;
}

function markHit(enemy, power) {
  const dealt = power || 1;
  enemy.hp -= dealt;
  enemy.flash = 0.12;
  addScore(dealt * 20, enemy.x + enemy.w / 2, enemy.y);
  if (enemy.hp <= 0) {
    const bonus = enemy.kind === 'boss' ? 700 : enemy.plated ? 400 : 180;
    addScore(bonus, enemy.x, enemy.y - 14);
    toast(downedLine(enemy));
  }
}

function meleePower(kind) {
  const base = kind === 'axe' ? 3 : kind === 'sword' ? 2 : 0;
  if (!base) return 0;
  let bonus = 0;
  if (state.armor.helm === 'goldhelm') bonus += 1;
  if (state.armor.chest === 'goldplate') bonus += 2;
  return base + bonus;
}

function runSpeed() {
  let speed = state.hero.speed;
  if (state.armor.helm === 'bluehelm') speed *= 1.34;
  if (shielding()) speed *= 0.42;
  return speed;
}

function cool(seconds) {
  return state.armor.chest === 'blueplate' ? seconds * 0.58 : seconds;
}

function shielding() {
  if (!state || state.mode !== 'play' || !state.inv.shield) return false;
  return keys.has('q') || input.shieldHeld;
}

function inFront(x) {
  const mid = state.player.x + state.player.w / 2;
  return state.player.face >= 0 ? x >= mid - 8 : x <= mid + 8;
}

function pingShield() {
  if (state.shieldPing > 0) return;
  state.shieldPing = 0.28;
  state.shake = 0.05;
}

function beginAttack() {
  const player = state.player;
  if (player.attackCd > 0 || shielding()) return;
  const arm = armNow();
  if (arm === 'gun') {
    player.attackCd = cool(0.28);
    player.attackT = 0.08;
    player.attackDur = 0.08;
    player.attackKind = 'gun';
    const dir = player.face < 0 ? -1 : 1;
    state.shots.push({
      x: player.x + player.w / 2 + dir * 18,
      y: player.y + 8,
      w: 12,
      h: 4,
      vx: dir * 340,
      life: 0.85,
      color: '#bff6ff',
      friendly: true,
    });
    return;
  }
  const dur = arm === 'axe' ? 0.34 : arm === 'sword' ? 0.24 : 0.16;
  player.attackCd = cool(arm === 'axe' ? 0.46 : arm === 'sword' ? 0.34 : 0.38);
  player.attackT = dur;
  player.attackDur = dur;
  player.attackKind = arm;
  player.attackHit = false;
}

function hurt(fromX) {
  const player = state.player;
  if (player.iframes > 0 || player.hp <= 0) return;
  player.hp -= 1;
  player.iframes = 0.9;
  state.shake = 0.18;
  const dir = player.x + player.w / 2 < fromX ? -1 : 1;
  player.vx = dir * 160;
  player.vy = -220;
  renderHud();
  if (player.hp <= 0) respawn('Out of marks. Back at the last checkpoint.');
}

function respawn(why) {
  const player = state.player;
  player.x = state.checkpoint.x;
  player.y = state.checkpoint.y;
  player.vx = 0;
  player.vy = 0;
  player.hp = state.maxHp;
  player.iframes = 1.2;
  state.shots = [];
  renderHud();
  toast(why || 'Back at the last checkpoint.');
}

function grant(id) {
  if (state.inv[id]) return;
  state.inv[id] = true;
  const meta = ALL_META.find((item) => item.id === id);
  if (meta?.arm) state.weapon = meta.arm;
  if (meta?.slot && !state.armor[meta.slot]) {
    state.armor[meta.slot] = id;
    applyArmor();
    writeWear(state.armor);
  }
  renderHud();
  const worth = {
    blade: 100, axe: 120, gun: 160, spark: 250, shield: 140,
    goldhelm: 80, goldplate: 80, bluehelm: 80, blueplate: 80,
  };
  addScore(worth[id] || 40, state.player.x, state.player.y);
  if (id === 'blade') toast('Sword in hand. E cuts a slash.');
  else if (id === 'axe') toast('Axe in hand. E chops. The wheel swaps weapons.');
  else if (id === 'gun') toast('Rifle in hand. E fires.');
  else if (id === 'spark') toast('Hemi spark on your back. Space again in the air.');
  else if (id === 'shield') toast('Shield ready. Hold Q. Fireballs from the front bounce off.');
  else if (meta?.slot) toast(`${meta.name} picked up. ${meta.stat}. Press I to look at it.`);
  else toast(`${meta?.name || 'Item'} picked up.`);
}

function equipOwned(arm) {
  if (!state || state.mode !== 'play') return;
  const item = ITEM_META.find((entry) => entry.arm === arm);
  if (!item || !state.inv[item.id]) {
    toast(`You have not found a ${arm} yet.`);
    return;
  }
  state.weapon = arm;
  renderHud();
  const verb = arm === 'gun' ? 'E fires.' : arm === 'axe' ? 'E chops.' : 'E slashes.';
  toast(`${item.name} in hand. ${verb}`);
}

function cycleWeapon(dir) {
  if (!state || state.mode !== 'play') return;
  const owned = ARM_ORDER.filter((arm) => {
    const item = ITEM_META.find((entry) => entry.arm === arm);
    return item && state.inv[item.id];
  });
  if (!owned.length) {
    toast('No weapon yet.');
    return;
  }
  const idx = owned.indexOf(state.weapon);
  const next = owned[(idx + dir + owned.length * 2) % owned.length];
  if (next === state.weapon) return;
  equipOwned(next);
}

function hemiLine() {
  const block = state?.stamp ? state.stamp.block : chains?.hemi?.block;
  const chainId = state?.stamp?.chainId || chains?.hemi?.chainId || 43111;
  if (!block) return 'The Hemi relay is quiet. This rise still confirms.';
  return `Hemi chain ${chainId}, block #${block}.`;
}

function cartLine() {
  const c = chains?.cartesi;
  const live = state?.stamp ? state.stamp.orbitLive : c?.orbitLive;
  const n = state?.stamp ? state.stamp.orbitN : c?.orbitN;
  if (live == null) return 'The Cartesi vault is quiet. This well still confirms.';
  return `Cartesi orbit ${live}/${n}.`;
}

function postLine() {
  return hemiLine();
}

function tryUse() {
  const player = state.player;
  const mid = player.x + player.w / 2;
  const foot = player.y + player.h;
  const near = (x, y, r) => Math.abs(mid - x) < r && Math.abs(foot - y) < 80;
  const relay = state.level.relay;
  const boss = state.level.enemies.find((enemy) => enemy.kind === 'boss');
  const bossName = boss?.name || 'boss';

  if (near(relay.x, relay.y, relay.r)) {
    if (!state.inv.spark) {
      toast('The relay is dark. The Hemi spark is on the hall floor.');
      return;
    }
    if (!state.powered) {
      state.powered = true;
      state.sealOpen = true;
      addScore(500, player.x, player.y);
      toast(`${hemiLine()} Relay confirmed. The gate is open. ${bossName} waits behind it.`);
      return;
    }
    toast(postLine());
    return;
  }

  const gate = state.level.gate;
  if (!state.sealOpen && near(gate.x, G, 56)) toast('The gate is shut. Confirm the relay at the top of the shaft.');
}

function wartLine() {
  const w = chains?.warthog;
  const height = state?.stamp ? state.stamp.height : w?.defiHeight;
  if (!height) return 'The Wart post is quiet. This hollow still confirms.';
  const free = w?.available != null ? ` ${Number(w.available).toFixed(0)} WART is available.` : '';
  return `Warthog DeFi testnet block #${height}.${free}`;
}

function takePage() {
  const page = state.level.page;
  if (!page || page.got) return;
  const player = state.player;
  const cx = player.x + player.w / 2;
  const cy = player.y + player.h / 2;
  if (Math.hypot(cx - page.x, cy - page.y) > 36) return;
  page.got = true;
  addScore(page.worth, page.x, page.y);
  const stamp = state.stamp;
  const witness = stamp?.block ? `Hemi #${stamp.block}.` : 'Hemi is quiet.';
  const orbit = stamp?.orbitLive == null
    ? 'The vault is quiet.'
    : `Orbit ${stamp.orbitLive}/${stamp.orbitN} is awake.`;
  toast(`Page gathered. ${witness} ${orbit}`);
}

function paceHopper(enemy, dt) {
  enemy.hopCd = (enemy.hopCd ?? 1.6) - dt;
  if (enemy.grounded !== false) {
    enemy.y = enemy.baseY;
    enemy.vy = 0;
    if (enemy.hopCd <= 0) {
      enemy.vy = enemy.hopV || -240;
      enemy.grounded = false;
      enemy.hopCd = enemy.hopEvery || 2.1;
    }
  } else {
    enemy.vy = Math.min(720, (enemy.vy || 0) + GRAV * dt);
    enemy.y += enemy.vy * dt;
    if (enemy.y >= enemy.baseY) {
      enemy.y = enemy.baseY;
      enemy.vy = 0;
      enemy.grounded = true;
    }
  }
  if (!enemy.speed) return;
  enemy.x += enemy.dir * enemy.speed * dt;
  if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
    enemy.dir *= -1;
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x));
  }
}

function update(dt) {
  if (state.toastUntil && performance.now() > state.toastUntil) {
    el.toast.classList.remove('show');
    state.toastUntil = 0;
  }
  if (state.mode !== 'play') return;
  const player = state.player;
  state.time += dt;
  for (const plat of state.level.platforms) {
    if (!plat.slide) continue;
    const swing = Math.sin(state.time * plat.rate + plat.phase);
    plat.x = plat.homeX + swing * plat.slide;
    if (plat.bob) plat.y = plat.homeY + Math.cos(state.time * plat.rate + plat.phase) * plat.bob;
  }
  if (state.pops) {
    for (const pop of state.pops) {
      pop.y -= 22 * dt;
      pop.life -= dt;
    }
    state.pops = state.pops.filter((pop) => pop.life > 0);
  }

  let move = 0;
  if (input.left || keys.has('arrowleft') || keys.has('a')) move -= 1;
  if (input.right || keys.has('arrowright') || keys.has('d')) move += 1;
  if (Math.abs(input.stickX) > 0.18) move += input.stickX;
  move = Math.max(-1, Math.min(1, move));
  if (move !== 0) player.face = move < 0 ? -1 : 1;

  const accel = player.onGround ? 12 : 8;
  const target = move * runSpeed();
  player.vx += (target - player.vx) * Math.min(1, accel * dt);
  if (Math.abs(player.vx) < 2 && move === 0) player.vx = 0;
  if (player.onGround && Math.abs(player.vx) > 12) {
    player.gait = (player.gait || 0) + Math.abs(player.vx) * dt / 52;
  }

  if (input.jumpQueued) {
    requestJump();
    input.jumpQueued = false;
  }
  if (state.jumpBuffer > 0) state.jumpBuffer -= dt;

  const canGround = player.onGround || player.coyote > 0;
  if (state.jumpBuffer > 0 && canGround) {
    player.vy = -state.hero.jumpV;
    player.onGround = false;
    player.coyote = 0;
    player.airtime = 0;
    player.airJumps = state.inv.spark ? 1 : 0;
    player.releaseJump = false;
    state.jumpBuffer = 0;
    state.riseOrigin = player.y + player.h;
    state.peak = 0;
  } else if (state.jumpBuffer > 0 && player.airJumps > 0 && player.airtime > 0.13) {
    player.vy = -state.hero.jumpV;
    player.airJumps -= 1;
    player.releaseJump = false;
    state.jumpBuffer = 0;
    state.didDouble = true;
  }

  if (input.jumpRelease) {
    player.releaseJump = true;
    input.jumpRelease = false;
  }
  // A phone tap releases on the same frame the hop starts. Hold the rise
  // long enough to clear a librarian before the short-hop cut applies.
  if (player.releaseJump && player.vy < 0 && player.airtime > 0.11) {
    player.vy *= 0.45;
    player.releaseJump = false;
  }

  if (input.attackQueued) {
    input.attackQueued = false;
    beginAttack();
  }

  player.attackCd = Math.max(0, player.attackCd - dt);
  player.attackT = Math.max(0, player.attackT - dt);
  player.iframes = Math.max(0, player.iframes - dt);
  if (state.shieldPing > 0) state.shieldPing -= dt;
  state.shake = Math.max(0, state.shake - dt);

  player.vy = Math.min(720, player.vy + GRAV * dt);
  if (!player.onGround) player.airtime += dt;

  player.x += player.vx * dt;
  for (const solid of solids()) {
    if (!aabb(player, solid)) continue;
    if (player.vx > 0) player.x = solid.x - player.w - 0.4;
    else if (player.vx < 0) player.x = solid.x + solid.w + 0.4;
    else {
      const penL = player.x + player.w - solid.x;
      const penR = solid.x + solid.w - player.x;
      player.x = penL < penR ? solid.x - player.w - 0.4 : solid.x + solid.w + 0.4;
    }
    player.vx = 0;
  }
  if (player.x < 8) {
    player.x = 8;
    player.vx = 0;
  }

  const prevBottom = player.y + player.h;
  player.y += player.vy * dt;
  const bottom = player.y + player.h;
  let landed = null;
  if (player.vy >= 0) {
    for (const plat of landables()) {
      const overlapX = player.x + player.w > plat.x + 2 && player.x < plat.x + plat.w - 2;
      if (!overlapX) continue;
      if (plat.y >= prevBottom - 1 && plat.y <= bottom) {
        if (!landed || plat.y < landed.y) landed = plat;
      }
    }
  } else {
    for (const solid of solids()) {
      if (!aabb(player, solid)) continue;
      player.y = solid.y + solid.h;
      player.vy = 0;
    }
  }
  const wasGround = player.onGround;
  player.onGround = false;
  if (landed) {
    player.y = landed.y - player.h;
    player.vy = 0;
    player.onGround = true;
    player.airJumps = 0;
    player.coyote = 0.12;
    if (state.riseOrigin != null) {
      const rise = state.peak;
      if (state.didDouble) state.maxDouble = Math.max(state.maxDouble, rise);
      else state.maxSingle = Math.max(state.maxSingle, rise);
      state.riseOrigin = null;
      state.didDouble = false;
      state.peak = 0;
    }
  } else if (wasGround && player.vy > 0) {
    player.coyote = 0.12;
  }
  if (!player.onGround) player.coyote = Math.max(0, (player.coyote || 0) - dt);
  if (player.y < 80) {
    player.y = 80;
    player.vy = 0;
  }

  if (state.riseOrigin != null) {
    const rise = state.riseOrigin - (player.y + player.h);
    if (rise > state.peak) state.peak = rise;
  }

  if (player.y > 1100) respawn('You fell. Back at the last checkpoint.');

  if (player.onGround) {
    const markers = state.level.checks;
    while (state.nextCheck < markers.length && player.x > markers[state.nextCheck]) {
      state.checkpoint = { x: player.x, y: player.y };
      state.nextCheck += 1;
    }
  }

  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.kind === 'librarian' || enemy.kind === 'plate' || enemy.kind === 'boss') {
      paceHopper(enemy, dt);
      const rise = (enemy.baseY ?? enemy.y) - enemy.y;
      if (rise > (state.hopPeak || 0)) state.hopPeak = rise;
    } else if (enemy.kind === 'flyer') {
      enemy.x += enemy.dir * enemy.speed * dt;
      if (enemy.x < enemy.minX || enemy.x > enemy.maxX) {
        enemy.dir *= -1;
        enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x));
      }
      enemy.y = enemy.baseY + Math.sin(state.time * 2.4 + (enemy.phase || 0)) * (enemy.bob || 7);
      if (enemy.shoot) {
        enemy.cooldown -= dt;
        const originX = enemy.x + enemy.w / 2;
        const originY = enemy.y + enemy.h;
        const dx = player.x + player.w / 2 - originX;
        const dy = player.y + player.h / 2 - originY;
        const lined = dy > 18 && dy < 190 && Math.abs(dx) < 240 && Math.abs(dx) > 20;
        if (lined && enemy.cooldown <= 0) {
          const dir = dx < 0 ? -1 : 1;
          enemy.cooldown = 1.45;
          state.shots.push({
            x: originX + dir * 8,
            y: originY - 2,
            w: 8,
            h: 8,
            vx: dir * (96 + Math.min(64, Math.abs(dx) * 0.45)),
            vy: 120 + Math.min(48, dy * 0.2),
            life: 2.6,
            color: '#7ee7ff',
            friendly: false,
          });
        }
      }
    } else if (enemy.baseY != null) {
      enemy.y = enemy.baseY + Math.sin(state.time * 3) * 6;
    }
    enemy.flash = Math.max(0, (enemy.flash || 0) - dt);
    if (enemy.kind === 'boss') {
      enemy.cooldown -= dt;
      const origin = enemy.x + enemy.w / 2;
      const dx = player.x + player.w / 2 - origin;
      const dy = Math.abs((player.y + player.h / 2) - (enemy.y + enemy.h / 2));
      const pastGate = player.x > state.level.gate.x;
      const tier = state.level.tier || 1;
      const reach = 230 + (tier - 1) * 36;
      const dyBand = 100 + (tier - 1) * 18;
      if (state.sealOpen && pastGate && dy < dyBand && Math.abs(dx) < reach && Math.abs(dx) > 28 && enemy.cooldown <= 0) {
        const dir = dx < 0 ? -1 : 1;
        enemy.dir = dir;
        enemy.cooldown = bossRest(enemy.parity, tier);
        fireBossVolley(enemy, origin, dir);
      }
    } else if (enemy.kind === 'turret' || enemy.kind === 'ember') {
      enemy.cooldown -= dt;
      const origin = enemy.x + enemy.w / 2;
      const dx = player.x + player.w / 2 - origin;
      const dy = Math.abs((player.y + player.h / 2) - (enemy.y + enemy.h / 2));
      const band = enemy.kind === 'turret'
        ? dy < 70 && dx < -24 && dx > -480
        : dy < 52 && Math.abs(dx) < 280 && Math.abs(dx) > 30;
      if (band && enemy.cooldown <= 0) {
        const dir = enemy.kind === 'turret' ? -1 : (dx < 0 ? -1 : 1);
        enemy.dir = dir;
        enemy.cooldown = enemy.kind === 'turret' ? 1.7 : 1.45;
        if (enemy.kind === 'ember') {
          state.shots.push({
            x: origin + dir * 12,
            y: enemy.y + 6,
            w: 10,
            h: 10,
            vx: dir * 128,
            life: 2.3,
            color: '#ff7a18',
            fire: true,
            friendly: false,
          });
        } else {
          state.shots.push({
            x: enemy.x - 8,
            y: enemy.y + 10,
            w: 12,
            h: 4,
            vx: -150,
            life: 3,
            color: '#7ee7ff',
            friendly: false,
          });
        }
      }
    }
  }

  if (player.attackT > 0 && !player.attackHit && player.attackKind !== 'gun') {
    const swing = 1 - player.attackT / (player.attackDur || 0.2);
    const striking = swing > 0.32 && swing < 0.82;
    if (striking) {
      const hit = attackBox(player);
      const kind = player.attackKind || 'fist';
      const power = meleePower(kind);
      for (const enemy of state.level.enemies) {
        if (enemy.hp <= 0) continue;
        if (!aabb(hit, enemy)) continue;
        player.attackHit = true;
        if (enemy.plated && power === 0) {
          toast('The librarian shrugs off an empty hand. Find the sword or the axe.');
          enemy.flash = 0.12;
          continue;
        }
        state.shake = 0.08;
        markHit(enemy, power);
      }
    }
  }

  for (const shot of state.shots) {
    shot.x += shot.vx * dt;
    shot.y += (shot.vy || 0) * dt;
    shot.life -= dt;
    if (shot.friendly) {
      for (const enemy of state.level.enemies) {
        if (enemy.hp <= 0 || shot.life <= 0) continue;
        if (!aabb(shot, enemy)) continue;
        shot.life = 0;
        state.shake = 0.05;
        markHit(enemy, 1);
      }
    } else if (aabb(shot, player)) {
      const sx = shot.x + shot.w / 2;
      shot.life = 0;
      if (shielding() && inFront(sx)) pingShield();
      else {
        if (shot.fire) state.fireHits += 1;
        hurt(shot.x);
      }
    }
  }
  const shotFar = (state.level.exit?.x || 4000) + 900;
  state.shots = state.shots.filter((shot) => shot.life > 0 && shot.x > -40 && shot.x < shotFar && shot.y > -160 && shot.y < G + 80);

  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0 || enemy.kind === 'turret') continue;
    if (player.attackT > 0) continue;
    if (!aabb(player, enemy)) continue;
    const from = enemy.x + enemy.w / 2;
    if (shielding() && inFront(from)) pingShield();
    else hurt(from);
  }

  for (const item of state.level.items) {
    if (item.got) continue;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    if (Math.hypot(cx - item.x, cy - item.y) < 28) grant(item.id);
  }
  takePage();

  for (const sign of state.level.signs) {
    if (sign.shown) continue;
    const sy = sign.y || G;
    if (Math.abs(player.x + player.w / 2 - sign.x) < 36 && Math.abs(player.y + player.h - sy) < 80) {
      sign.shown = true;
      toast(sign.once);
    }
  }

  let prompt = '';
  let promptId = '';
  const mid = player.x + player.w / 2;
  const foot = player.y + player.h;
  const close = (x, y, r) => Math.abs(mid - x) < r && Math.abs(foot - y) < 70;
  const relay = state.level.relay;
  if (close(relay.x, relay.y, relay.r)) {
    prompt = state.powered ? 'Relay live' : 'F · confirm relay';
    promptId = 'relay';
  }
  if (!state.sealOpen && close(state.level.gate.x, G, 56)) {
    prompt = 'Gate shut';
    promptId = 'gate';
  }
  state.prompt = prompt;
  state.promptId = promptId;
  el.prompt.textContent = prompt;
  el.prompt.classList.toggle('show', !!prompt);

  if (input.useQueued) {
    input.useQueued = false;
    tryUse();
  }

  const exit = state.level.exit;
  const boss = state.level.enemies.find((enemy) => enemy.kind === 'boss' && enemy.hp > 0);
  if (player.x + player.w > exit.x && player.x < exit.x + exit.w && foot > G - 8 && foot < G + 20) {
    if (state.powered && state.sealOpen && !boss) {
      win();
      return;
    }
    if (boss && state.sealOpen) toast(`The ${boss.name} still stands between you and the door.`);
    else toast('The gate is shut. The relay is at the top of the shaft.');
  }

  const look = player.face * 36;
  const targetX = player.x - viewW * 0.36 + look;
  const targetY = player.y - viewH * 0.62;
  const follow = 1 - Math.exp(-4 * dt);
  state.cam.x += (targetX - state.cam.x) * follow;
  state.cam.y += (targetY - state.cam.y) * follow;
  const camFar = (state.level.exit?.x || 4000) + 560;
  state.cam.x = Math.max(0, Math.min(state.cam.x, camFar - viewW));
  state.cam.y = Math.max(180, Math.min(state.cam.y, 1040 - viewH));

  const simKind = qs.get('sim');
  if (simKind === '1' || simKind === 'bag') driveBot(dt);
}

function nextLedgeGoal(player) {
  const foot = player.y + player.h;
  let ledge = null;
  for (const plat of landables()) {
    if (plat.y >= foot - 10) continue;
    if (plat.x + plat.w < player.x + 8) continue;
    if (!ledge || plat.y > ledge.y) ledge = plat;
  }
  if (!ledge) return null;
  return ledge.x + Math.min(80, ledge.w / 2);
}

function ledgeAbove(reach) {
  const player = state.player;
  const foot = player.y + player.h;
  let best = null;
  for (const plat of landables()) {
    const dy = foot - plat.y;
    if (dy <= 14 || dy >= reach) continue;
    if (player.x + player.w > plat.x - 6 && player.x < plat.x + plat.w + 6) {
      if (!best || plat.y < best.y) best = plat;
    }
  }
  return best;
}

function supportedAt(x, foot) {
  return landables().some((plat) => x >= plat.x && x <= plat.x + plat.w && Math.abs(foot - plat.y) <= 10);
}

function driveBot(dt) {
  state.simT += dt;
  const player = state.player;
  input.left = false;
  input.right = false;
  const blade = state.level.items.find((item) => item.id === 'blade');
  const spark = state.level.items.find((item) => item.id === 'spark');
  const plate = state.level.enemies.find((enemy) => enemy.plated && enemy.hp > 0);
  const turret = state.level.enemies.find((enemy) => enemy.kind === 'turret' && enemy.hp > 0);
  const boss = state.level.enemies.find((enemy) => enemy.kind === 'boss' && enemy.hp > 0);
  let goal = state.level.exit.x + 24;
  if (!state.inv.blade) goal = blade.x;
  else if (plate && player.x < plate.x + 24) goal = plate.x - 8;
  else if (!state.inv.spark) goal = spark.x;
  else if (!state.powered) {
    const step = ledgeAbove(150);
    if (step) goal = step.x + Math.min(120, step.w / 2);
    else goal = nextLedgeGoal(player) ?? state.level.relay.x;
  } else if (turret && player.y + player.h > G - 48 && player.x < turret.x + 8) goal = turret.x - 36;
  else if (boss) goal = boss.x - 36;

  const ember = state.level.enemies.find((enemy) => {
    if (enemy.kind !== 'ember' || enemy.hp <= 0 || !state.inv.blade) return false;
    const same = Math.abs((enemy.y + enemy.h) - (player.y + player.h)) < 36;
    return same && Math.abs(enemy.x - player.x) < 250;
  });
  if (ember) {
    const dir = Math.sign(goal - (player.x + player.w / 2)) || 1;
    const edx = ember.x - player.x;
    if (Math.abs(edx) < 70 || Math.sign(edx || dir) === dir) goal = ember.x - 18 * dir;
  }

  const mid = player.x + player.w / 2;
  if (mid < goal - 8) input.right = true;
  else if (mid > goal + 10) input.left = true;

  const dir = input.left ? -1 : 1;
  const foot = player.y + player.h;
  const probe = player.x + (dir > 0 ? player.w + 12 : -12);
  const gap = player.onGround && supportedAt(mid, foot) && !supportedAt(probe, foot);
  const ledge = ledgeAbove(state.inv.spark ? 150 : state.hero.single + 6);
  if (gap || ledge) requestJump();
  state.wantDouble = !!(ledge && state.inv.spark && foot - ledge.y > state.hero.single + 4);

  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x + enemy.w / 2 - (player.x + player.w / 2);
    const dy = Math.abs(enemy.y - player.y);
    const arm = state.weapon || (state.inv.blade ? 'sword' : 'fist');
    const reach = arm === 'gun' ? 240 : arm === 'axe' ? 52 : arm === 'sword' ? 48 : 22;
    if (dy < 40 && Math.abs(dx) < reach + 10 && Math.sign(dx || 1) === player.face) requestAttack();
  }

  if (state.prompt && state.usedPrompt !== state.promptId) {
    tryUse();
    state.usedPrompt = state.promptId;
  } else if (!state.prompt) {
    state.usedPrompt = '';
  }

  if (Math.abs(player.x - state.stuckX) < 1.5) state.stuckT += dt;
  else {
    state.stuckT = 0;
    state.stuckX = player.x;
  }
  const done = state.mode === 'win';
  const failed = state.simT > 175 && !done;
  if (done || failed || state.stuckT > 12) {
    finishSim(done ? 'win' : 'stuck');
  }
}

function finishSim(status) {
  if (state.simDone) return;
  state.simDone = true;
  const plate = state.level.enemies.find((enemy) => enemy.plated);
  const report = {
    status,
    hero: state.hero.id,
    x: Math.round(state.player.x),
    y: Math.round(state.player.y),
    hp: state.player.hp,
    inv: state.inv,
    sealOpen: state.sealOpen,
    powered: state.powered,
    zone: state.zone,
    plateHp: plate ? plate.hp : 0,
    embers: state.level.enemies.filter((enemy) => enemy.kind === 'ember').map((enemy) => enemy.hp),
    flyers: state.level.enemies.filter((enemy) => enemy.kind === 'flyer').map((enemy) => enemy.hp),
    fireHits: state.fireHits,
    armor: state.armor,
    maxSingle: Math.round(state.maxSingle),
    maxDouble: Math.round(state.maxDouble),
    singleCap: Math.round(state.hero.single),
    shaft: SHAFT,
    exit: state.level.exit.x,
    bossHp: (state.level.enemies.find((enemy) => enemy.kind === 'boss') || {}).hp,
    hopPeak: Math.round(state.hopPeak || 0),
    simT: Math.round(state.simT * 10) / 10,
    chains: !!(chains && (chains.warthog || chains.cartesi || chains.hemi)),
  };
  document.body.dataset.status = status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
  console.log(JSON.stringify(report));
}

function clearedTitle(zone) {
  return ZONE_TITLES[zone] || 'Hemi Rise';
}

function nextStageName(zone) {
  const done = new Set(clearedZones());
  const start = ZONE_ORDER.indexOf(zone);
  for (let i = start + 1; i < ZONE_ORDER.length; i += 1) {
    if (!done.has(ZONE_ORDER[i])) return ZONE_TITLES[ZONE_ORDER[i]];
  }
  return '';
}

function win() {
  if (!state || state.mode === 'win') return;
  const zone = state.zone;
  state.mode = 'win';
  const bonus = Math.max(120, 1000 - Math.floor(state.time * 8));
  state.score += bonus;
  noteBest(state.score);
  markClear(zone);
  if (qs.get('sim') && qs.get('sim') !== 'return') {
    finishSim('win');
    return;
  }
  const line = hemiLine();
  const pageBit = state.level.page?.got && state.stamp?.block
    ? ` Page stamped Hemi #${state.stamp.block}.`
    : state.stamp?.block
      ? ` Started on Hemi #${state.stamp.block}.`
      : '';
  const scored = ` Score ${state.score}.${pageBit}`;
  const ahead = nextStageName(zone);
  const note = ahead
    ? `The gate is open. ${line} ${ahead} is on the map.${scored} Nothing was signed or spent.`
    : `${clearedTitle(zone)} is clear. ${line} The gate brought you back.${scored} Nothing was signed or spent.`;
  showSelect(note);
}

function drawBackdrop(shakeX, shakeY) {
  const camX = state.cam.x;
  ctx.save();
  ctx.translate(Math.round(shakeX), Math.round(shakeY));
  const horizon = Math.round(viewH * 0.62);
  ctx.fillStyle = '#0b1c2a';
  ctx.beginPath();
  ctx.moveTo(0, viewH);
  ctx.lineTo(0, horizon);
  for (let sx = 0; sx <= viewW + 48; sx += 28) {
    const step = Math.floor((sx + camX * 0.16) / 28);
    const peak = horizon - 16 - (step * 19) % 36 - (step % 3) * 8;
    ctx.lineTo(sx, peak);
    ctx.lineTo(sx + 16, peak + 14);
  }
  ctx.lineTo(viewW, viewH);
  ctx.closePath();
  ctx.fill();

  const spacing = 132;
  const parallax = camX * 0.38;
  const first = Math.floor(parallax / spacing) - 1;
  const last = first + Math.ceil(viewW / spacing) + 3;
  for (let i = first; i <= last; i += 1) {
    const sx = Math.round(i * spacing - parallax);
    const archH = 58 + (Math.abs(i) % 4) * 12;
    const top = 22 + (Math.abs(i) % 3) * 8;
    ctx.fillStyle = '#102838';
    ctx.fillRect(sx, top, 8, archH);
    ctx.fillRect(sx + 48, top, 8, archH);
    ctx.fillRect(sx - 4, top, 64, 5);
    ctx.fillStyle = '#16384a';
    ctx.fillRect(sx + 8, top + 5, 40, 4);
    if (Math.abs(i) % 2 === 0) {
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#7ee7ff';
      ctx.fillRect(sx + 26, top + 12, 3, 5);
      ctx.globalAlpha = 0.16;
      ctx.fillRect(sx + 16, top + 16, 22, 16);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = '#1b5168';
      ctx.fillRect(sx + 18, top + 18, 5, 12);
      ctx.fillRect(sx + 30, top + 24, 5, 10);
    }
    ctx.fillStyle = '#0e2a3a';
    ctx.fillRect(sx + 18, top - 12, 2, 12);
    ctx.fillRect(sx + 36, top - 9, 2, 9);
  }

  for (let i = 0; i < 16; i += 1) {
    const speed = 8 + (i % 4) * 5;
    const px = ((i * 181 + state.time * speed - camX * 0.12) % viewW + viewW) % viewW;
    const py = 12 + ((i * 41) % Math.max(24, Math.floor(viewH * 0.42)));
    ctx.globalAlpha = 0.22 + (i % 3) * 0.08;
    ctx.fillStyle = i % 2 === 0 ? '#7ee7ff' : '#fff6d8';
    ctx.fillRect(px, py, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function draw() {
  const cam = state.cam;
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 4 : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * 3 : 0;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, viewW, viewH);
  const theme = THEME.hemi;
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, theme.sky0);
  sky.addColorStop(1, theme.sky1);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, viewH);

  for (let i = 0; i < 48; i += 1) {
    const px = ((i * 97 - cam.x * 0.15) % viewW + viewW) % viewW;
    const py = (i * 53) % Math.max(80, viewH - 20);
    ctx.fillStyle = i % 4 === 0 ? '#fff6d8' : theme.star;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(px, py, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
  drawBackdrop(shakeX, shakeY);

  ctx.save();
  ctx.translate(Math.round(-cam.x + shakeX), Math.round(-cam.y + shakeY));

  ctx.globalAlpha = 0.18;
  ctx.font = '700 28px Courier New';
  ctx.fillStyle = theme.ink;
  for (const spot of state.level.words) ctx.fillText(theme.word, spot[0], spot[1]);
  ctx.globalAlpha = 1;

  for (const plat of state.level.platforms) {
    const pal = PAL[plat.kind] || PAL.wart;
    const drawH = Math.min(plat.h, 96);
    ctx.fillStyle = pal.body;
    ctx.fillRect(plat.x, plat.y, plat.w, drawH);
    ctx.fillStyle = pal.top;
    ctx.fillRect(plat.x, plat.y, plat.w, 3);
    ctx.fillStyle = pal.mortar;
    for (let x = plat.x + 8; x < plat.x + plat.w; x += 8) ctx.fillRect(x, plat.y, 1, drawH);
  }

  const gate = state.level.gate;
  if (!state.sealOpen) {
    ctx.fillStyle = theme.gate;
    ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
    ctx.fillStyle = theme.bar;
    for (let y = gate.y + 6; y < gate.y + gate.h; y += 10) ctx.fillRect(gate.x + 4, y, gate.w - 8, 3);
    label(gate.x - 28, gate.y + 20, 'GATE');
  } else {
    ctx.fillStyle = theme.gate;
    ctx.fillRect(gate.x, G - 48, 8, 48);
    ctx.fillRect(gate.x + gate.w - 8, G - 48, 8, 48);
  }

  const doorX = state.level.exit.x;
  const doorWord = state.level.door || 'RISE';
  ctx.fillStyle = state.powered ? theme.doorOn : theme.doorOff;
  ctx.fillRect(doorX, G - 64, 48, 64);
  ctx.fillStyle = '#071018';
  ctx.fillRect(doorX + 8, G - 52, 32, 40);
  label(doorX - 4, G - 72, state.powered ? 'OPEN' : doorWord);

  for (const beacon of state.level.beacons) {
    ctx.fillStyle = theme.bar;
    ctx.fillRect(beacon.x - 3, beacon.y - 28, 6, 28);
    ctx.fillRect(beacon.x - 7, beacon.y - 34, 14, 6);
  }

  for (const sign of state.level.signs) {
    const sy = (sign.y || G) - 46;
    ctx.fillStyle = theme.bar;
    ctx.fillRect(sign.x - 1, sy + 10, 2, 36);
    label(sign.x - 18, sy, sign.text);
  }

  drawPage(state.level.page);

  const bob = Math.sin(state.time * 3) * 3;
  for (const item of state.level.items) {
    if (item.got) continue;
    const meta = ALL_META.find((entry) => entry.id === item.id);
    const img = images[meta.src];
    if (!drawSprite(img, item.x, item.y + bob, 30, false)) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(item.x - 6, item.y - 12, 12, 12);
    }
  }

  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0) continue;
    let img = images[enemy.sprite];
    if (enemy.kind === 'flyer') {
      const flap = Math.floor(state.time * 7 + (enemy.phase || 0)) % 2 === 1;
      img = images[flap ? enemy.flap : enemy.sprite] || img;
    }
    const h = enemy.drawH || 40;
    const bob = 0;
    const flip = enemy.kind === 'flyer'
      ? enemy.dir < 0
      : (enemy.dir < 0) !== (enemy.artLeft === true);
    if (enemy.kind === 'boss') {
      const gx = enemy.x + enemy.w / 2;
      const gy = enemy.y + enemy.h / 2;
      const odd = enemy.parity === 'odd';
      ctx.save();
      ctx.globalAlpha = 0.92;
      const halo = ctx.createRadialGradient(gx, gy, 4, gx, gy, 48);
      halo.addColorStop(0, odd ? 'rgba(255, 150, 48, 0.95)' : 'rgba(150, 230, 255, 0.95)');
      halo.addColorStop(1, odd ? 'rgba(255, 120, 20, 0)' : 'rgba(80, 180, 255, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(gx, gy, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      label(gx - 18, enemy.y + enemy.h - h - 8, odd ? 'HEX' : 'SHARD');
    }
    if (!drawSprite(img, enemy.x + enemy.w / 2, enemy.y + enemy.h + bob, h, flip)) {
      ctx.fillStyle = '#ffc107';
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    }
    if (enemy.kind === 'ember') {
      ctx.fillStyle = '#ffb020';
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.w / 2 + (enemy.dir || -1) * 10, enemy.y + 10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff4d00';
      ctx.beginPath();
      ctx.arc(enemy.x + enemy.w / 2 + (enemy.dir || -1) * 10, enemy.y + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (enemy.flash > 0) {
      ctx.globalAlpha = 0.65;
      ctx.fillStyle = '#fff2';
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      ctx.globalAlpha = 1;
    }
  }

  for (const shot of state.shots) {
    if (shot.fire) {
      ctx.fillStyle = '#ff3b00';
      ctx.beginPath();
      ctx.arc(shot.x + 5, shot.y + 5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd15a';
      ctx.beginPath();
      ctx.arc(shot.x + 4, shot.y + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.save();
      ctx.translate(shot.x + shot.w / 2, shot.y + shot.h / 2);
      if (shot.vy) ctx.rotate(Math.atan2(shot.vy, shot.vx || 0.001));
      ctx.fillStyle = shot.color || '#ffb020';
      const dw = shot.vy ? 16 : shot.w;
      const dh = shot.vy ? 4 : shot.h;
      ctx.fillRect(-dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    }
  }

  const player = state.player;
  if (player.iframes <= 0 || Math.floor(state.time * 20) % 2 === 0) {
    drawPilot(state.hero, player.x + player.w / 2, player.y + player.h + 2, player.face);
  }
  for (const pop of state.pops || []) {
    ctx.globalAlpha = Math.max(0.2, pop.life / 0.7);
    label(pop.x - 8, pop.y, pop.text);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  drawPagePointer();
}

function drawPagePointer() {
  const page = state.level?.page;
  if (!page || page.got) return;
  const sx = page.x - state.cam.x;
  const sy = page.y - 20 - state.cam.y;
  const margin = 16;
  if (sx > margin && sx < viewW - margin && sy > margin && sy < viewH - margin) return;
  const x = Math.max(margin, Math.min(viewW - margin, sx));
  const y = Math.max(28, Math.min(viewH - margin, sy));
  ctx.save();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#fff1a8';
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  label(x - 16, y - 14, 'PAGE');
}

function drawPage(page) {
  if (!page || page.got) return;
  const bob = Math.sin(state.time * 4) * 6;
  const x = page.x;
  const y = page.y + bob;
  const pulse = 0.62 + Math.sin(state.time * 6) * 0.28;
  ctx.save();
  ctx.globalAlpha = pulse;
  const glow = ctx.createRadialGradient(x, y - 28, 4, x, y - 28, 78);
  glow.addColorStop(0, 'rgba(255, 250, 214, 0.98)');
  glow.addColorStop(0.35, 'rgba(255, 196, 64, 0.72)');
  glow.addColorStop(1, 'rgba(255, 160, 20, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y - 28, 78, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fff6c8';
  ctx.fillRect(x - 16, y - 52, 32, 40);
  ctx.fillStyle = '#e2b84a';
  ctx.fillRect(x - 16, y - 52, 32, 4);
  ctx.fillRect(x - 16, y - 16, 32, 4);
  ctx.fillStyle = '#6a4a12';
  ctx.fillRect(x - 11, y - 42, 22, 2);
  ctx.fillRect(x - 11, y - 36, 16, 2);
  ctx.fillRect(x - 11, y - 30, 22, 2);
  ctx.fillRect(x - 11, y - 24, 12, 2);
  ctx.fillStyle = '#fff1a8';
  ctx.fillRect(x - 3, y - 68, 6, 12);
  ctx.fillRect(x - 9, y - 62, 18, 4);
  const caption = page.mark || 'HEMI';
  label(x - caption.length * 2.5, y - 78, caption);
}

function label(x, y, text) {
  ctx.font = '700 8px Courier New';
  ctx.fillStyle = '#0c1020';
  ctx.fillRect(x - 2, y - 8, text.length * 5 + 4, 11);
  ctx.fillStyle = '#ffe7a3';
  ctx.fillText(text, x, y);
}

function blitSlice(img, destH, srcX, srcY, srcW, srcH, dx, dy) {
  if (!img || !img.complete || !img.naturalWidth || srcW <= 0 || srcH <= 0) return;
  const scale = destH / img.naturalHeight;
  const dw = srcW * scale;
  const dh = srcH * scale;
  const localBottom = -((img.naturalHeight - (srcY + srcH)) * scale) + (dy || 0);
  const localLeft = -(img.naturalWidth * scale) / 2 + srcX * scale + (dx || 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    srcX,
    srcY,
    srcW,
    srcH,
    Math.round(localLeft),
    Math.round(localBottom - dh),
    Math.max(1, Math.round(dw)),
    Math.max(1, Math.round(dh)),
  );
}

function drawBareWalk(img, destH, swing) {
  blitSlice(img, destH, 0, 0, img.naturalWidth, 33, 0, 0);
  const hipY = -15;
  const legs = [
    { x: -3, fill: '#1a1e2c' },
    { x: 2, fill: '#263044' },
  ];
  legs.forEach((leg, index) => {
    const footX = leg.x + (index === 0 ? -swing : swing);
    ctx.fillStyle = leg.fill;
    for (let i = 0; i < 4; i += 1) {
      const t = i / 3;
      const x = leg.x + (footX - leg.x) * t;
      const y = hipY + (-4 - hipY) * t;
      ctx.fillRect(Math.round(x), Math.round(y), 4, 4);
    }
    ctx.fillStyle = '#121018';
    ctx.fillRect(Math.round(footX - 1), -4, 7, 3);
    ctx.fillStyle = '#d5d0c6';
    ctx.fillRect(Math.round(footX - 1), -1, 7, 1);
  });
}

function drawSuitedWalk(img, destH, swing) {
  blitSlice(img, destH, 0, 0, img.naturalWidth, 80, 0, 2);
  blitSlice(img, destH, 0, 78, 36, img.naturalHeight - 78, -swing, 2);
  blitSlice(img, destH, 36, 78, img.naturalWidth - 36, img.naturalHeight - 78, swing, 2);
}

function blit(img, cx, bottom, height, maxW, rot) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  let h = height;
  let w = img.naturalWidth * (height / img.naturalHeight);
  if (maxW && w > maxW) {
    w = maxW;
    h = img.naturalHeight * (maxW / img.naturalWidth);
  }
  ctx.imageSmoothingEnabled = false;
  if (rot) {
    ctx.save();
    ctx.translate(cx, bottom);
    ctx.rotate(rot);
    ctx.drawImage(img, Math.round(-w / 2), Math.round(-h / 2), Math.round(w), Math.round(h));
    ctx.restore();
    return true;
  }
  ctx.drawImage(img, Math.round(cx - w / 2), Math.round(bottom - h), Math.round(w), Math.round(h));
  return true;
}

function blitGrip(img, gx, gy, height, maxW, rot, along = 1) {
  if (!img || !img.complete || !img.naturalWidth) return;
  let h = height;
  let w = img.naturalWidth * (height / img.naturalHeight);
  if (maxW && w > maxW) {
    w = maxW;
    h = img.naturalHeight * (maxW / img.naturalWidth);
  }
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(rot);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(-w / 2), Math.round(-h * along), Math.round(w), Math.round(h));
  ctx.restore();
}

function blitHaft(img, gx, gy, length, rot) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const w = length;
  const h = img.naturalHeight * (length / img.naturalWidth);
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(rot);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(-w * 0.14), Math.round(-h / 2), Math.round(w), Math.round(h));
  ctx.restore();
}

function blitRifle(img, x, y, length) {
  if (!img || !img.complete || !img.naturalWidth) return;
  const w = length;
  const h = img.naturalHeight * (length / img.naturalWidth);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(x), Math.round(y - h / 2), Math.round(w), Math.round(h));
}

function drawArm(x, y, fromY = -26) {
  ctx.strokeStyle = '#e8ba92';
  ctx.lineWidth = 3;
  ctx.lineCap = 'square';
  ctx.beginPath();
  ctx.moveTo(6, fromY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function drawSlash(kind, p, hx = 10, hy = -18) {
  const alpha = Math.sin(Math.min(1, Math.max(0, p)) * Math.PI);
  ctx.save();
  ctx.lineCap = 'round';
  if (kind === 'sword') {
    const a0 = -1.15 + p * 0.2;
    const a1 = -0.15 + p * 2.05;
    ctx.strokeStyle = `rgba(255, 226, 150, ${0.9 * alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hx, hy, 22, a0, a1);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 * alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(hx, hy, 16, a0 + 0.15, a1 - 0.05);
    ctx.stroke();
  } else if (kind === 'axe') {
    ctx.strokeStyle = `rgba(255, 170, 40, ${0.95 * alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hx, hy, 22, -1.05 + p * 0.08, -0.1 + p * 1.25);
    ctx.stroke();
    if (p > 0.6) {
      ctx.fillStyle = `rgba(255, 236, 180, ${(1 - p) * 1.6})`;
      ctx.fillRect(hx + 16, hy + 8, 12, 3);
      ctx.fillRect(hx + 20, hy, 3, 14);
    }
  } else {
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 * alpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(hx, hy, 11, -0.5, 0.9);
    ctx.stroke();
  }
  ctx.restore();
}

function oramiLook() {
  const chest = state.armor.chest === 'goldplate' ? 'gold' : state.armor.chest === 'blueplate' ? 'blue' : 'bare';
  const helm = state.armor.helm === 'goldhelm' ? 'gold' : state.armor.helm === 'bluehelm' ? 'blue' : 'none';
  return `${chest}-${helm}`;
}

function kitLook() {
  const plate = state.armor.chest === 'blueplate' ? 'blue' : state.armor.chest === 'goldplate' ? 'gold' : '';
  if (!plate) return '';
  const helm = state.armor.helm === 'bluehelm' ? 'blue' : state.armor.helm === 'goldhelm' ? 'gold' : '';
  if (helm && helm !== plate) return `${plate}-${helm}`;
  return plate;
}

function kitStepFrame() {
  const phase = ((state.player.gait % 1) + 1) % 1;
  return Math.floor(phase * KIT_WALK_N) % KIT_WALK_N;
}

function kitHandPoint() {
  const player = state.player;
  if (!player.onGround) return KIT_JUMP_HAND;
  if (Math.abs(player.vx) > 12) return KIT_WALK_HAND[kitStepFrame()];
  return KIT_IDLE_HAND;
}

function drawKitBody() {
  const look = kitLook();
  if (!look) return false;
  const player = state.player;
  const stepping = player.onGround && Math.abs(player.vx) > 12;
  const file = !player.onGround ? 'jump' : stepping ? 'walk' : 'idle';
  const img = images[`assets/kits/${look}-${file}.png`];
  if (!img || !img.complete || !img.naturalWidth) return false;
  const destH = 64;
  let sx = 0;
  let sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (file === 'walk') {
    sw = Math.floor(img.naturalWidth / KIT_WALK_N);
    sx = kitStepFrame() * sw;
  }
  const scale = destH / sh;
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, 0, sw, sh, Math.round(-dw / 2), Math.round(-dh), Math.round(dw), Math.round(dh));
  return true;
}

function drawOramiBody() {
  const player = state.player;
  const look = oramiLook();
  const stepping = player.onGround && Math.abs(player.vx) > 12;
  const file = !player.onGround ? 'jump' : stepping ? 'walk' : 'idle';
  const img = images[`assets/orami/${look}-${file}.png`];
  if (!img || !img.complete || !img.naturalWidth) return;
  const scale = 58 / 187;
  let sx = 0;
  let sw = img.naturalWidth;
  const sh = img.naturalHeight;
  if (file === 'walk') {
    sw = img.naturalWidth / ORAMI_WALK_N;
    const phase = ((player.gait % 1) + 1) % 1;
    sx = Math.floor(phase * ORAMI_WALK_N) % ORAMI_WALK_N * sw;
  }
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    sx,
    0,
    sw,
    sh,
    Math.round(-dw / 2),
    Math.round(-dh),
    Math.round(dw),
    Math.round(dh),
  );
}

function drawPilot(hero, cx, bottom, face) {
  const player = state.player;
  const attacking = player.attackT > 0;
  const kind = attacking ? player.attackKind : (state.weapon || 'fist');
  const p = attacking && player.attackDur ? 1 - player.attackT / player.attackDur : 0;
  const chest = ARMOR.find((piece) => piece.id === state.armor.chest);
  const helm = ARMOR.find((piece) => piece.id === state.armor.helm);
  const orami = hero.id === 'orami';
  const suited = !!(chest && chest.side) && !orami;
  const stepping = player.onGround && Math.abs(player.vx) > 12;
  const swing = stepping ? Math.sin((player.gait || 0) * Math.PI * 2) * 5 : 0;
  const bob = stepping ? -Math.abs(Math.sin((player.gait || 0) * Math.PI * 2)) * 1.5 : 0;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(bottom + bob));
  if (face < 0) ctx.scale(-1, 1);
  let kitOn = false;
  if (orami) drawOramiBody();
  else if (suited) kitOn = drawKitBody();
  const lift = suited && !kitOn ? -8 : 0;
  if (state.inv.spark) blit(images['assets/blue/16.png'], kitOn ? -20 : suited ? -22 : -16, (kitOn ? -40 : -24) + lift, 26, 12);
  if (!orami && suited && !kitOn) {
    const body = images[chest.side];
    if (stepping && body?.complete) drawSuitedWalk(body, 56, swing);
    else blit(body, 0, 2, 56, 78);
    if (helm?.worn) blit(images[helm.worn], 6, -40, 26, 30);
    else blit(images['assets/worn/pilot-head.png'], 4, -46, 16, 16);
  } else if (!orami && !suited) {
    const body = images[hero.body];
    if (stepping && body?.complete) drawBareWalk(body, 46, swing);
    else blit(body, 0, 0, 46);
    if (helm?.worn) blit(images[helm.worn], 5, -32, 24, 28);
  }
  if (state.inv.filament) blit(images['assets/gold/22.png'], -3, -16 + lift, 5, 14, Math.PI / 2);
  if (state.inv.eye) blit(images['assets/blue/17.png'], 6, suited ? -58 : -36, 8, 8);
  if (state.inv.shield && !shielding()) blit(images['assets/weapons/shield.png'], kitOn ? -18 : suited ? -24 : -16, (kitOn ? -28 : -20) + lift, 22, 16);

  const air = !player.onGround;
  const hand = kitOn
    ? kitHandPoint()
    : orami
      ? { x: 12, y: air ? -24 : -20 }
      : suited
        ? { x: 16, y: (air ? -24 : -18) + lift }
        : { x: 10, y: (air ? -20 : -16) + lift };

  if (kind === 'sword') {
    let rot = kitOn ? 0.32 : 0.55;
    if (attacking) {
      if (p < 0.1) rot = 0.4 - (p / 0.1) * 1.5;
      else rot = -1.1 + Math.pow(Math.min(1, (p - 0.1) / 0.72), 0.38) * 2.7;
    }
    if (!suited && !orami) drawArm(hand.x, hand.y);
    blitGrip(images['assets/gold/18.png'], hand.x, hand.y, kitOn || orami ? 30 : 26, 12, rot, kitOn ? 0.82 : 0.78);
    if (attacking) drawSlash('sword', p, hand.x, hand.y);
  } else if (kind === 'axe') {
    let rot = -0.28;
    if (attacking) {
      if (p < 0.12) rot = -0.3 - (p / 0.12) * 1.7;
      else rot = -2.0 + Math.pow(Math.min(1, (p - 0.12) / 0.7), 0.42) * 2.6;
    }
    if (!suited && !orami) drawArm(hand.x, hand.y, -22);
    blitHaft(images['assets/weapons/axe.png'], hand.x, hand.y, kitOn || orami ? 36 : 32, rot);
    if (attacking) drawSlash('axe', p, hand.x, hand.y);
  } else if (kind === 'gun') {
    const kick = attacking ? -3 : 0;
    const grip = { x: hand.x + kick, y: hand.y };
    const len = kitOn || orami ? 44 : 38;
    if (!suited && !orami) drawArm(grip.x + 8, grip.y);
    blitRifle(images['assets/weapons/rifle.png'], grip.x, grip.y, len);
    if (attacking) {
      ctx.fillStyle = '#f4fbff';
      ctx.fillRect(grip.x + len - 4, grip.y - 2, 8, 3);
      ctx.fillStyle = 'rgba(126, 231, 255, 0.85)';
      ctx.fillRect(grip.x + len + 3, grip.y - 1, 6, 2);
    }
  } else if (attacking) {
    if (!suited && !orami) drawArm(hand.x + Math.sin(p * Math.PI) * 6, hand.y);
    drawSlash('fist', p, hand.x, hand.y);
  }
  if (shielding()) {
    blit(images['assets/weapons/shield.png'], suited ? 22 : 16, -10 + lift, 34, 26);
    if (state.shieldPing > 0.12) {
      ctx.fillStyle = 'rgba(255, 244, 210, 0.5)';
      ctx.fillRect(suited ? 14 : 8, -34 + lift, 18, 24);
    }
  }
  ctx.restore();
}

function drawSprite(img, cx, bottom, height, flip) {
  if (!img || !img.complete || !img.naturalWidth) return false;
  const scale = height / img.naturalHeight;
  const w = img.naturalWidth * scale;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(bottom));
  if (flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(-w / 2), Math.round(-height), Math.round(w), Math.round(height));
  ctx.restore();
  return true;
}

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = qs.get('sim') ? 1 / 60 : Math.min(0.033, (now - lastNow) / 1000 || 0);
  lastNow = now;
  if (state && state.mode === 'play' && !state.simDone) update(dt);
  if (state && (state.mode === 'play' || state.mode === 'bag')) draw();
}

function fit() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  if (rect.width < 40 || rect.height < 40) return;
  // A sideways phone is short and wide. Grow the view so the frame
  // meets every edge instead of sitting as a 16:9 box in the middle.
  const sideways = window.matchMedia('(orientation: landscape) and (max-height: 520px)').matches;
  if (sideways) {
    const aspect = rect.width / rect.height;
    viewH = VIEW_H;
    viewW = Math.max(VIEW_W, Math.round(VIEW_H * aspect));
    el.canvas.width = viewW;
    el.canvas.height = viewH;
    el.frame.style.width = '100%';
    el.frame.style.height = '100%';
    return;
  }
  const widthScale = rect.width / VIEW_W;
  const band = VIEW_H * widthScale;
  if (rect.height > band + 48) {
    viewW = VIEW_W;
    viewH = Math.round(rect.height / widthScale);
    el.canvas.width = viewW;
    el.canvas.height = viewH;
    el.frame.style.width = `${Math.floor(rect.width)}px`;
    el.frame.style.height = `${Math.floor(rect.height)}px`;
    return;
  }
  viewW = VIEW_W;
  viewH = VIEW_H;
  el.canvas.width = VIEW_W;
  el.canvas.height = VIEW_H;
  const scale = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
  el.frame.style.width = `${Math.max(160, Math.floor(VIEW_W * scale))}px`;
  el.frame.style.height = `${Math.max(90, Math.floor(VIEW_H * scale))}px`;
}

function bindPress(node, onDown, onUp) {
  node.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    node.setPointerCapture?.(event.pointerId);
    onDown();
  });
  const up = (event) => {
    event.preventDefault();
    onUp?.();
  };
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', up);
}

function stickFrom(event) {
  const base = el.stickBase.getBoundingClientRect();
  const zone = el.stickZone.getBoundingClientRect();
  const cx = base.left + base.width / 2;
  const cy = base.top + base.height / 2;
  const maxR = base.width / 2 || 1;
  let dx = event.clientX - cx;
  let dy = event.clientY - cy;
  const mag = Math.hypot(dx, dy) || 1;
  if (mag > maxR) {
    dx = (dx / mag) * maxR;
    dy = (dy / mag) * maxR;
  }
  stick.dx = dx;
  stick.dy = dy;
  input.stickX = dx / maxR;
  input.stickY = dy / maxR;
  const tw = el.stickThumb.offsetWidth || 40;
  const th = el.stickThumb.offsetHeight || 40;
  el.stickThumb.style.left = `${cx + dx - zone.left - tw / 2}px`;
  el.stickThumb.style.top = `${cy + dy - zone.top - th / 2}px`;
  el.stickThumb.style.bottom = 'auto';
}

function stickReset() {
  stick.id = null;
  stick.dx = 0;
  stick.dy = 0;
  input.stickX = 0;
  input.stickY = 0;
  el.stickThumb.style.left = '';
  el.stickThumb.style.top = '';
  el.stickThumb.style.bottom = '';
}

let stickJumpLatch = false;

function pollStickJump() {
  if (input.stickY < -0.62) {
    if (!stickJumpLatch) {
      stickJumpLatch = true;
      if (state) requestJump();
    }
  } else if (input.stickY > -0.35) stickJumpLatch = false;
}

function boot() {
  let storedHero = null;
  try { storedHero = localStorage.getItem(HERO_KEY); } catch { storedHero = null; }
  setPickedHero(qs.get('hero') || storedHero || 'hemigo', false);
  document.getElementById('runners')?.addEventListener('click', (event) => {
    const id = event.target.closest('[data-hero]')?.dataset?.hero;
    if (id) setPickedHero(id, true);
  });
  el.startHemi.addEventListener('click', () => startGame('hemi'));
  el.startWart.addEventListener('click', () => startGame('wart'));
  el.startCart?.addEventListener('click', () => startGame('cart'));
  el.startGale?.addEventListener('click', () => startGame('gale'));
  el.startCrown?.addEventListener('click', () => startGame('crown'));
  renderZonePicks();
  paintBest();
  el.again.addEventListener('click', () => startGame(state?.zone || 'hemi'));
  el.quit.addEventListener('click', showSelect);
  el.bagOpen.addEventListener('click', () => toggleBag());
  el.bagClose.addEventListener('click', () => setBag(false));
  el.bagGrid.addEventListener('click', (event) => {
    const id = event.target.closest('[data-armor]')?.dataset?.armor;
    if (id) toggleArmor(id);
  });

  bindPress(document.getElementById('btn-jump'), () => {
    input.jumpQueued = true;
  }, () => {
    input.jumpRelease = true;
  });
  bindPress(document.getElementById('btn-hit'), () => {
    input.attackQueued = true;
  });
  bindPress(document.getElementById('btn-use'), () => {
    input.useQueued = true;
  });
  const guard = document.getElementById('btn-shield');
  if (guard) {
    bindPress(guard, () => {
      input.shieldHeld = true;
      guard.classList.add('held');
      if (state && state.mode === 'play' && !state.inv.shield) toast('No shield yet. One is on the ground.');
    }, () => {
      input.shieldHeld = false;
      guard.classList.remove('held');
    });
  }

  el.stickZone.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    el.stickZone.setPointerCapture(event.pointerId);
    stick.id = event.pointerId;
    stickFrom(event);
    pollStickJump();
  });
  el.stickZone.addEventListener('pointermove', (event) => {
    if (stick.id !== event.pointerId) return;
    stickFrom(event);
    pollStickJump();
  });
  const endStick = (event) => {
    if (stick.id !== event.pointerId) return;
    stickReset();
    stickJumpLatch = false;
  };
  el.stickZone.addEventListener('pointerup', endStick);
  el.stickZone.addEventListener('pointercancel', endStick);

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(event.key.toLowerCase()) || event.code === 'Space') {
      event.preventDefault();
    }
    if (!state) {
      if (key === 'enter') startGame('hemi');
      return;
    }
    if (key === 'i') {
      event.preventDefault();
      if (!event.repeat) toggleBag();
      return;
    }
    if (key === 'escape') {
      if (state.mode === 'bag') setBag(false);
      else if (state.mode === 'play') showSelect();
      return;
    }
    if (state.mode !== 'play') return;
    if (event.repeat && key !== 'e') return;
    keys.add(key === ' ' ? ' ' : key);
    if (key === 'q' && !state.inv.shield) toast('No shield yet. One is on the ground.');
    if (key === ' ' || key === 'w' || key === 'z' || key === 'arrowup') input.jumpQueued = true;
    if (key === 'e' || key === 'j' || key === 'k') input.attackQueued = true;
    if (key === 'f' || key === 'enter') input.useQueued = true;
    if (key === '1') equipOwned('sword');
    if (key === '2') equipOwned('axe');
    if (key === '3') equipOwned('gun');
  });
  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    keys.delete(key === ' ' ? ' ' : key);
    if (key === ' ' || key === 'w' || key === 'z' || key === 'arrowup') input.jumpRelease = true;
  });
  let wheelLock = 0;
  window.addEventListener('wheel', (event) => {
    if (!state || state.mode !== 'play') return;
    event.preventDefault();
    const now = performance.now();
    if (now < wheelLock) return;
    const delta = event.deltaY || event.deltaX;
    if (!delta) return;
    wheelLock = now + 160;
    cycleWeapon(delta > 0 ? 1 : -1);
  }, { passive: false });
  el.frame.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (state && state.mode === 'play') input.useQueued = true;
  });
  el.inv.addEventListener('click', (event) => {
    const arm = event.target?.dataset?.arm;
    if (arm) equipOwned(arm);
  });
  const fitSoon = () => {
    fit();
    requestAnimationFrame(fit);
  };
  window.addEventListener('resize', fitSoon);
  window.addEventListener('orientationchange', fitSoon);
  window.visualViewport?.addEventListener('resize', fitSoon);
  window.addEventListener('blur', () => {
    keys.clear();
    input.shieldHeld = false;
    document.getElementById('btn-shield')?.classList.remove('held');
    stickReset();
  });

  pullChains();
  setInterval(pullChains, 20000);
  fit();
  requestAnimationFrame(frame);

  if (qs.get('shot') === 'zone') startGame(qs.get('zone') || 'hemi');
  if (qs.get('sim') === '1') {
    startGame(qs.get('zone') || 'hemi');
    for (let i = 0; i < 180 * 60 && !state.simDone; i += 1) update(1 / 60);
    if (!state.simDone) finishSim('timeout');
  }
  if (qs.get('sim') === 'bag') runBagTest();
  if (qs.get('sim') === 'gates') runGateTest();
  if (qs.get('sim') === 'guard') runGuardTest();
  if (qs.get('sim') === 'return') runReturnTest();
  if (qs.get('sim') === 'wear') runWearTest();
  if (qs.get('sim') === 'gale') runGaleTest();
}

function runReturnTest() {
  localStorage.removeItem(CLEAR_KEY);
  renderZonePicks();
  const cartBtn = document.getElementById('start-cart');
  const galeBtn = document.getElementById('start-gale');
  const crownBtn = document.getElementById('start-crown');
  const open = !!(cartBtn && !cartBtn.hidden && galeBtn && !galeBtn.hidden && crownBtn && !crownBtn.hidden);
  startGame('hemi');
  win();
  const note = el.selectNote?.textContent || '';
  const hemiClear = document.querySelector('#start-hemi .zone-clear');
  startGame('cart');
  win();
  const galeNote = el.selectNote?.textContent || '';
  startGame('crown');
  win();
  const back = el.selectNote?.textContent || '';
  const report = {
    status: open && !el.select.hidden && el.play.hidden
      && note.includes('Hemi Span') && galeNote.includes('Hemi Gale')
      && back.includes('brought you back') && hemiClear && !hemiClear.hidden
      ? 'pass' : 'fail',
    select: !el.select.hidden,
    play: el.play.hidden,
    open,
    hemiClear: hemiClear ? !hemiClear.hidden : false,
    note,
    galeNote,
    back,
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

function runWearTest() {
  localStorage.removeItem(WEAR_KEY);
  startGame('hemi');
  state.inv.goldhelm = true;
  state.inv.blueplate = true;
  setBag(true);
  toggleArmor('goldhelm');
  toggleArmor('blueplate');
  showSelect();
  startGame('gale');
  const gold = state.level.items.find((item) => item.id === 'goldhelm');
  const blueHelm = state.level.items.find((item) => item.id === 'bluehelm');
  const bluePlate = state.level.items.find((item) => item.id === 'blueplate');
  const goldPlate = state.level.items.find((item) => item.id === 'goldplate');
  const kept = state.zone === 'gale'
    && state.armor.helm === 'goldhelm'
    && state.armor.chest === 'blueplate'
    && state.inv.goldhelm && state.inv.blueplate
    && !state.inv.bluehelm && !state.inv.goldplate
    && gold?.got && bluePlate?.got
    && !blueHelm?.got && !goldPlate?.got;
  setBag(true);
  toggleArmor('goldhelm');
  const bare = state.armor.helm;
  startGame('crown');
  const dropped = state.zone === 'crown' && state.armor.helm == null && state.armor.chest === 'blueplate';
  const report = {
    status: kept && bare == null && dropped ? 'pass' : 'fail',
    kept,
    bare,
    dropped,
    armor: state.armor,
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

function bossVolleySize(zone) {
  startGame(zone);
  const boss = state.level.enemies.find((enemy) => enemy.kind === 'boss');
  state.sealOpen = true;
  state.player.x = boss.x - 70;
  state.player.y = G - 30;
  state.player.iframes = 99;
  state.shots = [];
  boss.cooldown = 0;
  update(1 / 60);
  return state.shots.filter((shot) => !shot.friendly).length;
}

function runGaleTest() {
  const riseBolts = bossVolleySize('hemi');
  const spanBolts = bossVolleySize('wart');
  const deepBolts = bossVolleySize('cart');
  const galeBolts = bossVolleySize('gale');
  const crownBolts = bossVolleySize('crown');
  const flyersOf = (tier) => buildStage(tier).enemies.filter((enemy) => enemy.kind === 'flyer');
  const early = flyersOf(3);
  const galeFlyers = flyersOf(4);
  const crownFlyers = flyersOf(5);
  const armed = early.every((enemy) => !enemy.shoot)
    && galeFlyers.every((enemy) => enemy.shoot)
    && crownFlyers.length > galeFlyers.length
    && galeFlyers.length >= 6;
  startGame('gale');
  const slides = state.level.platforms.filter((plat) => plat.slide);
  const x0 = slides[0]?.x;
  const flyer = state.level.enemies.find((enemy) => enemy.shoot);
  state.player.x = flyer.x - 30;
  state.player.y = G - 30;
  state.player.onGround = true;
  state.player.iframes = 99;
  flyer.cooldown = 0;
  state.shots = [];
  update(1 / 60);
  const slant = state.shots.find((shot) => shot.vx && shot.vy > 0 && !shot.friendly);
  const slantCopy = slant ? { vx: Math.round(slant.vx), vy: Math.round(slant.vy) } : null;
  for (let i = 0; i < 40; i += 1) update(1 / 60);
  const moved = !!(slides[0] && Math.abs(slides[0].x - x0) > 1);
  const longer = buildStage(5).exit.x > buildStage(4).exit.x && buildStage(4).exit.x > buildStage(3).exit.x;
  const shafts = [1, 2, 3, 4, 5].map((tier) => buildStage(tier).platforms.filter((plat) => /^h\d+$/.test(plat.id)).length);
  const oneHop = HEMIGO.single < SHAFT;
  const report = {
    status: riseBolts === 1 && spanBolts === 2 && deepBolts === 3 && galeBolts === 4 && crownBolts === 5
      && armed && slantCopy && slantCopy.vx !== 0 && slantCopy.vy > 0 && moved && longer
      && shafts.join() === '2,3,4,5,6' && oneHop
      ? 'pass' : 'fail',
    riseBolts,
    spanBolts,
    deepBolts,
    galeBolts,
    crownBolts,
    slant: slantCopy,
    moved,
    longer,
    shafts,
    slides: slides.length,
    oneHop,
    armed,
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

function runBagTest() {
  startGame('hemi');
  for (let i = 0; i < 40 * 60 && !state.simDone && !(state.inv.goldhelm && state.inv.bluehelm && state.inv.goldplate); i += 1) {
    update(1 / 60);
  }
  const found = { goldhelm: !!state.inv.goldhelm, bluehelm: !!state.inv.bluehelm };
  setBag(true);
  const x0 = state.player.x;
  const t0 = state.time;
  update(1);
  const paused = state.mode === 'bag' && state.player.x === x0 && state.time === t0;
  if (state.inv.bluehelm) toggleArmor('bluehelm');
  const swapped = state.armor.helm;
  if (swapped) toggleArmor(swapped);
  const cleared = state.armor.helm;
  if (state.inv.goldhelm) toggleArmor('goldhelm');
  state.player.iframes = 0;
  renderBag();
  state.simDone = true;
  draw();
  const report = {
    status: found.goldhelm && found.bluehelm && paused && state.armor.helm === 'goldhelm' && cleared == null && swapped === 'bluehelm' ? 'pass' : 'fail',
    found,
    paused,
    swapped,
    cleared,
    helm: state.armor.helm,
    x: Math.round(state.player.x),
    hp: state.player.hp,
    maxHp: state.maxHp,
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

function runGateTest() {
  startGame('hemi');
  const plate = state.level.enemies.find((enemy) => enemy.plated);
  state.player.x = plate.x - 28;
  state.player.y = G - 30;
  state.player.onGround = true;
  state.player.iframes = 999;
  for (let i = 0; i < 180; i += 1) {
    input.right = true;
    input.attackQueued = true;
    update(1 / 60);
  }
  const bareHp = plate.hp;
  state.inv.blade = true;
  plate.hp = plate.max;
  for (let i = 0; i < 180; i += 1) {
    input.right = true;
    input.attackQueued = true;
    update(1 / 60);
  }
  const bladedHp = plate.hp;
  const relay = state.level.relay;
  state.player.x = relay.x - 8;
  state.player.y = relay.y - 30;
  state.player.onGround = true;
  state.inv.spark = false;
  tryUse();
  const darkWithoutSpark = state.powered;
  state.inv.spark = true;
  tryUse();
  const confirmed = state.powered && state.sealOpen;
  const report = {
    status: bareHp === plate.max && bladedHp <= 0 && !darkWithoutSpark && confirmed ? 'pass' : 'fail',
    bareHp,
    bladedHp,
    darkWithoutSpark,
    confirmed,
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

function runGuardTest() {
  startGame('hemi');
  const hemiImgs = [...el.vital.querySelectorAll('img.pip')];
  const hemiPips = hemiImgs.length === 5
    && hemiImgs.every((img) => img.getAttribute('src').includes('hemi.png') && !img.classList.contains('off'));
  state.inv.shield = true;
  state.player.x = 280;
  state.player.y = G - 30;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.face = 1;
  state.player.onGround = true;
  state.player.hp = 5;
  state.player.iframes = 0;
  state.fireHits = 0;
  state.shots = [{ x: 330, y: state.player.y + 8, w: 10, h: 10, vx: -180, life: 2, fire: true, friendly: false }];
  keys.add('q');
  for (let i = 0; i < 24; i += 1) update(1 / 60);
  const blocked = state.player.hp === 5 && state.fireHits === 0;
  state.player.hp = 5;
  state.player.iframes = 0;
  state.player.x = 280;
  state.player.y = G - 30;
  state.fireHits = 0;
  state.shots = [{ x: 220, y: G - 22, w: 10, h: 10, vx: 200, life: 2, fire: true, friendly: false }];
  for (let i = 0; i < 40; i += 1) update(1 / 60);
  const rearHurt = state.player.hp === 4 && state.fireHits === 1;
  keys.delete('q');
  input.shieldHeld = false;
  state.player.iframes = 999;
  state.armor.helm = 'goldhelm';
  state.armor.chest = 'goldplate';
  state.inv.blade = true;
  state.weapon = 'sword';
  const plate = state.level.enemies.find((enemy) => enemy.plated);
  plate.hp = plate.max;
  state.player.x = plate.x - 30;
  state.player.y = G - 30;
  state.player.face = 1;
  state.player.attackCd = 0;
  state.player.attackT = 0;
  input.attackQueued = true;
  for (let i = 0; i < 30; i += 1) update(1 / 60);
  const goldHp = plate.hp;
  state.armor.helm = 'bluehelm';
  state.armor.chest = null;
  const fast = Math.round(runSpeed()) === Math.round(state.hero.speed * 1.34);
  state.armor.helm = null;
  state.armor.chest = 'blueplate';
  const quick = Math.abs(cool(0.28) - 0.28 * 0.58) < 1e-6;
  keys.add('q');
  state.inv.shield = true;
  const slow = runSpeed() < state.hero.speed * 0.5;
  keys.delete('q');
  const hpLock = state.maxHp === 5;
  startGame('wart');
  const wartImgs = [...el.vital.querySelectorAll('img.pip')];
  const spanPips = wartImgs.length === 5 && wartImgs.every((img) => img.getAttribute('src').includes('hemi.png'));
  const report = {
    status: blocked && rearHurt && goldHp === plate.max - 5 && fast && quick && slow && hemiPips && spanPips && hpLock ? 'pass' : 'fail',
    blocked,
    rearHurt,
    goldHp,
    fast,
    quick,
    slow,
    hemiPips,
    spanPips,
    hpLock,
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

boot();

window.__relay = {
  get state() { return state; },
  startGame,
  input,
  HEROES,
  SHAFT,
};
