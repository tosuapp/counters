const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);
let mapid = document.getElementById('mapid');

let bg = document.getElementById("bg");
let pp = document.getElementById("pp");
let hun = document.getElementById("green");
let fifty = document.getElementById("purple");
let miss = document.getElementById("red");


socket.onopen = () => {
    console.log("Successfully Connected");
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
    let data = JSON.parse(event.data);

    if (cache['image'] != data.menu.bm.path.full) {
        cache['image'] = data.menu.bm.path.full;

        bg.setAttribute('src', `http://${HOST}/Songs/${data.menu.bm.path.full}?a=${Math.random(10000)}`)
        mapid.innerHTML = data.menu.bm.id;
    };


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