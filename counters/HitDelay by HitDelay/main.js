import { HitTracker, normalizeSnapshot } from "./core.js";
import { SkinResolver } from "./skin.js";
import {
  NoteMatcher,
  parseBeatmap,
  osuPositionToScreen,
  beatmapChecksum,
} from "./positioning.js";
import {
  normalizeSettings,
  settingsFromMessage,
  loadSettings,
  persistSettings,
  hitPresentation,
  STORAGE_KEY,
} from "./settings.js";
import {
  TosuConnection,
  PreviewConnection,
  apiBase,
  counterPath,
} from "./tosu.js";

const demo = new URLSearchParams(location.search).get("demo") === "1";
const baseUrl = apiBase();
const hud = document.querySelector("#hud");
const hitsElement = document.querySelector("#hits");
const tracker = new HitTracker();
const resolver = new SkinResolver({ baseUrl });
const matcher = new NoteMatcher();
let settings = loadSettings(),
  context = {},
  hardRock = false,
  generation = 0;
const rows = [];
let pausedAt = null,
  demoTimer,
  lastDemoHit,
  skinSignature = "";
let mapKey = "",
  loadingMapKey = "",
  mapRequest,
  mapRetryAt = 0,
  observation = null;
let visualTimer,
  visualFrame,
  lastReport = "";
let displayMode = "osu";
let maniaLayout = null,
  maniaLayoutSignature = "";
let maniaSlot;
const maniaArt = new Map();
const active = (ctx) =>
  ctx.playing && !ctx.paused && ctx.supported && ctx.mode === "osu";
const uiScale = () =>
  demo
    ? Math.max(0.65, Math.min(1, innerHeight / 400))
    : Math.max(0.5, innerHeight / 1080);
const followsCircles = () => settings.followNotes && displayMode === "osu";

function updateDisplayMode(mode = displayMode) {
  let changed = false;
  if ((mode === "osu" || mode === "mania") && mode !== displayMode) {
    clearHits();
    displayMode = mode;
    changed = true;
  }
  for (const [name, enabled] of [
    ["following", followsCircles()],
    ["mania", displayMode === "mania"],
  ]) {
    if (hud.classList.contains(name) !== enabled) {
      hud.classList.toggle(name, enabled);
      changed = true;
    }
  }
  if (changed) updateLayout();
}

