import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager(window.location.host);

const socketManager = new WebSocketManager(window.location.host);
socketManager.createConnection('/ws', () => {});

const ws = socketManager.sockets['/ws'];
if (ws) {
    const events = {
        open: () => console.log('✅ Connected to /ws'),
        close: e => {
            const reason = e.reason || (e.code !== 1000 ? 'server abruptly closed' : 'none');
            console.log(`❌ Disconnected from /ws (reason: ${reason})`);
        },
        error: e => console.error('⚠️ WebSocket error:', e)
    };

    for (const [event, handler] of Object.entries(events)) {
        ws.addEventListener(event, handler);
    }
}

const cache = {
  pp: -1,
  ppFC: -1,
  ppRLT: -1,
  h100: -1,
  h50: -1,
  h0: -1,
};

const pp = new CountUp('current-pp', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
const ppfc = new CountUp('fc-pp', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
const h100 = new CountUp('great-hits', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
const h50 = new CountUp('good-hits', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
const h0 = new CountUp('miss-hits', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });

socket.api_v2(data => {
  try {

    // console.log('Données reçues du socket api v2 :', data); // debug

    //? Lenght
    const startLength = data.beatmap.time.firstObject || 'N/A';
    const endLength = data.beatmap.time.lastObject || 'N/A';
    const currentLength = data.beatmap.time.live || 'N/A';

    if (startLength != null && endLength != null && currentLength != null) {
      const totalLength = endLength - startLength;
      const passedLength = currentLength - startLength;

      const percentage = Math.max(0, Math.min(100, Math.ceil((passedLength / totalLength) * 100)));

      const progressBarFill = document.getElementById('progressBarFill');
      if (progressBarFill) {
        progressBarFill.style.width = percentage + '%';
      }
    }

    //? H100 (Ok)
    let h100Value = data.play.hits['100'] ?? 'N/A';
    if (cache.h100 !== h100Value) {
      cache.h100 = h100Value;
      h100.update(h100Value);
      //console.log('h100 updated :', h100Value); // debug
    }
    //? H50 (Meh)
    let h50Value = data.play.hits['50'] ?? 'N/A';
    if (cache.h50 !== h50Value) {
      cache.h50 = h50Value;
      h50.update(h50Value);
      //console.log('h50 updated :', h50Value) // debug
    }
    //? H0 (Miss)
    let h0Value = data.play.hits['0'] ?? 'N/A';
    if (cache.h0 !== h0Value) {
      cache.h0 = h0Value;
      h0.update(h0Value);
      //console.log('h0 updated :', h0Value); // debug
    }
    //? Current PPRLT (Live or FC depending on the state)
    const ppToShow = Math.round(data.state.number === 2 ? data.play.pp.current : data.play.pp.fc);
    if (cache.ppRLT !== ppToShow) {
      cache.ppRLT = ppToShow;
      document.getElementById('realtime-pp').innerText = ppToShow;
      //console.log('ppRLT updated :', ppToShow); // debug
    }
  } catch (error) {
    console.log('Error while processing data :', error);
  }
});