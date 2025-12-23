import WebSocketManager from './deps/socket.js';

const socket = new WebSocketManager(window.location.host);

const glassPanel = document.getElementById('glassPanel');
const ambientLight = document.getElementById('ambientLight');
const container = document.getElementById('pups-container');

let cache = {};
let animations = {};
let settings = {};

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
        const { message } = data;
        if (message['overlayPosition'] != null) {
            settings.overlayPosition = message['overlayPosition'];
            const positionClass = settings.overlayPosition ? 'position-top' : 'position-bottom';
            container.classList.add(positionClass);
            glassPanel.classList.add(positionClass);
        }
    } catch (e) {
        container.classList.add('position-top');
        glassPanel.classList.add('position-top');
    }
});

function initializeAnimations() {
    const baseOpts = { useEasing: true, useGrouping: false, separator: " ", decimal: "." };
    animations.pp = new CountUp('ppValue', 0, 0, 0, 0.8, { ...baseOpts, decimalPlaces: 0 });
    animations.acc = new CountUp('accValue', 100, 100, 0, 0.5, { ...baseOpts, decimalPlaces: 2 });
    animations.combo = new CountUp('comboValue', 0, 0, 0, 0.4, { ...baseOpts, decimalPlaces: 0 });
    animations.hit300 = new CountUp('hit300', 0, 0, 0, 0.3, { ...baseOpts, decimalPlaces: 0 });
    animations.hit100 = new CountUp('hit100', 0, 0, 0, 0.3, { ...baseOpts, decimalPlaces: 0 });
    animations.hit50 = new CountUp('hit50', 0, 0, 0, 0.3, { ...baseOpts, decimalPlaces: 0 });
    animations.hitMiss = new CountUp('hitMiss', 0, 0, 0, 0.3, { ...baseOpts, decimalPlaces: 0 });
}

function showOverlay() {
    glassPanel.classList.add('active');
    ambientLight.style.opacity = '0.6';
}

function setGameplayMode() {
    glassPanel.classList.add('gameplay-mode');
    glassPanel.classList.remove('menu-mode');
}

function setMenuMode() {
    glassPanel.classList.add('menu-mode');
    glassPanel.classList.remove('gameplay-mode');
}

function addPulseEffect(element) {
    element.classList.add('pulse-animation');
    setTimeout(() => element.classList.remove('pulse-animation'), 600);
}

function addGlowEffect(element) {
    element.classList.add('glow-animation');
    setTimeout(() => element.classList.remove('glow-animation'), 800);
}


function updateModsDisplay(modsStr) {
    const modsContainer = document.getElementById('modsContainer');
    modsContainer.innerHTML = '';

    const modsImgs = {
        'ez': './static/easy.png',
        'nf': './static/nofail.png',
        'ht': './static/halftime.png',
        'hr': './static/hardrock.png',
        'sd': './static/suddendeath.png',
        'pf': './static/perfect.png',
        'dt': './static/doubletime.png',
        'nc': './static/nightcore.png',
        'hd': './static/hidden.png',
        'fl': './static/flashlight.png',
        'rx': './static/relax.png',
        'ap': './static/autopilot.png',
        'so': './static/spunout.png',
        'at': './static/autoplay.png',
        'cn': './static/cinema.png',
        'v2': './static/v2.png',
    };

    if (!modsStr || modsStr === "" || modsStr === "NM") return;
    let modsApplied = modsStr.toLowerCase();
    if (modsApplied.includes('nc')) modsApplied = modsApplied.replace('dt', '');
    if (modsApplied.includes('pf')) modsApplied = modsApplied.replace('sd', '');

    const modsArr = modsApplied.match(/.{1,2}/g);
    if (!modsArr) return;
    for (let i = 0; i < modsArr.length; i++) {
        const modIcon = document.createElement('div');
        modIcon.className = 'mod-icon';
        modIcon.style.backgroundImage = `url('${modsImgs[modsArr[i]]}')`;
        modIcon.title = modsArr[i].toUpperCase();
        modsContainer.appendChild(modIcon);
    }
}

