/*
 * find the original source code at https://github.com/breadles5/customhiterrorbar
 */
true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

class WebSocketManager {
  version = "0.1.4";
  host;
  sockets;
  constructor(host) {
    this.host = host;
    this.sockets = {};
    this.createConnection = this.createConnection.bind(this);
  }
  createConnection(url, callback, filters) {
    let interval;
    const counterPath = window.COUNTER_PATH || "";
    const fullUrl = `ws://${this.host}${url}?l=${encodeURI(counterPath)}`;
    this.sockets[url] = new WebSocket(fullUrl);
    this.sockets[url].onopen = () => {
      console.log(`[OPEN] ${url}: Connected`);
      if (interval) clearInterval(interval);
      if (filters) {
        this.sockets[url].send(`applyFilters:${JSON.stringify(filters)}`);
      }
    };
    this.sockets[url].onclose = (event) => {
      console.log(`[CLOSED] ${url}: ${event.reason}`);
      delete this.sockets[url];
      interval = window.setTimeout(() => {
        this.createConnection(url, callback, filters);
      }, 1e3);
    };
    this.sockets[url].onerror = (event) => {
      console.error(`[ERROR] ${url}:`, event);
    };
    this.sockets[url].onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data === "object" && "error" in data) {
          console.error(`[MESSAGE_ERROR] ${url}:`, data.error);
          return;
        }
        callback(data);
      } catch (error) {
        console.error(`[MESSAGE_ERROR] ${url}: Couldn't parse incoming message`, error);
      }
    };
  }
  api_v2(callback, filters) {
    this.createConnection("/websocket/v2", callback, filters);
  }
  api_v2_precise(callback, filters) {
    this.createConnection("/websocket/v2/precise", callback, filters);
  }
  async calculate_pp(params) {
    try {
      const url = new URL(`http://${this.host}/api/calculate/pp`);
      Object.keys(params).forEach((key) => url.searchParams.append(key, String(params[key])));
      const request = await fetch(url.toString(), { method: "GET" });
      const json = await request.json();
      return json;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  }
  async getBeatmapOsuFile({ filePath }) {
    try {
      const request = await fetch(`${this.host}/files/beatmap/${filePath}`, {
        method: "GET"
      });
      const text = await request.text();
      return text;
    } catch (error) {
      console.error(error);
      return { error: error.message };
    }
  }
  commands(callback) {
    this.createConnection("/websocket/commands", callback);
  }
  sendCommand(name, command, amountOfRetries = 1) {
    if (!this.sockets["/websocket/commands"]) {
      setTimeout(() => {
        this.sendCommand(name, command, amountOfRetries + 1);
      }, 100);
      return;
    }
    try {
      const payload = typeof command === "object" ? JSON.stringify(command) : command;
      this.sockets["/websocket/commands"].send(`${name}:${payload}`);
    } catch (error) {
      if (amountOfRetries <= 3) {
        console.log(`[COMMAND_ERROR] Attempt ${amountOfRetries}`, error);
        setTimeout(() => {
          this.sendCommand(name, command, amountOfRetries + 1);
        }, 1e3);
        return;
      }
      console.error("[COMMAND_ERROR]", error);
    }
  }
  close(url) {
    this.host = url;
    Object.values(this.sockets).forEach((socket) => {
      if (socket) socket.close();
    });
  }
}

const elementCache = /* @__PURE__ */ new Map();
const getElement = (selector) => {
  if (!elementCache.has(selector)) {
    elementCache.set(selector, document.querySelector(selector));
  }
  return elementCache.get(selector);
};
const getAllElements = (selector) => {
  if (!elementCache.has(selector)) {
    elementCache.set(selector, document.querySelectorAll(selector));
  }
  return elementCache.get(selector);
};
window.addEventListener("unload", () => {
  elementCache.clear();
});
const setHidden = () => getAllElements("div")?.forEach((div) => div.classList.add("hidden"));
const setVisible = () => getAllElements("div")?.forEach((div) => div.classList.remove("hidden"));
const clearSD = () => {
  const sd = getElement(".sd");
  if (sd) {
    sd.textContent = "0.00";
  }
};
function updateTimingWindowElements() {
  requestAnimationFrame(() => {
    const timingWindows = cache.timingWindows;
    const colorsContainer = getElement(".colors-container");
    if (colorsContainer) {
      colorsContainer.innerHTML = "";
    }
    const containerWidth = Math.abs(timingWindows.get("0") ?? 0) * 4;
    document.documentElement.style.setProperty("--container-width", `${containerWidth}px`);
    const createTimingWindow = (grade, width) => {
      const div = document.createElement("div");
      div.className = `timing-window-${grade}`;
      div.style.width = `${Math.abs(width * 4)}px`;
      return div;
    };
    const fragment = document.createDocumentFragment();
    timingWindows.forEach((width, grade) => {
      fragment.appendChild(createTimingWindow(String(grade), width));
    });
    colorsContainer?.appendChild(fragment);
  });
}

