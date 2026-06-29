import WebSocketManager from './js/socket.js';

const socket = new WebSocketManager(window.location.host);
const accuracies = [100, 99, 98, 97, 96, 95];
const cache = {};
let hideModsPanelTask = null;
let activeBackgroundLayer = 0;
let backgroundRequestId = 0;

const modIconFiles = {
  AC: 'mod-accuracy-challenge.png',
  AD: 'mod-approach-different.png',
  AL: 'mod-alternate.png',
  AP: 'mod-autopilot.png',
  AS: 'mod-adaptive-speed.png',
  AT: 'mod-autoplay.png',
  BR: 'mod-barrel-roll.png',
  BL: 'mod-blinds.png',
  BM: 'mod-bloom.png',
  BU: 'mod-bubbles.png',
  CN: 'mod-cinema.png',
  CL: 'mod-classic.png',
  CO: 'mod-cover.png',
  CS: 'mod-constant-speed.png',
  DA: 'mod-difficulty-adjust.png',
  DC: 'mod-daycore.png',
  DF: 'mod-deflate.png',
  DP: 'mod-depth.png',
  DS: 'mod-dual-stages.png',
  DT: 'mod-double-time.png',
  EZ: 'mod-easy.png',
  FI: 'mod-fade-in.png',
  FL: 'mod-flashlight.png',
  FF: 'mod-floating-fruits.png',
  FR: 'mod-freeze-frame.png',
  GR: 'mod-grow.png',
  HD: 'mod-hidden.png',
  HO: 'mod-hold-off.png',
  HR: 'mod-hard-rock.png',
  HT: 'mod-half-time.png',
  IN: 'mod-invert.png',
  MF: 'mod-moving-fast.png',
  MG: 'mod-magnetised.png',
  MR: 'mod-mirror.png',
  MU: 'mod-muted.png',
  NC: 'mod-nightcore.png',
  NF: 'mod-no-fail.png',
  NR: 'mod-no-release.png',
  NS: 'mod-no-scope.png',
  PF: 'mod-perfect.png',
  RD: 'mod-random.png',
  RX: 'mod-relax.png',
  RP: 'mod-repel.png',
  SI: 'mod-spin-in.png',
  SD: 'mod-sudden-death.png',
  SG: 'mod-single-tap.png',
  SO: 'mod-spun-out.png',
  SR: 'mod-simplified-rhythm.png',
  ST: 'mod-strict-tracking.png',
  SV2: 'mod-score-v2.png',
  SW: 'mod-swap.png',
  SY: 'mod-synesthesia.png',
  TC: 'mod-traceable.png',
  TD: 'mod-touch-device.png',
  TP: 'mod-target-practice.png',
  TR: 'mod-transform.png',
  WG: 'mod-wiggle.png',
  WU: 'mod-wind-up.png',
  WD: 'mod-wind-down.png',
  '1K': 'mod-one-key.png',
  '2K': 'mod-two-keys.png',
  '3K': 'mod-three-keys.png',
  '4K': 'mod-four-keys.png',
  '5K': 'mod-five-keys.png',
  '6K': 'mod-six-keys.png',
  '7K': 'mod-seven-keys.png',
  '8K': 'mod-eight-keys.png',
  '9K': 'mod-nine-keys.png',
  '10K': 'mod-ten-keys.png',
};

const elements = {
  backgroundLayers: [
    document.getElementById('beatmap-background-a'),
    document.getElementById('beatmap-background-b'),
  ],
  title: document.getElementById('song-title'),
  artist: document.getElementById('artist'),
  songTitleText: document.getElementById('song-title-text'),
  difficulty: document.getElementById('difficulty-version'),
  mapper: document.getElementById('mapper'),
  starRating: document.getElementById('star-rating'),
  bpm: document.getElementById('bpm'),
  songLength: document.getElementById('song-length'),
  ar: document.getElementById('approach-rate'),
  od: document.getElementById('overall-difficulty'),
  hp: document.getElementById('hp-drain'),
  modsPanel: document.getElementById('mods-panel'),
  modsList: document.getElementById('mods-list'),
};

const formatPP = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return Math.round(value).toString();
};

const formatNumber = (value, decimals = 1) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--';
  }

  return value.toFixed(decimals).replace(/\.0$/, '');
};

