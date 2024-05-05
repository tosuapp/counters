import WebSocketManager from './js/socket.js';


// connecting to websocket
const socket = new WebSocketManager('127.0.0.1:24050');



// cache values here to prevent constant updating
const cache = {};



// Smoouth numbers update
const unstableRate = new CountUp('ur', 0, 0, 2, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });


// Listen to command updates
socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
        const { command, message } = data;
        // get updates for "getSettings" command
        if (command == 'getSettings') {
            if (message['showPermanently'] != null) {
                cache['showPermanently'] = message['showPermanently'];

                if (Boolean(cache['showPermanently']) == true)
                    document.getElementById('ur').classList.add('always');
                else
                    document.getElementById('ur').classList.remove('always');
            };


            if (message['fontName'] != null) {
                document.body.style.fontFamily = `"${message['fontName']}", sans-serif`;
            };


            if (message['textColor'] != null) {
                document.body.style.setProperty('--textColor', message['textColor']);
            };
        };


    } catch (error) {
        console.log(error);
    };
});


// receive message update from websocket
socket.api_v1((data) => {
    try {
        if (cache.state !== data.menu.state) {
            cache.state = data.menu.state;
            document.getElementById('ur').style.opacity = cache.state == 2 ? 1 : 0
        };


        if (cache.ur !== data.gameplay.hits.unstableRate) {
            cache.ur = data.gameplay.hits.unstableRate;
            unstableRate.update(data.gameplay.hits.unstableRate);
        };
    } catch (error) {
        console.log(error);
    };
});