const settings = {
  TimingWindowOpacity: 0,
  barHeight: 0,
  barWidth: 0,
  colorBar: "#000000",
  tickWidth: 0,
  tickHeight: 0,
  tickDuration: 0,
  tickOpacity: 0,
  fadeOutDuration: 0,
  arrowSize: 0,
  perfectArrowThreshold: 0,
  colorArrowEarly: "#000000",
  colorArrowLate: "#000000",
  colorArrowPerfect: "#000000",
  timingWindowHeight: 0,
  isRounded: 0,
  color300g: "#000000",
  color300: "#000000",
  color200: "#000000",
  color100: "#000000",
  color50: "#000000",
  color0: "#000000",
  showSD: false,
  disableHardwareAcceleration: false
};
const root = typeof document !== "undefined" ? document.documentElement : { style: { setProperty: () => {
} } };
let lastWindowHeight = 0;
let lastRoundedPercent = 0;
const updateSettings = (message) => {
  const oldSettings = { ...settings };
  let hasVisualChanges = false;
  let hasLayoutChanges = false;
  for (const [key, value] of Object.entries(message)) {
    const typedKey = key;
    if (Object.prototype.hasOwnProperty.call(settings, typedKey) && settings[typedKey] !== value) {
      settings[key] = value;
      if (key.startsWith("color") || key === "TimingWindowOpacity") {
        hasVisualChanges = true;
      } else if (key !== "showSD") {
        hasLayoutChanges = true;
      }
      if (typedKey === "disableHardwareAcceleration") {
        updateHardwareAcceleration();
      }
    }
  }
  if (hasLayoutChanges) {
    updateCSSLayout();
  }
  if (hasVisualChanges) {
    updateCSSColors();
  }
  if (Object.prototype.hasOwnProperty.call(message, "showSD") && oldSettings.showSD !== message.showSD) {
    updateVisibility();
  }
};
const updateHardwareAcceleration = () => {
  if (settings.disableHardwareAcceleration) {
    root.style.setProperty("--transform-prop", "none");
    root.style.setProperty("--will-change-prop", "auto");
  } else {
    root.style.setProperty("--transform-prop", "translate3d(0,0,0)");
    root.style.setProperty("--will-change-prop", "transform, opacity");
  }
};
const updateCSSLayout = () => {
  root.style.setProperty("--fade-out-duration", `${settings.fadeOutDuration}ms`);
  root.style.setProperty("--tick-duration", `${settings.tickDuration}ms`);
  root.style.setProperty("--bar-height", `${settings.barHeight}px`);
  root.style.setProperty("--bar-width", `${settings.barWidth}px`);
  root.style.setProperty("--tick-width", `${settings.tickWidth}px`);
  root.style.setProperty("--tick-height", `${settings.tickHeight}px`);
  root.style.setProperty("--arrow-size", `${settings.arrowSize}px`);
  const windowHeight = settings.barHeight * (settings.timingWindowHeight / 100);
  if (windowHeight !== lastWindowHeight) {
    lastWindowHeight = windowHeight;
    const clampedHeight = Math.max(0, Math.min(100, settings.timingWindowHeight));
    root.style.setProperty("--timing-window-height", `${clampedHeight}`);
  }
  const roundedPercent = Math.max(0, Math.min(100, settings.isRounded)) / 100;
  if (roundedPercent !== lastRoundedPercent) {
    lastRoundedPercent = roundedPercent;
    const windowRadius = windowHeight / 2 * roundedPercent;
    const barRadius = settings.barWidth / 2 * roundedPercent;
    const tickRadius = settings.tickWidth / 2 * roundedPercent;
    root.style.setProperty("--timing-window-radius", `${windowRadius}px`);
    root.style.setProperty("--bar-radius", `${barRadius}px`);
    root.style.setProperty("--tick-radius", `${tickRadius}px`);
  }
};
const updateCSSColors = () => {
  root.style.setProperty("--timing-windows-opacity", String(settings.TimingWindowOpacity));
  root.style.setProperty("--tick-opacity", String(settings.tickOpacity));
  root.style.setProperty("--color-300g", settings.color300g);
  root.style.setProperty("--color-300", settings.color300);
  root.style.setProperty("--color-200", settings.color200);
  root.style.setProperty("--color-100", settings.color100);
  root.style.setProperty("--color-50", settings.color50);
  root.style.setProperty("--color-0", settings.color0);
  root.style.setProperty("--arrow-early", settings.colorArrowEarly);
  root.style.setProperty("--arrow-late", settings.colorArrowLate);
  root.style.setProperty("--arrow-perfect", settings.colorArrowPerfect);
  root.style.setProperty("--bar-color", settings.colorBar);
};
const updateVisibility = () => {
  const sd = getElement(".sd");
  if (sd) {
    sd.style.display = settings.showSD ? "block" : "none";
  }
};

