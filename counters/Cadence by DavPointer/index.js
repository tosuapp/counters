// pp counter overlay for tosu - entry point.
// Connects straight to the v2 websocket, applies the counter settings coming
// from the dashboard and draws the normalized state built in js/state.js.
import {
  deepMerge,
  normalize,
  formatNumber,
  detectPause,
  isVisible,
  ppDropped,
  glideValue,
  showsSelectedMapPp,
} from './js/state.js';

// fallback values, used only until the dashboard sends this counter's settings.json
const DEFAULTS = {
  // what it shows
  showLivePp: true,
  showMiss: true,
  show50: true,
  showHits: true,
  show300: false,
  showProgress: true,
  decimals: 0,
  // type and colors
  fontName: 'Segoe UI',
  fontSize: 34,
  textColor: '#ffffff',
  labelColor: '#b9b9b9',
  useGlow: true,
  glowColor: '#7ad7ff',
  useHitColors: true,
  hit300Color: '#66d9ff',
  hit100Color: '#7dffa8',
  hit50Color: '#ffd166',
  missColor: '#ff4d6d',
  progressColor: '#7ad7ff',
  progressTrack: '#ffffff',
  // card
  useCard: true,
  cardColor: '#0a0e16',
  cardOpacity: 72,
  cardRadius: 14,
  // slide
  slideFromLeft: false,
  slideDuration: 700,
  smoothPp: true,
  ppSmoothMs: 260,
  // feedback
  ppLossAlert: true,
  fcIndicator: true,
  // visibility and scale
  ingameOnly: true,
  hideInPause: false,
  showOnResults: false,
  scale: 1,
};

/** How long the map clock may stand still before a running play counts as paused. */
const PAUSE_IDLE_MS = 1200;

const settings = { ...DEFAULTS };

let snapshot = {};
let socket = null;
let retryDelay = 1000;
let reconnectTimer = null;
let lastPp = null; // the live pp seen on the previous frame, for the pp loss flash
let pauseState = null; // the map clock seen on the previous frame
let lastBeatmap = 0;
let ppShown = null; // the pp on screen right now, which can sit between two values
let ppDecimals = 0; // the decimals that value is written with
let ppGlide = null; // the glide in flight: { from, to, start, ms }
let ppFrame = 0; // its requestAnimationFrame handle
const alertTimers = {};
const lastPulse = {}; // when each pulse fired last, so it cannot be restarted non stop
const drawn = {}; // what is already on screen, so the same value is never written twice
let renderQueued = false; // a render is already waiting for the next frame
let wasPreview = false; // whether the previous frame was the song select readout

const el = (id) => document.getElementById(id);
const els = {
  liveWrap: el('liveWrap'),
  ppLive: el('ppLive'),
  subRow: el('subRow'),
  hitMiss: el('hitMiss'),
  hit50: el('hit50'),
  hit100: el('hit100'),
  hit300: el('hit300'),
  vMiss: el('vMiss'),
  v50: el('v50'),
  v100: el('v100'),
  v300: el('v300'),
  barRow: el('barRow'),
  barFill: el('barFill'),
};

/** Path of this counter inside tosu's static folder (injected by the dashboard). */
function counterPath() {
  return window.COUNTER_PATH || location.pathname;
}

function socketUrl() {
  return `ws://${location.host}/websocket/v2?l=${encodeURI(counterPath())}`;
}

// Only the branches normalize() reads: tosu sends a filtered snapshot instead of the full v2
// payload, which is several tens of kilobytes every poll. The filter format is the nested
// { field, keys } one tosu's applyFilter walks; a plain string picks a whole top-level branch.
const FILTERS = [
  'state',
  {
    field: 'beatmap',
    keys: ['id', { field: 'time', keys: ['live', 'lastObject', 'mp3Length'] }],
  },
  {
    field: 'play',
    keys: [
      { field: 'pp', keys: ['current'] },
      { field: 'hits', keys: ['300', '100', '50', '0', 'sliderBreaks'] },
    ],
  },
  { field: 'resultsScreen', keys: [{ field: 'pp', keys: ['current'] }] },
  { field: 'performance', keys: [{ field: 'accuracy', keys: ['100'] }] },
];

