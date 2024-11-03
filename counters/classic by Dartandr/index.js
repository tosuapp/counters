const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

let bg = document.getElementById("bg");
let titleArtist = document.getElementById("title");
let currentPP = document.getElementById("currentPP");
let ifFC = document.getElementById("ifFC");
let state = document.getElementById("state");
let hun = document.getElementById("h100");
let fifty = document.getElementById("h50");
let miss = document.getElementById("miss");
let mods = document.getElementById("mods");
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
    const data = JSON.parse(event.data);


    if (cache['image'] != data.menu.bm.path.full) {
        cache['image'] = data.menu.bm.path.full;


        let img = data.menu.bm.path.full.replace(/#/g, '%23').replace(/%/g, '%25');
        bg.setAttribute('src', `http://${HOST}/Songs/${img}?a=${Math.random(10000)}`);
    };


    if (cache['state'] !== data.menu.state) {
        cache['state'] = data.menu.state;

        state.style.transform = cache['state'] === 2 || cache['state'] === 7 || cache['state'] === 14 ? "translateY(0)" : "translateY(-50px)";
    };


    const title = `${data.menu.bm.metadata.artist} - ${data.menu.bm.metadata.title}`;
    if (cache['title'] != title) {
        cache['title'] = title;

        titleArtist.innerHTML = title;
    };



    ['ar', 'cs', 'od', 'hp'].forEach(r => {
        if (cache[`stat-${r}`] != data.menu.bm.stats[r.toUpperCase()]) {
            cache[`stat-${r}`] = data.menu.bm.stats[r.toUpperCase()];

            document.getElementById(r).innerHTML = `${r.toUpperCase()}: ${Math.round(cache[`stat-${r}`] * 10) / 10} <hr>`;
        };
    });


    if (cache['pp'] != data.gameplay.pp.current) {
        cache['pp'] = data.gameplay.pp.current;

        currentPP.innerHTML = Math.round(cache['pp']);
    };


    if (cache['ppfc'] != data.gameplay.pp.fc) {
        cache['ppfc'] = data.gameplay.pp.fc;

        ifFC.innerHTML = Math.round(cache['ppfc']);
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



    if (cache['mods'] != data.menu.mods.str) {
        cache['mods'] = data.menu.mods.str;

        if (cache['mods'] == "" || cache['mods'] == "NM") {
            mods.innerHTML = '';
        }
        else {
            mods.innerHTML = '';
            let modsApplied = cache['mods'].toLowerCase();

            if (modsApplied.indexOf('nc') != -1)
                modsApplied = modsApplied.replace('dt', '');

            if (modsApplied.indexOf('pf') != -1)
                modsApplied = modsApplied.replace('sd', '');

            let modsArr = modsApplied.match(/.{1,2}/g);
            for (let i = 0; i < modsArr.length; i++) {
                let mod = document.createElement('div');
                mod.setAttribute('class', 'mod');
                let modImg = document.createElement('img');
                modImg.setAttribute('src', modsImgs[modsArr[i]]);
                mod.appendChild(modImg);
                mods.appendChild(mod);
            }
        }
    }
};