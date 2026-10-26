/** Pure osu!stable timing feedback logic. No game writes and no DOM dependencies. */

const MODE_GRADES = {
  osu: [
    ["great", "300"],
    ["ok", "100"],
    ["meh", "50"],
  ],
  mania: [
    ["perfect", "300g"],
    ["great", "300"],
    ["good", "200"],
    ["ok", "100"],
    ["meh", "50"],
  ],
};

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const count = (value) => (finite(value) && value >= 0 ? value : 0);
const same = (a, b) =>
  a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
const isPrefix = (shorter, longer) =>
  shorter.length <= longer.length &&
  shorter.every((value, i) => Object.is(value, longer[i]));

function modeName(value) {
  const rawName = typeof value === "string" ? value : value?.name;
  const name = typeof rawName === "string" ? rawName.toLowerCase() : "";
  if (name) return name === "osu" || name === "mania" ? name : null;
  const number = typeof value === "number" ? value : value?.number;
  return number === 0 ? "osu" : number === 3 ? "mania" : null;
}

/** Normalize the /json/v2 context schema, including v4.26+ hitWindow. */
export function normalizeSnapshot(data = {}) {
  if (!data || typeof data !== "object") data = {};
  const play = data.play ?? {};
  const beatmap = data.beatmap ?? {};
  const stats = beatmap.stats ?? {};
  const client =
    typeof data.client === "string" ? data.client.toLowerCase() : "";
  const mode = modeName(play.mode ?? beatmap.mode ?? data.settings?.mode);
  const state = typeof data.state === "string" ? data.state : data.state?.name;
  const playing = state
    ? state === "play" || state === "playing"
    : data.state?.number === 2;
  const rate =
    finite(play.mods?.rate) && play.mods.rate > 0 ? play.mods.rate : 1;
  const windows = {};
  for (const key of ["perfect", "great", "good", "ok", "meh"]) {
    const value = stats.hitWindow?.[key];
    // These windows are already in real time. Do not divide them by rate again.
    if (finite(value) && value >= 0) windows[key] = value;
  }

  const hits = play.hits ?? {};
  const counts = {
    miss: count(hits["0"]),
    meh: count(hits["50"]),
    ok: count(hits["100"]),
    good: mode === "mania" ? count(hits.katu) : 0,
    great: count(hits["300"]),
    perfect: mode === "mania" ? count(hits.geki) : 0,
  };
  // Standard geki/katu also appear in its 300/100 totals; they are not extra notes.
  counts.total = Object.values(counts).reduce(
    (total, value) => total + value,
    0,
  );

  const mapKey = String(
    beatmap.checksum ||
      data.directPath?.beatmapFile ||
      (data.files?.beatmap
        ? `${data.folders?.beatmap ?? ""}/${data.files.beatmap}`
        : "") ||
      (beatmap.id ? `${beatmap.id}:${beatmap.version ?? ""}` : ""),
  );
  const skinKey = String(
    data.folders?.skin ||
      data.directPath?.skinFolder ||
      data.settings?.skin?.name ||
      "",
  );
  const keyMod =
    typeof play.mods?.name === "string"
      ? play.mods.name.match(/(?:^|[^0-9])(1[0-8]|[1-9])K(?:$|[^A-Za-z])/i)
      : null;
  const cs = stats.cs?.converted ?? stats.cs?.original;
  const keyCount =
    mode === "mania"
      ? keyMod
        ? Number(keyMod[1])
        : Number.isInteger(cs) && cs > 0 && cs <= 18
          ? cs
          : null
      : null;

  return {
    playing,
    paused: data.game?.paused === true,
    supported: client === "stable" && mode !== null,
    client,
    mode,
    mapKey,
    // The precise endpoint has no currentTime in current tosu. Only this regular field is used.
    currentTime: finite(beatmap.time?.live) ? beatmap.time.live : null,
    rate,
    windows,
    skinKey,
    keyCount,
    counts,
    hitErrors: Array.isArray(play.hitErrorArray)
      ? play.hitErrorArray.slice()
      : [],
  };
}

/**
 * Infer a timing grade, never an actual game score. Sliders, combo variants and
 * mania hold judgements cannot be reconstructed from one anonymous offset.
 */
