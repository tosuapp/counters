class WebSocketManager {
    constructor(host) {
        this.host = host;
        this.sockets = {};
        this.createConnection = this.createConnection.bind(this);
    }

    createConnection(url, callback, filters) {
        let interval;
        const counterPath = window.COUNTER_PATH || "";
        const query = url.includes("?") ? `&l=${encodeURI(counterPath)}` : `?l=${encodeURI(counterPath)}`;
        const fullUrl = `ws://${this.host}${url}${query}`;
        this.sockets[url] = new WebSocket(fullUrl);

        this.sockets[url].onopen = () => {
            if (interval) clearInterval(interval);
            if (filters) this.sockets[url].send(`applyFilters:${JSON.stringify(filters)}`);
        };

        this.sockets[url].onclose = () => {
            delete this.sockets[url];
            interval = setTimeout(() => this.createConnection(url, callback, filters), 1000);
        };

        this.sockets[url].onmessage = ({ data }) => {
            if (!data) return;
            try {
                const parsed = JSON.parse(data);
                if (parsed && typeof parsed === "object" && !("error" in parsed)) callback(parsed);
            } catch (e) {}
        };
    }

    api_v2(callback, filters)         { this.createConnection("/websocket/v2", callback, filters); }
    api_v2_precise(callback, filters) { this.createConnection("/websocket/v2/precise", callback, filters); }
    commands(callback)                { this.createConnection("/websocket/commands", callback); }

    sendCommand(name, command, retry = 1) {
        const socket = this.sockets["/websocket/commands"];
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(`${name}:${command}`);
        } else if (retry <= 50) {
            setTimeout(() => this.sendCommand(name, command, retry + 1), 100);
        }
    }
}

const string = {
    global: { pp: "PP", ur: "UR", ratio: "Ratio", combo: "Max Combo", early: "Early", late: "Late", miss: "Miss" },
    modes: {
        mania:  { h300g: "MAX",   h300: "Perfect",   h200: "Great", h100: "Good", h50: "Bad" },
        catch:  {                 h300: "Fruit",                    h100: "Drop", h50: "Droplet" },
        fruits: {                 h300: "Fruit",                    h100: "Drop", h50: "Droplet" },
        taiko:  {                 h300: "Great",                    h100: "Ok" },
        osu:    {                 h300: "300",                      h100: "100",  h50: "50" }
    }
};

const getWindows = (mode, od, modsString = "") => {
    let mOd = od;
    if (mode === "mania") {
        if (modsString.includes("EZ")) mOd = od * 0.5;
        const hrMult = modsString.includes("HR") ? 5/7 : 1;
        return [16, ((64 - 3 * mOd) * hrMult), ((97 - 3 * mOd) * hrMult), ((127 - 3 * mOd) * hrMult), ((151 - 3 * mOd) * hrMult)];
    }
    
    if (modsString.includes("EZ")) mOd = od / 2;
    else if (modsString.includes("HR")) mOd = Math.min(od * 1.4, 10);
    
    if (mode === "taiko") return [(50 - 3 * mOd), (mOd >= 5 ? 119.5 - 8 * mOd : 110 - 6 * mOd), (mOd >= 5 ? 135 - 8 * mOd : 120 - 5 * mOd)];
    return [(80 - 6 * mOd), (140 - 8 * mOd), (200 - 10 * mOd)];
};

function updateRow(element, label, value) {
    if (element) element.innerHTML = `<span class="row-label">${label}</span><span class="row-val">${value}</span>`;
}

function distributeDelta(newTotal = 0, display, preciseTally, isMiss = false) {
    const delta = newTotal - display.t;
    if (delta <= 0) return; 
    
    if (isMiss) {
        const availableE = Math.max(0, preciseTally.e - display.e);
        const addE = Math.min(delta, availableE);
        display.e += addE;
        display.l += (delta - addE);
    } else {
        const preciseTotal = preciseTally.e + preciseTally.l;
        if (preciseTotal === 0) {
            const half = Math.floor(delta / 2);
            display.e += half;
            display.l += (delta - half);
        } else {
            const expectedE = Math.round(newTotal * (preciseTally.e / preciseTotal));
            const addE = Math.max(0, Math.min(delta, expectedE - display.e));
            display.e += addE;
            display.l += (delta - addE);
        }
    }
    display.t = newTotal;
}

