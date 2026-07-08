const HOST = window.location.host;
const IDLE_RESET_MS = 1000;
const Y_AXIS_STEP = 50;
const MIN_Y_MAX = 150;
const TIMELINE_FUTURE_PADDING = 0.15;
// Combined K1/K2 intervals count twice as many presses as the BPM convention osu! players expect.
const OSU_BPM_DIVISOR = 4;
const GAMEPLAY_STATE = 2;
const RESULTS_STATE = 7;
const GAMEPLAY_STATE_NAME = 'play';
const RESULTS_STATE_NAME = 'resultScreen';
// Keep websocket payloads small for tosu's contribution requirements and lower OBS/browser overhead.
const V2_FILTERS = [
  {
    field: 'state',
    keys: ['number', 'name'],
  },
  {
    field: 'beatmap',
    keys: [
      'checksum',
      'id',
      'set',
      'artist',
      'title',
      'version',
      {
        field: 'time',
        keys: ['live', 'current', 'full', 'mp3Length', 'lastObject'],
      },
    ],
  },
  {
    field: 'play',
    keys: [
      {
        field: 'mods',
        keys: ['rate'],
      },
    ],
  },
  {
    field: 'folders',
    keys: ['songs'],
  },
  {
    field: 'files',
    keys: ['beatmap'],
  },
  {
    field: 'directPath',
    keys: ['beatmapFile'],
  },
];
const PRECISE_FILTERS = [
  {
    field: 'keys',
    keys: [
      {
        field: 'k1',
        keys: ['count'],
      },
      {
        field: 'k2',
        keys: ['count'],
      },
    ],
  },
];
const config = {
  averageNotes: 5,
  timelineWindowSeconds: 15,
  yAxisHeadroomPercent: 4,
  yScaleExponent: 2,
  playerColor: '#34d399',
  perfectColor: '#facc15',
  progressColor: 'rgba(255, 255, 255, 0.42)',
  gridColor: 'rgba(255, 255, 255, 0.11)',
  axisColor: 'rgba(255, 255, 255, 0.34)',
  labelColor: 'rgba(244, 247, 251, 0.72)',
  panelColor: 'rgba(18, 22, 29, 0.92)',
  backgroundColor: 'rgba(10, 12, 16, 0.74)',
  textColor: '#f4f7fb',
};

const canvas = document.getElementById('graph');
const ctx = canvas.getContext('2d');
const titleEl = document.getElementById('title');
const timeEl = document.getElementById('time');
const valueEls = {
  player: document.getElementById('playerValue'),
};

const state = {
  mapId: '',
  liveTime: 0,
  fullTime: 1,
  playState: 0,
  playStateName: '',
  previousPlayState: 0,
  previousPlayStateName: '',
  backwardTimePackets: 0,
  player: createKeyState(),
  keyCounts: {
    k1: 0,
    k2: 0,
  },
  finishedGraph: null,
  lastGraph: null,
  mapBpmPoints: [],
  hitTimes: [],
  mapRate: 1,
  graphStartTime: 0,
  graphEndTime: 1,
  beatmapFilePath: '',
};

function createKeyState() {
  return {
    samples: [],
    points: [],
    previousClickTime: 0,
    currentBpm: 0,
  };
}

function connectSocket(path, onMessage, onOpen, filters = null) {
  const socket = new WebSocket(`ws://${HOST}${path}${getSocketLocationQuery(path)}`);

  socket.onopen = () => {
    console.log(`[bpm-overlay] connected ${path}`);
    if (Array.isArray(filters)) socket.send(`applyFilters:${JSON.stringify(filters)}`);
    if (typeof onOpen === 'function') onOpen(socket);
  };
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch (error) {
      console.log('[bpm-overlay] message parse failed', error);
    }
  };
  socket.onclose = () => {
    console.log(`[bpm-overlay] closed ${path}, reconnecting`);
    setTimeout(() => connectSocket(path, onMessage, onOpen, filters), 1000);
  };
  socket.onerror = (error) => console.log(`[bpm-overlay] socket error ${path}`, error);

  return socket;
}

function connectCommands() {
  connectSocket('/websocket/commands', handleSettingsCommand, (socket) => {
    socket.send(`getSettings:${getCounterPath()}`);
  });
}

function getSocketLocationQuery(path) {
  const counterPath = getCounterPath();
  if (!counterPath) return '';

  const separator = path.includes('?') ? '&' : '?';
  return `${separator}l=${counterPath}`;
}

