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

const getWindows = (mode, od, modsString) => {
    let mOd = od;
    const mods = modsString || "";
    
    if (mode === "mania") {
        if (mods.includes("EZ")) mOd = od * 0.5;
        const hrMult = mods.includes("HR") ? 5/7 : 1;
        
        return [ 
            16, 
            ((64 - 3 * mOd) * hrMult), 
            ((97 - 3 * mOd) * hrMult), 
            ((127 - 3 * mOd) * hrMult), 
            ((151 - 3 * mOd) * hrMult) 
        ];
    }
    
    if (mods.includes("EZ")) mOd = od / 2;
    else if (mods.includes("HR")) mOd = Math.min(od * 1.4, 10);
    
    if (mode === "taiko") {
        return [ 
            (50 - 3 * mOd), 
            (mOd >= 5 ? 119.5 - 8 * mOd : 110 - 6 * mOd), 
            (mOd >= 5 ? 135 - 8 * mOd : 120 - 5 * mOd) 
        ];
    }
    
    return [
        (80 - 6 * mOd), 
        (140 - 8 * mOd), 
        (200 - 10 * mOd)
    ];
};

const median = (arr) => {
    if (!arr || arr.length === 0) return 0;
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const setCSSVar = (name, value) => document.documentElement.style.setProperty(name, value);

const getGridPalette = (mode) => {
    if (mode === "mania") return [settings.color300g, settings.color300, settings.color200, settings.color100, settings.color50, settings.color0];
    if (mode === "taiko") return [settings.color300, settings.color200, settings.color0, settings.color0]; 
    return [settings.color300, settings.color200, settings.color100, settings.color0]; 
};

const getBarPalette = (mode) => {
    if (mode === "mania") return [settings.color300g, settings.color300, settings.color200, settings.color100, settings.color50];
    if (mode === "taiko") return [settings.color300, settings.color200, settings.color0]; 
    return [settings.color300, settings.color200, settings.color100]; 
};

const formatCache = new Map();
const formatNum = (num) => {
    if (formatCache.has(num)) return formatCache.get(num);
    const str = num.toString().split('').map(d => `<span class="digit">${d}</span>`).join('');
    if (formatCache.size > 5000) formatCache.clear(); // prevent unbounded memory growth
    formatCache.set(num, str);
    return str;
};

class TickPool {
    constructor(size, container) {
        this.size = size;
        this.container = container;
        this.ticks = Array.from({ length: size }, () => {
            const el = document.createElement("div");
            el.className = "tick hidden";
            el.style.opacity = '0';
            container.appendChild(el);
            return el;
        });
        this.index = 0;
        this.animations = new Array(size);
    }
    
    reset() {
        for (let i = 0; i < this.size; i++) {
            if (this.animations[i]) {
                this.animations[i].cancel();
                this.animations[i] = null;
            }
            this.ticks[i].style.opacity = '0';
        }
        this.index = 0;
    }
    
    add(error, windows, mode) {
        const el = this.ticks[this.index];
        if (this.animations[this.index]) {
            this.animations[this.index].cancel();
        }

        let tickColor = settings.tickColor; 
        if (settings.useDynamicTickColor) {
            const msAbs = Math.abs(error);
            const palette = getGridPalette(mode);
            tickColor = palette[palette.length - 1]; 
            if (windows && windows.length > 0) {
                for (let i = 0; i < windows.length; i++) { 
                    if (msAbs <= windows[i]) { tickColor = palette[i]; break; } 
                }
            }
        }
        
        el.className = "tick";
        el.style.backgroundColor = tickColor;
        el.style.transform = `translate3d(${error * 2}px, 0, 0)`;
        
        const holdPhase = settings.tickDuration || 0;
        const fadePhase = settings.fadeOutDuration || 0;
        const totalDuration = holdPhase + fadePhase;
        
        if (totalDuration > 0) {
            this.animations[this.index] = el.animate([
                { opacity: 1, offset: 0 },
                { opacity: 1, offset: holdPhase / totalDuration },
                { opacity: 0, offset: 1 }
            ], {
                duration: totalDuration,
                fill: 'forwards'
            });
        } else {
            el.style.opacity = '1';
        }

        this.index = (this.index + 1) % this.size;
    }
}

const wsManager = new WebSocketManager(window.location.host);

let settings = {
    color300g: "#ffffff", color300: "#ffcc22", color200: "#47e547", color100: "#50b4ff", color50: "#888888", color0: "#ff4747",
    useDynamicTickColor: false, tickColor: "#ffffff",
    showBg: false, bgColor: "#000000", bgOpacity: 50, bgPadding: 10,
    hideArrow: false, hideHitErrorBar: false, 
    tickWidth: 6, tickHeight: 30, tickDuration: 1000, fadeOutDuration: 1000, barHeight: 20,
    tickOffsetY: 0, showHitCounts: true, hitCountsOffsetY: 0, hitCountsFontSize: 40,
    centerLineWidth: 6, centerLineHeight: 40, hitCountsOnTop: false, arrowOnTop: false
};

let cache = { state: "", mode: "osu", od: 0, mods: "", rate: 1, windows: [], processedHits: 0, firstObj: 0, curTotalHits: 0, lastTime: 0, centerHits: 0 };
let cachedBoxes = [];

// e = early hits, l = late hits
let hitTally = {
    mania: [ {e:0, l:0}, {e:0, l:0}, {e:0, l:0}, {e:0, l:0}, {e:0, l:0} ],    // 300g, 300, 200, 100, 50
    taiko: [ {e:0, l:0}, {e:0, l:0} ],                                        // great, ok
    std:   [ {e:0, l:0}, {e:0, l:0}, {e:0, l:0} ],                            // 300, 100, 50
};

let displayTally = {
    mania: [ {e:0, l:0, t:0, _e:-1, _l:-1}, {e:0, l:0, t:0, _e:-1, _l:-1}, {e:0, l:0, t:0, _e:-1, _l:-1}, {e:0, l:0, t:0, _e:-1, _l:-1}, {e:0, l:0, t:0, _e:-1, _l:-1} ],
    taiko: [ {e:0, l:0, t:0, _e:-1, _l:-1}, {e:0, l:0, t:0, _e:-1, _l:-1} ],
    std:   [ {e:0, l:0, t:0, _e:-1, _l:-1}, {e:0, l:0, t:0, _e:-1, _l:-1}, {e:0, l:0, t:0, _e:-1, _l:-1} ],
};

let resetTimeout = null;

const tickPool = new TickPool(250, document.querySelector(".tick-container"));
const containerEl = document.getElementById("container");
const colorsEl = document.querySelector(".colors-container");
const gridEl = document.getElementById("hit-counts-grid");
const arrowEl = document.querySelector(".arrow");
const preciseBuffer = [];

function buildGrid(mode, windowsLength) {
    gridEl.innerHTML = "";
    const actualWindows = (mode === "taiko") ? 2 : windowsLength;
    const numBoxes = actualWindows * 2 + 1; 
    const centerIdx = Math.floor(numBoxes / 2);
    const palette = getGridPalette(mode);

    const leftContainer = document.createElement("div");
    leftContainer.className = "side-counts left-counts";
    
    const centerContainer = document.createElement("div");
    centerContainer.className = "center-count";
    
    const rightContainer = document.createElement("div");
    rightContainer.className = "side-counts right-counts";

    for (let i = 0; i < numBoxes; i++) {
        const box = document.createElement("div");
        box.className = "count-box";
        box.style.color = palette[Math.abs(i - centerIdx)] || palette[palette.length - 1];
        box.innerHTML = formatNum(0);
        
        if (i < centerIdx) {
            leftContainer.appendChild(box);
        } else if (i === centerIdx) {
            centerContainer.appendChild(box);
        } else {
            rightContainer.appendChild(box);
        }
    }

    gridEl.appendChild(leftContainer);
    gridEl.appendChild(centerContainer);
    gridEl.appendChild(rightContainer);
    
    cachedBoxes = Array.from(gridEl.querySelectorAll('.count-box'));
}

function resetOverlay() {
    tickPool.reset();
    preciseBuffer.length = 0;
    cache.centerHits = 0; 
    
    hitTally.mania.forEach(t => { t.e = 0; t.l = 0; });
    hitTally.taiko.forEach(t => { t.e = 0; t.l = 0; });
    hitTally.std.forEach(t => { t.e = 0; t.l = 0; });
    
    displayTally.mania.forEach(t => { t.e = 0; t.l = 0; t.t = 0; t._e = -1; t._l = -1; });
    displayTally.taiko.forEach(t => { t.e = 0; t.l = 0; t.t = 0; t._e = -1; t._l = -1; });
    displayTally.std.forEach(t => { t.e = 0; t.l = 0; t.t = 0; t._e = -1; t._l = -1; });
    
    const zeroStr = formatNum(0);
    cachedBoxes.forEach(el => el.innerHTML = zeroStr);
    arrowEl.style.transform = `translate3d(0px, 0px, 0px)`;
}

function distributeDelta(newTotal, display, preciseTally, isMiss = false) {
    const targetTotal = newTotal || 0;
    const delta = targetTotal - display.t;
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
            const expectedE = Math.round(targetTotal * (preciseTally.e / preciseTotal));
            let addE = expectedE - display.e;
            addE = Math.max(0, Math.min(delta, addE));
            display.e += addE;
            display.l += (delta - addE);
        }
    }
    display.t = targetTotal;
}

