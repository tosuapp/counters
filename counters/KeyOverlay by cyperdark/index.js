import WebSocketManager from './js/socket.js';
import CanvasKeys from './js/canvas.js';


let websocketUrl = window.location.host;
const socket = new WebSocketManager(websocketUrl);


const keys = {
  k1: new CanvasKeys({
    canvasID: 'k1',
  }),
  k2: new CanvasKeys({
    canvasID: 'k2',
  }),
  m1: new CanvasKeys({
    canvasID: 'm1',
  }),
  m2: new CanvasKeys({
    canvasID: 'm2',
  }),
};
const cache = {};


socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
  try {

    const { command, message } = data;
    if (command == 'getSettings') {
      if (cache['k1PressColor'] != message['k1PressColor']) keys.k1.color = message['k1PressColor'];
      if (cache['k2PressColor'] != message['k2PressColor']) keys.k2.color = message['k2PressColor'];
      if (cache['m1PressColor'] != message['m1PressColor']) keys.m1.color = message['m1PressColor'];
      if (cache['m2PressColor'] != message['m2PressColor']) keys.m2.color = message['m2PressColor'];

      if (cache['bpmInterval'] != message['bpmInterval']) {
        keys.k1.interval = message['bpmInterval'];
        keys.k2.interval = message['bpmInterval'];
        keys.m1.interval = message['bpmInterval'];
        keys.m2.interval = message['bpmInterval'];
      };

      if (cache['keysSpeed'] != message['keysSpeed']) {
        keys.k1.speed = message['keysSpeed'];
        keys.k2.speed = message['keysSpeed'];
        keys.m1.speed = message['keysSpeed'];
        keys.m2.speed = message['keysSpeed'];
      };

      if (cache['keypressesRoundness'] != message['keypressesRoundness']) {
        keys.k1.cornerRadius = message['keypressesRoundness'];
        keys.k2.cornerRadius = message['keypressesRoundness'];
        keys.m1.cornerRadius = message['keypressesRoundness'];
        keys.m2.cornerRadius = message['keypressesRoundness'];
      };


      if (cache['keynameEnable'] != message['keynameEnable']) {
        cache['keynameEnable'] = message['keynameEnable'];
        document.body.style.setProperty('--keyNameOpacity', message['keynameEnable'] == true ? 1 : 0);
      };


      if (cache['k1Enable'] != message['k1Enable']) {
        cache['k1Enable'] = message['k1Enable'];

        if (message['k1Enable'] == true && cache[`key-k1-count`] > 0) {
          document.querySelector('.keys.k1').classList.remove('hidden');
        };

        if (message['k1Enable'] == false) {
          document.querySelector('.keys.k1').classList.add('hidden');
        };
      };

      if (cache['k2Enable'] != message['k2Enable']) {
        cache['k2Enable'] = message['k2Enable'];

        if (message['k2Enable'] == true && cache[`key-k2-count`] > 0) {
          document.querySelector('.keys.k2').classList.remove('hidden');
        };

        if (message['k2Enable'] == false) {
          document.querySelector('.keys.k2').classList.add('hidden');
        };
      };

      if (cache['m1Enable'] != message['m1Enable']) {
        cache['m1Enable'] = message['m1Enable'];

        if (message['m1Enable'] == true && cache[`key-m1-count`] > 0) {
          document.querySelector('.keys.m1').classList.remove('hidden');
        };

        if (message['m1Enable'] == false) {
          document.querySelector('.keys.m1').classList.add('hidden');
        };
      };

      if (cache['m2Enable'] != message['m2Enable']) {
        cache['m2Enable'] = message['m2Enable'];

        if (message['m2Enable'] == true && cache[`key-m2-count`] > 0) {
          document.querySelector('.keys.m2').classList.remove('hidden');
        };

        if (message['m2Enable'] == false) {
          document.querySelector('.keys.m2').classList.add('hidden');
        };
      };


      if (cache['k1KeyTextColor'] != message['k1KeyTextColor']) {
        cache['k1KeyTextColor'] = message['k1KeyTextColor'];
        document.querySelector('.keys.k1').style.setProperty('--key-color', message['k1KeyTextColor']);
      };

      if (cache['k2KeyTextColor'] != message['k2KeyTextColor']) {
        cache['k2KeyTextColor'] = message['k2KeyTextColor'];
        document.querySelector('.keys.k2').style.setProperty('--key-color', message['k2KeyTextColor']);
      };

      if (cache['m1KeyTextColor'] != message['m1KeyTextColor']) {
        cache['m1KeyTextColor'] = message['m1KeyTextColor'];
        document.querySelector('.keys.m1').style.setProperty('--key-color', message['m1KeyTextColor']);
      };

      if (cache['m2KeyTextColor'] != message['m2KeyTextColor']) {
        cache['m2KeyTextColor'] = message['m2KeyTextColor'];
        document.querySelector('.keys.m2').style.setProperty('--key-color', message['m2KeyTextColor']);
      };


      if (cache['k1TextColor'] != message['k1TextColor']) {
        cache['k1TextColor'] = message['k1TextColor'];
        document.querySelector('.keys.k1').style.setProperty('--color', message['k1TextColor']);
      };

      if (cache['k2TextColor'] != message['k2TextColor']) {
        cache['k2TextColor'] = message['k2TextColor'];
        document.querySelector('.keys.k2').style.setProperty('--color', message['k2TextColor']);
      };

      if (cache['m1TextColor'] != message['m1TextColor']) {
        cache['m1TextColor'] = message['m1TextColor'];
        document.querySelector('.keys.m1').style.setProperty('--color', message['m1TextColor']);
      };

      if (cache['m2TextColor'] != message['m2TextColor']) {
        cache['m2TextColor'] = message['m2TextColor'];
        document.querySelector('.keys.m2').style.setProperty('--color', message['m2TextColor']);
      };


      if (cache['k1PressColor'] != message['k1PressColor']) {
        cache['k1PressColor'] = message['k1PressColor'];
        document.querySelector('.keys.k1').style.setProperty('--press', message['k1PressColor']);
      };

      if (cache['k2PressColor'] != message['k2PressColor']) {
        cache['k2PressColor'] = message['k2PressColor'];
        document.querySelector('.keys.k2').style.setProperty('--press', message['k2PressColor']);
      };

      if (cache['m1PressColor'] != message['m1PressColor']) {
        cache['m1PressColor'] = message['m1PressColor'];
        document.querySelector('.keys.m1').style.setProperty('--press', message['m1PressColor']);
      };

      if (cache['m2PressColor'] != message['m2PressColor']) {
        cache['m2PressColor'] = message['m2PressColor'];
        document.querySelector('.keys.m2').style.setProperty('--press', message['m2PressColor']);
      };


      if (cache['k1PressedColor'] != message['k1PressedColor']) {
        cache['k1PressedColor'] = message['k1PressedColor'];
        document.querySelector('.keys.k1').style.setProperty('--pressed', message['k1PressedColor']);
      };

      if (cache['k2PressedColor'] != message['k2PressedColor']) {
        cache['k2PressedColor'] = message['k2PressedColor'];
        document.querySelector('.keys.k2').style.setProperty('--pressed', message['k2PressedColor']);
      };

      if (cache['m1PressedColor'] != message['m1PressedColor']) {
        cache['m1PressedColor'] = message['m1PressedColor'];
        document.querySelector('.keys.m1').style.setProperty('--pressed', message['m1PressedColor']);
      };

      if (cache['m2PressedColor'] != message['m2PressedColor']) {
        cache['m2PressedColor'] = message['m2PressedColor'];
        document.querySelector('.keys.m2').style.setProperty('--pressed', message['m2PressedColor']);
      };



      if (cache['fontSize'] != message['fontSize']) {
        cache['fontSize'] = message['fontSize'];
        document.body.style.setProperty('--font-size', message['fontSize']);
      };

      if (cache['fontName'] != message['fontName']) {
        cache['fontName'] = message['fontName'];

        if (cache['fontName']) document.body.style.fontFamily = `"${cache['fontName']}", sans-serif`;
      };



      if (cache['width'] != message['width']) {
        cache['width'] = message['width'];
        document.body.style.setProperty('--width', message['width']);

        document.getElementById('k1').setAttribute('width', `${message['width']}`);
        document.getElementById('k2').setAttribute('width', `${message['width']}`);
        document.getElementById('m1').setAttribute('width', `${message['width']}`);
        document.getElementById('m2').setAttribute('width', `${message['width']}`);

        setTimeout(() => {
          keys.k1.updateCanvas();
          keys.k2.updateCanvas();
          keys.m1.updateCanvas();
          keys.m2.updateCanvas();
        }, 200);
      };

      if (cache['height'] != message['height']) {
        cache['height'] = message['height'];
        document.body.style.setProperty('--height', message['height']);

        document.getElementById('k1').setAttribute('height', `${message['height']}`);
        document.getElementById('k2').setAttribute('height', `${message['height']}`);
        document.getElementById('m1').setAttribute('height', `${message['height']}`);
        document.getElementById('m2').setAttribute('height', `${message['height']}`);

        setTimeout(() => {
          keys.k1.updateCanvas();
          keys.k2.updateCanvas();
          keys.m1.updateCanvas();
          keys.m2.updateCanvas();
        }, 200);
      };



      if (cache['direction'] != message['direction']) {
        document.body.classList.remove(`-${cache['direction']}`);

        cache['direction'] = message['direction'];
        document.body.classList.add(`-${cache['direction']}`);
      };

      if (cache['stickPosition'] != message['stickPosition']) {
        if (cache['stickPosition'])
          document.body.classList.remove(`--${cache['stickPosition'].replace('to ', '')}`);

        cache['stickPosition'] = message['stickPosition'];
        if (cache['stickPosition'])
          document.body.classList.add(`--${cache['stickPosition'].replace('to ', '')}`);
      };

      if (cache['positionOffset'] != message['positionOffset']) {
        document.body.classList.remove(`--${cache['positionOffset']}`);

        cache['positionOffset'] = message['positionOffset'];
        if (cache['positionOffset'])
          document.body.style.setProperty('--offset', `${cache['positionOffset']}%`);
      };


      if (cache['pressWidth'] != message['pressWidth']) {
        cache['pressWidth'] = message['pressWidth'];
        document.body.style.setProperty('--press-width', message['pressWidth']);
      };

    };

  } catch (error) {
    console.log(error);
  };
});


