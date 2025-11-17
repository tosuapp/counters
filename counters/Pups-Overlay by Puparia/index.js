import WebSocketManager from './deps/socket.js';

const socket = new WebSocketManager(window.location.host);

const glassPanel = document.getElementById('glassPanel');
const ambientLight = document.getElementById('ambientLight');
const container = document.getElementById('ethereal-container');

let cache = {};
let animations = {};
let settings = {};

// Load settings
(async () => {
    try {
        const settingsPath = './settings.json';
        console.log('Loading settings from:', settingsPath);
        const settingsResponse = await fetch(settingsPath);
        const settingsData = await settingsResponse.json();
        console.log('Settings data:', settingsData);

        settingsData.forEach(setting => {
            settings[setting.uniqueID] = setting.value;
        });

        // Apply position class
        const positionClass = settings.overlayPosition ? 'position-top' : 'position-bottom';
        container.classList.add(positionClass);
        glassPanel.classList.add(positionClass);

        console.log('Settings loaded:', settings);
        console.log('Position class:', positionClass);
    } catch (e) {
        console.error('Failed to load settings:', e);
        settings = { overlayPosition: true }; // Default to top
        container.classList.add('position-top');
        glassPanel.classList.add('position-top');
    }
})();

function initializeAnimations() {
    animations = {
        pp: new CountUp('ppValue', 0, 0, 0, 0.8, {
            decimalPlaces: 0,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        }),
        acc: new CountUp('accValue', 100, 100, 0, 0.5, {
            decimalPlaces: 2,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        }),
        combo: new CountUp('comboValue', 0, 0, 0, 0.4, {
            decimalPlaces: 0,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        }),
        hit300: new CountUp('hit300', 0, 0, 0, 0.3, {
            decimalPlaces: 0,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        }),
        hit100: new CountUp('hit100', 0, 0, 0, 0.3, {
            decimalPlaces: 0,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        }),
        hit50: new CountUp('hit50', 0, 0, 0, 0.3, {
            decimalPlaces: 0,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        }),
        hitMiss: new CountUp('hitMiss', 0, 0, 0, 0.3, {
            decimalPlaces: 0,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        }),
    };
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
    setTimeout(() => {
        element.classList.remove('pulse-animation');
    }, 600);
}

function addGlowEffect(element) {
    element.classList.add('glow-animation');
    setTimeout(() => {
        element.classList.remove('glow-animation');
    }, 800);
}

function calculateModdedStats(baseStats, mods) {
    let stats = { ...baseStats };

    if (!mods || !mods.array) return stats;

    const modNames = mods.array.map(mod => mod.acronym);

    // Apply mod effects
    if (modNames.includes('EZ')) {
        stats.CS *= 0.5;
        stats.AR *= 0.5;
        stats.OD *= 0.5;
        stats.HP *= 0.5;
    }

    if (modNames.includes('HR')) {
        stats.CS = Math.min(10, stats.CS * 1.3);
        stats.AR = Math.min(10, stats.AR * 1.4);
        stats.OD = Math.min(10, stats.OD * 1.4);
        stats.HP = Math.min(10, stats.HP * 1.4);
    }

    if (modNames.includes('DT') || modNames.includes('NC')) {
        stats.bpm *= 1.5;
    }

    if (modNames.includes('HT')) {
        stats.bpm *= 0.75;
    }

    return stats;
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

    console.log('Mods string received:', modsStr);

    if (modsStr && modsStr !== "" && modsStr !== "NM") {
        let modsApplied = modsStr.toLowerCase();

        // Remove DT if NC is present (NC includes DT)
        if (modsApplied.indexOf('nc') !== -1) {
            modsApplied = modsApplied.replace('dt', '');
        }
        // Remove SD if PF is present (PF includes SD)
        if (modsApplied.indexOf('pf') !== -1) {
            modsApplied = modsApplied.replace('sd', '');
        }

        // Split mods into pairs
        let modsArr = modsApplied.match(/.{1,2}/g);
        console.log('Processed mods array:', modsArr);

        if (modsArr) {
            for (let i = 0; i < modsArr.length; i++) {
                const modIcon = document.createElement('div');
                modIcon.className = 'mod-icon';
                modIcon.style.backgroundImage = `url('${modsImgs[modsArr[i]]}')`;
                modIcon.title = modsArr[i].toUpperCase();
                modsContainer.appendChild(modIcon);
            }
        }
    } else {
        console.log('No mods to display');
    }
}

socket.api_v2((data) => {
    console.log('Received data:', data);
    console.log('State name:', data?.state?.name);

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

        if (isInGame) {
            setGameplayMode();
        } else {
            setMenuMode();
        }
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

    // Update progress bars
    const currentTime = beatmap?.time?.live || 0;
    const totalTime = beatmap?.time?.lastObject || 1;
    const progress = Math.min(100, Math.max(0, (currentTime / totalTime) * 100));

    const progressFillTop = document.getElementById('progressFillTop');
    const progressFillBottom = document.getElementById('progressFillBottom');

    progressFillTop.style.width = `${progress}%`;
    progressFillBottom.style.width = `${progress}%`;

    // Add particles at the end of progress bars (like a wick)
    if (isInGame && Math.random() > 0.6 && progress > 0) {
        [progressFillTop, progressFillBottom].forEach(fill => {
            const particle = document.createElement('div');
            particle.className = 'progress-particle';
            // Position at the end of the progress bar with slight randomness
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

    const pp = isResultScreen ? (resultsScreen?.pp || { current: 0, fc: 0 }) : (play?.pp || { current: 0, fc: 0 });
    const hits = isResultScreen ? (resultsScreen?.hits || {}) : (play?.hits || {});
    const accuracy = isResultScreen ? (resultsScreen?.accuracy || 100) : (play?.accuracy || 100);
    const combo = isResultScreen ? (resultsScreen?.combo || { current: 0 }) : (play?.combo || { current: 0 });

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

    // Update mods display only when playing
    const currentMods = isResultScreen ? resultsScreen?.mods : play?.mods;
    const modsStr = currentMods?.name || "";
    if (cache['mods'] !== modsStr) {
        cache['mods'] = modsStr;
        updateModsDisplay(modsStr);
    }

    // Update specs display
    const baseStats = {
        CS: beatmap?.stats?.cs?.converted || 0,
        AR: beatmap?.stats?.ar?.converted || 0,
        OD: beatmap?.stats?.od?.converted || 0,
        HP: beatmap?.stats?.hp?.converted || 0,
        bpm: beatmap?.stats?.bpm?.common || 0,
        stars: beatmap?.stats?.stars?.total || 0
    };

    console.log('Base stats:', baseStats);
    console.log('Current mods:', currentMods);

    const moddedStats = calculateModdedStats(baseStats, currentMods);
    console.log('Modded stats:', moddedStats);

    const statsKey = JSON.stringify({ baseStats, modsStr });
    if (cache['statsKey'] !== statsKey) {
        cache['statsKey'] = statsKey;

        // Format function to remove unnecessary decimals
        const formatStat = (value, decimals = 1) => {
            const rounded = parseFloat(value.toFixed(decimals));
            return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(decimals);
        };

        document.getElementById('starRating').textContent = formatStat(moddedStats.stars, 2);
        document.getElementById('csValue').textContent = formatStat(moddedStats.CS);
        document.getElementById('arValue').textContent = formatStat(moddedStats.AR);
        document.getElementById('odValue').textContent = formatStat(moddedStats.OD);
        document.getElementById('hpValue').textContent = formatStat(moddedStats.HP);
        document.getElementById('bpmValue').textContent = Math.round(moddedStats.bpm);
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
                        keys: ['common']
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