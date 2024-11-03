class BackgroundBuffer {
    constructor(first, second) {
        /** @type {HTMLImageElement} */
        this.bottom = first;
        /** @type {HTMLImageElement} */
        this.top = second;
        this.displaying = "";
    }

    swapImages() {
        this.top.classList.toggle("hidden");
        this.bottom.classList.toggle("hidden");
        let t = this.top;
        this.top = this.bottom;
        this.bottom = t;
    }

    pushImage(path) {
        if (this.displaying == path) return;
        this.displaying = path;
        let img = new Image();
        img.addEventListener("load", () => {
            this.bottom.src = img.src;
            this.swapImages();
        });
        img.addEventListener("error", () => {
            this.bottom.src = "";
            this.swapImages();
        });
        img.src = path;
    }
};

/*
  hide-hits -> hides hit counts in gameplay
  hide-mods -> hides mods
  hide-fc-pp -> hides "if fc pp" counter
  hide-stats-l / hide-stats-r -> hides map stats on left/right side
*/
const props = location.hash.slice(1).split("+");

const createCountUp = (el, opts = {}) => new countUp.CountUp(el, 0, {
    duration: 0.3,
    useGrouping: false,
    ...opts,
});

const updateCountUp = (cu, value) => {
    if (cu.endVal != value)
        cu.update(value);
};

const socket = new ReconnectingWebSocket(window.overlay.config.getWs() + "/tokens");

socket.addEventListener("open", () => {
    socket.send(JSON.stringify([
        "artistRoman",
        "titleRoman",
        "diffName",
        "backgroundImageLocation",
        "ar",
        "cs",
        "od",
        "hp",
        "c100",
        "c50",
        "miss",
        "sliderBreaks",
        "ppIfMapEndsNow",
        "noChokePp",
        "currentBpm",
        "rawStatus",
        "mStars",
        "mods",
        "osu_m98PP",
        "osu_m99PP",
        "osu_mSSPP",
        "md5",
    ]));
});

if (props.includes("hide-stats-l")) {
    document.querySelector(".stats.left").setAttribute("style", "display: none");
}
if (props.includes("hide-stats-r")) {
    document.querySelector(".stats.right").setAttribute("style", "display: none");
}
if (props.includes("hide-mods")) {
    document.querySelector(".mods").setAttribute("style", "display: none");
}

const els = {
    container: document.querySelector(".container"),
    bg: [
        document.getElementById("first"),
        document.getElementById("second"),
    ],
    artist: document.querySelector(".artist"),
    title: document.querySelector(".title"),
    version: document.querySelector(".version"),
    previews: {
        98: createCountUp(document.querySelectorAll(".pp-preview>.pp")[0], { suffix: 'pp' }),
        99: createCountUp(document.querySelectorAll(".pp-preview>.pp")[1], { suffix: 'pp' }),
        100: createCountUp(document.querySelectorAll(".pp-preview>.pp")[2], { suffix: 'pp' }),
    },
    pp: {
        container: document.querySelector("div.pp"),
        now: createCountUp(document.querySelector(".pp>.now"), { suffix: 'pp', duration: 0.15 }),
        fc: createCountUp(document.querySelector(".pp>.fc"), { prefix: 'if fc: ', suffix: 'pp', duration: 0.15 }),
    },
    stats: {
        bpm: createCountUp(document.querySelector(".bpm>.value")),
        stars: document.querySelector(".stars>.value"),
        ar: document.querySelector(".ar>.value"),
        od: document.querySelector(".od>.value"),
        cs: document.querySelector(".cs>.value"),
        hp: document.querySelector(".hp>.value"),
    },
    hits: {
        container: document.querySelector(".hits-container"),
        100: createCountUp(document.querySelectorAll(".hit>.value")[0]),
        50: createCountUp(document.querySelectorAll(".hit>.value")[1]),
        0: createCountUp(document.querySelectorAll(".hit>.value")[2]),
        sb: createCountUp(document.querySelectorAll(".hit>.value")[3]),
    },
    mods: document.querySelector(".mods"),
};

const bg = new BackgroundBuffer(...els.bg);


const cache = {};

