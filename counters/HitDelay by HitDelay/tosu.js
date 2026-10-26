// One precise socket carries timing data and settings commands. Context is read
// from the same tosu HTTP origin, with one request in flight and no hit queue.
export function counterPath(locationLike = globalThis.location) {
  const segments = locationLike.pathname.split("/").filter(Boolean);
  if (/\.(html?)$/i.test(segments.at(-1) || "")) segments.pop();
  return segments.map(decodeURIComponent).join("/") || "HitDelay by HitDelay";
}

export function apiBase(locationLike = globalThis.location) {
  const explicit = new URLSearchParams(locationLike.search).get("server");
  const value =
    explicit ||
    (/^https?:$/.test(locationLike.protocol)
      ? locationLike.origin
      : "http://127.0.0.1:24050");
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password)
    throw new Error("tosu 地址必须是 HTTP(S) 地址。");
  return url.origin;
}

// Keep only the context fields the counter uses. Never persist API snapshots.
export function selectSnapshot(data = {}) {
  const beatmap = data.beatmap ?? {},
    play = data.play ?? {};
  return {
    game: { paused: data.game?.paused },
    client: data.client,
    state: data.state,
    settings: {
      skin: data.settings?.skin,
      resolution: data.settings?.resolution,
    },
    beatmap: {
      checksum: beatmap.checksum,
      id: beatmap.id,
      mode: beatmap.mode,
      time: { live: beatmap.time?.live },
      stats: beatmap.stats,
    },
    play: {
      mode: play.mode,
      mods: play.mods,
      hits: play.hits,
      hitErrorArray: play.hitErrorArray,
    },
    folders: { skin: data.folders?.skin },
    directPath: {
      beatmapFile: data.directPath?.beatmapFile,
      skinFolder: data.directPath?.skinFolder,
    },
  };
}

function playing(data) {
  const state = data.state;
  return (
    state === "play" ||
    state === "playing" ||
    state?.name === "play" ||
    state?.name === "playing" ||
    state?.number === 2
  );
}

export class TosuConnection {
  constructor({
    baseUrl,
    path,
    onSnapshot = () => {},
    onPrecise = () => {},
    onSettings = () => {},
    onStatus = () => {},
    onDisconnect = () => {},
    environment = {},
  }) {
    Object.assign(this, {
      baseUrl,
      path,
      onSnapshot,
      onPrecise,
      onSettings,
      onStatus,
      onDisconnect,
    });
    this.WebSocket = environment.WebSocket ?? globalThis.WebSocket;
    this.fetch = environment.fetch ?? globalThis.fetch.bind(globalThis);
    this.now = environment.now ?? (() => performance.now());
    this.setTimeout =
      environment.setTimeout ?? globalThis.setTimeout.bind(globalThis);
    this.clearTimeout =
      environment.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
    this.activeInterval = environment.activeInterval ?? 40;
    this.idleInterval = environment.idleInterval ?? 250;
    this.contextTimeout = environment.contextTimeout ?? 250;
    this.settingsInterval = environment.settingsInterval ?? 1000;
    this.stopped = true;
    this.epoch = 0;
    this.attempt = 0;
    this.socket = null;
    this.request = null;
    this.contextAt = null;
    this.contextValid = false;
    this.lastSettings = "";
    this.latestContext = null;
    this.lastPrecise = null;
    this.wakePending = false;
    this.confirmSettings = false;
  }

  start({ data = true } = {}) {
    if (!this.stopped) return;
    this.stopped = false;
    this.data = data;
    this.attempt = 0;
    this.open();
  }

