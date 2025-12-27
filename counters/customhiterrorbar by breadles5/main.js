/*
 * find the original source code at https://github.com/breadles5/customhiterrorbar
 */
true              &&(function polyfill() {
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

const settings = {
  TimingWindowOpacity: 0,
  barHeight: 60,
  barWidth: 8,
  colorBar: "#bf0000",
  tickWidth: 8,
  tickHeight: 40,
  tickDuration: 500,
  tickOpacity: 0.75,
  fadeOutDuration: 800,
  arrowSize: 25,
  perfectArrowThreshold: 5,
  colorArrowEarly: "#0080ff",
  colorArrowLate: "#ff0000",
  colorArrowPerfect: "#ffffff",
  timingWindowHeight: 40,
  isRounded: 100,
  color300g: "transparent",
  color300: "transparent",
  color200: "transparent",
  color100: "transparent",
  color50: "transparent",
  color0: "transparent",
  useCustomTimingWindows: false,
  customTimingWindows: "16.5,64,97,127,151"
};
const root = typeof document !== "undefined" ? document.documentElement : { style: { setProperty: () => {
} } };
let lastWindowHeight = 0;
let lastRoundedPercent = 0;
const SETTINGS_LOG_PREFIX$1 = "[SETTINGS]";
const updateSettings = (message) => {
  console.log(`${SETTINGS_LOG_PREFIX$1} Applying settings update`, message);
  ({ ...settings });
  let hasVisualChanges = false;
  let hasLayoutChanges = false;
  const changedKeys = [];
  for (const [key, value] of Object.entries(message)) {
    const typedKey = key;
    if (Object.prototype.hasOwnProperty.call(settings, typedKey) && settings[typedKey] !== value) {
      settings[key] = value;
      changedKeys.push(key);
      if (key.startsWith("color") || key === "TimingWindowOpacity") {
        hasVisualChanges = true;
      } else {
        hasLayoutChanges = true;
      }
    }
  }
  if (changedKeys.length === 0) {
    console.log(`${SETTINGS_LOG_PREFIX$1} No changes detected in incoming update.`);
  } else {
    console.log(`${SETTINGS_LOG_PREFIX$1} Updated keys: ${changedKeys.join(", ")}`);
  }
  if (hasLayoutChanges) {
    console.log(`${SETTINGS_LOG_PREFIX$1} Applying layout-related CSS updates.`);
    updateCSSLayout();
  }
  if (hasVisualChanges) {
    console.log(`${SETTINGS_LOG_PREFIX$1} Applying visual-related CSS updates.`);
    updateCSSColors();
  }
  if (hasVisualChanges) {
    console.log(`${SETTINGS_LOG_PREFIX$1} Applying visual-related CSS updates.`);
    updateCSSColors();
  }
};
const updateCSSLayout = () => {
  const { barWidth, barHeight, tickWidth, tickHeight, timingWindowHeight, isRounded } = settings;
  const windowHeight = window.innerHeight;
  const timingWindowHeightPx = barHeight * timingWindowHeight / 100;
  if (Math.abs(windowHeight - lastWindowHeight) > 1) {
    root.style.setProperty("--window-height", `${windowHeight}px`);
    lastWindowHeight = windowHeight;
  }
  const roundedPercent = Math.min(100, Math.max(0, isRounded));
  if (roundedPercent !== lastRoundedPercent) {
    root.style.setProperty("--border-radius", `${roundedPercent}%`);
    lastRoundedPercent = roundedPercent;
  }
  const radiusScale = roundedPercent / 100;
  const barRadiusPx = barWidth / 2 * radiusScale;
  const tickRadiusPx = tickWidth / 2 * radiusScale;
  const timingWindowRadiusPx = timingWindowHeightPx / 2 * radiusScale;
  root.style.setProperty("--bar-radius", `${barRadiusPx}px`);
  root.style.setProperty("--tick-radius", `${tickRadiusPx}px`);
  root.style.setProperty("--timing-window-radius", `${timingWindowRadiusPx}px`);
  root.style.setProperty("--bar-width", `${barWidth}px`);
  root.style.setProperty("--bar-height", `${barHeight}px`);
  root.style.setProperty("--tick-width", `${tickWidth}px`);
  root.style.setProperty("--tick-height", `${tickHeight}px`);
  root.style.setProperty("--timing-window-height", `${timingWindowHeight}%`);
  console.log(`${SETTINGS_LOG_PREFIX$1} Calculated radii (px)`, { barRadiusPx, tickRadiusPx, timingWindowRadiusPx });
};
const updateCSSColors = () => {
  const {
    colorBar,
    color300g,
    color300,
    color200,
    color100,
    color50,
    color0,
    colorArrowEarly,
    colorArrowLate,
    colorArrowPerfect,
    TimingWindowOpacity
  } = settings;
  root.style.setProperty("--color-bar", colorBar);
  root.style.setProperty("--bar-color", colorBar);
  root.style.setProperty("--color-300g", color300g);
  root.style.setProperty("--color-300", color300);
  root.style.setProperty("--color-200", color200);
  root.style.setProperty("--color-100", color100);
  root.style.setProperty("--color-50", color50);
  root.style.setProperty("--color-0", color0);
  root.style.setProperty("--color-arrow-early", colorArrowEarly);
  root.style.setProperty("--arrow-early", colorArrowEarly);
  root.style.setProperty("--color-arrow-late", colorArrowLate);
  root.style.setProperty("--arrow-late", colorArrowLate);
  root.style.setProperty("--color-arrow-perfect", colorArrowPerfect);
  root.style.setProperty("--arrow-perfect", colorArrowPerfect);
  root.style.setProperty("--timing-window-opacity", TimingWindowOpacity.toString());
  root.style.setProperty("--timing-windows-opacity", TimingWindowOpacity.toString());
};
updateCSSLayout();
updateCSSColors();

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
function updateTimingWindowElements() {
  requestAnimationFrame(() => {
    const timingWindows = cache.timingWindows;
    const colorsContainer = getElement(".colors-container");
    if (colorsContainer) {
      colorsContainer.innerHTML = "";
    }
    let maxWindow = 0;
    timingWindows.forEach((width) => {
      if (width > maxWindow) maxWindow = width;
    });
    const containerWidth = Math.abs(maxWindow) * 4;
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

const calculateOsuWindows = (od, mods) => {
  const windows = /* @__PURE__ */ new Map();
  if (mods.includes("EZ")) {
    const modifiedOd = od / 2;
    windows.set("300", 50 - 3 * modifiedOd);
    windows.set("100", 140 - 8 * modifiedOd);
    windows.set("50", 200 - 10 * modifiedOd);
  } else if (mods.includes("HR")) {
    const modifiedOd = Math.min(od * 1.4, 10);
    windows.set("300", 50 - 3 * modifiedOd);
    windows.set("100", 140 - 8 * modifiedOd);
    windows.set("50", 200 - 10 * modifiedOd);
  } else {
    windows.set("300", 80 - 6 * od);
    windows.set("100", 140 - 8 * od);
    windows.set("50", 200 - 10 * od);
  }
  return windows;
};
const calculateTaikoWindows = (od, mods) => {
  const windows = /* @__PURE__ */ new Map();
  if (mods.includes("EZ")) {
    const modifiedOd = od / 2;
    windows.set("300", 50 - 3 * modifiedOd);
    if (od >= 5) {
      windows.set("100", 120 - 8 * modifiedOd);
      windows.set("50", 135 - 8 * modifiedOd);
    } else {
      windows.set("100", 110 - 6 * modifiedOd);
      windows.set("50", 120 - 5 * modifiedOd);
    }
  } else if (mods.includes("HR")) {
    const modifiedOd = Math.min(od * 1.4, 10);
    windows.set("300", 50 - 3 * modifiedOd);
    if (modifiedOd >= 5) {
      windows.set("100", 120 - 8 * modifiedOd);
      windows.set("50", 135 - 8 * modifiedOd);
    } else {
      windows.set("100", 110 - 6 * modifiedOd);
      windows.set("50", 120 - 5 * modifiedOd);
    }
  } else {
    windows.set("300", 50 - 3 * od);
    if (od >= 5) {
      windows.set("100", 120 - 8 * od);
      windows.set("50", 135 - 8 * od);
    } else {
      windows.set("100", 110 - 6 * od);
      windows.set("50", 120 - 5 * od);
    }
  }
  return windows;
};
const calculateManiaWindows = (od, mods) => {
  const windows = /* @__PURE__ */ new Map();
  if (mods.includes("EZ")) {
    const modifiedOd = od * 0.5;
    windows.set("300g", 22.5);
    windows.set("300", 64 - 3 * modifiedOd);
    windows.set("200", 97 - 3 * modifiedOd);
    windows.set("100", 127 - 3 * modifiedOd);
    windows.set("50", 151 - 3 * modifiedOd);
  } else if (mods.includes("HR")) {
    const windowMultiplier = 1.4;
    windows.set("300g", 11.43);
    windows.set("300", (64 - 3 * od) / windowMultiplier);
    windows.set("200", (97 - 3 * od) / windowMultiplier);
    windows.set("100", (127 - 3 * od) / windowMultiplier);
    windows.set("50", (151 - 3 * od) / windowMultiplier);
  } else {
    windows.set("300g", 16.5);
    windows.set("300", 64 - 3 * od);
    windows.set("200", 97 - 3 * od);
    windows.set("100", 127 - 3 * od);
    windows.set("50", 151 - 3 * od);
  }
  return windows;
};
const calculateTimingWindows = (gamemode, od, mods, customTimingWindows) => {
  if (customTimingWindows) {
    const values = customTimingWindows.split(",").map((v) => Number.parseFloat(v.trim()));
    const windows = /* @__PURE__ */ new Map();
    if (gamemode === "mania") {
      const grades = ["300g", "300", "200", "100", "50"];
      grades.forEach((grade, idx) => {
        if (idx < values.length) {
          windows.set(grade, values[idx]);
        }
      });
    } else {
      const grades = ["300", "100", "50"];
      grades.forEach((grade, idx) => {
        if (idx < values.length) {
          windows.set(grade, values[idx]);
        }
      });
    }
    return windows;
  }
  switch (gamemode) {
    case "osu":
      return calculateOsuWindows(od, mods);
    case "fruits":
      console.warn("timing windows for fruits is not applicable");
      return /* @__PURE__ */ new Map();
    case "taiko":
      return calculateTaikoWindows(od, mods);
    case "mania":
      return calculateManiaWindows(od, mods);
    default:
      console.warn("no gamemode detected, returning no windows");
      return /* @__PURE__ */ new Map();
  }
};

let areTicksRendered = false;
const renderTicksOnLoad = () => {
  if (areTicksRendered) return;
  const container = getElement(".tick-container");
  if (!container) {
    console.error("Tick container not found!");
    return;
  }
  const fragment = document.createDocumentFragment();
  const elementsForPool = [];
  for (let i = 0; i < cache.tickPool.poolSize; i++) {
    const div = document.createElement("div");
    div.className = "tick inactive";
    div.style.transform = "translate3d(0px, 0px, 0px)";
    fragment.appendChild(div);
    elementsForPool.push(div);
  }
  container.appendChild(fragment);
  cache.tickPool.setElements(elementsForPool);
  areTicksRendered = true;
};

const arrow = getElement(".arrow");
const getArrowColor = (average) => {
  const absError = Math.abs(average);
  if (absError <= settings.perfectArrowThreshold) {
    return "var(--arrow-perfect)";
  }
  if (average < 0) {
    return "var(--arrow-early)";
  }
  return "var(--arrow-late)";
};
let oldPosition = 0;
let pendingPosition = null;
let rAF = null;
const updateArrow = (targetPosition) => {
  pendingPosition = targetPosition;
  if (rAF === null) {
    rAF = requestAnimationFrame(() => {
      if (pendingPosition !== null && pendingPosition !== oldPosition) {
        oldPosition = pendingPosition;
        if (arrow) {
          arrow.style.borderTopColor = getArrowColor(oldPosition);
          arrow.style.transform = `translate3d(${oldPosition * 2}px, 0px, 0px)`;
        }
      }
      rAF = null;
      pendingPosition = null;
    });
  }
};
function resetArrow() {
  if (rAF !== null) {
    cancelAnimationFrame(rAF);
    rAF = null;
    pendingPosition = null;
  }
  requestAnimationFrame(() => {
    oldPosition = 0;
    if (arrow) {
      arrow.style.borderTopColor = "#fff";
      arrow.style.transform = "translate3d(0px, 0px, 0px)";
    }
  });
}

class TickImpl {
  position;
  classNames;
  active;
  timestamp;
  // timestamp in milliseconds
  element;
  // Added element property
  lastAppliedX;
  // Track last applied X for optimization
  _currentAnimation = null;
  constructor() {
    this.position = 0;
    this.classNames = "tick inactive";
    this.active = false;
    this.timestamp = Date.now();
    this.element = null;
    this.lastAppliedX = Number.NaN;
  }
  // Instance methods
  reset() {
    this._currentAnimation?.cancel();
    if (this.element) {
      this.element.style.opacity = "0";
    }
    this.position = 0;
    this.classNames = "tick inactive";
    this.active = false;
    this.timestamp = Date.now();
    this.updateElement();
  }
  setActive(hitError) {
    this._currentAnimation?.cancel();
    if (this.element) {
      this.element.style.opacity = String(settings.tickOpacity);
      this.element.style.visibility = "visible";
      this._currentAnimation = this.element.animate([{ opacity: settings.tickOpacity }, { opacity: 0 }], {
        duration: settings.fadeOutDuration,
        delay: settings.tickDuration,
        easing: "linear",
        fill: "forwards"
      });
    }
    this.position = hitError * 2;
    this.active = true;
    this.timestamp = Date.now();
    this.setClassNames();
  }
  setInactive() {
    if (this.active) {
      this._currentAnimation?.cancel();
      if (this.element) {
        this.element.style.opacity = "0";
        this.element.style.visibility = "hidden";
      }
      this.active = false;
      this.classNames = "tick inactive";
      this.timestamp = 0;
      this.updateElement();
    }
  }
  resetActive(hitError) {
    this._currentAnimation?.cancel();
    if (this.element) {
      this.element.style.opacity = String(settings.tickOpacity);
      this.element.style.visibility = "visible";
      this._currentAnimation = this.element.animate([{ opacity: settings.tickOpacity }, { opacity: 0 }], {
        duration: settings.fadeOutDuration,
        delay: settings.tickDuration,
        easing: "linear",
        fill: "forwards"
      });
    }
    this.position = hitError * 2;
    this.timestamp = Date.now();
    this.setClassNames();
  }
  setClassNames() {
    const { timingWindows} = cache;
    let newClassNames = "tick";
    const hitError = Math.abs(this.position / 2);
    let matched = false;
    for (const [grade, range] of timingWindows) {
      if (hitError <= range) {
        newClassNames += ` _${String(grade)}`;
        matched = true;
        break;
      }
    }
    if (!matched) {
      newClassNames += " _0";
    }
    if (this.classNames !== newClassNames) {
      this.classNames = newClassNames;
      this.updateElement();
    } else {
      this.updateElement();
    }
  }
  // New method to handle DOM updates
  updateElement() {
    if (!this.element) return;
    if (this.element.className !== this.classNames) {
      this.element.className = this.classNames;
    }
    const targetX = this.active ? this.position : 0;
    if (targetX !== this.lastAppliedX) {
      const newTransform = `translate3d(${targetX}px, 0px, 0px)`;
      if (this.element.style.transform !== newTransform) {
        this.element.style.transform = newTransform;
      }
      this.lastAppliedX = targetX;
    }
  }
}
class TickManager {
  poolSize;
  processedHits;
  pool;
  // readonly doesnt prevent us from modifying the array, only from reassigning it
  activeTicks = /* @__PURE__ */ new Set();
  // Store indices of active ticks'
  nonFadeOutTicks = /* @__PURE__ */ new Set();
  // Store indices of visible ticks
  constructor() {
    this.poolSize = 100;
    this.processedHits = 0;
    this.pool = Array.from({ length: this.poolSize }, () => new TickImpl());
  }
  // New method to assign elements
  setElements(elements) {
    if (elements.length !== this.poolSize) {
      console.error(
        `TickPool Error: Element count (${elements.length}) does not match PoolSize (${this.poolSize}).`
      );
      return;
    }
    for (let i = 0; i < this.poolSize; i++) {
      this.pool[i].element = elements[i];
      this.pool[i].reset();
    }
    console.log("Tick elements assigned to TickPool.");
  }
  set() {
    for (const tick of this.pool) {
      tick.reset();
    }
    this.activeTicks.clear();
    this.nonFadeOutTicks.clear();
    this.processedHits = 0;
  }
  update(hitErrors) {
    const now = Date.now();
    const { tickDuration, fadeOutDuration } = settings;
    const timeoutThreshold = tickDuration + fadeOutDuration;
    const { rate } = cache;
    const poolSize = this.poolSize;
    const pool = this.pool;
    const activeTicks = this.activeTicks;
    const nonFadeOutTicks = this.nonFadeOutTicks;
    const processedHits = this.processedHits;
    for (const idx of activeTicks) {
      const tick = pool[idx];
      if (now - tick.timestamp > timeoutThreshold) {
        tick.setInactive();
        activeTicks.delete(idx);
      }
    }
    for (const idx of nonFadeOutTicks) {
      const tick = pool[idx];
      if (now - tick.timestamp > tickDuration) {
        nonFadeOutTicks.delete(idx);
      }
    }
    if (processedHits === hitErrors.length) return;
    for (let i = processedHits; i < hitErrors.length; i++) {
      const poolIndex = i % poolSize;
      const error = hitErrors[i] / rate;
      const tick = pool[poolIndex];
      if (!tick.active) {
        tick.setActive(error);
        activeTicks.add(poolIndex);
        nonFadeOutTicks.add(poolIndex);
        this.processedHits++;
      } else {
        const processedHitsindex = processedHits - 1;
        if (i > processedHitsindex) {
          if (activeTicks.has(poolIndex)) {
            tick.setInactive();
            tick.setActive(error);
          } else {
            tick.resetActive(error);
          }
          nonFadeOutTicks.add(poolIndex);
          this.processedHits++;
        }
      }
    }
  }
}

const reset = () => {
  requestAnimationFrame(() => {
    cache.tickPool.set();
    resetArrow();
    console.log("[Main] reset");
  });
};

let medianBuffer = new Array(200);
const median = (arr) => {
  if (!arr || arr.length === 0) return 0;
  if (medianBuffer.length < arr.length) {
    medianBuffer = new Array(arr.length * 2);
  }
  for (let i = 0; i < arr.length; i++) {
    medianBuffer[i] = arr[i];
  }
  medianBuffer.length = arr.length;
  medianBuffer.sort((a, b) => a - b);
  const middle = Math.floor(medianBuffer.length / 2);
  if (medianBuffer.length % 2 === 0) {
    return (medianBuffer[middle - 1] + medianBuffer[middle]) / 2;
  }
  return medianBuffer[middle];
};

if (window.self === window.top && !window.obsstudio) {
  document.body.style.backgroundColor = "black";
}
window?.addEventListener("load", renderTicksOnLoad);
const cache = {
  mode: "",
  mods: "",
  // mod names concatenated as string
  od: 0,
  rate: 0,
  state: "",
  timingWindows: /* @__PURE__ */ new Map(),
  // same can't be said here, since mania has 5 timing windows, while all taiko and standard have 3
  tickPool: new TickManager(),
  firstObjectTime: 0,
  isReset: true
};
const DEFAULT_HOST = window.location.host;
const wsManager = new WebSocketManager(DEFAULT_HOST);
const SETTINGS_LOG_PREFIX = "[SETTINGS]";
console.log(`${SETTINGS_LOG_PREFIX} Requesting settings for path`, window?.COUNTER_PATH);
wsManager.sendCommand("getSettings", encodeURI(window.COUNTER_PATH));
wsManager.commands((data) => {
  try {
    const { command, message } = data;
    console.log("[WEBSOCKET] Received command:", command, "with data:", message);
    if (command === "getSettings") {
      console.log(`${SETTINGS_LOG_PREFIX} Received settings payload`);
      updateSettings(message);
    }
  } catch (error) {
    console.error("[MESSAGE_ERROR] Error processing WebSocket message:", error);
  }
});
const apiV2Filters = [
  { field: "state", keys: ["name"] },
  {
    field: "play",
    keys: [
      { field: "mode", keys: ["name"] },
      { field: "mods", keys: ["name", "rate"] }
    ]
  },
  {
    field: "beatmap",
    keys: [
      { field: "mode", keys: ["name"] },
      { field: "stats", keys: [{ field: "od", keys: ["original"] }] },
      { field: "time", keys: ["firstObject"] }
    ]
  }
];
wsManager.api_v2((data) => {
  if (cache.state !== data.state.name) {
    cache.state = data.state.name;
    const modeChanged = cache.mode !== data.play.mode.name;
    const odChanged = cache.od !== data.beatmap.stats.od.original;
    const modsChanged = cache.mods !== data.play.mods.name;
    cache.rate = data.play.mods.rate;
    if (cache.state === "play") {
      if (modeChanged || odChanged || modsChanged) {
        cache.mode = data.beatmap.mode.name;
        cache.od = data.beatmap.stats.od.original;
        cache.mods = data.play.mods.name;
      }
      cache.firstObjectTime = data.beatmap.time.firstObject;
      const custom = settings.useCustomTimingWindows ? settings.customTimingWindows : void 0;
      cache.timingWindows = calculateTimingWindows(cache.mode, cache.od, cache.mods, custom);
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
const nonFadeOutErrors = [];
wsManager.api_v2_precise((data) => {
  const { hitErrors, currentTime } = data;
  if (currentTime < cache.firstObjectTime) {
    if (!cache.isReset) {
      reset();
      cache.isReset = true;
    }
  } else {
    cache.tickPool.update(hitErrors);
    nonFadeOutErrors.length = 0;
    for (const idx of cache.tickPool.nonFadeOutTicks) {
      nonFadeOutErrors.push(cache.tickPool.pool[idx].position >> 1);
    }
    const medianError = median(nonFadeOutErrors);
    updateArrow(medianError);
    if (cache.isReset) {
      cache.isReset = false;
    }
  }
}, apiV2PreciseFilter);