function getCounterPath() {
  if (window.COUNTER_PATH) return encodeURI(window.COUNTER_PATH);

  const folder = window.location.pathname.split('/').filter(Boolean)[0];
  return folder ? encodeURI(decodeURIComponent(folder)) : '';
}

function handleSettingsCommand(data) {
  const message = data.message || {};

  if (message.averageNotes != null) {
    const averageNotes = Math.round(Math.max(1, Math.min(100, Number(message.averageNotes))));
    if (Number.isFinite(averageNotes) && averageNotes !== config.averageNotes) {
      config.averageNotes = averageNotes;
      recalculateGraphsForAverageWindow();
    }
  }

  if (message.yScaleExponent != null) {
    const yScaleExponent = Math.max(1, Math.min(4, Number(message.yScaleExponent)));
    if (Number.isFinite(yScaleExponent)) config.yScaleExponent = yScaleExponent;
  }

  if (message.timelineWindowSeconds != null) {
    const timelineWindowSeconds = Math.max(5, Math.min(600, Number(message.timelineWindowSeconds)));
    if (Number.isFinite(timelineWindowSeconds)) config.timelineWindowSeconds = timelineWindowSeconds;
  }

  if (message.yAxisHeadroomPercent != null) {
    const yAxisHeadroomPercent = Math.max(0, Math.min(50, Number(message.yAxisHeadroomPercent)));
    if (Number.isFinite(yAxisHeadroomPercent)) config.yAxisHeadroomPercent = yAxisHeadroomPercent;
  }

  updateColorSetting(message, 'playerColor');
  updateColorSetting(message, 'perfectColor');
  updateColorSetting(message, 'progressColor');
  updateColorSetting(message, 'gridColor');
  updateColorSetting(message, 'axisColor');
  updateColorSetting(message, 'labelColor');
  updateColorSetting(message, 'panelColor');
  updateColorSetting(message, 'backgroundColor');
  updateColorSetting(message, 'textColor');
  applyCssSettings();
}

function updateColorSetting(message, key) {
  if (message[key] != null) config[key] = message[key];
}

function getAverageWindowSize() {
  const averageNotes = Math.round(Number(config.averageNotes));
  return Number.isFinite(averageNotes) ? Math.max(1, Math.min(100, averageNotes)) : 10;
}

function applyCssSettings() {
  document.body.style.setProperty('--panel', config.panelColor);
  document.body.style.setProperty('--bg', config.backgroundColor);
  document.body.style.setProperty('--text', config.textColor);
  document.body.style.setProperty('--player', config.playerColor);
  document.body.style.setProperty('--map', config.perfectColor);
}

function recalculateGraphsForAverageWindow() {
  if (state.hitTimes.length > 1) {
    state.mapBpmPoints = buildPerfectBpmPoints(state.hitTimes);
  }

  resetPlayerLine();
  state.finishedGraph = null;
  state.lastGraph = null;
  valueEls.player.textContent = '0';
}

connectSocket('/websocket/v2', handleV2Data, null, V2_FILTERS);
connectSocket('/websocket/v2/precise', handlePreciseData, null, PRECISE_FILTERS);
connectCommands();

async function handleV2Data(data) {
  const live = firstNumber(data.beatmap?.time?.live, data.beatmap?.time?.current);
  const full = firstNumber(
    data.beatmap?.time?.full,
    data.beatmap?.time?.mp3Length,
    data.beatmap?.time?.lastObject
  );

  if (Number.isFinite(data.state?.number)) setPlayState(data.state.number, data.state?.name);
  if (Number.isFinite(live)) setLiveTime(live);
  if (Number.isFinite(full) && full > 0) state.fullTime = full;
  if (Number.isFinite(data.play?.mods?.rate) && data.play.mods.rate > 0 && data.play.mods.rate !== state.mapRate) {
    state.mapRate = data.play.mods.rate;
    if (state.hitTimes.length > 1) state.mapBpmPoints = buildPerfectBpmPoints(state.hitTimes);
  }
  updateBeatmapFilePath(data);

  const mapId = [
    data.beatmap?.checksum,
    data.beatmap?.id,
    data.beatmap?.set,
    data.beatmap?.version,
  ].filter(Boolean).join(':');

  if (mapId && state.mapId && mapId !== state.mapId && !isResultsState() && !state.lastGraph) resetGraph();
  if (mapId) state.mapId = mapId;
  const artist = data.beatmap?.artist || '';
  const title = data.beatmap?.title || '';
  const version = data.beatmap?.version || '';
  titleEl.textContent = title ? `${artist} - ${title} [${version}]` : 'Waiting for beatmap';
  updateTimeLabel();
}

