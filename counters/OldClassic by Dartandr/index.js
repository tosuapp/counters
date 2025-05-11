const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

let bg = document.getElementById("bg");
let titleArtist = document.getElementById("title");
let pp = document.getElementById("pp");
let hun = document.getElementById("100");
let fifty = document.getElementById("50");
let miss = document.getElementById("miss");
let progressChart = document.getElementById("progress")


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
                            field: 'time',
                            keys: ['current', 'mp3']
                        },
                        {
                            field: 'path',
                            keys: ['full']
                        },
                        {
                            field: 'metadata',
                            keys: ['artist', 'title']
                        },
                    ]
                }
            ]
        },
        {
            field: 'gameplay',
            keys: [
                {
                    field: 'pp',
                    keys: ['current', 'strains']
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
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};


const cache = {};
let smoothOffset = 2;

socket.onmessage = event => {
    const data = JSON.parse(event.data);

    if (cache['image'] != data.menu.bm.path.full) {
        cache['image'] = data.menu.bm.path.full;


        let img = data.menu.bm.path.full.replace(/#/g, '%23').replace(/%/g, '%25');
        bg.setAttribute('src', `http://${HOST}/Songs/${img}?a=${Math.random(10000)}`);
    };

    const title = `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`;
    if (cache['title'] != title) {
        cache['title'] = title;

        titleArtist.innerHTML = title;
    };


    if (cache['pp'] != data.gameplay.pp.current) {
        cache['pp'] = data.gameplay.pp.current;

        pp.innerHTML = Math.round(cache['pp']);
    };


    if (cache['hit100'] != data.gameplay.hits[100]) {
        cache['hit100'] = data.gameplay.hits[100];

        hun.innerHTML = data.gameplay.hits[100];
    };


    if (cache['hit50'] != data.gameplay.hits[50]) {
        cache['hit50'] = data.gameplay.hits[50];

        fifty.innerHTML = data.gameplay.hits[50];
    };


    if (cache['hit0'] != data.gameplay.hits[0]) {
        cache['hit0'] = data.gameplay.hits[0];

        miss.innerHTML = data.gameplay.hits[0];
    };


    if (JSON.stringify(cache['strains']) != JSON.stringify(data.menu.pp.strains)) {
        cache['strains'] = data.menu.pp.strains;

        const smoothed = smooth(data.menu.pp.strains, smoothOffset);

        config.data.datasets[0].data = smoothed;
        config.data.labels = smoothed;

        configSecond.data.datasets[0].data = smoothed;
        configSecond.data.labels = smoothed;

        window.myLine.update();
        window.myLineSecond.update();
    };


    if (cache['current_time'] != data.menu.bm.time.current) {
        cache['current_time'] = data.menu.bm.time.current;

        progressChart.style.width = (500 / data.menu.bm.time.mp3) * cache['current_time'] + 'px';
    };
};


window.onload = function () {
    var ctx = document.getElementById('canvas').getContext('2d');
    window.myLine = new Chart(ctx, config);

    var ctxSecond = document.getElementById('canvasSecond').getContext('2d');
    window.myLineSecond = new Chart(ctxSecond, configSecond);
};

let config = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            borderColor: 'rgba(255, 255, 255, 0)',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            data: [],
            fill: true,
        }]
    },
    options: {
        tooltips: { enabled: false },
        legend: {
            display: false,
        },
        elements: {
            line: {
                tension: 0.4,
                cubicInterpolationMode: 'monotone'
            },
            point: {
                radius: 0
            }
        },
        responsive: false,
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
            }
        }
    }
};

let configSecond = {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            borderColor: 'rgba(255, 255, 255, 0)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            data: [],
            fill: true,
        }]
    },
    options: {
        tooltips: { enabled: false },
        legend: {
            display: false,
        },
        elements: {
            line: {
                tension: 0.4,
                cubicInterpolationMode: 'monotone'
            },
            point: {
                radius: 0
            }
        },
        responsive: false,
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
            }
        }
    }
};