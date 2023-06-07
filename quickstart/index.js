// connecting to websocket
const socket = new ReconnectingWebSocket("ws://127.0.0.1:24050/ws");


// handle on open/close/error
socket.onopen = () => console.log("Successfully Connected");

socket.onclose = event => {
  console.log("Socket Closed Connection: ", event);
  socket.send("Client Closed!");
};

socket.onerror = error => console.log("Socket Error: ", error);



// cache values here to prevent constant updating
const cache = {
  h100: 0,
  h50: 0,
  h0: 0,
  accuracy: 100.0,
};



// Smoouth numbers update
const accuracy = new CountUp('accuracy', 0, 0, 2, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h100 = new CountUp('h100', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h50 = new CountUp('h50', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h0 = new CountUp('h0', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const pp = new CountUp('pp', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })



// receive message update from websocket
socket.onmessage = event => {
  try {
    /**
     * DO NOT REMOVE IT IF YOU WANT AUTOCOMPLETE
     * @type {MyObject}
    */
    const data = JSON.parse(event.data);
    const menu = data.menu;
    const play = data.gameplay;
    const beatmap = data.menu.bm;



    // check if value has changed
    if (cache.h100 !== play.hits['100']) {
      // update cache
      cache.h100 = play.hits['100'];


      //      IMPORTANT   !!   USE ONE OF THEM

      // update html via countup
      h100.update(play.hits['100']);

      // update html via js
      document.getElementById('h100').innerHTML = play.hits['100'];
    };




    if (cache.h50 !== play.hits['50']) {
      cache.h50 = play.hits['50'];
      h50.update(play.hits['50']);
    };

    if (cache.h0 !== play.hits['0']) {
      cache.h0 = play.hits['0'];
      h0.update(play.hits['0']);
    };

    if (cache.accuracy !== play.accuracy) {
      cache.accuracy = play.accuracy;
      accuracy.update(play.accuracy);
    };

    if (cache.pp !== Math.round(play.pp.current)) {
      cache.pp = Math.round(play.pp.current);
      document.getElementById('pp').innerHTML = Math.round(play.pp.current);
    };
  } catch (err) {
    console.log(err);
  };
};











//     DO NOT REMOVE IT IF YOU WANT AUTOCOMPLETE
//     DO NOT REMOVE IT IF YOU WANT AUTOCOMPLETE
//     DO NOT REMOVE IT IF YOU WANT AUTOCOMPLETE

/**
 * @typedef {Object} Folders
 * @property {string} game - path to game folder
 * @property {string} skin - skin folder name
 * @property {string} songs - path to songs folder
 */

/**
 * @typedef {Object} Settings
 * @property {boolean} showInterface - Indicates if interface is shown
 * @property {Folders} folders - folders configuration
 */

/**
 * @typedef {Object} MainMenu
 * @property {number} bassDensity - bass density
 */

/**
 * @typedef {Object} Time
 * @property {number} firstObj - first object time
 * @property {number} current - current time
 * @property {number} full - full time
 * @property {number} mp3 - mp3 time
 */

/**
 * @typedef {Object} Metadata
 * @property {string} artist - artist name
 * @property {string} artistOriginal - original artist name
 * @property {string} title - song title
 * @property {string} titleOriginal - original song title
 * @property {string} mapper - mapper name
 * @property {string} difficulty - difficulty level
 */

/**
 * @typedef {Object} BPM
 * @property {number} min - minimum BPM
 * @property {number} max - maximum BPM
 */

/**
 * @typedef {Object} Stats
 * @property {number} AR - approach rate
 * @property {number} CS - circle size
 * @property {number} OD - overall difficulty
 * @property {number} HP - health points
 * @property {number} SR - star rating
 * @property {BPM} BPM - BPM information
 * @property {number} maxCombo - maximum combo
 * @property {number} fullSR - full star rating
 * @property {number} memoryAR - memory AR
 * @property {number} memoryCS - memory CS
 * @property {number} memoryOD - memory OD
 * @property {number} memoryHP - memory HP
 */

/**
 * @typedef {Object} Path
 * @property {string} full - full path
 * @property {string} folder - folder path
 * @property {string} file - file path
 * @property {string} bg - background path
 * @property {string} audio - audio path
 */

/**
 * @typedef {Object} BM
 * @property {Time} time - time information
 * @property {number} id - beatmap id
 * @property {number} set - set number
 * @property {string} md5 - MD5 hash
 * @property {number} rankedStatus - ranked status
 * @property {Metadata} metadata - metadata
 * @property {Stats} stats - stats
 * @property {Path} path - file paths
 */

/**
 * @typedef {Object} Mods
 * @property {number} num - mods id
 * @property {string} str - mods string
 */

/**
 * @typedef {Object} Strains
 * @property {string} name - strain name
 * @property {number[]} data - strain data
 */

/**
 * @typedef {Object} StrainsAll
 * @property {Strains[]} series - strain series
 * @property {number[]} xaxis - x-axis data
 */

/**
 * @typedef {Object} PP
 * @property {number} 95 - 95% PP
 * @property {number} 96 - 96% PP
 * @property {number} 97 - 97% PP
 * @property {number} 98 - 98% PP
 * @property {number} 99 - 99% PP
 * @property {number} 100 - 100% PP
 * @property {number[]} strains - strains
 * @property {StrainsAll} strainsAll - strains all
 */

/**
 * @typedef {Object} Menu
 * @property {MainMenu} mainMenu - main menu configuration
 * @property {number} state - osu state
 * @property {number} gameMode - selected game mode
 * @property {number} isChatEnabled - Indicates whether chat is shown
 * @property {BM} bm - beatmap metadata
 * @property {Mods} mods - mods information
 * @property {PP} pp - performance points data
 */

/**
 * @typedef {Object} Combo
 * @property {number} current - current combo
 * @property {number} max - maximum combo
 */

/**
 * @typedef {Object} HP
 * @property {number} normal - normal HP
 * @property {number} smooth - smooth HP
 */

/**
 * @typedef {Object} Grade
 * @property {string} current - current grade
 * @property {string} maxThisPlay - maximum grade achieved in the current play
 */

/**
 * @typedef {Object} HitError
 * @property {number} 0 - amount of misses
 * @property {number} 50 - amount of 50's
 * @property {number} 100 - amount of 100's
 * @property {number} 300 - amount of 300's
 * @property {number} geki - amount of geki's
 * @property {number} katu - amount of katu's
 * @property {number} sliderBreaks - amount of slider breaks
 * @property {Grade} grade - grade information
 * @property {number} unstableRate - unstable rate
 * @property {number[]} hitErrorArray - hit error array
 */

/**
 * @typedef {Object} KeyOverlay
 * @property {Object} k1 - k1 key overlay
 * @property {boolean} k1.isPressed - Indicates whether k1 key is pressed
 * @property {number} k1.count - count of k1 key presses
 * @property {Object} k2 - k2 key overlay
 * @property {boolean} k2.isPressed - Indicates whether k2 key is pressed
 * @property {number} k2.count - count of k2 key presses
 * @property {Object} m1 - m1 key overlay
 * @property {boolean} m1.isPressed - Indicates whether m1 key is pressed
 * @property {number} m1.count - count of m1 key presses
 * @property {Object} m2 - m2 key overlay
 * @property {boolean} m2.isPressed - Indicates whether m2 key is pressed
 * @property {number} m2.count - count of m2 key presses
 */

/**
 * @typedef {Object} Slot
 * @property {string} name - player name
 * @property {number} score - score
 * @property {number} combo - combo
 * @property {number} maxCombo - maximum combo
 * @property {string} mods - mods
 * @property {number} h300 - amount of 300
 * @property {number} h100 - amount of 100
 * @property {number} h50 - amount of 50
 * @property {number} h0 - amount of misses
 * @property {number} team - team number
 * @property {number} position - position
 * @property {number} isPassing - Indicates whether player is passing
 */

/**
 * @typedef {Object} Leaderboard
 * @property {boolean} hasLeaderboard - Indicates whether leaderboard is available
 * @property {boolean} isVisible - Indicates whether leaderboard is visible
 * @property {Object} ourplayer - information of our player
 * @property {string} ourplayer.name - player name
 * @property {number} ourplayer.score - score
 * @property {number} ourplayer.combo - combo
 * @property {number} ourplayer.maxCombo - maximum combo
 * @property {string} ourplayer.mods - mods
 * @property {number} ourplayer.h300 - amount of 300
 * @property {number} ourplayer.h100 - amount of 100
 * @property {number} ourplayer.h50 - amount of 50
 * @property {number} ourplayer.h0 - amount of misses
 * @property {number} ourplayer.team - team number
 * @property {number} ourplayer.position - position
 * @property {number} ourplayer.isPassing - Indicates whether player is passing
 * @property {Slot[]} slots - leaderboard slots
 */

/**
 * @typedef {Object} Gameplay
 * @property {number} gameMode - game mode
 * @property {string} name - game name
 * @property {number} score - score
 * @property {number} accuracy - accuracy
 * @property {Combo} combo - combo information
 * @property {HP} hp - HP information
 * @property {HitError} hits - hit error information
 * @property {Object} pp - PP information
 * @property {string} pp.current - current amount of pp
 * @property {number} pp.fc - pp if fc
 * @property {number} pp.maxThisPlay - peak pp
 * @property {KeyOverlay} keyOverlay - key overlay configuration
 * @property {Leaderboard} leaderboard - leaderboard information
 */

/**
 * @typedef {Object} ResultsScreen
 * @property {number} 0 - amount of misses
 * @property {number} 50 - amount of 50
 * @property {number} 100 - amount of 100
 * @property {number} 300 - amount of 300
 * @property {string} name - player name
 * @property {number} score - score
 * @property {number} maxCombo - maximum combo
 * @property {Mods} mods - mods configuration
 * @property {number} geki - geki hit count
 * @property {number} katu - katu hit count
 */

/**
 * @typedef {Object} MyObject
 * @property {Settings} settings - settings
 * @property {Menu} menu - menu data
 * @property {Gameplay} gameplay - gameplay information
 * @property {ResultsScreen} resultsScreen - results screen information
 */