// connecting to websocket
import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager(window.location.host);

// cache
const cache = {
    h100: -1,
    h50: -1,
    h0: -1,
    progress: -1,
};

// Smoother numbers update
const h100 = new CountUp('great-hits', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
const h50 = new CountUp('good-hits', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
const h0 = new CountUp('miss-hits', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });


// receive message update from websocket
socket.api_v2(({ play, beatmap }) => {
    try {
        //? H100 (Ok)
        let h100Value = play.hits['100'] ?? 'N/A';
        if (cache.h100 !== h100Value) {
            cache.h100 = h100Value;
            h100.update(h100Value);
            // console.log('h100 updated :', h100Value); // debug
        }

        //? H50 (Meh)
        let h50Value = play.hits['50'] ?? 'N/A';
        if (cache.h50 !== h50Value) {
            cache.h50 = h50Value;
            h50.update(h50Value);
            // console.log('h50 updated :', h50Value) // debug
        }

        //? H0 (Miss)
        let h0Value = play.hits['0'] ?? 'N/A';
        if (cache.h0 !== h0Value) {
            cache.h0 = h0Value;
            h0.update(h0Value);
            // console.log('h0 updated :', h0Value); // debug
        }

        if (cache.pp !== Math.round(play.pp.current)) {
            cache.pp = Math.round(play.pp.current);
            document.getElementById('realtime-pp').innerHTML = Math.round(play.pp.current);
            // console.log('pp updated :', Math.round(play.pp.current)); // debug
        };

        // Progress (%) = (live - firstObject) / (lastObject - firstObject) x 100
        if (beatmap?.time) {
            const live = beatmap.time.live;
            const first = beatmap.time.firstObject;
            const last = beatmap.time.lastObject;

            let percent = 0;
            if (last > first) {
                percent = ((live - first) / (last - first)) * 100;
                percent = Math.min(Math.max(percent, 0), 100); // clamp
            }

            const percentStr = percent.toFixed(1);

            if (cache.progress !== percentStr) {
                cache.progress = percentStr;
                document.getElementById('progressBarFill').style.width = percentStr + "%";
            }
        }
    } catch (error) {
        console.log(error);
    };
}, [
    {
        field: 'play',
        keys: [
            {
                field: 'hits',
                keys: ['100', '50', '0']
            },
            {
                field: 'pp',
                keys: ['current']
            },
        ]
    },
    {
        field: 'beatmap',
        keys: [
            {
                field: 'time',
                keys: ['live', 'firstObject', 'lastObject']
            },
        ]
    },
]);