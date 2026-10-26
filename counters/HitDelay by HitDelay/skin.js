const DEFAULT_BASE_URL = "http://127.0.0.1:24050";
const MAX_ANIMATION_FRAMES = 128;
const MAX_INI_BYTES = 256 * 1024;

function normalizeBaseUrl(value) {
  const url = new URL(value || DEFAULT_BASE_URL);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new TypeError(
      "The tosu API address must be an HTTP(S) URL without credentials.",
    );
  }
  url.search = "";
  url.hash = "";
  return url.href.replace(/\/+$/, "");
}

function normalizeMode(mode) {
  if (mode === 0 || ["0", "osu", "standard"].includes(mode)) return 0;
  if (mode === 3 || ["3", "mania"].includes(mode)) return 3;
  return null;
}

function normalizeGrade(grade, mode) {
  const value = String(grade).toLowerCase();
  const aliases = {
    miss: "0",
    meh: "50",
    ok: "100",
    good: "200",
    great: "300",
    perfect: "300g",
    max: "300g",
    geki: "300g",
  };
  const result = aliases[value] || value;
  const allowed =
    mode === 3
      ? ["0", "50", "100", "200", "300", "300g"]
      : ["0", "50", "100", "100k", "300", "300g", "300k"];
  return allowed.includes(result) ? result : null;
}

// skin.ini paths are file names relative to the selected skin, never URLs.
function safeAssetBase(value) {
  let text = String(value).trim();
  if (/^(["']).*\1$/.test(text)) text = text.slice(1, -1).trim();
  text = text.replace(/\\/g, "/");
  if (
    !text ||
    text.startsWith("/") ||
    /[\u0000-\u001f\u007f<>:"|?*#%]/.test(text)
  ) {
    return null;
  }
  const segments = text.split("/");
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        /[. ]$/.test(segment),
    )
  ) {
    return null;
  }
  return text.replace(/\.png$/i, "").replace(/@2x$/i, "");
}

function parseManiaSection(text, keyCount) {
  const sections = [];
  let section;
  for (const original of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const line = original.trim();
    if (!line || line.startsWith("//") || line.startsWith(";")) continue;
    const header = /^\[([^\]]+)\]\s*(?:(?:\/\/|;).*)?$/.exec(line);
    if (header) {
      section =
        header[1].toLowerCase() === "mania" ? Object.create(null) : undefined;
      if (section) sections.push(section);
      continue;
    }
    if (!section) continue;
    const assignment = /^([^:]+):\s*(.*?)\s*$/.exec(line);
    if (assignment) section[assignment[1].trim().toLowerCase()] = assignment[2];
  }
  return (
    sections.find((candidate) => Number(candidate.keys) === keyCount) || null
  );
}

async function cancelBody(response) {
  try {
    await response?.body?.cancel?.();
  } catch {
    // A server may finish or close its stream before cancellation.
  }
}

async function readSmallText(response) {
  const declaredLength = Number(response.headers?.get?.("content-length"));
  if (declaredLength > MAX_INI_BYTES) {
    await cancelBody(response);
    return null;
  }
  if (!response.body?.getReader) {
    const text = await response.text();
    return text.length <= MAX_INI_BYTES ? text : null;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > MAX_INI_BYTES) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

/** Resolve the current stable skin's judgment art without changing any skin files. */
export class SkinResolver {
  constructor({
    baseUrl = DEFAULT_BASE_URL,
    fetchImpl = globalThis.fetch?.bind(globalThis),
  } = {}) {
    if (typeof fetchImpl !== "function")
      throw new TypeError("A fetch implementation is required.");
    this.fetchImpl = fetchImpl;
    this.cache = new Map();
    this.iniCache = new Map();
    this.baseUrl = normalizeBaseUrl(baseUrl);
  }

  urlFor(assetPath, skinKey, baseUrl) {
    const encodedPath = assetPath.split("/").map(encodeURIComponent).join("/");
    const url = new URL(`${baseUrl}/files/skin/${encodedPath}`);
    // The endpoint always means "current skin"; distinguish same-name assets after a switch.
    url.searchParams.set("skin", skinKey);
    return url.href;
  }

  async probe(url) {
    let response;
    try {
      // tosu defines GET routes. Cancel the stream after headers rather than buffering PNGs.
      response = await this.fetchImpl(url, {
        method: "GET",
        cache: "no-store",
      });
      return response.ok === true;
    } catch {
      return false;
    } finally {
      await cancelBody(response);
    }
  }

  async maniaSection(skinKey, keyCount, baseUrl) {
    const key = JSON.stringify([baseUrl, skinKey, keyCount]);
    if (!this.iniCache.has(key)) {
      this.iniCache.set(
        key,
        (async () => {
          let response;
          try {
            response = await this.fetchImpl(
              this.urlFor("skin.ini", skinKey, baseUrl),
              {
                method: "GET",
                cache: "no-store",
              },
            );
            if (!response.ok) {
              await cancelBody(response);
              return null;
            }
            const text = await readSmallText(response);
            return text === null ? null : parseManiaSection(text, keyCount);
          } catch {
            await cancelBody(response);
            return null;
          }
        })(),
      );
    }
    return this.iniCache.get(key);
  }

  async resolve({ skinKey = "", mode, keyCount, grade } = {}) {
    const normalizedMode = normalizeMode(mode);
    if (normalizedMode === null) return null;
    const normalizedGrade = normalizeGrade(grade, normalizedMode);
    if (normalizedGrade === null) return null;
    const normalizedKeys = Number(keyCount);
    const keys =
      Number.isInteger(normalizedKeys) &&
      normalizedKeys >= 1 &&
      normalizedKeys <= 18
        ? normalizedKeys
        : null;
    const skin = String(skinKey);
    const baseUrl = this.baseUrl;
    const key = JSON.stringify([
      baseUrl,
      skin,
      normalizedMode,
      keys,
      normalizedGrade,
    ]);
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        this.resolveUncached({
          skinKey: skin,
          mode: normalizedMode,
          keyCount: keys,
          grade: normalizedGrade,
          baseUrl,
        }),
      );
    }
    return this.cache.get(key);
  }

  async resolveUncached({ skinKey, mode, keyCount, grade, baseUrl }) {
    let assetBase = `${mode === 3 ? "mania-" : ""}hit${grade}`;
    if (mode === 3 && keyCount !== null) {
      const section = await this.maniaSection(skinKey, keyCount, baseUrl);
      const override = section?.[`hit${grade}`];
      if (override !== undefined) {
        assetBase = safeAssetBase(override);
        if (assetBase === null) return null;
      }
    }
    for (const suffix of ["@2x", ""]) {
      const first = this.urlFor(
        `${assetBase}-0${suffix}.png`,
        skinKey,
        baseUrl,
      );
      if (!(await this.probe(first))) continue;
      const frames = [first];
      for (let index = 1; index < MAX_ANIMATION_FRAMES; index += 1) {
        const url = this.urlFor(
          `${assetBase}-${index}${suffix}.png`,
          skinKey,
          baseUrl,
        );
        if (!(await this.probe(url))) break;
        frames.push(url);
      }
      return {
        frames,
        frameMs: 1000 / 60,
        loop: mode === 3,
      };
    }
    for (const suffix of ["@2x", ""]) {
      const url = this.urlFor(`${assetBase}${suffix}.png`, skinKey, baseUrl);
      if (await this.probe(url)) {
        return {
          frames: [url],
          frameMs: 1000 / 60,
          loop: false,
        };
      }
    }
    return null;
  }
}