function getRatioText(mode, hits) {
    const h300g = hits.geki || 0, h300 = hits[300] || 0, h200 = hits.katu || 0, h100 = hits[100] || 0, h50 = hits[50] || 0, h0 = hits[0] || 0;
    
    if (mode === "mania") {
        const total = h300g + h300 + h200 + h100 + h50 + h0;
        if (total === 0) return "0:1";
        return (total - h300g) === 0 ? "∞:1" : `${(h300g / (total - h300g)).toFixed(1)}:1`;
    } else {
        const total = h300 + h100 + h50 + h0; 
        if (total === 0) return "0:1";
        const nonPerfect = h100 + h50 + h0;
        return nonPerfect === 0 ? "∞:1" : `${(h300 / nonPerfect).toFixed(1)}:1`;
    }
}

function syncDeltaTallies(mode, hits) {
    if (mode === "mania") {
        distributeDelta(hits[300] || 0, displayTally.mania[0], hitTally.mania[0]);
        distributeDelta(hits.katu || 0, displayTally.mania[1], hitTally.mania[1]);
        distributeDelta(hits[100] || 0, displayTally.mania[2], hitTally.mania[2]);
        distributeDelta(hits[50] || 0,  displayTally.mania[3], hitTally.mania[3]);
        distributeDelta(hits[0] || 0,   displayTally.mania[4], hitTally.mania[4], true);
    } else if (mode === "taiko") {
        distributeDelta(hits[100] || 0, displayTally.taiko[0], hitTally.taiko[0]);
        distributeDelta(hits[0] || 0,   displayTally.taiko[1], hitTally.taiko[1], true);
    } else {
        distributeDelta(hits[100] || 0, displayTally.std[0], hitTally.std[0]);
        distributeDelta(hits[50] || 0,  displayTally.std[1], hitTally.std[1]);
        distributeDelta(hits[0] || 0,   displayTally.std[2], hitTally.std[2], true);
    }
}

function applyModeColors(mode, settings, fallback) {
    const root = document.documentElement;
    const applyHitCol = (prefix, labelVal, numVal) => {
        root.style.setProperty(`--color-${prefix}-label`, settings.useCustomHitCountLabelColors ? (labelVal || fallback) : fallback);
        root.style.setProperty(`--color-${prefix}-val`, settings.useCustomHitCountNumberColors ? (numVal || fallback) : fallback);
    };

    applyHitCol('miss', settings.colorMissLabel, settings.colorMissVal);

    if (mode === "osu") {
        applyHitCol('300g', fallback, fallback);
        applyHitCol('300', settings.colorOsu300Label, settings.colorOsu300Val);
        applyHitCol('200', fallback, fallback);
        applyHitCol('100', settings.colorOsu100Label, settings.colorOsu100Val);
        applyHitCol('50', settings.colorOsu50Label, settings.colorOsu50Val);
    } else if (mode === "taiko") {
        applyHitCol('300g', fallback, fallback);
        applyHitCol('300', settings.colorTaiko300Label, settings.colorTaiko300Val);
        applyHitCol('200', fallback, fallback);
        applyHitCol('100', settings.colorTaiko100Label, settings.colorTaiko100Val);
        applyHitCol('50', fallback, fallback);
    } else if (mode === "catch" || mode === "fruits") {
        applyHitCol('300g', fallback, fallback);
        applyHitCol('300', settings.colorCatch300Label, settings.colorCatch300Val);
        applyHitCol('200', fallback, fallback);
        applyHitCol('100', settings.colorCatch100Label, settings.colorCatch100Val);
        applyHitCol('50', settings.colorCatch50Label, settings.colorCatch50Val);
    } else {
        applyHitCol('300g', settings.colorMania300gLabel, settings.colorMania300gVal);
        applyHitCol('300', settings.colorMania300Label, settings.colorMania300Val);
        applyHitCol('200', settings.colorMania200Label, settings.colorMania200Val);
        applyHitCol('100', settings.colorMania100Label, settings.colorMania100Val);
        applyHitCol('50', settings.colorMania50Label, settings.colorMania50Val);
    }
}