socket.addEventListener("message", ev => {
    const data = JSON.parse(ev.data);


    if (cache['image'] != data.backgroundImageLocation) {
        cache['image'] = data.backgroundImageLocation;

        bg.pushImage(`http://${location.host}/backgroundImage?v=${Math.random() * 10000}`);
    };


    if (cache['status'] != data.rawStatus) {
        cache['status'] = data.rawStatus;


        if ([2, 7, 14].includes(cache['status'])) {
            els.container.classList.add("playing");
        } else {
            els.container.classList.remove("playing");
        };


        if (cache['status'] == 2 && !props.includes("hide-hits")) {
            els.hits.container.classList.add("show");
        } else {
            els.hits.container.classList.remove("show");
        };
    };


    if (cache['artist'] != data.artistRoman) {
        cache['artist'] = data.artistRoman;

        els.artist.innerText = data.artistRoman;
    };

    if (cache['title'] != data.titleRoman) {
        cache['title'] = data.titleRoman;

        els.title.innerText = data.titleRoman;
    };

    if (cache['version'] != data.diffName) {
        cache['version'] = data.diffName;


        els.version.innerText = `[${cache['version']}]`;
    };


    if (cache['current_bpm'] != data.currentBpm) {
        cache['current_bpm'] = data.currentBpm;


        updateCountUp(els.stats.bpm, Math.round(data.currentBpm));
    };



    if (cache['mStars'] != data.mStars) {
        cache['mStars'] = data.mStars;
        els.stats.stars.innerText = Math.round(data.mStars * 100) / 100;
    };

    if (cache['ar'] != data.ar) {
        cache['ar'] = data.ar;
        els.stats.ar.innerText = data.ar;
    };

    if (cache['od'] != data.od) {
        cache['od'] = data.od;
        els.stats.od.innerText = data.od;
    };

    if (cache['cs'] != data.cs) {
        cache['cs'] = data.cs;
        els.stats.cs.innerText = data.cs;
    };

    if (cache['hp'] != data.hp) {
        cache['hp'] = data.hp;
        els.stats.hp.innerText = data.hp;
    };


    if (cache['osu_m98PP'] != data.osu_m98PP) {
        cache['osu_m98PP'] = data.osu_m98PP;
        updateCountUp(els.previews[98], data.osu_m98PP);
    };

    if (cache['osu_m99PP'] != data.osu_m99PP) {
        cache['osu_m99PP'] = data.osu_m99PP;
        updateCountUp(els.previews[99], data.osu_m99PP);
    };

    if (cache['osu_mSSPP'] != data.osu_mSSPP) {
        cache['osu_mSSPP'] = data.osu_mSSPP;
        updateCountUp(els.previews[100], data.osu_mSSPP);
    };


    if (cache['c100'] != data.c100) {
        cache['c100'] = data.c100;
        updateCountUp(els.hits[100], data.c100);
    };

    if (cache['c50'] != data.c50) {
        cache['c50'] = data.c50;
        updateCountUp(els.hits[50], data.c50);
    };

    if (cache['miss'] != data.miss) {
        cache['miss'] = data.miss;
        updateCountUp(els.hits[0], data.miss);
    };

    if (cache['sliderBreaks'] != data.sliderBreaks) {
        cache['sliderBreaks'] = data.sliderBreaks;
        updateCountUp(els.hits.sb, data.sliderBreaks);
    };


    let showFcPp = data.miss + data.sliderBreaks > 0;
    if (cache['showfcpp'] != showFcPp) {
        cache['showfcpp'] = showFcPp;

        if (showFcPp && !props.includes("hide-fc-pp")) {
            els.pp.container.classList.add("rip");
        } else {
            els.pp.container.classList.remove("rip");
        };
    };


    if (cache['ppIfMapEndsNow'] != data.ppIfMapEndsNow) {
        cache['ppIfMapEndsNow'] != data.ppIfMapEndsNow;

        updateCountUp(els.pp.now, data.ppIfMapEndsNow);
    };

    if (cache['noChokePp'] != data.noChokePp) {
        cache['noChokePp'] != data.noChokePp;

        updateCountUp(els.pp.fc, data.noChokePp);
    };


    if (cache['mods'] != data.mods) {
        cache['mods'] = data.mods;


        let mods = data.mods.split(",");
        if (mods[0] == "None") mods = [];
        if (mods.includes("PF")) mods.splice(mods.indexOf("SD"), 1);

        els.mods.innerHTML = "";

        for (let mod of mods) {
            let modDiv = document.createElement("div");
            modDiv.classList.add("mod");
            if (['EZ', 'NF', 'HT'].includes(mod))
                modDiv.classList.add("green");
            if (['HR', 'SD', 'PF', 'DT', 'NC', 'HD', 'FL'].includes(mod))
                modDiv.classList.add("red");
            if (['RX', 'AP', 'SO', 'AU', 'CN'].includes(mod))
                modDiv.classList.add("blue");
            if (['V2'].includes(mod))
                modDiv.classList.add("gray");
            modDiv.innerText = mod;
            els.mods.append(modDiv);
        };
    };
});