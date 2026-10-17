/**
 * Relay Zones.
 * Five Hemi stages: grass, mountains, jungle, winter tundra, volcanic peaks.
 * Rise has no armor and no spark. Its relay is two steps, one hop each.
 * Span has the spark and the chest plates. Gale and Crown have the helms.
 * The ground changes each rise: hops, pads, a low roof, sliding bridges, then a high step.
 * The roof sits on flat ground, with room to stand before the next jump.
 * Later rises leave fights spaced apart. Gale and Crown skimmers fire down on a slant.
 * Space jumps. Hold Ctrl, S, or Down to crouch. E attacks. The mouse wheel cycles owned weapons. Hold Q to guard.
 * F confirms the relay. I pauses on the armor bag. The chip is the Hemi mainnet block.
 * Health is five Hemi marks. Gold armor hits harder. Blue armor is faster.
 * Pick Hemigo or Orami, then a map. Spark, shield, and armor carry between them.
 * Orami stays locked until all five rises are clear. He leaves the sword.
 * The fire slash is his. A fireball sits where the axe and the rifle were.
 * Jumping through a foe burns. He walks until three seconds of forward movement, then lunges.
 * The Hemi block you start on plants one glowing page, its score, and the boss at the door.
 * An even block calls a Shard. An odd block calls a Hex.
 * Each boss alternates one shot and a two-note shape, then takes a longer rest.
 * Later rises play that same phrase a little faster.
 * Zone skies, set dressing, and ground use the painted segment art.
 * With no plate, Hemigo plays the side-view action sheet: idle, walk, run, and jump.
 * A chest plate brings back the armor suit strips. With no helm, that suit
 * keeps his bare head. A helm uses the suit's helmet.
 */
const GRAV = 1700;
const VIEW_W = 480;
const VIEW_H = 270;
const G = 860;
const SHAFT = 90;
const STAND_H = 30;
const CROUCH_H = 16;

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
  body: 'assets/orami/portrait.png',
  slash: '#ffb15a',
};
ORAMI.single = HEMIGO.single;

const HEROES = { hemigo: HEMIGO, orami: ORAMI, pilot: HEMIGO };
const HERO_KEY = 'relay-zone-hero';
const WEAR_KEY = 'relay-zone-wear';
const GEAR_KEY = 'relay-zone-gear';
const GEAR_IDS = ['blade', 'axe', 'gun', 'spark', 'shield', 'goldhelm', 'bluehelm', 'goldplate', 'blueplate'];
const ORAMI_CELL_W = 300;
const ORAMI_CELL_H = 280;
const ORAMI_DRAW_H = 86;
const ORAMI_BODY_X = 160;
const ORAMI_FEET_Y = 268;
const ORAMI_RUN_X = 72;
const ORAMI_DOWN_X = 150;
const ORAMI_RUN_TIME = 3;
const ORAMI_ARMS = ['slash', 'bolt'];
const ORAMI_KEY = 'relay-zone-orami';
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
// Cells are torso-centered and foot-aligned. Hands are pixel points in that cell.
const SUIT_CELL_W = 160;
const SUIT_CELL_H = 210;
const SUIT_DRAW_H = 70;
const SUIT_IDLE_HAND = [{ x: 113, y: 124 }];
const SUIT_WALK_HAND = [
  { x: 125, y: 132 }, { x: 127, y: 124 }, { x: 133, y: 125 }, { x: 124, y: 127 },
  { x: 125, y: 139 }, { x: 122, y: 128 }, { x: 117, y: 130 }, { x: 125, y: 128 },
];
const SUIT_RUN_HAND = [
  { x: 135, y: 114 }, { x: 134, y: 134 }, { x: 136, y: 129 }, { x: 131, y: 129 }, { x: 135, y: 136 },
  { x: 137, y: 132 }, { x: 135, y: 133 }, { x: 139, y: 138 }, { x: 132, y: 138 }, { x: 132, y: 166 },
];
const SUIT_JUMP_HAND = [{ x: 124, y: 101 }];
let suitHand = null;
let openCollar = false;
let pickedHero = 'hemigo';

function heroById(id) {
  return id === 'orami' ? ORAMI : HEMIGO;
}

function oramiUnlocked() {
  const done = new Set(clearedZones());
  return ZONE_ORDER.every((zone) => done.has(zone));
}

function refreshHeroLock() {
  const open = oramiUnlocked();
  const node = document.getElementById('pick-orami');
  if (!node) return;
  node.classList.toggle('is-locked', !open);
  const role = node.querySelector('.runner-role');
  if (role) {
    role.textContent = open
      ? 'Fire slash from the start. The fireball is on the ground. A jump through a foe burns.'
      : 'Locked until all five rises are clear.';
  }
  const img = node.querySelector('img');
  if (img) img.src = '/assets/orami/portrait.png';
}

function resolveHero() {
  const query = qs.get('hero');
  let id = (query === 'orami' || query === 'hemigo' || query === 'pilot') ? query : pickedHero;
  if (id === 'pilot') id = 'hemigo';
  if (id === 'orami' && !oramiUnlocked()) id = 'hemigo';
  return heroById(id);
}