const toggleClass = (el, condition, className = "hidden") => {
    if (el) condition ? el.classList.add(className) : el.classList.remove(className);
};

async function autoScaleFont() {
    await document.fonts.ready;
    
    let measurer = document.getElementById("font-measurer");
    if (!measurer) {
        measurer = document.createElement("span");
        measurer.id = "font-measurer";
        measurer.style.position = "absolute";
        measurer.style.visibility = "hidden";
        measurer.style.whiteSpace = "nowrap";
        measurer.style.fontSize = "20pt"; 
        document.body.appendChild(measurer);
    }
    
    measurer.style.fontFamily = document.documentElement.style.getPropertyValue('--main-font');
    
    const targetLabelW = settings.labelColumnWidth || 140;
    const targetValW = settings.valueColumnWidth || 90;

    measurer.innerText = "Max Combo";
    const actualLabelW = measurer.offsetWidth || targetLabelW;
    
    measurer.innerText = "88888.8"; 
    const actualValW = measurer.offsetWidth || targetValW;
    
    const scaleLabel = targetLabelW / actualLabelW;
    const scaleVal = targetValW / actualValW;
    
    const minScale = Math.min(scaleLabel, scaleVal, 1);
    let finalSize = 20 * minScale;
    
    if (finalSize < 10) finalSize = 10; 
    
    document.documentElement.style.setProperty('--scaled-font-size', `${finalSize}pt`);
}

const wsManager = new WebSocketManager(window.location.host);

const hitcountBox = document.getElementById("hitcount_box");
const elPp = document.getElementById("pp"), elUr = document.getElementById("ur"), elRatio = document.getElementById("ratio"), elMaxCombo = document.getElementById("maxCombo");
const elEarly = document.getElementById("earlyCount"), elLate = document.getElementById("lateCount");
const el300g = document.getElementById("h300g"), el300 = document.getElementById("h300"), el200 = document.getElementById("h200");
const el100 = document.getElementById("h100"), el50 = document.getElementById("h50"), elMiss = document.getElementById("miss");
const brHits = document.getElementById("brHits"), brEarlyLate = document.getElementById("brEarlyLate");

let cache = { state: "", mode: "osu", od: 0, mods: "", processedHits: 0, curTotalHits: 0, lastTime: 0 };
let hitTally = {
    mania: [ {e:0, l:0}, {e:0, l:0}, {e:0, l:0}, {e:0, l:0}, {e:0, l:0} ], 
    taiko: [ {e:0, l:0}, {e:0, l:0} ], 
    std: [ {e:0, l:0}, {e:0, l:0}, {e:0, l:0} ]
};
let displayTally = {
    mania: [ {e:0, l:0, t:0}, {e:0, l:0, t:0}, {e:0, l:0, t:0}, {e:0, l:0, t:0}, {e:0, l:0, t:0} ], 
    taiko: [ {e:0, l:0, t:0}, {e:0, l:0, t:0} ], 
    std: [ {e:0, l:0, t:0}, {e:0, l:0, t:0}, {e:0, l:0, t:0} ]
};

