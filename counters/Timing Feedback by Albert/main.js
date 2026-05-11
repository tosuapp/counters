class WebSocketManager {
    constructor(host) {
        this.host = host;
        this.sockets = {};
        this.createConnection = this.createConnection.bind(this);
    }
    createConnection(url, callback, filters) {
        let interval;
        const counterPath = window.COUNTER_PATH || "";
        const fullUrl = `ws://${this.host}${url}?l=${encodeURI(counterPath)}`;
        this.sockets[url] = new WebSocket(fullUrl);
        
        this.sockets[url].onopen = () => {
            if (interval) clearInterval(interval);
            if (filters) this.sockets[url].send(`applyFilters:${JSON.stringify(filters)}`);
        };
        
        this.sockets[url].onclose = () => {
            delete this.sockets[url];
            interval = window.setTimeout(() => { this.createConnection(url, callback, filters); }, 1000);
        };
        
        this.sockets[url].onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && typeof data === "object" && !("error" in data)) callback(data);
            } catch (error) {}
        };
    }
    api_v2(callback, filters) { this.createConnection("/websocket/v2", callback, filters); }
    api_v2_precise(callback, filters) { this.createConnection("/websocket/v2/precise", callback, filters); }
    commands(callback) { this.createConnection("/websocket/commands", callback); }
    
    sendCommand(name, command, retry = 1) {
        const socket = this.sockets["/websocket/commands"];
        if (!socket || socket.readyState !== 1) {
            if (retry <= 50) { 
                setTimeout(() => { this.sendCommand(name, command, retry + 1); }, 100);
            }
            return;
        }
        try {
            const payload = typeof command === "object" ? JSON.stringify(command) : command;
            socket.send(`${name}:${payload}`);
        } catch (error) {
            if (retry <= 50) {
                setTimeout(() => { this.sendCommand(name, command, retry + 1); }, 100);
            }
        }
    }
}

const formatCache = new Map();
const formatMs = (msString) => {
    if (formatCache.has(msString)) return formatCache.get(msString);
    const str = msString.split('').map(char => {
        return /[0-9]/.test(char) ? `<span class="digit">${char}</span>` : `<span class="symbol">${char}</span>`;
    }).join('');
    
    if (formatCache.size > 2000) formatCache.clear(); 
    formatCache.set(msString, str);
    return str;
};

const calculateWindows = (mode, od, mods, rate = 1) => { 
    if (mode === "mania") {
        let baseWindow = 16;
        if (mods.includes("EZ")) baseWindow = 22.5;
        if (mods.includes("HR")) baseWindow = 11.43;
        return baseWindow / rate; 
    }

    const modifiedOd = mods.includes("EZ") ? od / 2 : (mods.includes("HR") ? Math.min(od * 1.4, 10) : od);

    if (mode === "taiko") return (50 - 3 * modifiedOd) / rate; 
    return (80 - 6 * modifiedOd) / rate; 
};

const DEFAULT_HOST = window.location.host;
const wsManager = new WebSocketManager(DEFAULT_HOST);

const uiContainer = document.getElementById("judgement-container");
const uiText = document.getElementById("judgement-text");
const uiImageEarly = document.getElementById("judgement-image-early");
const uiImageLate = document.getElementById("judgement-image-late");
const uiMs = document.getElementById("judgement-ms");

let settings = {
    useCustomTimingWindow: false, customPerfectWindow: 16,
    useCustomImages: false, imageEarly: "early.png", imageLate: "late.png", imageSize: 64,
    useCustomFontFile: false, customFontFileName: "Goldman-Bold.ttf", font: "Verdana",
    textEarly: "EARLY", textLate: "LATE",
    colorPerfect: "#ffffff", colorEarly: "#0000ff", colorLate: "#ff0000",
    fontSize: 32, judgementOffsetX: 0, judgementOffsetY: 0, showMainJudgement: true,
    showHitErrorMs: false, hideEarlyLateMs: false, showPerfectMs: false, alwaysShowHitError: false, hitErrorDecimals: 2, 
    msFontSize: 32, msOffsetX: 0, msOffsetY: 0, 
    useStrokeEffect: true, strokeThickness: 2, msStrokeThickness: 2,
    useFadeAnimation: false, displayDuration: 400, fadeDuration: 400
};

let cache = { 
    state: "", isLazer: false, mode: "osu", mods: "", od: 0, rate: 1, 
    firstObjectTime: 0, calculatedPerfect: 16, lastTime: 0
};

let processedHits = 0;
let judgementFadeTimeout = null, judgementResetTimeout = null;
let msFadeTimeout = null, msResetTimeout = null;
let isReset = false, cachedDecimalPlaces = 2;

const clearJudgement = () => {
    clearTimeout(judgementFadeTimeout);
    clearTimeout(judgementResetTimeout);
};

const clearMs = () => {
    clearTimeout(msFadeTimeout);
    clearTimeout(msResetTimeout);
};

const clearAll = () => {
    clearJudgement();
    clearMs();
};

