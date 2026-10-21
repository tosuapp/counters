// Pure helpers for the merged tosu v2 snapshot: no DOM and no websocket.

export function num(value) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Recursive merge: arrays and scalars replace, objects merge key by key. */
export function deepMerge(target, patch) {
  if (!patch || typeof patch !== 'object') return target;
  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      target[key] = value;
    } else if (value && typeof value === 'object') {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

export function normalize(snapshot) {
  const s = snapshot || {};
  const state = s.state || {};
  const play = s.play || {};
  const hits = play.hits || {};
  const beatmap = s.beatmap || {};
  const results = s.resultsScreen || {};

  const stateNumber = num(state.number);
  const stateName = String(state.name || '');
  const beatmapId = num(beatmap.id);
  const liveTime = num((beatmap.time || {}).live);
  const lastObject = num((beatmap.time || {}).lastObject);
  const mp3Length = num((beatmap.time || {}).mp3Length);
  // Prefer the last object; the audio length is only a fallback.
  const progressEnd = lastObject > 0 ? lastObject : mp3Length;
  // tosu GameState: 0 menu, 2 play, 5 selectPlay, 7 resultScreen.
  const inResults = stateNumber === 7 || /result/i.test(stateName);
  // 100% pp of the selected map, already computed by tosu for the current mods.
  const accuracy = (s.performance || {}).accuracy || {};

  return {
    stateNumber,
    stateName,
    playing: stateNumber === 2 || /^play(ing)?$/i.test(stateName),
    results: inResults,
    hasBeatmap: beatmapId > 0 || liveTime > 0,
    beatmapId,
    liveTime,
    // The bar is full on the results screen.
    progress: inResults ? 1 : mapProgress(liveTime, progressEnd),
    ppLive: num((play.pp || {}).current),
    selectPp: beatmapId > 0 ? num(accuracy['100']) : 0,
    misses: num(hits['0']),
    sliderBreaks: num(hits.sliderBreaks),
    hit50: num(hits['50']),
    hit100: num(hits['100']),
    hit300: num(hits['300']),
    resultPp: num((results.pp || {}).current),
  };
}

export function mapProgress(liveTime, endTime) {
  const end = num(endTime);
  const time = num(liveTime);
  if (end <= 0 || time <= 0) return 0;
  return Math.min(1, time / end);
}

/** Ease-out cubic for the pp glide: quick at the start, calm at the end. */
export function easeGlide(t) {
  const k = Math.min(1, Math.max(0, num(t)));
  return 1 - Math.pow(1 - k, 3);
}

export function glideValue(from, to, t) {
  const a = num(from);
  const b = num(to);
  if (num(t) >= 1) return b;
  return a + (b - a) * easeGlide(t);
}

/** Fixed decimals, never NaN. */
export function formatNumber(value, decimals) {
  const places = Math.max(0, Math.min(6, num(decimals)));
  const n = num(value);
  return n.toFixed(places);
}

export function ppDropped(previous, current, threshold = 0.1) {
  return previous !== null && previous !== undefined && num(current) < num(previous) - threshold;
}

/** A running play is paused when its clock stays still for `idle` milliseconds. */
export function detectPause(previous, liveTime, playing, now, idle = 1200) {
  const time = num(liveTime);
  const prev = previous || { time, changedAt: now };
  if (!playing || time <= 0) return { paused: false, next: { time, changedAt: now } };
  if (time !== prev.time) return { paused: false, next: { time, changedAt: now } };
  return { paused: now - prev.changedAt >= Math.max(0, num(idle)), next: prev };
}

/** Results, pause and menu visibility are independent settings. */
export function isVisible(view, opts, paused = false) {
  const options = opts || {};
  if (view && view.results) return options.showOnResults === true || options.ingameOnly !== true;
  if (view && view.playing) return !(paused && options.hideInPause === true);
  return options.ingameOnly !== true;
}

/** In song select, show the selected map's 100% pp when the card is not ingame-only. */
export function showsSelectedMapPp(view, opts) {
  const options = opts || {};
  return options.ingameOnly !== true && options.showLivePp === true && inSongSelect(view);
}

/** The song select: tosu's GameState 5, or the name of that state. */
export function inSongSelect(view) {
  const state = view || {};
  return num(state.stateNumber) === 5 || /^select/i.test(String(state.stateName || ''));
}
