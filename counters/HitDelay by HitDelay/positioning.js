/**
 * Read-only beatmap coordinates for osu!stable. No nearest-note or cursor fallback.
 * An anonymous offset is positioned only when the observed clock interval identifies
 * exactly one object, and that object is a circle with a known stack position.
 *
 * Format: https://osu.ppy.sh/wiki/en/Client/File_formats/osu_(file_format)
 * Geometry: https://osu.ppy.sh/wiki/en/Client/Playfield
 * Stacking reference (MIT): ppy/osu OsuBeatmapProcessor.cs and OsuHitObject.cs.
 */
const finite = Number.isFinite;
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const near = (a, b) => a && b && distance(a, b) < 3;

// osu! identifies local beatmaps by MD5 of the original bytes, including any
// UTF-8 BOM. Web Crypto does not implement MD5; this is only a file identity
// check, not a password/signature/security primitive. RFC 1321 round constants.
const md5Constants = Array.from(
  { length: 64 },
  (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) | 0,
);
const md5Shifts = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

/** Hash original fetch bytes before text decoding to reject map-switch races. */
export function beatmapChecksum(input) {
  const bytes =
    input instanceof Uint8Array
      ? input
      : input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : null;
  if (!bytes) throw new TypeError("Expected original beatmap bytes.");
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, (bytes.length * 8) >>> 0, true);
  view.setUint32(
    padded.length - 4,
    Math.floor(bytes.length / 0x20000000),
    true,
  );
  const state = [0x67452301, 0xefcdab89 | 0, 0x98badcfe | 0, 0x10325476];
  for (let offset = 0; offset < padded.length; offset += 64) {
    let [a, b, c, d] = state;
    for (let i = 0; i < 64; i++) {
      const round = i >>> 4;
      const f =
        round === 0
          ? (b & c) | (~b & d)
          : round === 1
            ? (d & b) | (~d & c)
            : round === 2
              ? b ^ c ^ d
              : c ^ (b | ~d);
      const index =
        round === 0
          ? i
          : round === 1
            ? (5 * i + 1) % 16
            : round === 2
              ? (3 * i + 5) % 16
              : (7 * i) % 16;
      const sum =
        (a + f + md5Constants[i] + view.getInt32(offset + index * 4, true)) | 0;
      const shift = md5Shifts[round * 4 + (i % 4)];
      const next = (b + ((sum << shift) | (sum >>> (32 - shift)))) | 0;
      a = d;
      d = c;
      c = b;
      b = next;
    }
    state[0] = (state[0] + a) | 0;
    state[1] = (state[1] + b) | 0;
    state[2] = (state[2] + c) | 0;
    state[3] = (state[3] + d) | 0;
  }
  const result = new Uint8Array(16),
    output = new DataView(result.buffer);
  state.forEach((word, i) => output.setInt32(i * 4, word, true));
  return Array.from(result, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function numeric(value, fallback) {
  const n = value === undefined || value === "" ? NaN : Number(value);
  return finite(n) ? n : fallback;
}

function lineEnd(start, path, expectedLength) {
  const parts = path.split("|");
  if (parts.shift() !== "L") return null;
  const points = [start];
  for (const part of parts) {
    const [x, y] = part.split(":").map(Number);
    if (!finite(x) || !finite(y)) return null;
    points.push({ x, y });
  }
  let remaining = expectedLength;
  let direction = null;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i];
    const length = distance(a, b);
    if (length === 0) continue;
    direction = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
    if (remaining <= length)
      return {
        x: a.x + direction.x * remaining,
        y: a.y + direction.y * remaining,
      };
    remaining -= length;
  }
  const last = points.at(-1);
  return direction
    ? {
        x: last.x + direction.x * remaining,
        y: last.y + direction.y * remaining,
      }
    : { ...start };
}