function syncTrueHitsToGrid(hits) {
    if (!cachedBoxes.length) return;

    const updateCenter = (index, value) => {
        if (value > cache.centerHits) {
            cache.centerHits = value;
            cachedBoxes[index].innerHTML = formatNum(value);
        }
    };

    const setBox = (index, tally, key) => {
        if (tally[key] !== tally["_" + key]) {
            cachedBoxes[index].innerHTML = formatNum(tally[key]);
            tally["_" + key] = tally[key];
        }
    };

    if (cache.mode === "mania" && cachedBoxes.length === 11) {
        updateCenter(5, hits.geki || 0);
        distributeDelta(hits[300], displayTally.mania[0], hitTally.mania[0]);
        setBox(4, displayTally.mania[0], 'e'); setBox(6, displayTally.mania[0], 'l');
        distributeDelta(hits.katu, displayTally.mania[1], hitTally.mania[1]);
        setBox(3, displayTally.mania[1], 'e'); setBox(7, displayTally.mania[1], 'l');
        distributeDelta(hits[100], displayTally.mania[2], hitTally.mania[2]);
        setBox(2, displayTally.mania[2], 'e'); setBox(8, displayTally.mania[2], 'l');
        distributeDelta(hits[50], displayTally.mania[3], hitTally.mania[3]);
        setBox(1, displayTally.mania[3], 'e'); setBox(9, displayTally.mania[3], 'l');
        distributeDelta(hits[0], displayTally.mania[4], hitTally.mania[4], true);
        setBox(0, displayTally.mania[4], 'e'); setBox(10, displayTally.mania[4], 'l');

    } else if (cache.mode === "taiko" && cachedBoxes.length === 5) {
        updateCenter(2, hits[300] || 0);
        distributeDelta(hits[100], displayTally.taiko[0], hitTally.taiko[0]);
        setBox(1, displayTally.taiko[0], 'e'); setBox(3, displayTally.taiko[0], 'l');
        distributeDelta(hits[0], displayTally.taiko[1], hitTally.taiko[1], true);
        setBox(0, displayTally.taiko[1], 'e'); setBox(4, displayTally.taiko[1], 'l');

    } else if (cachedBoxes.length === 7) {
        updateCenter(3, hits[300] || 0);
        distributeDelta(hits[100], displayTally.std[0], hitTally.std[0]);
        setBox(2, displayTally.std[0], 'e'); setBox(4, displayTally.std[0], 'l');
        distributeDelta(hits[50], displayTally.std[1], hitTally.std[1]);
        setBox(1, displayTally.std[1], 'e'); setBox(5, displayTally.std[1], 'l');
        distributeDelta(hits[0], displayTally.std[2], hitTally.std[2], true);
        setBox(0, displayTally.std[2], 'e'); setBox(6, displayTally.std[2], 'l');
    }
}

