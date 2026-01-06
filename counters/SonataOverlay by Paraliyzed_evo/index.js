import WebSocketManager from './js/socket.js';
import CanvasKeys from './js/canvas.js';
import {createChartConfig, createChartConfig2, toChartData, FAST_SMOOTH_TYPE_MULTIPLE_WIDTH, FAST_SMOOTH_TYPE_NO_SMOOTHING, fastSmooth, max} from "./js/graph.js";
import {hitJudgementsAdd, hitJudgementsClear, tapJudgement} from "./js/setups_functions.js";
import {initApiSocket, getMapDataSet, getMapScores, getUserDataSet, getUserTop, postUserID, setOsuCredentials, setprofileColor} from "./js/api_functions.js";

window.socket = new WebSocketManager('127.0.0.1:24050');
initApiSocket(window.socket);

const cache = {};

const keys = {
    k1: new CanvasKeys({
      canvasID: 'k1',
    }),
    k2: new CanvasKeys({
      canvasID: 'k2',
    }),
    m1: new CanvasKeys({
      canvasID: 'm1',
    }),
    m2: new CanvasKeys({
      canvasID: 'm2',
    }),
  };

const score = new CountUp('score', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const acc = new CountUp('acc', 0, 0, 2, 1, { useEasing: true, useGrouping: true, separator: " ", decimal: ".", suffix: "%" })
const h100 = new CountUp('h100', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: ".", suffix: "x" })
const h50 = new CountUp('h50', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: ".", suffix: "x" })
const h0 = new CountUp('h0', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: ".", suffix: "x" })
const hSB = new CountUp('hSB', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: ".", suffix: "x" })

const channels2 = new Set(["speed"]);
const channels = new Set(["aim"]);

let progressbar;
let rankingPanelSet;
let fullTime;
let seek;
let onepart;
let tickPos;
let tempAvg;
let tempSmooth;
let currentErrorValue;
let tempHitErrorArrayLength;
let error_h300;
let error_h100;

let leaderboardFetch;
let tempSlotLength;
let tempMapScores = [];
let playerPosition;
let LocalNameData;
let LocalResultNameData;

let graphSmoothing = 0;
let configDarker = createChartConfig2('rgba(60, 60, 60, 0.6)');
let configLighter = createChartConfig('rgba(0, 0, 0, 1)');
let configDarker2 = createChartConfig2('rgba(60, 60, 60, 0.6)');
let configLighter2 = createChartConfig('rgba(0, 0, 0, 1)');
let chartDarker;
let chartLighter;
let chartDarker2;
let chartLighter2;

let tick = [];
for (let t = 0; t < 200; t++) {
    tick[t] = document.querySelectorAll("[id^=tick]")[t];
}

function calculate_od(temp) {
    error_h300 = 83 - (6 * temp);
    error_h100 = 145 - (8 * temp);
    l100.style.width = `${error_h100 * 3.3}px`
    l300.style.width = `${error_h300 * 3.3}px`
}

const spaceit = (text) => text.toLocaleString().replace(/,/g, ' ');

const formatNumber = n => {
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
  };

function renderGraph2(graphData) {
    if (chartDarker === undefined || chartDarker2 === undefined) {
        return;
      }

//   console.time('[GRAPH SMOOTHING]');
  const data = new Float32Array(graphData.xaxis.length);
  for (const series of graphData.series) {
    if (!channels2.has(series.name)) {
      continue;
    }

    for (let i = 0; i < data.length && i < series.data.length; i++) {
      data[i] = series.data[i];
    }
  }
  const percent = max(data) / 100;
  let drainSamples = 0;
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.max(0, data[i]);

    if (data[i] > percent) {
      drainSamples++;
    }
  }

  const windowWidth = 0.00609 * drainSamples + 0.88911;
  const smoothness = Math.max(FAST_SMOOTH_TYPE_NO_SMOOTHING, Math.min(graphSmoothing, FAST_SMOOTH_TYPE_MULTIPLE_WIDTH));

  const fs2 = toChartData(
    fastSmooth(data, windowWidth, smoothness)
    );

//   console.timeEnd('[GRAPH SMOOTHING]');

  configDarker.data.datasets[0].data = fs2;
  configDarker.data.labels = fs2;

  configDarker2.data.datasets[0].data = fs2;
  configDarker2.data.labels = fs2;

  chartDarker.update();
  chartDarker2.update();
}

function renderGraph(graphData) {
    if (chartLighter === undefined || chartLighter2 === undefined) {
        return;
      }
    // console.time('[GRAPH SMOOTHING]');
    const data = new Float32Array(graphData.xaxis.length);
    for (const series of graphData.series) {
      if (!channels.has(series.name)) {
        continue;
      }
  
      for (let i = 0; i < data.length && i < series.data.length; i++) {
        data[i] = series.data[i];
      }
    }
    const percent = max(data) / 100;
    let drainSamples = 0;
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.max(0, data[i]);
  
      if (data[i] > percent) {
        drainSamples++;
      }
    }
  
    const windowWidth = 0.00609 * drainSamples + 0.88911;
    const smoothness = Math.max(FAST_SMOOTH_TYPE_NO_SMOOTHING, Math.min(graphSmoothing, FAST_SMOOTH_TYPE_MULTIPLE_WIDTH));
  
    const fs = toChartData(
      fastSmooth(data, windowWidth, smoothness)
      );
  
    // console.timeEnd('[GRAPH SMOOTHING]');
  
    configLighter.data.datasets[0].data = fs;
    configLighter.data.labels = fs;

    configLighter2.data.datasets[0].data = fs;
    configLighter2.data.labels = fs;
  
    chartLighter.update();
    chartLighter2.update();
  }