function applySettings(value) {
  const previousFollow = settings.followNotes;
  settings = normalizeSettings({ ...settings, ...value });
  persistSettings(settings);
  updateDisplayMode();
  hud.style.setProperty("--image-height", settings.imageHeight + "px");
  hud.style.setProperty("--font-size", settings.fontSize + "px");
  clearHits();
  updateLayout();
  if (previousFollow !== settings.followNotes) {
    tracker.disconnect();
    observation = null;
    matcher.reset();
  }
  if (demo && lastDemoHit) showHits([lastDemoHit]);
}
function clearHits() {
  cancelVisualUpdates();
  generation++;
  for (const row of rows) removeRow(row);
  rows.length = 0;
}
function showHits(hits, now = performance.now()) {
  const latestMania = hits.findLast((hit) => hit.mode === "mania");
  if (latestMania) {
    showManiaHit(latestMania, now);
    return;
  }
  let added = false;
  for (const hit of hits) {
    const view = hitPresentation(hit, settings);
    const following = settings.followNotes && hit.mode === "osu";
    if (!view || (following && !hit.position)) continue;
    updateDisplayMode(hit.mode);
    const element = document.createElement("div");
    element.className = "hit";
    element.dataset.direction = hit.direction;
    element.dataset.grade = hit.grade ?? "unknown";
    element.style.setProperty("--hit-color", view.color);
    const line = document.createElement("div");
    line.className = "hit-line";
    // The native skin draws the original grade. Append direction at that circle.
    const badge = following && settings.noteBadgeOnly;
    const drawGrade = settings.showGrade && hit.grade && (!badge || demo);
    let image, mask;
    if (drawGrade) {
      if (!badge) {
        const estimate = document.createElement("span");
        estimate.className = "estimate";
        estimate.textContent = "≈";
        estimate.title = "按命中时差推算的档位";
        line.append(estimate);
      }
      const grade = document.createElement("span");
      grade.className = "grade";
      grade.textContent = view.gradeLabel;
      line.append(grade);
      if (settings.useSkin) {
        image = document.createElement("img");
        image.className = "skin-art";
        image.alt = view.gradeLabel;
        image.hidden = true;
        mask = document.createElement("span");
        mask.className = "skin-mask";
        mask.setAttribute("aria-hidden", "true");
        line.append(image, mask);
        const token = generation;
        resolver
          .resolve({
            skinKey: context.skinKey || "",
            mode: hit.mode,
            keyCount: context.keyCount,
            grade: hit.grade,
          })
          .then((asset) => {
            if (!asset || token !== generation || !element.isConnected) return;
            row.asset = asset;
            image.onload = () => {
              if (token !== generation || !element.isConnected) return;
              if (!grade.hidden) grade.hidden = true;
              if (settings.tintSkin) {
                if (mask.style.display !== "inline-block")
                  mask.style.display = "inline-block";
                const width =
                  Math.min(
                    250,
                    (settings.imageHeight * image.naturalWidth) /
                      Math.max(1, image.naturalHeight),
                  ) + "px";
                if (mask.style.width !== width) mask.style.width = width;
              } else if (image.hidden) image.hidden = false;
              updateLayout();
              updateVisuals();
            };
            image.onerror = () => {
              if (token !== generation || !element.isConnected) return;
              grade.hidden = false;
              image.hidden = true;
              mask.style.display = "none";
              row.asset = null;
              updateLayout();
              updateVisuals();
            };
            setFrame(row, 0);
            updateVisuals();
          });
      }
    }
    const suffix = document.createElement("span");
    suffix.className = "suffix";
    suffix.textContent =
      (drawGrade ? (settings.chineseLabels ? "-" : "−") : "") + view.label;
    line.append(suffix);
    element.append(line);
    if (settings.showMs) {
      const ms = document.createElement("span");
      ms.className = "offset";
      ms.textContent = view.offsetText;
      element.append(ms);
    }
    let container = element,
      marker;
    if (following) {
      container = document.createElement("div");
      container.className = "note-anchor" + (badge && !demo ? " badge" : "");
      container.dataset.objectId = hit.objectId ?? "demo";
      container.append(element);
      if (demo) {
        marker = document.createElement("div");
        marker.className = "demo-note";
        hitsElement.append(marker);
      }
    }
    const row = {
      element,
      container,
      marker,
      hit,
      badge: badge && !demo,
      image,
      mask,
      start: now,
      asset: null,
      frame: -1,
      opacity: "",
    };
    rows.push(row);
    hitsElement.append(container);
    positionRow(row);
    added = true;
    while (rows.length > settings.maxVisible) removeRow(rows.shift());
  }
  if (added) {
    updateLayout();
    updateVisuals(now);
  }
}
function prepareManiaArt(grade) {
  const key = [context.skinKey, context.keyCount, grade].join("|");
  if (!maniaArt.has(key)) {
    const record = { asset: null };
    record.promise = resolver
      .resolve({
        skinKey: context.skinKey || "",
        mode: "mania",
        keyCount: context.keyCount,
        grade,
      })
      .then(async (asset) => {
        if (!asset?.frames?.[0]) return null;
        const preload = new Image();
        preload.decoding = "async";
        preload.src = asset.frames[0];
        try {
          await preload.decode();
        } catch {
          return null;
        }
        record.asset = asset;
        record.preload = preload;
        return asset;
      })
      .catch(() => null);
    maniaArt.set(key, record);
  }
  return { key, ...maniaArt.get(key) };
}
function createManiaSlot() {
  const element = document.createElement("div");
  element.className = "hit mania-hit";
  element.dataset.mode = "mania";
  const line = document.createElement("div");
  line.className = "hit-line";
  const estimate = document.createElement("span");
  estimate.className = "estimate";
  estimate.textContent = "≈";
  estimate.title = "按命中时差推算的档位";
  const grade = document.createElement("span");
  grade.className = "grade";
  const image = document.createElement("img");
  image.className = "skin-art";
  image.hidden = true;
  const mask = document.createElement("span");
  mask.className = "skin-mask";
  mask.setAttribute("aria-hidden", "true");
  const suffix = document.createElement("span");
  suffix.className = "suffix";
  const ms = document.createElement("span");
  ms.className = "offset";
  line.append(estimate, grade, image, mask, suffix);
  element.append(line, ms);
  const row = {
    element,
    container: element,
    line,
    estimate,
    grade,
    image,
    mask,
    suffix,
    ms,
    frame: -1,
    asset: null,
    opacity: "",
    revision: 0,
  };
  image.onload = () => {
    if (
      !element.isConnected ||
      row.generation !== generation ||
      !row.asset ||
      !row.drawGrade ||
      !settings.useSkin
    )
      return;
    if (!row.asset.frames.includes(image.src)) return;
    grade.hidden = true;
    if (settings.tintSkin) {
      image.hidden = true;
      mask.style.display = "inline-block";
      mask.style.width =
        Math.min(
          250,
          (settings.imageHeight * image.naturalWidth) /
            Math.max(1, image.naturalHeight),
        ) + "px";
    } else {
      image.hidden = false;
      mask.style.display = "none";
    }
    updateVisuals();
  };
  image.onerror = () => {
    if (!element.isConnected || row.generation !== generation) return;
    row.asset = null;
    row.frame = -1;
    grade.hidden = !row.drawGrade;
    image.hidden = true;
    mask.style.display = "none";
    updateVisuals();
  };
  return row;
}
function showManiaHit(hit, now) {
  updateDisplayMode("mania");
  const view = hitPresentation(hit, settings);
  // The latest event owns the slot, including a grade the user has hidden.
  if (!view) {
    clearHits();
    return;
  }
  const row = (maniaSlot ??= createManiaSlot());
  if (rows.some((other) => other !== row)) clearHits();
  if (!rows.includes(row)) {
    rows.push(row);
    hitsElement.append(row.element);
  }
  row.hit = hit;
  row.start = now;
  row.generation = generation;
  row.revision++;
  row.element.dataset.direction = hit.direction;
  row.element.dataset.grade = hit.grade ?? "unknown";
  row.element.style.setProperty("--hit-color", view.color);
  row.element.style.opacity = row.opacity = "1";
  row.drawGrade = Boolean(settings.showGrade && hit.grade);
  row.estimate.hidden = !row.drawGrade;
  row.grade.hidden = !row.drawGrade;
  row.grade.textContent = view.gradeLabel;
  row.suffix.textContent =
    (row.drawGrade ? (settings.chineseLabels ? "-" : "−") : "") + view.label;
  row.ms.hidden = !settings.showMs;
  row.ms.textContent = view.offsetText;
  const record =
    row.drawGrade && settings.useSkin ? prepareManiaArt(hit.grade) : null;
  if (!record || row.artKey !== record.key) {
    row.artKey = record?.key;
    row.asset = null;
    row.frame = -1;
    row.image.hidden = true;
    row.mask.style.display = "none";
  }
  if (record) {
    const revision = row.revision,
      token = generation;
    const applyAsset = (asset) => {
      if (
        !asset ||
        revision !== row.revision ||
        token !== generation ||
        !row.element.isConnected
      )
        return;
      row.asset = asset;
      row.image.alt = view.gradeLabel;
      // Reuse the loaded image for a repeated grade; update its text immediately.
      if (
        row.image.complete &&
        row.image.naturalWidth > 0 &&
        row.image.src === asset.frames[0]
      ) {
        row.frame = 0;
        row.image.onload();
      } else {
        row.frame = -1;
        setFrame(row, 0);
      }
      updateVisuals();
    };
    if (record.asset) applyAsset(record.asset);
    else record.promise.then(applyAsset);
  }
  updateLayout();
  updateVisuals(now);
}
function removeRow(row) {
  row.container.remove();
  row.marker?.remove();
}
function positionRow(row) {
  if (!settings.followNotes || row.hit.mode !== "osu") return;
  const point = osuPositionToScreen(row.hit.position, {
    width: innerWidth,
    height: innerHeight,
    hardRock: !demo && hardRock,
    stackOffset: row.hit.stackOffset ?? 0,
  });
  if (!point) return;
  const scale = uiScale();
  row.container.dataset.noteX = point.x;
  row.container.dataset.noteY = point.y;
  row.container.style.left =
    point.x + (settings.offsetX + (row.badge ? 38 : 0)) * scale + "px";
  row.container.style.top = point.y + settings.offsetY * scale + "px";
  row.container.style.setProperty("--ui-scale", scale);
  if (row.marker) {
    row.marker.style.left = point.x + "px";
    row.marker.style.top = point.y + "px";
  }
}
function setFrame(row, index) {
  if (row.frame === index || !row.asset) return;
  const url = row.asset.frames[index];
  if (!Number.isInteger(index) || index < 0 || typeof url !== "string" || !url)
    return;
  row.frame = index;
  row.image.src = url;
  row.mask.style.setProperty("--asset", 'url("' + url + '")');
}
function cancelVisualUpdates() {
  clearTimeout(visualTimer);
  visualTimer = undefined;
  if (visualFrame !== undefined) cancelAnimationFrame(visualFrame);
  visualFrame = undefined;
}
function updateVisuals(now = performance.now()) {
  cancelVisualUpdates();
  // A blank or static overlay should not keep Chromium producing new frames.
  if (pausedAt !== null || !rows.length) return;
  let wait = Infinity,
    fading = false,
    removed = false;
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i],
      age = Math.max(0, now - row.start);
    if (age >= settings.holdMs + settings.fadeMs) {
      removeRow(row);
      rows.splice(i, 1);
      removed = true;
      continue;
    }
    const opacity =
      age <= settings.holdMs
        ? "1"
        : String(1 - (age - settings.holdMs) / Math.max(1, settings.fadeMs));
    if (row.opacity !== opacity) {
      row.element.style.opacity = opacity;
      row.opacity = opacity;
    }
    if (age >= settings.holdMs) fading = true;
    else wait = Math.min(wait, settings.holdMs - age);
    if (row.asset) {
      const n = Math.floor(age / row.asset.frameMs);
      setFrame(
        row,
        row.asset.loop
          ? n % row.asset.frames.length
          : Math.min(n, row.asset.frames.length - 1),
      );
      if (
        row.asset.frames.length > 1 &&
        (row.asset.loop || n < row.asset.frames.length - 1)
      ) {
        wait = Math.min(wait, (n + 1) * row.asset.frameMs - age);
      }
    }
  }
  if (removed) updateLayout();
  if (!rows.length) return;
  if (fading) visualFrame = requestAnimationFrame(updateVisuals);
  else if (Number.isFinite(wait))
    visualTimer = setTimeout(updateVisuals, Math.max(1, wait));
}
function updateLayout() {
  let transform = "";
  if (displayMode === "mania") {
    const unit = innerHeight / 480;
    const left =
      maniaLayout?.x === undefined ? "50%" : maniaLayout.x * unit + "px";
    const top =
      maniaLayout?.y === undefined ? "35%" : maniaLayout.y * unit + "px";
    if (hitsElement.style.left !== left) hitsElement.style.left = left;
    if (hitsElement.style.top !== top) hitsElement.style.top = top;
  } else {
    if (hitsElement.style.left) hitsElement.style.removeProperty("left");
    if (hitsElement.style.top) hitsElement.style.removeProperty("top");
  }
  if (!followsCircles()) {
    const baseScale = displayMode === "mania" ? uiScale() : 1;
    const mania = displayMode === "mania";
    const scale = Math.min(
      baseScale,
      Math.max(1, innerHeight - 16) /
        (mania ? 84 : Math.max(1, hitsElement.scrollHeight)),
      Math.max(1, innerWidth - 16) /
        (mania ? 280 : Math.max(1, hitsElement.scrollWidth)),
    );
    const offsetX = mania ? (settings.maniaOffsetX ?? 0) : settings.offsetX;
    const offsetY = mania ? (settings.maniaOffsetY ?? -96) : settings.offsetY;
    transform =
      (mania ? "translate(-50%,-50%) " : "") +
      "translate(" +
      offsetX * baseScale +
      "px," +
      offsetY * baseScale +
      "px) scale(" +
      scale +
      ")";
  }
  if (hitsElement.style.transform !== transform)
    hitsElement.style.transform = transform;
}
function warmManiaLayout() {
  const keyCount = context.keyCount;
  const signature = [context.skinKey, keyCount].join("|");
  if (signature === maniaLayoutSignature) return;
  maniaLayoutSignature = signature;
  maniaLayout = null;
  if (displayMode === "mania") updateLayout();
  if (!Number.isInteger(keyCount) || keyCount < 1 || keyCount > 18) return;
  resolver
    .maniaSection(context.skinKey, keyCount, resolver.baseUrl)
    .then((section) => {
      if (!section || signature !== maniaLayoutSignature) return;
      const layout = {},
        score = Number(section.scoreposition);
      // ScorePosition is the grade position; HitPosition belongs to the key line.
      if (
        section.scoreposition !== undefined &&
        Number.isFinite(score) &&
        score >= 0 &&
        score <= 480 &&
        Number(section.upsidedown || 0) === 0
      )
        layout.y = score;
      const start = Number(section.columnstart);
      const widths = String(section.columnwidth ?? "")
        .split(",")
        .map(Number);
      const lines = String(section.columnlinewidth ?? "0")
        .split(",")
        .map(Number);
      const spacing = String(section.columnspacing ?? "0")
        .split(",")
        .map(Number);
      // Single-stage layouts with explicit equal-origin columns are unambiguous.
      // More involved stage layouts keep the adjustable central fallback.
      if (
        keyCount <= 9 &&
        section.columnstart !== undefined &&
        Number.isFinite(start) &&
        start >= 0 &&
        widths.length === keyCount &&
        widths.every((width) => Number.isFinite(width) && width > 0) &&
        lines.every((width) => width === 0) &&
        spacing.every((width) => width === 0)
      ) {
        layout.x =
          start + widths.reduce((total, width) => total + width, 0) / 2;
      }
      maniaLayout = layout;
      if (displayMode === "mania") updateLayout();
    })
    .catch(() => {});
}
function warmSkin() {
  const signature = [context.skinKey, context.mode, context.keyCount].join("|");
  if (!context.supported || signature === skinSignature) return;
  skinSignature = signature;
  if (context.mode === "mania") warmManiaLayout();
  for (const grade of context.mode === "mania"
    ? ["300g", "300", "200", "100", "50"]
    : ["300", "100", "50"]) {
    if (context.mode === "mania") prepareManiaArt(grade);
    else
      resolver
        .resolve({
          skinKey: context.skinKey,
          mode: context.mode,
          keyCount: context.keyCount,
          grade,
        })
        .catch(() => {});
  }
}
function ensureMap(ctx) {
  if (
    !ctx.mapKey ||
    ctx.mode !== "osu" ||
    ctx.mapKey === mapKey ||
    ctx.mapKey === loadingMapKey ||
    performance.now() < mapRetryAt
  )
    return;
  mapRequest?.abort();
  mapRequest = new AbortController();
  const request = mapRequest,
    expected = ctx.mapKey;
  const timeout = setTimeout(() => request.abort(), 2000);
  loadingMapKey = expected;
  mapKey = "";
  matcher.setBeatmap(null);
  observation = null;
  fetch(baseUrl + "/files/beatmap/file", {
    cache: "no-store",
    signal: request.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Beatmap unavailable");
      const bytes = await response.arrayBuffer();
      // Hash original bytes, before TextDecoder removes an optional UTF-8 BOM.
      // A map can change while the asynchronous current-file request is running.
      if (
        /^[a-f\d]{32}$/i.test(expected) &&
        beatmapChecksum(bytes) !== expected.toLowerCase()
      )
        throw new Error("Beatmap changed");
      const parsed = parseBeatmap(new TextDecoder().decode(bytes));
      if (request !== mapRequest || context.mapKey !== expected) return;
      if (!parsed.valid || parsed.mode !== 0)
        throw new Error("Unsupported beatmap");
      matcher.setBeatmap(parsed);
      mapKey = expected;
      observation = null;
    })
    .catch(() => {
      if (request === mapRequest) mapRetryAt = performance.now() + 1500;
    })
    .finally(() => {
      clearTimeout(timeout);
      if (request === mapRequest) loadingMapKey = "";
    });
}
function pauseDisplay() {
  if (context.paused && pausedAt === null) {
    pausedAt = performance.now();
    clearHits();
    hud.hidden = true;
    cancelVisualUpdates();
  }
  if (!context.paused && pausedAt !== null) {
    pausedAt = null;
    hud.hidden = false;
    updateLayout();
    updateVisuals();
  }
}
function report() {
  if (parent === window) return;
  const message = {
    type: "hitdelay-status",
    demo,
    context: {
      mode: context.mode,
      skinKey: context.skinKey,
      playing: context.playing,
      supported: context.supported,
      windows: context.windows,
      following: settings.followNotes && context.mode === "osu",
      positioningReady: mapKey === context.mapKey && Boolean(mapKey),
    },
  };
  const serialized = JSON.stringify(message);
  if (serialized === lastReport) return;
  lastReport = serialized;
  parent.postMessage(message, location.origin);
}
function acceptSnapshot(data, following = false) {
  const previous = context,
    before = observation;
  const result = tracker.updateSnapshot(data);
  context = result.context;
  updateDisplayMode(context.mode);
  hardRock = ((Number(data.play?.mods?.number) || 0) & 16) !== 0;
  const easy = ((Number(data.play?.mods?.number) || 0) & 2) !== 0;
  warmSkin();
  if (
    previous.skinKey !== context.skinKey ||
    result.reset ||
    !context.playing ||
    !context.supported
  )
    clearHits();
  pauseDisplay();
  if (following) {
    ensureMap(context);
    if (result.reset) matcher.reset();
    // Both time and offsets come from the same HTTP snapshot. Avoid WS clock lag.
    if (
      !result.reset &&
      before?.mapKey === context.mapKey &&
      mapKey === context.mapKey &&
      active(context)
    ) {
      showHits(
        matcher.observe({
          errors: result.hits,
          since: before.time,
          at: context.currentTime,
          context: {
            ...context,
            hardRock,
            easy,
            clockUncertaintyMs: 20 * context.rate,
          },
        }),
      );
    }
    observation = active(context)
      ? { mapKey: context.mapKey, time: context.currentTime }
      : null;
  } else if (!settings.followNotes || context.mode !== "osu")
    showHits(result.hits);
  report();
}
function snapshot(data) {
  if (demo) {
    const previousSkin = context.skinKey,
      previousMode = context.mode;
    context = normalizeSnapshot(data);
    warmSkin();
    if (previousMode && previousMode !== context.mode) {
      clearHits();
      lastDemoHit = null;
    }
    if (previousSkin !== context.skinKey && lastDemoHit) {
      clearHits();
      showHits([lastDemoHit]);
    }
    report();
    return;
  }
  // A single serial HTTP source supplies both context and the circle clock.
  // Do not open another poller or use precise arrival times as note timestamps.
  const next = normalizeSnapshot(data);
  acceptSnapshot(data, settings.followNotes && next.mode === "osu");
}