const formatTime = (milliseconds) => {
  if (typeof milliseconds !== 'number' || Number.isNaN(milliseconds) || milliseconds <= 0) {
    return '--';
  }

  const totalSeconds = Math.round(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const setText = (element, value) => {
  if (element.textContent === value) {
    return;
  }

  element.textContent = value;
  element.classList.remove('is-updating');
  requestAnimationFrame(() => element.classList.add('is-updating'));
};

const scheduleTitleOverflowUpdate = () => {
  requestAnimationFrame(updateTitleOverflow);
};

const updateTitleOverflow = () => {
  const title = elements.title;
  const mask = title.parentElement;
  const overflow = title.scrollWidth - mask.clientWidth;

  title.classList.toggle('is-overflowing', overflow > 0);
  title.style.setProperty('--marquee-distance', `${Math.max(overflow, 0)}px`);
  title.style.setProperty('--marquee-duration', `${Math.max(16, overflow / 24)}s`);
};

const updateBeatmap = (beatmap) => {
  if (!beatmap) {
    return;
  }

  const title = beatmap.title || beatmap.titleUnicode || 'Unknown title';
  const artist = beatmap.artist || beatmap.artistUnicode || 'Unknown artist';

  setText(elements.artist, artist);
  setText(elements.songTitleText, title);
  setText(elements.difficulty, beatmap.version || '--');
  setText(elements.mapper, beatmap.mapper || '--');
  scheduleTitleOverflowUpdate();
};

const updateStats = (beatmap) => {
  const stats = beatmap?.stats;
  const time = beatmap?.time;

  setText(elements.starRating, formatNumber(stats?.stars?.total, 2));
  setText(elements.bpm, formatNumber(stats?.bpm?.realtime ?? stats?.bpm?.common, 0));
  setText(elements.songLength, formatTime(time?.mp3Length ?? time?.lastObject));
  setText(elements.ar, formatNumber(stats?.ar?.converted));
  setText(elements.od, formatNumber(stats?.od?.converted));
  setText(elements.hp, formatNumber(stats?.hp?.converted));
};

const getBackgroundPath = (folders, files) => {
  if (!folders?.beatmap || !files?.background) {
    return '';
  }

  return `/files/beatmap/${encodeURI(`${folders.beatmap}/${files.background}`)}`;
};

const updateBackground = (folders, files) => {
  const backgroundPath = getBackgroundPath(folders, files);

  if (cache.backgroundPath === backgroundPath) {
    return;
  }

  cache.backgroundPath = backgroundPath;
  backgroundRequestId += 1;
  const requestId = backgroundRequestId;

  if (!backgroundPath) {
    for (const layer of elements.backgroundLayers) {
      layer.classList.remove('is-active');
      layer.style.backgroundImage = '';
    }
    return;
  }

  const image = new Image();
  image.onload = () => {
    if (requestId !== backgroundRequestId) {
      return;
    }

    activeBackgroundLayer = activeBackgroundLayer === 0 ? 1 : 0;

    const activeLayer = elements.backgroundLayers[activeBackgroundLayer];
    const previousLayer = elements.backgroundLayers[activeBackgroundLayer === 0 ? 1 : 0];

    activeLayer.style.backgroundImage = `url("${backgroundPath}")`;
    activeLayer.classList.add('is-active');
    previousLayer.classList.remove('is-active');
  };
  image.src = backgroundPath;
};

const getActiveMods = (mods) => {
  const modsArray = Array.isArray(mods?.array) ? mods.array : [];

  return modsArray
    .map((mod) => mod?.acronym)
    .filter((acronym) => acronym && acronym !== 'NM');
};

const updateMods = (mods) => {
  const activeMods = getActiveMods(mods);
  const signature = activeMods.join(',');

  if (cache.mods === signature) {
    return;
  }

  cache.mods = signature;

  if (hideModsPanelTask) {
    clearTimeout(hideModsPanelTask);
    hideModsPanelTask = null;
  }

  if (activeMods.length === 0) {
    elements.modsPanel.classList.add('is-hiding');
    hideModsPanelTask = setTimeout(() => {
      if (cache.mods === '') {
        elements.modsPanel.classList.add('is-hidden');
      }
    }, 180);
    return;
  }

  elements.modsPanel.classList.remove('is-hidden');
  elements.modsPanel.classList.add('is-hiding');
  elements.modsList.replaceChildren();

  for (const acronym of activeMods) {
    const iconFile = modIconFiles[acronym];

    if (!iconFile) {
      continue;
    }

    const image = document.createElement('img');
    image.className = 'mod-icon';
    image.src = `assets/mods/${iconFile}`;
    image.alt = acronym;
    elements.modsList.appendChild(image);
  }

  requestAnimationFrame(() => elements.modsPanel.classList.remove('is-hiding'));
};

const updatePPValues = (accuracyValues) => {
  for (const accuracy of accuracies) {
    const value = accuracyValues?.[accuracy];

    if (cache[accuracy] === value) {
      continue;
    }

    cache[accuracy] = value;
    setText(document.getElementById(`pp-${accuracy}`), formatPP(value));
  }
};

socket.api_v2((data) => {
  updateBeatmap(data.beatmap);
  updateStats(data.beatmap);
  updateMods(data.play?.mods);
  updateBackground(data.folders, data.files);
  updatePPValues(data.performance?.accuracy);
}, [
  {
    field: 'beatmap',
    keys: [
      'artist',
      'artistUnicode',
      'title',
      'titleUnicode',
      'version',
      'mapper',
      {
        field: 'time',
        keys: ['mp3Length', 'lastObject']
      },
      {
        field: 'stats',
        keys: [
          {
            field: 'stars',
            keys: ['total']
          },
          {
            field: 'bpm',
            keys: ['realtime', 'common']
          },
          {
            field: 'ar',
            keys: ['converted']
          },
          {
            field: 'od',
            keys: ['converted']
          },
          {
            field: 'hp',
            keys: ['converted']
          }
        ]
      }
    ]
  },
  {
    field: 'play',
    keys: [
      {
        field: 'mods',
        keys: ['array']
      }
    ]
  },
  {
    field: 'folders',
    keys: ['beatmap']
  },
  {
    field: 'files',
    keys: ['background']
  },
  {
    field: 'performance',
    keys: [
      {
        field: 'accuracy',
        keys: ['100', '99', '98', '97', '96', '95']
      }
    ]
  }
]);

window.addEventListener('resize', scheduleTitleOverflowUpdate);
