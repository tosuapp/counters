// CODE WAS COMMENTED WITH BLACKBOX.AI (as i saw it commented everything right, but i'm not sure)

import WebSocketManager from "./socket.js";
import { generateColor, getRandomInt } from "./stackoverflow.js";

let websocketUrl = "127.0.0.1:24050";
const socket = new WebSocketManager(websocketUrl);

// Cache for key presses
const cache = {
    K1: false,
    K2: false,
    M1: false,
    M2: false,
};

// Cache for BPM (beats per minute)
const bpmCache = {
    K1: { date: Date.now(), timeout: null },
    K2: { date: Date.now(), timeout: null },
    M1: { date: Date.now(), timeout: null },
    M2: { date: Date.now(), timeout: null },
};

// Get references to the HTML elements for each key
let keys = {
    k1: document.getElementById("counterK1"),
    k2: document.getElementById("counterK2"),
    m1: document.getElementById("counterM1"),
    m2: document.getElementById("counterM2"),
};

socket.sendCommand("getSettings", encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
        const { command, message } = data;
        // get updates for "getSettings" command
        if (command == "getSettings") {
            document.body.style.setProperty("--gradientColor1", message.gradientColor1);
            document.body.style.setProperty("--gradientColor2", message.gradientColor2);
            document.body.style.setProperty("--dashedOutlineColor", message.dashedOutlineColor);
            document.body.style.setProperty("--activeKeyColor", message.activeKeyColor);
            document.body.style.setProperty("--noteColor", message.noteColor1);
            document.body.style.setProperty("--transitionDuration", message.transitionDuration);
            document.body.style.setProperty("--transitionTimingFunction",message.transitionTimingFunction,);
            document.body.style.setProperty("--trackWidth", message.trackWidth);
            document.body.style.setProperty("--trackHeight", message.trackHeight);
            document.body.style.setProperty("--centerLines", +message.centerLines);
            document.body.style.setProperty("--bmcLogo", +message.bmcLogo);

            const mainContainerRects = document
                .getElementById("mainContainer")
                .getBoundingClientRect();

            if (message.overlayDirection == "To top") {
                document.body.style.setProperty("--pressCounterAlign", "center");
                document.body.style.setProperty("--pressCounterRotate", "270deg");
                document.body.style.setProperty("--overlayRotate", "90deg");
                document.body.style.setProperty("--overlayTranslate", `0px, -${mainContainerRects.height}px`,);
            } else if (message.overlayDirection == "To right") {
                document.body.style.setProperty("--pressCounterAlign", "flex-start");
                document.body.style.setProperty("--pressCounterRotate", "180deg");
                document.body.style.setProperty("--overlayRotate", "180deg");
                document.body.style.setProperty("--overlayTranslate", `-${mainContainerRects.width}px, -${mainContainerRects.height}px`,
                );
            } else if (message.overlayDirection == "To bottom") {
                document.body.style.setProperty("--pressCounterAlign", "center");
                document.body.style.setProperty("--pressCounterRotate", "90deg");
                document.body.style.setProperty("--overlayRotate", "270deg");
                document.body.style.setProperty("--overlayTranslate", `-${mainContainerRects.width}px, 0px`,
                );
            } else {
                document.body.style.setProperty("--pressCounterAlign", "flex-end");
                document.body.style.setProperty("--pressCounterRotate", "0deg");
                document.body.style.setProperty("--overlayRotate", "0deg");
                document.body.style.setProperty("--overlayTranslate", "0, 0");
            }

            document.getElementById("trackK1").parentElement.dataset.mode = message.visibilityK1;
            document.getElementById("trackK2").parentElement.dataset.mode = message.visibilityK2;
            document.getElementById("trackM1").parentElement.dataset.mode = message.visibilityM1;
            document.getElementById("trackM2").parentElement.dataset.mode = message.visibilityM2;

            window.startBpm = message.noteColoringRange.slice(0, message.noteColoringRange.indexOf('-'))
            window.endBpm = message.noteColoringRange.slice(message.noteColoringRange.indexOf('-') + 1)
            window.steps = endBpm - startBpm

            window.colors = [message.noteColor1]
            colors = colors.concat(generateColor(message.noteColor2, message.noteColor1, steps))

            window.shakePoint = message.noteShakingPoint
            window.shakeAmplitude = message.noteShakeAmplitude / 10000

            window.noteShaking = message.noteShaking
            window.noteColoring = message.noteColoring

            window.bmcMode = message.bmcMode

            window.trackHeight = parseInt(message.trackHeight) * 4 + 28
            window.trackWidth = parseInt(message.trackWidth)

            window.noteSpeed = parseInt(message.noteSpeed)

            document.body.style.setProperty("--displayKeys", message.hideKeys ? 'none' : 'flex');
            document.body.style.setProperty("--displayPressesCounter", message.hidePressCounter ? 'none' : 'flex-reverse');
            document.body.style.setProperty("--displayBPMcounter", message.hideBPM ? 'none' : 'flex-reverse');
        }
    } catch (error) {
        console.error(error);
    }
});

