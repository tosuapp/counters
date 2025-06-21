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

    // 开始时间
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

let fcBroken = false;

function FCCheck() {
    if (
        cache.statenumber === 2 ||
        cache.statenumber === 7 ||
        cache.statenumber === 14 ||
        cache.statenumber === 17 ||
        cache.statenumber === 18
    ) {
        // 新一局刚开始，重置
        if (cache.beatmaptimelive <= cache.beatmaptimefirstObject) {
            fcBroken = false;
        }
        // 第一个物件出现时断连
        if (cache.beatmaptimelive === cache.beatmaptimefirstObject && cache.playcombocurrent === 0) {
            fcBroken = true;
        }
        // 第一个物件后断连
        if (cache.beatmaptimelive > cache.beatmaptimefirstObject && cache.playcombocurrent === 0) {
            fcBroken = true;
        }
        if (fcBroken) {
            colorImg.style.opacity = 0;
            return;
        }
        colorImg.style.opacity = 1;
        colorImg.style.background = cache.FCCheckAPColor;
        if (cache.beatmaptimelive > cache.beatmaptimefirstObject) {
            if (cache.playrankcurrent !== 'XH' && cache.playrankcurrent !== 'X') {
                colorImg.style.background = cache.FCCheckFCColor;
            }
        }
    } else {
        colorImg.style.opacity = 0;
    }
}