function applyFontSettings() {
    let fontStack = `'${settings.font}', sans-serif`;

    if (settings.useCustomFontFile && settings.customFontFileName) {
        let styleEl = document.getElementById("custom-font-style");
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "custom-font-style";
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = `@font-face { font-family: 'MyCustomOverlayFont'; src: url('./${settings.customFontFileName}'); }`;
        fontStack = `'MyCustomOverlayFont', '${settings.font}', sans-serif`;
    } 
    document.documentElement.style.setProperty("--judgement-font", fontStack);
}

wsManager.commands((data) => {
    try {
        if (data.command === "getSettings") {
            Object.assign(settings, data.message);
            
            cachedDecimalPlaces = Math.max(0, Math.min(20, settings.hitErrorDecimals || 2));
            
            const root = document.documentElement.style;
            root.setProperty("--font-size", `${settings.fontSize}px`);
            root.setProperty("--image-size", `${settings.imageSize}px`);
            root.setProperty("--ms-font-size", `${settings.msFontSize}px`);
            root.setProperty("--fade-duration", `${settings.fadeDuration}ms`);
            root.setProperty("--text-stroke", settings.useStrokeEffect ? `${settings.strokeThickness}px #000000` : "0px transparent");
            root.setProperty("--ms-text-stroke", settings.useStrokeEffect ? `${settings.msStrokeThickness}px #000000` : "0px transparent");
            root.setProperty("--judgement-offset-x", `${settings.judgementOffsetX}px`);
            root.setProperty("--judgement-offset-y", `${settings.judgementOffsetY}px`);
            root.setProperty("--ms-offset-x", `${settings.msOffsetX}px`);
            root.setProperty("--ms-offset-y", `${settings.msOffsetY}px`);
            
            applyFontSettings();
            uiImageEarly.src = settings.imageEarly;
            uiImageLate.src = settings.imageLate;
            
            isReset = false; 
            if (cache.state === "play" && processedHits === 0) resetState();
        }
    } catch (error) {}
});

wsManager.sendCommand("getSettings", window.COUNTER_PATH ? encodeURI(window.COUNTER_PATH) : "");

wsManager.api_v2((data) => {
    if (!data.state || !data.state.name) return;

    const prevState = cache.state;
    cache.state = data.state.name;
    
    if (cache.state === "play") {
        if (prevState !== "play") {
            uiContainer.classList.add("startup-hidden");
            setTimeout(() => uiContainer.classList.remove("startup-hidden"), 1000);
        }

        const mode = data.play.mode.name;
        const mods = data.play.mods.name;
        const od = data.beatmap.stats.od.original;
        const rate = data.play.mods.rate || 1;
        
        if (cache.mode !== mode || cache.mods !== mods || cache.od !== od || cache.rate !== rate) {
            Object.assign(cache, { mode, mods, od, rate });
            cache.calculatedPerfect = calculateWindows(mode, od, mods, rate);
            isReset = false; 
        }

        cache.firstObjectTime = data.beatmap.time.firstObject;
        if (processedHits === 0) resetState(); 

    } else {
        clearAll();
        
        uiContainer.classList.remove("active", "animated-hide", "startup-hidden");
        uiContainer.classList.add("snap-hide", "hide-visual");
        
        [uiText, uiImageEarly, uiImageLate].forEach(el => {
            el.classList.remove("animated-hide", "invisible");
            el.classList.add("snap-hide");
        });

        uiMs.classList.remove("animated-hide", "invisible", "hide-visual");
        uiMs.classList.add("snap-hide");
        
        processedHits = 0;
        cache.isLazer = false; 
        isReset = false; 
    }
}, ["state", { field: "play", keys: ["mode", "mods"] }, { field: "beatmap", keys: ["mode", "stats", "time"] }]);

function resetJudgement() {
    [uiText, uiImageEarly, uiImageLate].forEach(el => {
        el.classList.remove("animated-hide");
        el.classList.add("snap-hide", "invisible");
    });
}

function resetMs() {
    uiMs.classList.remove("animated-hide");
    if (settings.alwaysShowHitError) {
        uiMs.classList.remove("invisible", "snap-hide", "hide-visual");
        let decimalPlaces = (!cache.isLazer && cache.rate === 1) ? 0 : cachedDecimalPlaces;
        uiMs.innerHTML = formatMs((0).toFixed(decimalPlaces) + "ms");
        uiMs.style.color = settings.colorPerfect;
    } else {
        uiMs.classList.add("snap-hide", "invisible");
    }
}

function resetState() {
    if (cache.state !== "play" || isReset) return; 
    isReset = true;

    clearAll();

    if (settings.useCustomImages) {
        uiImageEarly.classList.remove("hide-visual");
        uiImageLate.classList.add("hide-visual"); 
        uiText.classList.add("hide-visual");
    } else {
        uiText.innerText = settings.textEarly;
        uiText.classList.remove("hide-visual");
        uiImageEarly.classList.add("hide-visual");
        uiImageLate.classList.add("hide-visual");
    }

    resetJudgement();
    resetMs();

    if (settings.alwaysShowHitError) {
        uiContainer.classList.remove("animated-hide", "snap-hide", "hide-visual");
        uiContainer.classList.add("active");
    } else {
        uiContainer.classList.remove("active");
        uiContainer.classList.add("snap-hide", "hide-visual");
    }
}