/** Parse local .osu text only; never changes the original beatmap. */
export function parseBeatmap(text) {
  if (typeof text !== "string") throw new TypeError("Expected .osu text.");
  if (text.length > 32 * 1024 * 1024)
    throw new RangeError("Beatmap file is too large.");
  const header = text.replace(/^\uFEFF/, "").match(/^osu file format v(\d+)/);
  const sections = new Map();
  let current = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const section = line.match(/^\[([^\]]+)\]$/);
    if (section) {
      current = section[1];
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current).push(line);
  }
  const fields = (name) =>
    Object.fromEntries(
      (sections.get(name) || []).flatMap((line) => {
        const colon = line.indexOf(":");
        return colon < 0
          ? []
          : [[line.slice(0, colon).trim(), line.slice(colon + 1).trim()]];
      }),
    );
  const general = fields("General"),
    difficulty = fields("Difficulty");
  const map = {
    fileFormat: Number(header?.[1]) || 0,
    mode: numeric(general.Mode, 0),
    cs: numeric(difficulty.CircleSize, 5),
    ar: numeric(
      difficulty.ApproachRate,
      numeric(difficulty.OverallDifficulty, 5),
    ),
    od: numeric(difficulty.OverallDifficulty, 5),
    stackLeniency: clamp(numeric(general.StackLeniency, 0.7), 0, 1),
    objects: [],
    valid: Boolean(header),
  };
  const multiplier = numeric(difficulty.SliderMultiplier, 1.4);
  const timing = (sections.get("TimingPoints") || [])
    .flatMap((line) => {
      const p = line.split(",");
      const time = Number(p[0]),
        beatLength = Number(p[1]);
      return finite(time) && finite(beatLength) && beatLength !== 0
        ? [
            {
              time,
              beatLength,
              uninherited: p[6] === undefined ? beatLength > 0 : p[6] === "1",
            },
          ]
        : [];
    })
    .sort((a, b) => a.time - b.time);
  let timingIndex = 0,
    beatLength = 500,
    velocity = 1;
  for (const line of sections.get("HitObjects") || []) {
    const p = line.split(",");
    const [x, y, startTime, flags] = p.slice(0, 4).map(Number);
    if (![x, y, startTime, flags].every(finite) || !Number.isInteger(flags)) {
      map.valid = false;
      continue;
    }
    while (
      timingIndex < timing.length &&
      timing[timingIndex].time <= startTime
    ) {
      const point = timing[timingIndex++];
      if (point.uninherited && point.beatLength > 0) {
        beatLength = point.beatLength;
        velocity = 1;
      } else if (!point.uninherited && point.beatLength < 0)
        velocity = clamp(-100 / point.beatLength, 0.1, 10);
    }
    const type =
      flags & 1
        ? "circle"
        : flags & 2
          ? "slider"
          : flags & 8
            ? "spinner"
            : flags & 128
              ? "hold"
              : "unknown";
    const object = {
      id: map.objects.length,
      x,
      y,
      startTime,
      endTime: startTime,
      type,
      endPosition: { x, y },
    };
    if (type === "slider") {
      const repeats = Number(p[6]),
        length = Number(p[7]);
      if (
        !Number.isInteger(repeats) ||
        repeats < 1 ||
        !finite(length) ||
        length < 0 ||
        !(multiplier > 0)
      ) {
        map.valid = false;
        continue;
      }
      object.endTime +=
        (length * repeats * beatLength) / (100 * multiplier * velocity);
      object.endPosition =
        repeats % 2 === 0 ? { x, y } : lineEnd({ x, y }, p[5] || "", length);
      object.pathLength = length;
    } else if (type === "spinner" || type === "hold") {
      object.endTime = Number((p[5] || "").split(":")[0]);
      if (!finite(object.endTime) || object.endTime < startTime) {
        map.valid = false;
        continue;
      }
    }
    if (map.objects.length && startTime < map.objects.at(-1).startTime)
      map.valid = false;
    map.objects.push(object);
  }
  if (!map.objects.length) map.valid = false;
  return map;
}

function effectiveDifficulty(map, context) {
  const modify = (value, multiplier) =>
    context.easy
      ? value / 2
      : context.hardRock
        ? Math.min(10, value * multiplier)
        : value;
  return {
    cs: finite(context.cs) ? context.cs : modify(map.cs, 1.3),
    ar: finite(context.ar) ? context.ar : modify(map.ar, 1.4),
  };
}

function prepareStacks(map, context) {
  const { cs, ar } = effectiveDifficulty(map, context);
  const approach = Math.trunc(ar < 5 ? 1800 - ar * 120 : 1200 - (ar - 5) * 150);
  const threshold = approach * map.stackLeniency;
  const scale = ((1 - (0.7 * (cs - 5)) / 5) / 2) * 1.00041;
  const objects = map.objects.map((object) => ({
    ...object,
    stack: 0,
    reliable: map.fileFormat >= 6,
  }));

  // Mark uncertainty before processing reverse chains. A later circle may sit
  // under a known slider which in turn stacks on an unknown curved slider end.
  // Delaying this marking until that earlier slider is visited would otherwise
  // leave the already-processed circle incorrectly marked reliable.
  for (let i = 0; i < objects.length; i++) {
    const slider = objects[i];
    if (slider.type !== "slider" || slider.endPosition) continue;
    for (
      let j = i + 1;
      j < objects.length && objects[j].startTime - slider.endTime <= threshold;
      j++
    ) {
      if (
        objects[j].type !== "spinner" &&
        distance(slider, objects[j]) <= slider.pathLength + 3
      )
        objects[j].reliable = false;
    }
  }

  // Reverse stack chains. Unknown curved slider endpoints do not get guessed:
  // conservatively propagate uncertainty to any chain they could influence.
  for (let i = objects.length - 1; i > 0; i--) {
    let base = objects[i];
    if (base.stack !== 0 || base.type === "spinner") continue;
    if (base.type === "circle") {
      const chain = [base];
      for (let j = i - 1; j >= 0; j--) {
        const previous = objects[j];
        if (previous.type === "spinner") continue;
        if (
          Math.trunc(base.startTime) - Math.trunc(previous.endTime) >
          threshold
        )
          break;
        if (previous.type === "slider" && !previous.endPosition) {
          // An odd-repeat curved slider can end anywhere within its path length.
          if (distance(previous, base) <= previous.pathLength + 3) {
            for (const item of chain) item.reliable = false;
            previous.reliable = false;
          }
        }
        if (previous.type === "slider" && near(previous.endPosition, base)) {
          const offset = base.stack - previous.stack + 1;
          for (let k = j + 1; k <= i; k++)
            if (near(previous.endPosition, objects[k])) {
              objects[k].stack -= offset;
              objects[k].reliable &&= previous.reliable && base.reliable;
            }
          break;
        }
        if (near(previous, base)) {
          previous.stack = base.stack + 1;
          previous.reliable &&= base.reliable;
          chain.push(previous);
          base = previous;
        }
      }
    } else if (base.type === "slider") {
      for (let j = i - 1; j >= 0; j--) {
        const previous = objects[j];
        if (previous.type === "spinner") continue;
        if (base.startTime - previous.startTime > threshold) break;
        if (
          previous.type === "slider" &&
          !previous.endPosition &&
          distance(previous, base) <= previous.pathLength + 3
        ) {
          base.reliable = false;
        }
        if (near(previous.endPosition, base)) {
          previous.stack = base.stack + 1;
          previous.reliable &&= base.reliable;
          base = previous;
        }
      }
    }
  }
  for (const object of objects)
    object.stackOffset = object.stack === 0 ? 0 : object.stack * scale * -6.4;
  return objects;
}

