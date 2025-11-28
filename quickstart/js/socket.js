class WebSocketManager {
  constructor(host) {
    this.version = '0.2.0';

    if (host) {
      this.host = host;
    }

    this.createConnection = this.createConnection.bind(this);

    /**
     * @type {{ [key: string]: WebSocket }} asd;
     */
    this.sockets = {};
  }

  createConnection(url, callback, filters, apiVersion) {
    let INTERVAL = '';

    apiVersion = Number(String(apiVersion).trim() || 1);
    if (!Number.isFinite(apiVersion)) apiVersion = 1;
    apiVersion = Math.max(1, Math.trunc(apiVersion));

    const that = this;
    this.sockets[url] = new WebSocket(`ws://${this.host}${url}?l=${encodeURI(window.COUNTER_PATH)}&v=${apiVersion}`);

    this.sockets[url].onopen = () => {
      console.log(`[OPEN] ${url}: Connected ${apiVersion > 1 ? `(using version ${apiVersion} of the API)` : ''}`);

      if (INTERVAL) clearInterval(INTERVAL);
      if (Array.isArray(filters)) {
        this.sockets[url].send(`applyFilters:${JSON.stringify(filters)}`);
      }
    };

    this.sockets[url].onclose = (event) => {
      console.log(`[CLOSED] ${url}: ${event.reason}`);

      delete this.sockets[url];
      INTERVAL = setTimeout(() => {
        that.createConnection(url, callback, filters, apiVersion);
      }, 1000);
    };

    this.sockets[url].onerror = (event) => {
      console.log(`[ERROR] ${url}: ${event.reason}`);
    };


    this.sockets[url].onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error != null) {
          console.error(`[MESSAGE_ERROR] ${url}:`, data.error);
          return;
        };

        if (data.message != null) {
          if (data.message.error != null) {
            console.error(`[MESSAGE_ERROR] ${url}:`, data.message.error);
            return;
          }
        };

        callback(data);
      } catch (error) {
        console.log(`[MESSAGE_ERROR] ${url}: Couldn't parse incomming message`, error);
      };
    };
  };


  /**
   * Connects to the gosu-compatible WebSocket API
   * @param {(data: WEBSOCKET_V1) => void} callback The function to handle received data
   * @param {Filters[]} filters What data should be sent through the WebSocket
   */
  api_v1(callback, filters) {
    this.createConnection(`/ws`, callback, filters);
  };


  /**
   * Connects to tosu's WebSocket API
   * @param {(data: WEBSOCKET_V2) => void} callback The function to handle received data
   * @param {Filters[]} filters What data should be sent through the WebSocket
   * @param {number} [apiVersion] The version of the API to be used. Defaults to `1`
   */
  api_v2(callback, filters, apiVersion) {
    this.createConnection(`/websocket/v2`, callback, filters, apiVersion);
  };


  /**
   * Connects to tosu's WebSocket API with data that need to be updated more often
   * @param {(data: WEBSOCKET_V2_PRECISE) => void} callback The function to handle received data
   * @param {Filters[]} filters What data should be sent through the WebSocket
   * @param {number} [apiVersion] The version of the API to be used. Defaults to `1`
   */
  api_v2_precise(callback, filters, apiVersion) {
    this.createConnection(`/websocket/v2/precise`, callback, filters, apiVersion);
  };


  /**
   * Calculates pp with custom data for either the currently selected map, or a specified one
   * @param {CALCULATE_PP} params Data used to calculate pp
   * @returns {Promise<CALCULATE_PP_RESPONSE | { error: string }>} Calculated information about the map, or an error
   */
  async calculate_pp(params) {
    try {
      if (typeof params != 'object') {
        return {
          error: 'Wrong argument type, should be object with params'
        };
      };


      const url = new URL(`http://${this.host}/api/calculate/pp`);
      Object.keys(params)
        .forEach(key => url.searchParams.append(key, params[key]));

      const request = await fetch(url, { method: "GET", });


      const json = await request.json();
      return json;
    } catch (error) {
      console.error(error);

      return {
        error: error.message,
      };
    };
  };


  /**
   * Gets the contents of the local beatmap's `.osu` file
   * @param {string} file_path Path to the file. Format: `beatmap_folder_name/osu_file_name.osu`
   * @returns {string | { error: string }} The beatmap's file contents, or an error
   */
  async getBeatmapOsuFile(file_path) {
    try {
      const request = await fetch(`http://${this.host}/files/beatmap/${file_path}`, {
        method: "GET",
      });


      const text = await request.text();
      return text;
    } catch (error) {
      console.error(error);

      return {
        error: error.message,
      };
    };
  };


  /**
   * Listens for answers to commands sent to tosu. Primarly used to react to a user changing the overlay's settings
   * @param {(data: { command: 'getSettings', message: any }) => void} callback The function to handle received data
   */
  commands(callback) {
    this.createConnection(`/websocket/commands`, callback);
  };

  /**
   * Sends a command to tosu. Primarly used to retrieve user's overlay settings
   * @param {'getSettings'} command The command to be sent
   * @param {string | Object} param The parameter to be used to execute the command. In most cases, it's the overlay's name (`encodeURI(window.COUNTER_PATH)`)
   */
  sendCommand(command, param, amountOfRetries = 1) {
    const that = this;


    if (!this.sockets['/websocket/commands']) {
      setTimeout(() => {
        that.sendCommand(command, param, amountOfRetries + 1);
      }, 100);

      return;
    };


    try {
      const payload = typeof param == 'object' ? JSON.stringify(param) : param;
      this.sockets['/websocket/commands'].send(`${command}:${payload}`);
    } catch (error) {
      if (amountOfRetries <= 3) {
        console.log(`[COMMAND_ERROR] Attempt ${amountOfRetries}`, error);
        setTimeout(() => {
          that.sendCommand(command, param, amountOfRetries + 1);
        }, 1000);
        return;
      };


      console.error(`[COMMAND_ERROR]`, error);
    };
  };


  close(url) {
    this.host = url;

    const array = Object.keys(this.sockets);
    for (let i = 0; i < array.length; i++) {
      const key = array[i];
      const value = this.sockets[key];

      if (!value) continue;
      value.close();
    };
  };
};


export default WebSocketManager;



/**
 * @typedef {string | { field: string; keys: Filters[] }} Filters
 */


