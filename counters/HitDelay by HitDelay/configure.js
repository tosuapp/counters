import {
  DEFINITIONS,
  DEFAULT_SETTINGS,
  normalizeSettings,
  settingsFromMessage,
  loadSettings,
  persistSettings,
} from "./settings.js";
import { TosuConnection, apiBase, counterPath } from "./tosu.js";

const form = document.querySelector("#settings-form");
const preview = document.querySelector("#preview");
const status = document.querySelector("#connection");
const saveState = document.querySelector("#save-state");
const saveButton = document.querySelector("#save");
let settings = loadSettings();
let dirty = false;
let connected = false;
let demo = true;
let debounceTimer;
let latestSnapshot = null,
  snapshotAt = 0;
const groups = new Map();
for (const def of DEFINITIONS) {
  if (!groups.has(def.group)) {
    const fieldset = document.createElement("fieldset");
    const legend = document.createElement("legend");
    legend.textContent = def.group;
    fieldset.append(legend);
    form.append(fieldset);
    groups.set(def.group, fieldset);
  }
  const label = document.createElement("label");
  label.className = "field";
  const text = document.createElement("span");
  text.className = "field-text";
  text.textContent = def.title;
  if (def.description) {
    const small = document.createElement("small");
    small.textContent = def.description;
    text.append(small);
  }
  const input = document.createElement("input");
  input.type = def.type;
  input.name = def.uniqueID;
  input.id = def.uniqueID;
  if (def.type === "number") {
    input.min = def.min;
    input.max = def.max;
    input.step = [
      "holdMs",
      "fadeMs",
      "maxVisible",
      "imageHeight",
      "fontSize",
      "offsetX",
      "offsetY",
    ].includes(def.uniqueID)
      ? "1"
      : "0.1";
  }
  if (def.type === "text") input.maxLength = 8;
  label.append(text, input);
  groups.get(def.group).append(label);
}

function fillForm() {
  for (const d of DEFINITIONS) {
    const input = form.elements.namedItem(d.uniqueID);
    if (d.type === "checkbox") input.checked = settings[d.uniqueID];
    else input.value = settings[d.uniqueID];
  }
  updateLabelInputs();
}
function updateLabelInputs() {
  for (const name of ["earlyText", "lateText"])
    form.elements.namedItem(name).disabled = settings.chineseLabels;
}
function relay(channel, payload) {
  preview.contentWindow?.postMessage(
    { type: "hitdelay-transport", channel, payload },
    location.origin,
  );
}
function sendPreview() {
  preview.contentWindow?.postMessage(
    { type: "hitdelay-settings", settings },
    location.origin,
  );
}
function save() {
  persistSettings(settings);
  if (connection.save(settings)) {
    saveState.textContent = "已发送，正在确认保存…";
    setTimeout(() => connection.refreshSettings(), 850);
  } else saveState.textContent = "已保存在此浏览器；连接 tosu 后可同步";
}
form.addEventListener("input", () => {
  const input = {};
  for (const d of DEFINITIONS) {
    const element = form.elements.namedItem(d.uniqueID);
    input[d.uniqueID] = d.type === "checkbox" ? element.checked : element.value;
  }
  settings = normalizeSettings(input);
  dirty = true;
  updateLabelInputs();
  persistSettings(settings);
  sendPreview();
  saveState.textContent = "修改已预览，尚未保存到 tosu";
  clearTimeout(debounceTimer);
});
saveButton.addEventListener("click", save);
document.querySelector("#reset").addEventListener("click", () => {
  settings = normalizeSettings(DEFAULT_SETTINGS);
  dirty = true;
  fillForm();
  persistSettings(settings);
  sendPreview();
  saveState.textContent = "已恢复默认；点击保存应用到 tosu";
});
preview.addEventListener("load", sendPreview);