function handlePreciseData(data) {
  if (!isGameplayState()) return;
  registerKeys(data.keys);
}

function setPlayState(nextState, nextStateName = '') {
  if (nextState === state.playState && nextStateName === state.playStateName) return;

  const wasGameplay = isGameplayState();
  state.previousPlayState = state.playState;
  state.previousPlayStateName = state.playStateName;
  state.playState = nextState;
  state.playStateName = nextStateName || '';

  if (!wasGameplay && isGameplayState()) {
    resetGraph(true);
  }

  if (wasGameplay && !isGameplayState()) {
    captureFinishedGraph();
  }

  if (isStateResults(state.previousPlayState, state.previousPlayStateName) && !isResultsState()) {
    resetGraph(true);
  }
}

function isGameplayState() {
  return state.playState === GAMEPLAY_STATE || state.playStateName === GAMEPLAY_STATE_NAME;
}

function isResultsState() {
  return isStateResults(state.playState, state.playStateName);
}

function isStateResults(stateNumber, stateName) {
  return stateNumber === RESULTS_STATE || stateName === RESULTS_STATE_NAME;
}

function captureFinishedGraph() {
  const playerPoints = state.player.points;
  if (playerPoints.length < 1) return;

  state.finishedGraph = cloneGraphPoints({
    player: playerPoints,
  });
  state.lastGraph = cloneGraphPoints(state.finishedGraph);
}

function rememberGraph() {
  const graph = {
    player: state.player.points,
  };

  if (graph.player.length < 1) return;
  state.lastGraph = cloneGraphPoints(graph);
}

function cloneGraphPoints(graph) {
  return {
    map: (graph.map || state.mapBpmPoints).map((point) => ({ ...point })),
    player: graph.player.map((point) => ({ ...point })),
  };
}

function updateBeatmapFilePath(data) {
  const directFile = data.directPath?.beatmapFile || '';
  const songsFolder = data.folders?.songs || '';
  const relativeFile = data.files?.beatmap || '';
  const nextPath = (relativeFile || (directFile && songsFolder ? directFile.replace(songsFolder, '') : ''))
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  if (!nextPath || nextPath === state.beatmapFilePath) return;

  state.beatmapFilePath = nextPath;
  loadPerfectBpmPoints(nextPath);
}

async function loadPerfectBpmPoints(filePath) {
  try {
    const response = await fetch(`http://${HOST}/files/beatmap/${encodeURI(filePath)}`);
    const osuText = await response.text();
    const perfectGraph = parsePerfectBpmPoints(osuText);
    state.mapBpmPoints = perfectGraph.points;
    state.hitTimes = perfectGraph.hitTimes;
    state.graphStartTime = perfectGraph.firstHitTime;
    state.graphEndTime = perfectGraph.lastHitTime;

    if (state.finishedGraph) state.finishedGraph.map = state.mapBpmPoints.map((point) => ({ ...point }));
    if (state.lastGraph) state.lastGraph.map = state.mapBpmPoints.map((point) => ({ ...point }));
  } catch (error) {
    console.log('[bpm-overlay] failed to load beatmap hit objects', error);
    state.mapBpmPoints = [];
    state.hitTimes = [];
    state.graphStartTime = 0;
    state.graphEndTime = state.fullTime;
  }
}

function parsePerfectBpmPoints(osuText) {
  const lines = osuText.split(/\r?\n/);
  const hitTimes = [];
  let inHitObjects = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '[HitObjects]') {
      inHitObjects = true;
      continue;
    }

    if (inHitObjects && trimmed.startsWith('[')) break;
    if (!inHitObjects || trimmed === '' || trimmed.startsWith('//')) continue;

    const parts = trimmed.split(',');
    const time = Number(parts[2]);

    if (Number.isFinite(time)) hitTimes.push(Math.max(0, time));
  }

  if (hitTimes.length < 2) {
    return {
      points: [],
      hitTimes: [],
      firstHitTime: 0,
      lastHitTime: state.fullTime,
    };
  }

  hitTimes.sort((a, b) => a - b);

  return {
    points: buildPerfectBpmPoints(hitTimes),
    hitTimes,
    firstHitTime: hitTimes[0],
    lastHitTime: hitTimes[hitTimes.length - 1],
  };
}

