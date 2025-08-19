const MOD_INDEX_PATTERN = /^([a-z]+)(\d+)$/;

const MOD_NAME_MAP = {
  nomod: 'NM',
  hidden: 'HD',
  hardrock: 'HR',
  doubletime: 'DT',
  freemod: 'FM',
  mixedmod: 'MM',
  tiebreaker: 'TB'
};

const MOD_ALIAS_MAP = Object.fromEntries(
  Object.entries(MOD_NAME_MAP).map(([longName, short]) => [short.toLowerCase(), longName])
);

const MOD_KEYS = Object.keys(MOD_NAME_MAP);

function getUrlParam(key) {
  const params = new URL(window.location.href).searchParams;
  const target = key.toLowerCase();
  for (const [k, v] of params.entries()) {
    if (k.toLowerCase() === target) return v;
  }
  return null;
}

function clearContainer(container) {
  container.innerHTML = '';
  container.classList.add('hidden');
}

function createModBlock(modShortLabel, index, skill) {
  const wrapper = document.createElement('div');
  wrapper.className = 'mod-block';

  const modBox = document.createElement('div');
  modBox.className = 'mod-box';
  modBox.dataset.mod = modShortLabel;
  modBox.textContent = `${modShortLabel}${index}`;

  wrapper.appendChild(modBox);

  if (skill) {
    const skillText = document.createElement('div');
    skillText.className = 'skill-text';
    skillText.textContent = skill;
    wrapper.appendChild(skillText);
  }

  return wrapper;
}

function mountModBlock(container, block) {
  clearContainer(container);
  container.classList.remove('hidden');
  container.appendChild(block);
}

function parseModLine(line) {
  if (typeof line !== 'string') return null;
  const [idPart, skillPart] = line.split(',');
  const trimmedId = idPart.trim();

  if (trimmedId.toLowerCase() === 'custom') {
    return { id: 'custom', skill: skillPart?.trim() || null };
  }
  const numericId = parseInt(trimmedId, 10);
  if (Number.isNaN(numericId)) return null;
  return { id: numericId, skill: skillPart?.trim() || null };
}

function parseModData(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') raw = raw.split('\n').filter(Boolean);
  if (!Array.isArray(raw)) return [];
  return raw.map(parseModLine).filter(Boolean);
}

function buildIndexes(setData) {
  const idIndex = Object.create(null);
  const modIndex = Object.create(null);

  for (const modKey of MOD_KEYS) {
    const list = setData[modKey] ?? [];
    modIndex[modKey] = list;

    list.forEach((entry, i) => {
      if (entry.id) {
        idIndex[entry.id] = { mod: modKey, index: i, skill: entry.skill };
      }
    });
  }
  return { idIndex, modIndex };
}

import WebSocketManager from './js/socket.js';

const socket = new WebSocketManager(window.location.host);
const modParam = getUrlParam('mod');
const container = document.getElementById('mod-info');

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));

socket.commands((data) => {
  try {
    if (data.command !== 'getSettings') return;

    const colors = {};
    const settingsData = {};
    MOD_KEYS.forEach((key) => {
      colors[key] = data.message[`${key}color`];
      settingsData[key] = parseModData(data.message[key]);
    });

    injectColorStyles(colors);

    const { idIndex, modIndex } = buildIndexes(settingsData);

    let paramFallback = null;
    if (modParam) {
      const match = modParam.toLowerCase().match(MOD_INDEX_PATTERN);
      if (match) {
        const [, short, idxRaw] = match;
        const idx = parseInt(idxRaw, 10) - 1;
        const long = MOD_ALIAS_MAP[short];
        if (long) {
          const entry = idIndex[Object.keys(idIndex).find(key => {
            const v = idIndex[key];
            return v.mod === long && v.index === idx;
          })];
          if (entry) {
            paramFallback = entry;
            const block = createModBlock(MOD_NAME_MAP[long], idx + 1, entry.skill);
            mountModBlock(container, block);
          }
        }
      }
    }

    setupBeatmapListener(socket, idIndex, container, paramFallback);
  } catch (err) {
    console.error(err);
  }
});

function injectColorStyles(colors) {
  const rules = MOD_KEYS.filter((k) => colors[k]).map((k) => `.mod-box[data-mod="${MOD_NAME_MAP[k]}"]{color:${colors[k]};}`).join('');

  if (rules) {
    const styleTag = document.createElement('style');
    styleTag.textContent = rules;
    document.head.appendChild(styleTag);
  }
}

function setupBeatmapListener(socketInstance, idIndex, uiContainer, paramFallback) {
  let lastBeatmapId = null;

  socketInstance.api_v2((payload) => {
    try {
      const id = payload?.beatmap?.id;
      if (!id || id === lastBeatmapId) return;
      lastBeatmapId = id;

      const hit = idIndex[id];
      if (hit) {
        const block = createModBlock(MOD_NAME_MAP[hit.mod], hit.index + 1, hit.skill);
        mountModBlock(uiContainer, block);
      } else if (paramFallback) {
        const block = createModBlock(MOD_NAME_MAP[paramFallback.mod], paramFallback.index + 1, paramFallback.skill);
        mountModBlock(uiContainer, block);
      } else {
        clearContainer(uiContainer);
      }
    } catch (err) {
      console.error(err);
    }
  }, [{ field: 'beatmap', keys: ['id'] }]);

  if (typeof socketInstance.onClose === 'function') {
    socketInstance.onClose(() => {
      clearContainer(uiContainer);
      lastBeatmapId = null;
    });
  }
}
