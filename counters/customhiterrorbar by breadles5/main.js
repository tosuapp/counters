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
  colorBar: "transparent",
  tickWidth: 0,
  tickHeight: 0,
  tickDuration: 0,
  tickOpacity: 0,
  fadeOutDuration: 0,
  arrowSize: 0,
  perfectArrowThreshold: 0,
  colorArrowEarly: "transparent",
  colorArrowLate: "transparent",
  colorArrowPerfect: "transparent",
  timingWindowHeight: 0,
  isRounded: 0,
  color300g: "transparent",
  color300: "transparent",
  color200: "transparent",
  color100: "transparent",
  color50: "transparent",
  color0: "transparent",
  showSD: false,
  disableHardwareAcceleration: false,
  useCustomTimingWindows: false,
  customTimingWindows: "16.5,64,97,127,151"
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
  const sanitize = (color) => color.toLowerCase() === "#000000" ? "transparent" : color;
  root.style.setProperty("--timing-windows-opacity", String(settings.TimingWindowOpacity));
  root.style.setProperty("--tick-opacity", String(settings.tickOpacity));
  root.style.setProperty("--color-300g", sanitize(settings.color300g));
  root.style.setProperty("--color-300", sanitize(settings.color300));
  root.style.setProperty("--color-200", sanitize(settings.color200));
  root.style.setProperty("--color-100", sanitize(settings.color100));
  root.style.setProperty("--color-50", sanitize(settings.color50));
  root.style.setProperty("--color-0", sanitize(settings.color0));
  root.style.setProperty("--arrow-early", sanitize(settings.colorArrowEarly));
  root.style.setProperty("--arrow-late", sanitize(settings.colorArrowLate));
  root.style.setProperty("--arrow-perfect", sanitize(settings.colorArrowPerfect));
  root.style.setProperty("--bar-color", sanitize(settings.colorBar));
};
const updateVisibility = () => {
  const sd = getElement(".sd");
  if (sd) {
    sd.style.display = settings.showSD ? "block" : "none";
  }
};

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
const { disableHardwareAcceleration } = settings;
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
    const initialTransform = disableHardwareAcceleration ? "translateX(0px)" : "translate3d(0px, 0px, 0px)";
    div.style.transform = initialTransform;
    fragment.appendChild(div);
    elementsForPool.push(div);
  }
  container.appendChild(fragment);
  cache.tickPool.setElements(elementsForPool);
  areTicksRendered = true;
  console.log(`Rendered and assigned ${elementsForPool.length} tick elements.`);
};
const resetTicks = () => {
  if (!areTicksRendered) return;
  cache.tickPool.set();
  console.log("TickPool reset triggered by resetTicks.");
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
const updateArrow = (targetPosition) => {
  requestAnimationFrame(() => {
    if (targetPosition === oldPosition) {
      return;
    }
    oldPosition = targetPosition;
    if (arrow) {
      arrow.style.borderTopColor = getArrowColor(targetPosition);
      if (settings.disableHardwareAcceleration) {
        arrow.style.transform = `translateX(${targetPosition * 2}px)`;
        return;
      }
      arrow.style.transform = `translate3d(${targetPosition * 2}px, 0px, 0px)`;
    }
  });
};
function resetArrow() {
  requestAnimationFrame(() => {
    oldPosition = 0;
    if (arrow) {
      arrow.style.borderTopColor = "#fff";
      if (settings.disableHardwareAcceleration) {
        arrow.style.transform = "translateX(0px)";
        return;
      }
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
      this._currentAnimation = this.element.animate(
        [
          { opacity: settings.tickOpacity },
          { opacity: 0 }
        ],
        {
          duration: settings.fadeOutDuration,
          delay: settings.tickDuration,
          easing: "linear",
          fill: "forwards"
        }
      );
    }
    this.position = hitError << 1;
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
      this._currentAnimation = this.element.animate(
        [
          { opacity: settings.tickOpacity },
          { opacity: 0 }
        ],
        {
          duration: settings.fadeOutDuration,
          delay: settings.tickDuration,
          easing: "linear",
          fill: "forwards"
        }
      );
    }
    this.position = hitError << 1;
    this.timestamp = Date.now();
    this.setClassNames();
  }
  setClassNames() {
    const { timingWindows } = cache;
    let newClassNames = "tick";
    const hitError = Math.abs(this.position >> 1);
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
      const newTransform = settings.disableHardwareAcceleration ? `translateX(${targetX}px)` : `translate3d(${targetX}px, 0px, 0px)`;
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
      console.error(`TickPool Error: Element count (${elements.length}) does not match PoolSize (${this.poolSize}).`);
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
if (settings.showSD) {
  const container = getElement("#container");
  if (container) {
    const sd = document.createElement("div");
    sd.classList.add("sd");
    sd.innerText = "0.00";
    container.prepend(sd);
  }
}
const apiV2Filters = [
  "state",
  { field: "play", keys: ["mode", "mods"] },
  { field: "beatmap", keys: ["mode", "stats", "time"] }
];
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
      cache.rate = data.play.mods.rate;
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
wsManager.api_v2_precise((data) => {
  const { hitErrors, currentTime } = data;
  if (currentTime < cache.firstObjectTime) {
    if (!cache.isReset) {
      reset();
      cache.isReset = true;
    }
  } else {
    cache.tickPool.update(hitErrors);
    const nonFadeOutErrors = [];
    for (const idx of cache.tickPool.nonFadeOutTicks) {
      nonFadeOutErrors.push(cache.tickPool.pool[idx].position >> 1);
    }
    const medianError = median(nonFadeOutErrors);
    updateArrow(medianError);
    if (settings.showSD) {
      requestAnimationFrame(() => {
        const standardDeviationError = standardDeviation(nonFadeOutErrors);
        const sdElement = getElement(".sd");
        if (sdElement) {
          sdElement.innerText = standardDeviationError.toFixed(2);
        }
      });
    }
    if (cache.isReset) {
      cache.isReset = false;
    }
  }
}, apiV2PreciseFilter);
