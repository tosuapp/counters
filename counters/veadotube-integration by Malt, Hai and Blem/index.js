// Connecting to websocket
import WebSocketManager from './js/socket.js';
let veadoSocket;
let veadoReconnectTimer;


// Cache values here to prevent constant updating
const cache = {
  maxCombo: 0,
  combo: -1,
  baseBuban: 1000,
  mapLength: -1,
  stateChange: 0,
  veadoPort: 8085,
  minimumComboPercent: 33,
  defaultState: "BLEM",
  shockedState: "BUBAN",
  celebrationState: "BLEM-PRIME"
};

const socket = new WebSocketManager('127.0.0.1:24050');
socket.onopen = onSocketOpen();

function connectVeadoSocket() {
  // When changing the port, close the previous connection if it exists
  if (veadoSocket && veadoSocket.readyState === WebSocket.OPEN) {
    veadoSocket.close();
  }
  
  clearTimeout(veadoReconnectTimer);

  // Connect to VeadoTube WebSocket
  // default display name given since veadotube rejects unnamed client requests
  veadoSocket = new WebSocket(`ws://127.0.0.1:${cache.veadoPort}/?n=tosu`);

  veadoSocket.onopen = () => {
    setDisplayContainer('veadoStatusText', 'Connected to VeadoTube WebSocket on port ' + cache.veadoPort);
  }
  veadoSocket.onerror = (error) => {
    console.error('WebSocket error:', error);
  }
  veadoSocket.onclose = () => {
    setDisplayContainer('veadoStatusText', 'VeadoTube WebSocket connection closed, attempting to reconnect...');;
    // Attempt to reconnect after a three second delay.
    veadoReconnectTimer = setTimeout(connectVeadoSocket, 3000);
  }
}


function bubanMoment(combo_percent) {
  if (combo_percent < (cache.minimumComboPercent/100)) {
    return;
  }
  let bubanTime = 10**((3 * combo_percent - 1) / 2) * cache.baseBuban;
  
  //scale bubanMoment by map length
  //TODO add setting for preferred map length, currently 3 minutes
  bubanTime = bubanTime * cache.mapLength/180000;

  // Send buban payload
  const bubanPayload = createSetPayLoad(cache.shockedState);
  veadoSocket.send("nodes: " + JSON.stringify(bubanPayload));

  // Restore BLEM state after bubanTime
  setTimeout(() => {
    restoreBlem();
  }, bubanTime);

}

function blemMoment() {
  //scale blemPrime
  //TODO mirror map length custom value here
  let blemPrime = 10000*cache.mapLength/180000

  // Send prime payload
  const primePayload = createSetPayLoad(cache.celebrationState);
  veadoSocket.send("nodes: " + JSON.stringify(primePayload));

  // Restore BLEM state after bubanTime
  setTimeout(() => {
    restoreBlem();
  }, blemPrime);
}


function restoreBlem() {
  const blemPayload = createSetPayLoad(cache.defaultState);
  veadoSocket.send("nodes: " + JSON.stringify(blemPayload));
}

// Payload blueprint for VeadoTube for changing state
function createSetPayLoad(state) {
  return {
    "event": "payload",
    "type": "stateEvents",
    "id": "mini",
    "payload": {
        "event": "set",
        "state": state
    }
  }
}

//
function setDisplayContainer(containerId, message) {
    let displayContainer = document.getElementById(containerId);
    displayContainer.innerHTML = message;
}

function onSocketOpen() {
  // Initial connection to VaedoSocket
  connectVeadoSocket();
  socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
  socket.commands(async (data) => {
      try {
          const { command, message } = data;
          if (command != 'getSettings') return;
          if (message['baseBuban'] != null) {
              cache['baseBuban'] = message['baseBuban'];
          }
          if (message['veadoPort'] != null && message['veadoPort'] != cache['veadoPort']) {
              cache['veadoPort'] = message['veadoPort'];
              connectVeadoSocket();
          }
          if (message['minimumComboPercent'] != null) {
              cache['minimumComboPercent'] = message['minimumComboPercent'];
          }
		  if (message['defaultState'] != null) {
              cache['defaultState'] = message['defaultState'];
          }
		  if (message['shockedState'] != null) {
              cache['shockedState'] = message['shockedState'];
          }
		  if (message['celebrationState'] != null) {
              cache['celebrationState'] = message['celebrationState'];
          }
      } catch (error) {
          console.log(error);
      };
  });
}

// receive message update from websocket
socket.api_v2(({ play, beatmap }) => {
  
  try {
	if (beatmap.time.live <= 0) {cache.stateChange = 0}
    if (cache.combo !== play.combo) {
      if (play.combo.current < cache.combo.current) {
		if (play.hits[0] || play.hits.sliderBreaks) {
		  let brokenComboRatio = cache.combo.current / cache.maxCombo;
		  bubanMoment(brokenComboRatio);
		}
	  }

      cache.combo = play.combo;
	  if (beatmap.time.live >= beatmap.time.lastObject) {
		let reverseChokeRatio = cache.combo.current / cache.maxCombo;
		if (reverseChokeRatio > 0.85 && !cache.stateChange) {
			if (play.hits[0] || play.hits.sliderBreaks) {
				bubanMoment(reverseChokeRatio)
				cache.stateChange = 1;
			}
		}
		if (!play.hits[0] && !play.hits.sliderBreaks && play.combo.max && !cache.stateChange) {
				blemMoment();
				cache.stateChange = 1;
		}
	  }
    }

    if (cache.maxCombo != beatmap.stats.maxCombo) {
      cache.maxCombo = beatmap.stats.maxCombo;
	  cache.mapLength = beatmap.time.lastObject - beatmap.time.firstObject;
	  cache.stateChange = 0;
    }
  } catch (error) {
    console.log(error);
  };
});