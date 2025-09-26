import WebSocketManager from "./js/socket.js";

// no touch unless you know what you are doing.
// if you need or want to touch it but you dont understand code:
// ask ChatGPT
const DEFAULT_MODE_KEY = "osu";

const MODE_CONFIG = {
  osu: {
    displayName: "osu",
    judgements: [
      { key: "300", label: "Great", subtitle: "300", tone: "#d0bcff" },
      { key: "100", label: "Good", subtitle: "100", tone: "#b69df8" },
      { key: "50", label: "Meh", subtitle: "50", tone: "#a48cf1" },
      { key: "0", label: "Miss", subtitle: "Miss", tone: "#ffb4ab" },
    ],
  },
  taiko: {
    displayName: "taiko",
    judgements: [
      { key: "300", label: "Great", subtitle: "300", tone: "#ffb59c" },
      { key: "100", label: "Good", subtitle: "100", tone: "#ffceb3" },
      { key: "0", label: "Miss", subtitle: "Miss", tone: "#ffd9ce" },
    ],
  },
  fruits: {
    displayName: "fruits",
    judgements: [
      { key: "300", label: "Fruit", subtitle: "300", tone: "#8ae1b7" },
      { key: "100", label: "Droplet", subtitle: "100", tone: "#a4edc9" },
      { key: "50", label: "Tiny", subtitle: "50", tone: "#c1f6dc" },
      { key: "0", label: "Miss", subtitle: "Miss", tone: "#ffcfdb" },
    ],
  },
  mania: {
    displayName: "mania",
    judgements: [
      { key: "geki", label: "MAX", subtitle: "320", tone: "#9ce0ff" },
      { key: "300", label: "Perfect", subtitle: "300", tone: "#7bd5ff" },
      { key: "katu", label: "Great", subtitle: "200", tone: "#63c4ff" },
      { key: "100", label: "Good", subtitle: "100", tone: "#5cb3ff" },
      { key: "50", label: "Meh", subtitle: "50", tone: "#7c9bff" },
      { key: "0", label: "Miss", subtitle: "Miss", tone: "#ffbac7" },
    ],
  },
};

const socket = new WebSocketManager(window.location.host);

const widget = document.getElementById("judgementWidget");
const modeTitleEl = document.getElementById("modeTitle");
const judgementList = document.getElementById("judgementList");
const accuracyEl = document.getElementById("accuracy");
const comboEl = document.getElementById("combo");
const ppEl = document.getElementById("pp");

if (!widget || !modeTitleEl || !judgementList || !accuracyEl || !comboEl || !ppEl) {
  console.warn("Judgement widget: missing required DOM nodes.");
}

let activeModeKey = DEFAULT_MODE_KEY;
let activeModeConfig = MODE_CONFIG[DEFAULT_MODE_KEY];

const judgementCounters = new Map();
const cache = {
  mode: "",
  accuracy: null,
  combo: null,
  pp: null,
  judgements: Object.create(null),
  stateNumber: null,
};

const counters = {
  accuracy: createValueCounter(accuracyEl, {
    decimals: 2,
    options: { suffix: "%", useGrouping: false },
    format: formatAccuracy,
  }),
  combo: createValueCounter(comboEl, {
    decimals: 0,
    options: { suffix: "x", useGrouping: true },
    format: formatCombo,
  }),
  pp: createValueCounter(ppEl, {
    decimals: 0,
    options: { useGrouping: true, separator: " " },
    format: formatInteger,
  }),
};

initializeWidget();

socket.api_v2((data) => {
  try {
    applyMode(data?.play?.mode?.name);
    updateVisibility(data);
    updateJudgements(data);
    updateStats(data);
  } catch (error) {
    console.error(error);
  }
});

function initializeWidget() {
  applyMode(activeModeKey);
  counters.accuracy.update(0);
  counters.combo.update(0);
  counters.pp.update(0);
  widget?.classList.remove("is-visible");
}

function applyMode(rawModeKey) {
  const key = resolveModeKey(rawModeKey);
  const config = MODE_CONFIG[key];

  updateModeTitle(config, rawModeKey, key);

  if (activeModeKey !== key) {
    widget?.classList.remove(`mode-${activeModeKey}`);
    widget?.classList.add(`mode-${key}`);
    activeModeKey = key;
  }

  if (cache.mode === key) {
    activeModeConfig = config;
    return;
  }

  activeModeConfig = config;
  cache.mode = key;
  cache.judgements = Object.create(null);
  buildJudgementList(config);
}

function updateModeTitle(config, rawModeKey, fallbackKey) {
  if (!modeTitleEl) {
    return;
  }

  const label = resolveModeLabel(config, rawModeKey, fallbackKey);
  modeTitleEl.textContent = `${label} judgements`;
}

function resolveModeLabel(config, rawModeKey, fallbackKey) {
  const fromConfig = typeof config?.displayName === "string" ? config.displayName.trim() : "";
  if (fromConfig) {
    return fromConfig;
  }

  const fromRaw = typeof rawModeKey === "string" ? rawModeKey.trim() : "";
  if (fromRaw) {
    return fromRaw;
  }

  return fallbackKey;
}

