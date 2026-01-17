let socket;
let reconnectInterval;

const GameState = {
    menu: 0,
    edit: 1,
    play: 2,
    exit: 3,
    selectEdit: 4,
    selectPlay: 5,
    selectDrawings: 6,
    resultScreen: 7,
    update: 8,
    busy: 9,
    unknown: 10,
    lobby: 11,
    matchSetup: 12,
    selectMulti: 13
};

const elements = {
    perfect: document.getElementById('perfect'),
    great: document.getElementById('great'),
    good: document.getElementById('good'),
    ok: document.getElementById('ok'),
    meh: document.getElementById('meh'),
    miss: document.getElementById('miss')
};

const container = document.querySelector('.hit-container');

let previousHits = {
    perfect: 0,
    great: 0,
    good: 0,
    ok: 0,
    meh: 0,
    miss: 0
};

let isInGameplay = false;

function connectWebSocket() {
    socket = new WebSocket('ws://127.0.0.1:24050/websocket/v2');

    socket.onopen = () => {
        console.log('connected');
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            updateHitCounter(data);
        } catch (error) {
            console.error('error parsing data:', error);
        }
    };

    socket.onerror = (error) => {
        console.error('ws error:', error);
    };

    socket.onclose = () => {
        console.log('disconnected');
        hideCounter();
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                connectWebSocket();
            }, 3000);
        }
    };
}

function updateHitCounter(data) {
    const statusNumber = data.state?.number;

    const isPlaying = statusNumber === GameState.play;

    if (!isPlaying || !data.play || !data.play.hits) {
        if (isInGameplay) {
            hideCounter();
            resetCounter();
            isInGameplay = false;
        }
        return;
    }

    if (!isInGameplay) {
        showCounter();
        isInGameplay = true;
    }

    const hits = data.play.hits;

    const currentHits = {
        perfect: Number(hits.geki) || 0,
        great: Number(hits['300']) || 0,
        good: Number(hits.katu) || 0,
        ok: Number(hits['100']) || 0,
        meh: Number(hits['50']) || 0,
        miss: Number(hits['0']) || 0
    };

    console.log('Parsed hits:', currentHits);

    updateValue('perfect', currentHits.perfect);
    updateValue('great', currentHits.great);
    updateValue('good', currentHits.good);
    updateValue('ok', currentHits.ok);
    updateValue('meh', currentHits.meh);
    updateValue('miss', currentHits.miss);

    previousHits = currentHits;
}

function updateValue(key, value) {
    const element = elements[key];
    if (!element) {
        console.warn(`Element not found for key: ${key}`);
        return;
    }

    const oldValue = parseInt(element.textContent) || 0;

    element.textContent = value.toString();

    if (value !== oldValue && value > 0) {
        element.parentElement.classList.add('updated');
        setTimeout(() => {
            element.parentElement.classList.remove('updated');
        }, 300);
    }
}

function showCounter() {
    container.style.opacity = '1';
    container.style.visibility = 'visible';
}

function hideCounter() {
    container.style.opacity = '0';
    container.style.visibility = 'hidden';
}

function resetCounter() {
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            elements[key].textContent = '0';
        }
    });

    previousHits = {
        perfect: 0,
        great: 0,
        good: 0,
        ok: 0,
        meh: 0,
        miss: 0
    };
}

connectWebSocket();

hideCounter();

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && socket.readyState !== WebSocket.OPEN) {
        connectWebSocket();
    }
});