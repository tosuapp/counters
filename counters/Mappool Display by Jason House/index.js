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

  if (skill) {
    const skillText = document.createElement('div');
    skillText.className = 'skill-text';
    skillText.textContent = skill;
    block.append(modBox, skillText);
  } else {
    block.appendChild(modBox);
  }

  container.appendChild(block);
}

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
  Object.entries(MOD_NAME_MAP).map(([k, v]) => [v.toLowerCase(), k])
);

const socket = new WebSocketManager(window.location.host);
const modParam = getURLParam('mod');
const container = document.getElementById('mod-info');
let modRenderedFromURL = false;

function buildIndexes(settingsData) {
  const idIndex = Object.create(null);
  const modIndex = Object.create(null);

  for (const mod of Object.keys(settingsData)) {
    modIndex[mod] = settingsData[mod];
    settingsData[mod].forEach((entry, i) => {
      if (entry.id) idIndex[entry.id] = { mod, index: i, skill: entry.skill };
    });
  }
  return { idIndex, modIndex };
}

socket.sendCommand("getSettings", encodeURI(window.COUNTER_PATH));

socket.commands((data) => {
  try {
    const { command, message } = data;

    if (command === "getSettings") {
      const settingsData = {
        nomod: parseModData(message.nomod),
        hidden: parseModData(message.hidden),
        hardrock: parseModData(message.hardrock),
        doubletime: parseModData(message.doubletime),
        freemod: parseModData(message.freemod),
        mixedmod: parseModData(message.mixedmod),
        tiebreaker: parseModData(message.tiebreaker),
      };

      const { idIndex, modIndex } = buildIndexes(settingsData);

      if (modParam) {
        const modMatch = modParam.toLowerCase().match(/^([a-z]+)(\d+)$/);
        if (modMatch) {
          const shortMod = modMatch[1];
          const idx = parseInt(modMatch[2], 10) - 1;
          const originalMod = MOD_ALIAS_MAP[shortMod];
          if (originalMod && !Number.isNaN(idx)) {
            const entry = modIndex[originalMod]?.[idx];
            if (entry) {
              const displayMod = MOD_NAME_MAP[originalMod] || originalMod;
              renderModBox(container, displayMod, idx + 1, entry.skill);
              modRenderedFromURL = true;
            }
          }
        }
      }

		let lastBeatmapId = null;

		socket.api_v2(data => {
		  const id = data?.beatmap?.id;
		  if (!id || id === lastBeatmapId) return;

		  lastBeatmapId = id;

		  const hit = idIndex[id];
		  if (hit) {
			const displayMod = MOD_NAME_MAP[hit.mod.toLowerCase()] || hit.mod;
			renderModBox(container, displayMod, hit.index + 1, hit.skill);
			modRenderedFromURL = false;
		  }
		});
    }
  } catch (error) {
    console.error('Error handling settings data:', error);
  }
});

function parseModData(modData) {
  if (!modData) return [];

  if (typeof modData === 'string') {
    modData = modData.split('\n').filter(Boolean);
  }

  if (!Array.isArray(modData)) return [];

  return modData.map(item => {
    if (typeof item !== 'string') return null;
    const [id, skill] = item.split(',');
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) return null;
    return { id: parsedId, skill: skill || null };
  }).filter(Boolean);
}