function buildJudgementList(config) {
  if (!judgementList) {
    return;
  }

  judgementCounters.clear();

  const judgements = Array.isArray(config?.judgements) ? config.judgements : [];
  const fragment = document.createDocumentFragment();

  judgements.forEach((judgement) => {
    const { item, valueElement } = createJudgementItem(judgement);
    fragment.append(item);

    const counter = createValueCounter(valueElement, {
      decimals: 0,
      options: { useGrouping: true },
      format: formatInteger,
    });

    counter.update(cache.judgements[judgement.key] ?? 0);
    judgementCounters.set(judgement.key, counter);
  });

  judgementList.replaceChildren(fragment);

  if (widget) {
    widget.dataset.judgementCount = String(judgements.length);
  }
}

function updateJudgements(data) {
  if (!activeModeConfig || !Array.isArray(activeModeConfig.judgements)) {
    return;
  }

  const hits = data?.play?.hits ?? {};

  activeModeConfig.judgements.forEach(({ key }) => {
    const value = getHitValue(hits, key);

    if (cache.judgements[key] === value) {
      return;
    }

    cache.judgements[key] = value;

    const counter = judgementCounters.get(key);
    counter?.update(value);
  });
}

function updateStats(data) {
  const accuracyValue = clampNumber(data?.play?.accuracy, 0, 100);
  if (accuracyValue !== null && accuracyValue !== cache.accuracy) {
    cache.accuracy = accuracyValue;
    counters.accuracy.update(accuracyValue);
  }

  const comboValue = clampNumber(data?.play?.combo?.current, 0);
  if (comboValue !== null && comboValue !== cache.combo) {
    cache.combo = comboValue;
    counters.combo.update(comboValue);
  }

  const ppRaw = clampNumber(data?.play?.pp?.current, 0);
  const ppValue = ppRaw !== null ? Math.round(ppRaw) : null;
  if (ppValue !== null && ppValue !== cache.pp) {
    cache.pp = ppValue;
    counters.pp.update(ppValue);
  }
}

function updateVisibility(data) {
  const stateNumber = data?.state?.number ?? null;

  if (stateNumber === cache.stateNumber) {
    return;
  }

  cache.stateNumber = stateNumber;

  widget?.classList.toggle("is-visible", stateNumber === 2);
}

function resolveModeKey(modeKey) {
  return Object.prototype.hasOwnProperty.call(MODE_CONFIG, modeKey)
    ? modeKey
    : DEFAULT_MODE_KEY;
}

function createJudgementItem(judgement) {
  const item = document.createElement("div");
  item.className = "judgement";
  if (judgement?.key) {
    item.dataset.key = judgement.key;
  }

  const left = document.createElement("div");
  left.className = "judgement-left";

  const dot = document.createElement("span");
  dot.className = "judgement-dot";
  if (judgement?.tone) {
    dot.style.setProperty("--tone", judgement.tone);
  }

  const text = document.createElement("div");
  text.className = "judgement-text";

  const label = document.createElement("span");
  label.className = "judgement-label";
  label.textContent = judgement?.label ?? "";

  const sub = document.createElement("span");
  sub.className = "judgement-sub";
  sub.textContent = judgement?.subtitle ?? "";

  text.append(label, sub);
  left.append(dot, text);

  const valueElement = document.createElement("span");
  valueElement.className = "judgement-value";
  valueElement.textContent = "0";

  item.append(left, valueElement);

  return { item, valueElement };
}

function createCounter(element, decimals, options = {}) {
  if (!element || typeof CountUp !== "function") {
    return null;
  }

  const counter = new CountUp(element, 0, 0, decimals, 0.4, {
    useEasing: true,
    useGrouping: true,
    separator: " ",
    decimal: ".",
    ...options,
  });

  if (counter.error) {
    console.error(counter.error);
    return null;
  }

  return counter;
}

function createValueCounter(element, config = {}) {
  if (!element) {
    return { update() {} };
  }

  const { decimals = 0, options = {}, format = formatInteger } = config;
  const counter = createCounter(element, decimals, options);

  return {
    update(value) {
      const safeValue = Number.isFinite(value) ? value : 0;

      if (counter) {
        counter.update(safeValue);
        return;
      }

      if (typeof format === "function") {
        element.textContent = format(safeValue);
      }
    },
  };
}

function getHitValue(hits, key) {
  if (!hits) {
    return 0;
  }

  if (key === "geki" || key === "katu") {
    return toSafeInteger(hits[key]);
  }

  const numericKey = Number(key);
  if (Number.isFinite(numericKey)) {
    return toSafeInteger(hits[key] ?? hits[numericKey]);
  }

  return toSafeInteger(hits[key]);
}

function clampNumber(value, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return null;
  }

  return Math.min(max, Math.max(min, num));
}

function toSafeInteger(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return 0;
  }

  return Math.max(0, Math.round(num));
}

function formatAccuracy(value) {
  return `${value.toFixed(2)}%`;
}

function formatCombo(value) {
  return `${Math.round(value)}x`;
}

function formatInteger(value) {
  return `${Math.round(value)}`;
}
