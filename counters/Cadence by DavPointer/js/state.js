// Pure helpers for the pp counter overlay: no DOM, no websocket, easy to unit test.
// snapshot is the merged tosu v2 payload (delta messages are merged into it).

export function num(value) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Recursive merge: scalars and arrays are replaced, objects are merged key by key. */
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

/** Flatten the parts of the v2 payload this counter cares about. */
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
  // the bar fills up to the last object of the map: the audio length is only a fallback
  const progressEnd = lastObject > 0 ? lastObject : mp3Length;
  // tosu's GameState enum: 0 menu, 2 play, 5 selectPlay (the song select!), 7 resultScreen. Reading
  // 5 as the results screen kept the counter up in the song select and all over the menus.
  const inResults = stateNumber === 7 || /result/i.test(stateName);
  // the pp the selected map is worth at 100% with the current mods: the same number tosu works out
  // for its own menu and publishes in the v2 performance block, so no extra request is needed
  const accuracy = (s.performance || {}).accuracy || {};

  return {
    stateNumber,
    stateName,
    playing: stateNumber === 2 || /^play(ing)?$/i.test(stateName),
    results: inResults,
    hasBeatmap: beatmapId > 0 || liveTime > 0,
    beatmapId,
    liveTime,
    // the map is over on the results screen, so the bar sits full there
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

/** How far the map has come, 0..1: 0 until the clock starts, 1 at the last object. */
export function mapProgress(liveTime, endTime) {
  const end = num(endTime);
  const time = num(liveTime);
  if (end <= 0 || time <= 0) return 0;
  return Math.min(1, time / end);
}

/** Ease-out for the live pp glide: quick at the start, calm at the end, 0 -> 0 and 1 -> 1. */
export function easeGlide(t) {
  const k = Math.min(1, Math.max(0, num(t)));
  return 1 - Math.pow(1 - k, 3);
}

/** Where the glide is at `t`: `from` at 0, `to` exactly at 1. */
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

/** True when the live pp dropped by at least `threshold` since the last look. */
export function ppDropped(previous, current, threshold = 0.1) {
  return previous !== null && previous !== undefined && num(current) < num(previous) - threshold;
}

/**
 * A play is paused when the map clock stops moving: while a play runs the time always moves on, so
 * a still clock for `idle` milliseconds means osu! is sitting in the pause menu. Outside a play, or
 * before the map clock has started, there is nothing that can be paused.
 */
export function detectPause(previous, liveTime, playing, now, idle = 1200) {
  const time = num(liveTime);
  const prev = previous || { time, changedAt: now };
  if (!playing || time <= 0) return { paused: false, next: { time, changedAt: now } };
  if (time !== prev.time) return { paused: false, next: { time, changedAt: now } };
  return { paused: now - prev.changedAt >= Math.max(0, num(idle)), next: prev };
}

/**
 * Menus, pause and the results screen are decided separately: ingameOnly hides the counter while
 * nothing is playing, showOnResults keeps it on the results screen and hideInPause takes it
 * away while the play is paused.
 */
export function isVisible(view, opts, paused = false) {
  const options = opts || {};
  if (view && view.results) return options.showOnResults === true || options.ingameOnly !== true;
  if (view && view.playing) return !(paused && options.hideInPause === true);
  return options.ingameOnly !== true;
}

/**
 * The card left on screen in the song select: instead of an empty play (no hits, no bar) it shows
 * what the selected map is worth, so the number means something before the map starts. Only when
 * the counter is not ingame only and the pp is on screen at all.
 */
export function showsSelectedMapPp(view, opts) {
  const options = opts || {};
  return options.ingameOnly !== true && options.showLivePp === true && inSongSelect(view);
}

/** The song select: tosu's GameState 5, or the name of that state. */
export function inSongSelect(view) {
  const state = view || {};
  return num(state.stateNumber) === 5 || /^select/i.test(String(state.stateName || ''));
}
