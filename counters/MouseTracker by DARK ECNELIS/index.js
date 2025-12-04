// connecting to websocket
import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager("127.0.0.1:24050");

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));

// Listen to command updates
socket.commands((data) => {
  try {
    const { command, message } = data;
    // get updates for "getSettings" command
    if (command == 'getSettings') {
      console.log(command, message); // print out settings for debug
    };

    
  } catch (error) {
    console.log(error);
  };
});

const ws = new WebSocket("ws://127.0.0.1:24051");

ws.onopen = () => console.log('Connected to mouse server');

let screenWidth = 1000, screenHeight = 800;
const container = document.getElementById("overlay");
const cursor = document.getElementById("cursor");
const trail = document.getElementById("trail");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'screen') {
    // reçoit une seule fois la taille de l'écran
    screenWidth = data.width;
    screenHeight = data.height;
    console.log('Screen size:', screenWidth, screenHeight);
  }

  if (data.type === 'pos' && screenWidth && screenHeight) {
    // coordonnées proportionnelles à la taille du container
    const x = (data.x / screenWidth) * container.clientWidth;
    const y = (data.y / screenHeight) * container.clientHeight;

    cursor.style.transform = `translate(${x - 10}px, ${y - 10}px)`;
    
    setTimeout(() => {
      trail.style.transform = `translate(${x - 10}px, ${y - 10}px)`;
    }, 100);
  }
};

ws.onerror = (err) => console.error(err);
ws.onclose = () => console.log('Disconnected from mouse server');