function showJudgement(rawHitError) {
    if (cache.state !== "play") return; 
    isReset = false; 

    const hitError = rawHitError / cache.rate;
    const threshold = settings.useCustomTimingWindow ? settings.customPerfectWindow : cache.calculatedPerfect;
    const isPerfect = Math.abs(hitError) <= threshold;
    const isEarly = hitError < 0;

    const wantJudgement = !isPerfect;
    let wantMs = false;

    if (settings.showHitErrorMs) {
        wantMs = isPerfect ? settings.showPerfectMs : !settings.hideEarlyLateMs;
    }

    if (isPerfect && !settings.useFadeAnimation) {
        clearAll();
        resetJudgement();
        resetMs();
    }

    if (!wantJudgement && !wantMs && !settings.alwaysShowHitError) return; 

    uiContainer.classList.remove("animated-hide", "snap-hide", "hide-visual");
    uiContainer.classList.add("active");
    
    let activeColor = isPerfect ? settings.colorPerfect : (isEarly ? settings.colorEarly : settings.colorLate);

    if (wantJudgement) {
        clearJudgement();

        [uiText, uiImageEarly, uiImageLate].forEach(el => {
            el.classList.remove("animated-hide", "snap-hide", "invisible", "hide-visual");
        });

        if (settings.useCustomImages) {
            uiText.classList.add("hide-visual");
            if (isEarly) {
                uiImageLate.classList.add("hide-visual");
                void uiImageEarly.offsetWidth;
            } else {
                uiImageEarly.classList.add("hide-visual");
                void uiImageLate.offsetWidth; 
            }
        } else {
            uiImageEarly.classList.add("hide-visual");
            uiImageLate.classList.add("hide-visual");
            uiText.innerText = isEarly ? settings.textEarly : settings.textLate;
            uiText.style.color = activeColor;
            void uiText.offsetWidth; 
        }

        if (!settings.showMainJudgement) {
            [uiText, uiImageEarly, uiImageLate].forEach(el => el.classList.add("invisible"));
        }

        if (settings.useFadeAnimation) {
            judgementFadeTimeout = setTimeout(() => {
                [uiText, uiImageEarly, uiImageLate].forEach(el => el.classList.add("animated-hide"));
            }, 50);
            judgementResetTimeout = setTimeout(resetJudgement, 50 + settings.fadeDuration);
        } else {
            judgementResetTimeout = setTimeout(resetJudgement, settings.displayDuration);
        }
    }

    const safeHitError = hitError === 0 ? 0 : hitError;

    if (wantMs || settings.alwaysShowHitError) {
        clearMs();

        uiMs.classList.remove("animated-hide", "snap-hide", "invisible", "hide-visual");
        void uiMs.offsetWidth;
        
        let decimalPlaces = (!cache.isLazer && cache.rate === 1) ? 0 : cachedDecimalPlaces;

        if (wantMs) {
            const prefix = safeHitError > 0 ? "+" : ""; 
            uiMs.innerHTML = formatMs(`${prefix}${safeHitError.toFixed(decimalPlaces)}ms`);
            uiMs.style.color = activeColor; 
        } else {
            uiMs.innerHTML = formatMs((0).toFixed(decimalPlaces) + "ms");
            uiMs.style.color = settings.colorPerfect;
        }

        const totalDuration = settings.useFadeAnimation ? (50 + settings.fadeDuration) : settings.displayDuration;

        if (settings.alwaysShowHitError) {
            msResetTimeout = setTimeout(resetMs, totalDuration);
        } else if (settings.useFadeAnimation) {
            msFadeTimeout = setTimeout(() => uiMs.classList.add("animated-hide"), 50);
            msResetTimeout = setTimeout(resetMs, totalDuration);
        } else {
            msResetTimeout = setTimeout(resetMs, settings.displayDuration);
        }
    }
}

wsManager.api_v2_precise((data) => {
    if (cache.state !== "play") return; 

    if (data.currentTime < (cache.lastTime || 0) - 50 || data.hitErrors.length < processedHits) {
        isReset = false; 
        resetState();
        cache.lastTime = data.currentTime;
        processedHits = data.hitErrors.length === 0 ? 0 : data.hitErrors.length;
        return;
    }
    
    cache.lastTime = data.currentTime;

    if (data.currentTime < cache.firstObjectTime || data.hitErrors.length === 0) {
        processedHits = 0;
        resetState(); 
        return;
    }
    
    if (data.hitErrors.length > processedHits) {
        const rawError = data.hitErrors[data.hitErrors.length - 1];
        
        if (!Number.isInteger(rawError) && !cache.isLazer) {
            cache.isLazer = true;
            isReset = false;
        }
        
        showJudgement(rawError);
        processedHits = data.hitErrors.length;
    }
}, ["hitErrors", "currentTime"]);