wsManager.commands((data) => {
    try {
        if (data.command !== "getSettings") return;
        Object.assign(settings, data.message);
        
        if (settings.barHeight !== undefined) setCSSVar("--bar-height", `${settings.barHeight}px`);
        if (settings.tickWidth !== undefined) setCSSVar("--tick-width", `${settings.tickWidth}px`);
        if (settings.tickHeight !== undefined) setCSSVar("--tick-height", `${settings.tickHeight}px`);
        if (settings.centerLineWidth !== undefined) setCSSVar("--center-line-width", `${settings.centerLineWidth}px`);
        if (settings.centerLineHeight !== undefined) setCSSVar("--center-line-height", `${settings.centerLineHeight}px`);
        if (settings.hitCountsFontSize !== undefined) setCSSVar("--hit-counts-font-size", `${settings.hitCountsFontSize}px`);
        if (settings.hitCountsOffsetY !== undefined) setCSSVar("--hit-counts-offset-y", `${settings.hitCountsOffsetY}px`);
        if (settings.tickOffsetY !== undefined) setCSSVar("--tick-offset-y", `${settings.tickOffsetY}px`);
        
        if (settings.hitCountsOnTop !== undefined) {
            gridEl.style.order = settings.hitCountsOnTop ? "0" : "4";
        }

        const isBarHidden = settings.hideHitErrorBar;
        const isArrowHidden = isBarHidden || settings.hideArrow;
        const isBgVisible = !isBarHidden && settings.showBg;

        const arrowCont = document.getElementById("arrow-container");
        if (arrowCont) {
            arrowCont.style.display = isArrowHidden ? "none" : "flex";
        }
        if (settings.arrowOnTop !== undefined) {
            arrowCont.style.order = settings.arrowOnTop ? "1" : "3";
            arrowCont.style.transform = settings.arrowOnTop ? "rotateX(180deg)" : "none"; 
        }

        const ticksEl = document.querySelector(".tick-container");
        const centerLine = document.querySelector(".middle-line");
        const barDisplay = isBarHidden ? "none" : "block";
        if (colorsEl) colorsEl.style.display = barDisplay;
        if (ticksEl) ticksEl.style.display = barDisplay;
        if (centerLine) centerLine.style.display = barDisplay;

        const bH = isBarHidden ? 0 : (settings.barHeight !== undefined ? Number(settings.barHeight) : 20);
        const tH = isBarHidden ? 0 : (settings.tickHeight !== undefined ? Number(settings.tickHeight) : 30);
        const tOff = isBarHidden ? 0 : (settings.tickOffsetY !== undefined ? Number(settings.tickOffsetY) : 0); 
        const bgPad = isBgVisible ? (settings.bgPadding !== undefined ? Number(settings.bgPadding) : 10) : 0;

        let topEdge = isBarHidden ? 0 : Math.min(-bH / 2, tOff - tH / 2);
        let bottomEdge = isBarHidden ? 0 : Math.max(bH / 2, tOff + tH / 2);

        if (!isArrowHidden) {
            const arrowReach = 43; 
            if (settings.arrowOnTop) {
                topEdge = Math.min(topEdge, -arrowReach);
            } else {
                bottomEdge = Math.max(bottomEdge, arrowReach);
            }
        }

        const newHeight = bottomEdge - topEdge;
        const newCenterY = (topEdge + bottomEdge) / 2;

        setCSSVar("--overall-bg-height", `${newHeight}px`);
        setCSSVar("--auto-bg-offset-y", `${newCenterY}px`);

        let autoHitMargin = 0;
        if (!settings.hitCountsOnTop) {
            const naturalStart = (!settings.arrowOnTop && !isArrowHidden) ? 43 : 25; 
            const absoluteBottomRaw = isBarHidden ? 0 : Math.max(bH / 2, tOff + tH / 2);
            const absoluteBottom = absoluteBottomRaw + bgPad; 
            if (absoluteBottom > naturalStart) autoHitMargin = absoluteBottom - naturalStart;
            const buffer = isBgVisible ? 5 : 0; 
            setCSSVar("--auto-hit-margin-top", `${autoHitMargin + buffer}px`);
            setCSSVar("--auto-hit-margin-bottom", `0px`);
        } else {
            const naturalStart = (settings.arrowOnTop && !isArrowHidden) ? -43 : -25;
            const absoluteTopRaw = isBarHidden ? 0 : Math.min(-bH / 2, tOff - tH / 2);
            const absoluteTop = absoluteTopRaw - bgPad;
            if (absoluteTop < naturalStart) autoHitMargin = Math.abs(absoluteTop - naturalStart);
            const buffer = isBgVisible ? 5 : 0;
            setCSSVar("--auto-hit-margin-bottom", `${autoHitMargin + buffer}px`);
            setCSSVar("--auto-hit-margin-top", `0px`);
        }	
		
        let containerPadTop = 0;
        let containerPadBottom = 0;

        if (!settings.hitCountsOnTop) {
            const staticTop = (settings.arrowOnTop && !isArrowHidden) ? -43 : -25;
            const absoluteTopRaw = isBarHidden ? 0 : Math.min(-bH / 2, tOff - tH / 2);
            const absoluteTop = absoluteTopRaw - bgPad;
            if (absoluteTop < staticTop) containerPadTop = Math.abs(absoluteTop - staticTop) + (isBgVisible ? 5 : 0);
        } else {
            const staticBottom = (!settings.arrowOnTop && !isArrowHidden) ? 43 : 25;
            const absoluteBottomRaw = isBarHidden ? 0 : Math.max(bH / 2, tOff + tH / 2);
            const absoluteBottom = absoluteBottomRaw + bgPad;
            if (absoluteBottom > staticBottom) containerPadBottom = (absoluteBottom - staticBottom) + (isBgVisible ? 5 : 0);
        }

        setCSSVar("--container-pad-top", `${containerPadTop}px`);
        setCSSVar("--container-pad-bottom", `${containerPadBottom}px`);

        const bgEl = document.querySelector(".bg-layer");
        if (bgEl) {
            bgEl.style.display = isBgVisible ? "block" : "none";
            if (settings.bgColor) bgEl.style.backgroundColor = settings.bgColor;
            if (settings.bgOpacity !== undefined) bgEl.style.opacity = settings.bgOpacity / 100;
            if (settings.bgPadding !== undefined) setCSSVar("--bg-padding", `${settings.bgPadding}px`);
        }

        if (cache.windows && cache.windows.length > 0) {
            const barPal = getBarPalette(cache.mode);
            Array.from(colorsEl.children).forEach((div, index) => {
                div.style.backgroundColor = barPal[index] || barPal[barPal.length - 1];
            });
            const numBoxes = (cache.mode === "taiko" ? 2 : cache.windows.length) * 2 + 1; 
            const centerIdx = Math.floor(numBoxes / 2);
            const gridPal = getGridPalette(cache.mode);
            cachedBoxes.forEach((box, i) => {
                box.style.color = gridPal[Math.abs(i - centerIdx)] || gridPal[gridPal.length - 1];
            });
        }
    } catch (e) {}
});

