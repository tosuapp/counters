const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);
let progress = document.getElementById("progress");

socket.onopen = () => {
    console.log("Successfully Connected");
    socket.send(`applyFilters:${JSON.stringify([
        {
            field: 'menu',
            keys: [
                'state',
                {
                    field: 'bm',
                    keys: [
                        {
                            field: 'time',
                            keys: ['current', 'mp3']
                        }
                    ]
                }
            ],
        },
        {
            field: 'gameplay',
            keys: [
                {
                    field: 'pp',
                    keys: ['current', 'fc', '100']
                },
                {
                    field: 'hits',
                    keys: ['100', '50', '0', 'sliderBreaks']
                }
            ]
        }
    ])}`)
}
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => console.log("Socket Error: ", error);

let animation = {
    pp: new CountUp('pp', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
    ifFcpp: new CountUp('ifFcpp', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
    hun: new CountUp('hun', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
    fiv: new CountUp('fiv', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
    miss: new CountUp('miss', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
    sb: new CountUp('sb', 0, 0, 0, 0.5, { decimalPlaces: 2, useEasing: true, useGrouping: false, separator: " ", decimal: "." }),
};


const cache = {};

socket.onmessage = event => {
    const data = JSON.parse(event.data);


    if (data.menu.state == 2 || data.menu.state == 7) {
        if (cache['pp'] != data.gameplay.pp.current) {
            cache['pp'] = data.gameplay.pp.current;

            animation.pp.update(cache['pp']);
        };

        if(cache['pp100']) cache['pp100'] = undefined;
    } else {
        if (cache['pp100'] != data.menu.pp[100]) {
            cache['pp100'] = data.menu.pp[100];

            animation.pp.update(cache['pp100']);
        };
    };

    if (cache['ppfc'] != data.gameplay.pp.fc) {
        cache['ppfc'] = data.gameplay.pp.fc;

        animation.ifFcpp.update(cache['ppfc']);
    };


    if (cache['hit100'] != data.gameplay.hits[100]) {
        cache['hit100'] = data.gameplay.hits[100];

        animation.hun.update(data.gameplay.hits[100]);
    };


    if (cache['hit50'] != data.gameplay.hits[50]) {
        cache['hit50'] = data.gameplay.hits[50];

        animation.fiv.update(data.gameplay.hits[50]);
    };


    if (cache['hit0'] != data.gameplay.hits[0]) {
        cache['hit0'] = data.gameplay.hits[0];

        animation.miss.update(data.gameplay.hits[0]);
    };


    if (cache['hitsb'] != data.gameplay.hits.sliderBreaks) {
        cache['hitsb'] = data.gameplay.hits.sliderBreaks;

        animation.sb.update(data.gameplay.hits.sliderBreaks);
    };


    if (cache['missed'] != `${data.gameplay.hits[0]}:${data.gameplay.hits.sliderBreaks}`) {
        cache['missed'] = `${data.gameplay.hits[0]}:${data.gameplay.hits.sliderBreaks}`;

        if (cache['missed'] != '0:0') document.querySelector('.ifFcpp').style.opacity = 1;
        else document.querySelector('.ifFcpp').style.opacity = 0;
    };


    if (cache['current_time'] != data.menu.bm.time.current) {
        cache['current_time'] = data.menu.bm.time.current;

        progress.style.width = (178 / data.menu.bm.time.mp3) * cache['current_time'] + 'px';
    };
};