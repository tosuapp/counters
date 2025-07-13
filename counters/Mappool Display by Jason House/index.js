import WebSocketManager from './js/socket.js';

function getURLParam(k) {
  const p = new URL(window.location.href).searchParams;
  const t = k.toLowerCase();
  for (const [k2, v] of p.entries()) if (k2.toLowerCase() === t) return v;
  return null;
}

function clearContainer(c) {
  c.innerHTML = '';
  c.classList.add('hidden');
}

function renderModBox(c, mod, idx, skill) {
  clearContainer(c);
  c.classList.remove('hidden');
  const block = document.createElement('div');
  block.className = 'mod-block';
  const modBox = document.createElement('div');
  modBox.className = 'mod-box';
  modBox.dataset.mod = mod;
  modBox.textContent = `${mod}${idx}`;
  if (skill) {
    const st = document.createElement('div');
    st.className = 'skill-text';
    st.textContent = skill;
    block.append(modBox, st);
  } else block.appendChild(modBox);
  c.appendChild(block);
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
const MOD_ALIAS_MAP = Object.fromEntries(Object.entries(MOD_NAME_MAP).map(([k, v]) => [v.toLowerCase(), k]));
const KEYS = Object.keys(MOD_NAME_MAP);

const socket     = new WebSocketManager(window.location.host);
const modParam   = getURLParam('mod');
const container  = document.getElementById('mod-info');

function buildIndexes(setData) {
  const idIdx  = Object.create(null);
  const modIdx = Object.create(null);
  for (const m of KEYS) {
    modIdx[m] = setData[m];
    setData[m].forEach((e, i) => {
      if (e.id) idIdx[e.id] = { mod: m, index: i, skill: e.skill };
    });
  }
  return { idIdx, modIdx };
}

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));

socket.commands((d) => {
  try {
    if (d.command !== 'getSettings') return;

    const colors = {};
    const settingsData = {};
    KEYS.forEach(k => {
      colors[k] = d.message[`${k}color`];
      settingsData[k] = parseModData(d.message[k]);
    });

    const style = document.createElement('style');
    style.textContent = KEYS.filter(k => colors[k]).map(k => `.mod-box[data-mod="${MOD_NAME_MAP[k]}"]{color:${colors[k]};}`).join('');
    document.head.appendChild(style);

    const { idIdx, modIdx } = buildIndexes(settingsData);

    if (modParam) {
      const m = modParam.toLowerCase().match(/^([a-z]+)(\d+)$/);
      if (m) {
        const short = m[1];
        const i = parseInt(m[2], 10) - 1;
        const long = MOD_ALIAS_MAP[short];
        const e = modIdx[long]?.[i];
        if (e) renderModBox(container, MOD_NAME_MAP[long], i + 1, e.skill);
      }
    }

    let lastBeatmapId = null;
    socket.api_v2((p) => {
      try {
        const id = p?.beatmap?.id;
        if (!id || id === lastBeatmapId) return;
        lastBeatmapId = id;
        const hit = idIdx[id];
        if (hit) renderModBox(container, MOD_NAME_MAP[hit.mod], hit.index + 1, hit.skill);
        else clearContainer(container);
      } catch (e) { console.error(e); }
    }, [{ field: 'beatmap', keys: ['id'] }]);

	if (typeof socket.onClose === 'function') {
	  socket.onClose(() => {
		clearContainer(container);
		lastBeatmapId = null;
	  });
	}
  } catch (e) { console.error(e); }
});

function parseModData(md) {
  if (!md) return [];
  if (typeof md === 'string') md = md.split('\n').filter(Boolean);
  if (!Array.isArray(md)) return [];
  return md.map((l) => {
    if (typeof l !== 'string') return null;
    const [id, sk] = l.split(',');
    const t = id.trim();
    if (t.toLowerCase() === 'custom') return { id: 'custom', skill: sk?.trim() || null };
    const n = parseInt(t, 10);
    if (Number.isNaN(n)) return null;
    return { id: n, skill: sk?.trim() || null };
  }).filter(Boolean);
}