/** @typedef {object} CALCULATE_PP
 * @property {string} path Path to the `.osu` file, e.g. `C:\\osu\\Songs\\some_beatmapset\\some_beatmap.osu`
 * @property {0 | 1 | 2 | 3} mode Override the beatmap's ruleset:
 *                                - `0` - osu!
 *                                - `1` - osu!taiko
 *                                - `2` - osu!catch
 *                                - `3` - osu!mania
 * @property {number} ar Override the beatmap's Approach Rate. Only used in osu! and osu!catch
 * @property {number} cs Override the beatmap's Circle Size. Only used in osu! and osu!catch
 * @property {number} hp Override the beatmap's Health Drain
 * @property {number} od Override the beatmap's Overall Difficulty
 * @property {number} clockRate The speed of the map used for the calculation. If omitted, it will calculate the speed based on the mods
 * @property {number} passedObjects The amount of passed objects for partial plays, e.g. a fail
 * @property {number} combo The max combo used for the calculation. Unused in osu!mania
 * @property {number} nMisses The amount of misses used for the calculation
 * @property {number} n100 The amount of 100s used for the calculation
 * @property {number} n300 The amount of 300s used for the calculation
 * @property {number} n50 The amount of 50s used for the calculation. Unused in osu!taiko
 * @property {number} nGeki The amount of gekis used for the calculation. Only used in osu!mania as the amount of `n320`
 * @property {number} nKatu The amount of katus used for the calculation. Only used in osu!mania as the amount of `n200`
 * @property {number} mods The mods' enum value used for the calculation. Examples:
 *                         - `8` - HD
 *                         - `64` - DT
 *                         - `72` - HDDT
 *                         See https://github.com/ppy/osu-api/wiki#mods
 * @property {number} acc The accuracy used for the calculation
 * @property {number} sliderEndHits The amount of slider end hits used for the calculation. Only used in the osu! ruleset in osu!(lazer)
 * @property {number} smallTickHits The amount of "small tick" hits. These are essentially the slider end hits for osu!(lazer) scores without slider accuracy. Only used in the osu! ruleset
 * @property {number} largeTickHits The amount of "large tick" hits. The meaning depends on the kind of score:
 *                                  - if set on osu!(stable), this value is irrelevant and can be `0`
 *                                  - if set on osu!(lazer) *without* `CL`, this value is the amount of hit slider ticks and repeats
 *                                  - if set on osu!(lazer) *with* `CL`, this value is the amount of hit slider heads, ticks, and repeats
 */



/** @typedef {object} CALCULATE_PP_RESPONSE
 * @property {object} difficulty The difficulty attributes
 * @property {0 | 1 | 2 | 3} difficulty.mode The ruleset used for the calculation:
 *                                           - `0` - osu!
 *                                           - `1` - osu!taiko
 *                                           - `2` - osu!catch
 *                                           - `3` - osu!mania
 * @property {number} difficulty.stars The final star rating
 * @property {boolean} difficulty.isConvert Whether the map is a convert
 * @property {number} [difficulty.aim] The difficulty of the aim skill. Only available for the osu! ruleset
 * @property {number} [difficulty.aimDifficultSliderCount] The amount of sliders weighted by difficulty. Only available for the osu! ruleset
 * @property {number} [difficulty.speed] The difficulty of the speed skill. Only available for the osu! ruleset
 * @property {number} [difficulty.flashlight] The difficulty of the flashlight skill. Only available for the osu! ruleset
 * @property {number} [difficulty.sliderFactor] The ratio of the aim strain with and without considering sliders. Only available for the osu! ruleset
 * @property {number} [difficulty.speedNoteCount] The amount of clickable objects weighted by difficulty. Only available for the osu! ruleset
 * @property {number} [difficulty.aimDifficultStrainCount] Weighted sum of aim strains. Only available for the osu! ruleset
 * @property {number} [difficulty.speedDifficultStrainCount] Weighted sum of speed strains. Only available for the osu! ruleset
 * @property {number} [difficulty.hp] The health drain rate.  Only available for the osu! ruleset
 * @property {number} [difficulty.nCircles] The amount of circles. Only available for the osu! ruleset
 * @property {number} [difficulty.nSliders] The amount of sliders. Only available for the osu! ruleset
 * @property {number} [difficulty.nLargeTicks] The amount of "large tick" hits. Only available for the osu! ruleset. The meaning depends on the kind of score:
 *                                             - if set on osu!(stable), this value is irrelevant
 *                                             - if set on osu!(lazer) *with* slider accuracy, this value is the amount of hit slider ticks and repeats
 *                                             - if set on osu!(lazer) *without* slider accuracy, this value is the amount of hit slider heads, ticks, and repeats
 * @property {number} [difficulty.nSpinners] The amount of spinners. Only available for the osu! ruleset
 * @property {number} [difficulty.stamina] The difficulty of the stamina skill. Only available for the osu!taiko ruleset
 * @property {number} [difficulty.rhythm] The difficulty of the rhythm skill. Only available for the osu!taiko ruleset
 * @property {number} [difficulty.color] The difficulty of the color skill. Only available for the osu!taiko ruleset
 * @property {number} [difficulty.reading] The difficulty of the reading skill. Only available for the osu!taiko ruleset
 * @property {number} [difficulty.nFruits] The amount of fruits. Only available for the osu!catch ruleset
 * @property {number} [difficulty.nDroplets] The amount of droplets. Only available for the osu!catch ruleset
 * @property {number} [difficulty.nTinyDroplets] The amount of tiny droplets. Only available for the osu!catch ruleset
 * @property {number} [difficulty.nObjects] The amount of hitobjects in the beatmap. Only available for the osu!mania ruleset
 * @property {number} [difficulty.nHoldNotes] The amount of hold notes in the beatmap. Only available for the osu!mania ruleset
 * @property {number} [difficulty.ar] The Approach Rate. Only available for the osu! and osu!catch rulesets
 * @property {number} [difficulty.od] The Overall Difficulty. Only available for the osu! ruleset
 * @property {number} [difficulty.greatHitWindow] The hit window for the hit300s AFTER rate adjustments. Only available for the osu! and osu!taiko rulesets
 * @property {number} [difficulty.okHitWindow] The hit window for the hit100s AFTER rate adjustments. Only available for the osu! and osu!taiko rulesets
 * @property {number} [difficulty.mehHitWindow] The hit window for the hit50s AFTER rate adjustments. Only available for the osu! ruleset
 * @property {number} [difficulty.monoStaminaFactor] The ratio of stamina difficulty from mono-color (single color) streams to total stamina difficulty. Only available for the osu!taiko ruleset
 * @property {number} difficulty.maxCombo The maximum combo
 * @property {object} state The hitresults count that was used for the calculation
 * @property {number} state.maxCombo The maximum combo that the score had so far. Note that:
 *                                   - This is always `0` in osu!mania
 *                                   - In osu!catch, only fruits and droplets contribute towards combo
 * @property {number} state.osuLargeTickHits The amount of "large tick" hits. The meaning depends on the kind of score:
 *                                           - if set on osu!(stable), this value is irrelevant and can be `0`
 *                                           - if set on osu!(lazer) *without* `CL`, this value is the amount of hit slider ticks and repeats
 *                                           - if set on osu!(lazer) *with* `CL`, this value is the amount of hit slider heads, ticks, and repeats
 * @property {number} state.smallTickHits The amount of "small tick" hits. These are essentially the slider end hits for osu!(lazer) scores without slider accuracy. Populated only in the osu! ruleset
 * @property {number} state.osuSliderEndHits The amount of slider end hits used for the calculation. Populated only in the osu! ruleset in osu!(lazer)
 * @property {number} state.nGeki The amount of gekis. Used as `n320` in osu!mania
 * @property {number} state.nKatu The amount of katus. Used as `n200` in osu!mania
 * @property {number} state.n300 The amount of 300s. Used as `nFruits` in osu!catch
 * @property {number} state.n100 The amount of 100s. Used as `nDroplets` in osu!catch
 * @property {number} state.n50 The amount of 50s. Used as `nTinyDroplets` in osu!catch
 * @property {number} state.misses  The amount of misses. Used as `nFruits + nDroplets` in osu!catch
 * @property {number} pp The final pp value
 * @property {number} [ppAim] The aim portion of the final pp. Only available for the osu! ruleset
 * @property {number} [ppFlashlight] The flashlight portion of the final pp. Only available for the osu! ruleset
 * @property {number} [ppSpeed] The spped portion of the final pp. Only available for the osu! ruleset
 * @property {number} [ppAccuracy] The accuracy portion of the final pp. Only available for the osu! and osu!taiko rulesets
 * @property {number} [effectiveMissCount] Scaled miss count based on total hits. Only available for the osu! and osu!taiko rulesets
 * @property {number} [estimatedUnstableRate] The upper bound of the player's unstable rate. Only available for the osu!taiko ruleset
 * @property {number} [speedDeviation] The approximated unstable rate. Only available for the osu! ruleset
 * @property {number} [ppDifficulty] The strain portion of the final pp. Only available for the osu!taiko and osu!mania rulesets
 */