function connect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  let next;
  try {
    next = new WebSocket(socketUrl());
  } catch (err) {
    scheduleReconnect();
    return;
  }
  socket = next;

  next.addEventListener('open', () => {
    retryDelay = 1000;
    // ask for just the fields the counter draws, then for the saved values of settings.json
    try {
      next.send(`applyFilters:${JSON.stringify(FILTERS)}`);
      next.send(`getSettings:${encodeURI(counterPath())}`);
    } catch (err) {
      /* the settings are optional: DEFAULTS are good enough */
    }
  });

  next.addEventListener('message', (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data);
    } catch (err) {
      return;
    }
    if (payload && typeof payload === 'object' && 'command' in payload) {
      handleCommand(payload);
      return;
    }
    deepMerge(snapshot, payload); // partial updates: keep what was already known
    scheduleRender();
  });

  next.addEventListener('close', () => {
    if (socket === next) scheduleReconnect();
  });
  next.addEventListener('error', () => {
    try {
      next.close();
    } catch (err) {
      /* close() will trigger the reconnect */
    }
  });
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, 10000); // 1s, 2s, 4s ... max 10s
}

function handleCommand(message) {
  const command = String(message.command || '').toLowerCase();
  if (command.includes('settings')) applySettings(message.message);
}

/** The dashboard answers with the settings.json entries carrying their saved value. */
function applySettings(raw) {
  if (!raw) return;

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const key = item.uniqueID ?? item.uniqueId ?? item.id ?? item.key ?? item.name;
      if (key && 'value' in item) settings[key] = item.value;
    }
  } else if (typeof raw === 'object') {
    for (const [key, value] of Object.entries(raw)) {
      settings[key] = value && typeof value === 'object' && 'value' in value ? value.value : value;
    }
  }

  applyStyle();
  scheduleRender();
}

