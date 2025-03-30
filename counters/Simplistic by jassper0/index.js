const HOST = window.location.host;
const socket = new ReconnectingWebSocket(`ws://${HOST}/ws`);
// Variables
let mainContainer = document.getElementById("main");
let line = document.getElementById("line");
let gameContainer = document.getElementById("game-container");
let songContainer = document.getElementById("song-container");
let sliderBreak = document.getElementById("sb");
let ppFC = document.getElementById("ppfc");
let rank = document.getElementById("rank");
// Functions
function setRankStyle(text, color, shadow) {
    rank.innerHTML = text;
    rank.style.color = color;
    rank.style.textShadow = shadow;
}
socket.onopen = () => console.log("Successfully Connected");
socket.onclose = event => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = error => console.log("Socket Error: ", error);


let pp = new CountUp('pp', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
let fc = new CountUp('ppfc', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
let h100 = new CountUp('h100', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: "", decimal: "." });
let h50 = new CountUp('h50', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: "", decimal: "." });
let h0 = new CountUp('h0', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: "", decimal: "." });
let ss = new CountUp('ss', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });
let sb = new CountUp('sb', 0, 0, 0, .5, { useEasing: true, useGrouping: true, separator: " ", decimal: "." });


const cache = {};

socket.onmessage = event => {
    try {
        const data = JSON.parse(event.data);
        const menu = data.menu;
        const play = data.gameplay;


        if (cache['grade'] != data.gameplay.hits.grade.current) {
            cache['grade'] = data.gameplay.hits.grade.current;


            switch (cache['grade']) {
                case 'XH':
                    cache.color = "#e0e0e0";
                    cache.textShadow = "0 0 0.5rem #e0e0e0";
                    break;

                case 'X':
                    cache.color = "#d6c253";
                    cache.textShadow = "0 0 0.5rem #d6c253";
                    break;

                case 'SH':
                    cache.color = "#e0e0e0";
                    cache.textShadow = "0 0 0.5rem #e0e0e0";
                    break;

                case 'S':
                    cache.color = "#d6c253";
                    cache.textShadow = "0 0 0.5rem #d6c253";
                    break;

                case 'A':
                    cache.color = "#7ed653";
                    cache.textShadow = "0 0 0.5rem #7ed653";
                    break;

                case 'B':
                    cache.color = "#53d4d6";
                    cache.textShadow = "0 0 0.5rem #53d4d6";
                    break;

                case 'C':
                    cache.color = "#d6538e";
                    cache.textShadow = "0 0 0.5rem #d6538e";
                    break;

                case "D":
                    cache.color = "#f04848";
                    cache.textShadow = "0 0 0.5rem #f04848";
                    break;

                default:
                    cache.color = "#e0e0e0";
                    cache.textShadow = "0 0 0.5rem #e0e0e0";
                    break;
            };

            cache['grade-'] = cache['grade'].replace('X', 'SS').replace('H', '');

            setRankStyle(cache['grade-'], cache.color, cache.textShadow);
        };







        //Game State Check
        switch (menu.state) {
            case 7:
            case 14:
            case 2:
                //Main
                mainContainer.style.opacity = "1";
                //Box
                document.documentElement.style.setProperty('--width', ` 500px`);
                // Line
                document.documentElement.style.setProperty('--progress', ` ${(menu.bm.time.current / menu.bm.time.mp3 * 100).toFixed(2)}%`);
                line.style.cssText = "transition: transform 500ms ease, opacity 20ms ease, width 500ms ease;";
                line.style.transform = "translate(0px, 5px)";
                line.style.opacity = "1";
                // Game Container
                gameContainer.style.top = "0";
                // Song Container
                songContainer.style.top = "100px";


                // Sliderbreak
                if (cache['sb'] != play.hits.sliderBreaks) {
                    cache['sb'] = play.hits.sliderBreaks;

                    if (play.hits.sliderBreaks >= 1) {
                        sb.update(play.hits.sliderBreaks);
                        sliderBreak.style.transform = "scale(1)";
                        sliderBreak.style.opacity = "1";
                    } else {
                        sliderBreak.style.transform = "scale(0)";
                        sliderBreak.style.opacity = "0";
                    };
                };


                // PP FC
                if (cache['ppfc'] != play.pp.fc) {
                    cache['ppfc'] = play.pp.fc;

                    if (play.hits.sliderBreaks >= 1 || play.hits[0] >= 1) {
                        fc.update(play.pp.fc);
                        ppFC.style.transform = "scale(1)";
                        ppFC.style.opacity = "1";
                    } else {
                        ppFC.style.transform = "scale(0)";
                        ppFC.style.opacity = "0";
                    };
                };


                // Set Only in Gameplay
                if (cache['play.pp.current'] != play.pp.current) {
                    cache['play.pp.current'] = play.pp.current;
                    pp.update(play.pp.current);
                };

                if (cache['play.hits[100]'] != play.hits[100]) {
                    cache['play.hits[100]'] = play.hits[100];
                    h100.update(play.hits[100]);
                };

                if (cache['play.hits[50]'] != play.hits[50]) {
                    cache['play.hits[50]'] = play.hits[50];
                    h50.update(play.hits[50]);
                };

                if (cache['play.hits[0]'] != play.hits[0]) {
                    cache['play.hits[0]'] = play.hits[0];
                    h0.update(play.hits[0]);
                };

                break;
            case 0:
                //Main
                mainContainer.style.opacity = "0";
                break;
            default:
                //Main
                mainContainer.style.opacity = "1";
                //Box
                document.documentElement.style.setProperty('--width', ` 300px`);
                //Line
                document.documentElement.style.setProperty('--progress', ` 100%`);
                line.style.cssText = "transition: transform 500ms ease, opacity 20ms ease, width 300ms ease;";
                line.style.transform = "translate(0px, 5px)";
                line.style.opacity = "1";
                // Game Container
                gameContainer.style.top = "-100px";
                //Song Container
                songContainer.style.top = "0";

                if (cache['menu.pp100'] != menu.pp['100']) {
                    cache['menu.pp100'] = menu.pp["100"];
                    ss.update(cache['menu.pp100']);
                };

                // Sliderbreak
                sliderBreak.style.transform = "scale(0)";
                sliderBreak.style.opacity = "0";
                // PP FC
                ppFC.style.transform = "scale(0)";
                ppFC.style.opacity = "0";
                break;
        }
    } catch (err) {
        console.log(err);
    };
};
