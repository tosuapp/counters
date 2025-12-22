const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

let bg = document.getElementById("bg");
let star = document.getElementById("star");
let pp = document.getElementById("pp");
let hun = document.getElementById("h100");
let fifty = document.getElementById("h50");
let miss = document.getElementById("h0");
let time = document.getElementById("time");

socket.onopen = () => {
    console.log("Successfully Connected");
    socket.send(`applyFilters:${JSON.stringify([
        {
            field: 'menu',
            keys: [
                {
                    field: 'bm',
                    keys: [
                        {
                            field: 'path',
                            keys: ['full']
                        },
                        {
                            field: 'time',
                            keys: ['current']
                        },
                        {
                            field: 'stats',
                            keys: ['SR']
                        }
                    ]
                },
            ]
        },
        {
            field: 'gameplay',
            keys: [
                {
                    field: 'pp',
                    keys: ['current']
                },
                {
                    field: 'hits',
                    keys: ['100', '50', '0']
                }
            ]
        }
    ])}`)
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};


const cache = {};

socket.onmessage = event => {
    const data = JSON.parse(event.data);

    if (cache['image'] != data.menu.bm.path.full) {
        cache['image'] = data.menu.bm.path.full;

        bg.setAttribute('src', `http://${HOST}/Songs/${data.menu.bm.path.full}?a=${Math.random(10000)}`)
    };


    if (data.menu.bm.time.current > 1000) {
        let seconds = (data.menu.bm.time.current / 1000).toFixed(0);
        let minutes = Math.floor(seconds % 3600 / 60).toString();

        if (seconds > 60) {
            time.innerHTML = `${minutes}m ${seconds - (minutes * 60)}s`;
        } else {
            time.innerHTML = `${seconds}s`;
        }
    };


    if (cache['pp'] != data.gameplay.pp.current) {
        cache['pp'] = data.gameplay.pp.current;


        pp.innerHTML = Math.round(cache['pp']) + "pp";
    };


    if (cache['sr'] != data.menu.bm.stats.SR) {
        cache['sr'] = data.menu.bm.stats.SR;

        star.innerHTML = cache['sr'];
    };


    if (cache['100'] != data.gameplay.hits[100]) {
        cache['100'] = data.gameplay.hits[100];

        hun.innerHTML = cache['100'];
    };


    if (cache['50'] != data.gameplay.hits[50]) {
        cache['50'] = data.gameplay.hits[50];

        fifty.innerHTML = cache['50'];
    };


    if (cache['0'] != data.gameplay.hits[0]) {
        cache['0'] = data.gameplay.hits[0];

        miss.innerHTML = cache['0'];
    };
};