  open() {
    if (this.stopped || this.socket) return;
    const epoch = ++this.epoch;
    const url = new URL("/websocket/v2/precise", this.baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("l", this.path);
    const socket = new this.WebSocket(url.href);
    this.socket = socket;
    socket.onopen = () => {
      if (!this.current(socket, epoch)) return;
      this.attempt = 0;
      socket.send('applyFilters:["hitErrors"]');
      this.refreshSettings();
      this.scheduleSettings(epoch);
      this.onStatus("precise", "connected");
      if (this.data) void this.poll(epoch);
    };
    socket.onmessage = (event) => {
      if (!this.current(socket, epoch)) return;
      try {
        const data = JSON.parse(event.data);
        if (!data || typeof data !== "object" || data.error) return;
        if (["getSettings", "updateSettings"].includes(data.command)) {
          if (!data.message || data.message.error) return;
          const signature = JSON.stringify(data.message);
          if (signature !== this.lastSettings || this.confirmSettings) {
            this.confirmSettings = false;
            this.lastSettings = signature;
            this.onSettings(data.message);
          }
          return;
        }
        if (!Array.isArray(data.hitErrors) || !this.data) return;
        const values = data.hitErrors;
        const changed =
          this.lastPrecise === null
            ? values.length > 0
            : values.length !== this.lastPrecise.length ||
              values.some(
                (value, index) => !Object.is(value, this.lastPrecise[index]),
              );
        this.lastPrecise = values;
        const fresh =
          this.contextValid &&
          this.now() - this.contextAt < this.contextTimeout;
        const expired = this.contextValid && !fresh;
        const idle =
          !playing(this.latestContext ?? {}) ||
          this.latestContext?.game?.paused;
        if (expired) this.invalidateContext();
        // A first hit can arrive while the slower context still says menu or
        // pause. Wake one context request; repeated identical 100Hz packets do
        // not bypass the polling interval or build a request/hit backlog.
        if (expired || (changed && (!fresh || idle))) {
          this.wakeContext(epoch);
        }
        if (!fresh) return;
        this.onPrecise(values);
      } catch (error) {
        this.onStatus("precise", "invalid", error.message);
      }
    };
    socket.onerror = () => {
      if (this.current(socket, epoch)) this.onStatus("precise", "waiting");
    };
    socket.onclose = () => {
      if (!this.current(socket, epoch)) return;
      this.socket = null;
      this.epoch++;
      this.cancelWork();
      this.invalidateContext(true);
      this.onStatus("precise", "waiting");
      if (!this.stopped) {
        const delay = Math.min(8000, 500 * 2 ** Math.min(this.attempt++, 4));
        this.reconnectTimer = this.setTimeout(() => this.open(), delay);
      }
    };
  }

  current(socket, epoch) {
    return !this.stopped && this.socket === socket && this.epoch === epoch;
  }
  ready() {
    return !this.stopped && this.socket?.readyState === this.WebSocket.OPEN;
  }

  scheduleSettings(epoch) {
    this.settingsTimer = this.setTimeout(() => {
      if (this.stopped || epoch !== this.epoch) return;
      this.refreshSettings();
      this.scheduleSettings(epoch);
    }, this.settingsInterval);
  }

  async poll(epoch) {
    if (this.stopped || epoch !== this.epoch || !this.ready() || this.request)
      return;
    const request = new AbortController();
    this.request = request;
    const startedAt = this.now();
    const timeout = this.setTimeout(() => {
      if (epoch === this.epoch && this.request === request) {
        this.invalidateContext();
        request.abort();
      }
    }, this.contextTimeout);
    let interval = this.idleInterval;
    try {
      const response = await this.fetch(
        new URL("/json/v2", this.baseUrl).href,
        { cache: "no-store", signal: request.signal },
      );
      if (!response.ok) throw new Error("Context unavailable");
      const rawData = await response.json();
      if (this.stopped || epoch !== this.epoch) return;
      if (request.signal.aborted) throw new Error("Context request aborted");
      if (this.now() - startedAt >= this.contextTimeout)
        throw new Error("Context expired");
      if (!rawData || typeof rawData !== "object" || rawData.error)
        throw new Error("Invalid context");
      const data = selectSnapshot(rawData);
      this.contextAt = this.now();
      this.contextValid = true;
      this.latestContext = data;
      // HTTP provides both the clock and the offsets used for circle matching.
      // Mania consumes the independent precise stream without waiting for this.
      this.onSnapshot(data);
      interval =
        playing(data) && data.game?.paused !== true
          ? this.activeInterval
          : this.idleInterval;
    } catch {
      if (epoch === this.epoch && !this.stopped) this.invalidateContext();
    } finally {
      this.clearTimeout(timeout);
      if (this.request === request) this.request = null;
    }
    if (!this.stopped && epoch === this.epoch && this.ready()) {
      if (this.wakePending) {
        interval = 0;
        this.wakePending = false;
      }
      this.pollTimer = this.setTimeout(() => void this.poll(epoch), interval);
    }
  }

  invalidateContext(force = false) {
    const wasValid = this.contextValid;
    this.contextValid = false;
    this.contextAt = null;
    this.latestContext = null;
    if (wasValid || force) this.onDisconnect();
  }

  wakeContext(epoch) {
    if (this.stopped || epoch !== this.epoch) return;
    if (this.request) {
      this.wakePending = true;
      return;
    }
    this.clearTimeout(this.pollTimer);
    this.pollTimer = null;
    void this.poll(epoch);
  }

  save(settings) {
    if (!this.ready()) return false;
    const payload = Object.entries(settings).map(([uniqueID, value]) => ({
      uniqueID,
      value,
    }));
    this.socket.send(
      `saveSettings:${encodeURIComponent(this.path)}:${JSON.stringify(payload)}`,
    );
    // tosu saves after a 500ms debounce. Confirm on the same socket, and refresh
    // periodically for changes made through tosu's HTTP settings dashboard.
    this.clearTimeout(this.saveTimer);
    this.saveTimer = this.setTimeout(() => this.refreshSettings(true), 850);
    return true;
  }

  refreshSettings(confirm = false) {
    if (this.ready()) {
      this.confirmSettings ||= confirm;
      this.socket.send(`getSettings:${encodeURIComponent(this.path)}`);
    }
  }

  cancelWork() {
    for (const name of ["pollTimer", "settingsTimer", "saveTimer"]) {
      this.clearTimeout(this[name]);
      this[name] = null;
    }
    this.request?.abort();
    this.request = null;
    this.wakePending = false;
    this.lastPrecise = null;
  }

  stop() {
    if (this.stopped) return;
    this.stopped = true;
    this.epoch++;
    this.clearTimeout(this.reconnectTimer);
    this.cancelWork();
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      socket.close();
    }
    this.invalidateContext(true);
  }
}

