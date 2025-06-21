import WebSocketManager from './socket.js';
const socket = new WebSocketManager('127.0.0.1:24050');

const cache = {};

// DOM 元素
const colorImg = document.getElementById('color');

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// SETTINGS /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
        const { command, message } = data;
        if (command === 'getSettings') {

            // FC颜色
            if (cache.FCCheckFCColor !== message.FCCheckFCColor) {
                cache.FCCheckFCColor = message.FCCheckFCColor;
            }
            // AP颜色
            if (cache.FCCheckAPColor !== message.FCCheckAPColor) {
                cache.FCCheckAPColor = message.FCCheckAPColor;
            }
            // 动画时长
            if (cache.FCCheckDuration !== message.FCCheckDuration) {
                cache.FCCheckDuration = message.FCCheckDuration;
                if (colorImg) {
                    colorImg.style.transition = `background ${cache.FCCheckDuration || 300}ms ease, opacity ${cache.FCCheckDuration || 300}ms ease`;
                }
            }
            FCCheck();
        }
    } catch (error) {
        console.log(error);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// MAIN FUNCTION //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.api_v2(({ state, beatmap, play }) => {

    // 状态
    if (cache.statenumber !== state.number) {
        cache.statenumber = state.number;
    }

    // 播放进度
    if (cache.beatmaptimelive !== beatmap.time.live) {
        cache.beatmaptimelive = beatmap.time.live;
    }

    // 总时长
    if (cache.beatmaptimefirstObject !== beatmap.time.firstObject) {
        cache.beatmaptimefirstObject = beatmap.time.firstObject;
    }

    // 等级
    if (cache.playrankcurrent !== play.rank.current) {
        cache.playrankcurrent = play.rank.current;
    }

    // 连击数
    if (cache.playcombocurrent !== play.combo.current) {
        cache.playcombocurrent = play.combo.current;
    }

    FCCheck()
});

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

function FCCheck() {
    if (cache.statenumber === 2) {
        colorImg.style.opacity = 1;
        colorImg.style.background = cache.FCCheckAPColor;
        
        if (cache.beatmaptimelive > cache.beatmaptimefirstObject) {
            if (cache.playrankcurrent !== 'XH' && cache.playrankcurrent !== 'X') {
                colorImg.style.background = cache.FCCheckFCColor;

                if (cache.playcombocurrent === 0) {
                    colorImg.style.opacity = 0;
                }
            }
        }
    } else {
        colorImg.style.opacity = 0;
    }
}