let settings = {
    labelColumnWidth: 130, valueColumnWidth: 90, lineHeight: 1.25,
    fontName: "Arial", useCustomFont: false, customFontName: "font.ttf",
    globalTextColor: "#ffffff", swapLabelValue: false,
    hidePP: false, useCustomPPColors: false, colorPPLabel: "#ffffff", colorPPVal: "#ffffff",
    hideUR: false, useCustomURColors: false, colorURLabel: "#ffffff", colorURVal: "#ffffff",
    hideRatio: false, useCustomRatioColors: false, colorRatioLabel: "#ffffff", colorRatioVal: "#ffffff",
    hideMaxCombo: false, useCustomComboColors: false, colorComboLabel: "#ffffff", colorComboVal: "#ffffff",
    hideHitCounts: false, useCustomHitCountLabelColors: true, useCustomHitCountNumberColors: false,
    colorOsu300Label: "#50b4ff", colorOsu300Val: "#50b4ff", colorOsu100Label: "#47e547", colorOsu100Val: "#47e547", colorOsu50Label: "#ffcc22", colorOsu50Val: "#ffcc22",
    colorTaiko300Label: "#ffcc22", colorTaiko300Val: "#ffcc22", colorTaiko100Label: "#47e547", colorTaiko100Val: "#47e547",
    colorCatch300Label: "#ffcc22", colorCatch300Val: "#ffcc22", colorCatch100Label: "#47e547", colorCatch100Val: "#47e547", colorCatch50Label: "#50b4ff", colorCatch50Val: "#50b4ff",
    colorMania300gLabel: "#ffffff", colorMania300gVal: "#ffffff", colorMania300Label: "#ffcc22", colorMania300Val: "#ffcc22", colorMania200Label: "#47e547", colorMania200Val: "#47e547", colorMania100Label: "#50b4ff", colorMania100Val: "#50b4ff", colorMania50Label: "#888888", colorMania50Val: "#888888",
    colorMissLabel: "#ff0000", colorMissVal: "#ff0000",
    hideEarlyLate: false, useCustomEarlyLateColors: true, colorEarlyLabel: "#0000ff", colorEarlyVal: "#ffffff", colorLateLabel: "#ff0000", colorLateVal: "#ffffff"
};

wsManager.commands((data) => {
    try {
        if (data.command !== "getSettings") return;
        Object.assign(settings, data.message);
        applySettingsToUI();
    } catch (e) {}
});

wsManager.sendCommand("getSettings", window.COUNTER_PATH ? encodeURI(window.COUNTER_PATH) : "");

function applySettingsToUI() {
    const root = document.documentElement;
    const g = settings.globalTextColor || "#ffffff";
    const mode = cache.mode || "osu";

    root.style.setProperty('--label-width', `${settings.labelColumnWidth || 140}px`);
    root.style.setProperty('--val-width', `${settings.valueColumnWidth || 90}px`);
    root.style.setProperty('--line-height', settings.lineHeight || 1.25);

    let fontStyle = document.getElementById("custom-font-style");
    const systemFont = settings.fontName ? `"${settings.fontName}", sans-serif` : "Arial, sans-serif";

    if (settings.useCustomFont && settings.customFontName) {
        if (!fontStyle) {
            fontStyle = document.createElement("style");
            fontStyle.id = "custom-font-style";
            document.head.appendChild(fontStyle);
        }
        fontStyle.innerHTML = `
            @font-face {
                font-family: 'CustomOverlayFont';
                src: url('./${settings.customFontName}');
            }
        `;
        root.style.setProperty('--main-font', `'CustomOverlayFont', ${systemFont}`);
    } else {
        if (fontStyle) fontStyle.innerHTML = "";
        root.style.setProperty('--main-font', systemFont);
    }

    toggleClass(document.getElementById("countBox"), settings.swapLabelValue, "swapped");
    
    toggleClass(elPp, settings.hidePP);
    toggleClass(elUr, settings.hideUR);
    toggleClass(elRatio, settings.hideRatio);
    toggleClass(elMaxCombo, settings.hideMaxCombo);

    if (settings.hideHitCounts) {
        [el300g, el300, el200, el100, el50, elMiss, brHits].forEach(el => toggleClass(el, true));
    } else {
        toggleClass(elMiss, false); toggleClass(brHits, false);
    }

    const hideEL = settings.hideEarlyLate;
    [elEarly, elLate, brEarlyLate].forEach(el => toggleClass(el, hideEL));

    const applyStatColor = (labelProp, valProp, condition, lCol, vCol) => {
        root.style.setProperty(labelProp, condition ? (lCol || g) : g);
        root.style.setProperty(valProp, condition ? (vCol || g) : g);
    };

    applyStatColor('--color-pp-label', '--color-pp-val', settings.useCustomPPColors, settings.colorPPLabel, settings.colorPPVal);
    applyStatColor('--color-ur-label', '--color-ur-val', settings.useCustomURColors, settings.colorURLabel, settings.colorURVal);
    applyStatColor('--color-ratio-label', '--color-ratio-val', settings.useCustomRatioColors, settings.colorRatioLabel, settings.colorRatioVal);
    applyStatColor('--color-combo-label', '--color-combo-val', settings.useCustomComboColors, settings.colorComboLabel, settings.colorComboVal);
    applyStatColor('--color-early-label', '--color-early-val', settings.useCustomEarlyLateColors, settings.colorEarlyLabel, settings.colorEarlyVal);
    applyStatColor('--color-late-label', '--color-late-val', settings.useCustomEarlyLateColors, settings.colorLateLabel, settings.colorLateVal);

    applyModeColors(mode, settings, g);
    
    autoScaleFont();
}