wsManager.sendCommand("getSettings", window.COUNTER_PATH ? encodeURI(window.COUNTER_PATH) : "");

wsManager.api_v2((data) => {
    if (!data.state?.name) return;
    if (data.state.name === "play") {
        if (resetTimeout) { clearTimeout(resetTimeout); resetTimeout = null; }
        const mode = data.play?.mode?.name ?? cache.mode;
        const od = data.beatmap?.stats?.od?.original ?? cache.od;
        const mods = data.play?.mods?.name ?? cache.mods;
        if (cache.mode !== mode || cache.od !== od || cache.mods !== mods) {
            cache.mode = mode; cache.od = od; cache.mods = mods;
            cache.rate = data.play?.mods?.rate || 1;
            cache.firstObj = data.beatmap?.time?.firstObject || 0;
            cache.windows = getWindows(cache.mode, cache.od, cache.mods || "");
            colorsEl.innerHTML = "";
            buildGrid(cache.mode, cache.windows.length);
            const barPal = getBarPalette(cache.mode);
            const fragment = document.createDocumentFragment();
            
            let maxBarWidth = 0;
            cache.windows.forEach((width, index) => {
                if (cache.mode === "taiko" && index > 2) return; 
                const w = width * 4;
                if (w > maxBarWidth) maxBarWidth = w;
                const div = document.createElement("div");
                div.style.width = `${w}px`;
                div.style.backgroundColor = barPal[index] || barPal[barPal.length - 1];
                div.style.zIndex = 10 - index; 
                fragment.appendChild(div);
            });
            colorsEl.appendChild(fragment);
            
            setCSSVar("--max-bar-width", `${maxBarWidth}px`);
            resetOverlay();
            cache.processedHits = 0;
            cache.curTotalHits = 0;
        }

        // Hide entirely if playing Catch / Fruits
        if (mode === "catch" || mode === "fruits") {
            containerEl.classList.add("hidden");
        } else {
            containerEl.classList.remove("hidden");
        }
        
        const totalHits = (data.play?.hits?.geki  || 0)
                        + (data.play?.hits?.[300]  || 0)
                        + (data.play?.hits?.katu   || 0)
                        + (data.play?.hits?.[100]  || 0)
                        + (data.play?.hits?.[50]   || 0)
                        + (data.play?.hits?.[0]    || 0);
        
        if (totalHits === 0 && cache.curTotalHits > 0) {
            resetOverlay();
            cache.curTotalHits = 0;
        }

        if (totalHits >= cache.curTotalHits) {
            cache.curTotalHits = totalHits;
            if (data.play?.hits) syncTrueHitsToGrid(data.play.hits);
        }
    } else if (cache.state === "play") {
        containerEl.classList.add("hidden");
        resetTimeout = setTimeout(() => { 
            resetOverlay(); 
            cache.processedHits = 0;
            cache.curTotalHits = 0;
            resetTimeout = null; 
        }, settings.fadeOutDuration);
    }
    cache.state = data.state.name;
}, ["state", { field: "play", keys: ["mode", "mods", "hits"] }, { field: "beatmap", keys: ["mode", "stats", "time"] }]);

