// connecting to websocket
import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager(window.location.host);

const pp = new CountUp("pp", 0, 0, 0, 0.5);
if (!pp.error) {
  pp.start();
} else {
  console.error(pp.error);
}

// cache values here to prevent constant updating
const cache = {
  pp: -1,
};

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));

socket.commands((data) => {
  try {
    const { command, message } = data;

    if (message['ppSize'] != null) {
      document.documentElement.style.setProperty('--pp-size', `${message['ppSize']}px`);
    }
    if (message['labelSize'] != null) {
      document.documentElement.style.setProperty('--label-size', `${message['labelSize']}px`);
    }
    if (message['spacing'] != null) {
      document.documentElement.style.setProperty('--spacing', `${message['spacing']}px`);
    }
    if (message['ppColor'] != null) {
      document.documentElement.style.setProperty('--pp-color', message['ppColor']);
    }
    if (message['labelColor'] != null) {
      document.documentElement.style.setProperty('--label-color', message['labelColor']);
    }
    if (message['showLabel'] != null) {
      document.documentElement.style.setProperty('--label-display', message['showLabel'] ? 'inline' : 'none');
    }

  } catch (error) {
    console.log(error);
  }
});

// receive message update from websocket
socket.api_v2(data => {
  try {
    let ppValue = 0;
    const state = data.state.name;

    if (state === 'play' || state === 'resultScreen') {
      ppValue = data.play.pp.current;
    } else {
      ppValue = data.performance.accuracy[100];
    }

    if (cache.pp !== ppValue) {
      cache.pp = ppValue;
      pp.update(cache.pp);
    };
  } catch (error) {
    console.log(error);
  };
}, [
  'state',
  {
    field: 'play',
    keys: [{
      field: 'pp',
      keys: 'current'
    }]
  },
  {
    field: 'performance',
    keys: [{
      field: 'accuracy',
      keys: ['100']
    }]
  },
]);