function lowerBound(objects, time) {
  let lo = 0,
    hi = objects.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (objects[mid].startTime < time) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export class NoteMatcher {
  constructor({ uncertaintyMs = 20, maxBatchMs = 250 } = {}) {
    this.uncertaintyMs = uncertaintyMs;
    this.maxBatchMs = maxBatchMs;
    this.map = null;
    this.reset();
  }
  setBeatmap(map) {
    this.map = map;
    this.reset();
  }
  reset() {
    this.used = new Set();
    this.ambiguous = new Set();
    this.prepared = null;
    this.signature = "";
  }
  /** All times, including rawOffset, are game/song milliseconds (before DT/HT). */
  observe({ errors = [], since, at, context = {} } = {}) {
    if (
      !this.map?.valid ||
      this.map.mode !== 0 ||
      (context.mode && context.mode !== "osu") ||
      context.supported === false ||
      !finite(since) ||
      !finite(at) ||
      at < since ||
      at - since > this.maxBatchMs
    )
      return [];
    const { cs, ar } = effectiveDifficulty(this.map, context);
    const signature = `${cs}|${ar}`;
    if (!this.prepared || signature !== this.signature) {
      this.prepared = prepareStacks(this.map, context);
      this.signature = signature;
    }
    const uncertainty = finite(context.clockUncertaintyMs)
      ? Math.max(this.uncertaintyMs, context.clockUncertaintyMs)
      : this.uncertaintyMs;
    const proposals = errors.map((hit) => {
      if (!finite(hit.rawOffset)) return { hit, candidates: [] };
      const earliest = since - hit.rawOffset - uncertainty;
      const latest = at - hit.rawOffset + uncertainty;
      const candidates = [];
      for (
        let i = lowerBound(this.prepared, earliest);
        i < this.prepared.length && this.prepared[i].startTime <= latest;
        i++
      ) {
        const object = this.prepared[i];
        if (!this.used.has(object.id)) candidates.push(object);
      }
      return { hit, candidates };
    });
    const multiplicity = new Map();
    for (const { candidates } of proposals)
      for (const object of candidates)
        multiplicity.set(object.id, (multiplicity.get(object.id) || 0) + 1);
    const output = [];
    for (const { hit, candidates } of proposals) {
      const object = candidates[0];
      if (
        candidates.length !== 1 ||
        multiplicity.get(object.id) !== 1 ||
        object.type !== "circle" ||
        !object.reliable ||
        this.ambiguous.has(object.id)
      ) {
        for (const candidate of candidates) this.ambiguous.add(candidate.id);
        continue;
      }
      this.used.add(object.id);
      output.push({
        ...hit,
        objectId: object.id,
        position: { x: object.x, y: object.y },
        stackOffset: object.stackOffset,
        objectTime: object.startTime,
        positioning: "unique-clock-window",
      });
    }
    return output;
  }
}

/**
 * Base map point + stack displacement -> game viewport pixels. HR reflects the
 * base Y before stack displacement. width/height must be the actual game viewport,
 * excluding letterbox bars; callers can add viewport x/y afterwards.
 */
export function osuPositionToScreen(
  point,
  { width, height, hardRock = false, stackOffset = 0 } = {},
) {
  if (
    !point ||
    !finite(point.x) ||
    !finite(point.y) ||
    !finite(width) ||
    !finite(height) ||
    width <= 0 ||
    height <= 0 ||
    !finite(stackOffset)
  )
    return null;
  const scale = Math.min(width / 640, height / 480);
  const x = point.x + stackOffset;
  const y = (hardRock ? 384 - point.y : point.y) + stackOffset;
  return {
    x: (width - 512 * scale) / 2 + x * scale,
    y: (height - 384 * scale) / 2 + (y + 8) * scale,
    scale,
  };
}