window.onload = () => {
    chartDarker = new Chart(
      document.querySelector('.darker').getContext('2d'),
      configDarker
    );

    chartLighter = new Chart(
        document.querySelector('.lighter').getContext('2d'),
      configLighter
    );

    chartDarker2 = new Chart(
        document.querySelector('.darker2').getContext('2d'),
        configDarker2
      );
  
    chartLighter2 = new Chart(
        document.querySelector('.lighter2').getContext('2d'),
      configLighter2
    );
  };

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands(async (data) => {
    try {
      const { command, message } = data;
      // get updates for "getSettings" command
      if (command !== 'getSettings' || !message) return;

      console.log(command, message);

      if (cache['apikey'] !== message['apikey']) {
        cache['apikey'] = message['apikey'];
        await setOsuCredentials(cache['apikey']);
      }

      if (cache['Client'] && cache['Secret']) {
        await setOsuCredentials(cache['Client'], cache['Secret']);
      }

      if (cache['LocalNameData'] !== message['LocalNameData']) {
        cache['LocalNameData'] = message['LocalNameData'];
      }

      if (cache['GBrank'] !== message['GBrank']) {
        cache['GBrank'] = message['GBrank'];
      }

      if (cache['ppGB'] !== message['ppGB']) {
        cache['ppGB'] = message['ppGB'];
      }

      if (cache['CTrank'] !== message['CTrank']) {
        cache['CTrank'] = message['CTrank'];
      }

      if (cache['CTcode'] !== message['CTcode']) {
        cache['CTcode'] = message['CTcode']
      }

      if (cache['mapid0'] !== message['mapid0']) {
        cache['mapid0'] = message['mapid0'];
      }
      if (cache['mapid1'] !== message['mapid1']) {
        cache['mapid1'] = message['mapid1'];
      }
      if (cache['mapid2'] !== message['mapid2']) {
        cache['mapid2'] = message['mapid2'];
      }
      if (cache['mapid3'] !== message['mapid3']) {
        cache['mapid3'] = message['mapid3'];
      }
      if (cache['mapid4'] !== message['mapid4']) {
        cache['mapid4'] = message['mapid4'];
      }
      if (cache['mapid5'] !== message['mapid5']) {
        cache['mapid5'] = message['mapid5'];
      }

      if (cache['ppResult0'] !== message['ppResult0']) {
        cache['ppResult0'] = message['ppResult0'];
      }
      if (cache['ppResult1'] !== message['ppResult1']) {
        cache['ppResult1'] = message['ppResult1'];
      }
      if (cache['ppResult2'] !== message['ppResult2']) {
        cache['ppResult2'] = message['ppResult2'];
      }
      if (cache['ppResult3'] !== message['ppResult3']) {
        cache['ppResult3'] = message['ppResult3'];
      }
      if (cache['ppResult4'] !== message['ppResult4']) {
        cache['ppResult4'] = message['ppResult4'];
      }
      if (cache['ppResult5'] !== message['ppResult5']) {
        cache['ppResult5'] = message['ppResult5'];
      }

      if (cache['modsid0'] !== message['modsid0']) {
        cache['modsid0'] = message['modsid0'];
      }
      if (cache['modsid1'] !== message['modsid1']) {
        cache['modsid1'] = message['modsid1'];
      }
      if (cache['modsid2'] !== message['modsid2']) {
        cache['modsid2'] = message['modsid2'];
      }
      if (cache['modsid3'] !== message['modsid3']) {
        cache['modsid3'] = message['modsid3'];
      }
      if (cache['modsid4'] !== message['modsid4']) {
        cache['modsid4'] = message['modsid4'];
      }
      if (cache['modsid5'] !== message['modsid5']) {
        cache['modsid5'] = message['modsid5'];
      }

      if (cache['rankResult0'] !== message['rankResult0']) {
        cache['rankResult0'] = message['rankResult0'];
      }
      if (cache['rankResult1'] !== message['rankResult1']) {
        cache['rankResult1'] = message['rankResult1'];
      }
      if (cache['rankResult2'] !== message['rankResult2']) {
        cache['rankResult2'] = message['rankResult2'];
      }
      if (cache['rankResult3'] !== message['rankResult3']) {
        cache['rankResult3'] = message['rankResult3'];
      }
      if (cache['rankResult4'] !== message['rankResult4']) {
        cache['rankResult4'] = message['rankResult4'];
      }
      if (cache['rankResult5'] !== message['rankResult5']) {
        cache['rankResult5'] = message['rankResult5'];
      }

      if (cache['date0'] !== message['date0']) {
        cache['date0'] = message['date0'];
      }
      if (cache['date1'] !== message['date1']) {
        cache['date1'] = message['date1'];
      }
      if (cache['date2'] !== message['date2']) {
        cache['date2'] = message['date2'];
      }
      if (cache['date3'] !== message['date3']) {
        cache['date3'] = message['date3'];
      }
      if (cache['date4'] !== message['date4']) {
        cache['date4'] = message['date4'];
      }
      if (cache['date5'] !== message['date5']) {
        cache['date5'] = message['date5'];
      }

      if (cache['LBEnabled'] !== message['LBEnabled']) {
        cache['LBEnabled'] = message['LBEnabled'];
        if (message['LBEnabled'] === true) {
            leaderboard.style.display = 'block';
        }
        else {
            leaderboard.style.display = 'none';
        }
      }

      if (cache['HidePanel'] !== message['HidePanel']) {
        cache['HidePanel'] = message['HidePanel'];
        if (message['HidePanel'] === true) {
            RankingPanel.style.display = 'none';
            rankingPanelBG.style.display = 'none';
        }
        else {
            RankingPanel.style.display = 'flex';
            rankingPanelBG.style.display = 'block';
        }
      }

      if (cache['HideKeys'] !== message['HideKeys']) {
        cache['HideKeys'] = message['HideKeys'];
        if (message['HideKeys'] === true) {
            KeyOverlayCont.style.display = 'none';
        }
        else {
            KeyOverlayCont.style.display = 'block';
        }
      }
      
      if (cache['HideGraphStats'] !== message['HideGraphStats']) {
        cache['HideGraphStats'] = message['HideGraphStats'];
        if (message['HideGraphStats'] === true) {
            smallStats.style.opacity = '0';
            judgeInfo.style.opacity = '0';
        }
        else {
            smallStats.style.opacity = '1';
            judgeInfo.style.opacity = '1';
        }
      }

      if (cache['HideBottom'] !== message['HideBottom']) {
        cache['HideBottom'] = message['HideBottom'];
        if (message['HideBottom'] === true) {
            gpbottom.style.display = 'none';
        }
        else {
            gpbottom.style.display = 'flex';
        }
      }

      if (cache['LBOptions'] !== message['LBOptions']) {
        cache['LBOptions'] = message['LBOptions'];
      }

      if (message['Recorder'] != null) {
          document.getElementById("recorderName").innerHTML = `${message['Recorder']}`;
          document.getElementById("resultRecorder").innerHTML = `` + `${message['Recorder']}`;
      }

      if (cache['ColorSet'] !== message['ColorSet']) {
        cache['ColorSet'] = message['ColorSet'];

        if (cache['ColorSet'] === `Manual`) {
            const ColorData1 = `${message['HueID']}, ${message['SaturationID']}%, 50%`;
            const ColorData2 = `${message['HueID2']}, ${message['SaturationID2']}%, 50%`;
            const ColorResultLight = `${message['HueID']}, ${message['SaturationID']}%, 82%`;
            const ColorResultDark = `${message['HueID']}, ${message['SaturationID']}%, 6%`;
    
            document.querySelectorAll('.hpColor1').forEach(e => e.style.fill = `hsl(${ColorData1})`);
            document.querySelectorAll('.hpColor2').forEach(e => e.style.fill = `hsl(${ColorData2})`);
    
            configLighter.data.datasets[0].backgroundColor = `hsl(${ColorData1})`;
            configLighter2.data.datasets[0].backgroundColor = `hsl(${ColorData1})`;
    
            smallStats.style.backgroundColor = `hsl(${ColorData1})`;
    
            combo_box.style.backgroundColor = `hsl(${ColorData1})`;
            combo_box.style.filter = `drop-shadow(0 0 10px hsla(${ColorData1}))`;
    
            pp_box.style.backgroundColor = `hsl(${ColorData2})`;
            pp_box.style.filter = `drop-shadow(0 0 10px hsla(${ColorData2}))`;
    
            document.querySelector('.keys.k1').style.setProperty('--press', `hsl(${ColorData1})`);
            document.querySelector('.keys.k2').style.setProperty('--press', `hsl(${ColorData1})`);
            document.querySelector('.keys.m1').style.setProperty('--press', `hsl(${ColorData2})`);
            document.querySelector('.keys.m2').style.setProperty('--press', `hsl(${ColorData2})`);
    
            keys.k1.color = `hsla(${ColorData1}, 0.8)`;
            keys.k2.color = `hsla(${ColorData1}, 0.8)`;
            keys.m1.color = `hsla(${ColorData2}, 0.8)`;
            keys.m2.color = `hsla(${ColorData2}, 0.8)`;
    
            lbcpLine.style.backgroundColor = `hsl(${ColorData1})`;
            lbcpLine.style.boxShadow = `0 0 10px 2px hsla(${ColorData1}, 0.5)`;
    
            RankingPanel.style.backgroundColor = `hsla(${ColorResultDark}, 0.9)`;
    
            SonataTextResult.style.color = `hsl(${ColorResultLight})`;
            bgborder.style.border = `3px solid hsl(${ColorResultLight})`;
            StatsBPM.style.border = `3px solid hsl(${ColorResultLight})`;
    
            CSLine.style.border = `3px solid hsl(${ColorResultLight})`;
            ARLine.style.border = `3px solid hsl(${ColorResultLight})`;
            ODLine.style.border = `3px solid hsl(${ColorResultLight})`;
            HPLine.style.border = `3px solid hsl(${ColorResultLight})`;
    
            PHCS.style.color = `hsl(${ColorResultLight})`;
            PHAR.style.color = `hsl(${ColorResultLight})`;
            PHOD.style.color = `hsl(${ColorResultLight})`;
            PHHP.style.color = `hsl(${ColorResultLight})`;
    
            CSGlow.style.backgroundColor = `hsl(${ColorResultLight})`;
            ARGlow.style.backgroundColor = `hsl(${ColorResultLight})`;
            ODGlow.style.backgroundColor = `hsl(${ColorResultLight})`;
            HPGlow.style.backgroundColor = `hsl(${ColorResultLight})`;
    
            MiddleBar.style.backgroundColor = `hsl(${ColorResultLight})`;
    
            chartLighter.update();
            chartLighter2.update();
          }
      }

    } catch (error) {
      console.log(error);
    }
  });
  
  socket.api_v2(({ state, settings, performance, resultsScreen, play, beatmap, folders, files, directPath, client, userProfile}) => {
    try {
        const requiredElements = [
            'gptop', 'gpbottom', 'URCont', 'avgHitError', 'leaderboard',
            'lbcpPosition', 'lbopCont', 'currentplayerCont', 'lbcpLine',
            'strainGraph', 'progress', 'progress100', 'progress50', 'progress0', 'progressSB',
            'recorderContainer', 'combo_text2', 'combo_text', 'combo_max', 'combo_x',
            'combo_box', 'pp_box', 'pp_txt', 'hpBar'
        ];
        
        const allExist = requiredElements.every(id => document.getElementById(id) !== null);
        if (!allExist) {
            console.log('Waiting for DOM elements to load...');
            return;
        }     

        if (cache['client'] !== client) {
            cache['client'] = client;
            if (client === "lazer") {
              mapBG.style.display = `none`;
            }
            else {
              mapBG.style.display = `block`;
            }
          }
        
        if (cache['profileColor'] !== userProfile.backgroundColour) {
            cache['profileColor'] = userProfile.backgroundColour;
            setprofileColor(cache['profileColor']);
        }
        if (cache['showInterface'] !== settings.interfaceVisible) {
            cache['showInterface'] = settings.interfaceVisible;
        }
        if (cache['data.menu.state'] !== state.number || cache['data.menu.state.name'] !== state.name) {
            cache['data.menu.state'] = state.number;
            cache['data.menu.state.name'] = state.name;
        }
        if (cache['mode'] !== play.mode.name) {
            cache['mode'] = play.mode.name;
            global.style.backgroundImage = `url(./static/mode/${cache['mode']}.png)`;
        }
        if (cache['hp.normal'] !== play.healthBar.normal.toFixed(2)) {
            cache['hp.normal'] = play.healthBar.normal.toFixed(2);
        }
        if (cache['play.name'] !== play.playerName) {
            cache['play.name'] = play.playerName;
            if (cache['play.name'] === "") {
                LocalNameData = cache['LocalNameData'] || 'Alayna';
            }
            else {
                LocalNameData = cache['play.name'];
            }
            username.innerHTML = LocalNameData;
            lbcpName.innerHTML = LocalNameData;
            setupUser(LocalNameData);
        }
        if (cache['play.rank.current'] !== play.rank.current) {
            cache['play.rank.current'] = play.rank.current;
            lbcpRanking.innerHTML = cache['play.rank.current'].replace("H", "");
            lbcpRanking.setAttribute('class', `${play.rank.current} lb_Rank`);
        }
        if (cache['play.accuracy'] !== play.accuracy.toFixed(2)) {
            cache['play.accuracy'] = play.accuracy.toFixed(2);
            lbcpAcc.innerHTML = cache['play.accuracy'] + `%`;
            acc.innerHTML = cache['play.accuracy'];
            acc.update(cache['play.accuracy']);
        }
        if (cache['play.score'] !== play.score) {
            cache['play.score'] = play.score;
	        tempAvg = 0;
            lbcpScore.innerHTML = formatNumber(cache['play.score']);
            score.innerHTML = cache['play.score'];
            score.update(cache['play.score']);
        }
        if (cache['play.combo.current'] !== play.combo.current) {
            cache['play.combo.current'] = play.combo.current;
            combo_count.innerHTML = cache['play.combo.current'];
        }
        if (cache['play.combo.max'] !== play.combo.max) {
            cache['play.combo.max'] = play.combo.max;
            lbcpCombo.innerHTML = spaceit(cache['play.combo.max']) + `x`;
            combo_max.innerHTML = ` / ` + cache['play.combo.max'] + `x`;
        }
        if (cache['play.pp.current'] !== play.pp.current.toFixed(0)) {
            cache['play.pp.current'] = play.pp.current.toFixed(0);
            lbcpPP.innerHTML = cache['play.pp.current'] + `pp`;
            pp_txt.innerHTML = cache['play.pp.current'];
        }
        if (cache['play.pp.fc'] !== play.pp.fc.toFixed(0)) {
            cache['play.pp.fc'] = play.pp.fc.toFixed(0);
            ppfc_txt.innerHTML = cache['play.pp.fc'];
        }
        if (cache['unstableRate'] !== play.unstableRate) {
            cache['unstableRate'] = play.unstableRate;
            URIndex.innerHTML = cache['unstableRate'].toFixed(0);
        }
        if (cache['beatmap_rankedStatus'] !== beatmap.status.number) {
            cache['beatmap_rankedStatus'] = beatmap.status.number;

            switch (cache['beatmap_rankedStatus']) {
                case 4:
                    rankStatus.style.backgroundImage = `url('./static/state/ranked.png')`;
                    break;
                case 7:
                    rankStatus.style.backgroundImage = `url('./static/state/loved.png')`;
                    break;
                case 5:
                case 6:
                    rankStatus.style.backgroundImage = `url('./static/state/qualified.png')`;
                    break;
                default:
                    rankStatus.style.backgroundImage = `url('./static/state/unranked.png')`;
                    break;
            }
        }

        if (chartDarker !== undefined && chartLighter !== undefined) {
            const dataString = JSON.stringify(performance.graph);
            if (cache.difficultyGraph !== dataString) {
              cache.difficultyGraph = dataString;
      
              renderGraph(performance.graph);
              renderGraph2(performance.graph);
            }
          }

        if (cache['beatmap.stats.ar.converted'] !== beatmap.stats.ar.converted) {
            cache['beatmap.stats.ar.converted'] = beatmap.stats.ar.converted;
            ARText.innerHTML = cache['beatmap.stats.ar.converted'].toFixed(2);
        }
        if (cache['beatmap.stats.cs.converted'] !== beatmap.stats.cs.converted) {
            cache['beatmap.stats.cs.converted'] = beatmap.stats.cs.converted;
            CSText.innerHTML = cache['beatmap.stats.cs.converted'].toFixed(2);
        }
        if (cache['beatmap.stats.od.converted'] !== beatmap.stats.od.converted) {
            cache['beatmap.stats.od.converted'] = beatmap.stats.od.converted;
            ODText.innerHTML = cache['beatmap.stats.od.converted'].toFixed(2);
            calculate_od(cache['beatmap.stats.od.converted']);
        }
        if (cache['beatmap.stats.hp.converted'] !== beatmap.stats.hp.converted) {
            cache['beatmap.stats.hp.converted'] = beatmap.stats.hp.converted;
            HPText.innerHTML = cache['beatmap.stats.hp.converted'].toFixed(2);
        }
        if (cache['stars.live'] !== beatmap.stats.stars.live || cache['stars.total'] !== beatmap.stats.stars.total) {
            cache['stars.live'] = beatmap.stats.stars.live;
            cache['stars.total'] = beatmap.stats.stars.total;
            starsCurrent.innerHTML = cache['stars.live'];
            starRating.innerHTML = cache['stars.total'] + ` <i class="fas fa-star" style='color: #f7ff4a;'></i>`
        }
        if (cache['beatmap.stats.bpm.common'] !== beatmap.stats.bpm.common) {
            cache['beatmap.stats.bpm.common'] = beatmap.stats.bpm.common;
            StatsBPM.innerHTML = cache['beatmap.stats.bpm.common'] + 'BPM';
        }
        if (cache['beatmap.stats.maxCombo'] !== beatmap.stats.maxCombo) {
            cache['beatmap.stats.maxCombo'] = beatmap.stats.maxCombo;
        }
        if (cache['beatmap.artist'] !== beatmap.artist) {
            cache['beatmap.artist'] = beatmap.artist;
            Artist.innerHTML = `by ` + cache['beatmap.artist'];
        }
        if (cache['beatmap.title'] !== beatmap.title) {
            cache['beatmap.title'] = beatmap.title;
            Song.innerHTML = cache['beatmap.title'];
        }
        if (cache['beatmap.mapper'] !== beatmap.mapper) {
            cache['beatmap.mapper'] = beatmap.mapper;
            Mapper.innerHTML = `Mapped by ` + cache['beatmap.mapper'];
        }
        if (cache['beatmap.time.live'] !== beatmap.time.live) {
            cache['beatmap.time.live'] = beatmap.time.live;
        }
        if (cache['beatmap.version'] !== beatmap.version) {
            cache['beatmap.version'] = beatmap.version;
        }
        if (cache['beatmap.time.firstObject'] !== beatmap.time.firstObject) {
            cache['beatmap.time.firstObject'] = beatmap.time.firstObject;
        }
        if (cache['beatmap.time.lastObject'] !== beatmap.time.lastObject) {
            cache['beatmap.time.lastObject'] = beatmap.time.lastObject;
        }
        if (cache['beatmap.time.mp3Length'] !== beatmap.time.mp3Length) {
            cache['beatmap.time.mp3Length'] = beatmap.time.mp3Length;
        }
        if (cache['beatmap.id'] !== beatmap.id) {
            cache['beatmap.id'] = beatmap.id;
        }
        if (cache['h100'] !== play.hits['100']) {
            cache['h100'] = play.hits['100'];
            h100.update(cache['h100']);
            h100Text.innerHTML = cache['h100'] + 'x';
            tapJudgement(`100`)
            hitJudgementsAdd(`100`, progressbar);
            if (cache['h100'] > 0) {
                graph100.style.height = "8px";
            }
            else {
                graph100.style.height = "0px";
                hitJudgementsClear(`100`);
            }
        }

        if (cache['h50'] !== play.hits['50']) {
            cache['h50'] = play.hits['50'];
            h50.update(cache['h50']);
            h50Text.innerHTML = cache['h50'] + 'x';
            tapJudgement(`50`)
            hitJudgementsAdd(`50`, progressbar);
            if (cache['h50'] > 0) {
                graph50.style.height = "8px";
            }
            else {
                graph50.style.height = "0px";
                hitJudgementsClear(`50`);
            }
        }
    
        if (cache['h0'] !== play.hits['0']) {
            cache['h0'] = play.hits['0'];
            h0.update(cache['h0']);
            h0Text.innerHTML = cache['h0'] + 'x';
            tapJudgement(`0`)
            hitJudgementsAdd(`0`, progressbar);
            if (cache['h0'] > `0`) {
                graph0.style.height = "8px";
            }
            else {
                graph0.style.height = "0px";
                hitJudgementsClear(`0`);
            }
        }
  
        if (cache['hSB'] !== play.hits.sliderBreaks) {
            cache['hSB'] = play.hits.sliderBreaks;
            hSB.update(cache['hSB']);
            hSBText.innerHTML = cache['hSB'] + 'x';
            rSB.innerHTML = cache['hSB'];
            tapJudgement(`SB`)
            hitJudgementsAdd(`SB`, progressbar);
            if (cache['hSB'] > 0) {
                graphSB.style.height = "8px";
                rSB.style.display = 'block';
                JudgeSB.style.display = 'block';
            }
            else {
                graphSB.style.height = "0px";
                rSB.style.display = 'none';
                JudgeSB.style.display = 'none';
                hitJudgementsClear(`SB`);
            }
        }
        if (cache['play.mods.name'] !== play.mods.name || cache['play.mods.number'] !== play.mods.number) {
            cache['play.mods.name'] = play.mods.name.replace('HDHRDT', 'HDDTHR').replace('HDDRNC', 'HDNCHR');;
            cache['play.mods.number'] !== play.mods.number;

            document.getElementById("lbcpMods").innerHTML = " ";

            let modsCount = cache['play.mods.name'].length;
            for (let i = 0; i < modsCount; i++) {
                if (cache['play.mods.name'].substr(i, 2) !== " ") {
                    let modslb = document.createElement("div");
                    modslb.id = cache['play.mods.name'].substr(i, 2);
                    modslb.setAttribute("class", `modslb ${cache['play.mods.name'].substr(i, 2)}`);
                    modslb.style.backgroundImage = `url('./static/mods/${cache['play.mods.name'].substr(i, 2)}.png')`;
                    document.getElementById("lbcpMods").appendChild(modslb);
                    i++;
                }
            }
        }
        if (cache['resultsScreen.hits[300]'] !== resultsScreen.hits[300]) {
            cache['resultsScreen.hits[300]'] = resultsScreen.hits[300];
        }
        if (cache['resultsScreen.hits[100]'] !== resultsScreen.hits[100]) {
            cache['resultsScreen.hits[100]'] = resultsScreen.hits[100];
            r100.innerHTML = cache['resultsScreen.hits[100]'];
        }
        if (cache['resultsScreen.hits[50]'] !== resultsScreen.hits[50]) {
            cache['resultsScreen.hits[50]'] = resultsScreen.hits[50];
            r50.innerHTML = cache['resultsScreen.hits[50]'];
        }
        if (cache['resultsScreen.hits[0]'] !== resultsScreen.hits[0]) {
            cache['resultsScreen.hits[0]'] = resultsScreen.hits[0];
            r0.innerHTML = cache['resultsScreen.hits[0]'];
        }
        if (cache['resultsScreen.name'] !== resultsScreen.name) {
            cache['resultsScreen.name'] = resultsScreen.name;
            if (cache['resultsScreen.name'] === "") {
                LocalResultNameData = cache['LocalNameData'] || 'Alayna';
            }
            else {
                LocalResultNameData = cache['resultsScreen.name'];
            }
            PlayerName.innerHTML = LocalResultNameData;
        }
        if (cache['resultsScreen.scoreId'] !== resultsScreen.scoreId) {
            cache['resultsScreen.scoreId'] = resultsScreen.scoreId;
        }
        if (cache['resultsScreen.createdAt'] !== resultsScreen.createdAt) {
            cache['resultsScreen.createdAt'] = resultsScreen.createdAt;
            createdAt.innerHTML = `Played: ` + jQuery.timeago(resultsScreen.createdAt);
        }
        if (cache['resultsScreen.mods.name'] !== resultsScreen.mods.name || cache['resultsScreen.mods.number'] !== resultsScreen.mods.number) {
            cache['resultsScreen.mods.name'] = resultsScreen.mods.name.replace('HDHRDT', 'HDDTHR').replace('HDDRNC', 'HDNCHR');;
            cache['resultsScreen.mods.number'] = resultsScreen.mods.number;

            document.getElementById("modContainer").innerHTML = " ";

            let modsCount2 = cache['resultsScreen.mods.name'].length;
    
            for (let i = 0; i < modsCount2; i++) {
                if (cache['resultsScreen.mods.name'].substr(i, 2) !== " ") {
                    let mods = document.createElement("div");
                    mods.id = cache['resultsScreen.mods.name'].substr(i, 2);
                    mods.setAttribute("class", `mods ${cache['resultsScreen.mods.name'].substr(i, 2)}`);
                    mods.style.backgroundImage = `url('./static/mods/${cache['resultsScreen.mods.name'].substr(i, 2)}.png')`;
                    document.getElementById("modContainer").appendChild(mods);
                    i++
                }
            }
        }
        if (cache['resultScreen.accuracy'] !== resultsScreen.accuracy) {
			cache['resultScreen.accuracy'] = resultsScreen.accuracy;
			PlayerAcc.innerHTML = parseFloat(cache['resultScreen.accuracy']).toFixed(2) + '%';
		}
        if (cache['resultsScreen.maxCombo'] !== resultsScreen.maxCombo) {
            cache['resultsScreen.maxCombo'] = resultsScreen.maxCombo;
            PlayerMaxCombo.innerHTML = cache['resultsScreen.maxCombo'] + ` / ` + cache['beatmap.stats.maxCombo'] + `x`;
        }
        if (cache['resultsScreen.score'] !== resultsScreen.score) {
            cache['resultsScreen.score'] = resultsScreen.score;
            PlayerScore.innerHTML = spaceit(cache['resultsScreen.score']);
        }
        if (cache['resultsScreen.rank'] !== resultsScreen.rank) {
            cache['resultsScreen.rank'] = resultsScreen.rank;
            rankingResult.innerHTML = cache['resultsScreen.rank'].replace("H", "");
            rankingResult.setAttribute('class', `${resultsScreen.rank}`);
        }
        if (cache['resultsScreen.pp.fc'] !== Math.round(resultsScreen.pp.fc)) {
            cache['resultsScreen.pp.fc'] = Math.round(resultsScreen.pp.fc);
            PPResultIfFC.innerHTML = `| FC: ` + cache['resultsScreen.pp.fc'] + 'pp';
            if (cache['resultsScreen.hits[0]'] === 0 && cache['hSB'] === 0) {
                PPResultIfFC.style.display = `none`;
            }
            else {
                PPResultIfFC.style.display = `block`;
            }
        }
        if (cache['resultsScreen.pp.current'] !== Math.round(resultsScreen.pp.current)) {
            cache['resultsScreen.pp.current'] = Math.round(resultsScreen.pp.current);
            PPResult.innerHTML = cache['resultsScreen.pp.current'] + 'pp';
        }
        if (cache['folders.beatmap'] !== folders.beatmap) {
            cache['folders.beatmap'] = folders.beatmap;
        }
        if (cache['files.beatmap'] !== files.beatmap) {
            cache['files.beatmap'] = files.beatmap;
        }
        if (cache['files.background'] !== files.background) {
            cache['files.background'] = files.background;
        }

        if (cache['BPMLive'] !== beatmap.stats.bpm.realtime) {
            cache['BPMLive'] = beatmap.stats.bpm.realtime;
            BPMlive.innerHTML = cache['BPMLive'];
            bpmflash.style.opacity = 0;
            setTimeout(function() {
                bpmflash.style.opacity = 1;
            }, 200);
        }

        if (cache['menu.bm.path.full'] != directPath.beatmapBackground) {
            cache['menu.bm.path.full'] = directPath.beatmapBackground;
        
            const background_path = directPath.beatmapBackground.replace(folders.songs, '');
        
            const background = document.getElementById('rankingPanelBG')
            const background2 = document.getElementById('RBG')
  
            setTimeout(() => {
              background.src = `http://127.0.0.1:24050/files/beatmap/${background_path}`;
              background2.src = `http://127.0.0.1:24050/files/beatmap/${background_path}`;
            }, 200);
        
            const image = new Image();
            image.src = `http://127.0.0.1:24050/files/beatmap/${background_path}`;
          }

        const cachedim = settings.background.dim / 100;
        const normalizedFolder = cache['folders.beatmap'].replace(/\\/g, "/");
        const Folder = normalizedFolder.split("/").map(encodeURIComponent).join("/");
        const Img = cache['files.background'];

        mapBG.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, ${cachedim}), rgba(0, 0, 0, ${cachedim})), url("http://127.0.0.1:24050/files/beatmap/${Folder}/${Img}")`;

        combo_wrapper.style.transform = `translateX(${cache['beatmap.stats.od.converted'] * 12.5}px)`;
        pp_wrapper.style.transform = `translateX(-${cache['beatmap.stats.od.converted'] * 12.5}px)`;
        l50.style.width = `${600 - (24 * cache['beatmap.stats.od.converted'])}px`;

        if (cache['data.menu.state'] === 2 || cache['data.menu.state'] === 7) {
            if (!gptop || !gpbottom || !URCont || !leaderboard) return;
            if (cache['data.menu.state'] !== 2) {
                if (cache['data.menu.state'] !== 7) deRankingPanel()
    
                gptop.style.opacity = 0;
        
                URCont.style.opacity = 0;
                avgHitError.style.transform = "translateX(0)";
        
                gpbottom.style.opacity = 0;
            } else {
                deRankingPanel();

                if (cache['beatmap_rankedStatus'] === 4 && cache['LBEnabled'] === true || cache['beatmap_rankedStatus'] === 7 && cache['LBEnabled'] === true || cache['beatmap_rankedStatus'] === 6 && cache['LBEnabled'] === true || cache['beatmap_rankedStatus'] === 5 && cache['LBEnabled'] === true ) {
                    lbcpPosition.innerHTML = `${playerPosition}`;
                    leaderboard.style.opacity = 1;
                }
                else {
                    lbcpPosition.innerHTML = `0`;
                    leaderboard.style.opacity = 0;
                }
                
                gptop.style.opacity = 1;
                gpbottom.style.opacity = 1;
                URCont.style.opacity = 1;
            }
        }

        if (cache['data.menu.state'] === 7) {
            if (cache[`key-k1-r`]) document.querySelector(`.keys.k1`).classList.remove('hidden');
            if (cache[`key-k2-r`]) document.querySelector(`.keys.k2`).classList.remove('hidden');
            if (cache[`key-m1-r`]) document.querySelector(`.keys.m1`).classList.remove('hidden');
            if (cache[`key-m2-r`]) document.querySelector(`.keys.m2`).classList.remove('hidden');
          }
      
      
          if (cache['data.menu.state'] !== 2 && cache['data.menu.state'] !== 7) {
            leaderboardFetch = false;
            leaderboard.style.opacity = 0;
            lbopCont.innerHTML = "";
            lbcpPosition.innerHTML = "";
            document.getElementById("currentplayerCont").style.transform = `none`;
            document.getElementById("lbcpLine").style.transform = `none`;

            delete cache[`key-k1-active`];
            delete cache[`key-k2-active`];
            delete cache[`key-m1-active`];
            delete cache[`key-m2-active`];
      
            document.querySelector(`.keys.k1`).classList.add('hidden');
            document.querySelector(`.keys.k2`).classList.add('hidden');
            document.querySelector(`.keys.m1`).classList.add('hidden');
            document.querySelector(`.keys.m2`).classList.add('hidden');
          }
        
        if (cache['data.menu.state'] === 2) {
    
            if (cache['showInterface'] === true && cache['data.menu.state'] === 2) {
                gptop.style.opacity = 0;
            } else {
                gptop.style.opacity = 1;
            }

            if (cache['beatmap_rankedStatus'] === 4 && cache['LBEnabled'] === true || cache['beatmap_rankedStatus'] === 7 && cache['LBEnabled'] === true || cache['beatmap_rankedStatus'] === 6 && cache['LBEnabled'] === true || cache['beatmap_rankedStatus'] === 5 && cache['LBEnabled'] === true ) {

            setupMapScores(cache['beatmap.id']);

            if (document.getElementById("currentplayerCont"))
                lbcpPosition.setAttribute('class', `positions N${playerPosition}`);
            
                if (playerPosition > 8) {
                    lbopCont.style.transform = `translateY(${-(playerPosition * 65)}px)`;
                    document.getElementById("currentplayerCont").style.transform = `none`;
                    document.getElementById("lbcpLine").style.transform = `none`;
                }
                else {
                    lbopCont.style.transform = `translateY(-520px)`;
                    document.getElementById("currentplayerCont").style.transform = `translateY(${(playerPosition - 8) * 65}px)`;
                    document.getElementById("lbcpLine").style.transform = `translateY(${(playerPosition - 8) * 65}px)`;
                }

            if (tempSlotLength > 0)
                for (let i = 8; i <= tempSlotLength; i++) {
                    if (i >= playerPosition && playerPosition !== 0 && document.getElementById(`playerslot${i}`)) {
                        document.getElementById(`playerslot${i}`).style.transform = `translateY(65px)`;
                        document.getElementById(`playerslot${i}`).style.opacity = `0`;
                    }
                    else if (cache['play.score'] === 0) {
                        document.getElementById(`playerslot${i}`).style.transform = `translateY(0)`;
                        document.getElementById(`playerslot${i}`).style.opacity = `1`;
                        document.getElementById(`lb_Positions_slot${i}`).innerHTML = `${i}`;
                        document.getElementById(`lb_Positions_slot${i}`).setAttribute('class', `positions N${i}`);
                    }
                }
                for (let i = 1; i <= tempSlotLength; i++) {
                    if (i >= playerPosition && playerPosition !== 0 && document.getElementById(`playerslot${i}`)) {
                        document.getElementById(`playerslot${i}`).style.transform = `translateY(65px)`;
                        document.getElementById(`lb_Positions_slot${i}`).innerHTML = `${i + 1}`;
                        document.getElementById(`lb_Positions_slot${i}`).setAttribute('class', `positions N${i + 1}`);
                    }
                    else if (cache['play.score'] === 0) {
                        document.getElementById(`playerslot${i}`).style.transform = `translateY(0)`;
                        document.getElementById(`playerslot${i}`).style.opacity = `1`;
                        document.getElementById(`lb_Positions_slot${i}`).innerHTML = `${i}`;
                        document.getElementById(`lb_Positions_slot${i}`).setAttribute('class', `positions N${i}`);
                    }
                }
            }
            else {
                lbopCont.innerHTML = " ";
                leaderboardFetch = false;
            }
        }

        if (cache['h100'] > 0 || cache['h50'] > 0 || cache['h0'] > 0) {
            strainGraph.style.transform = `translateY(-10px)`;
        }
        else {
            strainGraph.style.transform = `translateY(0)`;
        }

        if (fullTime !== cache['beatmap.time.mp3Length']){
            fullTime = cache['beatmap.time.mp3Length'];
            onepart = 1400/fullTime;
        }

        if (seek !== cache['beatmap.time.live'] && fullTime !== undefined && fullTime !== 0) {
            seek = cache['beatmap.time.live'];
            progressbar = onepart * seek / 3.74;
            progress.style.width = progressbar + 'px';
            progress100.style.transform = `translateX(${progressbar}px)`;
            progress50.style.transform = `translateX(${progressbar}px)`;
            progress0.style.transform = `translateX(${progressbar}px)`;
            progressSB.style.transform = `translateX(${progressbar}px)`;
        }

        if (cache['beatmap.time.live'] >= cache['beatmap.time.firstObject'] + 5000 && cache['beatmap.time.live'] <= cache['beatmap.time.firstObject'] + 11900 && cache['data.menu.state'] === 2) {
            recorderContainer.style.transform = 'scale(100%)';
            recorderContainer.style.opacity = '1';
        } else {
            recorderContainer.style.transform = 'scale(80%)';
            recorderContainer.style.opacity = '0';
        }

        let isBreak = cache['play.combo.current'] < cache['play.combo.max'];

        if (isBreak) {
          combo_text2.style.transform = `translateX(-${getTranslateValue(cache['play.combo.current']) + 15}px)`;
          combo_text.style.transform = `translateX(-${getMaxPxValue(cache['play.combo.max']) - 20}px)`;
          combo_max.style.opacity = 1;
          combo_x.style.display = 'none';
        } else {
          combo_text2.style.transform = `translateX(-${getTranslateValue(cache['play.combo.current'])}px)`;
          combo_text.style.transform = `translateX(0)`;
          combo_max.style.opacity = 0;
          combo_x.style.display = 'inline';
        }
  
        if (cache['play.combo.current'] < 10) { 
          combo_box.style.width = `${84 + (isBreak ? getMaxPxValue(cache['play.combo.max']) : 0)}px`;
        }
        if (cache['play.combo.current'] >= 10 && cache['play.combo.current'] < 100) { 
          combo_box.style.width = `${104 + (isBreak ? getMaxPxValue(cache['play.combo.max']) : 0)}px`;
        }
        if (cache['play.combo.current'] >= 100 && cache['play.combo.current'] < 1000) {
          combo_box.style.width = `${124 + (isBreak ? getMaxPxValue(cache['play.combo.max']) : 0)}px`;
        }
        if (cache['play.combo.current'] >= 1000 && cache['play.combo.current'] < 10000) {
          combo_box.style.width = `${159 + (isBreak ? getMaxPxValue(cache['play.combo.max']) : 0)}px`;
        }
        if (cache['play.combo.current'] >= 10000 && cache['play.combo.current'] < 1000) {
          combo_box.style.width = `${179 + (isBreak ? getMaxPxValue(cache['play.combo.max']) : 0)}px`;
        }
  
        function getMaxPxValue(x) {
          if (x < 10) return 75;
          if (x >= 10 && x < 100) return 90;
          if (x >= 100 && x < 1000) return 105;
          if (x >= 1000 && x < 10000) return 125;
        }
  
        function getTranslateValue(x) {
          if (x < 10) return 20;
          if (x >= 10 && x < 100) return 40;
          if (x >= 100 && x < 1000) return 60;
          if (x >= 1000 && x < 10000) return 95;
        }

        let pp_tx = cache['play.pp.current'] + " / " + cache['play.pp.fc'] + "pp";

        if (pp_tx.length === 7) {
          pp_box.style.width = '155px';
        }
        if (pp_tx.length === 8) {
          pp_box.style.width = '165px';
        }
        if (pp_tx.length === 9) {
          pp_box.style.width = '195px';
        }
        if (pp_tx.length === 10) {
          pp_box.style.width = '215px';
        }
        if (pp_tx.length === 11) {
          pp_box.style.width = '235px';
        }
        if (pp_tx.length === 12) {
          pp_box.style.width = '265px';
        }
        if (pp_tx.length === 13) {
          pp_box.style.width = '295px';
        }

        if (cache['play.pp.current'] < 10) {
            pp_txt.style.width = "25px";
        }
        if (cache['play.pp.current'] >= 10 && cache['play.pp.current'] < 100) {
            pp_txt.style.width = "48px";
        }
        if (cache['play.pp.current'] >= 100 && cache['play.pp.current'] < 1000) {
            pp_txt.style.width = "70px";
        }
        if (cache['play.pp.current'] >= 1000 && cache['play.pp.current'] < 10000) {
            pp_txt.style.width = "105px";
        }
        if (cache['play.pp.current'] >= 10000 && cache['play.pp.current'] < 1000) {
            pp_txt.style.width = "125px";
        }

        if (cache['beatmap.time.live'] > beatmap.time.live) {
          delete cache['key-k1-press'];
          delete cache['key-k1-count'];
          delete cache['key-k1-active'];
          delete cache['key-k1-r'];
          keys['k1'].bpmArray.length = 0;
      
      
          delete cache['key-k2-press'];
          delete cache['key-k2-count'];
          delete cache['key-k2-active'];
          delete cache['key-k2-r'];
          keys['k2'].bpmArray.length = 0;
      
      
          delete cache['key-m1-press'];
          delete cache['key-m1-count'];
          delete cache['key-m1-active'];
          delete cache['key-m1-r'];
          keys['m1'].bpmArray.length = 0;
      
      
          delete cache['key-m2-press'];
          delete cache['key-m2-count'];
          delete cache['key-m2-active'];
          delete cache['key-m2-r'];
          keys['m2'].bpmArray.length = 0;
        }

        if (cache['hp.normal'] > 0) {
            hpBar.style.clipPath = `polygon(${(1 - cache['hp.normal'] / 100) * 50}% 0%, ${(cache['hp.normal'] / 100) * 50 + 50}% 0%, ${(cache['hp.normal'] / 100) * 50 + 50}% 100%, ${(1 - cache['hp.normal'] / 100) * 50}% 100%)`;
        } else {
            hpBar.style.clipPath = `polygon(0 0, 93.7% 0, 93.7% 100%, 0 100%)`;
        }

        if (tempMapScores.length > 0) {
            if (cache['play.score'] >= tempMapScores[playerPosition - 2]) 
                { playerPosition-- }
            else if (cache['play.score'] === 0) { playerPosition = tempSlotLength + 1 }
        }

        if (rankingPanelBG.style.opacity !== 1 && cache['data.menu.state'] === 2 && cache['beatmap.time.live'] >= cache['beatmap.time.lastObject'] + 1000 || cache['data.menu.state'] === 7) {
            if (!rankingPanelSet) setupRankingPanel();
        } else if (!(cache['beatmap.time.live'] >= cache['beatmap.time.lastObject'] - 500 && cache['data.menu.state'] === 2)) rankingPanelBG.style.opacity = 0 && deRankingPanel();

        async function setupRankingPanel() {
            rankingPanelSet = true;

            rankingPanelBG.style.opacity = 1;
            RankingPanel.style.opacity = 1;

            ResultMiddle.style.transform = `translateY(0)`;
            MiddleBar.style.height = `460px`;

            rankingResult.style.opacity = 1;
            rankingResult.style.transform = 'scale(100%)';

            TContainer.style.transform = `translateX(0)`;
            PContainer.style.transform = `translateX(0)`;

            modContainer.style.transform = `translateY(0)`;

            MapStats.style.opacity = 1;
            StatsBPM.style.opacity = 1;
            StatsBar.style.opacity = 1;

            MapStats.style.transform = `translateX(0)`;
            StatsBPM.style.transform = `translateX(0)`;
            StatsBar.style.transform = `translateX(0)`;

            CSGlow.style.width = ((cache['beatmap.stats.cs.converted'] * 10) - 10) + '%';
            ARGlow.style.width = ((cache['beatmap.stats.ar.converted'] * 10) - 10) + '%';
            ODGlow.style.width = ((cache['beatmap.stats.od.converted'] * 10) - 10) + '%';
            HPGlow.style.width = ((cache['beatmap.stats.hp.converted'] * 10) - 10) + '%';

            Top1.style.opacity = 1;
            Top2.style.opacity = 1;
            Top3.style.opacity = 1;
            Top4.style.opacity = 1;
            Top5.style.opacity = 1;
            Top6.style.opacity = 1;

            Top1.style.transform = `translateY(0)`;
            Top2.style.transform = `translateY(0)`;
            Top3.style.transform = `translateY(0)`;
            Top4.style.transform = `translateY(0)`;
            Top5.style.transform = `translateY(0)`;
            Top6.style.transform = `translateY(0)`;
        }
        async function deRankingPanel() {
            rankingPanelSet = false;

            rankingPanelBG.style.opacity = 0;
            RankingPanel.style.opacity = 0;

            ResultMiddle.style.transform = `translateY(400px)`;
            MiddleBar.style.height = `0px`;

            rankingResult.style.opacity = 0;
            rankingResult.style.transform = 'scale(150%)';

            TContainer.style.transform = `translateX(1000px)`;
            PContainer.style.transform = `translateX(-1000px)`;

            modContainer.style.transform = `translateY(100px)`;

            MapStats.style.opacity = 0;
            StatsBPM.style.opacity = 0;
            StatsBar.style.opacity = 0;

            MapStats.style.transform = `translateX(-100px)`;
            StatsBPM.style.transform = `translateX(-100px)`;
            StatsBar.style.transform = `translateX(100px)`;

            CSGlow.style.width = `0%`;
            ARGlow.style.width = `0%`;
            ODGlow.style.width = `0%`;
            HPGlow.style.width = `0%`;

            Top1.style.opacity = 0;
            Top2.style.opacity = 0;
            Top3.style.opacity = 0;
            Top4.style.opacity = 0;
            Top5.style.opacity = 0;
            Top6.style.opacity = 0;

            Top1.style.transform = `translateY(-100px)`;
            Top2.style.transform = `translateY(-100px)`;
            Top3.style.transform = `translateY(-100px)`;
            Top4.style.transform = `translateY(-100px)`;
            Top5.style.transform = `translateY(-100px)`;
            Top6.style.transform = `translateY(-100px)`;
        }
    } catch (error) {
        console.log(error);
    }
  }, [
      'client',
      {
          field: 'state',
          keys: ['number', 'name']
      },
      {
          field: 'settings',
          keys: [
              'interfaceVisible',
              {
                  field: 'background',
                  keys: ['dim']
              }
          ]
      },
      {
          field: 'performance',
          keys: ['graph']
      },
      {
          field: 'resultsScreen',
          keys: [
              'name',
              'scoreId',
              'score',
              'accuracy',
              'maxCombo',
              'rank',
              'createdAt',
              {
                  field: 'hits',
                  keys: ['0', '50', '100', '300']
              },
              {
                  field: 'mods',
                  keys: ['name', 'number']
              },
              {
                  field: 'pp',
                  keys: ['current', 'fc']
              }
          ]
      },
      {
          field: 'play',
          keys: [
              'playerName',
              'score',
              'accuracy',
              'unstableRate',
              {
                  field: 'mode',
                  keys: ['name']
              },
              {
                  field: 'healthBar',
                  keys: ['normal']
              },
              {
                  field: 'hits',
                  keys: ['0', '50', '100', 'sliderBreaks']
              },
              {
                  field: 'combo',
                  keys: ['current', 'max']
              },
              {
                  field: 'mods',
                  keys: ['name', 'number']
              },
              {
                  field: 'rank',
                  keys: ['current']
              },
              {
                  field: 'pp',
                  keys: ['current', 'fc']
              }
          ]
      },
      {
          field: 'beatmap',
          keys: [
              'id',
              'artist',
              'title',
              'mapper',
              'version',
              {
                  field: 'status',
                  keys: ['number']
              },
              {
                  field: 'time',
                  keys: ['live', 'firstObject', 'lastObject', 'mp3Length']
              },
              {
                  field: 'stats',
                  keys: [
                      'maxCombo',
                      {
                          field: 'stars',
                          keys: ['live', 'total']
                      },
                      {
                          field: 'ar',
                          keys: ['converted']
                      },
                      {
                          field: 'cs',
                          keys: ['converted']
                      },
                      {
                          field: 'od',
                          keys: ['converted']
                      },
                      {
                          field: 'hp',
                          keys: ['converted']
                      },
                      {
                          field: 'bpm',
                          keys: ['common', 'realtime']
                      }
                  ]
              }
          ]
      },
      {
          field: 'folders',
          keys: ['beatmap', 'songs']
      },
      {
          field: 'files',
          keys: ['beatmap', 'background']
      },
      {
          field: 'directPath',
          keys: ['beatmapBackground']
      },
      {
          field: 'userProfile',
          keys: ['backgroundColour']
      }
  ]);
  socket.api_v2_precise((data) => {
    try {
      if (cache['data.menu.state'] !== 2) return;
  
      const keysArray = Object.keys(data.keys);
      for (let i = 0; i < keysArray.length; i++) {
        const key = keysArray[i];
        const value = data.keys[key];
  
        if (cache[`key-${key}-press`] !== value.isPressed) {
          cache[`key-${key}-press`] = value.isPressed;
          keys[key].blockStatus(value.isPressed);
  
          const status = value.isPressed ? 'add' : 'remove';
          document.getElementById(`${key}Press`).classList[status]('active');
          if (value.isPressed === true) {
            keys[key].registerKeypress();
          }
        }
  
  
        if (cache[`key-${key}-count`] !== value.count) {
          document.getElementById(`${key}Count`).innerHTML = value.count;

          cache[`key-${key}-count`] = value.count;
        }

        if (cache[`key-${key}-active`] == null) {
            if (value.count > 0) {
              document.querySelector(`.keys.${key}`).classList.remove('hidden');
    
              cache[`key-${key}-active`] = true;
            }
          }
      }

      keys.k1.update(data.keys.k1);
      keys.k2.update(data.keys.k2);
      keys.m1.update(data.keys.m1);
      keys.m2.update(data.keys.m2);

      if (data.hitErrors !== null) {
        tempSmooth = fastSmooth(data.hitErrors, 0);
        if (tempHitErrorArrayLength !== tempSmooth.length) {
            tempHitErrorArrayLength = tempSmooth.length;
            for (let a = 0; a < tempHitErrorArrayLength; a++) {
                tempAvg = tempAvg * 0.9 + tempSmooth[a] * 0.1;
            }
            tickPos = data.hitErrors[tempHitErrorArrayLength - 1] / 2 * 3.3;
            currentErrorValue = data.hitErrors[tempHitErrorArrayLength - 1];
            avgHitError.style.transform = `translateX(${(tempAvg / 2) * 3.3}px)`;

            for (let c = 0; c < 200; c++) {
                if ((tempHitErrorArrayLength % 200) === ((c + 1) % 200)) {
                    tick[c].style.transform = `translateX(${tickPos}px)`;
                    tick[c].style.transition = `opacity ease 300ms`;

                    if (currentErrorValue >= -(error_h300) && currentErrorValue <= error_h300) {
                        tick[c].style.backgroundColor = 'rgba(134, 211, 255, 1)';
                    }
                    else if (currentErrorValue >= -(error_h100) && currentErrorValue <= error_h100) {
                        tick[c].style.backgroundColor = 'rgba(136, 255, 134, 1)';
                    }
                    else {
                        tick[c].style.backgroundColor = 'rgba(255, 213, 134, 1)';
                    }

                    const s = document.querySelectorAll("[id^=tick]")[c].style;
                    s.opacity = 1;
                    setTimeout(fade, 1500);
                    function fade() {
                        s.opacity = 0;
                        s.transition = `opacity ease 4s`;
                    }
                }
            }
        }
    }

    } catch (err) {
      console.log(err);
    }
  }, [
      'hitErrors',
      {
          field: 'keys',
          keys: [
              {
                  field: 'k1',
                  keys: ['isPressed', 'count']
              },
              {
                  field: 'k2',
                  keys: ['isPressed', 'count']
              },
              {
                  field: 'm1',
                  keys: ['isPressed', 'count']
              },
              {
                  field: 'm2',
                  keys: ['isPressed', 'count']
              }
          ]
      }
  ]);

  async function setupUser(name) {
    let userData = await getUserDataSet(name);
    let playerBest;
    let ColorData1;
    let ColorData2;
    let ColorResultLight;
    let ColorResultDark;
    let avatarColor;

    if (!userData || LocalNameData === cache['LocalNameData'] || LocalNameData === `Alayna`) {
        userData = {
            "id": `Alayna`,
            "statistics": {
                "global_rank": `${cache['GBrank'] || "0"}`,
                "pp": `${cache['ppGB'] || "0"}`,
                "country_rank": `${cache['CTrank'] || "0"}`,
            },
            "country_code": `${cache['CTcode'] || "__"}`,
        }
    }

    let tempCountry = `${userData.country_code
        .split("")
        .map((char) => 127397 + char.charCodeAt())[0]
        .toString(16)}-${userData.country_code
        .split("")
        .map((char) => 127397 + char.charCodeAt())[1]
        .toString(16)}`;

    country.style.backgroundImage = `url('https://osu.ppy.sh/assets/images/flags/${tempCountry}.svg')`;
    PlayerFlag.style.backgroundImage = `url('https://osu.ppy.sh/assets/images/flags/${tempCountry}.svg')`;

    ranks.innerHTML = "#" + userData.statistics.global_rank;
    PlayerGR.innerHTML = `#` + userData.statistics.global_rank;

    countryRank.innerHTML = "#" + userData.statistics.country_rank;
    PlayerCR.innerHTML = `#${userData.statistics.country_rank} ${userData.country_code}`;

    playerPP.innerHTML = Math.round(userData.statistics.pp) + "pp";
    PlayerTotalPP.innerHTML = Math.round(userData.statistics.pp) + "pp";

    if (userData.statistics.global_rank === null && userData.statistics.country_rank === null) {
        ranks.innerHTML = '#0';
        PlayerGR.innerHTML = '#0';
        countryRank.innerHTML = '#0';
        PlayerCR.innerHTML = '#0';
    }

    if (cache['ColorSet'] === `API`) {
        if (userData.error === null || LocalNameData === cache['LocalNameData'] || LocalNameData === `Alayna` || userData.id === `Alayna`) {
            avatarColor = {
                "hsl1": [
                    0.5277777777777778,
                    0
                ],
                "hsl2": [
                    0.5277777777777778,
                    0
                ]
            }
        } else {
            avatarColor = await postUserID(userData.id);
        }

        if (avatarColor) {
            ColorData1 = `${avatarColor.hsl1[0] * 360}, ${avatarColor.hsl1[1] * 100}%, 50%`;
            ColorData2 = `${avatarColor.hsl2[0] * 360}, ${avatarColor.hsl2[1] * 100}%, 75%`;
            ColorResultLight = `${avatarColor.hsl1[0] * 360}, ${avatarColor.hsl2[1] * 100}%, 82%`;
            ColorResultDark = `${avatarColor.hsl1[0] * 360}, ${avatarColor.hsl2[1] * 100}%, 6%`;

            document.querySelectorAll('.hpColor1').forEach(e => e.style.fill = `hsl(${ColorData1})`);
            document.querySelectorAll('.hpColor2').forEach(e => e.style.fill = `hsl(${ColorData2})`);

            smallStats.style.backgroundColor = `hsl(${ColorData1})`;

            combo_box.style.backgroundColor = `hsl(${ColorData1})`;
            combo_box.style.filter = `drop-shadow(0 0 10px hsla(${ColorData1}))`;

            pp_box.style.backgroundColor = `hsl(${ColorData2})`;
            pp_box.style.filter = `drop-shadow(0 0 10px hsla(${ColorData2}))`;

            document.querySelector('.keys.k1').style.setProperty('--press', `hsl(${ColorData1})`);
            document.querySelector('.keys.k2').style.setProperty('--press', `hsl(${ColorData1})`);
            document.querySelector('.keys.m1').style.setProperty('--press', `hsl(${ColorData2})`);
            document.querySelector('.keys.m2').style.setProperty('--press', `hsl(${ColorData2})`);

            keys.k1.color = `hsla(${ColorData1}, 0.8)`;
            keys.k2.color = `hsla(${ColorData1}, 0.8)`;
            keys.m1.color = `hsla(${ColorData2}, 0.8)`;
            keys.m2.color = `hsla(${ColorData2}, 0.8)`;

            lbcpLine.style.backgroundColor = `hsl(${ColorData1})`;
            lbcpLine.style.boxShadow = `0 0 10px 2px hsla(${ColorData1}, 0.5)`;

            configLighter.data.datasets[0].backgroundColor = `hsl(${ColorData1})`;
            configLighter2.data.datasets[0].backgroundColor = `hsl(${ColorData1})`;

            RankingPanel.style.backgroundColor = `hsla(${ColorResultDark}, 0.9)`;

            SonataTextResult.style.color = `hsl(${ColorResultLight})`;
            bgborder.style.border = `3px solid hsl(${ColorResultLight})`;
            StatsBPM.style.border = `3px solid hsl(${ColorResultLight})`;

            CSLine.style.border = `3px solid hsl(${ColorResultLight})`;
            ARLine.style.border = `3px solid hsl(${ColorResultLight})`;
            ODLine.style.border = `3px solid hsl(${ColorResultLight})`;
            HPLine.style.border = `3px solid hsl(${ColorResultLight})`;

            PHCS.style.color = `hsl(${ColorResultLight})`;
            PHAR.style.color = `hsl(${ColorResultLight})`;
            PHOD.style.color = `hsl(${ColorResultLight})`;
            PHHP.style.color = `hsl(${ColorResultLight})`;

            CSGlow.style.backgroundColor = `hsl(${ColorResultLight})`;
            ARGlow.style.backgroundColor = `hsl(${ColorResultLight})`;
            ODGlow.style.backgroundColor = `hsl(${ColorResultLight})`;
            HPGlow.style.backgroundColor = `hsl(${ColorResultLight})`;

            MiddleBar.style.backgroundColor = `hsl(${ColorResultLight})`;

            chartLighter.update();
            chartLighter2.update();
        }

        if (userData.id === `Alayna`) {
            ava.style.backgroundImage = "url('./static/gamer.png')";
            PlayerAvatar.style.backgroundImage = "url('./static/gamer.png')";
            lbcpAvatar.style.backgroundImage = "linear-gradient(310deg, rgba(0,0,0,0.9) 15%, rgba(0,0,0,0) 100%), url('./static/gamer.png')";
        } else {
            ava.style.backgroundImage = `url('https://a.ppy.sh/${userData.id}')`;
            PlayerAvatar.style.backgroundImage = `url('https://a.ppy.sh/${userData.id}')`;
            lbcpAvatar.style.backgroundImage = `linear-gradient(310deg, rgba(0,0,0,0.9) 15%, rgba(0,0,0,0) 100%), url('https://a.ppy.sh/${userData.id}')`;
        }
    }

    if (userData.error === null || LocalNameData === cache['LocalNameData'] || LocalNameData === `Alayna`) {
        playerBest = {
            "0": {
                "beatmap_id": `${cache['mapid0'] || ""}`,
                "pp": `${cache['ppResult0'] || ""}`,
                "mods_id": `${cache['modsid0'] || ""}`,
                "rank": `${cache['rankResult0'] || ""}`,
                "ended_at": `${cache['date0'] || ""}`,
            },
            "1": {
                "beatmap_id": `${cache['mapid1'] || ""}`,
                "pp": `${cache['ppResult1'] || ""}`,
                "mods_id": `${cache['modsid1'] || ""}`,
                "rank": `${cache['rankResult1'] || ""}`,
                "ended_at": `${cache['date1'] || ""}`,
            },
            "2": {
                "beatmap_id": `${cache['mapid2'] || ""}`,
                "pp": `${cache['ppResult2'] || ""}`,
                "mods_id": `${cache['modsid2'] || ""}`,
                "rank": `${cache['rankResult2'] || ""}`,
                "ended_at": `${cache['date2'] || ""}`,
            },
            "3": {
                "beatmap_id": `${cache['mapid3'] || ""}`,
                "pp": `${cache['ppResult3'] || ""}`,
                "mods_id": `${cache['modsid3'] || ""}`,
                "rank": `${cache['rankResult3'] || ""}`,
                "ended_at": `${cache['date3'] || ""}`,
            },
            "4": {
                "beatmap_id": `${cache['mapid4'] || ""}`,
                "pp": `${cache['ppResult4'] || ""}`,
                "mods_id": `${cache['modsid4'] || ""}`,
                "rank": `${cache['rankResult4'] || ""}`,
                "ended_at": `${cache['date4'] || ""}`,
            },
            "5": {
                "beatmap_id": `${cache['mapid5'] || ""}`,
                "pp": `${cache['ppResult5'] || ""}`,
                "mods_id": `${cache['modsid5'] || ""}`,
                "rank": `${cache['rankResult5'] || ""}`,
                "ended_at": `${cache['date5'] || ""}`,
            }
        }
        for (let i = 0; i < 6; i++) {
            if (playerBest[i]["pp"] === "" ||
                playerBest[i]["beatmap_id"] === "" ||
                playerBest[i]["ended_at"] === "" ||
                playerBest[i]["rank"] === "" ||
                playerBest[i]["mods_id"] === "") {
                document.getElementById(`Top${i + 1}`).style.outlineColor = `rgba(0, 0, 0, 0)`;
                document.getElementById(`Top${i + 1}`).style.backgroundImage = ``;
                document.getElementById(`TopDate${i + 1}`).innerHTML = ``;
                document.getElementById(`TopRanking${i + 1}`).innerHTML = ``;
                document.getElementById(`topPP${i + 1}`).innerHTML = ``;
                document.getElementById(`TopMods${i + 1}`).innerHTML = ``;
            }
            else {
                let mapData = await getMapDataSet(playerBest[i]["beatmap_id"]);
                if (mapData && mapData.beatmapset_id) {
                    document.getElementById(`Top${i + 1}`).style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6),rgba(0, 0, 0, 0.6)),url('https://assets.ppy.sh/beatmaps/${mapData.beatmapset_id}/covers/cover.jpg')`;
                    document.getElementById(`TopDate${i + 1}`).innerHTML = jQuery.timeago(playerBest[i]["ended_at"]);
                    document.getElementById(`TopRanking${i + 1}`).innerHTML = playerBest[i]["rank"].replace("H", "");
                    document.getElementById(`TopRanking${i + 1}`).setAttribute("class", `topRanking ${playerBest[i]["rank"]}`);
                    document.getElementById(`topPP${i + 1}`).innerHTML = `${Math.round(playerBest[i]["pp"])}pp`;
                }
            }

            let ModsRCount = playerBest[i]['mods_id'].length;

            for (let k = 0; k < ModsRCount; k++) {
                let modsR = document.createElement("div");
                modsR.id = playerBest[i]['mods_id'].substr(k, 2) + i;
                modsR.setAttribute("class", `modslb ${playerBest[i]['mods_id'].substr(k, 2)}`);
                modsR.style.backgroundImage = `url('./static/mods/${playerBest[i]['mods_id'].substr(k, 2)}.png')`;
                document.getElementById(`TopMods${i + 1}`).appendChild(modsR);
                k++;
            }
        }
    }
    else {
        playerBest = await getUserTop(userData.id);
        
        // Check if playerBest is valid
        if (!playerBest || playerBest.length === 0) {
            console.warn('No top scores found for user');
            return;
        }
        
        for (let i = 0; i < Math.min(6, playerBest.length); i++) {
            if (!playerBest[i] || !playerBest[i]["beatmap_id"]) {
                console.warn(`Skipping score ${i}: missing beatmap_id`);
                continue;
            }
            
            let mapData = await getMapDataSet(playerBest[i]["beatmap_id"]);
            if (mapData && mapData.beatmapset_id) {
                document.getElementById(`Top${i + 1}`).style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6),rgba(0, 0, 0, 0.6)),url('https://assets.ppy.sh/beatmaps/${mapData.beatmapset_id}/covers/cover.jpg')`;
                document.getElementById(`TopDate${i + 1}`).innerHTML = jQuery.timeago(playerBest[i]["ended_at"]);
                document.getElementById(`TopRanking${i + 1}`).innerHTML = playerBest[i]["rank"].replace("H", "");
                document.getElementById(`TopRanking${i + 1}`).setAttribute("class", `topRanking ${playerBest[i]["rank"]}`);
                document.getElementById(`topPP${i + 1}`).innerHTML = `${Math.round(playerBest[i]["pp"])}pp`;

                if (playerBest[i]["legacy_score_id"] === cache['resultsScreen.scoreId']) {
                    document.getElementById(`Top${i + 1}`).style.outlineColor = `hsl(${ColorResultLight})`;
                    console.log(playerBest[i]["legacy_score_id"], cache['resultsScreen.scoreId'])
                }
                else {
                    document.getElementById(`Top${i + 1}`).style.outlineColor = `rgba(0, 0, 0, 0)`;
                }

                // Handle mods - they're now already in string format from getUserTop
                let ModsNum = playerBest[i]['mods_id'] || 'NM';
                
                // Clean up mod combinations
                ModsNum = ModsNum.replace('DTNC', 'NC').replace('HDHRDT', 'HDDTHR').replace('HDDRNC', 'HDNCHR');
        
                document.getElementById(`TopMods${i + 1}`).innerHTML = " ";
                
                let ModsRCount = ModsNum.length;
                
                for (let k = 0; k < ModsRCount; k++) {
                    let modsR = document.createElement("div");
                    modsR.id = ModsNum.substr(k, 2) + i;
                    modsR.setAttribute("class", `modslb ${ModsNum.substr(k, 2)}`);
                    modsR.style.backgroundImage = `url('./static/mods/${ModsNum.substr(k, 2)}.png')`;
                    document.getElementById(`TopMods${i + 1}`).appendChild(modsR);
                    k++;
                }
            } else {
                console.warn(`Could not fetch map data for beatmap ID: ${playerBest[i]["beatmap_id"]}`);
            }
        }
    }
}

