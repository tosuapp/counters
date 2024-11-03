const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);
let scoreColor = document.getElementById('sbColor')
let score = document.getElementById('score');
let wrapper = document.getElementById('wrapper');
let widthBase = scoreColor.offsetWidth;


socket.onopen = () => {
    console.log("Successfully Connected");
};

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!")
};

socket.onerror = error => {
    console.log("Socket Error: ", error);
};


let animation = {
    acc: new CountUp('accdata', 0, 0, 2, .2, { useEasing: true, useGrouping: true, separator: " ", decimal: "." }),
    combo: new CountUp('combodata', 0, 0, 0, .2, { useEasing: true, useGrouping: true, separator: " ", decimal: "." }),
};


const cache = {};

socket.onmessage = event => {
    const data = JSON.parse(event.data);


    if (cache['state'] != data.menu.state) {
        cache['state'] = data.menu.state;

        wrapper.style.opacity = cache['state'] == 2 ? 1 : 0;
    };


    if (cache['hp'] != data.gameplay.hp.smooth) {
        cache['hp'] = data.gameplay.hp.smooth;


        let step = widthBase / 200;
        scoreColor.style.width = step * data.gameplay.hp.smooth + 'px';
    };


    if (cache['score'] != data.gameplay.score) {
        cache['score'] = data.gameplay.score;

        score.innerHTML = cache['score'].toString().padStart(8, "0");
    };


    if (cache['accuracy'] != data.gameplay.accuracy) {
        cache['accuracy'] = data.gameplay.accuracy;

        animation.acc.update(cache['accuracy']);
    };


    if (cache['combo'] != data.gameplay.combo.current) {
        cache['combo'] = data.gameplay.combo.current;

        animation.combo.update(cache['combo']);
    };
};