function setPickedHero(id, persist) {
  const want = heroById(id).id;
  if (want === 'orami' && !oramiUnlocked()) {
    if (persist && el.selectNote) {
      el.selectNote.hidden = false;
      el.selectNote.textContent = 'Clear all five rises. Then Orami fights with a fire slash and fireballs.';
    }
    refreshHeroLock();
    return;
  }
  pickedHero = want;
  if (persist) {
    try { localStorage.setItem(HERO_KEY, pickedHero); } catch { /* this visit still keeps the pick */ }
  }
  document.querySelectorAll('.runner').forEach((node) => {
    const on = node.dataset.hero === pickedHero;
    node.classList.toggle('is-picked', on);
    node.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  refreshHeroLock();
  paintArmory();
}

const ITEM_META = [
  { id: 'blade', name: 'Sword', src: 'assets/gold/18.png', who: 'Hemi', arm: 'sword' },
  { id: 'axe', name: 'Axe', src: 'assets/weapons/axe.png', who: 'Hemi', arm: 'axe' },
  { id: 'gun', name: 'Rifle', src: 'assets/weapons/rifle.png', who: 'Hemi', arm: 'gun' },
  { id: 'spark', name: 'Spark', src: 'assets/blue/16.png', who: 'Hemi' },
  { id: 'shield', name: 'Shield', src: 'assets/weapons/shield.png' },
];
const ARMOR = [
  { id: 'goldhelm', name: 'Gold Helm', src: 'assets/gold/06.png', worn: 'assets/worn/gold-helm.png', slot: 'helm', kit: 'gold', stat: 'Hits +1' },
  { id: 'goldplate', name: 'Gold Plate', src: 'assets/gold/10.png', side: 'assets/worn/gold-body.png', slot: 'chest', kit: 'gold', stat: 'Hits +2' },
  { id: 'bluehelm', name: 'Blue Helm', src: 'assets/blue/01.png', worn: 'assets/worn/blue-helm.png', slot: 'helm', kit: 'blue', stat: 'Run faster' },
  { id: 'blueplate', name: 'Blue Plate', src: 'assets/blue/09.png', side: 'assets/worn/blue-body.png', slot: 'chest', kit: 'blue', stat: 'Swing and shoot faster' },
];
const ALL_META = [...ITEM_META, ...ARMOR];
const ARM_ORDER = ['sword', 'axe', 'gun'];
const THEME = {
  hemi: {
    biome: 'grass',
    sky0: '#79c4ef', sky1: '#d7f0b4', star: '#fff6c8', ink: '#1a4a28', word: 'HEMI',
    gate: '#245c30', bar: '#d8ff8a', doorOn: '#b6ff62', doorOff: '#1a3c22',
  },
  wart: {
    biome: 'mountain',
    sky0: '#7f9ec4', sky1: '#f0c48a', star: '#fff1d0', ink: '#4a3018', word: 'HEMI',
    gate: '#5c3c28', bar: '#e8c27a', doorOn: '#ffd48a', doorOff: '#3a2818',
  },
  cart: {
    biome: 'jungle',
    sky0: '#0c3022', sky1: '#1a4c34', star: '#d8ffb0', ink: '#c8f5d4', word: 'HEMI',
    gate: '#143820', bar: '#7dff9a', doorOn: '#b6ff6a', doorOff: '#102818',
  },
  gale: {
    biome: 'tundra',
    sky0: '#c5dcea', sky1: '#f7fbff', star: '#ffffff', ink: '#1c3c52', word: 'HEMI',
    gate: '#2c4e64', bar: '#d6f4ff', doorOn: '#ffffff', doorOff: '#1a3344',
  },
  crown: {
    biome: 'volcano',
    sky0: '#4a1610', sky1: '#140806', star: '#ffb060', ink: '#ffc090', word: 'HEMI',
    gate: '#3a1810', bar: '#ff7a32', doorOn: '#ffb020', doorOff: '#2a120c',
  },
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
for (const name of ['idle', 'walk', 'run', 'jump', 'slash', 'bolt', 'hurt', 'down', 'fireball', 'icon-slash', 'icon-bolt']) {
  loadImage(`assets/orami/${name}.png`);
}
for (const name of ['flame-1', 'flame-2', 'flame-3', 'flame-6', 'flame-8', 'flame-beam', 'star-1', 'star-3', 'star-5']) {
  loadImage(`assets/orami/fx/${name}.png`);
}
for (const name of ['idle', 'walk', 'run', 'jump']) {
  loadImage(`assets/hemigo/bare-${name}.png`);
}
for (const look of ['gold', 'blue', 'gold-blue', 'blue-gold']) {
  loadImage(`assets/kits/${look}-idle.png`);
  loadImage(`assets/kits/${look}-walk.png`);
  loadImage(`assets/kits/${look}-jump.png`);
}
loadImage('assets/kits/gold-open.png');
loadImage('assets/kits/blue-open.png');
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
    y: G - 40,
    baseY: G - 40,
    w: 38,
    h: 40,
    hp,
    max: hp,
    minX,
    maxX,
    dir: 1,
    speed,
    sprite: 'assets/js1/14.png',
    drawH: 68,
    plated: false,
    hopCd: hopCd == null ? 1.65 + (Math.abs(Math.round(x)) % 9) * 0.08 : hopCd,
    hopEvery: 1.85 + (Math.abs(Math.round(x)) % 5) * 0.17,
    hopV: -250,
    vy: 0,
    grounded: true,
    shotCd: 0.45 + (Math.abs(Math.round(x)) % 5) * 0.15,
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
  const platforms = [];
  let cursor = 0;
  const ground = (id, w) => {
    const at = cursor;
    platforms.push({ id, x: at, y: G, w, h: 180, oneWay: true, kind: 'hemi' });
    cursor += w;
    return at;
  };
  const hole = (w) => { cursor += w; };
  const deck = (id, rise, w) => {
    const at = cursor;
    platforms.push({ id, x: at, y: G - rise, w, h: 16, oneWay: true, kind: 'hemi' });
    cursor += w;
    return at;
  };
  const ferry = (id, pit, deckW, travel, rise, phase) => {
    const left = cursor;
    cursor += pit;
    const home = left - 20;
    const y = G - rise;
    platforms.push({
      id,
      x: home,
      y,
      homeX: home,
      homeY: y,
      w: deckW,
      h: 14,
      oneWay: true,
      kind: 'glide',
      slide: travel,
      phase,
      rate: 0.9,
      bob: 0,
    });
    return home;
  };
  const tunnel = (id, w) => {
    const at = cursor;
    const roofTop = G - 320;
    platforms.push({ id: `${id}-floor`, x: at, y: G, w, h: 180, oneWay: true, kind: 'hemi' });
    platforms.push({
      id,
      x: at + 36,
      y: roofTop,
      w: w - 52,
      h: (G - 26) - roofTop,
      oneWay: false,
      kind: 'ceil',
    });
    cursor += w;
    return at;
  };
  const stairs = (count, rise) => {
    const start = cursor + 30;
    let top = null;
    for (let i = 0; i < count; i += 1) {
      top = {
        id: `h${i}`,
        x: start + i * 150,
        y: G - rise * (i + 1),
        w: 300,
        h: 16,
        oneWay: true,
        kind: 'hemi',
      };
      platforms.push(top);
    }
    return { top, topEnd: top.x + top.w };
  };

  const marks = { skim: [] };
  ground('a', 400);

  if (tier === 1) {
    hole(40);
    marks.sword = ground('b', 260) + 90;
    hole(36);
    const hall = ground('hall', 820);
    marks.plate = hall + 240;
    marks.axe = hall + 480;
    marks.skim.push(hall + 120, hall + 600);
    marks.lib = [[hall + 200, 70], [hall + 460, 80]];
  } else if (tier === 2) {
    hole(58);
    deck('pad-a', 40, 150);
    hole(50);
    deck('pad-b', 28, 140);
    hole(54);
    const chest = ground('chest', 420);
    marks.plates = chest + 150;
    hole(46);
    deck('pad-c', 52, 160);
    hole(42);
    const hall = ground('hall', 760);
    marks.sword = hall + 70;
    marks.plate = hall + 300;
    marks.axe = hall + 480;
    marks.spark = hall + 660;
    marks.skim.push(260, hall + 680);
    marks.lib = [[hall + 40, 40], [hall + 520, 50]];
    marks.ember = [chest + 90];
  } else if (tier === 3) {
    hole(52);
    deck('pad-a', 46, 156);
    hole(44);
    const approach = ground('approach', 200);
    const slot = tunnel('ceil', 240);
    const hall = ground('hall', 1800);
    marks.low = slot - 28;
    marks.sword = approach + 80;
    marks.plate = hall + 1660;
    marks.axe = hall + 80;
    marks.spark = hall + 1080;
    marks.skim.push(270, hall + 1280);
    marks.lib = [[hall + 860, 50]];
    marks.ember = [hall + 420];
  } else if (tier === 4) {
    ferry('glide-a', 130, 180, 40, 0, 0.25);
    const far = ground('far', 280);
    ferry('glide-b', 150, 170, 50, 0, 1.4);
    const lead = ground('lead', 220);
    const slot = tunnel('ceil', 240);
    const hall = ground('hall', 2200);
    marks.low = slot - 28;
    marks.sword = lead + 80;
    marks.helm = far + 100;
    marks.plate = hall + 2060;
    marks.axe = hall + 200;
    marks.spark = hall + 1100;
    marks.skim.push(hall + 860, hall + 1680);
    marks.lib = [[hall + 420, 50]];
    marks.ember = [hall + 1280];
  } else {
    hole(40);
    deck('pad-a', 34, 140);
    hole(36);
    deck('pad-b', 50, 150);
    hole(34);
    const before = ground('before', 220);
    ferry('glide-a', 140, 190, 44, 0, 0.35);
    const sparkDeck = ground('sparkdeck', 260);
    marks.spark = sparkDeck + 80;
    const slot = tunnel('ceil', 220);
    ground('stand', 400);
    deck('crown-step', SHAFT, 200);
    hole(24);
    ferry('glide-b', 150, 180, 56, 40, 1.7);
    const hall = ground('hall', 2400);
    marks.low = slot - 28;
    marks.sword = before + 60;
    marks.helm = before + 150;
    marks.plate = hall + 2160;
    marks.axe = hall + 720;
    marks.skim.push(hall + 150, hall + 980, hall + 1760);
    marks.lib = [[hall + 1400, 50]];
    marks.ember = [hall + 560];
  }

  const climb = stairs(tier + 1, tier === 1 ? 52 : SHAFT);
  const pre = 340 + tier * 150;
  const gateX = climb.topEnd + pre;
  const exitX = gateX + 340;
  ground('arena', exitX + 300 - cursor);
  marks.gun = gateX - 200;
  const relay = { x: climb.top.x + 110, y: climb.top.y, r: 52 };

  const names = ['', 'Hemi Rise', 'Hemi Span', 'Hemi Deep', 'Hemi Gale', 'Hemi Crown'];
  const doors = ['', 'RISE', 'SPAN', 'DEEP', 'GALE', 'CROWN'];
  const zones = ['', 'hemi', 'wart', 'cart', 'gale', 'crown'];
  const pace = 24 + tier * 6;
  const items = [
    { id: 'shield', x: 170, y: G - 32, got: false },
    { id: 'blade', x: marks.sword, y: G - 36, got: false },
    { id: 'axe', x: marks.axe, y: G - 32, got: false },
    { id: 'gun', x: marks.gun, y: G - 32, got: false },
  ];
  if (marks.spark) items.push({ id: 'spark', x: marks.spark, y: G - 28, got: false });
  if (tier === 2) {
    items.push(
      { id: 'goldplate', x: marks.plates, y: G - 34, got: false },
      { id: 'blueplate', x: marks.plates + 180, y: G - 34, got: false },
    );
  }
  if (tier === 4) items.push({ id: 'goldhelm', x: marks.helm, y: G - 34, got: false });
  if (tier === 5) items.push({ id: 'bluehelm', x: marks.helm, y: G - 34, got: false });

  const enemies = (marks.lib || []).map(([x, span], index) => (
    librarian(`lib-${index}`, x, x - span, x + span, 2 + tier, pace + index * 2, null)
  ));
  enemies.push({
    id: 'plate',
    kind: 'plate',
    name: 'Bound Librarian',
    x: marks.plate,
    y: G - 36,
    baseY: G - 36,
    w: 34,
    h: 36,
    hp: 6 + (tier - 1) * 4,
    max: 6 + (tier - 1) * 4,
    minX: marks.plate - 90,
    maxX: marks.plate + 90,
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
  const emberNames = ['Cinder', 'Ash', 'Soot', 'Flare', 'Brand'];
  (marks.ember || []).forEach((x, index) => {
    enemies.push(placeEmber(emberNames[index].toLowerCase(), emberNames[index], x));
  });
  marks.skim.forEach((x, index) => {
    enemies.push(placeFlyer(`skim-${index}`, x, tier >= 4));
  });
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

  const stageName = names[tier];
  const openLine = [
    '',
    'Two short hops, then two low steps. No armor and no spark. Hold Space. One hop clears a step. Hold Ctrl or Down to crouch. F confirms.',
    'Hop the pads. The spark is on the hall before the shaft. One hop will not clear that shaft.',
    'Jump the pad, then crouch the low roof. Flat ground follows it. Acid that hits the floor stays for a few seconds.',
    'Ride both bridges first. The low roof is after them, on flat ground. Hold Ctrl or Down.',
    'Pads, a bridge, then the spark. Crouch the low roof, stand up, then take the high step.',
  ][tier];
  const signs = [
    { x: 78, text: stageName, once: openLine },
    { x: 168, text: 'Shield', once: 'Shield. Hold Q. Fireballs from the front bounce off.' },
    { x: marks.sword, text: 'Sword', once: 'Sword in hand. E cuts a slash. Librarians pace, hop, and spit acid.' },
    { x: marks.axe, text: 'Axe', once: 'Axe in hand. E chops. The wheel still swaps weapons.' },
    { x: marks.gun, text: 'Rifle', once: 'Rifle before the gate. E fires. The wheel still swaps weapons.' },
    { x: relay.x, y: relay.y, text: 'Relay', once: tier === 1
      ? 'Hemi relay. The two steps are one hop each. F confirms. The spark is on the next rise.'
      : 'Hemi relay. F confirms the block this run started on. The gate on the floor stays shut until then.' },
    { x: gateX - 20, text: 'Gate', once: 'The boss fires as you come up to this gate. One shot, then two spaced shots, then a longer rest. It chases when it is hurt, or when you are down to two marks. The door stays shut until the Shard or the Hex drops.' },
  ];
  if (marks.skim[0]) {
    signs.push({
      x: marks.skim[0],
      text: 'Skimmer',
      once: tier >= 4
        ? 'Skimmers cruise above the floor and fire down on a slant. Jump, then E. Hold Q if the bolt is in front of you.'
        : 'Skimmers cruise above the floor. Jump, then E.',
    });
  }
  if (marks.spark) {
    signs.push({
      x: marks.spark,
      text: 'Spark',
      once: 'Hemi spark. Press Space again in the air. One hop will not clear a tall step. It stays with you after you pick it up.',
    });
  }
  if (tier === 2) {
    signs.push({
      x: marks.plates,
      text: 'Chest',
      once: 'Chest plate only. Gold hits harder. Blue swings and shoots faster. Press I to wear one. Helms are on the last two rises.',
    });
  }
  if (tier === 4) {
    signs.push({
      x: marks.helm,
      text: 'Helm',
      once: 'Gold helm. It adds one damage to the sword and the axe. Press I to look at it. The rise pauses.',
    });
  }
  if (tier === 5) {
    signs.push({
      x: marks.helm,
      text: 'Helm',
      once: 'Blue helm. You run faster. Press I to look at it. The rise pauses.',
    });
  }
  const firstGlide = platforms.find((plat) => plat.slide);
  if (firstGlide) {
    signs.push({
      x: firstGlide.homeX + 40,
      text: 'Drift',
      once: 'This span slides. Step on when it reaches you. It carries you across.',
    });
  }
  if (marks.low) {
    signs.push({
      x: marks.low,
      text: 'Low',
      once: 'Low roof. Hold Ctrl or Down and walk through. It is not a step.',
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
    checks: [marks.sword - 30, marks.plate - 40, marks.axe - 30, gateX - 200].sort((a, b) => a - b),
    words: [[220, 760], [marks.plate, 750], [gateX - 30, 760]],
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

function readGear() {
  try {
    const raw = JSON.parse(localStorage.getItem(GEAR_KEY) || '{}');
    const owned = Array.isArray(raw.owned) ? raw.owned.filter((id) => GEAR_IDS.includes(id)) : [];
    const weapon = ARM_ORDER.includes(raw.weapon) ? raw.weapon : null;
    return { owned, weapon };
  } catch {
    return { owned: [], weapon: null };
  }
}

function writeGear() {
  if (!state) return;
  const owned = GEAR_IDS.filter((id) => state.inv[id]);
  let weapon = ARM_ORDER.includes(state.weapon) ? state.weapon : null;
  if (!weapon) weapon = readGear().weapon;
  try { localStorage.setItem(GEAR_KEY, JSON.stringify({ owned, weapon })); } catch { /* this visit still keeps it */ }
}

function weaponFrom(owned, saved) {
  const itemFor = { sword: 'blade', axe: 'axe', gun: 'gun' };
  if (saved && owned.has(itemFor[saved])) return saved;
  for (const arm of ARM_ORDER) {
    if (owned.has(itemFor[arm])) return arm;
  }
  return null;
}

function bossBeat(parity, tier) {
  const odd = parity === 'odd';
  const base = odd ? 1.05 : 1.28;
  const floor = odd ? 0.84 : 1.02;
  return Math.max(floor, base - (Math.max(1, tier) - 1) * 0.05);
}

// Heavy is the rest after the two-note shape. Light is the rest after the single shot.
function bossRest(parity, tier, heavy) {
  const beat = bossBeat(parity, tier);
  return heavy ? beat * 1.7 : beat;
}

function bossMoves(parity) {
  // The two notes of a shape share a speed, so the gap stays the same at any range.
  // Shard goes low, then high. Hex goes high, then low. The high note clears a standing player.
  if (parity === 'odd') {
    return [
      {
        name: 'jab',
        speed: 132,
        color: '#ff9a3c',
        gap: 0,
        bolts: [{ vx: 1, vy: 0, oy: 10, ox: 16, w: 12, h: 7 }],
      },
      {
        name: 'fork',
        speed: 120,
        color: '#ffd2a1',
        gap: 0.44,
        bolts: [
          { vx: 1, vy: 0, oy: -16, ox: 16, w: 12, h: 5 },
          { vx: 1, vy: 0, oy: 16, ox: 18, w: 12, h: 7 },
        ],
      },
    ];
  }
  return [
    {
      name: 'line',
      speed: 110,
      color: '#9aefff',
      gap: 0,
      bolts: [{ vx: 1, vy: 0, oy: 10, ox: 16, w: 14, h: 6 }],
    },
    {
      name: 'pair',
      speed: 100,
      color: '#dff8ff',
      gap: 0.54,
      bolts: [
        { vx: 1, vy: 0, oy: 16, ox: 16, w: 13, h: 6 },
        { vx: 1, vy: 0, oy: -16, ox: 16, w: 13, h: 5 },
      ],
    },
  ];
}

function spawnBossBolt(enemy, origin, dir, speed, move, pat, note) {
  state.shots.push({
    x: origin + dir * pat.ox,
    y: enemy.y + pat.oy,
    w: pat.w,
    h: pat.h,
    vx: dir * speed * pat.vx,
    vy: speed * pat.vy,
    life: 2.8,
    color: move.color,
    friendly: false,
    bossMove: move.name,
    bossNote: note,
  });
}

function beginBossTell(enemy, dir) {
  const moves = bossMoves(enemy.parity);
  const move = moves[(enemy.phrase || 0) % moves.length];
  enemy.phrase = (enemy.phrase || 0) + 1;
  enemy.loaded = move;
  enemy.dir = dir;
  enemy.tell = move.bolts.length;
  const heavy = move.bolts.length > 1;
  enemy.windup = (enemy.parity === 'odd' ? 0.28 : 0.36) + (heavy ? 0.12 : 0);
}

function releaseBossMove(enemy, origin) {
  const move = enemy.loaded;
  if (!move) return;
  const dir = enemy.dir || -1;
  const tier = state.level.tier || 1;
  const speed = move.speed + Math.min(18, (tier - 1) * 4);
  const heavy = move.bolts.length > 1;
  spawnBossBolt(enemy, origin, dir, speed, move, move.bolts[0], 0);
  if (heavy) {
    enemy.follow = {
      t: move.gap,
      dir,
      speed,
      move,
      pat: move.bolts[1],
      note: 1,
    };
    enemy.tell = 1;
    enemy.cooldown = move.gap + bossRest(enemy.parity, tier, true);
  } else {
    enemy.follow = null;
    enemy.tell = 0;
    enemy.cooldown = bossRest(enemy.parity, tier, false);
  }
  enemy.loaded = null;
  enemy.windup = 0;
}


function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function crouchHeld() {
  if (keys.has('control') || keys.has('arrowdown') || keys.has('s')) return true;
  return input.stickY > 0.62;
}

function bodyFits(x, y, w, h) {
  const box = { x, y, w, h };
  for (const solid of solids()) {
    if (aabb(box, solid)) return false;
  }
  return true;
}

function setBodyHeight(player, nextH) {
  if (nextH === player.h) return true;
  if (nextH > player.h) {
    const y = player.y - (nextH - player.h);
    if (!bodyFits(player.x, y, player.w, nextH)) return false;
    player.y = y;
  } else {
    player.y += player.h - nextH;
  }
  player.h = nextH;
  return true;
}

function applyCrouch(player) {
  if (player.downT > 0) {
    setBodyHeight(player, STAND_H);
    player.crouch = false;
    return;
  }
  const canHop = player.onGround || player.coyote > 0;
  const hopping = state.jumpBuffer > 0 && canHop;
  const want = !hopping && player.onGround && player.vy >= 0 && crouchHeld();
  const nextH = want ? CROUCH_H : STAND_H;
  setBodyHeight(player, nextH);
  player.crouch = player.h < STAND_H - 1;
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
  const block = Number(h?.block);
  const hasBlock = Number.isFinite(block) && block > 0;
  return {
    block: hasBlock ? block : 0,
    chainId: h?.chainId || 43111,
    slot: hasBlock ? block % 3 : 0,
    worth: hasBlock ? PAGE_WORTH[Math.floor(block / 3) % 3] : 80,
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
    homeMin: level.gate.x + 46,
    homeMax: level.exit.x - 78,
    dir: -1,
    baseSpeed: ((even ? 26 : 36) + tier * 6) * 1.2,
    chaseSpeed: ((even ? 34 : 48) + tier * 8) * 1.7,
    speed: ((even ? 26 : 36) + tier * 6) * 1.2,
    chase: false,
    sprite: 'assets/wisp/00.png',
    artLeft: true,
    drawH: 78,
    plated: false,
    hopCd: even ? 1.55 : 1.2,
    hopEvery: even ? 1.8 : 1.28,
    hopV: even ? -280 : -330,
    vy: 0,
    grounded: true,
    phrase: 0,
    windup: 0,
    follow: null,
    tell: 0,
    loaded: null,
    cooldown: bossBeat(even ? 'even' : 'odd', tier) + 0.35,
  });
}

function startGame(zoneId) {
  const zone = ZONE_TIER[zoneId] ? zoneId : 'hemi';
  const hero = resolveHero();
  const level = buildStage(ZONE_TIER[zone]);
  const oramiKit = hero.id === 'orami' ? readOrami() : { bolt: false };
  if (hero.id === 'orami') dressOrami(level);
  const wear = readWear();
  const gear = readGear();
  const owned = new Set(gear.owned);
  if (wear.helm) owned.add(wear.helm);
  if (wear.chest) owned.add(wear.chest);
  for (const item of level.items) {
    if (owned.has(item.id) || (item.id === 'bolt' && oramiKit.bolt)) item.got = true;
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
      y: G - STAND_H,
      w: 22,
      h: STAND_H,
      crouch: false,
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
      runHold: 0,
      runDir: 0,
      downT: 0,
      landT: 0,
      boltSent: false,
    },
    level,
    weapon: hero.id === 'orami' ? (oramiKit.bolt ? 'bolt' : 'slash') : weaponFrom(owned, gear.weapon),
    maxHp: 5,
    armor: { helm: wear.helm, chest: wear.chest },
    inv: {
      eye: false,
      blade: owned.has('blade'),
      axe: owned.has('axe'),
      gun: owned.has('gun'),
      spark: owned.has('spark'),
      filament: false,
      goldhelm: owned.has('goldhelm'),
      goldplate: owned.has('goldplate'),
      bluehelm: owned.has('bluehelm'),
      blueplate: owned.has('blueplate'),
      shield: owned.has('shield'),
      bolt: !!oramiKit.bolt,
    },
    shieldPing: 0,
    sealOpen: false,
    powered: false,
    shots: [],
    puddles: [],
    fireHits: 0,
    cam: { x: 0, y: 0 },
    shake: 0,
    checkpoint: { x: 72, y: G - STAND_H },
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
  const gearLine = hero.id === 'orami'
    ? (oramiKit.bolt ? ' Fire slash and the fireball are already his.' : ' Fire slash is his. The fireball is on the ground.')
    : owned.size
      ? ' What you picked up is still with you.'
      : ` The sword is ahead on ${level.name}.`;
  toast(`${stamped}. A ${bossName} waits behind the gate.${gearLine}`);
}

const CLEAR_KEY = 'relay-zone-clears';
const BEST_KEY = 'relay-zone-best';
const SCORE_KEY = 'relay-zone-scores';
const MARK_LOSS = 500;
const RELAY_CHAIN_ID = 43111;

function connectedAddress() {
  const wallet = window.relayWallet;
  const hex = String(wallet?.address || '').toLowerCase();
  if (wallet?.chainId !== RELAY_CHAIN_ID) return '';
  return /^0x[0-9a-f]{40}$/.test(hex) ? hex : '';
}

function shortAddr(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function bestScore() {
  const n = Number(localStorage.getItem(BEST_KEY) || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function readScores() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCORE_KEY) || '{}');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    return raw;
  } catch {
    return {};
  }
}

function walletBest(addr) {
  const n = Number(readScores()[addr] || 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

let boardScores = {};

function mergedScores() {
  const scores = {};
  const take = (addr, n) => {
    const hex = String(addr || '').toLowerCase();
    const score = Number(n);
    if (!/^0x[0-9a-f]{40}$/.test(hex) || !Number.isFinite(score) || score <= 0) return;
    scores[hex] = Math.max(scores[hex] || 0, score);
  };
  for (const [addr, n] of Object.entries(readScores())) take(addr, n);
  for (const [addr, n] of Object.entries(boardScores)) take(addr, n);
  return scores;
}

function noteWalletBest(score) {
  const addr = connectedAddress();
  if (!addr || !(score > 0) || score <= walletBest(addr)) return;
  const scores = readScores();
  scores[addr] = score;
  localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
  paintBest();
  if (!qs.get('sim')) pushBoard(addr, score);
}

function noteBest(score) {
  if (score > bestScore()) localStorage.setItem(BEST_KEY, String(score));
  noteWalletBest(score);
}

function paintBest() {
  if (!el.best) return;
  const scores = mergedScores();
  const rows = Object.entries(scores)
    .map(([addr, score]) => ({ addr, score }))
    .sort((a, b) => b.score - a.score || a.addr.localeCompare(b.addr))
    .slice(0, 12);
  const mine = connectedAddress();
  const anon = bestScore();
  el.best.replaceChildren();
  if (!rows.length && !(anon && !mine)) {
    if (!mine) {
      el.best.hidden = true;
      return;
    }
    el.best.hidden = false;
    const line = document.createElement('p');
    line.textContent = `No score yet · ${shortAddr(mine)}`;
    el.best.appendChild(line);
    return;
  }
  el.best.hidden = false;
  if (!mine && anon) {
    const line = document.createElement('p');
    line.textContent = `Best clear ${anon}`;
    el.best.appendChild(line);
  } else if (mine && !scores[mine]) {
    const line = document.createElement('p');
    line.textContent = `No score yet · ${shortAddr(mine)}`;
    el.best.appendChild(line);
  }
  if (!rows.length) return;
  const list = document.createElement('ol');
  list.className = 'best-list';
  rows.forEach((row, index) => {
    const li = document.createElement('li');
    if (row.addr === mine) li.className = 'is-mine';
    const who = document.createElement('span');
    who.textContent = `${index + 1}  ${shortAddr(row.addr)}`;
    const pts = document.createElement('span');
    pts.textContent = String(row.score);
    li.append(who, pts);
    list.appendChild(li);
  });
  el.best.appendChild(list);
}

async function pullBoard() {
  try {
    const res = await fetch('/api/scores', { cache: 'no-store' });
    if (!res.ok) return;
    const body = await res.json();
    const next = {};
    for (const row of body.scores || []) next[row.address] = row.score;
    boardScores = next;
    paintBest();
  } catch {
    /* The list still shows scores saved in this browser. */
  }
}

function pushBoard(addr, score) {
  fetch('/api/scores', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ address: addr, score }),
  }).then((res) => (res.ok ? res.json() : null)).then((body) => {
    if (!body?.scores) return;
    const next = {};
    for (const row of body.scores) next[row.address] = row.score;
    boardScores = next;
    paintBest();
  }).catch(() => {});
}

function playingOrami() {
  return state?.hero?.id === 'orami';
}

function readOrami() {
  try {
    const raw = JSON.parse(localStorage.getItem(ORAMI_KEY) || '{}');
    return { bolt: !!raw.bolt };
  } catch {
    return { bolt: false };
  }
}

function writeOrami(kit) {
  try { localStorage.setItem(ORAMI_KEY, JSON.stringify({ bolt: !!kit.bolt })); } catch { /* this visit still keeps it */ }
}

function paintArmory() {
  const orami = pickedHero === 'orami';
  document.querySelector('.pilot-card .armory')?.classList.toggle('is-orami', orami);
  const rows = [
    ['arm-sword', orami ? '/assets/orami/icon-slash.png' : '/assets/gold/18.png', orami ? 'Fire slash' : 'Sword'],
    ['arm-axe', orami ? '/assets/orami/fireball.png' : '/assets/weapons/axe.png', orami ? 'Fireball' : 'Axe'],
    ['arm-rifle', '/assets/weapons/rifle.png', 'Rifle'],
  ];
  for (const [id, src, label] of rows) {
    const node = document.getElementById(id);
    if (!node) continue;
    node.hidden = orami && id === 'arm-rifle';
    const img = node.querySelector('img');
    const cap = node.querySelector('figcaption');
    if (img) img.src = src;
    if (cap) cap.textContent = label;
  }
  const stat = document.querySelector('.hero-stat');
  if (stat) {
    stat.textContent = orami
      ? 'Space jumps, and the drop burns. Hold Ctrl or Down to crouch. E cuts a fire slash or shoots the fireball. Hold Q to guard. The wheel swaps those two. F confirms. I opens armor.'
      : 'Space jumps. Hold Ctrl or Down to crouch. E attacks. Hold Q to guard. Mouse wheel cycles weapons. F or right-click confirms. I opens armor.';
  }
}

function dressOrami(level) {
  const axe = level.items.find((item) => item.id === 'axe');
  level.items = level.items.filter((item) => item.id !== 'axe' && item.id !== 'gun');
  if (axe) level.items.push({ id: 'bolt', x: axe.x, y: G - 30, got: false });
  level.signs = level.signs.filter((sign) => sign.text !== 'Rifle');
  for (const sign of level.signs) {
    if (sign.text === 'Axe') {
      sign.text = 'Fireball';
      sign.once = 'Fireball. Pick it up. E shoots. The wheel swaps back to the fire slash.';
    }
    if (sign.text === 'Sword') sign.once = 'Orami leaves the sword. E cuts a fire slash.';
  }
}

function itemMeta(id) {
  if (id === 'bolt') return { id: 'bolt', name: 'Fireball', src: 'assets/orami/fireball.png', arm: 'bolt' };
  return ALL_META.find((entry) => entry.id === id);
}

function signOnce(sign) {
  if (!playingOrami()) return sign.once;
  if (sign.text === 'Sword') return 'Orami leaves the sword. E cuts a fire slash.';
  if (sign.text === 'Fireball') return sign.once;
  if (sign.text === 'Helm' && state.level?.tier === 4) {
    return 'Gold helm. It adds one damage to the fire slash and the fireball. Press I to look at it. The rise pauses.';
  }
  return sign.once;
}

function goalLine() {
  if (!state) return '';
  const boss = state.level?.enemies?.find((enemy) => enemy.kind === 'boss' && enemy.hp > 0);
  let line = 'The gate is open. Walk through the door';
  if (!playingOrami() && !state.inv.blade) line = 'Find the sword';
  else if ((state.level.tier || 1) > 1 && !state.inv.spark) line = 'Find the spark. One hop will not clear the shaft';
  else if (playingOrami() && !state.inv.bolt) line = 'Find the fireball';
  else if (!state.powered) line = state.level.tier === 1
    ? 'Climb the steps and confirm the relay'
    : 'Climb the shaft and confirm the relay';
  else if (boss) line = `Drop the ${boss.name}, then take the door`;
  const page = state.level?.page;
  if (page && !page.got) line += ' · grab the glowing page ahead';
  return line;
}

function addScore(n, x, y) {
  if (!state || !n || n < 0) return;
  state.score += n;
  state.pops.push({ x, y: y - 8, text: `+${n}`, life: 0.7 });
  if (state.pops.length > 14) state.pops.shift();
  paintScore();
  noteWalletBest(state.score);
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
  refreshHeroLock();
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
  const { inv } = state;
  el.zoneName.textContent = state.level.name;
  paintVital();
  const slots = playingOrami()
    ? [
      { id: 'slash', name: 'Fire slash', src: 'assets/orami/icon-slash.png', arm: 'slash', carried: true },
      { id: 'bolt', name: 'Fireball', src: 'assets/orami/icon-bolt.png', arm: 'bolt', carried: !!inv.bolt },
      ...ITEM_META.filter((item) => item.id === 'spark' || item.id === 'shield'),
    ]
    : ITEM_META;
  el.inv.innerHTML = slots.map((item) => {
    const carried = item.carried || inv[item.id];
    const on = carried ? 'on' : '';
    const armed = item.arm && state.weapon === item.arm ? ' armed' : '';
    const title = armed ? `${item.name} ready` : carried ? `${item.name} carried` : item.name;
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
      ? 'assets/orami/portrait.png'
      : look
        ? (state.armor.helm ? `assets/kits/${look}-idle.png` : `assets/kits/${look}-open.png`)
        : 'assets/hemigo/bare-idle.png';
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
  writeGear();
  renderBag();
  toast(state.armor[meta.slot] === id ? `${meta.name} equipped.` : `${meta.name} taken off.`);
}

function chipList(target) {
  if (!target) return;
  const h = chains?.hemi;
  const run = state?.stamp;
  const block = run ? run.block : h?.block;
  const bit = block
    ? `<span class="chip hemi">${run ? 'Run' : 'Hemi'} #${block}</span>`
    : `<span class="chip quiet">${run ? 'Run quiet' : 'Hemi quiet'}</span>`;
  target.innerHTML = bit;
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
  if (playingOrami()) return state.weapon === 'bolt' ? 'bolt' : 'slash';
  if (state.weapon === 'sword' || state.weapon === 'axe' || state.weapon === 'gun') return state.weapon;
  if (state.inv.blade) return 'sword';
  if (state.inv.axe) return 'axe';
  return 'fist';
}

function attackBox(body) {
  const kind = body.attackKind || armNow();
  const reach = kind === 'slash' ? 58 : kind === 'axe' ? 44 : kind === 'sword' ? 40 : 16;
  let h = kind === 'slash' ? 40 : kind === 'axe' ? 30 : 18;
  let y = kind === 'slash' ? body.y - 14 : kind === 'axe' ? body.y + 2 : body.y + 8;
  if (body.crouch) {
    y = body.y + 1;
    h = Math.max(8, body.h - 2);
  } else if (!body.onGround) {
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
  const base = kind === 'axe' || kind === 'slash' ? 3 : kind === 'sword' ? 2 : 0;
  if (!base) return 0;
  let bonus = 0;
  if (state.armor.helm === 'goldhelm') bonus += 1;
  if (state.armor.chest === 'goldplate') bonus += 2;
  return base + bonus;
}

function runSpeed() {
  let speed = state.hero.speed;
  if (state.armor.helm === 'bluehelm') speed *= 1.34;
  if (state.player && state.player.crouch) speed *= 0.45;
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

function scorchJump() {
  if (!playingOrami()) return;
  const player = state.player;
  // The leap, the high kick, and the clean glide stay cool. The fire kicks burn.
  const clip = oramiClip();
  const burning = clip.name === 'jump' && clip.frame >= 3;
  if (!burning) {
    if (player.onGround && player.landT <= 0) player.diveHit = null;
    return;
  }
  if (!player.diveHit) player.diveHit = new Set();
  const dir = player.face < 0 ? -1 : 1;
  const box = {
    x: player.x + (dir < 0 ? -16 : 0),
    y: player.y - 4,
    w: player.w + 16,
    h: player.h + 12,
  };
  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0 || player.diveHit.has(enemy.id)) continue;
    if (!aabb(box, enemy)) continue;
    player.diveHit.add(enemy.id);
    state.shake = 0.06;
    markHit(enemy, boltPower());
  }
}

function boltPower() {
  let power = 2;
  if (state.armor.helm === 'goldhelm') power += 1;
  if (state.armor.chest === 'goldplate') power += 2;
  return power;
}

function spawnFireball() {
  const player = state.player;
  const dir = player.face < 0 ? -1 : 1;
  const size = 16;
  // The cast grows in the open palm. The shot leaves from that hand.
  const handForward = 26;
  const handUp = player.crouch ? 20 : 32;
  state.shots.push({
    x: player.x + player.w / 2 + dir * handForward - size / 2,
    y: player.y + player.h - handUp - size / 2,
    w: size,
    h: size,
    vx: dir * 300,
    life: 0.95,
    color: '#ffb15a',
    fire: true,
    friendly: true,
    power: boltPower(),
  });
}

function beginAttack() {
  const player = state.player;
  if (player.attackCd > 0 || shielding() || player.downT > 0) return;
  if (playingOrami()) {
    const arm = state.weapon === 'bolt' && state.inv.bolt ? 'bolt' : 'slash';
    const dur = arm === 'bolt' ? 0.4 : 0.42;
    player.attackCd = cool(arm === 'bolt' ? 0.48 : 0.52);
    player.attackT = dur;
    player.attackDur = dur;
    player.attackKind = arm;
    player.attackHit = false;
    player.boltSent = false;
    return;
  }
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
  if (player.hp <= 0) {
    state.score -= MARK_LOSS;
    state.pops.push({ x: player.x, y: player.y - 8, text: `-${MARK_LOSS}`, life: 0.9 });
    if (state.pops.length > 14) state.pops.shift();
    paintScore();
    if (playingOrami()) {
      player.downT = 0.62;
      player.attackT = 0;
      player.vx = dir * 70;
      return;
    }
    respawn('Out of marks. -500. Back at the last checkpoint.');
  }
}

function respawn(why) {
  const player = state.player;
  player.h = STAND_H;
  player.crouch = false;
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
  if (id === 'bolt') {
    state.weapon = 'bolt';
    writeOrami({ bolt: true });
    writeGear();
    renderHud();
    addScore(160, state.player.x, state.player.y);
    toast('Fireball in hand. E shoots. The wheel swaps back to the fire slash.');
    return;
  }
  const meta = ALL_META.find((item) => item.id === id);
  if (meta?.arm) state.weapon = meta.arm;
  if (meta?.slot && !state.armor[meta.slot]) {
    state.armor[meta.slot] = id;
    applyArmor();
    writeWear(state.armor);
  }
  writeGear();
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
  if (playingOrami()) {
    if (arm !== 'slash' && arm !== 'bolt') return;
    if (arm === 'bolt' && !state.inv.bolt) {
      toast('The fireball is still on the ground.');
      return;
    }
    state.weapon = arm;
    renderHud();
    toast(arm === 'bolt' ? 'Fireball ready. E shoots.' : 'Fire slash ready. E cuts.');
    return;
  }
  const item = ITEM_META.find((entry) => entry.arm === arm);
  if (!item || !state.inv[item.id]) {
    toast(`You have not found a ${arm} yet.`);
    return;
  }
  state.weapon = arm;
  writeGear();
  renderHud();
  const verb = arm === 'gun' ? 'E fires.' : arm === 'axe' ? 'E chops.' : 'E slashes.';
  toast(`${item.name} in hand. ${verb}`);
}

function cycleWeapon(dir) {
  if (!state || state.mode !== 'play') return;
  if (playingOrami()) {
    const arms = state.inv.bolt ? ORAMI_ARMS : ['slash'];
    const idx = Math.max(0, arms.indexOf(state.weapon));
    const next = arms[(idx + (dir || 1) + arms.length) % arms.length];
    if (next !== state.weapon) equipOwned(next);
    return;
  }
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
    if ((state.level.tier || 1) > 1 && !state.inv.spark) {
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
  toast(`Page gathered. ${witness}`);
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
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX, enemy.x));
    if (!enemy.chase) enemy.dir *= -1;
  }
}

function pressBoss(enemy, player) {
  const low = enemy.hp <= enemy.max * 0.5 || player.hp <= 2;
  enemy.chase = low;
  if (!low) {
    enemy.minX = enemy.homeMin;
    enemy.maxX = enemy.homeMax;
    enemy.speed = enemy.baseSpeed;
    return;
  }
  const gateX = state.level.gate.x;
  const px = player.x + player.w / 2;
  enemy.minX = Math.max(gateX - 280, Math.min(enemy.homeMin, px - 28));
  enemy.maxX = Math.min(state.level.exit.x - 36, Math.max(enemy.homeMax, px + 28));
  if (enemy.minX > enemy.maxX) enemy.minX = enemy.maxX;
  enemy.speed = enemy.chaseSpeed;
  const mid = enemy.x + enemy.w / 2;
  if (px < mid - 8) enemy.dir = -1;
  else if (px > mid + 8) enemy.dir = 1;
}

function acidSurface(shot, dt) {
  if ((shot.vy || 0) <= 0) return null;
  const bottom = shot.y + shot.h;
  const prev = bottom - shot.vy * dt;
  const mid = shot.x + shot.w / 2;
  let hit = null;
  for (const plat of landables()) {
    if (mid < plat.x + 2 || mid > plat.x + plat.w - 2) continue;
    if (bottom < plat.y || prev > plat.y + 4) continue;
    if (!hit || plat.y < hit.y) hit = plat;
  }
  return hit;
}

function leavePuddle(plat, shot) {
  const w = 26;
  const h = 7;
  const mid = shot.x + shot.w / 2;
  const x = mid - w / 2;
  const y = plat.y - h + 2;
  const existing = (state.puddles || []).find((puddle) => Math.abs(puddle.x - x) < 14 && Math.abs(puddle.y - y) < 6);
  if (existing) {
    existing.life = 3;
    existing.plat = plat.id;
    existing.ox = mid - plat.x;
    return;
  }
  state.puddles.push({
    x,
    y,
    w,
    h,
    life: 3,
    plat: plat.id,
    ox: mid - plat.x,
  });
}

function soakPuddles(dt) {
  if (!state.puddles) return;
  const player = state.player;
  for (const puddle of state.puddles) {
    puddle.life -= dt;
    if (!puddle.plat) continue;
    const plat = state.level.platforms.find((item) => item.id === puddle.plat);
    if (!plat) continue;
    puddle.x = plat.x + puddle.ox - puddle.w / 2;
    puddle.y = plat.y - puddle.h + 2;
  }
  state.puddles = state.puddles.filter((puddle) => puddle.life > 0);
  for (const puddle of state.puddles) {
    if (aabb(player, puddle)) hurt(puddle.x + puddle.w / 2);
  }
}

function drawPuddles() {
  for (const puddle of state.puddles || []) {
    const cx = puddle.x + puddle.w / 2;
    const cy = puddle.y + puddle.h - 1;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.55 * Math.max(0, puddle.life / 3);
    ctx.fillStyle = '#3d8a14';
    ctx.beginPath();
    ctx.ellipse(cx, cy, puddle.w / 2, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d6ff6a';
    ctx.beginPath();
    ctx.ellipse(cx - 1, cy - 1, Math.max(3, puddle.w / 2 - 5), 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function spitAcid(enemy, player, dt) {
  enemy.shotCd = (enemy.shotCd ?? 0.4) - dt;
  const origin = enemy.x + enemy.w / 2;
  const dx = player.x + player.w / 2 - origin;
  const dy = (player.y + player.h / 2) - (enemy.y + 12);
  if (Math.abs(dy) > 64 || Math.abs(dx) > 168 || Math.abs(dx) < 28 || enemy.shotCd > 0) return;
  const dir = dx < 0 ? -1 : 1;
  enemy.dir = dir;
  enemy.shotCd = 1.15;
  state.shots.push({
    x: origin + dir * 14,
    y: enemy.y + 16,
    w: 11,
    h: 11,
    vx: dir * 124,
    vy: -78,
    life: 1.35,
    color: '#b6ff3a',
    acid: true,
    friendly: false,
  });
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
    const prevX = plat.x;
    const prevY = plat.y;
    const swing = Math.sin(state.time * plat.rate + plat.phase);
    plat.x = plat.homeX + swing * plat.slide;
    if (plat.bob) plat.y = plat.homeY + Math.cos(state.time * plat.rate + plat.phase) * plat.bob;
    const foot = player.y + player.h;
    const riding = player.onGround
      && player.x + player.w > prevX + 2
      && player.x < prevX + plat.w - 2
      && Math.abs(foot - prevY) <= 6;
    if (riding) {
      player.x += plat.x - prevX;
      player.y += plat.y - prevY;
    }
  }
  if (state.pops) {
    for (const pop of state.pops) {
      pop.y -= 22 * dt;
      pop.life -= dt;
    }
    state.pops = state.pops.filter((pop) => pop.life > 0);
  }

  let move = 0;
  if (player.downT > 0) {
    input.attackQueued = false;
    input.jumpQueued = false;
    state.jumpBuffer = 0;
    player.downT -= dt;
    if (player.downT <= 0) {
      player.downT = 0;
      respawn('Out of marks. -500. Back at the last checkpoint.');
      return;
    }
  } else {
    if (input.left || keys.has('arrowleft') || keys.has('a')) move -= 1;
    if (input.right || keys.has('arrowright') || keys.has('d')) move += 1;
    if (Math.abs(input.stickX) > 0.18) move += input.stickX;
  }
  move = Math.max(-1, Math.min(1, move));
  if (move !== 0) player.face = move < 0 ? -1 : 1;

  const accel = player.onGround ? 12 : 8;
  const target = move * runSpeed();
  player.vx += (target - player.vx) * Math.min(1, accel * dt);
  if (Math.abs(player.vx) < 2 && move === 0) player.vx = 0;
  if (player.onGround && Math.abs(player.vx) > 12) {
    player.gait = (player.gait || 0) + Math.abs(player.vx) * dt / 52;
  }
  if (playingOrami()) {
    const dir = Math.sign(player.vx);
    const moving = Math.abs(player.vx) > 12 && player.downT <= 0;
    if (moving && !player.crouch && (!player.runDir || player.runDir === dir)) {
      player.runDir = dir;
      player.runHold = Math.min(ORAMI_RUN_TIME + 0.4, (player.runHold || 0) + dt);
    } else if (!(player.crouch && moving && dir === player.runDir)) {
      player.runHold = 0;
      player.runDir = 0;
    }
  }

  if (input.jumpQueued) {
    requestJump();
    input.jumpQueued = false;
  }
  applyCrouch(player);
  if (state.jumpBuffer > 0) state.jumpBuffer -= dt;

  const canGround = player.onGround || player.coyote > 0;
  if (state.jumpBuffer > 0 && canGround) {
    player.vy = -state.hero.jumpV;
    player.onGround = false;
    player.coyote = 0;
    player.airtime = 0;
    player.airJumps = state.inv.spark ? 1 : 0;
    player.releaseJump = false;
    player.landT = 0;
    player.diveHit = new Set();
    state.jumpBuffer = 0;
    state.riseOrigin = player.y + player.h;
    state.peak = 0;
  } else if (state.jumpBuffer > 0 && player.airJumps > 0 && player.airtime > 0.13) {
    player.vy = -state.hero.jumpV;
    player.airJumps -= 1;
    player.releaseJump = false;
    player.landT = 0;
    player.diveHit = new Set();
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
  if (player.landT > 0) player.landT = Math.max(0, player.landT - dt);
  if (player.attackKind === 'bolt' && !player.boltSent && player.attackDur) {
    const cast = 1 - player.attackT / player.attackDur;
    if (cast >= 0.76) {
      player.boltSent = true;
      spawnFireball();
    }
  }
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
    if (!wasGround && playingOrami() && (player.airtime || 0) > 0.16) player.landT = 0.16;
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
  if (wasGround && !player.onGround) player.diveHit = new Set();
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
      state.checkpoint = { x: player.x, y: player.y + player.h - STAND_H };
      state.nextCheck += 1;
    }
  }

  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0) continue;
    if (enemy.kind === 'librarian' || enemy.kind === 'plate' || enemy.kind === 'boss') {
      if (enemy.kind === 'boss') pressBoss(enemy, player);
      paceHopper(enemy, dt);
      if (enemy.kind === 'librarian') spitAcid(enemy, player, dt);
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
      const origin = enemy.x + enemy.w / 2;
      const dx = player.x + player.w / 2 - origin;
      const dy = Math.abs((player.y + player.h / 2) - (enemy.y + enemy.h / 2));
      const tier = state.level.tier || 1;
      if (enemy.follow) {
        enemy.follow.t -= dt;
        if (enemy.follow.t <= 0) {
          const follow = enemy.follow;
          enemy.follow = null;
          enemy.tell = 0;
          spawnBossBolt(enemy, origin, follow.dir, follow.speed, follow.move, follow.pat, follow.note);
        }
      }
      if (enemy.windup > 0) {
        enemy.windup -= dt;
        if (enemy.windup <= 0) releaseBossMove(enemy, origin);
      } else {
        enemy.cooldown -= dt;
        const reach = (enemy.chase ? 320 : 260) + (tier - 1) * 18;
        const dyBand = (enemy.chase ? 140 : 112) + (tier - 1) * 8;
        const inArc = dy < dyBand && Math.abs(dx) < reach && Math.abs(dx) > 16;
        if (inArc && enemy.cooldown <= 0 && !enemy.follow) {
          beginBossTell(enemy, dx < 0 ? -1 : 1);
        }
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

  if (player.attackT > 0 && !player.attackHit && player.attackKind !== 'gun' && player.attackKind !== 'bolt') {
    const swing = 1 - player.attackT / (player.attackDur || 0.2);
    const striking = player.attackKind === 'slash' ? swing > 0.28 && swing < 0.7 : swing > 0.32 && swing < 0.82;
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
    if (shot.acid) shot.vy = Math.min(280, (shot.vy || 0) + 760 * dt);
    shot.x += shot.vx * dt;
    shot.y += (shot.vy || 0) * dt;
    shot.life -= dt;
    const landed = shot.acid && (state.level.tier || 1) >= 3 ? acidSurface(shot, dt) : null;
    if (shot.friendly) {
      for (const enemy of state.level.enemies) {
        if (enemy.hp <= 0 || shot.life <= 0) continue;
        if (!aabb(shot, enemy)) continue;
        shot.life = 0;
        state.shake = 0.05;
        markHit(enemy, shot.power || 1);
      }
    } else if (shot.life > 0 && aabb(shot, player)) {
      const sx = shot.x + shot.w / 2;
      shot.life = 0;
      if (shielding() && inFront(sx)) pingShield();
      else {
        if (shot.fire) state.fireHits += 1;
        hurt(shot.x);
      }
    }
    if (landed) {
      leavePuddle(landed, shot);
      shot.life = 0;
    }
  }
  const shotFar = (state.level.exit?.x || 4000) + 900;
  state.shots = state.shots.filter((shot) => shot.life > 0 && shot.x > -40 && shot.x < shotFar && shot.y > -160 && shot.y < G + 80);
  soakPuddles(dt);

  scorchJump();

  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0 || enemy.kind === 'turret') continue;
    if (player.attackT > 0) continue;
    if (player.diveHit && player.diveHit.has(enemy.id)) continue;
    if (!aabb(player, enemy)) continue;
    const from = enemy.x + enemy.w / 2;
    if (shielding() && inFront(from)) pingShield();
    else hurt(from);
  }

  for (const item of state.level.items) {
    if (item.got) continue;
    const cx = player.x + player.w / 2;
    const cy = player.y + player.h / 2;
    if (Math.hypot(cx - item.x, cy - item.y) < 28) {
      if (playingOrami() && (item.id === 'blade' || item.id === 'axe' || item.id === 'gun')) {
        state.skipped = state.skipped || {};
        if (!state.skipped[item.id]) {
          state.skipped[item.id] = true;
          const name = item.id === 'blade' ? 'sword' : item.id === 'axe' ? 'axe' : 'rifle';
          toast(`Orami leaves the ${name}. E cuts a fire slash.`);
        }
        continue;
      }
      grant(item.id);
      item.got = true;
    }
  }
  takePage();

  for (const sign of state.level.signs) {
    if (sign.shown) continue;
    const sy = sign.y || G;
    if (Math.abs(player.x + player.w / 2 - sign.x) < 36 && Math.abs(player.y + player.h - sy) < 80) {
      sign.shown = true;
      toast(signOnce(sign));
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

function approachingFerry(foot, probe) {
  let best = null;
  for (const plat of state.level.platforms) {
    if (!plat.slide) continue;
    const dy = plat.y - foot;
    if (dy > 70 || dy < -80) continue;
    const minX = plat.homeX - plat.slide;
    const maxR = plat.homeX + plat.w + plat.slide;
    if (probe < minX - 8 || probe > maxR + 8) continue;
    if (!best || Math.abs(dy) < Math.abs(best.y - foot)) best = plat;
  }
  return best;
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
  if (!playingOrami() && !state.inv.blade) goal = blade.x;
  else if (plate && player.x < plate.x + 24) goal = plate.x - 8;
  else if ((state.level.tier || 1) > 1 && !state.inv.spark && spark) goal = spark.x;
  else if (!state.powered) {
    const step = ledgeAbove(150);
    if (step) goal = step.x + Math.min(120, step.w / 2);
    else goal = nextLedgeGoal(player) ?? state.level.relay.x;
  } else if (turret && player.y + player.h > G - 48 && player.x < turret.x + 8) goal = turret.x - 36;
  else if (boss) goal = boss.x - 36;

  const ember = state.level.enemies.find((enemy) => {
    if (enemy.kind !== 'ember' || enemy.hp <= 0) return false;
    if (!playingOrami() && !state.inv.blade) return false;
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
  const head = {
    x: player.x + (dir > 0 ? 10 : -24),
    y: foot - STAND_H,
    w: 28,
    h: 10,
  };
  if (solids().some((solid) => aabb(head, solid))) keys.add('control');
  else keys.delete('control');
  const probe = player.x + (dir > 0 ? player.w + 12 : -12);
  const gap = player.onGround && supportedAt(mid, foot) && !supportedAt(probe, foot);
  const ledge = ledgeAbove(state.inv.spark ? 150 : state.hero.single + 6);
  const ferry = gap ? approachingFerry(foot, probe) : null;
  const ferryHere = ferry && probe >= ferry.x + 4 && probe <= ferry.x + ferry.w - 4;
  if (gap && ferry && !ferryHere) {
    input.right = false;
    input.left = false;
  } else if (gap && ferryHere && ferry.y <= foot - 12) requestJump();
  else if (gap && !ferry) requestJump();
  else if (ledge) requestJump();
  state.wantDouble = !!(ledge && state.inv.spark && foot - ledge.y > state.hero.single + 4);

  for (const enemy of state.level.enemies) {
    if (enemy.hp <= 0) continue;
    const dx = enemy.x + enemy.w / 2 - (player.x + player.w / 2);
    const dy = Math.abs(enemy.y - player.y);
    const arm = playingOrami()
      ? (state.weapon === 'bolt' ? 'bolt' : 'slash')
      : (state.weapon || (state.inv.blade ? 'sword' : 'fist'));
    const reach = arm === 'gun' || arm === 'bolt' ? 220 : arm === 'slash' || arm === 'axe' ? 54 : arm === 'sword' ? 48 : 22;
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
    chains: !!(chains && chains.hemi),
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

function zoneTheme() {
  return THEME[state.zone] || THEME.hemi;
}

const SEG = 'assets/segments/';
const ROUND_TREES = [1, 2, 3, 4, 5, 6].map((n) => `green-trees/green-trees-${n}.png`);
const PINES = [1, 2, 3, 4, 5, 6, 7].map((n) => `pine-trees/pine-trees-${n}.png`);
const TRUNKS = [1, 2, 3].map((n) => `tree-trunks/tree-trunks-${n}.png`);
const HANG_VINES = [1, 3, 5, 6, 7, 8].map((n) => `hanging-vines/hanging-vines-${n}.png`)
  .concat([1, 3].map((n) => `jungle-vines/jungle-vines-${n}.png`));
const CLOUDS = [3, 4, 5, 7].map((n) => `white-clouds/white-clouds-${n}.png`);
const SNOW_PEAKS = [1, 2, 3, 4].map((n) => `snowy-mountains/snowy-mountains-${n}.png`);
const POSTS = [1, 2, 3].map((n) => `posts/post-${n}.png`);
const VOLCANO_PEAKS = ['volcanoes/volcanoes-2.png', 'volcanoes/volcanoes-3.png'];
const LAVA_LIP = ['lava-flow/lava-flow-1.png', 'lava-flow/lava-flow-2.png'];
const LAVA_CRACK = ['lava-flow/lava-flow-3.png', 'lava-flow/lava-flow-4.png'];
const SCENE_FILES = [
  'blue-sky/blue-sky-1.png',
  'yellow-sun.png',
  'rolling-green-hills.png',
  'brown-mountains.png',
  'volcanoes/volcanoes-7.png',
  'red-sky.png',
  'ground/grass.png',
  'ground/stone.png',
  'white-clouds/white-clouds-6.png',
  'lava-flow/lava-flow-5.png',
  'snowy-mountains/snowy-mountains-4.png',
].concat(CLOUDS, ROUND_TREES, PINES, TRUNKS, HANG_VINES, SNOW_PEAKS, POSTS, VOLCANO_PEAKS, LAVA_LIP, LAVA_CRACK);
for (const file of SCENE_FILES) loadImage(`${SEG}${file}`);

function sceneImg(file) {
  return images[`${SEG}${file}`];
}

function artReady(img) {
  return !!(img && img.complete && img.naturalWidth);
}

function blitArt(img, x, y, w, h) {
  if (!artReady(img) || w < 1 || h < 1) return;
  ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function screenSpan(parallax, spacing) {
  const shift = state.cam.x * parallax;
  const first = Math.floor(shift / spacing) - 1;
  const last = first + Math.ceil(viewW / spacing) + 3;
  return { first, last, shift };
}

function tileScreen(file, parallax, y, height) {
  const img = sceneImg(file);
  if (!artReady(img) || height < 2) return;
  const w = img.naturalWidth * (height / img.naturalHeight);
  const shift = state.cam.x * parallax;
  let x = -((shift % w) + w) % w;
  for (; x < viewW + 1; x += w) blitArt(img, x, y, w, height);
}

function scatterScreen(files, parallax, spacing, foot, height, salt) {
  const { first, last } = screenSpan(parallax, spacing);
  const nudge = salt || 0;
  for (let i = first; i <= last; i += 1) {
    const img = sceneImg(files[Math.abs(i + nudge) % files.length]);
    if (!artReady(img)) continue;
    const h = height * (0.8 + (Math.abs(i * 5 + nudge) % 4) * 0.07);
    const w = img.naturalWidth * (h / img.naturalHeight);
    const sx = i * spacing - state.cam.x * parallax;
    blitArt(img, sx - w * 0.5, foot - h, w, h);
  }
}

function hangScreen(files, parallax, spacing, height) {
  const { first, last } = screenSpan(parallax, spacing);
  for (let i = first; i <= last; i += 1) {
    const img = sceneImg(files[Math.abs(i) % files.length]);
    if (!artReady(img)) continue;
    const h = height * (0.62 + (Math.abs(i * 3) % 4) * 0.12);
    const w = img.naturalWidth * (h / img.naturalHeight);
    const sx = i * spacing - state.cam.x * parallax;
    blitArt(img, sx, -6, w, h);
  }
}

function paintSun(y, h) {
  const img = sceneImg('yellow-sun.png');
  if (!artReady(img)) return;
  const w = img.naturalWidth * (h / img.naturalHeight);
  const span = viewW + w + 40;
  const x = ((viewW * 0.78 - state.cam.x * 0.03) % span + span) % span - 20;
  blitArt(img, x, y, w, h);
}

function paintGrassSky() {
  tileScreen('blue-sky/blue-sky-1.png', 0.04, 0, Math.round(viewH * 0.52));
  tileScreen('white-clouds/white-clouds-6.png', 0.08, Math.round(viewH * 0.02), Math.round(viewH * 0.16));
  paintSun(Math.round(viewH * 0.06), Math.round(viewH * 0.14));
  scatterScreen(CLOUDS, 0.14, 200, Math.round(viewH * 0.28), Math.round(viewH * 0.12));
  tileScreen('rolling-green-hills.png', 0.2, Math.round(viewH * 0.34), Math.round(viewH * 0.24));
}

function paintMountainSky() {
  paintSun(Math.round(viewH * 0.08), Math.round(viewH * 0.16));
  tileScreen('white-clouds/white-clouds-6.png', 0.06, Math.round(viewH * 0.04), Math.round(viewH * 0.14));
  tileScreen('brown-mountains.png', 0.14, Math.round(viewH * 0.22), Math.round(viewH * 0.42));
  tileScreen('volcanoes/volcanoes-7.png', 0.26, Math.round(viewH * 0.36), Math.round(viewH * 0.3));
}

function paintJungleSky() {
  hangScreen(HANG_VINES, 0.16, 48, Math.round(viewH * 0.5));
  ctx.globalAlpha = 0.82;
  scatterScreen(TRUNKS, 0.22, 110, Math.round(viewH * 0.74), Math.round(viewH * 0.32));
  ctx.globalAlpha = 1;
}

function paintTundraSky() {
  tileScreen('white-clouds/white-clouds-6.png', 0.05, Math.round(viewH * 0.05), Math.round(viewH * 0.18));
  scatterScreen(SNOW_PEAKS, 0.1, 230, Math.round(viewH * 0.58), Math.round(viewH * 0.36), 0);
  scatterScreen(SNOW_PEAKS, 0.22, 170, Math.round(viewH * 0.72), Math.round(viewH * 0.26), 2);
}

function paintVolcanoSky() {
  tileScreen('red-sky.png', 0.05, 0, Math.round(viewH * 0.58));
  scatterScreen(VOLCANO_PEAKS, 0.18, 300, Math.round(viewH * 0.76), Math.round(viewH * 0.4));
  tileScreen('lava-flow/lava-flow-5.png', 0.28, Math.round(viewH * 0.58), Math.round(viewH * 0.26));
}

function drawBackdrop(shakeX, shakeY) {
  const biome = zoneTheme().biome;
  ctx.save();
  ctx.translate(Math.round(shakeX), Math.round(shakeY));
  if (biome === 'grass') paintGrassSky();
  else if (biome === 'mountain') paintMountainSky();
  else if (biome === 'jungle') paintJungleSky();
  else if (biome === 'tundra') paintTundraSky();
  else paintVolcanoSky();
  ctx.restore();
}

function drawFloorProps() {
  const biome = zoneTheme().biome;
  const files = biome === 'grass' ? ROUND_TREES
    : biome === 'mountain' ? PINES
      : biome === 'jungle' ? TRUNKS
        : biome === 'tundra' ? POSTS.concat(['pine-trees/pine-trees-4.png'])
          : null;
  if (!files) return;
  const spacing = biome === 'tundra' ? 300 : biome === 'jungle' ? 170 : 220;
  const height = biome === 'tundra' ? 50 : biome === 'jungle' ? 100 : 76;
  const left = state.cam.x - 60;
  const right = state.cam.x + viewW + 60;
  const gate = state.level.gate.x;
  const exitX = state.level.exit.x;
  const first = Math.floor(left / spacing) - 1;
  const last = Math.ceil(right / spacing) + 1;
  for (let i = first; i <= last; i += 1) {
    const x = i * spacing + (Math.abs(i * 19) % 48) - 16;
    if (x < 30 || x > exitX + 120) continue;
    if (x < left - 40 || x > right + 40) continue;
    if (Math.abs(x - gate) < 100 || Math.abs(x - exitX) < 80) continue;
    const underRoof = state.level.platforms.some((plat) => (
      plat.kind === 'ceil' && x > plat.x - 24 && x < plat.x + plat.w + 24
    ));
    if (underRoof) continue;
    const img = sceneImg(files[Math.abs(i) % files.length]);
    if (!artReady(img)) continue;
    const h = height + (Math.abs(i * 7) % 4) * 8;
    const w = img.naturalWidth * (h / img.naturalHeight);
    blitArt(img, x - w * 0.5, G - h + 6, w, h);
  }
}

function drawGroundTile(plat, img, drawH, fit) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(plat.x, plat.y, plat.w, drawH);
  ctx.clip();
  if (!artReady(img)) {
    ctx.fillStyle = '#5a3a22';
    ctx.fillRect(plat.x, plat.y, plat.w, drawH);
    ctx.restore();
    return;
  }
  const thick = drawH >= 34;
  const sliceH = thick ? img.naturalHeight : Math.max(8, Math.round(img.naturalHeight * 0.34));
  const scale = thick ? (fit ? drawH / img.naturalHeight : 1) : drawH / sliceH;
  const tw = img.naturalWidth * scale;
  const th = sliceH * scale;
  const left = state.cam.x - tw;
  const right = state.cam.x + viewW + tw;
  const start = plat.x + Math.floor((Math.max(plat.x, left) - plat.x) / tw) * tw;
  for (let x = start; x < Math.min(plat.x + plat.w, right); x += tw) {
    ctx.drawImage(
      img,
      0, 0, img.naturalWidth, sliceH,
      Math.round(x), Math.round(plat.y), Math.round(tw), Math.round(th),
    );
  }
  if (thick && !fit && th + 1 < drawH) {
    const fillLeft = Math.max(plat.x, left);
    const fillW = Math.min(plat.x + plat.w, right) - fillLeft;
    if (fillW > 0) {
      ctx.drawImage(
        img,
        0, img.naturalHeight - 5, img.naturalWidth, 5,
        fillLeft, plat.y + th - 1, fillW, drawH - th + 2,
      );
    }
  }
  ctx.restore();
}

function washPlate(plat, drawH, color, alpha, mode) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(plat.x, plat.y, plat.w, drawH);
  ctx.clip();
  ctx.globalCompositeOperation = mode || 'source-over';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(plat.x, plat.y, plat.w, drawH);
  ctx.restore();
}

function drawIcePlate(plat, drawH) {
  drawGroundTile(plat, sceneImg('ground/stone.png'), drawH, true);
  washPlate(plat, drawH, '#e7f6ff', 0.5);
  ctx.fillStyle = '#f7fbff';
  ctx.fillRect(plat.x, plat.y, plat.w, Math.min(6, drawH));
  if (drawH < 30) return;
  const img = sceneImg('snowy-mountains/snowy-mountains-4.png');
  if (!artReady(img)) return;
  const h = 18;
  const w = img.naturalWidth * (h / img.naturalHeight);
  const step = w + 28;
  const left = state.cam.x - 10;
  const right = state.cam.x + viewW + 10;
  const start = Math.max(0, Math.floor((left - plat.x) / step));
  const end = Math.ceil((Math.min(plat.x + plat.w, right) - plat.x) / step);
  for (let i = start; i <= end; i += 1) {
    const x = plat.x + i * step;
    if (x > plat.x + plat.w - 8) continue;
    blitArt(img, x, plat.y - 6, w, h);
  }
}

function drawLavaLip(plat) {
  const h = 11;
  const step = 42;
  const left = state.cam.x - 8;
  const right = state.cam.x + viewW + 8;
  const start = Math.max(0, Math.floor((left - plat.x) / step));
  const end = Math.ceil((Math.min(plat.x + plat.w, right) - plat.x) / step);
  for (let i = start; i <= end; i += 1) {
    const img = sceneImg(LAVA_LIP[i % LAVA_LIP.length]);
    if (!artReady(img)) continue;
    const w = img.naturalWidth * (h / img.naturalHeight);
    const x = plat.x + i * step;
    if (x > plat.x + plat.w) continue;
    blitArt(img, x, plat.y - 4, w, h);
  }
}

function drawLavaCracks(plat, drawH) {
  if (drawH < 48) return;
  const img = sceneImg(LAVA_CRACK[Math.abs(Math.round(plat.x / 20)) % LAVA_CRACK.length]);
  if (!artReady(img)) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(plat.x, plat.y, plat.w, drawH);
  ctx.clip();
  const h = Math.min(40, drawH - 6);
  const w = img.naturalWidth * (h / img.naturalHeight);
  blitArt(img, plat.x + Math.min(plat.w * 0.35, Math.max(4, plat.w - w - 4)), plat.y + 8, w, h);
  ctx.restore();
}

function drawCeilingVines(plat) {
  const count = 2 + (Math.abs(Math.round(plat.x / 30)) % 2);
  for (let i = 0; i < count; i += 1) {
    const img = sceneImg(HANG_VINES[(i + Math.round(plat.x)) % HANG_VINES.length]);
    if (!artReady(img)) continue;
    const h = 10 + ((i * 5) % 6);
    const w = img.naturalWidth * (h / img.naturalHeight);
    const span = Math.max(24, plat.w - 16);
    const x = plat.x + 8 + ((i * 53 + Math.round(plat.x / 5)) % span);
    blitArt(img, x, plat.y + plat.h - 2, w, h);
  }
}

function drawLowRoof(plat) {
  const biome = zoneTheme().biome;
  const skin = {
    grass: ['#2a2118', '#4a3828', '#c46a32'],
    mountain: ['#1c242e', '#3a4654', '#b7c3d0'],
    jungle: ['#142010', '#2c4020', '#8aaa44'],
    tundra: ['#1a3040', '#3a5870', '#d7f1ff'],
    volcano: ['#1a0e0c', '#3a1814', '#ff6a2a'],
  }[biome] || ['#2a2118', '#4a3828', '#c46a32'];
  const [, beam, mark] = skin;
  const lip = plat.y + plat.h;
  const tile = biome === 'grass' || biome === 'jungle'
    ? sceneImg('ground/grass.png')
    : sceneImg('ground/stone.png');
  drawGroundTile(plat, tile, plat.h, true);
  const wash = {
    grass: '#2a2016',
    mountain: '#243040',
    jungle: '#0c180c',
    tundra: '#163044',
    volcano: '#280e0c',
  }[biome] || '#2a2016';
  washPlate(plat, plat.h, wash, 0.62, 'multiply');
  ctx.fillStyle = beam;
  ctx.fillRect(plat.x, Math.min(plat.y, state.cam.y - 24), 3, lip - Math.min(plat.y, state.cam.y - 24));
  ctx.fillRect(plat.x + plat.w - 3, Math.min(plat.y, state.cam.y - 24), 3, lip - Math.min(plat.y, state.cam.y - 24));
  ctx.fillStyle = mark;
  ctx.fillRect(plat.x + 3, lip - 3, plat.w - 6, 3);
  const span = plat.w - 16;
  const ticks = Math.max(3, Math.floor(span / 28));
  const step = span / ticks;
  for (let i = 0; i < ticks; i += 1) {
    const x = plat.x + 8 + i * step;
    const drop = 4 + ((i + Math.round(plat.x / 9)) % 3);
    ctx.beginPath();
    ctx.moveTo(x, lip - 1);
    ctx.lineTo(x + 4, lip - 1);
    ctx.lineTo(x + 2, lip + drop);
    ctx.fill();
  }
  if (biome === 'jungle') drawCeilingVines(plat);
}

function drawGlideDeck(plat) {
  const skin = {
    grass: ['#8a5a32', '#e6c48a', '#4a2c16'],
    mountain: ['#6a7080', '#d5dbe6', '#2c313c'],
    jungle: ['#3f6a34', '#b7e08a', '#1c3018'],
    tundra: ['#7ea6c8', '#f4fbff', '#243e58'],
    volcano: ['#3a2018', '#ff8a3c', '#140c0a'],
  }[zoneTheme().biome] || ['#8a5a32', '#e6c48a', '#4a2c16'];
  const [body, lip, edge] = skin;
  const keel = 8;
  ctx.fillStyle = body;
  ctx.fillRect(plat.x, plat.y, plat.w, plat.h + keel);
  ctx.fillStyle = lip;
  ctx.fillRect(plat.x + 4, plat.y, plat.w - 8, 3);
  ctx.fillStyle = edge;
  ctx.fillRect(plat.x, plat.y, 4, plat.h + keel);
  ctx.fillRect(plat.x + plat.w - 4, plat.y, 4, plat.h + keel);
  ctx.fillRect(plat.x + 12, plat.y + plat.h, 3, keel);
  ctx.fillRect(plat.x + plat.w - 15, plat.y + plat.h, 3, keel);
}

function drawZonePlatform(plat) {
  if (plat.kind === 'glide') {
    drawGlideDeck(plat);
    return;
  }
  if (plat.kind === 'ceil') {
    drawLowRoof(plat);
    return;
  }
  const biome = zoneTheme().biome;
  const drawH = Math.min(plat.h, 96);
  if (biome === 'grass') drawGroundTile(plat, sceneImg('ground/grass.png'), drawH);
  else if (biome === 'mountain') drawGroundTile(plat, sceneImg('ground/stone.png'), drawH);
  else if (biome === 'tundra') drawIcePlate(plat, drawH);
  else if (biome === 'volcano') {
    drawGroundTile(plat, sceneImg('ground/stone.png'), drawH, true);
    washPlate(plat, drawH, '#3d1c14', 1, 'multiply');
    drawLavaLip(plat);
    drawLavaCracks(plat, drawH);
  } else {
    drawGroundTile(plat, sceneImg('ground/grass.png'), drawH);
    washPlate(plat, drawH, '#3a6a32', 1, 'multiply');
  }
}

function draw() {
  const cam = state.cam;
  const shakeX = state.shake > 0 ? (Math.random() - 0.5) * 4 : 0;
  const shakeY = state.shake > 0 ? (Math.random() - 0.5) * 3 : 0;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, viewW, viewH);
  const theme = zoneTheme();
  const sky = ctx.createLinearGradient(0, 0, 0, viewH);
  sky.addColorStop(0, theme.sky0);
  sky.addColorStop(1, theme.sky1);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, viewH);
  drawBackdrop(shakeX, shakeY);

  ctx.save();
  ctx.translate(Math.round(-cam.x + shakeX), Math.round(-cam.y + shakeY));

  ctx.globalAlpha = 0.18;
  ctx.font = '700 28px Courier New';
  ctx.fillStyle = theme.ink;
  for (const spot of state.level.words) ctx.fillText(theme.word, spot[0], spot[1]);
  ctx.globalAlpha = 1;

  drawFloorProps();

  for (const plat of state.level.platforms) drawZonePlatform(plat);
  drawPuddles();

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
    const meta = itemMeta(item.id);
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
      if ((enemy.windup > 0 || enemy.follow) && enemy.tell) {
        const dir = enemy.dir || -1;
        const ink = (enemy.loaded && enemy.loaded.color)
          || (enemy.follow && enemy.follow.move && enemy.follow.move.color)
          || (odd ? '#ff9a3c' : '#9aefff');
        ctx.fillStyle = ink;
        const n = enemy.tell;
        for (let i = 0; i < n; i += 1) {
          const py = gy - ((n - 1) * 6) + i * 12;
          ctx.fillRect(gx + dir * 28, py, 14, 3);
        }
      }
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
      const ball = shot.friendly ? images['assets/orami/fireball.png'] : null;
      if (ball && ball.complete && ball.naturalWidth) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(ball, Math.round(shot.x), Math.round(shot.y), shot.w, shot.h);
      } else {
        ctx.fillStyle = '#ff3b00';
        ctx.beginPath();
        ctx.arc(shot.x + 5, shot.y + 5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd15a';
        ctx.beginPath();
        ctx.arc(shot.x + 4, shot.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (shot.acid) {
      const r = Math.max(5, Math.round((shot.w || 10) * 0.55));
      ctx.fillStyle = '#d6ff6a';
      ctx.beginPath();
      ctx.arc(shot.x + shot.w / 2, shot.y + shot.h / 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3d8a14';
      ctx.beginPath();
      ctx.arc(shot.x + shot.w / 2 - 1, shot.y + shot.h / 2 - 1, Math.max(2, r - 3), 0, Math.PI * 2);
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

function imgBox(img) {
  return {
    w: img.naturalWidth || img.width || 0,
    h: img.naturalHeight || img.height || 0,
  };
}

function blitSlice(img, destH, srcX, srcY, srcW, srcH, dx, dy) {
  const box = img ? imgBox(img) : { w: 0, h: 0 };
  if (!img || img.complete === false || box.w <= 0 || srcW <= 0 || srcH <= 0) return;
  const scale = destH / box.h;
  const dw = srcW * scale;
  const dh = srcH * scale;
  const localBottom = -((box.h - (srcY + srcH)) * scale) + (dy || 0);
  const localLeft = -(box.w * scale) / 2 + srcX * scale + (dx || 0);
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

function drawBareBody(img, destH) {
  const box = imgBox(img);
  if (!box.w || !box.h) return;
  const dw = box.w * (destH / box.h);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, Math.round(-dw / 2), Math.round(-destH), Math.round(dw), Math.round(destH));
}

function pilotNoArm(img) {
  if (!img || img.complete === false || !img.naturalWidth) return img;
  if (img._noArm) return img._noArm;
  const copy = document.createElement('canvas');
  copy.width = img.naturalWidth;
  copy.height = img.naturalHeight;
  const g = copy.getContext('2d');
  g.drawImage(img, 0, 0);
  try {
    const data = g.getImageData(0, 0, copy.width, copy.height);
    const px = data.data;
    for (let y = 18; y <= 28; y += 1) {
      for (let x = 21; x <= 25; x += 1) {
        const i = (y * copy.width + x) * 4;
        const r = px[i];
        const gc = px[i + 1];
        const b = px[i + 2];
        if (px[i + 3] < 20) continue;
        if (r > 150 && r > gc + 20 && r > b + 20) px[i + 3] = 0;
      }
    }
    g.putImageData(data, 0, 0);
  } catch (err) {
    return img;
  }
  img._noArm = copy;
  return copy;
}

function drawBareWalk(img, destH, swing) {
  blitSlice(img, destH, 0, 0, imgBox(img).w, 33, 0, 0);
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

function drawArm(x, y, fromY = -28) {
  const sx = 4;
  const sy = fromY;
  const mx = sx + (x - sx) * 0.5;
  const my = sy + (y - sy) * 0.45 - 2;
  const bones = [[sx, sy, mx, my, '#ba8462'], [mx, my, x, y, '#e8ba92']];
  bones.forEach(([x0, y0, x1, y1, color]) => {
    ctx.fillStyle = color;
    const steps = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      ctx.fillRect(Math.round(x0 + (x1 - x0) * t) - 1, Math.round(y0 + (y1 - y0) * t) - 1, 3, 3);
    }
  });
  ctx.fillStyle = '#e8ba92';
  ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 4, 4);
}

function bareWeaponHand(rot, fromY) {
  const reach = 16;
  let x = 6 + Math.cos(rot) * reach;
  let y = fromY + Math.sin(rot) * reach;
  const player = state?.player;
  if (player && player.attackT <= 0 && player.onGround && Math.abs(player.vx) > 12) {
    const step = Math.sin((player.gait || 0) * Math.PI * 2);
    x += step * 5;
    y -= Math.abs(step) * 3;
  }
  return { x, y };
}

function bareWalkHand(lift) {
  const player = state.player;
  if (!player.onGround) return { x: 14, y: -22 + lift };
  if (Math.abs(player.vx) > 12) {
    const step = Math.sin((player.gait || 0) * Math.PI * 2);
    return { x: 11 + step * 7, y: -17 + lift - Math.abs(step) * 4 };
  }
  return { x: 11, y: -16 + lift };
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
  if (suitHand) return suitHand;
  const player = state.player;
  if (!player.onGround) return KIT_JUMP_HAND;
  if (Math.abs(player.vx) > 12) return KIT_WALK_HAND[kitStepFrame()];
  return KIT_IDLE_HAND;
}

function suitClip() {
  const player = state.player;
  if (!player.onGround) return { name: 'jump', hands: SUIT_JUMP_HAND, ping: false };
  if (Math.abs(player.vx) > 12) {
    if (player.crouch) return { name: 'walk', hands: SUIT_WALK_HAND, ping: true };
    return { name: 'run', hands: SUIT_RUN_HAND, ping: true };
  }
  return { name: 'idle', hands: SUIT_IDLE_HAND, ping: false };
}

function suitIndex(clip) {
  const n = clip.hands.length;
  if (n <= 1) return 0;
  const phase = ((state.player.gait % 1) + 1) % 1;
  if (!clip.ping) return Math.floor(phase * n) % n;
  const span = n * 2 - 2;
  let i = Math.floor(phase * span) % span;
  if (i >= n) i = span - i;
  return i;
}

const KIT_NECK = 30;
const BARE_HEAD = { x: 53, y: 15, w: 64, h: 66, kitH: 24 };

function drawBareHeadOnSuit(scale, neckY) {
  const img = images['assets/hemigo/bare-idle.png'];
  if (!img || !img.complete || !img.naturalWidth) return;
  const hh = BARE_HEAD.kitH * scale;
  const hw = BARE_HEAD.w * (BARE_HEAD.kitH / BARE_HEAD.h) * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    BARE_HEAD.x,
    BARE_HEAD.y,
    BARE_HEAD.w,
    BARE_HEAD.h,
    Math.round(-hw / 2),
    Math.round(neckY - hh + 3 * scale),
    Math.round(hw),
    Math.round(hh),
  );
}

function drawArmorKit() {
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
  if (state.armor.helm) {
    ctx.drawImage(img, sx, 0, sw, sh, Math.round(-dw / 2), Math.round(-dh), Math.round(dw), Math.round(dh));
    return true;
  }
  const bodyH = sh - KIT_NECK;
  const bodyDh = bodyH * scale;
  ctx.drawImage(
    img,
    sx,
    KIT_NECK,
    sw,
    bodyH,
    Math.round(-dw / 2),
    Math.round(-bodyDh),
    Math.round(dw),
    Math.round(bodyDh),
  );
  drawBareHeadOnSuit(scale, -bodyDh);
  openCollar = true;
  return true;
}

function drawBareSheet() {
  const clip = suitClip();
  const img = images[`assets/hemigo/bare-${clip.name}.png`];
  if (!img || !img.complete || !img.naturalWidth) return false;
  const frame = suitIndex(clip);
  const scale = SUIT_DRAW_H / SUIT_CELL_H;
  const dw = SUIT_CELL_W * scale;
  const dh = SUIT_CELL_H * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    frame * SUIT_CELL_W,
    0,
    SUIT_CELL_W,
    SUIT_CELL_H,
    Math.round(-dw / 2),
    Math.round(-dh),
    Math.round(dw),
    Math.round(dh),
  );
  const grip = clip.hands[frame];
  suitHand = {
    x: (grip.x - SUIT_CELL_W / 2) * scale,
    y: (grip.y - SUIT_CELL_H) * scale,
  };
  return true;
}

function oramiClip() {
  const player = state.player;
  if (player.downT > 0) return { name: 'down', n: 3, play: 'once', t: 1 - player.downT / 0.62 };
  if (player.iframes > 0.5 && player.attackT <= 0) {
    return { name: 'hurt', n: 3, play: 'once', t: 1 - (player.iframes - 0.5) / 0.4 };
  }
  if (player.attackT > 0 && (player.attackKind === 'slash' || player.attackKind === 'bolt')) {
    const n = player.attackKind === 'bolt' ? 4 : 3;
    return { name: player.attackKind, n, play: 'once', t: 1 - player.attackT / (player.attackDur || 0.3) };
  }
  if (!player.onGround) {
    // Up: leap, high kick, clean glide. Down: fire dive, fire jet, then the landing kick.
    let frame = 4;
    if (player.vy < -330) frame = 0;
    else if (player.vy < -160) frame = 1;
    else if (player.vy < 10) frame = 2;
    else if (player.vy < 214) frame = 3;
    return { name: 'jump', n: 6, play: 'frame', frame };
  }
  if (player.landT > 0) return { name: 'jump', n: 6, play: 'frame', frame: 5 };
  if (Math.abs(player.vx) > 12) {
    if (!player.crouch && (player.runHold || 0) >= ORAMI_RUN_TIME) {
      return { name: 'run', n: 6, play: 'loop', rate: 0.9 };
    }
    return { name: 'walk', n: 8, play: 'loop', rate: 1 };
  }
  return { name: 'idle', n: 2, play: 'idle' };
}

function oramiFrame(clip) {
  const n = clip.n;
  if (clip.play === 'frame') return clip.frame;
  if (clip.play === 'once') {
    const t = Math.max(0, Math.min(0.999, clip.t || 0));
    return Math.min(n - 1, Math.floor(t * n));
  }
  if (clip.play === 'idle') return Math.floor(state.time * 1.4) % 10 === 0 ? 1 : 0;
  const rate = clip.rate || 1;
  const phase = (((state.player.gait * rate) % 1) + 1) % 1;
  if (clip.play === 'loop') return Math.floor(phase * n) % n;
  const span = n * 2 - 2;
  let i = Math.floor(phase * span) % span;
  if (i >= n) i = span - i;
  return i;
}

function drawOramiBody() {
  const clip = oramiClip();
  const img = images[`assets/orami/${clip.name}.png`];
  if (!img || !img.complete || !img.naturalWidth) return;
  const frame = oramiFrame(clip);
  const scale = ORAMI_DRAW_H / ORAMI_CELL_H;
  const ax = clip.name === 'run' ? ORAMI_RUN_X : clip.name === 'down' ? ORAMI_DOWN_X : ORAMI_BODY_X;
  const ay = ORAMI_FEET_Y;
  ctx.imageSmoothingEnabled = false;
  if (clip.name === 'jump' && (frame === 3 || frame === 4)) drawKickTrail(frame);
  ctx.drawImage(
    img,
    frame * ORAMI_CELL_W,
    0,
    ORAMI_CELL_W,
    ORAMI_CELL_H,
    Math.round(-ax * scale),
    Math.round(-ay * scale),
    Math.round(ORAMI_CELL_W * scale),
    Math.round(ORAMI_CELL_H * scale),
  );
  drawOramiFx(clip, frame);
}

// Hot core on the rear sole. The tail points back and drops, under the boot.
function drawKickTrail(frame) {
  const beam = frame === 4;
  const img = images[beam ? 'assets/orami/fx/flame-beam.png' : 'assets/orami/fx/flame-2.png'];
  if (!img || !img.complete || !img.naturalWidth) return;
  const height = beam ? 13 : 16;
  const maxW = beam ? 72 : 50;
  const rot = beam ? 0.28 : 0.42;
  const footX = beam ? -21 : -30.2;
  const footY = beam ? 0.2 : 1.6;
  const brightX = beam ? 93 / 300 : 135 / 199;
  const brightY = beam ? 36 / 70 : 52 / 101;
  let h = height;
  let w = img.naturalWidth * (height / img.naturalHeight);
  if (w > maxW) {
    w = maxW;
    h = img.naturalHeight * (maxW / img.naturalWidth);
  }
  ctx.save();
  ctx.translate(footX, footY);
  ctx.rotate(rot);
  if (beam) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    img,
    Math.round(-brightX * w),
    Math.round(-brightY * h),
    Math.round(w),
    Math.round(h),
  );
  ctx.restore();
}

function drawOramiFx(clip, frame) {
  const fx = (name) => images[`assets/orami/fx/${name}.png`];
  const flick = Math.floor(state.time * 14) % 2;
  if (clip.name === 'run') blit(fx(flick ? 'flame-2' : 'flame-1'), -18, 2, 18, 26);
  if (clip.name === 'jump' && frame === 5) blit(fx('flame-8'), 0, 16, 30, 58);
  if (clip.name === 'slash' && frame >= 1) {
    if (frame >= 2) blit(fx('flame-1'), 30, -46, 34, 44, -0.55);
    else blit(fx('flame-1'), 26, -6, 28, 38);
  }
  if (clip.name === 'bolt') {
    if (frame === 1) blit(fx('flame-3'), 20, -28, 8, 10);
    else if (frame === 2) blit(fx('flame-3'), 26, -25, 14, 16);
    else if (frame === 3) blit(fx('flame-beam'), 52, -26, 13, 72);
  }
  if (clip.name === 'hurt' || clip.name === 'down') {
    const stars = ['star-1', 'star-3', 'star-5'];
    blit(fx(stars[Math.floor(state.time * 8) % 3]), 8, -64, 12, 14);
    blit(fx('star-3'), -10, -72, 9, 11);
  }
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
  // The bare sheet already dips with the stride. The armor suit keeps its small step bob.
  const bob = suited && stepping ? -Math.abs(Math.sin((player.gait || 0) * Math.PI * 2)) * 1.5 : 0;
  suitHand = null;
  openCollar = false;
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(bottom + bob));
  if (face < 0) ctx.scale(-1, 1);
  if (player.crouch) ctx.scale(1, 0.62);
  let kitOn = false;
  let sheetOn = false;
  if (orami) drawOramiBody();
  else if (suited) kitOn = drawArmorKit();
  else sheetOn = drawBareSheet();
  const posed = kitOn || sheetOn;
  const lift = suited && !kitOn ? -8 : 0;
  if (state.inv.spark) blit(images['assets/blue/16.png'], orami ? -22 : kitOn ? -20 : sheetOn ? -14 : suited ? -22 : -16, (orami ? -44 : kitOn ? -40 : sheetOn ? -36 : -24) + lift, 26, 12);
  if (!orami && !kitOn && suited) {
    const body = images[chest.side];
    if (stepping && body?.complete) drawSuitedWalk(body, 56, swing);
    else blit(body, 0, 2, 56, 78);
    if (helm?.worn) blit(images[helm.worn], 6, -40, 26, 30);
    else blit(images['assets/worn/pilot-head.png'], 4, -46, 16, 16);
  } else if (!orami && !kitOn && !sheetOn) {
    const raw = images[hero.body];
    const hideArm = kind === 'sword' || kind === 'axe' || kind === 'gun' || attacking;
    const body = hideArm ? pilotNoArm(raw) : raw;
    const ready = body && body.complete !== false && imgBox(body).w;
    if (stepping && ready) drawBareWalk(body, 46, swing);
    else if (ready) drawBareBody(body, 46);
    if (helm?.worn) blit(images[helm.worn], 5, -32, 24, 28);
  }
  if (state.inv.filament) blit(images['assets/gold/22.png'], -3, -16 + lift, 5, 14, Math.PI / 2);
  if (state.inv.eye) blit(images['assets/blue/17.png'], sheetOn ? 8 : 6, openCollar ? -50 : kitOn || suited ? -58 : sheetOn ? -50 : -36, 8, 8);
  let shieldX = orami ? -20 : kitOn ? -18 : sheetOn ? -16 : suited ? -24 : -16;
  let shieldY = orami ? -32 : kitOn ? -28 : sheetOn ? -28 : -20;
  if (orami) {
    const riding = oramiClip();
    if (riding.name === 'jump' && (riding.frame === 3 || riding.frame === 4)) {
      shieldX = -16;
      shieldY = -2;
    }
  }
  if (state.inv.shield && !shielding()) blit(images['assets/weapons/shield.png'], shieldX, shieldY + lift, 22, 16);

  const air = !player.onGround;
  const bare = !posed && !suited && !orami;
  let hand = posed
    ? kitHandPoint()
    : orami
      ? { x: 12, y: air ? -24 : -20 }
      : suited
        ? { x: 16, y: (air ? -24 : -18) + lift }
        : bareWalkHand(lift);

  if (!orami && kind === 'sword') {
    let rot = posed ? 0.32 : 0.55;
    if (attacking) {
      if (p < 0.1) rot = 0.4 - (p / 0.1) * 1.5;
      else rot = -1.1 + Math.pow(Math.min(1, (p - 0.1) / 0.72), 0.38) * 2.7;
    }
    if (bare) hand = bareWeaponHand(rot, -28);
    if (bare) drawArm(hand.x, hand.y, -28);
    blitGrip(images['assets/gold/18.png'], hand.x, hand.y, posed || orami ? 30 : 26, 12, rot, posed ? 0.82 : 0.78);
    if (attacking) drawSlash('sword', p, hand.x, hand.y);
  } else if (!orami && kind === 'axe') {
    let rot = -0.28;
    if (attacking) {
      if (p < 0.12) rot = -0.3 - (p / 0.12) * 1.7;
      else rot = -2.0 + Math.pow(Math.min(1, (p - 0.12) / 0.7), 0.42) * 2.6;
    }
    if (bare) hand = bareWeaponHand(rot, -24);
    if (bare) drawArm(hand.x, hand.y, -24);
    blitHaft(images['assets/weapons/axe.png'], hand.x, hand.y, posed || orami ? 36 : 32, rot);
    if (attacking) drawSlash('axe', p, hand.x, hand.y);
  } else if (!orami && kind === 'gun') {
    const kick = attacking ? -3 : 0;
    const grip = { x: hand.x + kick, y: hand.y };
    const len = posed || orami ? 44 : 38;
    if (bare) drawArm(grip.x + 8, grip.y);
    blitRifle(images['assets/weapons/rifle.png'], grip.x, grip.y, len);
    if (attacking) {
      ctx.fillStyle = '#f4fbff';
      ctx.fillRect(grip.x + len - 4, grip.y - 2, 8, 3);
      ctx.fillStyle = 'rgba(126, 231, 255, 0.85)';
      ctx.fillRect(grip.x + len + 3, grip.y - 1, 6, 2);
    }
  } else if (!orami && attacking) {
    if (bare) drawArm(hand.x + Math.sin(p * Math.PI) * 6, hand.y);
    drawSlash('fist', p, hand.x, hand.y);
  }
  if (shielding()) {
    blit(images['assets/weapons/shield.png'], orami ? 22 : suited ? 22 : 16, (orami ? -18 : -10) + lift, 34, 26);
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
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key) || event.code === 'Space' || key === 'control') {
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
    if (key === '1') equipOwned(playingOrami() ? 'slash' : 'sword');
    if (key === '2') equipOwned(playingOrami() ? 'bolt' : 'axe');
    if (key === '3' && !playingOrami()) equipOwned('gun');
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
  pullBoard();
  setInterval(pullBoard, 20000);
  fit();
  requestAnimationFrame(frame);
  window.addEventListener('relay-wallet', () => {
    paintBest();
    if (state && (state.mode === 'play' || state.mode === 'win')) noteWalletBest(state.score);
  });

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
  if (qs.get('sim') === 'kit') runKitTest();
  if (qs.get('sim') === 'crouch') runCrouchTest();
  if (qs.get('sim') === 'score') runScoreTest();
  if (qs.get('sim') === 'acid') runAcidTest();
  if (qs.get('sim') === 'maps') runMapTest();
  if (qs.get('sim') === 'arm') runArmTest();
  if (qs.get('shot') === 'crouch') {
    startGame(qs.get('zone') || 'hemi');
    keys.add('control');
    state.player.onGround = true;
    state.player.vy = 0;
    state.player.y = G - STAND_H;
    for (let i = 0; i < 8; i += 1) update(1 / 60);
    draw();
  }
}

function runCrouchTest() {
  startGame('hemi');
  const player = state.player;
  player.iframes = 99;
  player.x = 80;
  player.y = G - STAND_H;
  player.vy = 0;
  player.onGround = true;
  const feet = G;
  keys.add('control');
  update(1 / 60);
  const ducked = player.crouch && player.h === CROUCH_H && Math.abs(player.y + player.h - feet) < 1.5;
  const slow = runSpeed() < state.hero.speed * 0.5;
  keys.delete('control');
  keys.add('arrowdown');
  update(1 / 60);
  const down = player.h === CROUCH_H;
  keys.delete('arrowdown');
  keys.add('s');
  update(1 / 60);
  const ess = player.h === CROUCH_H;
  keys.delete('s');
  input.stickY = 0.8;
  update(1 / 60);
  const stick = player.h === CROUCH_H;
  input.stickY = 0;
  update(1 / 60);
  const stood = player.h === STAND_H && !player.crouch && Math.abs(player.y + player.h - feet) < 1.5;

  keys.add('control');
  update(1 / 60);
  const crouchedTop = player.y;
  state.level.platforms.push({
    id: 'low',
    x: player.x - 40,
    y: crouchedTop - (STAND_H - CROUCH_H) + 2,
    w: 140,
    h: STAND_H - CROUCH_H - 4,
    oneWay: false,
  });
  keys.delete('control');
  update(1 / 60);
  const locked = player.h === CROUCH_H && !solids().some((solid) => aabb(player, solid));
  state.level.platforms = state.level.platforms.filter((plat) => plat.id !== 'low');
  keys.delete('control');
  state.jumpBuffer = 0;
  update(1 / 60);
  const released = player.h === STAND_H;

  keys.add('control');
  player.onGround = true;
  player.vy = 0;
  update(1 / 60);
  input.jumpQueued = true;
  update(1 / 60);
  const hopped = player.h === STAND_H && player.vy < 0;
  keys.delete('control');
  state.jumpBuffer = 0;
  player.vy = 0;
  player.onGround = true;
  player.y = G - STAND_H;
  player.h = STAND_H;
  update(1 / 60);

  keys.add('control');
  player.onGround = true;
  player.vy = 0;
  update(1 / 60);
  state.level.checks[0] = player.x - 4;
  state.nextCheck = 0;
  update(1 / 60);
  const marked = Math.abs(state.checkpoint.y - (G - STAND_H)) < 1.5;
  keys.delete('control');

  player.iframes = 0;
  player.hp = 5;
  keys.add('control');
  player.onGround = true;
  player.vy = 0;
  player.y = G - CROUCH_H;
  player.h = CROUCH_H;
  update(1 / 60);
  const over = player.y;
  state.shots = [{ x: player.x + 2, y: over - 8, w: 12, h: 4, vx: 0, vy: 0, life: 2, friendly: false }];
  update(1 / 60);
  const missed = player.hp === 5;
  state.shots = [{ x: player.x + 2, y: player.y + 2, w: 12, h: 6, vx: 0, vy: 0, life: 2, friendly: false }];
  update(1 / 60);
  const hit = player.hp === 4;
  keys.delete('control');

  const ok = ducked && slow && down && ess && stick && stood && locked && released && hopped && marked && missed && hit;
  state.crouchReport = {
    ducked, slow, down, ess, stick, stood, locked, released, hopped, marked, missed, hit,
  };
  finishSim(ok ? 'crouch-ok' : 'crouch-fail');
  el.sim.textContent = JSON.stringify({ status: ok ? 'crouch-ok' : 'crouch-fail', ...state.crouchReport });
}

function runScoreTest() {
  const addr = '0x1111111111111111111111111111111111111111';
  const other = '0x2222222222222222222222222222222222222222';
  localStorage.removeItem(SCORE_KEY);
  localStorage.removeItem(BEST_KEY);
  window.relayWallet = { address: addr, chainId: RELAY_CHAIN_ID };
  paintBest();
  const emptyLine = el.best.textContent;
  startGame('hemi');
  const player = state.player;
  addScore(800, player.x, player.y);
  const banked = walletBest(addr);
  player.hp = 1;
  player.iframes = 0;
  hurt(player.x + 80);
  const afterDeath = state.score;
  const kept = walletBest(addr);
  const popped = state.pops.some((pop) => pop.text === '-500');
  const toastText = el.toast.textContent || '';
  const atCheckpoint = player.hp === state.maxHp
    && Math.abs(player.x - state.checkpoint.x) < 1
    && Math.abs(player.y - state.checkpoint.y) < 1;
  for (const enemy of state.level.enemies) enemy.hp = 0;
  state.shots = [];
  const beforeFall = state.score;
  player.y = 1200;
  player.vy = 0;
  update(1 / 60);
  const afterFall = state.score;
  window.relayWallet = { address: addr, chainId: 1 };
  noteWalletBest(5000);
  const wrongChain = walletBest(addr);
  state.score = 900;
  window.relayWallet = { address: addr, chainId: RELAY_CHAIN_ID };
  window.dispatchEvent(new CustomEvent('relay-wallet'));
  const fromEvent = walletBest(addr);
  player.hp = 1;
  player.iframes = 0;
  hurt(player.x + 80);
  const secondDeath = state.score;
  const stillHigh = walletBest(addr);
  window.relayWallet = { address: other, chainId: RELAY_CHAIN_ID };
  noteWalletBest(1200);
  const otherBest = walletBest(other);
  const firstStill = walletBest(addr);
  window.relayWallet = { address: addr, chainId: RELAY_CHAIN_ID };
  noteWalletBest(-40);
  noteWalletBest(0);
  const notNegative = walletBest(addr);
  paintBest();
  const mineRow = el.best.querySelector('.is-mine')?.textContent || '';
  const boardText = el.best.textContent || '';
  const mineShown = mineRow.includes(shortAddr(addr)) && mineRow.includes('900');
  const otherShown = boardText.includes(shortAddr(other)) && boardText.indexOf('1200') < boardText.indexOf('900');
  window.relayWallet = { address: null, chainId: null };
  noteBest(250);
  paintBest();
  const anonLine = el.best.textContent;
  const anon = bestScore();
  const checks = {
    emptyLine: emptyLine === `No score yet · ${shortAddr(addr)}`,
    mineShown,
    otherShown,
    banked: banked === 800,
    afterDeath: afterDeath === 300,
    kept: kept === 800,
    popped,
    toast: toastText.includes('-500'),
    atCheckpoint,
    fall: afterFall === beforeFall,
    wrongChain: wrongChain === 800,
    fromEvent: fromEvent === 900,
    secondDeath: secondDeath === 400,
    stillHigh: stillHigh === 900,
    otherBest: otherBest === 1200,
    firstStill: firstStill === 900,
    anon: anon === 250,
    anonLine: anonLine.includes('Best clear 250')
      && anonLine.indexOf(shortAddr(other)) < anonLine.indexOf(shortAddr(addr)),
    notNegative: notNegative === 900 && walletBest(addr) === 900,
  };
  const ok = Object.values(checks).every(Boolean);
  state.scoreReport = checks;
  finishSim(ok ? 'score-ok' : 'score-bad');
  el.sim.textContent = JSON.stringify({ status: ok ? 'score-ok' : 'score-bad', ...checks, score: state.score });
}

function dropAcid(x, y) {
  state.shots = [{
    x,
    y,
    w: 7,
    h: 7,
    vx: 0,
    vy: 20,
    life: 3,
    color: '#b6ff3a',
    acid: true,
    friendly: false,
  }];
}

function quietStage() {
  state.player.iframes = 99;
  state.player.x = 80;
  state.player.y = G - STAND_H;
  for (const enemy of state.level.enemies) enemy.hp = 0;
  state.shots = [];
}

function runAcidTest() {
  startGame('cart');
  quietStage();
  dropAcid(220, G - 70);
  let landed = null;
  for (let i = 0; i < 120 && !landed; i += 1) {
    update(1 / 60);
    landed = state.puddles[0] || null;
  }
  const onFloor = !!landed && Math.abs(landed.y + landed.h - G) < 4 && landed.life > 2.5;
  landed.life = 0.35;
  dropAcid(landed.x + 10, G - 36);
  let refreshed = false;
  for (let i = 0; i < 90; i += 1) {
    update(1 / 60);
    if (state.puddles.length === 1 && state.puddles[0].life > 2.4) {
      refreshed = true;
      break;
    }
  }
  const player = state.player;
  player.iframes = 0;
  player.hp = 5;
  player.x = state.puddles[0].x;
  player.y = G - STAND_H;
  player.vy = 0;
  update(1 / 60);
  const burned = player.hp === 4;
  player.x = 40;
  player.iframes = 99;
  for (let i = 0; i < 200; i += 1) update(1 / 60);
  const gone = state.puddles.length === 0;

  const clean = (zone) => {
    startGame(zone);
    quietStage();
    dropAcid(220, G - 70);
    for (let i = 0; i < 150; i += 1) update(1 / 60);
    return state.puddles.length === 0;
  };
  const riseClean = clean('hemi');
  const spanClean = clean('wart');

  startGame('crown');
  quietStage();
  dropAcid(220, G - 70);
  let crown = false;
  for (let i = 0; i < 120; i += 1) {
    update(1 / 60);
    if (state.puddles.length) {
      crown = true;
      break;
    }
  }
  const checks = { onFloor, refreshed, burned, gone, riseClean, spanClean, crown };
  const ok = Object.values(checks).every(Boolean);
  finishSim(ok ? 'acid-ok' : 'acid-bad');
  el.sim.textContent = JSON.stringify({ status: ok ? 'acid-ok' : 'acid-bad', ...checks });
}

function routeJumps(level) {
  const plats = level.platforms
    .filter((plat) => plat.oneWay && !plat.slide && !/^h\d+$/.test(plat.id))
    .sort((a, b) => a.x - b.x);
  const jumps = [];
  for (let i = 1; i < plats.length; i += 1) {
    const prev = plats[i - 1];
    const gap = plats[i].x - (prev.x + prev.w);
    const rise = prev.y - plats[i].y;
    if (gap > 8 || rise > 16) jumps.push({ gap: Math.max(0, Math.round(gap)), rise: Math.round(rise) });
  }
  return jumps;
}

function crouchSlotOk(level) {
  return level.platforms.some((ceil) => {
    if (ceil.kind !== 'ceil') return false;
    const bottom = ceil.y + ceil.h;
    return bottom > G - STAND_H && bottom < G - CROUCH_H;
  });
}

function crouchLeads(level) {
  const floors = level.platforms
    .filter((plat) => plat.oneWay && !plat.slide && !/^h\d+$/.test(plat.id))
    .sort((a, b) => a.x - b.x);
  return level.platforms.filter((ceil) => ceil.kind === 'ceil').every((ceil) => {
    let x = ceil.x + ceil.w;
    let clear = 0;
    for (const floor of floors) {
      if (floor.x + floor.w < x - 2) continue;
      if (floor.y !== G) break;
      if (floor.x > x + 8) break;
      clear += floor.x + floor.w - Math.max(x, floor.x);
      x = floor.x + floor.w;
      if (clear >= 180) return true;
    }
    return clear >= 180;
  });
}

function fightsClear(level) {
  const roofs = level.platforms.filter((plat) => plat.kind === 'ceil');
  return level.enemies.every((enemy) => roofs.every((roof) => {
    const minX = enemy.minX ?? enemy.x;
    const maxX = enemy.maxX ?? (enemy.x + (enemy.w || 0));
    return maxX < roof.x - 24 || minX > roof.x + roof.w + 24;
  }));
}

function ferryReaches(level) {
  const lips = level.platforms.filter((plat) => plat.oneWay && !plat.slide);
  return level.platforms.filter((plat) => plat.slide).every((plat) => {
    const minX = plat.homeX - plat.slide;
    const maxR = plat.homeX + plat.slide + plat.w;
    const meets = (lip, side) => {
      const overlap = side === 'left'
        ? lip.x + lip.w > minX + 8 && lip.x < plat.homeX
        : lip.x < maxR - 8 && lip.x + lip.w > plat.homeX + plat.w;
      return overlap && Math.abs(lip.y - plat.y) <= 74;
    };
    return lips.some((lip) => meets(lip, 'left')) && lips.some((lip) => meets(lip, 'right'));
  });
}

function runMapTest() {
  const levels = [1, 2, 3, 4, 5].map((tier) => buildStage(tier));
  const jumps = levels.map(routeJumps);
  const exits = levels.map((level) => level.exit.x);
  const shafts = levels.map((level) => level.platforms.filter((plat) => /^h\d+$/.test(plat.id)).length);
  const porch = levels.every((level) => level.platforms.some((plat) => plat.id === 'a' && plat.x === 0 && plat.w >= 380 && plat.y === G));
  const riseSteps = levels[0].platforms.filter((plat) => /^h\d+$/.test(plat.id)).sort((a, b) => b.y - a.y);
  const riseHop = riseSteps.length === 2 && G - riseSteps[0].y === 52 && riseSteps[0].y - riseSteps[1].y === 52;
  const t1 = jumps[0].every((jump) => jump.gap < 48 && jump.rise <= 0)
    && !levels[0].platforms.some((plat) => plat.slide || plat.kind === 'ceil')
    && !levels[0].items.some((item) => item.id === 'spark');
  const t2 = jumps[1].some((jump) => jump.rise >= 28 && jump.rise < 70)
    && !levels[1].platforms.some((plat) => plat.slide || plat.kind === 'ceil')
    && levels[1].items.some((item) => item.id === 'spark');
  const t3 = crouchSlotOk(levels[2]) && crouchLeads(levels[2]) && fightsClear(levels[2])
    && !levels[2].platforms.some((plat) => plat.slide);
  const t4gaps = jumps[3].some((jump) => jump.gap >= 110);
  const t4 = levels[3].platforms.filter((plat) => plat.slide).length >= 2 && t4gaps
    && crouchSlotOk(levels[3]) && crouchLeads(levels[3]) && fightsClear(levels[3]) && ferryReaches(levels[3]);
  const crownStep = levels[4].platforms.some((plat) => plat.id === 'crown-step' && G - plat.y >= SHAFT);
  const t5 = crownStep && crouchSlotOk(levels[4]) && crouchLeads(levels[4]) && fightsClear(levels[4])
    && ferryReaches(levels[4])
    && levels[4].platforms.filter((plat) => plat.slide).length >= 2;
  const longer = exits.every((x, index) => index === 0 || x > exits[index - 1]);
  const shaftCount = shafts.join() === '2,3,4,5,6';
  const flyers = levels.map((level) => level.enemies.filter((enemy) => enemy.kind === 'flyer'));
  const armed = flyers[2].length === 2 && flyers[2].every((enemy) => !enemy.shoot)
    && flyers[3].length === 2 && flyers[3].every((enemy) => enemy.shoot)
    && flyers[4].length === 3 && flyers[4].every((enemy) => enemy.shoot);
  const different = jumps.map((list) => list.map((jump) => `${jump.gap}:${jump.rise}`).join('|'))
    .every((sig, index, all) => all.indexOf(sig) === index);
  const checks = { porch, riseHop, t1, t2, t3, t4, t5, longer, shaftCount, armed, different };
  const ok = Object.values(checks).every(Boolean);
  const report = { status: ok ? 'maps-ok' : 'maps-bad', ...checks, exits, jumps };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

function runArmTest() {
  startGame('hemi');
  state.player.onGround = true;
  state.player.vx = 0;
  state.player.attackT = 0;
  const idle = bareWeaponHand(0.55, -28);
  state.player.attackT = 0.12;
  state.player.attackDur = 0.24;
  const midP = 1 - state.player.attackT / state.player.attackDur;
  const midRot = -1.1 + Math.pow(Math.min(1, (midP - 0.1) / 0.72), 0.38) * 2.7;
  const mid = bareWeaponHand(midRot, -28);
  state.player.attackT = 0;
  state.player.vx = 90;
  state.player.gait = 0.25;
  const walk = bareWeaponHand(0.55, -28);
  const axeIdle = bareWeaponHand(-0.28, -24);
  state.player.attackT = 0.16;
  state.player.attackDur = 0.34;
  const axeP = 1 - state.player.attackT / state.player.attackDur;
  const axeRot = -2.0 + Math.pow(Math.min(1, (axeP - 0.12) / 0.7), 0.42) * 2.6;
  const axeMid = bareWeaponHand(axeRot, -24);
  const swung = Math.hypot(mid.x - idle.x, mid.y - idle.y) > 6;
  const walked = Math.hypot(walk.x - idle.x, walk.y - idle.y) > 2;
  const chopped = Math.hypot(axeMid.x - axeIdle.x, axeMid.y - axeIdle.y) > 6;
  const checks = { swung, walked, chopped, idle, mid, walk };
  const ok = swung && walked && chopped;
  finishSim(ok ? 'arm-ok' : 'arm-bad');
  el.sim.textContent = JSON.stringify({ status: ok ? 'arm-ok' : 'arm-bad', ...checks });
}

function runKitTest() {
  localStorage.removeItem(WEAR_KEY);
  localStorage.removeItem(GEAR_KEY);
  startGame('hemi');
  const shield = state.level.items.find((item) => item.id === 'shield');
  const blade = state.level.items.find((item) => item.id === 'blade');
  state.player.iframes = 99;
  state.player.y = G - 40;
  state.player.x = shield.x - 6;
  update(1 / 60);
  state.player.x = blade.x - 6;
  update(1 / 60);
  const took = !!state.inv.shield && !!state.inv.blade && state.weapon === 'sword' && shield.got && blade.got;
  startGame('gale');
  const galeBlade = state.level.items.find((item) => item.id === 'blade');
  const galeShield = state.level.items.find((item) => item.id === 'shield');
  const kept = state.zone === 'gale'
    && state.inv.shield && state.inv.blade && state.weapon === 'sword'
    && galeBlade?.got && galeShield?.got;
  startGame('hemi');
  const lib = state.level.enemies.find((enemy) => enemy.kind === 'librarian');
  state.player.x = lib.x - 90;
  state.player.y = G - 30;
  state.player.iframes = 99;
  lib.shotCd = 0;
  state.shots = [];
  update(1 / 60);
  const acid = state.shots.find((shot) => shot.acid);
  const boss = state.level.enemies.find((enemy) => enemy.kind === 'boss');
  const gateX = state.level.gate.x;
  state.player.x = gateX - 50;
  state.player.y = G - 30;
  boss.cooldown = 0;
  boss.hp = boss.max;
  state.sealOpen = false;
  state.shots = [];
  const homeX = boss.x;
  const pace = boss.baseSpeed;
  boss.baseSpeed = 0;
  boss.speed = 0;
  for (let i = 0; i < 40; i += 1) update(1 / 60);
  const early = state.shots.filter((shot) => !shot.friendly && !shot.acid).length;
  const stillBehind = boss.x > gateX;
  boss.baseSpeed = pace;
  boss.x = homeX;
  boss.hp = Math.max(1, Math.floor(boss.max * 0.4));
  state.player.x = gateX - 200;
  for (let i = 0; i < 50; i += 1) update(1 / 60);
  const chased = boss.x < homeX - 10 && boss.x < gateX + 80;
  const report = {
    status: took && kept && acid && early >= 1 && stillBehind && chased ? 'pass' : 'fail',
    took,
    kept,
    acid: !!acid,
    early,
    stillBehind,
    chased,
    bossX: Math.round(boss.x),
    homeX: Math.round(homeX),
    gateX: Math.round(gateX),
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
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

function armorOn(tier) {
  return buildStage(tier).items
    .filter((item) => ARMOR.some((piece) => piece.id === item.id))
    .map((item) => item.id)
    .sort()
    .join();
}

function runWearTest() {
  const layout = armorOn(1) === ''
    && armorOn(2) === 'blueplate,goldplate'
    && armorOn(3) === ''
    && armorOn(4) === 'goldhelm'
    && armorOn(5) === 'bluehelm';
  localStorage.removeItem(WEAR_KEY);
  localStorage.removeItem(GEAR_KEY);
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
    && gold?.got
    && !blueHelm && !bluePlate && !goldPlate;
  setBag(true);
  toggleArmor('goldhelm');
  const bare = state.armor.helm;
  startGame('crown');
  const crownHelm = state.level.items.find((item) => item.id === 'bluehelm');
  const dropped = state.zone === 'crown'
    && state.armor.helm == null
    && state.armor.chest === 'blueplate'
    && crownHelm && !crownHelm.got;
  const report = {
    status: layout && kept && bare == null && dropped ? 'pass' : 'fail',
    layout,
    kept,
    bare,
    dropped,
    armor: state.armor,
  };
  document.body.dataset.status = report.status;
  el.sim.hidden = false;
  el.sim.textContent = JSON.stringify(report);
}

function hitsFeet(shot) {
  const top = G - 30;
  return shot.y < G && shot.y + shot.h > top;
}

function bossPhrase(zone, parity) {
  startGame(zone);
  const boss = state.level.enemies.find((enemy) => enemy.kind === 'boss');
  boss.parity = parity;
  boss.phrase = 0;
  boss.cooldown = 0;
  boss.windup = 0;
  boss.follow = null;
  boss.loaded = null;
  boss.tell = 0;
  boss.baseSpeed = 0;
  boss.chaseSpeed = 0;
  boss.speed = 0;
  boss.hopV = 0;
  boss.hopCd = 99;
  boss.hopEvery = 99;
  state.player.x = state.level.gate.x - 48;
  state.player.y = G - 30;
  state.player.vx = 0;
  state.player.hp = 5;
  state.player.iframes = 99;
  state.shots = [];
  const notes = [];
  const seen = new Set();
  for (let i = 0; i < 60 * 9 && notes.length < 4; i += 1) {
    update(1 / 60);
    for (const shot of state.shots) {
      if (shot.friendly || seen.has(shot)) continue;
      seen.add(shot);
      notes.push({
        move: shot.bossMove,
        y: shot.y,
        h: shot.h,
        t: Math.round(state.time * 100) / 100,
        feet: hitsFeet(shot),
      });
    }
  }
  return notes;
}

function phraseOk(notes, light, heavy) {
  if (notes.length < 4) return false;
  const moves = notes.slice(0, 4).map((note) => note.move).join();
  if (moves !== [light, heavy, heavy, light].join()) return false;
  const inner = notes[2].t - notes[1].t;
  const into = notes[1].t - notes[0].t;
  const after = notes[3].t - notes[2].t;
  const highThenLow = notes[1].y < notes[2].y - 8;
  const lowThenHigh = notes[1].y > notes[2].y + 8;
  const orderOk = heavy === 'fork' ? highThenLow : lowThenHigh;
  const dodgeOk = notes[0].feet
    && (heavy === 'fork' ? !notes[1].feet && notes[2].feet : notes[1].feet && !notes[2].feet);
  return notes[0].t > 0.2
    && inner > 0.32
    && inner < 0.7
    && into > inner + 0.4
    && after > into + 0.15
    && orderOk
    && dodgeOk;
}

function runGaleTest() {
  const rise = bossPhrase('hemi', 'even');
  const crown = bossPhrase('crown', 'even');
  const hex = bossPhrase('hemi', 'odd');
  const shaped = phraseOk(rise, 'line', 'pair') && phraseOk(crown, 'line', 'pair') && phraseOk(hex, 'jab', 'fork');
  const quicker = rise.length >= 4 && crown.length >= 4
    && (crown[1].t - crown[0].t) < (rise[1].t - rise[0].t) - 0.08;
  const flyersOf = (tier) => buildStage(tier).enemies.filter((enemy) => enemy.kind === 'flyer');
  const early = flyersOf(3);
  const galeFlyers = flyersOf(4);
  const crownFlyers = flyersOf(5);
  const armed = early.length === 2 && early.every((enemy) => !enemy.shoot)
    && galeFlyers.length === 2 && galeFlyers.every((enemy) => enemy.shoot)
    && crownFlyers.length === 3 && crownFlyers.every((enemy) => enemy.shoot);
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
    status: shaped && quicker
      && armed && slantCopy && slantCopy.vx !== 0 && slantCopy.vy > 0 && moved && longer
      && shafts.join() === '2,3,4,5,6' && oneHop
      ? 'pass' : 'fail',
    shaped,
    quicker,
    rise,
    crown,
    hex,
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
  const layout = armorOn(1) === ''
    && armorOn(2) === 'blueplate,goldplate'
    && armorOn(3) === ''
    && armorOn(4) === 'goldhelm'
    && armorOn(5) === 'bluehelm';
  localStorage.removeItem(WEAR_KEY);
  localStorage.removeItem(GEAR_KEY);
  startGame('hemi');
  const bareRise = !state.level.items.some((item) => ARMOR.some((piece) => piece.id === item.id));
  startGame('wart');
  const plate = state.level.items.find((item) => item.id === 'goldplate');
  state.player.x = plate.x - 8;
  state.player.y = G - 40;
  state.player.iframes = 2;
  update(1 / 60);
  const pickedChest = !!state.inv.goldplate && state.armor.chest === 'goldplate';
  const noHelmOnSpan = !state.level.items.some((item) => item.id === 'goldhelm' || item.id === 'bluehelm');
  startGame('gale');
  state.inv.goldhelm = true;
  state.inv.bluehelm = true;
  setBag(true);
  const x0 = state.player.x;
  const t0 = state.time;
  update(1);
  const paused = state.mode === 'bag' && state.player.x === x0 && state.time === t0;
  toggleArmor('bluehelm');
  const swapped = state.armor.helm;
  if (swapped) toggleArmor(swapped);
  const cleared = state.armor.helm;
  toggleArmor('goldhelm');
  state.player.iframes = 0;
  renderBag();
  state.simDone = true;
  draw();
  const report = {
    status: layout && bareRise && pickedChest && noHelmOnSpan && paused
      && state.armor.helm === 'goldhelm' && cleared == null && swapped === 'bluehelm' ? 'pass' : 'fail',
    layout,
    bareRise,
    pickedChest,
    noHelmOnSpan,
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
  const steps = state.level.platforms.filter((plat) => /^h\d+$/.test(plat.id)).sort((a, b) => b.y - a.y);
  const gaps = [];
  let footY = G;
  for (const step of steps) {
    gaps.push(footY - step.y);
    footY = step.y;
  }
  const noSpark = !state.level.items.some((item) => item.id === 'spark');
  const singleSteps = gaps.length === 2 && gaps.every((gap) => gap < HEMIGO.single - 8);
  input.right = false;
  input.left = false;
  input.attackQueued = false;
  state.inv.spark = false;
  state.player.iframes = 999;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.x = steps[0].x + 180;
  state.player.y = G - 30;
  state.player.onGround = true;
  let climbed = false;
  for (let i = 0; i < 360 && !climbed; i += 1) {
    input.jumpRelease = false;
    if (state.player.onGround && ledgeAbove(HEMIGO.single + 2)) input.jumpQueued = true;
    update(1 / 60);
    if (state.player.y + state.player.h <= steps[steps.length - 1].y + 2) climbed = true;
  }
  const relay = state.level.relay;
  state.player.x = relay.x - 8;
  state.player.y = relay.y - 30;
  state.player.onGround = true;
  state.inv.spark = false;
  state.powered = false;
  state.sealOpen = false;
  tryUse();
  const riseOpen = state.powered && state.sealOpen;
  localStorage.removeItem(GEAR_KEY);
  startGame('wart');
  const spanSpark = state.level.items.some((item) => item.id === 'spark');
  const spanRelay = state.level.relay;
  state.player.x = spanRelay.x - 8;
  state.player.y = spanRelay.y - 30;
  state.player.onGround = true;
  state.inv.spark = false;
  tryUse();
  const spanDark = !state.powered;
  state.inv.spark = true;
  tryUse();
  const spanLit = state.powered && state.sealOpen;
  const report = {
    status: bareHp === plate.max && bladedHp <= 0 && noSpark && singleSteps && climbed
      && riseOpen && spanSpark && spanDark && spanLit ? 'pass' : 'fail',
    bareHp,
    bladedHp,
    noSpark,
    singleSteps,
    gaps,
    climbed,
    riseOpen,
    spanSpark,
    spanDark,
    spanLit,
    y: Math.round(state.player.y),
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