function switchMode(isDemo) {
  demo = isDemo;
  const url = new URL("index.html", location.href);
  if (demo) url.searchParams.set("demo", "1");
  url.searchParams.set("relay", "1");
  const server = new URLSearchParams(location.search).get("server");
  if (server) url.searchParams.set("server", server);
  preview.src = url;
  document.querySelector("#demo-mode").classList.toggle("selected", demo);
  document.querySelector("#live-mode").classList.toggle("selected", !demo);
  document.querySelector("#stage-caption").textContent = demo
    ? "模拟预览 · 无需启动游戏"
    : "实时预览 · 等待 stable 击打";
}
document.querySelector("#demo-mode").onclick = () => switchMode(true);
document.querySelector("#live-mode").onclick = () => switchMode(false);
document.querySelectorAll("[data-sample]").forEach((button) =>
  button.addEventListener("click", () => {
    const hits =
      button.dataset.sample === "chord"
        ? [
            { mode: "mania", grade: "200", offset: -55, direction: "early" },
            { mode: "mania", grade: "100", offset: 88, direction: "late" },
            { mode: "mania", grade: "50", offset: -110, direction: "early" },
          ]
        : [
            {
              mode: "osu",
              grade: "100",
              offset: button.dataset.sample === "early" ? -65 : 65,
              direction: button.dataset.sample,
            },
          ];
    for (const hit of hits)
      preview.contentWindow?.postMessage(
        { type: "hitdelay-sample", hit },
        location.origin,
      );
  }),
);
window.addEventListener("message", (event) => {
  if (
    event.origin !== location.origin ||
    event.source !== preview.contentWindow
  )
    return;
  if (event.data?.type === "hitdelay-preview-ready") {
    sendPreview();
    relay("status", connected ? "connected" : "waiting");
    // Replaying a previous precise packet would fabricate a current hit. Only a
    // fresh context baseline is shared when an iframe has just been replaced.
    if (latestSnapshot && performance.now() - snapshotAt < 250)
      relay("snapshot", latestSnapshot);
    return;
  }
  if (event.data?.type !== "hitdelay-status") return;
  const ctx = event.data.context;
  document.querySelector("#live-status").textContent = event.data.demo
    ? `当前素材：${ctx.skinKey || "等待游戏"} · 模拟击打预览`
    : `${ctx.mode || "未知模式"} · 皮肤：${ctx.skinKey || "等待游戏"} · ${ctx.playing ? "游戏中" : "未开始游玩"}${ctx.supported === false ? " · 当前客户端／模式不支持" : ""}${ctx.mode === "mania" ? " · 判定区域显示" : ctx.following ? (ctx.positioningReady ? " · 逐圆圈显示已就绪" : " · 正在读取谱面坐标") : " · 固定 HUD"}`;
});

const connection = new TosuConnection({
  baseUrl: apiBase(),
  path: counterPath(),
  onSnapshot: (data) => {
    latestSnapshot = data;
    snapshotAt = performance.now();
    relay("snapshot", data);
  },
  onPrecise: (values) => relay("precise", values),
  onDisconnect: () => {
    latestSnapshot = null;
    relay("disconnect");
  },
  onSettings: (message) => {
    const incoming = normalizeSettings(settingsFromMessage(message));
    if (!dirty || JSON.stringify(incoming) === JSON.stringify(settings)) {
      settings = incoming;
      dirty = false;
      fillForm();
      persistSettings(settings);
      sendPreview();
      saveState.textContent = "已与 tosu 同步";
    }
  },
  onStatus: (kind, state) => {
    if (kind !== "precise") return;
    relay("status", state);
    connected = state === "connected";
    status.textContent = connected ? "tosu 已连接" : "tosu 未启动 · 可先预览";
    status.classList.toggle("connected", connected);
    saveButton.disabled = !connected;
  },
});
fillForm();
switchMode(true);
connection.start();
window.addEventListener(
  "pagehide",
  () => {
    connection.stop();
    clearTimeout(debounceTimer);
  },
  { once: true },
);