/** Turn "#rgb" / "#rrggbb" into an rgba() string; anything else falls back to the neon blue. */
function withAlpha(color, alpha) {
  const hex = String(color || '').trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return `rgba(122, 215, 255, ${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Relative luminance (WCAG) of a "#rgb" / "#rrggbb" colour; it picks the ink on the hit chips.
 * The 0.179 cut is the point where dark ink becomes more readable than white ink, so a chip
 * that is merely bright - a red like #ff4d6d - is written in the dark ink as well.
 */
function isLight(color) {
  const hex = String(color || '').trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return false;
  const channel = (i) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance > 0.179;
}

/**
 * Write a text only when it differs from the one already on screen: assigning the same string again
 * still replaces the text node and invalidates the layout, and with 60 messages a second most of
 * them carry nothing new.
 */
function paintText(node, key, value) {
  if (drawn[key] === value) return;
  drawn[key] = value;
  node.textContent = value;
}

/** Write the pp that is on screen, never the target: the number is the only thing that glides. */
function writePp() {
  paintText(els.ppLive, 'pp', formatNumber(ppShown, ppDecimals));
}

/** Drop a glide in flight, so the next one starts from wherever the number has got to. */
function stopPpGlide() {
  ppGlide = null;
  if (ppFrame) {
    cancelAnimationFrame(ppFrame);
    ppFrame = 0;
  }
}

/** One frame of the glide: the number approaches the new value and lands exactly on it. */
function ppStep() {
  ppFrame = 0;
  if (!ppGlide) return;
  const t = Math.min(1, (Date.now() - ppGlide.start) / ppGlide.ms);
  ppShown = glideValue(ppGlide.from, ppGlide.to, t);
  if (t >= 1) {
    ppShown = ppGlide.to;
    ppGlide = null;
  }
  writePp();
  if (ppGlide) ppFrame = requestAnimationFrame(ppStep);
}

/** Move the pp number to a new value: straight there when the glide is off, smoothly otherwise. */
function setPp(target, decimals) {
  ppDecimals = decimals;
  const wanted = settings.smoothPp === true ? Number(settings.ppSmoothMs) : 0;
  const ms = Math.min(2000, Math.max(0, Number.isFinite(wanted) ? wanted : DEFAULTS.ppSmoothMs));
  if (ppShown === null || ms === 0) {
    stopPpGlide();
    ppShown = target;
    writePp();
    return;
  }
  if (ppGlide ? ppGlide.to === target : ppShown === target) return;
  stopPpGlide();
  ppGlide = { from: ppShown, to: target, start: Date.now(), ms };
  ppFrame = requestAnimationFrame(ppStep);
}

/** Play a short animation on the card: the class comes off again when the animation is over. */
function pulse(name, ms, cooldown = 0) {
  const cls = `alert-${name}`;
  const root = document.documentElement;
  const now = Date.now();
  // while the animation is running, and for `cooldown` after it, a new pulse would only restart it
  // from its first frame: the value would sit on the alert colour for as long as it keeps moving.
  // Without this guard a falling pp can leave the number red for the rest of the map.
  if (root.classList.contains(cls) || now - (lastPulse[name] || 0) < cooldown) return;
  root.classList.remove(cls);
  void root.offsetWidth; // restart the animation even when it is still running
  root.classList.add(cls);
  lastPulse[name] = now;
  clearTimeout(alertTimers[name]);
  alertTimers[name] = setTimeout(() => root.classList.remove(cls), ms);
}

/** Settings that change the look are pushed into CSS custom properties. */
function applyStyle() {
  const root = document.documentElement.style;

  // these are the saved settings, pushed into CSS custom properties: the scale multiplies every
  // size and stays pure presentation, so it is never written back into the saved values
  const s = settings;
  const scale = Math.min(3, Math.max(0.4, Number(settings.scale) || 1));

  const text = s.textColor || DEFAULTS.textColor;
  const glow = s.useGlow ? s.glowColor || DEFAULTS.glowColor : null;
  const size = (Number(s.fontSize) || DEFAULTS.fontSize) * scale;

  root.setProperty('--font-size', `${Math.round(size * 100) / 100}px`);
  root.setProperty('--font-family', `${s.fontName || DEFAULTS.fontName}, "Segoe UI", sans-serif`);
  root.setProperty('--text-color', text);
  root.setProperty('--label-color', s.labelColor || DEFAULTS.labelColor);

  // the glow is optional: with no colour the shadows collapse to nothing
  root.setProperty('--glow-soft', glow ? withAlpha(glow, 0.42) : 'rgba(0, 0, 0, 0)');

  // every hit count is a value on its own softened rectangle: the switch picks between the
  // hit colours and a neutral chip, and the ink is chosen so that the number stays readable
  const hits = Boolean(s.useHitColors);
  const neutral = 'rgba(255, 255, 255, 0.14)';
  const chip = (color, fallback) => (hits ? color || fallback : neutral);
  const miss = chip(s.missColor, DEFAULTS.missColor);
  const h50 = chip(s.hit50Color, DEFAULTS.hit50Color);
  const h100 = chip(s.hit100Color, DEFAULTS.hit100Color);
  const h300 = chip(s.hit300Color, DEFAULTS.hit300Color);
  const ink = (bg) => (!hits ? text : isLight(bg) ? '#0a0e16' : '#ffffff');

  root.setProperty('--miss-color', miss);
  root.setProperty('--hit50-color', h50);
  root.setProperty('--hit100-color', h100);
  root.setProperty('--hit300-color', h300);
  root.setProperty('--miss-ink', ink(miss));
  root.setProperty('--hit50-ink', ink(h50));
  root.setProperty('--hit100-ink', ink(h100));
  root.setProperty('--hit300-ink', ink(h300));

  // the pulses follow the theme: the border turns to the miss colour, the FC ring is the 300 colour
  root.setProperty('--alert-color', s.missColor || DEFAULTS.missColor);
  root.setProperty('--fc-ok', s.hit300Color || DEFAULTS.hit300Color);
  root.setProperty('--fc-bad', s.missColor || DEFAULTS.missColor);

  // the card, its padding and the soft sheen inside it; transparent colours switch it off
  const card = Boolean(s.useCard);
  const cardTint = s.cardColor || DEFAULTS.cardColor;

  // accept the opacity either as 0-1 or as a 0-100 percentage
  let opacity = Number(s.cardOpacity);
  if (!Number.isFinite(opacity)) opacity = DEFAULTS.cardOpacity;
  if (opacity > 1) opacity /= 100;
  opacity = Math.min(1, Math.max(0, opacity));

  root.setProperty('--card-radius', `${Math.round((Number(s.cardRadius) || DEFAULTS.cardRadius) * scale)}px`);
  root.setProperty('--card-top', card ? withAlpha(cardTint, Math.min(1, opacity + 0.14)) : 'rgba(0, 0, 0, 0)');
  root.setProperty('--card-bottom', card ? withAlpha(cardTint, opacity) : 'rgba(0, 0, 0, 0)');
  root.setProperty('--card-tint', card ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0)');
  root.setProperty('--card-border', card ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0)');
  root.setProperty('--card-shadow', card ? 'inset 0 1px 0 rgba(255, 255, 255, 0.06)' : 'none');
  root.setProperty('--card-pad-y', card ? `${Math.round(size * 0.42)}px` : '0px');
  root.setProperty('--card-pad-x', card ? `${Math.round(size * 0.55)}px` : '0px');

  // the progress bar under the chips: the track is the same colour at low alpha, so any pair works
  root.setProperty('--bar-color', s.progressColor || DEFAULTS.progressColor);
  root.setProperty('--bar-track', withAlpha(s.progressTrack || DEFAULTS.progressTrack, 0.16));

  // the counter waits a whole viewport away on the side it comes in from, so it always travels in
  // from the outside and leaves the same way; the side is a class on <html>
  const slide = Math.min(3000, Math.max(150, Number(s.slideDuration) || DEFAULTS.slideDuration));
  root.setProperty('--slide-duration', `${Math.round(slide)}ms`);
  document.documentElement.classList.toggle('from-left', s.slideFromLeft === true);
  document.documentElement.classList.toggle('hide-pause', s.hideInPause === true);
  // the border effects (the FC readout and the border pulses) only make sense with a card
  document.documentElement.classList.toggle('with-card', card);
}

/**
 * tosu can push more than one update inside a single frame: the counter draws once per frame instead
 * of once per message, so the work never grows past what the screen can show anyway.
 */
function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    render();
  });
}

function render() {
  const v = normalize(snapshot);
  const decimals = settings.decimals;
  const root = document.documentElement;

  // the song select with the counter left on screen: the card becomes that map's own readout - the
  // pp it is worth at 100% accuracy with the mods that are on - and carries no hits nor bar, because
  // a run that has not started has nothing to report
  const preview = showsSelectedMapPp(v, settings);
  if (wasPreview && !preview) {
    // the pp of the map is not the pp of the run: leaving the song select it must not glide into it
    stopPpGlide();
    ppShown = null;
  }
  wasPreview = preview;

  // a new map starts clean: the pulses must not fire on the numbers of the previous one
  if (v.beatmapId !== lastBeatmap) {
    lastBeatmap = v.beatmapId;
    lastPp = null;
    pauseState = null;
    // a new map starts from its own number: the pp of the old one must not glide into it
    stopPpGlide();
    ppShown = null;
  }

  // on the results screen the finished play is worth showing, so its final pp wins
  const shownPp = preview ? v.selectPp : v.results && v.resultPp > 0 ? v.resultPp : v.ppLive;
  if (preview) {
    // a map that is not being played is a value, not a run: it lands on the number straight away
    stopPpGlide();
    ppShown = shownPp;
    ppDecimals = decimals;
    writePp();
  } else {
    setPp(shownPp, decimals);
  }
  paintText(els.vMiss, 'miss', v.misses);
  paintText(els.v50, 'hit50', v.hit50);
  paintText(els.v100, 'hit100', v.hit100);
  paintText(els.v300, 'hit300', v.hit300);

  // in the song select the card is the map's pp and nothing else: the chips and the bar step aside
  // in the same switch that turns them off, so nothing is ever written twice
  els.liveWrap.classList.toggle('off', !settings.showLivePp);
  els.hitMiss.classList.toggle('off', preview || !settings.showMiss);
  els.hit50.classList.toggle('off', preview || !settings.show50);
  els.hit100.classList.toggle('off', preview || !settings.showHits);
  els.hit300.classList.toggle('off', preview || !settings.show300);
  els.subRow.classList.toggle('off', preview || !(settings.showMiss || settings.show50 || settings.showHits || settings.show300));

  // the bar under the chips: a width in per cent, so its rounded ends stay round at any length
  els.barRow.classList.toggle('off', preview || !settings.showProgress);
  const barWidth = `${(v.progress * 100).toFixed(2)}%`;
  if (drawn.bar !== barWidth) {
    drawn.bar = barWidth;
    els.barFill.style.width = barWidth;
  }

  // reactive feedback: a falling live pp flashes the number, never while a map is loading
  if (lastPp !== null && v.playing && settings.ppLossAlert === true && ppDropped(lastPp, v.ppLive)) {
    pulse('pp', 900, 1500);
  }
  lastPp = v.ppLive;

  // a running play is paused when its clock stands still, and the FC readout is the border
  const pause = detectPause(pauseState, v.liveTime, v.playing, Date.now(), PAUSE_IDLE_MS);
  pauseState = pause.next;
  const onMap = v.playing && v.hasBeatmap;
  const fc = settings.fcIndicator === true;
  // a slider break breaks the FC just like a miss does, even though it is not a miss
  const fcBroken = v.misses > 0 || v.sliderBreaks > 0;
  root.classList.toggle('paused', pause.paused);
  root.classList.toggle('fc-alive', fc && onMap && !fcBroken);
  root.classList.toggle('fc-lost', fc && onMap && fcBroken);

  // menus, pause and the results screen are decided independently
  root.classList.toggle('idle', !isVisible(v, settings, pause.paused));
}

// the counter waits off to the side for the very first frames, so its entrance animation
// plays even when the page is opened in the middle of a map
document.documentElement.classList.add('boot');
applyStyle();
render();
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('boot')));
connect();
