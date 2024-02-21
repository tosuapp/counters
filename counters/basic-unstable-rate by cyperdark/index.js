// connecting to websocket
const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);


// handle on open/close/error
socket.onopen = () => console.log("Successfully Connected");

socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};

socket.onerror = error => console.log("Socket Error: ", error);



// cache values here to prevent constant updating
const cache = {
    state: -1,
    ur: 0,
};



// Smoouth numbers update
const unstableRate = new CountUp('ur', 0, 0, 2, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });



// receive message update from websocket
socket.onmessage = event => {
    try {
        const data = JSON.parse(event.data);


        if (cache.state !== data.menu.state) {
            cache.state = data.menu.state;
            document.getElementById('ur').style.opacity = cache.state == 2 ? 1 : 0
        };


        if (cache.ur !== data.gameplay.hits.unstableRate) {
            cache.ur = data.gameplay.hits.unstableRate;
            unstableRate.update(data.gameplay.hits.unstableRate);
        };
    } catch (err) {
        console.log(err);
    };
};