function resetCounters() {
    if (!settings.hideUR) updateRow(elUr, string.global.ur, "0.00");
    if (!settings.hideRatio) updateRow(elRatio, string.global.ratio, "0:1");
    if (!settings.hideEarlyLate) { updateRow(elEarly, string.global.early, "0"); updateRow(elLate, string.global.late, "0"); }
    
    hitTally.mania.forEach(t => { t.e = 0; t.l = 0; }); hitTally.taiko.forEach(t => { t.e = 0; t.l = 0; }); hitTally.std.forEach(t => { t.e = 0; t.l = 0; });
    displayTally.mania.forEach(t => { t.e = 0; t.l = 0; t.t = 0; }); displayTally.taiko.forEach(t => { t.e = 0; t.l = 0; t.t = 0; }); displayTally.std.forEach(t => { t.e = 0; t.l = 0; t.t = 0; });
    cache.processedHits = 0; cache.curTotalHits = 0;
}

wsManager.api_v2((data) => {
    if (!data.state?.name) return;
    const state = data.state.name;

    if (cache.state !== state) {
        if (hitcountBox) hitcountBox.style.opacity = (state === "play") ? 1 : 0;
        if (state !== "play") resetCounters();
    }

    if (!settings.hidePP) {
        const ppValue = (state === 'play' || state === 'resultScreen') ? (data.play?.pp?.current || 0) : (data.performance?.pp?.current || data.play?.pp?.current || 0);
        updateRow(elPp, string.global.pp, Math.round(ppValue) + 'pp');
    }

    if (state === "play") {
        const mode = data.play?.mode?.name ?? cache.mode;
        
        if (!settings.hideMaxCombo) updateRow(elMaxCombo, string.global.combo, data.play?.combo?.max || 0);

        let od = cache.od;
        if (data.beatmap?.stats?.od !== undefined) {
            od = (typeof data.beatmap.stats.od === "object" && data.beatmap.stats.od.original !== undefined) ? data.beatmap.stats.od.original : data.beatmap.stats.od;
        }

        let mods = cache.mods;
        if (data.play?.mods) {
            mods = (typeof data.play.mods === "string") ? data.play.mods : (typeof data.play.mods.name === "string" ? data.play.mods.name : data.play.mods.join(""));
        }

        if (cache.mode !== mode || cache.od !== od || cache.mods !== mods) {
            cache.mode = mode; cache.od = od; cache.mods = mods;
            cache.windows = getWindows(cache.mode, cache.od, cache.mods);
            resetCounters();
            applySettingsToUI();
        }

        const hits = data.play?.hits || {};
        const modeLabels = string.modes[mode] || string.modes.osu;
        
        const updateHitRow = (el, key, val) => {
            if (settings.hideHitCounts) { toggleClass(el, true); return; }
            if (modeLabels[key]) { toggleClass(el, false); updateRow(el, modeLabels[key], val); } 
            else { toggleClass(el, true); }
        };

        updateHitRow(el300g, 'h300g', hits.geki || 0);
        updateHitRow(el300,  'h300',  hits[300] || 0);
        updateHitRow(el200,  'h200',  hits.katu || 0);
        updateHitRow(el100,  'h100',  hits[100] || 0);
        updateHitRow(el50,   'h50',   hits[50] || 0);
        
        if (!settings.hideHitCounts) updateRow(elMiss, string.global.miss, hits[0] || 0);
        if (!settings.hideRatio) updateRow(elRatio, string.global.ratio, getRatioText(mode, hits));

        const isCatch = (mode === "catch" || mode === "fruits");
        const hideEL = isCatch || settings.hideEarlyLate;
        [elEarly, elLate, brEarlyLate].forEach(el => toggleClass(el, hideEL));

        const totalHits = (hits.geki || 0) + (hits[300] || 0) + (hits.katu || 0) + (hits[100] || 0) + (hits[50] || 0) + (hits[0] || 0);
        if (totalHits === 0 && cache.curTotalHits > 0) resetCounters();

        if (totalHits >= cache.curTotalHits) {
            cache.curTotalHits = totalHits;
            syncDeltaTallies(mode, hits);

            if (!hideEL) {
                let totalEarly = 0, totalLate = 0;
                const currentTallyArr = mode === "mania" ? displayTally.mania : (mode === "taiko" ? displayTally.taiko : displayTally.std);
                currentTallyArr.forEach(t => { totalEarly += t.e; totalLate += t.l; });
                updateRow(elEarly, string.global.early, totalEarly);
                updateRow(elLate, string.global.late, totalLate);
            }
        }
    }
    cache.state = state;
}, ["state", { field: "play", keys: ["mode", "mods", "hits", "combo", "pp"] }, { field: "beatmap", keys: ["stats"] }, { field: "performance", keys: ["pp"] }]);