/** @typedef {object} WEBSOCKET_V1
 * @property {'stable' | 'lazer'} client
 * @property {object} settings
 * @property {boolean} settings.showInterface
 * @property {object} settings.folders
 * @property {string} settings.folders.game
 * @property {string} settings.folders.skin
 * @property {string} settings.folders.songs
 * @property {object} menu
 * @property {object} menu.mainMenu
 * @property {number} menu.mainMenu.bassDensity
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23} menu.state
 * @property {0 | 1 | 2 | 3} menu.gameMode
 * @property {0 | 1} menu.isChatEnabled
 * @property {object} menu.bm
 * @property {object} menu.bm.time
 * @property {number} menu.bm.time.firstObj
 * @property {number} menu.bm.time.current
 * @property {number} menu.bm.time.full
 * @property {number} menu.bm.time.mp3
 * @property {number} menu.bm.id
 * @property {number} menu.bm.set
 * @property {string} menu.bm.md5
 * @property {0 | 1 | 2 | 4 | 5 | 6 | 7} menu.bm.rankedStatus
 * @property {object} menu.bm.metadata
 * @property {string} menu.bm.metadata.artist
 * @property {string} menu.bm.metadata.artistOriginal
 * @property {string} menu.bm.metadata.title
 * @property {string} menu.bm.metadata.titleOriginal
 * @property {string} menu.bm.metadata.mapper
 * @property {string} menu.bm.metadata.difficulty
 * @property {object} menu.bm.stats
 * @property {number} menu.bm.stats.AR
 * @property {number} menu.bm.stats.CS
 * @property {number} menu.bm.stats.OD
 * @property {number} menu.bm.stats.HP
 * @property {number} menu.bm.stats.SR
 * @property {object} menu.bm.stats.BPM
 * @property {number} menu.bm.stats.BPM.realtime
 * @property {number} menu.bm.stats.BPM.common
 * @property {number} menu.bm.stats.BPM.min
 * @property {number} menu.bm.stats.BPM.max
 * @property {number} menu.bm.stats.circles
 * @property {number} menu.bm.stats.sliders
 * @property {number} menu.bm.stats.spinners
 * @property {number} menu.bm.stats.holds
 * @property {number} menu.bm.stats.maxCombo
 * @property {number} menu.bm.stats.fullSR
 * @property {number} menu.bm.stats.memoryAR
 * @property {number} menu.bm.stats.memoryCS
 * @property {number} menu.bm.stats.memoryOD
 * @property {number} menu.bm.stats.memoryHP
 * @property {object} menu.bm.path
 * @property {string} menu.bm.path.full
 * @property {string} menu.bm.path.folder
 * @property {string} menu.bm.path.file
 * @property {string} menu.bm.path.bg
 * @property {string} menu.bm.path.audio
 * @property {object} menu.mods
 * @property {number} menu.mods.num
 * @property {string} menu.mods.str
 * @property {object} menu.pp
 * @property {number} menu.pp.90
 * @property {number} menu.pp.91
 * @property {number} menu.pp.92
 * @property {number} menu.pp.93
 * @property {number} menu.pp.94
 * @property {number} menu.pp.95
 * @property {number} menu.pp.96
 * @property {number} menu.pp.97
 * @property {number} menu.pp.98
 * @property {number} menu.pp.99
 * @property {number} menu.pp.100
 * @property {number[]} menu.pp.strains
 * @property {object} menu.pp.strainsAll
 * @property {object[]} menu.pp.strainsAll.series
 * @property {'aim' | 'aimNoSliders' | 'flashlight' | 'speed' | 'color' | 'rhythm' | 'stamina' | 'movement' | 'strains'} menu.pp.strainsAll.series.name
 * @property {number[]} menu.pp.strainsAll.series.data
 * @property {number[]} menu.pp.strainsAll.xaxis
 * @property {object} gameplay
 * @property {0 | 1 | 2 | 3} gameplay.gameMode
 * @property {string} gameplay.name
 * @property {number} gameplay.score
 * @property {number} gameplay.accuracy
 * @property {object} gameplay.combo
 * @property {number} gameplay.combo.current
 * @property {number} gameplay.combo.max
 * @property {object} gameplay.hp
 * @property {number} gameplay.hp.normal
 * @property {number} gameplay.hp.smooth
 * @property {object} gameplay.hits
 * @property {number} gameplay.hits.0
 * @property {number} gameplay.hits.50
 * @property {number} gameplay.hits.100
 * @property {number} gameplay.hits.300
 * @property {number} gameplay.hits.geki This is also used as the 320's count in the osu!mania ruleset
 * @property {number} gameplay.hits.katu This is also used as the 200's count in the osu!mania ruleset
 * @property {number} gameplay.hits.sliderBreaks
 * @property {object} gameplay.hits.grade
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} gameplay.hits.grade.current
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} gameplay.hits.grade.maxThisPlay
 * @property {number} gameplay.hits.unstableRate
 * @property {number[]} gameplay.hits.hitErrorArray
 * @property {object} gameplay.pp
 * @property {number} gameplay.pp.current
 * @property {number} gameplay.pp.fc
 * @property {number} gameplay.pp.maxThisPlay
 * @property {object} gameplay.keyOverlay
 * @property {object} gameplay.keyOverlay.k1
 * @property {boolean} gameplay.keyOverlay.k1.isPressed
 * @property {number} gameplay.keyOverlay.k1.count
 * @property {object} gameplay.keyOverlay.k2
 * @property {boolean} gameplay.keyOverlay.k2.isPressed
 * @property {number} gameplay.keyOverlay.k2.count
 * @property {object} gameplay.keyOverlay.m1
 * @property {boolean} gameplay.keyOverlay.m1.isPressed
 * @property {number} gameplay.keyOverlay.m1.count
 * @property {object} gameplay.keyOverlay.m2
 * @property {boolean} gameplay.keyOverlay.m2.isPressed
 * @property {number} gameplay.keyOverlay.m2.count
 * @property {object} gameplay.leaderboard
 * @property {boolean} gameplay.leaderboard.hasLeaderboard
 * @property {boolean} gameplay.leaderboard.isVisible
 * @property {object} gameplay.leaderboard.ourplayer
 * @property {string} gameplay.leaderboard.ourplayer.name
 * @property {number} gameplay.leaderboard.ourplayer.score
 * @property {number} gameplay.leaderboard.ourplayer.combo
 * @property {number} gameplay.leaderboard.ourplayer.maxCombo
 * @property {string} gameplay.leaderboard.ourplayer.mods
 * @property {number} gameplay.leaderboard.ourplayer.h300
 * @property {number} gameplay.leaderboard.ourplayer.h100
 * @property {number} gameplay.leaderboard.ourplayer.h50
 * @property {number} gameplay.leaderboard.ourplayer.h0
 * @property {1 | 2} gameplay.leaderboard.ourplayer.team
 * @property {number} gameplay.leaderboard.ourplayer.position
 * @property {0 | 1} gameplay.leaderboard.ourplayer.isPassing
 * @property {object[]} gameplay.leaderboard.slots
 * @property {string} gameplay.leaderboard.slots.name
 * @property {number} gameplay.leaderboard.slots.score
 * @property {number} gameplay.leaderboard.slots.combo
 * @property {number} gameplay.leaderboard.slots.maxCombo
 * @property {string} gameplay.leaderboard.slots.mods
 * @property {number} gameplay.leaderboard.slots.h300
 * @property {number} gameplay.leaderboard.slots.h100
 * @property {number} gameplay.leaderboard.slots.h50
 * @property {number} gameplay.leaderboard.slots.h0
 * @property {1 | 2} gameplay.leaderboard.slots.team
 * @property {number} gameplay.leaderboard.slots.position
 * @property {0 | 1} gameplay.leaderboard.slots.isPassing
 * @property {boolean} gameplay._isReplayUiHidden
 * @property {object} resultsScreen
 * @property {number} resultsScreen.0
 * @property {number} resultsScreen.50
 * @property {number} resultsScreen.100
 * @property {number} resultsScreen.300
 * @property {0 | 1 | 2 | 3} resultsScreen.mode
 * @property {string} resultsScreen.name
 * @property {number} resultsScreen.score
 * @property {number} resultsScreen.accuracy
 * @property {number} resultsScreen.maxCombo
 * @property {object} resultsScreen.mods
 * @property {number} resultsScreen.mods.num
 * @property {string} resultsScreen.mods.str
 * @property {number} resultsScreen.geki This is also used as the 320's count in the osu!mania ruleset
 * @property {number} resultsScreen.katu This is also used as the 200's count in the osu!mania ruleset
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} resultsScreen.grade
 * @property {string} resultsScreen.createdAt
 * @property {object} userProfile
 * @property {0 | 256 | 257 | 65537 | 65793} userProfile.rawLoginStatus
 * @property {string} userProfile.name
 * @property {number} userProfile.accuracy
 * @property {number} userProfile.rankedScore
 * @property {number} userProfile.id
 * @property {number} userProfile.level
 * @property {number} userProfile.playCount
 * @property {0 | 1 | 2 | 3} userProfile.playMode
 * @property {number} userProfile.rank
 * @property {number} userProfile.countryCode
 * @property {number} userProfile.performancePoints
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} userProfile.rawBanchoStatus
 * @property {string} userProfile.backgroundColour
 * @property {object} tourney
 * @property {object} tourney.manager
 * @property {0 | 1 | 2 | 3 | 4} tourney.manager.ipcState - `0` - Initialising
 *                                                        - `1` - Idle
 *                                                        - `2` - Waiting for clients
 *                                                        - `3` - Playing
 *                                                        - `4` - Ranking
 * @property {number} tourney.manager.bestOF
 * @property {object} tourney.manager.teamName
 * @property {string} tourney.manager.teamName.left
 * @property {string} tourney.manager.teamName.right
 * @property {object} tourney.manager.stars
 * @property {number} tourney.manager.stars.left
 * @property {number} tourney.manager.stars.right
 * @property {object} tourney.manager.bools
 * @property {boolean} tourney.manager.bools.scoreVisible
 * @property {boolean} tourney.manager.bools.starsVisible
 * @property {object[]} tourney.manager.chat
 * @property {'left' | 'right' | 'BanchoBot' | 'unknown'} tourney.manager.chat.team
 * @property {string} tourney.manager.chat.time
 * @property {string} tourney.manager.chat.name
 * @property {string} tourney.manager.chat.messageBody
 * @property {object} tourney.manager.gameplay
 * @property {object} tourney.manager.gameplay.score
 * @property {number} tourney.manager.gameplay.score.left
 * @property {number} tourney.manager.gameplay.score.right
 * @property {object[]} tourney.ipcClients
 * @property {'left' | 'right'} tourney.ipcClients.team
 * @property {object} tourney.ipcClients.spectating
 * @property {string} tourney.ipcClients.spectating.name
 * @property {string} tourney.ipcClients.spectating.country
 * @property {number} tourney.ipcClients.spectating.userID
 * @property {number} tourney.ipcClients.spectating.accuracy
 * @property {number} tourney.ipcClients.spectating.rankedScore
 * @property {number} tourney.ipcClients.spectating.playCount
 * @property {number} tourney.ipcClients.spectating.globalRank
 * @property {number} tourney.ipcClients.spectating.totalPP
 * @property {object} tourney.ipcClients.gameplay
 * @property {0 | 1 | 2 | 3} tourney.ipcClients.gameplay.gameMode
 * @property {string} tourney.ipcClients.gameplay.name
 * @property {number} tourney.ipcClients.gameplay.score
 * @property {number} tourney.ipcClients.gameplay.accuracy
 * @property {object} tourney.ipcClients.gameplay.combo
 * @property {number} tourney.ipcClients.gameplay.combo.current
 * @property {number} tourney.ipcClients.gameplay.combo.max
 * @property {object} tourney.ipcClients.gameplay.hp
 * @property {number} tourney.ipcClients.gameplay.hp.normal
 * @property {number} tourney.ipcClients.gameplay.hp.smooth
 * @property {object} tourney.ipcClients.gameplay.hits
 * @property {number} tourney.ipcClients.gameplay.hits.0
 * @property {number} tourney.ipcClients.gameplay.hits.50
 * @property {number} tourney.ipcClients.gameplay.hits.100
 * @property {number} tourney.ipcClients.gameplay.hits.300
 * @property {number} tourney.ipcClients.gameplay.hits.geki This is also used as the 320's count in the osu!mania ruleset
 * @property {number} tourney.ipcClients.gameplay.hits.katu This is also used as the 200's count in the osu!mania ruleset
 * @property {number} tourney.ipcClients.gameplay.hits.sliderBreaks
 * @property {number} tourney.ipcClients.gameplay.hits.unstableRate
 * @property {number[]} tourney.ipcClients.gameplay.hits.hitErrorArray
 * @property {object} tourney.ipcClients.gameplay.mods
 * @property {number} tourney.ipcClients.gameplay.mods.num
 * @property {string} tourney.ipcClients.gameplay.mods.str
 */



