import WebSocketManager from './js/socket.js';

function getURLParam(key) {
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

function renderModBox(container, mod, index, skill) {
  clearContainer(container);
  container.classList.remove('hidden');

  const block = document.createElement('div');
  block.className = 'mod-block';

  const modBox = document.createElement('div');
  modBox.className = 'mod-box';
  modBox.dataset.mod = mod;
  modBox.textContent = `${mod}${index}`;

  const skillText = document.createElement('div');
  skillText.className = 'skill-text';
  skillText.textContent = skill;

  block.append(modBox, skillText);
  container.appendChild(block);
}

const socket   = new WebSocketManager(window.location.host);
const modParam = getURLParam('mod');
const container = document.getElementById('mod-info');

function buildIndexes(mapData) {
  const idIndex  = Object.create(null);
  const modIndex = Object.create(null);

  for (const mod of Object.keys(mapData)) {
    modIndex[mod] = mapData[mod];
    mapData[mod].forEach((entry, i) => {
      if (entry.id) idIndex[entry.id] = { mod, index: i, skill: entry.skill };
    });
  }
  return { idIndex, modIndex };
}

fetch('./amxmodx.json')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(mapData => {
    const { idIndex, modIndex } = buildIndexes(mapData);

    if (modParam) {
      const upper = modParam.toUpperCase();
      const mod   = upper.match(/[A-Z]+/)?.[0];
      const idx   = parseInt(upper.match(/\d+/)?.[0], 10) - 1;

      if (!mod || Number.isNaN(idx)) {
        clearContainer(container);
        return;
      }

      const entry = modIndex[mod]?.[idx];
      if (entry) {
        renderModBox(container, mod, idx + 1, entry.skill);
      } else {
        clearContainer(container);
      }
      return;    }

    let lastBeatmapId = null;

    socket.api_v2(data => {
      const id = data?.beatmap?.id;
      if (!id || id === lastBeatmapId) return;

      lastBeatmapId = id;

      const hit = idIndex[id];
      if (hit) {
        renderModBox(container, hit.mod, hit.index + 1, hit.skill);
      } else {
        clearContainer(container);
      }
    });
  })
  .catch(err => {
    console.error('Failed to load amxmodx.json:', err);
    if (container) {
      container.textContent = 'Failed to load JSON Mod';
      container.classList.remove('hidden');
    }
  });
