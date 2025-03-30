// connecting to websocket
import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager(window.location.host);


// cache values here to prevent constant updating
const cache = {
  h100: -1,
  h50: -1,
  h0: -1,
  accuracy: -1,
};



// Smoouth numbers update
const accuracy = new CountUp('accuracy', 0, 0, 2, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h100 = new CountUp('h100', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h50 = new CountUp('h50', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h0 = new CountUp('h0', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })




// receive message update from websocket
socket.api_v2(data => {
  try {
    // check if value has changed
    if (cache.h100 !== data.play.hits['100']) {
      // update cache
      cache.h100 = data.play.hits['100'];


      //      IMPORTANT   !!   USE ONE OF THEM

      // update html via countup
      h100.update(data.play.hits['100']);

      // update html via js
      document.getElementById('h100').innerHTML = data.play.hits['100'];
    };



    if (cache.h50 !== data.play.hits['50']) {
      cache.h50 = data.play.hits['50'];
      h50.update(data.play.hits['50']);
    };

    if (cache.h0 !== data.play.hits['0']) {
      cache.h0 = data.play.hits['0'];
      h0.update(data.play.hits['0']);
    };

    if (cache.accuracy != data.play.accuracy) {
      cache.accuracy = data.play.accuracy;
      accuracy.update(data.play.accuracy);
    };

    if (cache.pp !== Math.round(data.play.pp.current)) {
      cache.pp = Math.round(data.play.pp.current);
      document.getElementById('pp').innerHTML = Math.round(data.play.pp.current);
    };
  } catch (error) {
    console.log(error);
  };
});