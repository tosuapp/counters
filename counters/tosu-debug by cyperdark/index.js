// connecting to websocket
import WebSocketManager from './js/socket.js';

const socket = new WebSocketManager(window.location.host);



// cache values here to prevent constant updating
const cache = {};



const graph_options = {
  chart: {
    type: "area",

    width: 280,
    height: 150,

    animations: {
      enabled: false
    },

    toolbar: {
      show: false,
    }
  },
  dataLabels: {
    enabled: false
  },
  legend: {
    show: false
  },
  stroke: {
    curve: "straight",
    width: 2,
  },

  yaxis: {
    min: 0,
    show: false,

    labels: {
      show: false,
      position: 'left'
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    tooltip: {
      enabled: false
    }
  },
  grid: {
    show: false,
    padding: {
      left: 0,
      right: 0
    },
  },
  series: [],
  xaxis: {
    type: "numeric",
    categories: [],
    labels: {
      show: false,
      position: 'left'
    },
    axisBorder: {
      show: false,
    },
    axisTicks: {
      show: false,
    },
    tooltip: {
      enabled: false
    }
  },

  tooltip: {
    enabled: false
  }
};

var chart = '';


const spaceit = (text) => text.toLocaleString().replace(/,/, ' ');


window.onload = () => {
  chart = new ApexCharts(document.querySelector("#graph"), { ...graph_options });
  chart.render();
}


// const string1 = `[https://osu.ppy.sh/b/${menu.bm.id} ${menu.bm.metadata.artist} - ${menu.bm.metadata.title} [${menu.bm.metadata.difficulty}]]`;
// if (cache['np'] != string1) {
//   cache['np'] = string1;
//   document.querySelector('.asd').innerHTML = string1;
// };

socket.api_v2(({ state, settings, session, profile, performance, resultsScreen, play, beatmap, directPath, folders }) => {

  if (cache['showInterface'] != settings.interfaceVisible) {
    cache['showInterface'] = settings.interfaceVisible;
    if (settings.interfaceVisible == true)
      document.querySelector('.interface').classList.add('active')
    else if (settings.interfaceVisible == false)
      document.querySelector('.interface').classList.remove('active')
  };

  if (cache['replayUIVisible'] != settings.replayUIVisible) {
    cache['replayUIVisible'] = settings.replayUIVisible;
    if (settings.replayUIVisible == true)
      document.querySelector('.replayUI').classList.add('active')
    else if (settings.replayUIVisible == false)
      document.querySelector('.replayUI').classList.remove('active')
  };

  if (cache['chatVisibilityStatus'] != settings.chatVisibilityStatus.number) {
    cache['chatVisibilityStatus'] = settings.chatVisibilityStatus.number;

    document.querySelector('.chat').innerHTML = `chat: ${settings.chatVisibilityStatus.name || settings.chatVisibilityStatus.number}`
    if (settings.chatVisibilityStatus.number > 0)
      document.querySelector('.chat').classList.add('active')
    else
      document.querySelector('.chat').classList.remove('active')
  };

  if (cache['leaderboard.visible'] != settings.leaderboard.visible) {
    cache['leaderboard.visible'] = settings.leaderboard.visible;
    if (settings.leaderboard.visible == true)
      document.querySelector('.isLeaderboardVisible').classList.add('active')
    else if (settings.leaderboard.visible == false)
      document.querySelector('.isLeaderboardVisible').classList.remove('active')
  };

  if (cache['leaderboard.type.number'] != settings.leaderboard.type.number) {
    cache['leaderboard.type.number'] = settings.leaderboard.type.number;
    document.querySelector('.leaderboardType').innerHTML = `leaderboard: ${settings.leaderboard.type.name} (${settings.leaderboard.type.number})`
  };

  if (cache['progressBar.number'] != settings.progressBar.number) {
    cache['progressBar.number'] = settings.progressBar.number;
    document.querySelector('.progressBarType').innerHTML = `progressBar: ${settings.progressBar.name} (${settings.progressBar.number})`
  };

  if (cache['scoreMeter.type.number'] != settings.scoreMeter.type.number || cache['scoreMeter.size'] != settings.scoreMeter.size) {
    cache['scoreMeter.type.number'] = settings.scoreMeter.type.number;
    cache['scoreMeter.size'] = settings.scoreMeter.size;
    document.querySelector('.scoreMeterType').innerHTML = `scoreMeterType: ${settings.scoreMeter.size}x - ${settings.scoreMeter.type.name} (${settings.scoreMeter.type.number})`
  };

  if (cache['sort.number'] != settings.sort.number) {
    cache['sort.number'] = settings.sort.number;
    document.querySelector('.sortType').innerHTML = `sorted by: ${settings.sort.name} (${settings.sort.number})`
  };

  if (cache['group.number'] != settings.group.number) {
    cache['group.number'] = settings.group.number;
    document.querySelector('.groupType').innerHTML = `grouped by: ${settings.group.name} (${settings.group.number})`
  };

  if (cache['cursor.size'] != settings.cursor.size) {
    cache['cursor.size'] = settings.cursor.size;
    document.querySelector('.cursorSize').innerHTML = `cursor: ${settings.cursor.size}x`
  };

  if (cache['mouse.sensitivity'] != settings.mouse.sensitivity) {
    cache['mouse.sensitivity'] = settings.mouse.sensitivity;
    document.querySelector('.mouseSens').innerHTML = `mouse: ${settings.mouse.sensitivity}x`
  };

  if (cache['audio.volume.master'] != settings.audio.volume.master || cache['audio.volume.effect'] != settings.audio.volume.effect || cache['audio.volume.music'] != settings.audio.volume.music || cache['audio.offset.universal'] != settings.audio.offset.universal) {
    cache['audio.volume.master'] = settings.audio.volume.master;
    cache['audio.volume.effect'] = settings.audio.volume.effect;
    cache['audio.volume.music'] = settings.audio.volume.music;
    cache['audio.offset.universal'] = settings.audio.offset.universal;
    document.querySelector('.audio').innerHTML = `audio: ${settings.audio.volume.master} - ${settings.audio.volume.music} - ${settings.audio.volume.effect} (Global Offset: ${settings.audio.offset.universal})`;
  };

  if (cache['background.dim'] != settings.background.dim) {
    cache['background.dim'] = settings.background.dim;
    document.querySelector('.dim').innerHTML = `Background dim: ${settings.background.dim}%`
  };


  const mode_name = state == 2 ? play.mode.name : settings.mode.name;
  switch (mode_name) {
    case 'Osu':
      if (cache['k1'] != settings.keybinds.osu.k1) {
        cache['k1'] = settings.keybinds.osu.k1;
        document.querySelector('.bind-k1').innerHTML = settings.keybinds.osu.k1;
      };

      if (cache['k2'] != settings.keybinds.osu.k2) {
        cache['k2'] = settings.keybinds.osu.k2;
        document.querySelector('.bind-k2').innerHTML = settings.keybinds.osu.k2;
      };

      if (cache['m1'] != 'm1') {
        cache['m1'] = 'm1';
        document.querySelector('.bind-m1').innerHTML = 'M1';
      };

      if (cache['m2'] != 'm2') {
        cache['m2'] = 'm2';
        document.querySelector('.bind-m2').innerHTML = 'M2';
      };

      break;

    case 'Fruits':
      if (cache['k1'] != settings.keybinds.fruits.k1) {
        cache['k1'] = settings.keybinds.fruits.k1;
        document.querySelector('.bind-k1').innerHTML = settings.keybinds.fruits.k1;
      };

      if (cache['k2'] != settings.keybinds.fruits.k2) {
        cache['k2'] = settings.keybinds.fruits.k2;
        document.querySelector('.bind-k2').innerHTML = settings.keybinds.fruits.k2;
      };

      if (cache['m1'] != settings.keybinds.fruits.Dash) {
        cache['m1'] = settings.keybinds.fruits.Dash;
        document.querySelector('.bind-m1').innerHTML = settings.keybinds.fruits.Dash;
      };

      break;
  }





  if (cache['hp.normal'] != play.healthBar.normal.toFixed(2)) {
    cache['hp.normal'] = play.healthBar.normal.toFixed(2);
    document.querySelector('.scorebar-normal').style.width = `${play.healthBar.normal}%`;
    document.querySelector('.player-hp').innerHTML = `${play.healthBar.normal.toFixed(0) * 2}/200`;
  };

  if (cache['hp.smooth'] != play.healthBar.smooth.toFixed(2)) {
    cache['hp.smooth'] = play.healthBar.smooth.toFixed(2);
    document.querySelector('.scorebar-smooth').style.width = `${play.healthBar.smooth}%`;
  };



  if (cache['play.gameMode'] != play.mode.name) {
    cache['play.gameMode'] = play.mode.name;


    if (play.mode.number >= 0 && play.mode.number <= 3) document.querySelector('.play-mode').innerHTML = `<img src="images/${play.mode.name.toLowerCase()}.png" />`;
    else document.querySelector('.play-mode').innerHTML = play.mode.number;
  };


  if (cache['play.name'] != play.playerName) {
    cache['play.name'] = play.playerName;
    document.querySelector('.player-name').innerHTML = play.playerName;
  };


  if (cache['play.accuracy'] != play.accuracy.toFixed(2)) {
    cache['play.accuracy'] = play.accuracy.toFixed(2);
    document.querySelector('.accuracy').innerHTML = play.accuracy.toFixed(2) + '%';
  };

  if (cache['play.score'] != play.score) {
    cache['play.score'] = play.score;
    document.querySelector('.score').innerHTML = spaceit(play.score);
  };

  if (cache['play.hits.grade.current'] != play.rank.current || cache['play.hits.grade.maxThisPlay'] != play.rank.maxThisPlay) {
    cache['play.hits.grade.current'] = play.rank.current;
    cache['play.hits.grade.maxThisPlay'] = play.rank.maxThisPlay;

    document.querySelector('.current-rank').innerHTML = `${play.rank.current} (${play.rank.maxThisPlay})`;
  };


  const progress = 100 - ((beatmap.time.live / beatmap.time.lastObject) * 100);
  if (cache['progress'] != progress) {
    cache['progress'] = progress;
    document.querySelector('.progress').style.setProperty('--progress', progress);
  };


  if (cache['menu.bm.path.full'] != directPath.beatmapBackground) {
    cache['menu.bm.path.full'] = directPath.beatmapBackground;

    const background_path = directPath.beatmapBackground.replace(folders.songs, '');

    const background = document.querySelector('.background');
    const background_mini = document.querySelector('.beatmap-background');
    background.style.opacity = 0;
    background_mini.style.opacity = 0;

    // Fade in the new image
    setTimeout(() => {
      background.src = `http://127.0.0.1:24050/files/beatmap/${background_path}`;
      background_mini.src = `http://127.0.0.1:24050/files/beatmap/${background_path}`;

      setTimeout(() => {
        background.style.opacity = 0.1;
        background_mini.style.opacity = 1;
      }, 200);
    }, 200); // 200ms delay



    const image = new Image();
    image.src = `http://127.0.0.1:24050/files/beatmap/${background_path}`;
    image.onerror = () => document.querySelector('.backgroundLoadError').classList.add('active');
    image.onload = () => document.querySelector('.backgroundLoadError').classList.remove('active');
  };


  if (cache['play.combo.current'] != play.combo.current) {
    cache['play.combo.current'] = play.combo.current;
    document.querySelector('.player-combo-current').innerHTML = play.combo.current;
  };

  if (cache['play.combo.max'] != play.combo.max) {
    cache['play.combo.max'] = play.combo.max;
    document.querySelector('.player-combo-max').innerHTML = play.combo.max;
  };


  if (cache['play.pp.current'] != play.pp.current.toFixed(0)) {
    cache['play.pp.current'] = play.pp.current.toFixed(0);
    document.querySelector('.player-pp-current').innerHTML = play.pp.current.toFixed(0);
  };

  if (cache['play.pp.fc'] != play.pp.fc.toFixed(0)) {
    cache['play.pp.fc'] = play.pp.fc.toFixed(0);
    document.querySelector('.player-pp-fc').innerHTML = play.pp.fc.toFixed(0);
  };


  if (cache['play.pp.maxAchieved'] != play.pp.maxAchieved.toFixed(0)) {
    cache['play.pp.maxAchieved'] = play.pp.maxAchieved.toFixed(0);
    document.querySelector('.player-pp-max').innerHTML = play.pp.maxAchieved.toFixed(0);
  };


  if (cache['bu-id'] != profile.id) {
    cache['bu-id'] = profile.id;
    document.querySelector('.bu-pfp').src = `https://a.ppy.sh/${profile.id}`;
  };

  if (cache['bu-flag'] != profile.countryCode.name) {
    cache['bu-flag'] = profile.countryCode.name;
    document.querySelector('.bu-flag').src = `images/flags/${profile.countryCode.name}.png`;
  };

  if (cache['bu-name'] != profile.name) {
    cache['bu-name'] = profile.name;
    document.querySelector('.bu-name').innerHTML = profile.name;
  };

  if (cache['bu-state'] != profile.userStatus.name) {
    cache['bu-state'] = profile.userStatus.name;
    document.querySelector('.bu-state').innerHTML = profile.userStatus.name;
  };

  if (cache['bu-status'] != profile.banchoStatus.name) {
    cache['bu-status'] = profile.banchoStatus.name;
    document.querySelector('.bu-status').innerHTML = profile.banchoStatus.name;
  };

  if (cache['bu-acc'] != profile.accuracy) {
    cache['bu-acc'] = profile.accuracy;
    document.querySelector('.bu-acc').innerHTML = `Accuracy: ${profile.accuracy}%`;
  };

  if (cache['bu-pp'] != profile.pp) {
    cache['bu-pp'] = profile.pp;
    document.querySelector('.bu-pp').innerHTML = `Performance: ${spaceit(profile.pp)}pp`;
  };

  if (cache['bu-lvl'] != profile.level) {
    cache['bu-lvl'] = profile.level;
    document.querySelector('.bu-lvl').innerHTML = 'LV ' + Math.ceil(profile.level);

    const v = parseFloat(profile.level.toFixed(2).split('.')[1]);
    document.querySelector('.bu-lvl-bar').style.setProperty('--progress', `${v}%`);
  };

  if (cache['bu-globalRank'] != profile.globalRank) {
    cache['bu-globalRank'] = profile.globalRank;
    document.querySelector('.bu-globalRank').innerHTML = '#' + spaceit(profile.globalRank);
  };

  if (cache['bu-playcount'] != profile.playCount) {
    cache['bu-playcount'] = profile.playCount;
    document.querySelector('.bu-playcount').innerHTML = `Playcount: ${spaceit(profile.playCount)}`;
  };

  if (cache['profile.mode.number'] != profile.mode.number) {
    cache['profile.mode.number'] = profile.mode.number;


    if (profile.mode.number >= 0 && profile.mode.number <= 3) document.querySelector('.bu-mode').innerHTML = `<img src="images/${profile.mode.name.toLowerCase()}.png" />`;
    else document.querySelector('.bu-mode').innerHTML = profile.mode.number;
  };


  if (cache['playtime'] != session.playTime) {
    cache['playtime'] = session.playTime;
    document.querySelector('.playtime').innerHTML = secondsToHumanReadable(session.playTime) + ` (${spaceit(session.playTime)})`;
  };

  if (cache['data.menu.state'] != state.number || cache['data.menu.state.name'] != state.name) {
    cache['data.menu.state'] = state.number;
    cache['data.menu.state.name'] = state.name;
    document.querySelector('.gamestate').innerHTML = `${state.name} - ${state.number}`;
  };


  if (cache['unstableRate'] != play.unstableRate.toFixed(2)) {
    cache['unstableRate'] = play.unstableRate.toFixed(2);
    document.querySelector('.unstable-rate').innerHTML = play.unstableRate.toFixed(2) + ' UR';
  };


  if (JSON.stringify(cache['strains']) != JSON.stringify(performance.graph) && chart != '') {
    cache['strains'] = performance.graph;



    graph_options.series = performance.graph.series.map(r => {

      return {
        name: r.name,
        data: r.data.map(s => s == -100 ? null : s),
      };
    });
    graph_options.xaxis.categories = performance.graph.xaxis;
    chart.updateOptions(graph_options);
  };


  if (cache['mods_name'] != play.mods.name) {
    cache['mods_name'] = play.mods.name;
    document.querySelector('.mods-num').innerHTML = play.mods.name;
  };

  if (cache['mods_number'] != play.mods.number) {
    cache['mods_number'] = play.mods.number;
    document.querySelector('.mods-str').innerHTML = `(${play.mods.number})`;
  };


  if (cache['data.menu.state'] != 2 && cache['data.pp.potential-ss'] != performance.accuracy['100']) {
    cache['data.pp.potential-ss'] = performance.accuracy['100'];

    document.querySelector('.player-pp-fc').innerHTML = performance.accuracy['100'].toFixed(0);
  };



  if (cache['beatmap_mode'] != settings.mode.number) {
    cache['beatmap_mode'] = settings.mode.number;


    if (settings.mode.number >= 0 && settings.mode.number <= 3) document.querySelector('.beatmap-mode').innerHTML = `${settings.mode.name} <img width="30px" height="30px" src="images/${settings.mode.name.toLowerCase()}.png" />`;
    else document.querySelector('.beatmap-mode').innerHTML = settings.mode.number;
  };

  if (cache['beatmap_rankedStatus'] != beatmap.status.number) {
    cache['beatmap_rankedStatus'] = beatmap.status.number;
    document.querySelector('.beatmap-status').innerHTML = `${beatmap.status.name} - ${beatmap.status.number}`;
  };

  if (cache['beatmap.stats.ar.converted'] != beatmap.stats.ar.converted) {
    cache['beatmap.stats.ar.converted'] = beatmap.stats.ar.converted;
    document.querySelector('.beatmap-ar').innerHTML = `AR: ${beatmap.stats.ar.converted.toFixed(2)} (${beatmap.stats.ar.original.toFixed(2)})`;
  };

  if (cache['beatmap.stats.cs.converted'] != beatmap.stats.cs.converted) {
    cache['beatmap.stats.cs.converted'] = beatmap.stats.cs.converted;
    document.querySelector('.beatmap-cs').innerHTML = `CS: ${beatmap.stats.cs.converted.toFixed(2)} (${beatmap.stats.cs.original.toFixed(2)})`;
  };

  if (cache['beatmap.stats.od.converted'] != beatmap.stats.od.converted) {
    cache['beatmap.stats.od.converted'] = beatmap.stats.od.converted;
    document.querySelector('.beatmap-od').innerHTML = `OD: ${beatmap.stats.od.converted.toFixed(2)} (${beatmap.stats.od.original.toFixed(2)})`;
  };

  if (cache['beatmap.stats.hp.converted'] != beatmap.stats.hp.converted) {
    cache['beatmap.stats.hp.converted'] = beatmap.stats.hp.converted;
    document.querySelector('.beatmap-hp').innerHTML = `HP: ${beatmap.stats.hp.converted.toFixed(2)} (${beatmap.stats.hp.original.toFixed(2)})`;
  };

  if (cache['beatmap-maxCombo'] != beatmap.stats.maxCombo) {
    cache['beatmap-maxCombo'] = beatmap.stats.maxCombo;
    document.querySelector('.beatmap-combo').innerHTML = beatmap.stats.maxCombo + 'x';
  };

  if (cache['stars.live'] != beatmap.stats.stars.live || cache['stars.total'] != beatmap.stats.stars.total) {
    cache['stars.live'] = beatmap.stats.stars.live;
    cache['stars.total'] = beatmap.stats.stars.total;
    document.querySelector('.beatmap-stars').innerHTML = `${beatmap.stats.stars.live.toFixed(2)}/${beatmap.stats.stars.total.toFixed(2)}*`;
  };

  if (
    cache['beatmap.stats.bpm.common'] != beatmap.stats.bpm.common ||
    cache['beatmap.stats.bpm.min'] != beatmap.stats.bpm.min ||
    cache['beatmap.stats.bpm.max'] != beatmap.stats.bpm.max
  ) {
    cache['beatmap.stats.bpm.common'] = beatmap.stats.bpm.common;
    cache['beatmap.stats.bpm.min'] = beatmap.stats.bpm.min;
    cache['beatmap.stats.bpm.max'] = beatmap.stats.bpm.max;

    document.querySelector('.beatmap-bpm').innerHTML = `${beatmap.stats.bpm.min} - ${beatmap.stats.bpm.max} (${beatmap.stats.bpm.common})`;
  };

  if (cache['beatmap.stats.objects.circles'] != beatmap.stats.objects.circles) {
    cache['beatmap.stats.objects.circles'] = beatmap.stats.objects.circles;
    document.querySelector('.beatmap-circles').innerHTML = `circles: ${beatmap.stats.objects.circles}`;
  };

  if (cache['beatmap.stats.objects.sliders'] != beatmap.stats.objects.sliders) {
    cache['beatmap.stats.objects.sliders'] = beatmap.stats.objects.sliders;
    document.querySelector('.beatmap-sliders').innerHTML = `sliders: ${beatmap.stats.objects.sliders}`;
  };

  if (cache['beatmap.stats.objects.spinners'] != beatmap.stats.objects.spinners) {
    cache['beatmap.stats.objects.spinners'] = beatmap.stats.objects.spinners;
    document.querySelector('.beatmap-spinners').innerHTML = `spinners: ${beatmap.stats.objects.spinners}`;
  };

  if (cache['beatmap.stats.objects.holds'] != beatmap.stats.objects.holds) {
    cache['beatmap.stats.objects.holds'] = beatmap.stats.objects.holds;
    document.querySelector('.beatmap-holds').innerHTML = `holds: ${beatmap.stats.objects.holds}`;
  };

  const array = Object.keys(performance.accuracy);
  for (let i = 0; i < array.length; i++) {
    const key = array[i];
    const value = performance.accuracy[key];
    if (['strains', 'strainsAll'].includes(key)) continue;

    if (cache[`performance.accuracy.${key}`] != performance.accuracy[key]) {
      cache[`performance.accuracy.${key}`] = performance.accuracy[key];

      try {
        document.querySelector(`.beatmap-pp-${key}`).innerHTML = Math.round(value) + "pp";

      } catch (error) {
        console.log(key, value, error);
      }
    };
  };

  if (cache['play.hits[300]'] != play.hits[300]) {
    cache['play.hits[300]'] = play.hits[300];
    document.querySelector('.hits-300').innerHTML = `${play.hits[300]}x300`;
  };

  if (cache['play.hits[100]'] != play.hits[100]) {
    cache['play.hits[100]'] = play.hits[100];
    document.querySelector('.hits-100').innerHTML = `${play.hits[100]}x100`;
  };

  if (cache['play.hits[50]'] != play.hits[50]) {
    cache['play.hits[50]'] = play.hits[50];
    document.querySelector('.hits-50').innerHTML = `${play.hits[50]}x50`;
  };

  if (cache['play.hits[0]'] != play.hits[0]) {
    cache['play.hits[0]'] = play.hits[0];
    document.querySelector('.hits-0').innerHTML = `${play.hits[0]}xMiss`;
  };

  if (cache['play.hits.geki'] != play.hits.geki) {
    cache['play.hits.geki'] = play.hits.geki;
    document.querySelector('.hits-geki').innerHTML = `${play.hits.geki}xGeki`;
  };

  if (cache['play.hits.katu'] != play.hits.katu) {
    cache['play.hits.katu'] = play.hits.katu;
    document.querySelector('.hits-katu').innerHTML = `${play.hits.katu}xKatu`;
  };

  if (cache['play.hits.sliderBreaks'] != play.hits.sliderBreaks) {
    cache['play.hits.sliderBreaks'] = play.hits.sliderBreaks;
    document.querySelector('.hits-sb').innerHTML = `${play.hits.sliderBreaks}xSB`;
  };


  if (cache['resultsScreen.hits[300]'] != resultsScreen.hits[300]) {
    cache['resultsScreen.hits[300]'] = resultsScreen.hits[300];
    document.querySelector('.resultsScreen-300').innerHTML = `${resultsScreen.hits[300]}x300`;
  };

  if (cache['resultsScreen.hits[100]'] != resultsScreen.hits[100]) {
    cache['resultsScreen.hits[100]'] = resultsScreen.hits[100];
    document.querySelector('.resultsScreen-100').innerHTML = `${resultsScreen.hits[100]}x100`;
  };

  if (cache['resultsScreen.hits[50]'] != resultsScreen.hits[50]) {
    cache['resultsScreen.hits[50]'] = resultsScreen.hits[50];
    document.querySelector('.resultsScreen-50').innerHTML = `${resultsScreen.hits[50]}x50`;
  };

  if (cache['resultsScreen.hits[0]'] != resultsScreen.hits[0]) {
    cache['resultsScreen.hits[0]'] = resultsScreen.hits[0];
    document.querySelector('.resultsScreen-0').innerHTML = `${resultsScreen.hits[0]}xMiss`;
  };

  if (cache['resultsScreen.hits.geki'] != resultsScreen.hits.geki) {
    cache['resultsScreen.hits.geki'] = resultsScreen.hits.geki;
    document.querySelector('.resultsScreen-geki').innerHTML = `${resultsScreen.hits.geki}xGeki`;
  };

  if (cache['resultsScreen.hits.katu'] != resultsScreen.hits.katu) {
    cache['resultsScreen.hits.katu'] = resultsScreen.hits.katu;
    document.querySelector('.resultsScreen-katu').innerHTML = `${resultsScreen.hits.katu}xKatu`;
  };

  if (cache['resultScreen-mode'] != resultsScreen.mode.number) {
    cache['resultScreen-mode'] = resultsScreen.mode.number;


    if (resultsScreen.mode.number >= 0 && resultsScreen.mode.number <= 3) document.querySelector('.resultsScreen-mode').innerHTML = `${resultsScreen.mode.name} <img width="30px" height="30px" src="images/${resultsScreen.mode.name.toLowerCase()}.png" />`;
    else document.querySelector('.resultsScreen-mode').innerHTML = resultsScreen.mode.number;
  };

  if (cache['resultsScreen.name'] != resultsScreen.name) {
    cache['resultsScreen.name'] = resultsScreen.name;
    document.querySelector('.resultsScreen-name').innerHTML = resultsScreen.name;
  };

  if (cache['resultsScreen.mods.name'] != resultsScreen.mods.name || cache['resultsScreen.mods.number'] != resultsScreen.mods.number) {
    cache['resultsScreen.mods.name'] = resultsScreen.mods.name;
    cache['resultsScreen.mods.number'] = resultsScreen.mods.number;
    document.querySelector('.resultsScreen-mods').innerHTML = `${resultsScreen.mods.name} (${resultsScreen.mods.number})`;
  };

  if (cache['resultsScreen.score'] != resultsScreen.score) {
    cache['resultsScreen.score'] = resultsScreen.score;
    document.querySelector('.resultsScreen-score').innerHTML = spaceit(resultsScreen.score);
  };

  if (cache['resultsScreen.maxCombo'] != resultsScreen.maxCombo) {
    cache['resultsScreen.maxCombo'] = resultsScreen.maxCombo;
    document.querySelector('.resultsScreen-maxCombo').innerHTML = spaceit(resultsScreen.maxCombo) + 'x';
  };

  if (cache['resultsScreen.rank'] != resultsScreen.rank) {
    cache['resultsScreen.rank'] = resultsScreen.rank;
    document.querySelector('.resultsScreen-rank').innerHTML = resultsScreen.rank;
  };

  if (cache['resultsScreen.createdAt'] != resultsScreen.createdAt) {
    cache['resultsScreen.createdAt'] = resultsScreen.createdAt;
    document.querySelector('.resultsScreen-createdAt').innerHTML = resultsScreen.createdAt;
  };
});


socket.api_v2_precise((data) => {
  if (cache['data.keys.k1.count'] != data.keys.k1.count.toFixed(0)) {
    cache['data.keys.k1.count'] = data.keys.k1.count.toFixed(0);
    document.querySelector('.k1 .number').innerHTML = data.keys.k1.count.toFixed(0);
  };

  if (cache['data.keys.k2.count'] != data.keys.k2.count.toFixed(0)) {
    cache['data.keys.k2.count'] = data.keys.k2.count.toFixed(0);
    document.querySelector('.k2 .number').innerHTML = data.keys.k2.count.toFixed(0);
  };

  if (cache['data.keys.m1.count'] != data.keys.m1.count.toFixed(0)) {
    cache['data.keys.m1.count'] = data.keys.m1.count.toFixed(0);
    document.querySelector('.m1 .number').innerHTML = data.keys.m1.count.toFixed(0);
  };

  if (cache['data.keys.m2.count'] != data.keys.m2.count.toFixed(0)) {
    cache['data.keys.m2.count'] = data.keys.m2.count.toFixed(0);
    document.querySelector('.m2 .number').innerHTML = data.keys.m2.count.toFixed(0);
  };
});



function secondsToHumanReadable(seconds) {
  const hours = Math.floor(seconds / 3600000);
  seconds -= hours * 3600000;

  const minutes = Math.floor(seconds / 60000);
  seconds -= minutes * 60000;

  const remainingSeconds = Math.floor(seconds / 1000);

  let result = "";
  if (hours > 0) {
    result += hours + "h ";
  }
  if (minutes > 0 || hours > 0) {
    result += minutes + "min ";
  }
  result += remainingSeconds + "s";

  return result;
}