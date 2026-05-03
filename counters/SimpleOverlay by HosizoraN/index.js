// connecting to websocket
import WebSocketManager from './js/socket.js';

const socket = new WebSocketManager(window.location.host);

// cache values here to prevent constant updating
const cache = {};

const score = new CountUp('score', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const acc = new CountUp('acc', 0, 0, 2, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: ".", suffix: "%" })
const combo = new CountUp('combo', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: ".", suffix: "x" })
const katu = new CountUp('katu', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h100 = new CountUp('h100', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h50 = new CountUp('h50', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const h0 = new CountUp('h0', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })
const hSB = new CountUp('hSB', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." })

const spaceit = (text) => text.toLocaleString().replace(/,/g, ' ');

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
      const { command, message } = data;
      // get updates for "getSettings" command
      if (command == 'getSettings') {
        console.log(command, message); // print out settings for debug
      };

      if (message['KeyEnable'] != null) {
        cache['KeyEnable'] = message['KeyEnable'];

        if (Boolean(cache['KeyEnable']) == true)
            document.getElementById('keyOverlay').style.display = `block`;
        else
            document.getElementById('keyOverlay').style.display = `none`;
      };


      if (message['HideUI'] != null) {
        cache['HideUI'] = message['HideUI'];

        if (Boolean(cache['HideUI']) == false) {
            document.getElementById('score').style.display = `block`;
            document.getElementById('combo').style.display = `block`;
            document.getElementById('acc').style.display = `block`;
            document.getElementById('hp').style.display = `block`;
        }
        else {
            document.getElementById('score').style.display = `none`;
            document.getElementById('combo').style.display = `none`;
            document.getElementById('acc').style.display = `none`;
            document.getElementById('hp').style.display = `none`;
        }
      };


      if (message['FontID'] != null) {
          document.body.style.fontFamily = `"${message['FontID']}", sans-serif`;
       };


      if (message['KeyColor'] != null) {
          document.body.style.setProperty('--keyColor', message['KeyColor']);
       };
      if (message['keyPressedColor'] != null) {
          document.body.style.setProperty('--keyPressed', message['keyPressedColor']);
       };
      if (message['keyTextColor'] != null) {
          document.body.style.setProperty('--keyText', message['keyTextColor']);
       };


      if (message['TextColor'] != null) {
          document.body.style.setProperty('--TextColor', message['TextColor']);
       };
      if (message['katuColor'] != null) {
          document.body.style.setProperty('--katuColor', message['katuColor']);
       };
      if (message['h100Color'] != null) {
          document.body.style.setProperty('--h100Color', message['h100Color']);
       };
      if (message['h50Color'] != null) {
          document.body.style.setProperty('--h50Color', message['h50Color']);
       };
      if (message['h0Color'] != null) {
          document.body.style.setProperty('--h0Color', message['h0Color']);
       };
       if (message['hSBColor'] != null) {
          document.body.style.setProperty('--hSBColor', message['hSBColor']);
       };


       if (message['hpColor'] != null) {
          document.body.style.setProperty('--hpColor', message['hpColor']);
       };

    } catch (error) {
      console.log(error);
    };
  });

