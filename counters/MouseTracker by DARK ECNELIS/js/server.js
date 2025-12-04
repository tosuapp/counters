const WebSocket = require('ws');
const addon = require('./addon.node');

const wss = new WebSocket.Server({ port: 24051 });

wss.on('connection', ws => {
  // Envoie la taille de l'écran une seule fois à la connexion
  const screen = addon.getScreenSize(); // { width, height }
  ws.send(JSON.stringify({ type: 'screen', ...screen }));

  // Envoie la position du curseur régulièrement
  const interval = setInterval(() => {
    try {
      const pos = addon.getCursorPos(); // { x, y }
      ws.send(JSON.stringify({ type: 'pos', ...pos }));
    } catch (e) {
      console.error(e);
    }
  }, 5); // toutes les 5ms

  ws.on('close', () => clearInterval(interval));
});

console.log('Server running on ws://localhost:24051');
