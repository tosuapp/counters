import WebSocketManager from './socket.js';

const socket = new WebSocketManager('127.0.0.1:24050');

const cache = {};

let Key1Cont = document.getElementById('Key1Cont');
let Key2Cont = document.getElementById('Key2Cont');
let Mouse1Cont = document.getElementById('Mouse1Cont');
let Mouse2Cont = document.getElementById('Mouse2Cont');
let k1 = new KeyOverlay('k1', 'k1Tiles', { speed: 0.2, keyTextId: "k1Text", keyNameId: "key1"}),
    k2 = new KeyOverlay('k2', 'k2Tiles', { speed: 0.2, keyTextId: "k2Text", keyNameId: "key2"}),
    m1 = new KeyOverlay('m1', 'm1Tiles', { speed: 0.2, keyTextId: "m1Text", keyNameId: "key3"}),
    m2 = new KeyOverlay('m2', 'm2Tiles', { speed: 0.2, keyTextId: "m2Text", keyNameId: "key4"});

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
      const { command, message } = data;

      if (command == 'getSettings') {
        console.log(command, message);
      };

      if (message['KeyPressColor'] != null) {
        document.body.style.setProperty('--keyColor', message['KeyPressColor']);
      };
      if (message['KeyIsPressedColor'] != null) {
        document.body.style.setProperty('--keyTap', message['KeyIsPressedColor']);
      };
      if (message['TextColor'] != null) {
        document.body.style.setProperty('--textColor', message['TextColor']);
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

    k1.update(data.keys.k1, "var(--keyColor)", "var(--keyTap)")
    k2.update(data.keys.k2, "var(--keyColor)", "var(--keyTap)")
    m1.update(data.keys.m1, "var(--keyColor)", "var(--keyTap)")
    m2.update(data.keys.m2, "var(--keyColor)", "var(--keyTap)")
});
