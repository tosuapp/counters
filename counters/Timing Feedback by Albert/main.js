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

const calculateWindows = (mode, od, mods) => {
    if (mode === "mania") {
        if (mods.includes("EZ")) return 22.5;
        if (mods.includes("HR")) return 11.43;
        return 16.5; 
    }
    if (mode === "taiko") {
        const modifiedOd = mods.includes("EZ") ? od / 2 : (mods.includes("HR") ? Math.min(od * 1.4, 10) : od);
        return 50 - 3 * modifiedOd; 
    }
    const modifiedOd = mods.includes("EZ") ? od / 2 : (mods.includes("HR") ? Math.min(od * 1.4, 10) : od);
    return 80 - 6 * modifiedOd; 
};

const DEFAULT_HOST = window.location.host;
const wsManager = new WebSocketManager(DEFAULT_HOST);

let settings = {
    useCustomTimingWindow: false, customPerfectWindow: 16,
    useCustomImages: false, imageEarly: "early.png", imageLate: "late.png", imageSize: 64,
    useCustomFontFile: false, customFontFileName: "Goldman-Bold.ttf",
    font: "Verdana",
    textEarly: "EARLY", textLate: "LATE",
    colorPerfect: "#ffffff", colorEarly: "#0000ff", colorLate: "#ff0000",
    fontSize: 32, judgementOffsetX: 0, judgementOffsetY: 0, showMainJudgement: true,
    showHitErrorMs: false, hideEarlyLateMs: false, showPerfectMs: false, alwaysShowHitError: false, hitErrorDecimals: 2, 
    msFontSize: 32, msOffsetX: 0, msOffsetY: 0, 
    useStrokeEffect: true, strokeThickness: 2, msStrokeThickness: 2,
    useFadeAnimation: false, displayDuration: 400, fadeDuration: 400
};

let cache = { 
    state: "", isLazer: false,
    mode: "osu", mods: "", od: 0, rate: 1, 
    firstObjectTime: 0, calculatedPerfect: 16 
};
let processedHits = 0;
let fadeTimeout = null;
let resetTimeout = null;

function applyFontSettings() {
    let fontStack = `'${settings.font}', sans-serif`;

    if (settings.useCustomFontFile && settings.customFontFileName) {
        let styleEl = document.getElementById("custom-font-style");
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "custom-font-style";
            document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = `
            @font-face {
                font-family: 'MyCustomOverlayFont';
                src: url('./${settings.customFontFileName}');
            }
        `;
        fontStack = `'MyCustomOverlayFont', '${settings.font}', sans-serif`;
    }
    document.documentElement.style.setProperty("--judgement-font", fontStack);
}

wsManager.commands((data) => {
    try {
        if (data.command === "getSettings") {
            for (const [k, v] of Object.entries(data.message)) { settings[k] = v; }
            
            document.documentElement.style.setProperty("--font-size", `${settings.fontSize}px`);
            document.documentElement.style.setProperty("--image-size", `${settings.imageSize}px`);
            document.documentElement.style.setProperty("--ms-font-size", `${settings.msFontSize}px`);
            document.documentElement.style.setProperty("--fade-duration", `${settings.fadeDuration}ms`);
            
            document.documentElement.style.setProperty("--text-stroke", settings.useStrokeEffect ? `${settings.strokeThickness}px #000000` : "0px transparent");
            document.documentElement.style.setProperty("--ms-text-stroke", settings.useStrokeEffect ? `${settings.msStrokeThickness}px #000000` : "0px transparent");
            
            document.documentElement.style.setProperty("--judgement-offset-x", `${settings.judgementOffsetX}px`);
            document.documentElement.style.setProperty("--judgement-offset-y", `${settings.judgementOffsetY}px`);
            document.documentElement.style.setProperty("--ms-offset-x", `${settings.msOffsetX}px`);
            document.documentElement.style.setProperty("--ms-offset-y", `${settings.msOffsetY}px`);
            
            applyFontSettings();
        }
    } catch (error) {}
});