/** @typedef {object} WEBSOCKET_V2
 * @property {object} game
 * @property {boolean} game.focused
 * @property {boolean} paused
 * @property {'stable' | 'lazer'} client
 * @property {string} server
 * @property {object} state
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23} state.number
 * @property {'menu' | 'edit' | 'play' | 'exit' | 'selectEdit' | 'selectPlay' | 'selectDrawings' | 'resultScreen' | 'update' | 'busy' | 'unknown' | 'lobby' | 'matchSetup' | 'selectMulti' | 'rankingVs' | 'onlineSelection' | 'optionsOffsetWizard' | 'rankingTagCoop' | 'rankingTeam' | 'beatmapImport' | 'packageUpdater' | 'benchmark' | 'tourney' | 'charts'} state.name
 * @property {object} session
 * @property {number} session.playTime
 * @property {number} session.playCount
 * @property {object} settings
 * @property {boolean} settings.interfaceVisible
 * @property {boolean} settings.replayUIVisible
 * @property {object} settings.chatVisibilityStatus
 * @property {0 | 1 | 2} settings.chatVisibilityStatus.number
 * @property {'hidden' | 'visible' | 'visibleWithFriendsList'} settings.chatVisibilityStatus.name
 * @property {object} settings.leaderboard
 * @property {boolean} settings.leaderboard.visible
 * @property {object} settings.leaderboard.type
 * @property {0 | 1 | 2 | 3 | 4} settings.leaderboard.type.number
 * @property {'local' | 'global' | 'selectedmods' | 'friends' | 'country'} settings.leaderboard.type.name
 * @property {object} settings.progressBar
 * @property {0 | 1 | 2 | 3 | 4} settings.progressBar.number
 * @property {'off' | 'pie' | 'topRight' | 'bottomRight' | 'bottom'} settings.progressBar.name
 * @property {number} settings.bassDensity
 * @property {object} settings.resolution
 * @property {boolean} settings.resolution.fullscreen
 * @property {number} settings.resolution.width
 * @property {number} settings.resolution.height
 * @property {number} settings.resolution.widthFullscreen
 * @property {number} settings.resolution.heightFullscreen
 * @property {object} settings.client
 * @property {boolean} settings.client.updateAvailable
 * @property {0 | 1 | 2 | 3} settings.client.branch - `0` - Cutting Edge (or Lazer in osu!(lazer))
 *                                                  - `1` - Stable (or Tachyon in osu!(lazer))
 *                                                  - `2` - Beta
 *                                                  - `3` - Stable (Fallback)
 * @property {string} settings.client.version The full build version, e.g. `b20241029cuttingedge`
 * @property {object} settings.scoreMeter
 * @property {object} settings.scoreMeter.type
 * @property {0 | 1 | 2} settings.scoreMeter.type.number
 * @property {'none' | 'colour' | 'error'} settings.scoreMeter.type.name
 * @property {number} settings.scoreMeter.size
 * @property {object} settings.cursor
 * @property {boolean} settings.cursor.useSkinCursor
 * @property {boolean} settings.cursor.autoSize
 * @property {number} settings.cursor.size
 * @property {number} settings.cursor.menuSize
 * @property {object} settings.mouse
 * @property {boolean} settings.mouse.highPrecision
 * @property {boolean} settings.mouse.rawInput
 * @property {boolean} settings.mouse.disableButtons
 * @property {boolean} settings.mouse.disableWheel
 * @property {number} settings.mouse.sensitivity
 * @property {object} settings.tablet
 * @property {boolean} settings.tablet.enabled
 * @property {number} settings.tablet.x
 * @property {number} settings.tablet.y
 * @property {number} settings.tablet.width
 * @property {number} settings.tablet.height
 * @property {number} settings.tablet.ratation
 * @property {number} settings.tablet.pressureThreshold
 * @property {object} settings.mania
 * @property {boolean} settings.mania.speedBPMScale
 * @property {boolean} settings.mania.usePerBeatmapSpeedScale
 * @property {boolean} settings.mania.usePerBeatmapSpeedScale
 * @property {number} settings.mania.scrollSpeed
 * @property {object} settings.mania.scrollDirection
 * @property {0 | 1} settings.mania.scrollDirection.number
 * @property {'up' | 'down'} settings.mania.scrollDirection.name
 * @property {object} settings.sort
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7} settings.sort.number
 * @property {'artist' | 'bpm' | 'creator' | 'date' | 'difficulty' | 'length' | 'rank' | 'title'} settings.sort.name
 * @property {object} settings.group
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19} settings.group.number
 * @property {'none' | 'artist' | 'bPM' | 'creator' | 'date' | 'difficulty' | 'length' | 'rank' | 'myMaps' | 'search' | 'show_All' | 'title' | 'lastPlayed' | 'onlineFavourites' | 'maniaKeys' | 'mode' | 'collection' | 'rankedStatus'} settings.group.name Note: `search` and `show_All` share the same number - `12`
 * @property {object} settings.skin
 * @property {boolean} settings.skin.useDefaultSkinInEditor
 * @property {boolean} settings.skin.ignoreBeatmapSkins
 * @property {boolean} settings.skin.tintSliderBall
 * @property {boolean} settings.skin.useTaikoSkin
 * @property {string} settings.skin.name
 * @property {object} settings.mode
 * @property {0 | 1 | 2 | 3} settings.mode.number
 * @property {'osu' | 'taiko' | 'fruits' | 'mania'} settings.mode.name
 * @property {object} settings.audio
 * @property {boolean} settings.audio.ignoreBeatmapSounds
 * @property {boolean} settings.audio.useSkinSamples
 * @property {object} settings.audio.volume
 * @property {number} settings.audio.volume.masterInactive
 * @property {number} settings.audio.volume.master
 * @property {number} settings.audio.volume.music
 * @property {number} settings.audio.volume.effect
 * @property {object} settings.audio.offset
 * @property {number} settings.audio.offset.universal
 * @property {object} settings.background
 * @property {number} settings.background.dim
 * @property {number} settings.background.blur
 * @property {boolean} settings.background.video
 * @property {boolean} settings.background.storyboard
 * @property {object} settings.keybinds
 * @property {object} settings.keybinds.osu
 * @property {string} settings.keybinds.osu.k1
 * @property {string} settings.keybinds.osu.k2
 * @property {string} settings.keybinds.osu.smokeKey
 * @property {object} settings.keybinds.fruits
 * @property {string} settings.keybinds.fruits.k1
 * @property {string} settings.keybinds.fruits.k2
 * @property {string} settings.keybinds.fruits.Dash
 * @property {object} settings.keybinds.taiko
 * @property {string} settings.keybinds.taiko.innerLeft
 * @property {string} settings.keybinds.taiko.innerRight
 * @property {string} settings.keybinds.taiko.outerLeft
 * @property {string} settings.keybinds.taiko.outerRight
 * @property {string} settings.keybinds.quickRetry
 * @property {object} profile
 * @property {object} profile.userStatus
 * @property {0 | 256 | 257 | 65537 | 65793} profile.userStatus.number
 * @property {'reconnecting' | 'guest' | 'recieving_data' | 'disconnected' | 'connected'} profile.userStatus.name
 * @property {object} profile.banchoStatus
 * @property {0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13} profile.banchoStatus.number
 * @property {'idle' | 'afk' | 'playing' | 'editing' | 'modding' | 'multiplayer' | 'watching' | 'unknown' | 'testing' | 'submitting' | 'paused' | 'lobby' | 'multiplaying' | 'osuDirect'} profile.banchoStatus.name
 * @property {number} profile.id
 * @property {string} profile.name
 * @property {object} profile.mode
 * @property {0 | 1 | 2 | 3} profile.mode.number
 * @property {'osu' | 'taiko' | 'fruits' | 'mania'} profile.mode.name
 * @property {number} profile.rankedScore
 * @property {number} profile.level
 * @property {number} profile.accuracy
 * @property {number} profile.pp
 * @property {number} profile.playCount
 * @property {number} profile.globalRank
 * @property {object} profile.countryCode
 * @property {number} profile.countryCode.number
 * @property {string} profile.countryCode.name
 * @property {string} profile.backgroundColour
 * @property {object} beatmap
 * @property {boolean} beatmap.isKiai
 * @property {boolean} beatmap.isBreak
 * @property {boolean} beatmap.isConvert
 * @property {object} beatmap.time
 * @property {number} beatmap.time.live
 * @property {number} beatmap.time.firstObject
 * @property {number} beatmap.time.lastObject
 * @property {number} beatmap.time.mp3Length
 * @property {object} beatmap.status
 * @property {0 | 1 | 2 | 4 | 5 | 6 | 7} beatmap.status.number
 * @property {'unknown' | 'notSubmitted' | 'pending' | 'ranked' | 'approved' | 'qualified' | 'loved'} beatmap.status.name
 * @property {string} beatmap.checksum
 * @property {number} beatmap.id
 * @property {number} beatmap.set
 * @property {object} beatmap.mode
 * @property {0 | 1 | 2 | 3} beatmap.mode.number
 * @property {'osu' | 'taiko' | 'fruits' | 'mania'} beatmap.mode.name
 * @property {string} beatmap.artist
 * @property {string} beatmap.artistUnicode
 * @property {string} beatmap.title
 * @property {string} beatmap.titleUnicode
 * @property {string} beatmap.mapper
 * @property {string} beatmap.version
 * @property {object} beatmap.stats
 * @property {object} beatmap.stats.stars
 * @property {number} beatmap.stats.stars.live
 * @property {number} [beatmap.stats.stars.aim] This is available only in the osu! ruleset
 * @property {number} [beatmap.stats.stars.speed] This is available only in the osu! ruleset
 * @property {number} [beatmap.stats.stars.flashlight] This is available only in the osu! ruleset
 * @property {number} [beatmap.stats.stars.sliderFactor] This is available only in the osu! ruleset
 * @property {number} [beatmap.stats.stars.stamina] This is available only in the osu!taiko ruleset
 * @property {number} [beatmap.stats.stars.rhythm] This is available only in the osu!taiko ruleset
 * @property {number} [beatmap.stats.stars.color] This is available only in the osu!taiko ruleset
 * @property {number} [beatmap.stats.stars.reading] This is available only in the osu!taiko ruleset
 * @property {number} [beatmap.stats.stars.hitWindow] 300's hit window; this is available only in the osu!mania ruleset
 * @property {number} beatmap.stats.stars.total
 * @property {object} beatmap.stats.ar
 * @property {number} beatmap.stats.ar.original
 * @property {number} beatmap.stats.ar.converted
 * @property {object} beatmap.stats.cs
 * @property {number} beatmap.stats.cs.original
 * @property {number} beatmap.stats.cs.converted
 * @property {object} beatmap.stats.od
 * @property {number} beatmap.stats.od.original
 * @property {number} beatmap.stats.od.converted
 * @property {object} beatmap.stats.hp
 * @property {number} beatmap.stats.hp.original
 * @property {number} beatmap.stats.hp.converted
 * @property {object} beatmap.stats.bpm
 * @property {number} beatmap.stats.bpm.realtime
 * @property {number} beatmap.stats.bpm.common
 * @property {number} beatmap.stats.bpm.min
 * @property {number} beatmap.stats.bpm.max
 * @property {object} beatmap.stats.objects
 * @property {number} beatmap.stats.objects.circles
 * @property {number} beatmap.stats.objects.sliders
 * @property {number} beatmap.stats.objects.spinners
 * @property {number} beatmap.stats.objects.holds
 * @property {number} beatmap.stats.objects.total
 * @property {number} beatmap.stats.maxCombo
 * @property {object} play
 * @property {boolean} play.failed
 * @property {string} play.playerName
 * @property {object} play.mode
 * @property {0 | 1 | 2 | 3} play.mode.number
 * @property {'osu' | 'taiko' | 'fruits' | 'mania'} play.mode.name
 * @property {number} play.score
 * @property {number} play.accuracy
 * @property {object} play.healthBar
 * @property {number} play.healthBar.normal
 * @property {number} play.healthBar.smooth
 * @property {object} play.hits
 * @property {number} play.hits.0
 * @property {number} play.hits.50
 * @property {number} play.hits.100
 * @property {number} play.hits.300
 * @property {number} play.hits.geki This is also used as the 320's count in the osu!mania ruleset
 * @property {number} play.hits.katu This is also used as the 200's count in the osu!mania ruleset
 * @property {number} play.hits.sliderBreaks
 * @property {number} play.hits.sliderEndHits This is populated only when playing osu!(lazer)
 * @property {number} play.hits.smallTickHits This is populated only when playing osu!(lazer)
 * @property {number} play.hits.largeTickHits This is populated only when playing osu!(lazer)
 * @property {number[]} play.hitErrorArray
 * @property {object} play.combo
 * @property {number} play.combo.current
 * @property {number} play.combo.max
 * @property {object} play.mods
 * @property {string} play.mods.checksum
 * @property {number} play.mods.number
 * @property {string} play.mods.name
 * @property {object[]} play.mods.array
 * @property {string} play.mods.array.acronym
 * @property {object} [play.mods.array.settings] This exists only when playing osu!(lazer). You must get the settings manually, e.g. from the `/json/v2` response preview
 * @property {number} play.mods.rate
 * @property {object} play.rank
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} play.rank.current
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} play.rank.maxThisPlay
 * @property {object} play.pp
 * @property {number} play.pp.current
 * @property {number} play.pp.fc
 * @property {number} play.pp.maxAchieved
 * @property {number} play.pp.maxAchievable
 * @property {object} play.pp.detailed
 * @property {object} play.pp.detailed.current
 * @property {number} play.pp.detailed.current.aim
 * @property {number} play.pp.detailed.current.speed
 * @property {number} play.pp.detailed.current.accuracy
 * @property {number} play.pp.detailed.current.difficulty
 * @property {number} play.pp.detailed.current.flashlight
 * @property {number} play.pp.detailed.current.total
 * @property {object} play.pp.detailed.fc
 * @property {number} play.pp.detailed.fc.aim
 * @property {number} play.pp.detailed.fc.speed
 * @property {number} play.pp.detailed.fc.accuracy
 * @property {number} play.pp.detailed.fc.difficulty
 * @property {number} play.pp.detailed.fc.flashlight
 * @property {number} play.pp.detailed.fc.total
 * @property {number} play.unstableRate
 * @property {object[]} leaderboard
 * @property {boolean} leaderboard.isFailed
 * @property {number} leaderboard.position
 * @property {1 | 2} leaderboard.team
 * @property {number} leaderboard.id
 * @property {string} leaderboard.name
 * @property {number} leaderboard.score
 * @property {number} leaderboard.accuracy
 * @property {object} leaderboard.hits
 * @property {number} leaderboard.hits.0
 * @property {number} leaderboard.hits.50
 * @property {number} leaderboard.hits.100
 * @property {number} leaderboard.hits.300
 * @property {number} leaderboard.hits.geki This is also used as the 320's count in the osu!mania ruleset
 * @property {number} leaderboard.hits.katu This is also used as the 200's count in the osu!mania ruleset
 * @property {object} leaderboard.combo
 * @property {number} leaderboard.combo.current
 * @property {number} leaderboard.combo.max
 * @property {object} leaderboard.mods
 * @property {string} leaderboard.mods.checksum
 * @property {number} leaderboard.mods.number
 * @property {string} leaderboard.mods.name
 * @property {object[]} leaderboard.mods.array
 * @property {string} leaderboard.mods.array.acronym
 * @property {object} [leaderboard.mods.array.settings] This exists only when playing osu!(lazer). You must get the settings manually, e.g. from the `/json/v2` response preview
 * @property {number} leaderboard.mods.rate
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} leaderboard.rank
 * @property {object} performance
 * @property {object} performance.accuracy
 * @property {number} performance.accuracy.90
 * @property {number} performance.accuracy.91
 * @property {number} performance.accuracy.92
 * @property {number} performance.accuracy.93
 * @property {number} performance.accuracy.94
 * @property {number} performance.accuracy.95
 * @property {number} performance.accuracy.96
 * @property {number} performance.accuracy.97
 * @property {number} performance.accuracy.98
 * @property {number} performance.accuracy.99
 * @property {number} performance.accuracy.100
 * @property {object} performance.graph
 * @property {object[]} performance.graph.series
 * @property {'aim' | 'aimNoSliders' | 'flashlight' | 'speed' | 'color' | 'rhythm' | 'stamina' | 'movement' | 'strains'} performance.graph.series.name
 * @property {number[]} performance.graph.series.data
 * @property {number[]} performance.graph.xaxis
 * @property {object} resultsScreen
 * @property {number} resultsScreen.scoreId
 * @property {string} resultsScreen.playerName
 * @property {object} resultsScreen.mode
 * @property {0 | 1 | 2 | 3} resultsScreen.mode.number
 * @property {'osu' | 'taiko' | 'fruits' | 'mania'} resultsScreen.mode.name
 * @property {number} resultsScreen.score
 * @property {number} resultsScreen.accuracy
 * @property {object} resultsScreen.hits
 * @property {number} resultsScreen.hits.0
 * @property {number} resultsScreen.hits.50
 * @property {number} resultsScreen.hits.100
 * @property {number} resultsScreen.hits.300
 * @property {number} resultsScreen.hits.geki This is also used as the 320's count in the osu!mania ruleset
 * @property {number} resultsScreen.hits.katu This is also used as the 200's count in the osu!mania ruleset
 * @property {number} resultsScreen.hits.sliderEndHits This is populated only when playing osu!(lazer)
 * @property {number} resultsScreen.hits.sliderTickHits This is populated only when playing osu!(lazer)
 * @property {object} resultsScreen.mods
 * @property {string} resultsScreen.mods.checksum
 * @property {number} resultsScreen.mods.number
 * @property {string} resultsScreen.mods.name
 * @property {object[]} resultsScreen.mods.array
 * @property {string} resultsScreen.mods.array.acronym
 * @property {object} [resultsScreen.mods.array.settings] This exists only when playing osu!(lazer). You must get the settings manually, e.g. from the `/json/v2` response preview
 * @property {number} resultsScreen.mods.rate
 * @property {number} resultsScreen.maxCombo
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} resultsScreen.rank
 * @property {object} resultsScreen.pp
 * @property {number} resultsScreen.pp.current
 * @property {number} resultsScreen.pp.fc
 * @property {string} resultsScreen.createdAt
 * @property {object} folders
 * @property {string} folders.game
 * @property {string} folders.skin
 * @property {string} folders.songs
 * @property {string} folders.beatmap
 * @property {object} files
 * @property {string} files.beatmap
 * @property {string} files.background
 * @property {string} files.audio
 * @property {object} directPath
 * @property {string} directPath.beatmapFile
 * @property {string} directPath.beatmapBackground
 * @property {string} directPath.beatmapAudio
 * @property {string} directPath.beatmapFolder
 * @property {string} directPath.skinFolder
 * @property {object} tourney
 * @property {boolean} tourney.scoreVisible
 * @property {boolean} tourney.starsVisible
 * @property {0 | 1 | 2 | 3 | 4} tourney.ipcState - `0` - Initialising
 *                                                - `1` - Idle
 *                                                - `2` - Waiting for clients
 *                                                - `3` - Playing
 *                                                - `4` - Ranking
 * @property {number} tourney.bestOF
 * @property {object} tourney.team
 * @property {string} tourney.team.left
 * @property {string} tourney.team.right
 * @property {object} tourney.points
 * @property {number} tourney.points.left
 * @property {number} tourney.points.right
 * @property {object[]} tourney.chat
 * @property {'left' | 'right' | 'BanchoBot' | 'unknown'} tourney.chat.team
 * @property {string} tourney.chat.name
 * @property {string} tourney.chat.message
 * @property {string} tourney.chat.timestamp
 * @property {object} tourney.totalScore
 * @property {number} tourney.totalScore.left
 * @property {number} tourney.totalScore.right
 * @property {object[]} tourney.clients
 * @property {number} tourney.clients.ipcId
 * @property {'left' | 'right'} tourney.clients.team
 * @property {object} tourney.clients.settings
 * @property {object} tourney.clients.settings.mania
 * @property {number} tourney.clients.settings.mania.scrollSpeed
 * @property {object} tourney.clients.user
 * @property {number} tourney.clients.user.id
 * @property {string} tourney.clients.user.name
 * @property {string} tourney.clients.user.country
 * @property {number} tourney.clients.user.accuracy
 * @property {number} tourney.clients.user.rankedScore
 * @property {number} tourney.clients.user.playCount
 * @property {number} tourney.clients.user.globalRank
 * @property {number} tourney.clients.user.totalPP
 * @property {object} tourney.clients.beatmap
 * @property {object} tourney.clients.beatmap.stats
 * @property {object} tourney.clients.beatmap.stats.stars
 * @property {number} tourney.clients.beatmap.stats.stars.live
 * @property {number} [tourney.clients.beatmap.stats.stars.aim] This is available only in the osu! ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.speed] This is available only in the osu! ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.flashlight] This is available only in the osu! ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.sliderFactor] This is available only in the osu! ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.stamina] This is available only in the osu!taiko ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.rhythm] This is available only in the osu!taiko ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.color] This is available only in the osu!taiko ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.peak] This is available only in the osu!taiko ruleset
 * @property {number} [tourney.clients.beatmap.stats.stars.hitWindow] 300's hit window; this is available only in the osu!mania ruleset
 * @property {number} tourney.clients.beatmap.stats.stars.total
 * @property {object} tourney.clients.beatmap.stats.ar
 * @property {number} tourney.clients.beatmap.stats.ar.original
 * @property {number} tourney.clients.beatmap.stats.ar.converted
 * @property {object} tourney.clients.beatmap.stats.cs
 * @property {number} tourney.clients.beatmap.stats.cs.original
 * @property {number} tourney.clients.beatmap.stats.cs.converted
 * @property {object} tourney.clients.beatmap.stats.od
 * @property {number} tourney.clients.beatmap.stats.od.original
 * @property {number} tourney.clients.beatmap.stats.od.converted
 * @property {object} tourney.clients.beatmap.stats.hp
 * @property {number} tourney.clients.beatmap.stats.hp.original
 * @property {number} tourney.clients.beatmap.stats.hp.converted
 * @property {object} tourney.clients.beatmap.stats.bpm
 * @property {number} tourney.clients.beatmap.stats.bpm.realtime
 * @property {number} tourney.clients.beatmap.stats.bpm.common
 * @property {number} tourney.clients.beatmap.stats.bpm.min
 * @property {number} tourney.clients.beatmap.stats.bpm.max
 * @property {object} tourney.clients.beatmap.stats.objects
 * @property {number} tourney.clients.beatmap.stats.objects.circles
 * @property {number} tourney.clients.beatmap.stats.objects.sliders
 * @property {number} tourney.clients.beatmap.stats.objects.spinners
 * @property {number} tourney.clients.beatmap.stats.objects.holds
 * @property {number} tourney.clients.beatmap.stats.objects.total
 * @property {number} tourney.clients.beatmap.stats.maxCombo
 * @property {object} tourney.clients.play
 * @property {string} tourney.clients.play.playerName
 * @property {object} tourney.clients.play.mode
 * @property {0 | 1 | 2 | 3} tourney.clients.play.mode.number
 * @property {'osu' | 'taiko' | 'fruits' | 'mania'} tourney.clients.play.mode.name
 * @property {number} tourney.clients.play.score
 * @property {number} tourney.clients.play.accuracy
 * @property {object} tourney.clients.play.healthBar
 * @property {number} tourney.clients.play.healthBar.normal
 * @property {number} tourney.clients.play.healthBar.smooth
 * @property {object} tourney.clients.play.hits
 * @property {number} tourney.clients.play.hits.0
 * @property {number} tourney.clients.play.hits.50
 * @property {number} tourney.clients.play.hits.100
 * @property {number} tourney.clients.play.hits.300
 * @property {number} tourney.clients.play.hits.geki This is also used as the 320's count in the osu!mania ruleset
 * @property {number} tourney.clients.play.hits.katu This is also used as the 200's count in the osu!mania ruleset
 * @property {number} tourney.clients.play.hits.sliderBreaks
 * @property {number} tourney.clients.play.hits.sliderEndHits This is populated only when playing osu!(lazer)
 * @property {number} tourney.clients.play.hits.sliderTickHits This is populated only when playing osu!(lazer)
 * @property {number[]} tourney.clients.play.hitErrorArray
 * @property {object} tourney.clients.play.combo
 * @property {number} tourney.clients.play.combo.current
 * @property {number} tourney.clients.play.combo.max
 * @property {object} tourney.clients.play.mods
 * @property {string} tourney.clients.play.mods.checksum
 * @property {number} tourney.clients.play.mods.number
 * @property {string} tourney.clients.play.mods.name
 * @property {object[]} tourney.clients.play.mods.array
 * @property {string} tourney.clients.play.mods.array.acronym
 * @property {object} [tourney.clients.play.mods.array.settings] This exists only when playing osu!(lazer). You must get the settings manually, e.g. from the `/json/v2` response preview
 * @property {number} tourney.clients.play.mods.rate
 * @property {object} tourney.clients.play.rank
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} tourney.clients.play.rank.current
 * @property {'XH' | 'X' | 'SH' | 'S' | 'A' | 'B' | 'C' | 'D'} tourney.clients.play.rank.maxThisPlay
 * @property {object} tourney.clients.play.pp
 * @property {number} tourney.clients.play.pp.current
 * @property {number} tourney.clients.play.pp.fc
 * @property {number} tourney.clients.play.pp.maxAchieved
 * @property {object} tourney.clients.play.pp.detailed
 * @property {object} tourney.clients.play.pp.detailed.current
 * @property {number} tourney.clients.play.pp.detailed.current.aim
 * @property {number} tourney.clients.play.pp.detailed.current.speed
 * @property {number} tourney.clients.play.pp.detailed.current.accuracy
 * @property {number} tourney.clients.play.pp.detailed.current.difficulty
 * @property {number} tourney.clients.play.pp.detailed.current.flashlight
 * @property {number} tourney.clients.play.pp.detailed.current.total
 * @property {object} tourney.clients.play.pp.detailed.fc
 * @property {number} tourney.clients.play.pp.detailed.fc.aim
 * @property {number} tourney.clients.play.pp.detailed.fc.speed
 * @property {number} tourney.clients.play.pp.detailed.fc.accuracy
 * @property {number} tourney.clients.play.pp.detailed.fc.difficulty
 * @property {number} tourney.clients.play.pp.detailed.fc.flashlight
 * @property {number} tourney.clients.play.pp.detailed.fc.total
 * @property {number} tourney.clients.play.unstableRate
 */



