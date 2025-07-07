
import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager(window.location.host);


const cache = {
  h200: 0,
  h100: 0,
  h50: 0,
  h0: 0,
  pp: 0,
  ppfc: 0,
  pp95: 0,
};


function Pad(num) {
  if (Number.isInteger(num) && num != 0) {
    const str = num.toString().padStart(5, '0');
    const firstNonZero = str.search(/[^0]/);
    const zeros = firstNonZero > 0 ? str.slice(0, firstNonZero) : '';
    const rest = firstNonZero >= 0 ? str.slice(firstNonZero) : str;
    return `<span class="zero">${zeros}</span><span class="digit">${rest}</span>`;
  }
  else
  {
    return '<span class="zero">00000</span>' 
  }
    
  }


socket.api_v2((data) => {
  try {
    
    if (cache.h100 !== data.play.hits['100']) {
      
      cache.h100 = data.play.hits['100'];
      console.log(data.play.hits['100']);
      document.getElementById('h100').innerHTML = Pad(cache.h100)
    };

    if (cache.h200 !== data.play.hits['katu']) {
      
      cache.h200 = data.play.hits['katu'];
      document.getElementById('h200').innerHTML = Pad(cache.h200)
    };

    if (cache.h50 !== data.play.hits['50']) {
      cache.h50 = data.play.hits['50'];
      document.getElementById('h50').innerHTML = Pad(cache.h50)
    };

    if (cache.h0 !== data.play.hits['0']) {
      cache.h0 = data.play.hits['0'];
      document.getElementById('h0').innerHTML = Pad(cache.h0);
    };

    if (cache.pp !== Math.round(data.play.pp.current)) {
      cache.pp = Math.round(data.play.pp.current);
      document.getElementById('pp').innerHTML = Pad(cache.pp);
    };


    if (cache.ppfc !== Math.round(data.performance.accuracy['100'])) {
      cache.ppfc = Math.round(data.performance.accuracy['100']);
      
      document.getElementById('ppfc').innerHTML = Pad(cache.ppfc);
    };
    if (cache.pp95 !== Math.round(data.performance.accuracy['95'])) {
      cache.pp95 = Math.round(data.performance.accuracy['95']);
      
      document.getElementById('pp95').innerHTML = Pad(cache.pp95);
    };


    switch(data.state.number) {
      case 2:
        document.getElementById('gameplay').style.opacity = "1"
        document.getElementById('gameplay').style.left = "0"
        document.getElementById('song-select').style.opacity = "0"
        document.getElementById('song-select').style.left = "50%"
        break
      default:
        document.getElementById('gameplay').style.opacity = "0"
        document.getElementById('gameplay').style.left = "50%"
        document.getElementById('song-select').style.opacity = "1"
        document.getElementById('song-select').style.left = "0"
        break
    }

  } catch (error) {
    console.log(error);
  };
}, [
     {
       field: 'state',
       keys: ['number']
      },
      {
        field: 'play',
        keys: [
          {
            field: 'hits',
            keys: ['0', '50', '100', 'katu']
          },
          {
            field: 'pp',
            keys: ['current']
          }
        ]
      },
      {
        field: 'performance',
        keys: [
          {
            field: 'accuracy',
            keys: ['95', '100']
          }
        ]
      }
   ]);
   