wsManager.sendCommand("getSettings", window.COUNTER_PATH ? encodeURI(window.COUNTER_PATH) : "");

wsManager.api_v2((data) => {
    if (data.state && data.state.name) {
        cache.state = data.state.name;
        
        if (cache.state === "play") {
            cache.mode = data.play.mode.name;
            cache.mods = data.play.mods.name;
            cache.od = data.beatmap.stats.od.original;
            cache.rate = data.play.mods.rate || 1;
            cache.firstObjectTime = data.beatmap.time.firstObject;
            
            cache.calculatedPerfect = calculateWindows(cache.mode, cache.od, cache.mods, cache.rate);
            
            if (processedHits === 0) resetState(); 
        } else {
            const container = document.getElementById("judgement-container");
            const textEl = document.getElementById("judgement-text");
            const imgEl = document.getElementById("judgement-image");
            const msEl = document.getElementById("judgement-ms");
            
            if (fadeTimeout) clearTimeout(fadeTimeout);
            if (resetTimeout) clearTimeout(resetTimeout);
            
            container.classList.remove("active", "animated-hide");
            container.classList.add("snap-hide", "hide-visual");
            textEl.classList.remove("animated-hide", "invisible");
            textEl.classList.add("snap-hide");
            imgEl.classList.remove("animated-hide", "invisible");
            imgEl.classList.add("snap-hide");
            msEl.classList.remove("animated-hide", "invisible", "hide-visual");
            msEl.classList.add("snap-hide");
            
            processedHits = 0;
            cache.isLazer = false; 
        }
    }
}, ["state", { field: "play", keys: ["mode", "mods"] }, { field: "beatmap", keys: ["mode", "stats", "time"] }]);

function resetState() {
    if (cache.state !== "play") return; 

    const container = document.getElementById("judgement-container");
    const textEl = document.getElementById("judgement-text");
    const imgEl = document.getElementById("judgement-image");
    const msEl = document.getElementById("judgement-ms");

    if (settings.useCustomImages) {
        imgEl.src = settings.imageEarly;
        imgEl.classList.remove("hide-visual");
        textEl.classList.add("hide-visual");
    } else {
        textEl.innerText = settings.textEarly;
        textEl.classList.remove("hide-visual");
        imgEl.classList.add("hide-visual");
    }

    if (settings.alwaysShowHitError) {
        container.classList.remove("animated-hide", "snap-hide", "hide-visual");
        container.classList.add("active");
        
        textEl.classList.remove("animated-hide", "snap-hide");
        textEl.classList.add("invisible");
        imgEl.classList.remove("animated-hide", "snap-hide");
        imgEl.classList.add("invisible");
        
        msEl.classList.remove("hide-visual", "invisible", "animated-hide", "snap-hide");
        
        let decimalPlaces = Math.max(0, Math.min(20, settings.hitErrorDecimals));
        if (!cache.isLazer && cache.rate === 1) {
            decimalPlaces = 0; 
        }
        
        msEl.innerText = (0).toFixed(decimalPlaces) + "ms";
        msEl.style.color = settings.colorPerfect;
    } else {
        container.classList.remove("active");
        container.classList.add("snap-hide", "hide-visual");
        
        textEl.classList.remove("animated-hide", "invisible");
        textEl.classList.add("snap-hide");
        imgEl.classList.remove("animated-hide", "invisible");
        imgEl.classList.add("snap-hide");
        msEl.classList.remove("animated-hide", "invisible", "hide-visual");
        msEl.classList.add("snap-hide");
    }
}