function buildPerfectBpmPoints(hitTimes) {
  const points = [];
  const samples = [];
  const idleThreshold = IDLE_RESET_MS * state.mapRate;
  const averageWindowSize = getAverageWindowSize();

  for (let i = 1; i < hitTimes.length; i += 1) {
    const elapsedMs = hitTimes[i] - hitTimes[i - 1];
    const elapsedSeconds = elapsedMs / 1000;
    if (elapsedSeconds <= 0) continue;

    const rawBpm = Math.round((1 / elapsedSeconds) * 60);
    const osuBpm = Math.round(rawBpm / OSU_BPM_DIVISOR);

    if (!Number.isFinite(osuBpm) || osuBpm <= 0 || osuBpm >= 1200) continue;

    // Long breaks should start a fresh average, matching the live player idle reset.
    if (elapsedMs > idleThreshold) samples.length = 0;

    samples.push(osuBpm);
    if (samples.length > averageWindowSize) samples.shift();

    const average = Math.round(samples.reduce((sum, value) => sum + value, 0) / samples.length);
    points.push({
      time: hitTimes[i],
      bpm: average,
    });
  }

  return points;
}

function getMapBpmLine() {
  const points = getDisplayPoints().map || state.mapBpmPoints;
  const idleThreshold = IDLE_RESET_MS * state.mapRate;
  const line = [];

  points.forEach((point, index) => {
    const previousPoint = points[index - 1];

    if (previousPoint && point.time - previousPoint.time > idleThreshold) {
      line.push({
        time: previousPoint.time + idleThreshold,
        bpm: 0,
      });
    }

    line.push({
      time: point.time,
      bpm: Math.round(point.bpm * state.mapRate),
    });
  });

  return line;
}

function getLiveGraph() {
  return {
    map: state.mapBpmPoints,
    player: state.player.points,
  };
}

function registerKeys(keys) {
  if (!keys) return;

  const nextCounts = { ...state.keyCounts };
  let totalDelta = 0;
  let shouldReset = false;

  ['k1', 'k2'].forEach((keyName) => {
    const incoming = keys[keyName];
    if (!incoming || !Number.isFinite(incoming.count)) return;

    const previousCount = state.keyCounts[keyName];
    nextCounts[keyName] = incoming.count;

    if (incoming.count < previousCount) {
      shouldReset = true;
      return;
    }

    totalDelta += incoming.count - previousCount;
  });

  if (shouldReset) {
    resetPlayerLine();
    state.keyCounts.k1 = nextCounts.k1;
    state.keyCounts.k2 = nextCounts.k2;
    valueEls.player.textContent = '0';
    return;
  }

  if (totalDelta < 1) return;

  state.keyCounts.k1 = nextCounts.k1;
  state.keyCounts.k2 = nextCounts.k2;
  registerKeypresses(state.player, totalDelta);
  valueEls.player.textContent = state.player.currentBpm.toString();
}

function setLiveTime(live) {
  const nextTime = Math.max(0, live);

  if (isResultsState() && nextTime < state.liveTime) return;

  if (state.liveTime - nextTime > 1500 && !isResultsState()) {
    state.backwardTimePackets += 1;

    if (state.backwardTimePackets < 2) return;
    resetGraph(true);
  } else {
    state.backwardTimePackets = 0;
  }

  state.liveTime = nextTime;
}

function registerKeypresses(key, amount = 1) {
  const now = Date.now();
  const pressCount = Math.max(1, Math.floor(amount));

  if (key.previousClickTime) {
    const elapsedSeconds = ((now - key.previousClickTime) / 1000) / pressCount;
    if (elapsedSeconds <= 0) {
      key.previousClickTime = now;
      return;
    }

    const rawBpm = Math.round((1 / elapsedSeconds) * 60);
    const osuBpm = Math.round(rawBpm / OSU_BPM_DIVISOR);

    if (Number.isFinite(osuBpm) && osuBpm > 0 && osuBpm < 1200) {
      const averageWindowSize = getAverageWindowSize();
      for (let i = 0; i < pressCount; i += 1) key.samples.push(osuBpm);
      key.samples = key.samples.slice(-averageWindowSize);
      key.currentBpm = Math.round(key.samples.reduce((sum, value) => sum + value, 0) / key.samples.length);
      addPoint(key, key.currentBpm);
      rememberGraph();
    }
  }

  key.previousClickTime = now;
}