wsManager.api_v2_precise((data) => {
    if (cache.state !== "play") return;
    const hitErrors = data.hitErrors || [];
    
    if (data.currentTime < (cache.lastTime || 0) - 50) {
        resetCounters(); cache.lastTime = data.currentTime; cache.processedHits = hitErrors.length; return;
    }
    cache.lastTime = data.currentTime;

    if (hitErrors.length < cache.processedHits) {
        if (hitErrors.length === 0 || (cache.processedHits - hitErrors.length > 5)) { 
            resetCounters(); cache.processedHits = hitErrors.length; 
        }
        return;
    }

    if (hitErrors.length > cache.processedHits) {
        const newHits = hitErrors.slice(cache.processedHits);
        cache.processedHits = hitErrors.length;
        const mode = cache.mode, windows = cache.windows;

        newHits.forEach(ms => {
            const msAbs = Math.abs(ms);
            const isEarly = ms < 0;
            
            if (mode === "mania") {
                const t = hitTally.mania;
                if (msAbs <= windows[0]) {} 
                else if (msAbs <= windows[1]) { isEarly ? t[0].e++ : t[0].l++; } 
                else if (msAbs <= windows[2]) { isEarly ? t[1].e++ : t[1].l++; } 
                else if (msAbs <= windows[3]) { isEarly ? t[2].e++ : t[2].l++; } 
                else if (msAbs <= windows[4]) { isEarly ? t[3].e++ : t[3].l++; } 
                else { isEarly ? t[4].e++ : t[4].l++; }
            } else if (mode === "taiko") {
                const t = hitTally.taiko;
                if (msAbs <= windows[0]) {} 
                else if (msAbs <= windows[1]) { isEarly ? t[0].e++ : t[0].l++; } 
                else { isEarly ? t[1].e++ : t[1].l++; }
            } else {
                const t = hitTally.std;
                if (msAbs <= windows[0]) {} 
                else if (msAbs <= windows[1]) { isEarly ? t[0].e++ : t[0].l++; } 
                else if (msAbs <= windows[2]) { isEarly ? t[1].e++ : t[1].l++; } 
                else { isEarly ? t[2].e++ : t[2].l++; }
            }
        });
    }

    if (!settings.hideUR) {
        if (hitErrors.length > 0) {
            let sum = 0, sumSq = 0;
            const len = hitErrors.length;
            for (let i = 0; i < len; i++) {
                sum += hitErrors[i];
                sumSq += hitErrors[i] * hitErrors[i];
            }
            const mean = sum / len;
            const ur = Math.sqrt((sumSq / len) - (mean * mean)) * 10;
            updateRow(elUr, string.global.ur, ur.toFixed(2));
        } else {
            updateRow(elUr, string.global.ur, "0.00");
        }
    }
}, ["hitErrors", "currentTime"]);