function showJudgement(rawHitError) {
    if (cache.state !== "play") return; 

    const hitError = rawHitError / cache.rate;

    const container = document.getElementById("judgement-container");
    const textEl = document.getElementById("judgement-text");
    const imgEl = document.getElementById("judgement-image");
    const msEl = document.getElementById("judgement-ms");

    const threshold = settings.useCustomTimingWindow ? settings.customPerfectWindow : cache.calculatedPerfect;
    const isPerfect = Math.abs(hitError) <= threshold;
    const isEarly = hitError < 0;

    if (isPerfect && !settings.showPerfectMs && !settings.alwaysShowHitError) {
        if (fadeTimeout) clearTimeout(fadeTimeout);
        if (resetTimeout) clearTimeout(resetTimeout);
        resetState();
        return; 
    }

    if (fadeTimeout) clearTimeout(fadeTimeout);
    if (resetTimeout) clearTimeout(resetTimeout);
    
    container.classList.remove("animated-hide", "snap-hide", "hide-visual");
    container.classList.add("active");
    
    let activeColor;
    if (isPerfect) activeColor = settings.colorPerfect;
    else if (isEarly) activeColor = settings.colorEarly;
    else activeColor = settings.colorLate;

    if (!isPerfect) {
        textEl.classList.remove("animated-hide", "snap-hide", "invisible");
        imgEl.classList.remove("animated-hide", "snap-hide", "invisible");
        void textEl.offsetWidth;
        void imgEl.offsetWidth;

        if (settings.useCustomImages) {
            textEl.classList.add("hide-visual");
            imgEl.classList.remove("hide-visual");
            imgEl.src = isEarly ? settings.imageEarly : settings.imageLate;
        } else {
            imgEl.classList.add("hide-visual");
            textEl.classList.remove("hide-visual");
            textEl.innerText = isEarly ? settings.textEarly : settings.textLate;
            textEl.style.color = activeColor;
        }
        
        if (!settings.showMainJudgement) {
            textEl.classList.add("invisible");
            imgEl.classList.add("invisible");
        }
    } else {
        if (!settings.useFadeAnimation) {
            textEl.classList.add("invisible");
            imgEl.classList.add("invisible");
        }
    }

    const safeHitError = hitError === 0 ? 0 : hitError;
    
    let shouldShowMs = false;

    // Evaluate based on the master switch
    if (settings.showHitErrorMs) {
        if (isPerfect) {
            shouldShowMs = settings.showPerfectMs;
        } else {
            shouldShowMs = !settings.hideEarlyLateMs;
        }
    }

    // alwaysShowHitError acts as an override for an exact 0ms hit
    if (safeHitError === 0 && settings.alwaysShowHitError) {
        shouldShowMs = true;
    }
    
    if (shouldShowMs) {
        msEl.classList.remove("animated-hide", "snap-hide", "invisible", "hide-visual");
        void msEl.offsetWidth; 
        
        const prefix = safeHitError > 0 ? "+" : ""; 
        
        let decimalPlaces = Math.max(0, Math.min(20, settings.hitErrorDecimals));
        if (!cache.isLazer && cache.rate === 1) {
            decimalPlaces = 0; 
        }
        
        msEl.innerText = `${prefix}${safeHitError.toFixed(decimalPlaces)}ms`;
        msEl.style.color = activeColor; 
    } else {
        msEl.classList.remove("hide-visual");
        msEl.classList.add("invisible");
    }

    if (settings.useFadeAnimation) {
        fadeTimeout = setTimeout(() => {
            textEl.classList.add("animated-hide");
            imgEl.classList.add("animated-hide");
        }, 50);
        resetTimeout = setTimeout(resetState, 50 + settings.fadeDuration);
    } else {
        fadeTimeout = setTimeout(resetState, settings.displayDuration);
    }
}

wsManager.api_v2_precise((data) => {
    if (cache.state !== "play") return; 

    if (data.currentTime < cache.firstObjectTime || data.hitErrors.length === 0) {
        processedHits = 0;
        resetState(); 
        return;
    }
    if (data.hitErrors.length > processedHits) {
        const rawError = data.hitErrors[data.hitErrors.length - 1];
        
        if (!Number.isInteger(rawError)) {
            cache.isLazer = true;
        }
        
        showJudgement(rawError);
        processedHits = data.hitErrors.length;
    }
}, ["hitErrors", "currentTime"]);