export const STORAGE_KEY = "hitdelay.official.settings.v1";

const option = (
  uniqueID,
  type,
  title,
  value,
  group,
  description = "",
  min,
  max,
) => ({ uniqueID, type, title, value, group, description, min, max });

export const DEFINITIONS = [
  option("enabled", "checkbox", "启用快慢提示", true, "显示"),
  option(
    "followNotes",
    "checkbox",
    "跟随被击打的圆圈",
    true,
    "显示",
    "osu! 主模式逐圆圈显示；无法唯一对应时跳过。mania 独立显示在判定区域。",
  ),
  option(
    "noteBadgeOnly",
    "checkbox",
    "圆圈旁只追加快慢文字",
    true,
    "显示",
    "沿用游戏原生的皮肤评分；关闭后另外绘制当前皮肤评分图片。",
  ),
  option(
    "useSkin",
    "checkbox",
    "使用当前皮肤评分图片",
    true,
    "显示",
    "找不到图片时自动显示数字。",
  ),
  option(
    "showGrade",
    "checkbox",
    "显示时机档位",
    true,
    "显示",
    "≈ 表示按时差推算；不是滑条或长按的最终评分。",
  ),
  option("showMs", "checkbox", "显示毫秒误差", true, "显示"),
  option(
    "tintSkin",
    "checkbox",
    "评分图片也染色",
    false,
    "显示",
    "关闭时保留皮肤原色，只给 F/S 和误差上色。",
  ),
  option(
    "chineseLabels",
    "checkbox",
    "中文快慢提示",
    false,
    "快慢与颜色",
    "开启使用“快 / 慢”，例如 200-快、100-慢；关闭使用 F/S 或下方自定义文字。",
  ),
  option(
    "invertLabels",
    "checkbox",
    "反向快慢文字",
    false,
    "快慢与颜色",
    "交换 F/S 或快/慢；真实误差方向和颜色不变。",
  ),
  option("swapColors", "checkbox", "交换快慢颜色", false, "快慢与颜色"),
  option(
    "earlyText",
    "text",
    "打快时的自定义文字",
    "F",
    "快慢与颜色",
    "关闭中文模式时使用。",
  ),
  option(
    "lateText",
    "text",
    "打慢时的自定义文字",
    "S",
    "快慢与颜色",
    "关闭中文模式时使用。",
  ),
  option("earlyColor", "color", "打快的颜色", "#58c9ff", "快慢与颜色"),
  option("lateColor", "color", "打慢的颜色", "#ffb267", "快慢与颜色"),
  option(
    "deadZoneMs",
    "number",
    "不显示快慢的范围 ±ms",
    1,
    "快慢与颜色",
    "在此范围内不显示额外提示。",
    0,
    100,
  ),
  option("enableOsu", "checkbox", "启用 osu! 主模式", true, "osu! 主模式"),
  option("osu300", "checkbox", "300 时机档位", false, "osu! 主模式"),
  option("osu100", "checkbox", "100 时机档位", true, "osu! 主模式"),
  option("osu50", "checkbox", "50 时机档位", true, "osu! 主模式"),
  option("enableMania", "checkbox", "启用 osu!mania", true, "osu!mania"),
  option("mania300g", "checkbox", "彩 300 / MAX 时机档位", false, "osu!mania"),
  option("mania300", "checkbox", "300 时机档位", true, "osu!mania"),
  option("mania200", "checkbox", "200 时机档位", true, "osu!mania"),
  option("mania100", "checkbox", "100 时机档位", true, "osu!mania"),
  option("mania50", "checkbox", "50 时机档位", true, "osu!mania"),
  option(
    "maniaOffsetX",
    "number",
    "快慢提示水平偏移 px",
    0,
    "osu!mania",
    "相对皮肤原生评分位置，按 1080p 尺度设置。mania 始终只刷新最新一次提示。",
    -600,
    600,
  ),
  option(
    "maniaOffsetY",
    "number",
    "快慢提示垂直偏移 px",
    -96,
    "osu!mania",
    "默认显示在原生评分上方，避免重合；负数向上，正数向下。",
    -400,
    400,
  ),
  option(
    "showUnknown",
    "checkbox",
    "缺少窗口时只显示快慢文字",
    false,
    "兼容性",
    "仅显示方向与误差，不猜测评分；独立于上面的档位开关。",
  ),
  option("imageHeight", "number", "评分图片高度 px", 46, "布局", "", 16, 100),
  option("fontSize", "number", "文字大小 px", 36, "布局", "", 14, 80),
  option("holdMs", "number", "停留时间 ms", 500, "布局", "", 80, 3000),
  option("fadeMs", "number", "淡出时间 ms", 160, "布局", "", 0, 1500),
  option(
    "maxVisible",
    "number",
    "同时显示条数（主模式）",
    4,
    "布局",
    "mania 固定只显示最新一次，新判定立即替换旧提示。",
    1,
    8,
  ),
  option(
    "offsetX",
    "number",
    "相对位置水平偏移 px",
    0,
    "布局",
    "逐圆圈模式相对 note；固定模式相对画布中心。按 1080p 尺度设置。",
    -240,
    240,
  ),
  option("offsetY", "number", "相对位置垂直偏移 px", 0, "布局", "", -120, 120),
];