socket.api_v2(({ state, folders, files, resultsScreen, beatmap, play, settings}) => {
    try {

        if (cache.state != state.number) {
            cache.state = state.number;
            gameplay.style.opacity = state.number == 2 ? 1 : 0;
            if (state.number == 7) setRankingPanel(); else deRankingPanel();
        };

        if (cache.mode != settings.mode.name) {
          cache.mode = settings.mode.name;
          switch (settings.mode.name) {
            case 'osu':
              document.getElementById('pp').style.transform = `translateY(0)`;
              document.getElementById('accInfo').style.transform = `translateY(0)`;
              document.getElementById('accInfo').style.width = `250px`;
              document.getElementById('M2').style.display = `flex`;
              document.getElementById('katu').style.display = `none`;
              document.getElementById('hSB').style.display = `block`;
              document.getElementById('h50').style.display = `block`;
              document.getElementById('ur').style.display = `block`;
              document.getElementById('pp').style.left = `10px`;
              document.getElementById('accInfo').style.left = `10px`;
              document.getElementById('pp').style.right = `initial`;
              document.getElementById('accInfo').style.right = `initial`;
              rgeki.innerHTML = `Geki: ` + resultsScreen.hits.geki;
              r300.innerHTML = `300: ` + resultsScreen.hits[300];
              rkatu.innerHTML = `Katu: ` + resultsScreen.hits.katu;
              r100.innerHTML = `100: ` + resultsScreen.hits[100];
              r50.innerHTML = `50: ` + resultsScreen.hits[50];
              r0.innerHTML = `Miss: ` + resultsScreen.hits[0];
              rgeki.style.display = `block`;
              rkatu.style.display = `block`;
              r50.style.display = `block`;
              break;
            case 'mania':
              document.getElementById('accInfo').style.width = `250px`;
              document.getElementById('hSB').style.display = `none`;
              document.getElementById('katu').style.display = `block`;
              document.getElementById('accInfo').style.transform = `translateY(-110px)`;
              document.getElementById('pp').style.transform = `translateY(-110px)`;
              document.getElementById('pp').style.left = `10px`;
              document.getElementById('accInfo').style.left = `10px`;
              document.getElementById('pp').style.right = `initial`;
              document.getElementById('accInfo').style.right = `initial`;
              rgeki.innerHTML = `300s: ` + resultsScreen.hits.geki;
              r300.innerHTML = `300: ` + resultsScreen.hits[300];
              rkatu.innerHTML = `200: ` + resultsScreen.hits.katu;
              r100.innerHTML = `100: ` + resultsScreen.hits[100];
              r50.innerHTML = `50: ` + resultsScreen.hits[50];
              r0.innerHTML = `Miss: ` + resultsScreen.hits[0];
              rgeki.style.display = `block`;
              rkatu.style.display = `block`;
              r50.style.display = `block`;
              break;
            case 'fruits':
              document.getElementById('katu').style.display = `none`;
              document.getElementById('hSB').style.display = `none`;
              document.getElementById('h50').style.display = `none`;
              document.getElementById('accInfo').style.width = `100px`;
              document.getElementById('accInfo').style.transform = `translateY(310px)`;
              document.getElementById('accInfo').style.right = `10px`;
              document.getElementById('pp').style.transform = `translateY(310px)`;
              document.getElementById('pp').style.right = `10px`;
              document.getElementById('pp').style.left = `initial`;
              document.getElementById('accInfo').style.left = `initial`;
              rgeki.innerHTML = `Geki: ` + resultsScreen.hits.geki;
              r300.innerHTML = `300: ` + resultsScreen.hits[300];
              rkatu.innerHTML = `Katu: ` + resultsScreen.hits.katu;
              r100.innerHTML = `100: ` + resultsScreen.hits[100];
              r50.style.display = `none`;
              r0.innerHTML = `Miss: ` + resultsScreen.hits[0];
              rgeki.style.display = `none`;
              rkatu.style.display = `none`;
              break;
            case 'taiko':
              document.getElementById('pp').style.transform = `translateY(-180px)`;
              document.getElementById('accInfo').style.transform = `translateY(-180px)`;
              document.getElementById('accInfo').style.width = `100px`;
              document.getElementById('M2').style.display = `none`;
              document.getElementById('katu').style.display = `none`;
              document.getElementById('hSB').style.display = `none`;
              document.getElementById('h50').style.display = `none`;
              document.getElementById('ur').style.display = `none`;
              document.getElementById('pp').style.left = `10px`;
              document.getElementById('accInfo').style.left = `10px`;
              document.getElementById('pp').style.right = `initial`;
              document.getElementById('accInfo').style.right = `initial`;
              rgeki.style.display = `none`;
              r300.innerHTML = `300: ` + resultsScreen.hits[300];
              rkatu.style.display = `none`;
              r100.innerHTML = `100: ` + resultsScreen.hits[100];
              r50.innerHTML = `Droplet: ` + resultsScreen.hits[50];
              r0.innerHTML = `Miss: ` + resultsScreen.hits[0];
              r50.style.display = `block`;
              break;
          };
        };

        if (cache.score !== play.score) {
          cache.score = play.score;
          score.innerHTML = play.score;
          score.update(score.innerHTML);
        };

        if (cache.acc !== play.accuracy) {
            cache.acc = play.accuracy;
            acc.innerHTML = play.accuracy;
            acc.update(play.accuracy);
        };

        if (cache.combo != play.combo.current) {
            cache.combo = play.combo.current;
            combo.update(play.combo.current);
            combo.innerHTML = play.combo.current;
        };

        if (cache.katu !== play.hits.katu) {
            cache.katu = play.hits.katu;
            katu.update(play.hits.katu);
            katu.innerHTML = play.hits.katu;
        };

        if (cache.h100 !== play.hits['100']) {
            cache.h100 = play.hits['100'];
            h100.update(play.hits['100']);
            h100.innerHTML = play.hits['100'];
        };

        if (cache.h50 !== play.hits['50']) {
            cache.h50 = play.hits['50'];
            h50.update(play.hits['50']);
            h50.innerHTML = play.hits['50'];
        };

        if (cache.h0 !== play.hits['0']) {
            cache.h0 = play.hits['0'];
            h0.update(play.hits['0']);
            h0.innerHTML = play.hits['0'];
        };

        if (cache.hSB !== play.hits.sliderBreaks) {
            cache.hSB = play.hits.sliderBreaks;
            hSB.update(play.hits.sliderBreaks);
            hSB.innerHTML = play.hits.sliderBreaks;
        };

        if (cache.pp !== Math.round(play.pp.current)) {
            cache.pp = Math.round(play.pp.current);
            pp.innerHTML = Math.round(play.pp.current) + "pp";
        };
        if (cache.ur !== Math.round(play.unstableRate)) {
            cache.ur = Math.round(play.unstableRate);
            ur.innerHTML = Math.round(play.unstableRate) + "UR";
        };
        if (cache.hp != play.healthBar.normal.toFixed(2)) {
            cache.hp = play.healthBar.normal.toFixed(2);
            hp.style.width = `${play.healthBar.normal}%`;
        };

        if (cache.title != beatmap.title) {
          cache.title = beatmap.title;
        };
        if (cache.artist != beatmap.artist) {
          cache.artist = beatmap.artist;
        };
        if (cache.version != beatmap.version) {
          cache.version = beatmap.version;
        };

        song.innerHTML = beatmap.artist + ` - ` + beatmap.title + ` [${beatmap.version}]`;

        if (cache.mapper != beatmap.mapper) {
          cache.mapper = beatmap.mapper;
          mapped.innerHTML = `Mapped by ` + beatmap.mapper;
        };

        if (cache.played != resultsScreen.createdAt) {
          cache.played = resultsScreen.createdAt;
          played.innerHTML = `Played by ` + resultsScreen.name + ` at ` + resultsScreen.createdAt.replace("T", " ").replace("Z", " ");
        };

        if (cache.player != resultsScreen.name) {
          cache.player = resultsScreen.name;
        };

        if (cache.rscore != resultsScreen.score) {
          cache.rscore = resultsScreen.score;
          rscore.innerHTML = `Score: ` + spaceit(resultsScreen.score);
        };

        if (cache.racc != resultsScreen.accuracy) {
            cache.racc = resultsScreen.accuracy;
            racc.innerHTML = `Accuracy: ` + resultsScreen.accuracy.toFixed(2) + `%`;
        };

        if (cache.rcombo != resultsScreen.maxCombo) {
          cache.rcombo = resultsScreen.maxCombo;
          rcombo.innerHTML = `Combo: ` + resultsScreen.maxCombo;
        };

        if (cache.rank != resultsScreen.rank) {
          cache.rank = resultsScreen.rank;
          rank.innerHTML = resultsScreen.rank;

          switch (resultsScreen.rank) {
            case `XH` || `SH`:
              rank.style.color = `#FFFFFF`;
              break;
            case `X` || `S`:
              rank.style.color = `#FFE669`;
              break;
            case `A`:
              rank.style.color = `#79FF69`;
              break;
            case `B`:
              rank.style.color = `#6990FF`;
              break;
            case `C`:
              rank.style.color = `#EB69FF`;
              break;
            case `D`:
              rank.style.color = `#FF6969`;
              break;
          };
        };

        if (cache.mods != resultsScreen.mods.name) {
          cache.mods = resultsScreen.mods.name;
          modsused.innerHTML = resultsScreen.mods.name == "" ? `Mods: None` : `Mods: ` + resultsScreen.mods.name;
        };

        if (cache.rgeki != resultsScreen.hits.geki) {
          cache.rgeki = resultsScreen.hits.geki;
        };
        if (cache.r300 != resultsScreen.hits[300]) {
          cache.r300 = resultsScreen.hits[300];
        };
        if (cache.rkatu != resultsScreen.hits.katu) {
          cache.rkatu = resultsScreen.hits.katu;
        };
        if (cache.r100 != resultsScreen.hits[100]) {
          cache.r100 = resultsScreen.hits[100];
        };
        if (cache.r50 != resultsScreen.hits[50]) {
          cache.r50 = resultsScreen.hits[50];
        };
        if (cache.r0 != resultsScreen.hits[0]) {
          cache.r0 = resultsScreen.hits[0];
        };

        const Folder = folders.beatmap.replace(/#/g, "%23").replace(/%/g, "%25").replace(/\\/g, "/").replace(/'/g, "%27").replace(/ /g, "%20");
        const Img = files.background;

        rankingPanel.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('http://${window.location.host}/files/beatmap/${Folder}/${Img}')`;

        function setRankingPanel() {
          rankingPanel.style.opacity = 1;
          result.style.height = `90%`;

          rscore.style.opacity = 1;
          r300.style.opacity = 1;
          rgeki.style.opacity = 1;
          rkatu.style.opacity = 1;
          r100.style.opacity = 1;
          r50.style.opacity = 1;
          r0.style.opacity = 1;
          rst.style.opacity = 1;
          modsused.style.opacity = 1;
          rank.style.opacity = 1;
        };
        function deRankingPanel() {
          rankingPanel.style.opacity = 0;
          result.style.height = `0%`;

          rscore.style.opacity = 0;
          r300.style.opacity = 0;
          rgeki.style.opacity = 0;
          rkatu.style.opacity = 0;
          r100.style.opacity = 0;
          r50.style.opacity = 0;
          r0.style.opacity = 0;
          rst.style.opacity = 0;
          modsused.style.opacity = 0;
          rank.style.opacity = 0;
        };
    } catch (error) {
        console.log(error);
    };
}, [
  {field: 'settings', keys: ['mode']},
  {field: 'state', keys: ['number']},
  {field: 'beatmap', keys: ['artist', 'title', 'version', 'mapper']},
  {field: 'folders', keys: ['beatmap']},
  {field: 'files', keys: ['background']},
  {field: 'play', keys: ['hits', 'combo', 'accuracy', 'score', 'unstableRate', 'healthBar', 'pp']},
  {field: 'resultsScreen', keys: ['hits', 'maxCombo', 'accuracy', 'score', 'mods.name', 'rank', 'createdAt', 'mods']}
]);

socket.api_v2_precise((data) => {
    if (cache.state !== 2) return;

    if (cache['data.keys.k1.count'] != data.keys.k1.count) {
      cache['data.keys.k1.count'] = data.keys.k1.count;
      K1Text.innerHTML = data.keys.k1.count == 0 ? `K1` : data.keys.k1.count;
    };

    if (cache['data.keys.k2.count'] != data.keys.k2.count) {
      cache['data.keys.k2.count'] = data.keys.k2.count;
      K2Text.innerHTML = data.keys.k2.count == 0 ? `K2` : data.keys.k2.count;
    };

    if (cache['data.keys.m1.count'] != data.keys.m1.count) {
      cache['data.keys.m1.count'] = data.keys.m1.count;
      M1Text.innerHTML = data.keys.m1.count == 0 ? `M1` : data.keys.m1.count;
    };

    if (cache['data.keys.m2.count'] != data.keys.m2.count) {
      cache['data.keys.m2.count'] = data.keys.m2.count;
      M2Text.innerHTML = data.keys.m2.count == 0 ? `M2` : data.keys.m2.count;
    };

    if (cache['data.keys.k1.isPressed'] != data.keys.k1.isPressed) {
      cache['data.keys.k1.isPressed'] = data.keys.k1.isPressed;
      K1.classList[data.keys.k1.isPressed ? 'add' : 'remove']('pressed');
    };
    if (cache['data.keys.k2.isPressed'] != data.keys.k2.isPressed) {
      cache['data.keys.k2.isPressed'] = data.keys.k2.isPressed;
      K2.classList[data.keys.k2.isPressed ? 'add' : 'remove']('pressed');
    };
    if (cache['data.keys.m1.isPressed'] != data.keys.m1.isPressed) {
      cache['data.keys.m1.isPressed'] = data.keys.m1.isPressed;
      M1.classList[data.keys.m1.isPressed ? 'add' : 'remove']('pressed');
    };
    if (cache['data.keys.m2.isPressed'] != data.keys.m2.isPressed) {
      cache['data.keys.m2.isPressed'] = data.keys.m2.isPressed;
      M2.classList[data.keys.m2.isPressed ? 'add' : 'remove']('pressed');
    };
  }, ['keys']);