socket.api_v2((data) => {
    if (!animations.pp) {
        initializeAnimations();
    }

    const { play, beatmap, state, resultsScreen } = data;

    if (!cache['hasShownOnce']) {
        showOverlay();
        cache['hasShownOnce'] = true;
    }

    const stateName = state?.name?.toLowerCase() || 'menu';
    const isInGame = stateName === 'play' || stateName === 'resultscreen';

    if (cache['isInGame'] !== isInGame) {
        cache['isInGame'] = isInGame;
        isInGame ? setGameplayMode() : setMenuMode();
    }

    const artist = beatmap?.artist || beatmap?.artistUnicode || 'Unknown Artist';
    const title = beatmap?.title || beatmap?.titleUnicode || 'No Map Selected';
    const difficulty = beatmap?.version || 'Unknown';
    const bpm = beatmap?.stats?.bpm?.common || 0;
    if (cache['artist'] !== artist || cache['title'] !== title) {
        cache['artist'] = artist;
        cache['title'] = title;
        cache['difficulty'] = difficulty;
        cache['bpm'] = bpm;
        const mapTitleEl = document.getElementById('mapTitle');
        const mapArtistEl = document.getElementById('mapArtist');

        mapTitleEl.textContent = title;
        mapArtistEl.textContent = artist;
        document.getElementById('mapDifficulty').textContent = difficulty;
        document.getElementById('mapBpm').textContent = `${Math.round(bpm)} BPM`;

        setTimeout(() => {
            const titleWrapper = mapTitleEl.parentElement;
            const artistWrapper = mapArtistEl.parentElement;

            if (mapTitleEl.scrollWidth > titleWrapper.clientWidth) {
                mapTitleEl.classList.add('scrolling');
            } else {
                mapTitleEl.classList.remove('scrolling');
            }

            if (mapArtistEl.scrollWidth > artistWrapper.clientWidth) {
                mapArtistEl.classList.add('scrolling');
            } else {
                mapArtistEl.classList.remove('scrolling');
            }
        }, 100);
    }

    const currentTime = beatmap?.time?.live || 0;
    const totalTime = beatmap?.time?.lastObject || 1;
    const progress = Math.min(100, Math.max(0, (currentTime / totalTime) * 100));

    const progressFillTop = document.getElementById('progressFillTop');
    const progressFillBottom = document.getElementById('progressFillBottom');

    progressFillTop.style.width = `${progress}%`;
    progressFillBottom.style.width = `${progress}%`;

    if (isInGame && Math.random() > 0.6 && progress > 0) {
        [progressFillTop, progressFillBottom].forEach(fill => {
            const particle = document.createElement('div');
            particle.className = 'progress-particle';
            particle.style.left = `calc(100% - ${Math.random() * 10}px)`;
            particle.style.animationDelay = `${Math.random() * 0.3}s`;
            fill.appendChild(particle);

            setTimeout(() => particle.remove(), 2000);
        });
    }

    if (!isInGame) {
        return;
    }

    const isResultScreen = stateName === 'resultscreen';
    const source = isResultScreen ? resultsScreen : play;

    const pp = source?.pp || { current: 0, fc: 0 };
    const hits = source?.hits || {};
    const accuracy = source?.accuracy || 100;
    const combo = source?.combo || { current: 0 };

    if (cache['pp'] !== pp.current || cache['ppfc'] !== pp.fc) {
        cache['pp'] = pp.current;
        cache['ppfc'] = pp.fc;

        if (Number.isFinite(pp.current) && Number.isFinite(pp.fc)) {
            const ppDisplay = `${Math.round(pp.current)}/${Math.round(pp.fc)}`;
            document.getElementById('ppValue').textContent = ppDisplay;
            addPulseEffect(document.getElementById('ppValue'));
        }
    }

    if (cache['acc'] !== accuracy) {
        cache['acc'] = accuracy;

        if (Number.isFinite(accuracy)) {
            animations.acc.update(accuracy);
            addPulseEffect(document.getElementById('accValue'));
        }
    }

    if (cache['combo'] !== combo.current) {
        cache['combo'] = combo.current;

        if (Number.isFinite(combo.current)) {
            animations.combo.update(combo.current);
            addPulseEffect(document.getElementById('comboValue'));
        }
    }

    if (cache['hit300'] !== hits['300']) {
        cache['hit300'] = hits['300'];
        animations.hit300.update(hits['300']);
        addPulseEffect(document.getElementById('hit300'));
    }

    if (cache['hit100'] !== hits['100']) {
        cache['hit100'] = hits['100'];
        animations.hit100.update(hits['100']);
        addPulseEffect(document.getElementById('hit100'));
    }

    if (cache['hit50'] !== hits['50']) {
        cache['hit50'] = hits['50'];
        animations.hit50.update(hits['50']);
        addPulseEffect(document.getElementById('hit50'));
    }

    if (cache['hitMiss'] !== hits['0']) {
        cache['hitMiss'] = hits['0'];
        animations.hitMiss.update(hits['0']);
        addPulseEffect(document.getElementById('hitMiss'));
    }

    const currentMods = source?.mods;
    const modsStr = currentMods?.name || "";
    if (cache['mods'] !== modsStr) {
        cache['mods'] = modsStr;
        updateModsDisplay(modsStr);
    }

    const stats = {
        cs: beatmap?.stats?.cs?.converted || 0,
        ar: beatmap?.stats?.ar?.converted || 0,
        od: beatmap?.stats?.od?.converted || 0,
        hp: beatmap?.stats?.hp?.converted || 0,
        bpm: beatmap?.stats?.bpm?.realtime || beatmap?.stats?.bpm?.common || 0,
        stars: beatmap?.stats?.stars?.total || 0
    };

    const statsKey = JSON.stringify(stats);
    if (cache['statsKey'] !== statsKey) {
        cache['statsKey'] = statsKey;

        function formatStat(value, decimals = 1) {
            const rounded = parseFloat(value.toFixed(decimals));
            if (rounded % 1 === 0) return rounded.toFixed(0);
            return rounded.toFixed(decimals);
        }

        document.getElementById('starRating').textContent = formatStat(stats.stars, 2);
        document.getElementById('csValue').textContent = formatStat(stats.cs);
        document.getElementById('arValue').textContent = formatStat(stats.ar);
        document.getElementById('odValue').textContent = formatStat(stats.od);
        document.getElementById('hpValue').textContent = formatStat(stats.hp);
        document.getElementById('bpmValue').textContent = Math.round(stats.bpm);
    }
}, [
    {
        field: 'beatmap',
        keys: [
            {
                field: 'time',
                keys: ['live', 'lastObject']
            },
            {
                field: 'stats',
                keys: [
                    {
                        field: 'bpm',
                        keys: ['common', 'realtime']
                    },
                    {
                        field: 'cs',
                        keys: ['converted']
                    },
                    {
                        field: 'ar',
                        keys: ['converted']
                    },
                    {
                        field: 'od',
                        keys: ['converted']
                    },
                    {
                        field: 'hp',
                        keys: ['converted']
                    },
                    {
                        field: 'stars',
                        keys: ['total']
                    }
                ]
            },
            'artist',
            'artistUnicode',
            'title',
            'titleUnicode',
            'version'
        ]
    },
    {
        field: 'play',
        keys: [
            {
                field: 'hits',
                keys: ['300', '100', '50', '0']
            },
            {
                field: 'pp',
                keys: ['current', 'fc']
            },
            {
                field: 'combo',
                keys: ['current']
            },
            {
                field: 'mods',
                keys: ['name', 'array']
            },
            'accuracy'
        ]
    },
    {
        field: 'resultsScreen',
        keys: [
            {
                field: 'hits',
                keys: ['300', '100', '50', '0']
            },
            {
                field: 'pp',
                keys: ['current', 'fc']
            },
            {
                field: 'combo',
                keys: ['current']
            },
            {
                field: 'mods',
                keys: ['name', 'array']
            },
            'accuracy'
        ]
    },
    {
        field: 'state',
        keys: ['name']
    }
]);

initializeAnimations();