const calculateModTimingWindows = (gamemode, od, mods) => {
  let modifiedOD = od;
  switch (true) {
    case mods.includes("HR"):
      modifiedOD = Math.min(modifiedOD * 1.4, 10);
      return calculateGameModeWindows(gamemode, modifiedOD, mods);
    case mods.includes("EZ"):
      modifiedOD *= 0.5;
      return calculateGameModeWindows(gamemode, modifiedOD, mods);
    default:
      return calculateGameModeWindows(gamemode, modifiedOD, mods);
  }
};
const calculateGameModeWindows = (gamemode, od, mods) => {
  const windows = /* @__PURE__ */ new Map();
  switch (gamemode) {
    case "osu":
      windows.set("300", 80 - 6 * od);
      windows.set("100", 140 - 8 * od);
      windows.set("50", 200 - 10 * od);
      windows.set("0", 400);
      break;
    case "taiko":
      if (od <= 5) {
        windows.set("300", 50 - 3 * od);
        windows.set("100", 120 - 8 * od);
        windows.set("0", 135 - 8 * od);
      } else {
        windows.set("300", 50 - 3 * od);
        windows.set("100", 110 - 6 * od);
        windows.set("0", 120 - 5 * od);
      }
      break;
    case "fruits":
      windows.set("300", 80 - 6 * od);
      windows.set("100", 140 - 8 * od);
      windows.set("50", 200 - 10 * od);
      break;
    case "mania":
      windows.set("300g", mods.includes("EZ") ? 22.5 : mods.includes("HR") ? 11.43 : 16.5);
      windows.set("300", mods.includes("HR") ? (64 - 3 * od) / 1.4 : 64 - 3 * od);
      windows.set("200", mods.includes("HR") ? (97 - 3 * od) / 1.4 : 97 - 3 * od);
      windows.set("100", mods.includes("HR") ? (127 - 3 * od) / 1.4 : 127 - 3 * od);
      windows.set("50", mods.includes("HR") ? (151 - 3 * od) / 1.4 : 151 - 3 * od);
      windows.set("0", mods.includes("HR") ? (188 - 3 * od) / 1.4 : 188 - 3 * od);
      break;
    default:
      console.warn(`Unknown gamemode: ${gamemode}, falling back to osu standard`);
      windows.set("300", 80 - 6 * od);
      windows.set("100", 140 - 8 * od);
      windows.set("50", 200 - 10 * od);
      break;
  }
  return windows;
};

const tickElementsArray = [];
let areTicksRendered = false;
const disableHardwareAcceleration$1 = settings.disableHardwareAcceleration;
const renderTicksOnLoad = () => {
  if (areTicksRendered) return;
  const container = getElement(".tick-container");
  if (!container) {
    console.error("Tick container not found!");
    return;
  }
  const fragment = document.createDocumentFragment();
  tickElementsArray.length = 0;
  for (let i = 0; i < cache.tickPool.PoolSize; i++) {
    const div = document.createElement("div");
    div.className = "tick inactive";
    fragment.appendChild(div);
    tickElementsArray.push(div);
  }
  container.appendChild(fragment);
  areTicksRendered = true;
  console.log(`Rendered ${tickElementsArray.length} tick elements.`);
};
const resetTicks = () => {
  if (!areTicksRendered) return;
  for (let i = 0; i < tickElementsArray.length; i++) {
    const tickElement = tickElementsArray[i];
    if (!tickElement) continue;
    tickElement.className = "tick inactive";
    if (disableHardwareAcceleration$1) {
      tickElement.style.transform = "translateX(0px)";
      return;
    }
    tickElement.style.transform = "translate3d(0px, 0px, 0px)";
  }
};
const updateTicks = () => {
  requestAnimationFrame(() => {
    const poolSize = cache.tickPool.PoolSize;
    for (let i = 0; i < poolSize; i++) {
      const tick = cache.tickPool.pool[i];
      const tickElement = tickElementsArray[i];
      if (tick.classNames !== tickElement.className) {
        tickElement.className = tick.classNames;
        if (disableHardwareAcceleration$1) {
          tickElement.style.transform = `translateX(${tick.position}px)`;
          return;
        }
        tickElement.style.transform = `translate3d(${tick.position}px, 0px, 0px)`;
      }
    }
  });
};