export function classifyHit(rawOffset, context) {
  if (
    !finite(rawOffset) ||
    !context ||
    !MODE_GRADES[context.mode] ||
    context.supported === false ||
    (context.client && context.client !== "stable") ||
    !finite(context.rate) ||
    context.rate <= 0
  )
    return null;
  const offset = rawOffset / context.rate;
  if (!finite(offset)) return null;
  const windows = context.windows ?? {};
  const grades = MODE_GRADES[context.mode];
  let previous = -Infinity;
  const validWindows = grades.every(([key]) => {
    const window = windows[key];
    const valid = finite(window) && window >= 0 && window >= previous;
    previous = window;
    return valid;
  });
  const grade = validWindows
    ? (grades.find(([key]) => Math.abs(offset) <= windows[key])?.[1] ?? null)
    : null;
  return {
    rawOffset,
    offset,
    direction: offset < 0 ? "early" : offset > 0 ? "late" : "neutral",
    grade,
    inferred: true,
    mode: context.mode,
  };
}

/** Deduplicate regular and precise cumulative hit-error arrays. */
export class HitTracker {
  constructor() {
    this.context = null;
    this._history = [];
    this._regularHistory = [];
    this._baselineNeeded = true;
    this._sequence = 0;
    this._knownMapKey = "";
    this._previousEpochHistory = null;
    this._awaitingNormalHit = false;
    this._resumeContext = null;
    this._resumeHistory = [];
    this._resumeMapKey = "";
  }

  disconnect() {
    if (!this._baselineNeeded && this.context) {
      // HTTP context may expire while a precise packet is still in flight.
      // Preserve the furthest cursor so a slower regular reconnect
      // baseline cannot replay hits already shown by precise.
      this._resumeContext = this.context;
      this._resumeHistory = this._furthestHistory().slice();
      this._resumeMapKey = this._knownMapKey;
    }
    this.context = null;
    this._history = [];
    this._regularHistory = [];
    this._baselineNeeded = true;
    this._knownMapKey = "";
  }

  updateSnapshot(rawData) {
    const context = normalizeSnapshot(rawData);
    const previous = this.context;
    this.context = context;

    if (this._baselineNeeded) {
      // Opening/reconnecting mid-song must not replay the accumulated history.
      const before = this._resumeContext;
      const changedMap =
        before &&
        this._resumeMapKey &&
        context.mapKey &&
        this._resumeMapKey !== context.mapKey;
      const rewound =
        before &&
        ((finite(before.currentTime) &&
          finite(context.currentTime) &&
          context.currentTime < before.currentTime - 50) ||
          Object.keys(context.counts).some(
            (key) => context.counts[key] < before.counts[key],
          ));
      const sameEpoch =
        before &&
        before.playing === context.playing &&
        before.client === context.client &&
        before.mode === context.mode &&
        !changedMap &&
        !rewound &&
        (isPrefix(context.hitErrors, this._resumeHistory) ||
          isPrefix(this._resumeHistory, context.hitErrors));
      if (before && !sameEpoch) {
        this._previousEpochHistory =
          this._resumeHistory.length > 0
            ? this._resumeHistory.slice()
            : this._previousEpochHistory;
        this._awaitingNormalHit = this._previousEpochHistory !== null;
      }
      this._history =
        sameEpoch && isPrefix(context.hitErrors, this._resumeHistory)
          ? this._resumeHistory.slice()
          : context.hitErrors.slice();
      this._regularHistory = this._history.slice();
      this._confirmNormalEpoch(context.hitErrors);
      this._knownMapKey =
        context.mapKey || (sameEpoch ? this._resumeMapKey : "");
      this._baselineNeeded = false;
      this._resumeContext = null;
      this._resumeHistory = [];
      this._resumeMapKey = "";
      return { context, reset: true, hits: [] };
    }

    // Map metadata may briefly be unavailable. Its later arrival alone must not
    // replay a mid-song baseline, but retain the last known map through gaps.
    const changedMap = Boolean(
      this._knownMapKey &&
        context.mapKey &&
        this._knownMapKey !== context.mapKey,
    );
    if (context.mapKey) this._knownMapKey = context.mapKey;
    const changedClientOrMode =
      previous.client !== context.client || previous.mode !== context.mode;
    const rewind =
      finite(previous.currentTime) &&
      finite(context.currentTime) &&
      context.currentTime < previous.currentTime - 50;
    const countsRewound = Object.keys(context.counts).some(
      (key) => context.counts[key] < previous.counts[key],
    );
    const enteringPlay = context.playing && !previous.playing;
    const leavingPlay = !context.playing && previous.playing;
    const explicitReset =
      changedMap ||
      changedClientOrMode ||
      enteringPlay ||
      leavingPlay ||
      (context.playing && previous.playing && (rewind || countsRewound));

    if (explicitReset) this._startEpoch();
    const result = this._ingest(context.hitErrors, true);
    return { context, reset: explicitReset || result.reset, hits: result.hits };
  }

