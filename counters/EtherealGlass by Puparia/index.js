const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

const glassPanel = document.getElementById('glassPanel');
const ambientLight = document.getElementById('ambientLight');
const difficultyGraph = document.getElementById('difficultyGraph');
const chartDarker = document.getElementById('chartDarker');
const chartLighter = document.getElementById('chartLighter');

let cache = {};
let animations = {};
let currentBPM = 0;
let chartDarkerInstance = null;
let chartLighterInstance = null;
let chartProgress = null;

socket.onopen = () => {
    console.log("EtherealGlass Overlay Connected");
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};

function initializeAnimations() {
    animations = {
        pp: new CountUp('ppValue', 0, 0, 0, 0.8, {
            decimalPlaces: 2,
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
        fcPp: new CountUp('fcPpValue', 0, 0, 0, 0.6, {
            decimalPlaces: 2,
            useEasing: true,
            useGrouping: false,
            separator: " ",
            decimal: "."
        })
    };
}

function showOverlay() {
    glassPanel.classList.add('active');
    ambientLight.style.opacity = '0.6';
}

function hideOverlay() {
    glassPanel.classList.remove('active');
    ambientLight.style.opacity = '0.2';
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

function updateMapInfo(data) {
    console.log('Full data structure:', data);
    console.log('Menu BM:', data.menu.bm);
    console.log('BM Metadata:', data.menu.bm.metadata);
    console.log('Gameplay data:', data.gameplay);

    const title = data.menu.bm.metadata.title || 'No Map Selected';
    const artist = data.menu.bm.metadata.artist || 'Unknown Artist';
    const difficulty = data.menu.bm.metadata.difficulty || 'Unknown';

    // Try all possible BPM sources including gameplay
    let bpm = 0;
    if (data.menu.bm.stats && data.menu.bm.stats.BPM) {
        bpm = data.menu.bm.stats.BPM.realtime || data.menu.bm.stats.BPM.common || 0;
    } else if (data.menu.bm.metadata.bpm) bpm = data.menu.bm.metadata.bpm;
    else if (data.menu.bm.metadata.mMainBpm) bpm = data.menu.bm.metadata.mMainBpm;
    else if (data.menu.bm.bpm) bpm = data.menu.bm.bpm;
    else if (data.menu.bm.mMainBpm) bpm = data.menu.bm.mMainBpm;
    else if (data.menu.bm.stats && data.menu.bm.stats.bpm) bpm = data.menu.bm.stats.bpm;
    else if (data.menu.bm.stats && data.menu.bm.stats.mMainBpm) bpm = data.menu.bm.stats.mMainBpm;
    else if (data.gameplay && data.gameplay.bpm) bpm = data.gameplay.bpm;
    else if (data.gameplay && data.gameplay.mMainBpm) bpm = data.gameplay.mMainBpm;

    console.log('Found BPM:', bpm);

    // Update BPM cache
    if (bpm > 0 && bpm !== currentBPM) {
        currentBPM = bpm;
    }

    document.getElementById('mapTitle').textContent = title;
    document.getElementById('mapArtist').textContent = artist;
    document.getElementById('mapDifficulty').textContent = difficulty;
    document.getElementById('mapBpm').textContent = `${Math.round(bpm)} BPM`;
}

socket.onmessage = event => {
    const data = JSON.parse(event.data);

    if (!animations.pp) {
        initializeAnimations();
    }

    if (cache['state'] !== data.menu.state) {
        cache['state'] = data.menu.state;

        if (data.menu.state === 2) {
            showOverlay();
        } else {
            hideOverlay();
        }
    }

    if (cache['pp'] !== data.gameplay.pp.current) {
        cache['pp'] = data.gameplay.pp.current;

        if (Number.isFinite(+cache['pp'])) {
            animations.pp.update(data.gameplay.pp.current);
            addPulseEffect(document.getElementById('ppValue'));
        }
    }

    if (cache['ppfc'] !== data.gameplay.pp.fc) {
        cache['ppfc'] = data.gameplay.pp.fc;

        if (Number.isFinite(+cache['ppfc'])) {
            animations.fcPp.update(data.gameplay.pp.fc);
            addPulseEffect(document.getElementById('fcPpValue'));
        }
    }

    if (cache['acc'] !== data.gameplay.accuracy) {
        cache['acc'] = data.gameplay.accuracy;

        if (Number.isFinite(+cache['acc'])) {
            animations.acc.update(data.gameplay.accuracy);
            addPulseEffect(document.getElementById('accValue'));
        }
    }

    if (cache['combo'] !== data.gameplay.combo) {
        cache['combo'] = data.gameplay.combo;

        if (Number.isFinite(+cache['combo'])) {
            animations.combo.update(data.gameplay.combo);
            addPulseEffect(document.getElementById('comboValue'));
        }
    }

    if (cache['hit300'] !== data.gameplay.hits[300]) {
        cache['hit300'] = data.gameplay.hits[300];
        animations.hit300.update(data.gameplay.hits[300]);
        addPulseEffect(document.getElementById('hit300'));
    }

    if (cache['hit100'] !== data.gameplay.hits[100]) {
        cache['hit100'] = data.gameplay.hits[100];
        animations.hit100.update(data.gameplay.hits[100]);
        addPulseEffect(document.getElementById('hit100'));
    }

    if (cache['hit50'] !== data.gameplay.hits[50]) {
        cache['hit50'] = data.gameplay.hits[50];
        animations.hit50.update(data.gameplay.hits[50]);
        addPulseEffect(document.getElementById('hit50'));
    }

    if (cache['hitMiss'] !== data.gameplay.hits[0]) {
        cache['hitMiss'] = data.gameplay.hits[0];
        animations.hitMiss.update(data.gameplay.hits[0]);
        addPulseEffect(document.getElementById('hitMiss'));
    }

    if (cache['mapData'] !== JSON.stringify(data.menu.bm.metadata)) {
        cache['mapData'] = JSON.stringify(data.menu.bm.metadata);
        updateMapInfo(data);

        // Update difficulty graph when map changes
        if (data.performance && data.performance.graph) {
            updateDifficultyGraph(data.performance.graph);
        }
    }

    // Update progress based on map progress
    if (data.menu && data.menu.bm && data.menu.bm.time) {
        const progress = (data.menu.bm.time.live / data.menu.bm.time.mp3Length) * 100;
        updateProgress(progress);
    }
};

function initializeCharts() {
    if (!chartDarker || !chartLighter) return;

    // Create gradient for darker chart
    const darkerGradient = chartDarker.getContext('2d').createLinearGradient(0, 0, 0, 64);
    darkerGradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    darkerGradient.addColorStop(1, 'rgba(99, 102, 241, 0.05)');

    // Create gradient for lighter chart
    const lighterGradient = chartLighter.getContext('2d').createLinearGradient(0, 0, 0, 64);
    lighterGradient.addColorStop(0, 'rgba(168, 85, 247, 0.7)');
    lighterGradient.addColorStop(1, 'rgba(168, 85, 247, 0.1)');

    const chartConfig = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: 'rgba(99, 102, 241, 0.8)',
                backgroundColor: darkerGradient,
                borderWidth: 1,
                fill: true,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 0
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                point: { radius: 0 }
            }
        }
    };

    chartDarkerInstance = new Chart(chartDarker, chartConfig);

    const lighterConfig = { ...chartConfig };
    lighterConfig.data.datasets[0].backgroundColor = lighterGradient;
    lighterConfig.data.datasets[0].borderColor = 'rgba(168, 85, 247, 0.9)';

    chartLighterInstance = new Chart(chartLighter, lighterConfig);

    chartProgress = document.querySelector('.difficulty-graph .progress');

    console.log('Charts initialized');
}

function updateDifficultyGraph(graphData) {
    if (!chartDarkerInstance || !chartLighterInstance || !graphData) return;

    // Generate sample data for demonstration
    const dataPoints = 100;
    const data = [];
    const labels = [];

    for (let i = 0; i < dataPoints; i++) {
        // Create a realistic difficulty curve
        const x = i / dataPoints;
        const difficulty = Math.sin(x * Math.PI * 2) * 0.3 +
            Math.sin(x * Math.PI * 8) * 0.1 +
            Math.random() * 0.1 + 0.5;
        data.push(Math.max(0, difficulty));
        labels.push(i);
    }

    chartDarkerInstance.data.datasets[0].data = data;
    chartDarkerInstance.data.labels = labels;
    chartDarkerInstance.update();

    chartLighterInstance.data.datasets[0].data = data;
    chartLighterInstance.data.labels = labels;
    chartLighterInstance.update();

    console.log('Difficulty graph updated');
}

function updateProgress(percentage) {
    if (chartProgress) {
        chartProgress.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }
}

initializeAnimations();
initializeCharts();