async function setupMapScores(beatmapID) {
    if (leaderboardFetch === false) {
        leaderboardFetch = true;
        let data;
        if (cache['LBOptions'] === "Selected Mods") {
            data = await getModsScores(beatmapID, cache['resultsScreen.mods.name']);
        }
        else {
            data = await getMapScores(beatmapID);
        }
        if (data) {
            tempSlotLength = data.length;
            playerPosition = data.length + 1;
        } else {
            tempSlotLength = 0;
            playerPosition = 1;
        }
        for (let i = tempSlotLength; i > 0; i--) {
            tempMapScores[i - 1] = data[i - 1].score;
            let playerContainer = document.createElement("div");
            playerContainer.id = `playerslot${i}`;
            playerContainer.setAttribute("class", "lbBox");
            playerContainer.style.top = `${(i - 1) * 65}px`;
            let playerNumber = `
                        <div id="lb_Number_slot${i}" class="lb_Number">
                            <div id="lb_Positions_slot${i}" class="positions N${i}">${i}</div>
                        </div>
            `;
            let playerAvatar = `
                        <div id="lb_Avatar_slot${i}" class="lb_Avatar" style="background-image: linear-gradient(310deg, rgba(0,0,0,0.9) 15%, rgba(0,0,0,0) 100%), url('https://a.ppy.sh/${data[i - 1].user_id}')">
                            <div id="lb_Ranking_slot${i}" class="${data[i - 1].rank} lb_Rank">${data[i - 1].rank.replace("H", "")}</div>
                        </div> 
            `;
            let playerStats = `
                        <div id="lb_Stats_slot${i}" class="lb_Stats">
                            <div id="lb_StatsLeft_slot${i}" class="lb_StatsLeft">
                                <div id="lb_Name_slot${i}" class="lb_Name">${data[i - 1].username}</div>
                                <div id="lb_Score_slot${i}">${formatNumber(data[i - 1].score)}</div>
                            </div>
                            <div id="lb_Combo_slot${i}" class="lb_Combo">${spaceit(data[i - 1].max_combo)}x</div>
                            <div id="lb_StatsRight_slot${i}" class="lb_StatsRight">
                                <div id="lb_PP_slot${i}" class="lb_PP">${Math.round(data[i - 1].pp)}pp</div>
                                <div id="lb_Acc_slot${i}">${data[i - 1].acc.toFixed(2)}%</div>
                            </div>
                        </div>
            `;
            let playerMods = `
                        <div id="lb_Mods_slot${i}" class="lb_Mods"></div>
            `;
            playerContainer.innerHTML = `
                ${playerNumber}
                ${playerAvatar}
                ${playerStats}
                ${playerMods}
            `;
            document.getElementById("lbopCont").appendChild(playerContainer);
            let minimodsCount = data[i - 1].mods.length;
            for (let k = 0; k < minimodsCount; k++) {
                let mods = document.createElement("div");
                mods.id = data[i - 1].mods.substr(k, 2) + i;
                mods.setAttribute("class", `modslb ${data[i - 1].mods.substr(k, 2)}`);
                mods.style.backgroundImage = `url('./static/mods/${data[i - 1].mods.substr(k, 2)}.png')`;
                document.getElementById(`lb_Mods_slot${i}`).appendChild(mods);
                k++;
            }
            if (data[i - 1].username === cache['resultsScreen.name']) {
                document.getElementById(`lb_Name_slot${i}`).setAttribute("class", "lb_Name bluelight")
            }
        }
    }
}