const arrow = getElement(".arrow");
const disableHardwareAcceleration = settings.disableHardwareAcceleration;
const perfectArrowThreshold = settings.perfectArrowThreshold;
const getArrowColor = (average) => {
  const absError = Math.abs(average);
  const threshold = perfectArrowThreshold;
  if (absError <= threshold) {
    return "var(--arrow-perfect)";
  }
  if (average < 0) {
    return "var(--arrow-early)";
  }
  return "var(--arrow-late)";
};
const updateArrow = (targetPosition) => {
  if (arrow) {
    if (disableHardwareAcceleration) {
      arrow.style.transform = `translateX(${targetPosition * 2}px)`;
      return;
    }
    arrow.style.transform = `translate3d(${targetPosition * 2}px, 0px, 0px)`;
    arrow.style.borderTopColor = getArrowColor(targetPosition);
  }
};
function resetArrow() {
  if (arrow) {
    arrow.style.borderTopColor = "#fff";
    if (disableHardwareAcceleration) {
      arrow.style.transform = "translateX(0px)";
      return;
    }
    arrow.style.transform = "translate3d(0px, 0px, 0px)";
  }
}

class TickImpl {
  position;
  classNames;
  active;
  timestamp;
  // timestamp in milliseconds
  constructor() {
    this.position = 0;
    this.classNames = "tick inactive";
    this.active = false;
    this.timestamp = Date.now();
  }
  // Convert class methods to static methods
  static reset(tick) {
    tick.position = 0;
    tick.classNames = "tick inactive";
    tick.active = false;
    tick.timestamp = Date.now();
  }
  static setActive(tick, hitError) {
    tick.position = hitError << 1;
    tick.active = true;
    tick.timestamp = Date.now();
    TickImpl.setClassNames(tick);
  }
  static setInactive(tick) {
    tick.active = false;
    tick.classNames = "tick inactive";
    tick.timestamp = 0;
  }
  static resetActive(tick, hitError) {
    tick.position = hitError << 1;
    tick.timestamp = Date.now();
    TickImpl.setClassNames(tick);
  }
  static setClassNames(tick) {
    const timingWindows = cache.timingWindows;
    tick.classNames = "tick";
    const hitError = Math.abs(tick.position >> 1);
    let matched = false;
    for (const [grade, range] of timingWindows) {
      if (hitError <= range) {
        tick.classNames += ` _${String(grade)}`;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tick.classNames += " _0";
    }
  }
}
class TickPool {
  PoolSize;
  processedHits;
  pool;
  // readonly doesnt prevent us from modifying the array, only from reassigning it
  activeTicks = /* @__PURE__ */ new Set();
  // Store indices of active ticks
  constructor() {
    this.PoolSize = 100;
    this.processedHits = 0;
    this.pool = Array.from({ length: this.PoolSize }, () => new TickImpl());
  }
  set() {
    for (const tick of this.pool) {
      TickImpl.reset(tick);
    }
    this.activeTicks.clear();
    this.processedHits = 0;
  }
  update(hitErrors) {
    const now = Date.now();
    const timeoutThreshold = settings.tickDuration + settings.fadeOutDuration;
    const poolSize = this.PoolSize;
    const pool = this.pool;
    const activeTicks = this.activeTicks;
    const processedHits = this.processedHits;
    for (const idx of activeTicks) {
      const tick = pool[idx];
      if (now - tick.timestamp > timeoutThreshold) {
        TickImpl.setInactive(tick);
        activeTicks.delete(idx);
      }
    }
    if (processedHits === hitErrors.length) return;
    for (let i = processedHits; i < hitErrors.length; i++) {
      const poolIndex = i % poolSize;
      const error = hitErrors[i];
      const tick = pool[poolIndex];
      if (!tick.active) {
        TickImpl.setActive(tick, error);
        activeTicks.add(poolIndex);
        this.processedHits++;
      } else {
        const processedHitsindex = processedHits - 1;
        if (i > processedHitsindex) {
          TickImpl.resetActive(tick, error);
          this.processedHits++;
        }
      }
    }
  }
}

const reset = () => {
  requestAnimationFrame(() => {
    cache.tickPool.set();
    resetTicks();
    clearSD();
    resetArrow();
    console.log("[Main] reset");
  });
};

const average = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};
const standardDeviation = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const avg = average(arr);
  const squareDiffs = arr.map((value) => {
    const diff = value - avg;
    const sqrDiff = diff * diff;
    return sqrDiff;
  });
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
};
const median = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const sortedArr = [...arr].sort((a, b) => a - b);
  const middle = Math.floor(sortedArr.length / 2);
  if (sortedArr.length % 2 === 0) {
    return (sortedArr[middle - 1] + sortedArr[middle]) / 2;
  }
  return sortedArr[middle];
};