  ingest(errors) {
    return this._ingest(errors, false).hits;
  }

  _startEpoch() {
    // Keep the previous nonempty run through intervening menu/empty snapshots.
    // A first-ever menu->play transition has no old stream to guard against.
    const history = this._furthestHistory();
    this._previousEpochHistory =
      history.length > 0 ? history.slice() : this._previousEpochHistory;
    this._history = [];
    this._regularHistory = [];
    this._awaitingNormalHit = this._previousEpochHistory !== null;
  }

  _confirmNormalEpoch(errors) {
    if (errors.length === 0) return;
    this._awaitingNormalHit = false;
    const previous = this._previousEpochHistory;
    if (
      previous !== null &&
      (previous.length === 0 ||
        (!isPrefix(errors, previous) && !isPrefix(previous, errors)))
    )
      this._previousEpochHistory = null;
  }

  _furthestHistory() {
    return isPrefix(this._history, this._regularHistory)
      ? this._regularHistory
      : this._history;
  }

  _ingest(errors, authoritative) {
    if (this._baselineNeeded || !this.context || !Array.isArray(errors))
      return { reset: false, hits: [] };
    const next = errors.slice();
    if (same(next, this._history)) return { reset: false, hits: [] };

    // A lagging regular packet can be an exact shorter prefix of the precise
    // stream. Ignore it. A real retry with the same first offsets is ambiguous
    // until regular time/count/state evidence resets the session; do not invent
    // a reset from an anonymous prefix alone.
    if (next.length < this._history.length && isPrefix(next, this._history))
      return { reset: false, hits: [] };

    if (
      !authoritative &&
      this._regularHistory.length > 0 &&
      !isPrefix(next, this._regularHistory) &&
      !isPrefix(this._regularHistory, next)
    ) {
      // A metadata-only regular packet may have authorized a new epoch before
      // its first precise packet. Reject incompatible delayed old-run packets.
      return { reset: false, hits: [] };
    }

    let appended = isPrefix(this._history, next);
    if (!authoritative && !appended) {
      // The faster anonymous precise stream cannot authorize a new epoch: its
      // new-run packet may arrive before a lagging regular old-run packet.
      // Wait for regular state/count/time/error evidence instead of switching
      // back and forth and replaying both runs.
      return { reset: false, hits: [] };
    }

    const reset = !appended;
    if (reset) {
      this._startEpoch();
      appended = true;
    }

    const previousEpoch = this._previousEpochHistory;
    if (!authoritative && previousEpoch !== null) {
      const couldBePreviousEpoch =
        previousEpoch.length === 0
          ? this._awaitingNormalHit
          : isPrefix(next, previousEpoch) || isPrefix(previousEpoch, next);
      if (couldBePreviousEpoch) {
        // After a regular reset to [], a delayed old precise packet otherwise
        // looks like a valid append. Keep this sentinel even when a new regular
        // first hit equals the previous run's first hit. The normal stream will
        // deliver ambiguous matching prefixes without replay; at most its usual
        // polling delay is added.
        return { reset: false, hits: [] };
      }
      this._previousEpochHistory = null;
    }
    if (authoritative) {
      this._confirmNormalEpoch(next);
      this._regularHistory = next.slice();
    }

    const fresh = next.slice(this._history.length);
    this._history = next;
    if (!this.context.supported || !this.context.playing || this.context.paused)
      return { reset, hits: [] };

    const hits = [];
    for (const rawOffset of fresh) {
      const hit = classifyHit(rawOffset, this.context);
      if (hit) hits.push({ ...hit, sequence: ++this._sequence });
    }
    return { reset, hits };
  }
}
