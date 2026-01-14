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

        if (cache.mode != settings.mode.name) {
          cache.mode = settings.mode.name;
          if (settings.mode.name == "osu") {
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
          }
          if (settings.mode.name == "mania") {
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
          }
          if (settings.mode.name == "taiko") {
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
         }
         if (settings.mode.name == "fruits") {
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
          }
        }
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
        if (cache.hp != play.healthBar.smooth.toFixed(2)) {
            cache.hp = play.healthBar.smooth.toFixed(2);
            hp.style.width = `${play.healthBar.smooth}%`;
        };

        if (state.number == 2) {
            gameplay.style.opacity = 1;
        }
        else {
            gameplay.style.opacity = 0;
        }

        if (state.number == 7) {
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
        }
        else {
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
        }

        if (cache.title != beatmap.title) {
          cache.title = beatmap.title;
        }
        if (cache.artist != beatmap.artist) {
          cache.artist = beatmap.artist;
        }
        if (cache.version != beatmap.version) {
          cache.version = beatmap.version;
        }

        song.innerHTML = beatmap.artist + ` - ` + beatmap.title + ` [${beatmap.version}]`;

        if (cache.mapper != beatmap.mapper) {
          cache.mapper = beatmap.mapper;
          mapped.innerHTML = `Mapped by ` + beatmap.mapper;
        }

        if (cache.played != resultsScreen.createdAt) {
          cache.played = resultsScreen.createdAt;
          played.innerHTML = `Played by ` + resultsScreen.name + ` at ` + resultsScreen.createdAt.replace("T", " ").replace("Z", " ");
        }
        if (cache.player != resultsScreen.name) {
          cache.player = resultsScreen.name;
        }

        if (cache.rscore != resultsScreen.score) {
          cache.rscore = resultsScreen.score;
          rscore.innerHTML = `Score: ` + resultsScreen.score;
        }

        let CalcAcc;

        if (settings.mode.name == `osu`) {
          CalcAcc = ((resultsScreen.hits[300] + resultsScreen.hits[100] / 3 + resultsScreen.hits[50] / 6) / (resultsScreen.hits[300] + resultsScreen.hits[100] + resultsScreen.hits[50] + resultsScreen.hits[0])) * 100;
        }
        if (settings.mode.name == `mania`) {
          CalcAcc = ((6 * resultsScreen.hits[300] + resultsScreen.hits.geki * 6 + resultsScreen.hits.katu * 4 + resultsScreen.hits[100] * 2 + resultsScreen.hits[50]) / (6 * (resultsScreen.hits[300] + resultsScreen.hits.geki + resultsScreen.hits.katu + resultsScreen.hits[100] + resultsScreen.hits[50] + resultsScreen.hits[0]))) * 100;
        }
        if (settings.mode.name == `taiko`) {
          CalcAcc = ((resultsScreen.hits[300] + resultsScreen.hits[100] / 2) / (resultsScreen.hits[300] + resultsScreen.hits[100] + resultsScreen.hits[0])) * 100;
        }
        if (settings.mode.name == `fruits`) {
          CalcAcc = ((resultsScreen.hits[300] + resultsScreen.hits[100] + resultsScreen.hits[50]) / (resultsScreen.hits[300] + resultsScreen.hits.katu + resultsScreen.hits[100] + resultsScreen.hits[50] + resultsScreen.hits[0])) * 100;
        }

        racc.innerHTML = `Accuracy: ` + CalcAcc.toFixed(2) + `%`;

        if (cache.rcombo != resultsScreen.maxCombo) {
          cache.rcombo = resultsScreen.maxCombo;
          rcombo.innerHTML = `Combo: ` + resultsScreen.maxCombo;
        }

        if (cache.rank != resultsScreen.rank) {
          cache.rank = resultsScreen.rank;
          rank.innerHTML = resultsScreen.rank;

          if (resultsScreen.rank == `XH` || resultsScreen.rank == `SH`) {
            rank.style.color = `#FFFFFF`;
          }
          if (resultsScreen.rank == `X` || resultsScreen.rank == `S`) {
            rank.style.color = `#FFE669`;
          }
          if (resultsScreen.rank == `A`) {
            rank.style.color = `#79FF69`;
          }
          if (resultsScreen.rank == `B`) {
            rank.style.color = `#6990FF`;
          }
          if (resultsScreen.rank == `C`) {
            rank.style.color = `#EB69FF`;
          }
          if (resultsScreen.rank == `D`) {
            rank.style.color = `#FF6969`;
          }
        }

        if (cache.mods != resultsScreen.mods.name) {
          cache.mods = resultsScreen.mods.name;
          if (resultsScreen.mods.number == '0') {
            modsused.innerHTML = `Mods: None`;
          }
          else {
            modsused.innerHTML = `Mods: ` + resultsScreen.mods.name;
          }
        }

        if (cache.rgeki != resultsScreen.hits.geki) {
          cache.rgeki = resultsScreen.hits.geki;
        }
        if (cache.r300 != resultsScreen.hits[300]) {
          cache.r300 = resultsScreen.hits[300];
        }
        if (cache.rkatu != resultsScreen.hits.katu) {
          cache.rkatu = resultsScreen.hits.katu;
        }
        if (cache.r100 != resultsScreen.hits[100]) {
          cache.r100 = resultsScreen.hits[100];
        }
        if (cache.r50 != resultsScreen.hits[50]) {
          cache.r50 = resultsScreen.hits[50];
        }
        if (cache.r0 != resultsScreen.hits[0]) {
          cache.r0 = resultsScreen.hits[0];
        }

        const Folder = folders.beatmap.replace(/#/g, "%23").replace(/%/g, "%25").replace(/\\/g, "/").replace(/'/g, "%27").replace(/ /g, "%20");
        const Img = files.background;

        rankingPanel.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('http://${window.location.host}/files/beatmap/${Folder}/${Img}')`;

    } catch (error) {
        console.log(error);
    };
});

socket.api_v2_precise((data) => {
    if (cache['data.keys.k1.count'] != data.keys.k1.count) {
      cache['data.keys.k1.count'] = data.keys.k1.count;
      if (data.keys.k1.count == 0) {
        K1Text.innerHTML = `K1`;
      }
      else {
        K1Text.innerHTML = data.keys.k1.count;
      }
    };
    if (cache['data.keys.k2.count'] != data.keys.k2.count) {
      cache['data.keys.k2.count'] = data.keys.k2.count;
      if (data.keys.k2.count == 0) {
        K2Text.innerHTML = `K2`;
      }
      else {
        K2Text.innerHTML = data.keys.k2.count;
      }
    };
    if (cache['data.keys.m1.count'] != data.keys.m1.count) {
      cache['data.keys.m1.count'] = data.keys.m1.count;
      if (data.keys.m1.count == 0) {
        M1Text.innerHTML = `M1`;
      }
      else {
        M1Text.innerHTML = data.keys.m1.count;
      }
    };
    if (cache['data.keys.m2.count'] != data.keys.m2.count) {
      cache['data.keys.m2.count'] = data.keys.m2.count;
      if (data.keys.m2.count == 0) {
        M2Text.innerHTML = `M2`;
      }
      else {
        M2Text.innerHTML = data.keys.m2.count;
      }
    };
    if (cache['data.keys.k1.isPressed'] != data.keys.k1.isPressed) {
      cache['data.keys.k1.isPressed'] = data.keys.k1.isPressed;
      if (data.keys.k1.isPressed == true) {
        K1.style.transform = `translateX(10px)`;
        K1.style.backgroundColor = `var(--keyPressed)`;
      }
      else {
        K1.style.transform = `translateX(0)`;
        K1.style.backgroundColor = `var(--keyColor)`;
      }
    };
    if (cache['data.keys.k2.isPressed'] != data.keys.k2.isPressed) {
        cache['data.keys.k2.isPressed'] = data.keys.k2.isPressed;
        if (data.keys.k2.isPressed == true) {
          K2.style.transform = `translateX(10px)`;
          K2.style.backgroundColor = `var(--keyPressed)`;
        }
        else {
            K2.style.transform = `translateX(0)`;
            K2.style.backgroundColor = `var(--keyColor)`;
        }
      };
    if (cache['data.keys.m1.isPressed'] != data.keys.m1.isPressed) {
      cache['data.keys.m1.isPressed'] = data.keys.m1.isPressed;
      if (data.keys.m1.isPressed == true) {
        M1.style.transform = `translateX(10px)`;
        M1.style.backgroundColor = `var(--keyPressed)`;
      }
      else {
        M1.style.transform = `translateX(0)`;
        M1.style.backgroundColor = `var(--keyColor)`;
      }
    };
    if (cache['data.keys.m2.isPressed'] != data.keys.m2.isPressed) {
      cache['data.keys.m2.isPressed'] = data.keys.m2.isPressed;
      if (data.keys.m2.isPressed == true) {
        M2.style.transform = `translateX(10px)`;
        M2.style.backgroundColor = `var(--keyPressed)`;
      }
      else {
        M2.style.transform = `translateX(0)`;
        M2.style.backgroundColor = `var(--keyColor)`;
      }
    };
  });