export const DEFAULT_SETTINGS = Object.freeze(
  Object.fromEntries(DEFINITIONS.map((d) => [d.uniqueID, d.value])),
);

export function normalizeSettings(input = {}) {
  const out = {};
  for (const d of DEFINITIONS) {
    const value = input?.[d.uniqueID] ?? d.value;
    if (d.type === "checkbox")
      out[d.uniqueID] = value === true || value === "true" || value === 1;
    if (d.type === "number") {
      const n = Number(value);
      out[d.uniqueID] = Number.isFinite(n)
        ? Math.min(d.max, Math.max(d.min, n))
        : d.value;
    }
    if (d.type === "color")
      out[d.uniqueID] = /^#[\da-f]{6}$/i.test(String(value))
        ? String(value)
        : d.value;
    if (d.type === "text")
      out[d.uniqueID] =
        String(value)
          .replace(/[\u0000-\u001f]/g, "")
          .slice(0, 8) || d.value;
  }
  out.maxVisible = Math.round(out.maxVisible);
  return out;
}

export function settingsFromMessage(message) {
  if (Array.isArray(message))
    return Object.fromEntries(message.map((d) => [d.uniqueID, d.value]));
  return message && typeof message === "object" ? message : {};
}

export function loadSettings() {
  try {
    return normalizeSettings(
      JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"),
    );
  } catch {
    return normalizeSettings();
  }
}

export function persistSettings(settings) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeSettings(settings)),
    );
  } catch {
    /* optional cache */
  }
}

export function hitPresentation(hit, settings) {
  const s = normalizeSettings(settings);
  if (
    !s.enabled ||
    !hit ||
    !Number.isFinite(hit.offset) ||
    Math.abs(hit.offset) <= s.deadZoneMs
  )
    return null;
  if (
    hit.mode === "osu"
      ? !s.enableOsu
      : hit.mode === "mania"
        ? !s.enableMania
        : true
  )
    return null;
  if (hit.grade === null || hit.grade === undefined) {
    if (!s.showUnknown) return null;
  } else if (!s[`${hit.mode}${hit.grade}`]) return null;
  const early = hit.direction === "early";
  const labelEarly = s.invertLabels ? !early : early;
  const colorEarly = s.swapColors ? !early : early;
  return {
    label: s.chineseLabels
      ? labelEarly
        ? "快"
        : "慢"
      : labelEarly
        ? s.earlyText
        : s.lateText,
    color: colorEarly ? s.earlyColor : s.lateColor,
    grade: hit.grade,
    gradeLabel: hit.grade === "300g" ? "MAX" : String(hit.grade ?? ""),
    offsetText: `${hit.offset > 0 ? "+" : ""}${hit.offset.toFixed(1)} ms`,
  };
}