socket.api_v2((data) => {
  try {
    if (cache['osu-k1'] != data.settings.keybinds.osu.k1) {
      cache['osu-k1'] = data.settings.keybinds.osu.k1;

      document.getElementById('k1Name').innerHTML = cache['osu-k1'];
    };


    if (cache['osu-k2'] != data.settings.keybinds.osu.k2) {
      cache['osu-k2'] = data.settings.keybinds.osu.k2;

      document.getElementById('k2Name').innerHTML = cache['osu-k2'];
    };


    if (cache['state'] != data.state.number) {
      cache['state'] = data.state.number;
    };

    if (cache['time'] != data.beatmap.time.live) {
      if (cache['time'] > data.beatmap.time.live) {
        delete cache['key-k1-press'];
        delete cache['key-k1-count'];
        delete cache['key-k1-active'];
        delete cache['key-k1-r'];
        keys['k1'].bpmArray.length = 0;


        delete cache['key-k2-press'];
        delete cache['key-k2-count'];
        delete cache['key-k2-active'];
        delete cache['key-k2-r'];
        keys['k2'].bpmArray.length = 0;


        delete cache['key-m1-press'];
        delete cache['key-m1-count'];
        delete cache['key-m1-active'];
        delete cache['key-m1-r'];
        keys['m1'].bpmArray.length = 0;


        delete cache['key-m2-press'];
        delete cache['key-m2-count'];
        delete cache['key-m2-active'];
        delete cache['key-m2-r'];
        keys['m2'].bpmArray.length = 0;
      };

      cache['time'] = data.beatmap.time.live;
    }


    if (data.state.number == 7) {
      if (cache[`key-k1-r`]) document.querySelector(`.keys.k1`).classList.remove('hidden');
      if (cache[`key-k2-r`]) document.querySelector(`.keys.k2`).classList.remove('hidden');
      if (cache[`key-m1-r`]) document.querySelector(`.keys.m1`).classList.remove('hidden');
      if (cache[`key-m2-r`]) document.querySelector(`.keys.m2`).classList.remove('hidden');
    };


    if (data.state.number != 2 && data.state.number != 7) {
      delete cache[`key-k1-active`];
      delete cache[`key-k2-active`];
      delete cache[`key-m1-active`];
      delete cache[`key-m2-active`];

      document.querySelector(`.keys.k1`).classList.add('hidden');
      document.querySelector(`.keys.k2`).classList.add('hidden');
      document.querySelector(`.keys.m1`).classList.add('hidden');
      document.querySelector(`.keys.m2`).classList.add('hidden');
    };
  } catch (error) {
    console.log(error);
  };
}, [
  {
    field: 'state',
    keys: ['number']
  },
  {
    field: 'beatmap',
    keys: [
      {
        field: 'time',
        keys: ['live']
      }
    ]
  },
  {
    field: 'settings',
    keys: [
      {
        field: 'keybinds',
        keys: [
          {
            field: 'osu',
            keys: ['k1', 'k2']
          }]
      }
    ]
  }
]);


socket.api_v2_precise((data) => {
  try {
    if (cache['state'] != 2) return;


    const keysArray = Object.keys(data.keys);
    for (let i = 0; i < keysArray.length; i++) {
      const key = keysArray[i];
      const value = data.keys[key];

      if (!keys[key]) continue;
      if (cache[`${key}Enable`] != true) continue;


      if (cache[`key-${key}-press`] != value.isPressed) {
        cache[`key-${key}-press`] = value.isPressed;
        keys[key].blockStatus(value.isPressed);

        const status = value.isPressed ? 'add' : 'remove';
        document.getElementById(`${key}Press`).classList[status]('active');
      };


      if (cache[`key-${key}-count`] != value.count) {
        keys[key].registerKeypress();
        document.getElementById(`${key}Count`).innerHTML = value.count;


        if (value.count >= 20) cache[`key-${key}-r`] = true;
        cache[`key-${key}-count`] = value.count;
      };


      if (cache[`key-${key}-active`] == null) {
        if (value.count > 0) {
          document.querySelector(`.keys.${key}`).classList.remove('hidden');

          cache[`key-${key}-active`] = true;
        };
      };
    };
  } catch (err) {
    console.log(err);
  };
}, ['keys']);