window?.addEventListener("load", renderTicksOnLoad);
const cache = {
  mode: "",
  mods: "",
  // mod names concatenated as string
  od: 0,
  state: "",
  timingWindows: /* @__PURE__ */ new Map(),
  // same can't be said here, since mania has 5 timing windows, while all taiko and standard have 3
  tickPool: new TickPool(),
  firstObjectTime: 0,
  isReset: true
};
const DEFAULT_HOST = window.location.host;
const wsManager = new WebSocketManager(DEFAULT_HOST);
wsManager.sendCommand("getSettings", encodeURI(window.COUNTER_PATH));
wsManager.commands((data) => {
  try {
    const { command, message } = data;
    console.log("[WEBSOCKET] Received command:", command, "with data:", message);
    if (command === "getSettings") {
      updateSettings(message);
    }
  } catch (error) {
    console.error("[MESSAGE_ERROR] Error processing WebSocket message:", error);
  }
});
const urlParams = new URLSearchParams(window.location.search);
const bgColor = urlParams.get("bg");
if (bgColor) {
  document.body.style.backgroundColor = bgColor;
}
if (settings.showSD) {
  const container = getElement("#container");
  if (container) {
    const sd = document.createElement("div");
    sd.classList.add("sd");
    sd.innerText = "0.00";
    container.prepend(sd);
  }
}
const apiV2Filters = ["state", "play", "beatmap"];
wsManager.api_v2((data) => {
  if (cache.state !== data.state.name) {
    cache.state = data.state.name;
    if (cache.state === "play") {
      const modeChanged = cache.mode !== data.play.mode.name;
      const odChanged = cache.od !== data.beatmap.stats.od.original;
      const modsChanged = cache.mods !== data.play.mods.name;
      if (modeChanged || odChanged || modsChanged) {
        cache.mode = data.beatmap.mode.name;
        cache.od = data.beatmap.stats.od.original;
        cache.mods = data.play.mods.name;
      }
      cache.firstObjectTime = data.beatmap.time.firstObject;
      cache.timingWindows = calculateModTimingWindows(cache.mode, cache.od, cache.mods);
      updateTimingWindowElements();
      setVisible();
      cache.isReset = false;
    } else {
      setHidden();
      setTimeout(() => {
        reset();
        cache.isReset = true;
      }, settings.fadeOutDuration);
    }
  }
}, apiV2Filters);
const apiV2PreciseFilter = ["hitErrors", "currentTime"];
while (cache.state === "play") {
  wsManager.api_v2_precise((data) => {
    const { hitErrors, currentTime } = data;
    if (currentTime < cache.firstObjectTime) {
      if (!cache.isReset) {
        reset();
        cache.isReset = true;
      }
    } else {
      cache.tickPool.update(hitErrors);
      if (cache.tickPool.activeTicks.size > 0) {
        updateTicks();
      }
      const activeErrors = [];
      for (const idx of cache.tickPool.activeTicks) {
        activeErrors.push(cache.tickPool.pool[idx].position >> 1);
      }
      const medianError = median(activeErrors);
      updateArrow(medianError);
      if (settings.showSD) {
        const standardDeviationError = standardDeviation(activeErrors);
        const sdElement = getElement(".sd");
        if (sdElement) {
          sdElement.innerText = standardDeviationError.toFixed(2);
        }
      }
      if (cache.isReset) {
        cache.isReset = false;
      }
    }
  }, apiV2PreciseFilter);
}
