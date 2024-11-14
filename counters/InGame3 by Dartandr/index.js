const HOST = '127.0.0.1:24050';
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);

socket.onopen = () => console.log("Successfully Connected");
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => console.log("Socket Error: ", error);

let animation = {
    pp: new CountUp('pp', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
    ifFcpp: new CountUp('ifFcpp', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
};


const cache = {};

socket.onmessage = event => {
    const data = JSON.parse(event.data);


    if (data.menu.state == 2 || data.menu.state == 7) {
        if (cache['pp'] != data.gameplay.pp.current) {
            cache['pp'] = data.gameplay.pp.current;

            animation.pp.update(cache['pp']);
        };
    } else {
        if (cache['pp100'] != data.menu.pp[100]) {
            cache['pp100'] = data.menu.pp[100];

            animation.pp.update(cache['pp100']);
        };
    };

    if(cache['misses'] != data.play.hits[0]) {
        document.querySelector('.ifFcpp').style.opacity = data.play.hits[0] > 0;
    }


    if (cache['ppfc'] != data.gameplay.pp.fc) {
        cache['ppfc'] = data.gameplay.pp.fc;

        animation.ifFcpp.update(cache['ppfc']);
    };
};