applySettings(settings);
if (demo) {
  document.querySelector("#demo-label").hidden = false;
  let index = 0;
  const samples = [
    {
      mode: "osu",
      grade: "100",
      offset: -62,
      direction: "early",
      position: { x: 120, y: 110 },
    },
    {
      mode: "osu",
      grade: "100",
      offset: 74,
      direction: "late",
      position: { x: 390, y: 260 },
    },
    {
      mode: "osu",
      grade: "50",
      offset: -112,
      direction: "early",
      position: { x: 200, y: 285 },
    },
  ];
  const maniaSamples = [
    { mode: "mania", grade: "200", offset: -55, direction: "early" },
    { mode: "mania", grade: "100", offset: 88, direction: "late" },
    { mode: "mania", grade: "50", offset: -112, direction: "early" },
  ];
  const playDemo = () => {
    const available = context.mode === "mania" ? maniaSamples : samples;
    lastDemoHit = { ...available[index++ % available.length], inferred: true };
    showHits([lastDemoHit]);
  };
  playDemo();
  demoTimer = setInterval(playDemo, 850);
}
const Connection =
  parent !== window && new URLSearchParams(location.search).get("relay") === "1"
    ? PreviewConnection
    : TosuConnection;
const connection = new Connection({
  baseUrl,
  path: counterPath(),
  onSnapshot: snapshot,
  onPrecise: (values) => {
    if (
      !demo &&
      context.playing &&
      !context.paused &&
      context.supported &&
      (!settings.followNotes || context.mode !== "osu")
    ) {
      showHits(tracker.ingest(values));
    }
  },
  onSettings: (message) => {
    const next = normalizeSettings(settingsFromMessage(message));
    if (JSON.stringify(next) !== JSON.stringify(settings)) applySettings(next);
  },
  onDisconnect: () => {
    if (!demo) {
      observation = null;
      tracker.disconnect();
      clearHits();
    }
  },
});
connection.start();
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.source !== parent) return;
  if (event.data?.type === "hitdelay-settings") {
    const next = normalizeSettings(event.data.settings);
    if (JSON.stringify(next) !== JSON.stringify(settings)) applySettings(next);
  }
  if (demo && event.data?.type === "hitdelay-sample") {
    lastDemoHit = { ...event.data.hit };
    if (lastDemoHit.mode !== "mania")
      lastDemoHit.position ??= {
        x: lastDemoHit.direction === "early" ? 120 : 390,
        y: 190,
      };
    showHits([lastDemoHit]);
  }
});
window.addEventListener("resize", () => {
  for (const row of rows) positionRow(row);
  updateLayout();
});
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) applySettings(loadSettings());
});
window.addEventListener(
  "pagehide",
  () => {
    cancelVisualUpdates();
    mapRequest?.abort();
    connection.stop();
    clearInterval(demoTimer);
  },
  { once: true },
);