function addPoint(key, bpm) {
  const time = clamp(state.liveTime, getGraphStartTime(), getGraphEndTime());
  const lastPoint = key.points[key.points.length - 1];

  if (lastPoint && Math.abs(lastPoint.time - time) < 35) {
    lastPoint.bpm = bpm;
    return;
  }

  key.points.push({ time, bpm });
}

function drawGraph() {
  resizeCanvas();
  clearIdleKeys();

  const width = canvas.width;
  const height = canvas.height;
  const padding = { left: 48, right: 16, top: 14, bottom: 34 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const yMax = getYMax();
  const displayPoints = getDisplayPoints();

  ctx.clearRect(0, 0, width, height);
  ctx.font = '12px Arial, Helvetica, sans-serif';
  ctx.lineWidth = 1;

  drawGrid(padding, chartWidth, chartHeight, yMax);
  drawProgressMarker(padding, chartWidth, chartHeight);
  drawLine(getMapBpmLine(), config.perfectColor, padding, chartWidth, chartHeight, yMax, 2);
  drawLine(displayPoints.player, config.playerColor, padding, chartWidth, chartHeight, yMax);
  drawAxes(padding, chartWidth, chartHeight, yMax);

  requestAnimationFrame(drawGraph);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function drawGrid(padding, chartWidth, chartHeight, yMax) {
  ctx.strokeStyle = config.gridColor;
  ctx.fillStyle = config.labelColor;

  const topLabel = Math.floor(yMax / Y_AXIS_STEP) * Y_AXIS_STEP;
  for (let value = topLabel; value >= 0; value -= Y_AXIS_STEP) {
    const y = getBpmY(value, yMax, padding, chartHeight, true);
    line(padding.left, y, padding.left + chartWidth, y);
    ctx.fillText(value.toString(), 8, y + 4);
  }

  for (let i = 0; i <= 5; i += 1) {
    const x = padding.left + (chartWidth / 5) * i;
    line(x, padding.top, x, padding.top + chartHeight);
  }
}

function drawAxes(padding, chartWidth, chartHeight, yMax) {
  ctx.strokeStyle = config.axisColor;
  line(padding.left, padding.top, padding.left, padding.top + chartHeight);
  line(padding.left, padding.top + chartHeight, padding.left + chartWidth, padding.top + chartHeight);

  ctx.fillStyle = config.labelColor;
  ctx.fillText('BPM', padding.left + 6, 10);
  ctx.textAlign = 'right';
  ctx.fillText(formatTime(getViewEndTime()), padding.left + chartWidth, padding.top + chartHeight + 24);
  ctx.textAlign = 'left';
  ctx.fillText(formatTime(getViewStartTime()), padding.left, padding.top + chartHeight + 24);
}

function drawProgressMarker(padding, chartWidth, chartHeight) {
  const progress = getTimeProgress(state.liveTime);
  const x = padding.left + chartWidth * progress;

  ctx.strokeStyle = config.progressColor;
  ctx.setLineDash([6, 7]);
  line(x, padding.top, x, padding.top + chartHeight);
  ctx.setLineDash([]);
}

function drawLine(points, color, padding, chartWidth, chartHeight, yMax, lineWidth = 3) {
  if (points.length < 1) return;

  const visiblePoints = getVisibleLinePoints(points);
  if (visiblePoints.length < 1) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();

  visiblePoints.forEach((point, index) => {
    const x = padding.left + chartWidth * getTimeProgress(point.time);
    const y = getBpmY(point.bpm, yMax, padding, chartHeight);

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();
  ctx.lineWidth = 1;
}

function line(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(Math.round(x1) + 0.5, Math.round(y1) + 0.5);
  ctx.lineTo(Math.round(x2) + 0.5, Math.round(y2) + 0.5);
  ctx.stroke();
}

function clearIdleKeys() {
  if (!isGameplayState()) return;

  const now = Date.now();

  if (state.player.previousClickTime && now - state.player.previousClickTime > IDLE_RESET_MS && state.player.currentBpm !== 0) {
    if (isNearMapEnd()) return;

    state.player.currentBpm = 0;
    state.player.samples = [];
    addPoint(state.player, 0);
    rememberGraph();
    valueEls.player.textContent = '0';
  }
}

function isNearMapEnd() {
  return getGraphEndTime() > 1 && getGraphEndTime() - state.liveTime <= IDLE_RESET_MS;
}

function getGraphStartTime() {
  return Number.isFinite(state.graphStartTime) ? state.graphStartTime : 0;
}

function getGraphEndTime() {
  const fallbackEnd = state.fullTime || 1;
  const endTime = Number.isFinite(state.graphEndTime) ? state.graphEndTime : fallbackEnd;
  return Math.max(getGraphStartTime() + 1, endTime);
}

function getTimeProgress(time) {
  const startTime = getViewStartTime();
  const duration = getViewEndTime() - startTime;
  return clamp((time - startTime) / duration, 0, 1);
}

function getVisibleLinePoints(points) {
  const startTime = getViewStartTime();
  const endTime = getViewEndTime();
  const visiblePoints = [];
  let previousPoint = null;

  for (const point of points) {
    if (point.time < startTime) {
      previousPoint = point;
      continue;
    }

    if (point.time > endTime) {
      if (visiblePoints.length > 0) visiblePoints.push(point);
      break;
    }

    if (visiblePoints.length === 0 && previousPoint) visiblePoints.push(previousPoint);
    visiblePoints.push(point);
  }

  return visiblePoints;
}

function getTimelineWindowMs() {
  const seconds = Number(config.timelineWindowSeconds);
  const clampedSeconds = Number.isFinite(seconds) ? Math.max(5, Math.min(600, seconds)) : 30;
  return clampedSeconds * 1000;
}

function getViewStartTime() {
  const mapStart = getGraphStartTime();
  const mapEnd = getGraphEndTime();
  const windowMs = getTimelineWindowMs();

  if (windowMs >= mapEnd - mapStart) return mapStart;

  const viewEnd = getViewEndTime();
  return Math.max(mapStart, viewEnd - windowMs);
}

function getViewEndTime() {
  const mapStart = getGraphStartTime();
  const mapEnd = getGraphEndTime();
  const windowMs = getTimelineWindowMs();

  if (windowMs >= mapEnd - mapStart) return mapEnd;

  const targetEnd = state.liveTime + windowMs * TIMELINE_FUTURE_PADDING;
  return clamp(targetEnd, mapStart + windowMs, mapEnd);
}

function getBpmY(bpm, yMax, padding, chartHeight, clampToChart = false) {
  const ratio = clampToChart ? clamp(bpm / yMax, 0, 1) : Math.max(0, bpm / yMax);
  const progress = Math.pow(ratio, config.yScaleExponent);
  return padding.top + chartHeight - chartHeight * progress;
}

function getYMax() {
  const values = getMapBpmLine().map((point) => point.bpm);
  const highest = Math.max(...values, 0);
  const headroomMultiplier = 1 + Math.max(0, Math.min(50, Number(config.yAxisHeadroomPercent))) / 100;
  return highest <= MIN_Y_MAX ? MIN_Y_MAX : highest * headroomMultiplier;
}

function getDisplayPoints() {
  // Results screen packets can arrive after gameplay stops, so keep the last gameplay graph available.
  if (!isGameplayState() && state.finishedGraph) return state.finishedGraph;
  if (!isGameplayState() && state.lastGraph) return state.lastGraph;

  return getLiveGraph();
}

function resetGraph(keepMapInfo = false) {
  resetPlayerLine();
  state.finishedGraph = null;
  state.lastGraph = null;
  valueEls.player.textContent = '0';
  if (!keepMapInfo) state.mapId = '';
}

function resetPlayerLine() {
  resetKey(state.player);
  state.keyCounts.k1 = 0;
  state.keyCounts.k2 = 0;
}

function resetKey(key) {
  key.samples = [];
  key.points = [];
  key.previousClickTime = 0;
  key.currentBpm = 0;
}

function updateTimeLabel() {
  timeEl.textContent = `${formatTime(state.liveTime)} / ${formatTime(state.fullTime)}`;
}

function formatTime(ms) {
  const seconds = Math.max(0, Math.floor((ms || 0) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function firstNumber(...values) {
  return values.find((value) => Number.isFinite(value));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

drawGraph();
