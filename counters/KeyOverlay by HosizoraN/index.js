import WebSocketManager from './deps/socket.js';

const socket = new WebSocketManager('127.0.0.1:24050');

const cache = {};

let Key1Cont = document.getElementById('Key1Cont');
let Key2Cont = document.getElementById('Key2Cont');
let Mouse1Cont = document.getElementById('Mouse1Cont');
let Mouse2Cont = document.getElementById('Mouse2Cont');
let k1 = new KeyOverlay('k1', 'k1Tiles', {keyTextId: "k1Text", keyNameId: "key1"}),
    k2 = new KeyOverlay('k2', 'k2Tiles', {keyTextId: "k2Text", keyNameId: "key2"}),
    m1 = new KeyOverlay('m1', 'm1Tiles', {keyTextId: "m1Text", keyNameId: "key3"}),
    m2 = new KeyOverlay('m2', 'm2Tiles', {keyTextId: "m2Text", keyNameId: "key4"});

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
      const { command, message } = data;

      if (command == 'getSettings') {
        console.log(command, message);
      };

      if (message['K1Color'] != null) {
        document.body.style.setProperty('--k1Color', message['K1Color']);
      };
      if (message['K1PressedColor'] != null) {
        document.body.style.setProperty('--k1Tap', message['K1PressedColor']);
      };
      if (message['K1TextColor'] != null) {
        document.body.style.setProperty('--k1Text', message['K1TextColor']);
      };

      if (message['K2Color'] != null) {
        document.body.style.setProperty('--k2Color', message['K2Color']);
      };
      if (message['K2PressedColor'] != null) {
        document.body.style.setProperty('--k2Tap', message['K2PressedColor']);
      };
      if (message['K2TextColor'] != null) {
        document.body.style.setProperty('--k2Text', message['K2TextColor']);
      };
      
      if (message['M1Color'] != null) {
        document.body.style.setProperty('--m1Color', message['M1Color']);
      };
      if (message['M1PressedColor'] != null) {
        document.body.style.setProperty('--m1Tap', message['M1PressedColor']);
      };
      if (message['M1TextColor'] != null) {
        document.body.style.setProperty('--m1Text', message['M1TextColor']);
      };

      if (message['M2Color'] != null) {
        document.body.style.setProperty('--m2Color', message['M2Color']);
      };
      if (message['M2PressedColor'] != null) {
        document.body.style.setProperty('--m2Tap', message['M2PressedColor']);
      };
      if (message['M2TextColor'] != null) {
        document.body.style.setProperty('--m2Text', message['M2TextColor']);
      };

      if (message['tileradius'] != null) {
        document.body.style.setProperty('--radius', `${message['tileradius']}px`);
      };

      if (message['speed'] != null) {
        k1.speed = message['speed'];
        k2.speed = message['speed'];
        m1.speed = message['speed'];
        m2.speed = message['speed'];
      };
      
    } catch (error) {
      console.log(error);
    };
  });

socket.api_v2_precise((data) => {

    if (cache['data.keys.k1.count'] != data.keys.k1.count) {
        cache['data.keys.k1.count'] = data.keys.k1.count;
        if (data.keys.k1.count > 0) {
            Key1Cont.style.opacity = 1
            Key1Cont.style.transform = 'translateY(0)';
        }
        else {
            Key1Cont.style.opacity = 0
            Key1Cont.style.transform = 'translateY(-10px)';
        }
    }
    if (cache['data.keys.k2.count'] != data.keys.k2.count) {
        cache['data.keys.k2.count'] = data.keys.k2.count;
        if (data.keys.k2.count > 0) {
            Key2Cont.style.opacity = 1
            Key2Cont.style.transform = 'translateY(0)';
        }
        else {
            Key2Cont.style.opacity = 0
            Key2Cont.style.transform = 'translateY(-10px)';
        }
    }
    if (cache['data.keys.m1.count'] != data.keys.m1.count) {
        cache['data.keys.m1.count'] = data.keys.m1.count;
        if (data.keys.m1.count > 0) {
            Mouse1Cont.style.opacity = 1
            Mouse1Cont.style.transform = 'translateY(0)';
        }
        else {
            Mouse1Cont.style.opacity = 0
            Mouse1Cont.style.transform = 'translateY(-10px)';
        }
    }
    if (cache['data.keys.m2.count'] != data.keys.m2.count) {
        cache['data.keys.m2.count'] = data.keys.m2.count;
        if (data.keys.m2.count > 0) {
            Mouse2Cont.style.opacity = 1
            Mouse2Cont.style.transform = 'translateY(0)';
        }
        else {
            Mouse2Cont.style.opacity = 0
            Mouse2Cont.style.transform = 'translateY(-10px)';
        }
    }

    k1.update(data.keys.k1);
    k2.update(data.keys.k2);
    m1.update(data.keys.m1);
    m2.update(data.keys.m2);
});