wsManager.api_v2_precise((data) => {
    if (cache.state !== "play") return;
    if (cache.mode === "catch" || cache.mode === "fruits") return;

    const hitErrors = data.hitErrors;

    if (data.currentTime < (cache.lastTime || 0) - 50) {
        resetOverlay();
        cache.lastTime = data.currentTime;
        cache.processedHits = hitErrors.length; 
        return;
    }
    cache.lastTime = data.currentTime;

    if (hitErrors.length < cache.processedHits) {
        if (hitErrors.length === 0) {
            resetOverlay();
            cache.processedHits = 0;
        } else if (cache.processedHits - hitErrors.length > 5) {
            resetOverlay();
            cache.processedHits = hitErrors.length;
        }
        return;
    }

    if (hitErrors.length > cache.processedHits) {
        const newHits = hitErrors.slice(cache.processedHits);
        cache.processedHits = hitErrors.length;
        
        const mode = cache.mode;
        const windows = cache.windows;
        
        for (let i = 0; i < newHits.length; i++) {
            const ms = newHits[i];
            const msAbs = Math.abs(ms);
            tickPool.add(ms, windows, mode); 
            preciseBuffer.push(ms);
            
            if (mode === "mania") {
                if (msAbs <= windows[0])      { /* perfect hit — no early/late to record */ }
                else if (msAbs <= windows[1]) { ms < 0 ? hitTally.mania[0].e++ : hitTally.mania[0].l++; }
                else if (msAbs <= windows[2]) { ms < 0 ? hitTally.mania[1].e++ : hitTally.mania[1].l++; }
                else if (msAbs <= windows[3]) { ms < 0 ? hitTally.mania[2].e++ : hitTally.mania[2].l++; }
                else if (msAbs <= windows[4]) { ms < 0 ? hitTally.mania[3].e++ : hitTally.mania[3].l++; }
                else                          { ms < 0 ? hitTally.mania[4].e++ : hitTally.mania[4].l++; }
            } else if (mode === "taiko") {
                if (msAbs <= windows[0])      { /* perfect hit — no early/late to record */ }
                else if (msAbs <= windows[1]) { ms < 0 ? hitTally.taiko[0].e++ : hitTally.taiko[0].l++; }
                else                          { ms < 0 ? hitTally.taiko[1].e++ : hitTally.taiko[1].l++; }
            } else {
                if (msAbs <= windows[0])      { /* perfect hit — no early/late to record */ }
                else if (msAbs <= windows[1]) { ms < 0 ? hitTally.std[0].e++ : hitTally.std[0].l++; }
                else if (msAbs <= windows[2]) { ms < 0 ? hitTally.std[1].e++ : hitTally.std[1].l++; }
                else                          { ms < 0 ? hitTally.std[2].e++ : hitTally.std[2].l++; }
            }
        }
        
        if (preciseBuffer.length > 100) {
            preciseBuffer.splice(0, preciseBuffer.length - 100);
        }
        
        arrowEl.style.transform = `translate3d(${median(preciseBuffer) * 2}px, 0, 0)`;
    }
}, ["hitErrors", "currentTime"]);