// The configure page owns the connection; its iframe never opens another one.
export class PreviewConnection {
  constructor({
    onSnapshot = () => {},
    onPrecise = () => {},
    onSettings = () => {},
    onStatus = () => {},
    onDisconnect = () => {},
    windowLike = globalThis.window,
  }) {
    Object.assign(this, {
      onSnapshot,
      onPrecise,
      onSettings,
      onStatus,
      onDisconnect,
      window: windowLike,
    });
    this.stopped = true;
    this.message = (event) => {
      if (
        this.stopped ||
        event.origin !== this.window.location.origin ||
        event.source !== this.window.parent ||
        event.data?.type !== "hitdelay-transport"
      )
        return;
      const { channel, payload } = event.data;
      if (channel === "snapshot") this.onSnapshot(payload);
      if (channel === "precise" && Array.isArray(payload))
        this.onPrecise(payload);
      if (channel === "settings") this.onSettings(payload);
      if (channel === "status") this.onStatus("precise", payload);
      if (channel === "disconnect") this.onDisconnect();
    };
  }
  start() {
    if (!this.stopped) return;
    this.stopped = false;
    this.window.addEventListener("message", this.message);
    this.window.parent.postMessage(
      { type: "hitdelay-preview-ready" },
      this.window.location.origin,
    );
  }
  stop() {
    this.stopped = true;
    this.window.removeEventListener("message", this.message);
  }
}
