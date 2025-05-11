const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

let pp = document.getElementById("pp");
let hun = document.getElementById("h100");
let fifty = document.getElementById("h50");
let miss = document.getElementById("h0");

socket.onopen = () => {
    console.log("Successfully Connected");
    socket.send(`applyFilters:${JSON.stringify([
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
        },
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

socket.onmessage = event => {
    const data = JSON.parse(event.data);


    if (cache['pp'] != data.gameplay.pp.current) {
        cache['pp'] = data.gameplay.pp.current;


        pp.innerHTML = Math.round(cache['pp']) + "pp";
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