socket.api_v2_precise((data) => {
    try {
        for (let key in data.keys) {
            if (Object.prototype.hasOwnProperty.call(data.keys, key)) {
                key = key.toUpperCase();
                const pressed = data.keys[key.toLowerCase()].isPressed;
                const count = data.keys[key.toLowerCase()].count;
                const track = document.getElementById(`track${key}`)

                if (pressed != cache[key]) {
                    if (pressed == true) {
                        // Key pressed
                        document.getElementById(key).classList.add('active')

                        if (track.dataset.mode != 'Hide') {
                            track.parentElement.classList.add('show')
                        }

                        const note = document.createElement('div')
                        note.classList.add('note')
                        note.style.width = trackWidth + 'px'
                        note.style.left = trackWidth + 'px'
                        note.style.animation = `moveOut ${noteSpeed}s linear`

                        // Update the BPM display
                        const bpm = Math.round((60 / (Date.now() - bpmCache[key].date)) * 500)

                        document.getElementById(`bpm${key}`).innerHTML =
                            `${bpm}<span class="fs-small">bpm</span>`;
                        bpmCache[key].date = Date.now();

                        // Clear the BPM timeout and set a new one
                        clearTimeout(bpmCache[key].timeout);
                        bpmCache[key].timeout = setTimeout(() => {
                            document.getElementById(`bpm${key}`).innerHTML =
                                `0<span class="fs-small fw-regular">bpm</span>`;
                        }, 1000);

                        // Color note
                        if (noteColoring) {
                            if (bpm > startBpm && bpm < endBpm) {

                                console.log(colors[bpm - startBpm])
                                note.style.background = '#' + colors[bpm - startBpm]
                            } else if (bpm >= endBpm) {
                                note.style.background = '#' + colors[steps]
                            }
                        }

                        // Note shaking
                        if (noteShaking) {
                            if (bpm > shakePoint) {
                                for (let i = 0; i < 10; i++) {
                                    setTimeout(() => {
                                        const firstCoord = (getRandomInt(10) - 5) * (bpm - startBpm) * shakeAmplitude * 5
                                        const secondCoord = (getRandomInt(10) - 5) * (bpm - startBpm) * shakeAmplitude * 5
                                        const thirdCoord = (getRandomInt(10) - 5) * (bpm - startBpm) * shakeAmplitude * 5
                                        
                                        document.getElementById(`track${key}`).style.transform =
                                            `translate(${firstCoord}px, ${secondCoord}px) rotate(${thirdCoord}deg)`
                                        
                                    
                                    }, 25 * i);
                                    setTimeout(() => {
                                        document.getElementById(`track${key}`).style.transform = null
                                    }, 250)
                                }
                            }
                        }

                        // The BMC mode itself
                        if (bmcMode) {
                            note.style.backgroundColor = ''
                            note.style.backgroundSize = '100% 100%'
                            note.style.backgroundImage = 'url(./img/bmc.png)'

                            document.querySelector('.bmc-icon').src = './img/bmc.png'
                        } else {
                            document.querySelector('.bmc-icon').src = './img/logo.png'
                        }

                        track.prepend(note)

                        document.getElementById(`counter${key}`).innerHTML = count
                    } else {
                        // Key released
                        document.getElementById(key).classList.remove('active')

                        const note = track.querySelector('.note')

                        note.style.width = Math.abs( trackWidth - note.getBoundingClientRect().left ) + 'px' 

                        if (note.style.left == '0px') {
                            note.style.animation = `moveOut ${noteSpeed}s linear`
                            note.dataset.ln = true
                        }
                    }

                    cache[key] = pressed
                } else {
                    const notes = Array.from(track.querySelectorAll('.note'))
                    notes.forEach(note => {

                        const noteRect = note.getBoundingClientRect()

                        if (noteRect.left <= 0 && noteRect.right <= trackWidth && noteRect.width >= trackWidth &&!Boolean(note.dataset.ln)) {
                            note.style.animation = `none`
                            note.style.left = `0`
                        }
    
                        if (noteRect.right <= 0) {
                            note.remove();
                        }
                    })


                }
            } 
        }
        
    } catch (error) {
        // console.error(error)
    }
})

socket.api_v2((data) => {
    if (data.state.number != 2) {
        // Hide the main container if the game state is not 2
        document.getElementById("mainContainer").style.opacity = 0;

        // Hide each key container with a delay
        Array.from(document.getElementsByClassName("key-container")).forEach(async (element, i) => {
            setTimeout(() => {
                element.classList.remove("show");
            }, 50 * i);
            element
                .querySelector("div")
                .querySelector("div.press-counter")
                .querySelector("span").innerHTML = 0;
        });
    } else {
        // Show the main container if the game state is 2
        document.getElementById("mainContainer").style.opacity = 1;

        Array.from(document.getElementsByClassName("key-container")).forEach(async (element, i) => {
            if (element.dataset.mode == "Show") {
                setTimeout(() => {
                    element.classList.add("show");
                }, 50 * i);
            }
        });
    }
})