/** @typedef {object} WEBSOCKET_V2_PRECISE
 * @property {number} currentTime
 * @property {object} keys
 * @property {object} keys.k1
 * @property {boolean} keys.k1.isPressed
 * @property {number} keys.k1.count
 * @property {object} keys.k2
 * @property {boolean} keys.k2.isPressed
 * @property {number} keys.k2.count
 * @property {object} keys.m1
 * @property {boolean} keys.m1.isPressed
 * @property {number} keys.m1.count
 * @property {object} keys.m2
 * @property {boolean} keys.m2.isPressed
 * @property {number} keys.m2.count
 * @property {number[]} hitErrors
 * @property {object[]} tourney
 * @property {number} tourney.ipcId
 * @property {number[]} tourney.hitErrors
 * @property {object} tourney.keys
 * @property {object} tourney.keys.k1
 * @property {boolean} tourney.keys.k1.isPressed
 * @property {number} tourney.keys.k1.count
 * @property {object} tourney.keys.k2
 * @property {boolean} tourney.keys.k2.isPressed
 * @property {number} tourney.keys.k2.count
 * @property {object} tourney.keys.m1
 * @property {boolean} tourney.keys.m1.isPressed
 * @property {number} tourney.keys.m1.count
 * @property {object} tourney.keys.m2
 * @property {boolean} tourney.keys.m2.isPressed
 * @property {number} tourney.keys.m2.count
 */
