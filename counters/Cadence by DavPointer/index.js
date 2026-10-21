// Cadence entry point: connects to tosu's v2 websocket, applies dashboard settings and renders
// the state normalized in js/state.js.
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

// Fallbacks used until the dashboard sends the saved settings.json values.
const DEFAULTS = {
  showLivePp: true,
  showMiss: true,
  show50: true,
  showHits: true,
  show300: false,
  showProgress: true,
  decimals: 0,
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
  useCard: true,
  cardColor: '#0a0e16',
  cardOpacity: 72,
  cardRadius: 14,
  slideFromLeft: false,
  slideDuration: 700,
  smoothPp: true,
  ppSmoothMs: 260,
  ppLossAlert: true,
  fcIndicator: true,
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
let lastPp = null; // previous live pp, for the loss flash
let pauseState = null; // previous clock sample, for pause detection
let lastBeatmap = 0;
let ppShown = null; // value on screen, possibly mid-glide
let ppDecimals = 0;
let ppGlide = null; // active glide: { from, to, start, ms }
let ppFrame = 0; // glide requestAnimationFrame handle
const alertTimers = {};
const lastPulse = {}; // last pulse per name, for the cooldown
const drawn = {}; // values already on screen, to skip redundant DOM writes
let renderQueued = false;
let wasPreview = false; // previous frame used the selected-map preview

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

// Only the branches read by normalize(): the full v2 payload is large. The nested { field, keys }
// shape is what tosu's applyFilter walks; a plain string selects a whole top-level branch.
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
    // Request only the fields the counter draws, then the saved settings values.
    try {
      next.send(`applyFilters:${JSON.stringify(FILTERS)}`);
      next.send(`getSettings:${encodeURI(counterPath())}`);
    } catch (err) {
      // Settings are optional; DEFAULTS are already applied.
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
    deepMerge(snapshot, payload); // Merge partial updates into the known snapshot.
    scheduleRender();
  });

  next.addEventListener('close', () => {
    if (socket === next) scheduleReconnect();
  });
  next.addEventListener('error', () => {
    try {
      next.close();
    } catch (err) {
      // The close event schedules the reconnect.
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

/** Turn "#rgb" / "#rrggbb" into rgba(); invalid input falls back to the neon blue. */
function withAlpha(color, alpha) {
  const hex = String(color || '').trim().replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return `rgba(122, 215, 255, ${alpha})`;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** WCAG luminance; 0.179 is where dark ink becomes more readable than white ink. */
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

/** Write text only when it changed: assigning the same string still replaces the text node. */
function paintText(node, key, value) {
  if (drawn[key] === value) return;
  drawn[key] = value;
  node.textContent = value;
}

/** Write the pp that is on screen, never the target: the number is the only thing that glides. */
function writePp() {
  paintText(els.ppLive, 'pp', formatNumber(ppShown, ppDecimals));
}

function stopPpGlide() {
  ppGlide = null;
  if (ppFrame) {
    cancelAnimationFrame(ppFrame);
    ppFrame = 0;
  }
}

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

function pulse(name, ms, cooldown = 0) {
  const cls = `alert-${name}`;
  const root = document.documentElement;
  const now = Date.now();
  // Without this guard a continuously falling pp would restart the animation and stay red.
  if (root.classList.contains(cls) || now - (lastPulse[name] || 0) < cooldown) return;
  root.classList.remove(cls);
  void root.offsetWidth; // restart the animation even when it is still running
  root.classList.add(cls);
  lastPulse[name] = now;
  clearTimeout(alertTimers[name]);
  alertTimers[name] = setTimeout(() => root.classList.remove(cls), ms);
}

// The chip centres the line box, not the digits: measure the font's ink box and nudge the values
// so the digits sit optically centred.
const inkContext = document.createElement('canvas').getContext('2d');

function digitInkShift() {
  if (!inkContext) return 0;
  const row = els.subRow;
  if (!row) return 0;
  const style = getComputedStyle(row);
  inkContext.font = `${style.fontStyle} ${style.fontWeight} 100px ${style.fontFamily}`;
  const metrics = inkContext.measureText('0123456789');
  const ascent = metrics.fontBoundingBoxAscent;
  const descent = metrics.fontBoundingBoxDescent;
  const top = metrics.actualBoundingBoxAscent;
  const bottom = metrics.actualBoundingBoxDescent;
  if (!ascent || !top || !Number.isFinite(descent) || !Number.isFinite(bottom)) return 0;
  // Measured at 100px: convert to em and centre the ink box on the line box.
  return (descent - ascent + top - bottom) / 200;
}

/** Settings that change the look are pushed into CSS custom properties. */
function applyStyle() {
  const root = document.documentElement.style;

  // Scale affects presentation only and is never written back to the saved settings.
  const s = settings;
  const scale = Math.min(3, Math.max(0.4, Number(settings.scale) || 1));

  const text = s.textColor || DEFAULTS.textColor;
  const glow = s.useGlow ? s.glowColor || DEFAULTS.glowColor : null;
  const size = (Number(s.fontSize) || DEFAULTS.fontSize) * scale;

  root.setProperty('--font-size', `${Math.round(size * 100) / 100}px`);
  root.setProperty('--font-family', `${s.fontName || DEFAULTS.fontName}, "Segoe UI", sans-serif`);
  root.setProperty('--digit-ink-shift', `${Math.round(digitInkShift() * 10000) / 10000}em`);
  root.setProperty('--text-color', text);
  root.setProperty('--label-color', s.labelColor || DEFAULTS.labelColor);

  root.setProperty('--glow-soft', glow ? withAlpha(glow, 0.42) : 'rgba(0, 0, 0, 0)');

  // Pick each chip colour; the ink keeps the count readable on either choice.
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

  root.setProperty('--alert-color', s.missColor || DEFAULTS.missColor);
  root.setProperty('--fc-ok', s.hit300Color || DEFAULTS.hit300Color);
  root.setProperty('--fc-bad', s.missColor || DEFAULTS.missColor);

  const card = Boolean(s.useCard);
  const cardTint = s.cardColor || DEFAULTS.cardColor;

  // Accept opacity as 0-1 or as a 0-100 percentage.
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

  root.setProperty('--bar-color', s.progressColor || DEFAULTS.progressColor);
  root.setProperty('--bar-track', withAlpha(s.progressTrack || DEFAULTS.progressTrack, 0.16));

  // Clamp the slide duration; CSS parks the card outside its entry side.
  const slide = Math.min(3000, Math.max(150, Number(s.slideDuration) || DEFAULTS.slideDuration));
  root.setProperty('--slide-duration', `${Math.round(slide)}ms`);
  document.documentElement.classList.toggle('from-left', s.slideFromLeft === true);
  document.documentElement.classList.toggle('hide-pause', s.hideInPause === true);
  // the border effects (the FC readout and the border pulses) only make sense with a card
  document.documentElement.classList.toggle('with-card', card);
}

/** Coalesce websocket updates into one render per animation frame. */
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

  // In song select the card shows the selected map's 100% pp and hides the run data.
  const preview = showsSelectedMapPp(v, settings);
  if (wasPreview && !preview) {
    // Do not glide from the map's pp into the run's pp.
    stopPpGlide();
    ppShown = null;
  }
  wasPreview = preview;

  // A new map resets pulses and glide state.
  if (v.beatmapId !== lastBeatmap) {
    lastBeatmap = v.beatmapId;
    lastPp = null;
    pauseState = null;
    stopPpGlide();
    ppShown = null;
  }

  const shownPp = preview ? v.selectPp : v.results && v.resultPp > 0 ? v.resultPp : v.ppLive;
  if (preview) {
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

  els.liveWrap.classList.toggle('off', !settings.showLivePp);
  els.hitMiss.classList.toggle('off', preview || !settings.showMiss);
  els.hit50.classList.toggle('off', preview || !settings.show50);
  els.hit100.classList.toggle('off', preview || !settings.showHits);
  els.hit300.classList.toggle('off', preview || !settings.show300);
  els.subRow.classList.toggle('off', preview || !(settings.showMiss || settings.show50 || settings.showHits || settings.show300));

  els.barRow.classList.toggle('off', preview || !settings.showProgress);
  const barWidth = `${(v.progress * 100).toFixed(2)}%`;
  if (drawn.bar !== barWidth) {
    drawn.bar = barWidth;
    els.barFill.style.width = barWidth;
  }

  // Flash on a falling live pp, but never while a map is loading.
  if (lastPp !== null && v.playing && settings.ppLossAlert === true && ppDropped(lastPp, v.ppLive)) {
    pulse('pp', 900, 1500);
  }
  lastPp = v.ppLive;

  // A running play counts as paused when its clock stands still.
  const pause = detectPause(pauseState, v.liveTime, v.playing, Date.now(), PAUSE_IDLE_MS);
  pauseState = pause.next;
  const onMap = v.playing && v.hasBeatmap;
  const fc = settings.fcIndicator === true;
  // Slider breaks break FC even though they are not misses.
  const fcBroken = v.misses > 0 || v.sliderBreaks > 0;
  root.classList.toggle('paused', pause.paused);
  root.classList.toggle('fc-alive', fc && onMap && !fcBroken);
  root.classList.toggle('fc-lost', fc && onMap && fcBroken);

  root.classList.toggle('idle', !isVisible(v, settings, pause.paused));
}

// Park the card for the first frames so its entrance animation also plays mid-map.
document.documentElement.classList.add('boot');
applyStyle();
render();
requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove('boot')));
connect();
