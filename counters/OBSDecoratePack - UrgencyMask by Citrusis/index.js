import WebSocketManager from './socket.js';
const socket = new WebSocketManager('127.0.0.1:24050');

const cache = {};

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// SETTINGS /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
        const { command, message } = data;
        if (command === 'getSettings') {
            // Urgency 颜色
            if (cache.UrgencyMaskColor !== message.UrgencyMaskColor) {
                cache.UrgencyMaskColor = message.UrgencyMaskColor;
            }
            // 模式
            if (cache.UrgencyMaskMode !== message.UrgencyMaskMode) {
                cache.UrgencyMaskMode = message.UrgencyMaskMode;
            }
            // 过渡动画
            if (cache.UrgencyMaskAnimation !== message.UrgencyMaskAnimation) {
                cache.UrgencyMaskAnimation = message.UrgencyMaskAnimation;
                // 仅在动画更新时打印解析结果
                if (cache.UrgencyMaskAnimation) {
                    const animArr = parseAnimationString(cache.UrgencyMaskAnimation);
                    animArr.forEach(frame => {
                        console.log(`${frame.x}%    { opacity: ${frame.y}; }`);
                    });
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// MAIN FUNCTION //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let lastStateNumber = null;
let fadeTimeout = null;

socket.api_v2(({ state, play, beatmap }) => {
    const urgency = document.getElementById('urgency');

    // 检查statenumber变化，做透明度渐变
    if (lastStateNumber !== state.number) {
        if (urgency) {
            urgency.style.opacity = 0;
            if (fadeTimeout) clearTimeout(fadeTimeout);
            fadeTimeout = setTimeout(() => {
                urgency.style.opacity = 1;
            }, 300);
        }
        lastStateNumber = state.number;
    }

    // 更新缓存
    if (cache.statenumber !== state.number) {
        cache.statenumber = state.number;
    }
    if (cache.playhealthBarnormal !== play.healthBar.normal) {
        cache.playhealthBarnormal = play.healthBar.normal;
    }
    if (cache.playaccuracy !== play.accuracy) {
        cache.playaccuracy = play.accuracy;
    }
    if (cache.progress !== (beatmap.time.live / beatmap.time.lastObject)) {
        cache.progress = (beatmap.time.live / beatmap.time.lastObject);
    }

    // 打印当前值
    console.log(
        'playhealthBarnormal:', cache.playhealthBarnormal,
        'playaccuracy:', cache.playaccuracy,
        'progress:', cache.progress
    );

    if (state.number === 2) {
        urgency.style.display = 'block';
        let value = 0;
        if (cache.UrgencyMaskMode === 'HP') {
            value = cache.playhealthBarnormal;
        } else if (cache.UrgencyMaskMode === 'ACC') {
            value = cache.playaccuracy;
        } else if (cache.UrgencyMaskMode === 'Progress') {
            value = (1 - (cache.progress)) * 100;
        }
        // 打印 value
        console.log('value:', value);

        // 解析动画并打印关键帧
        let alpha = 1;
        if (cache.UrgencyMaskAnimation) {
            const animArr = parseAnimationString(cache.UrgencyMaskAnimation);
            animArr.forEach(frame => {
                console.log(`${frame.x}%    { opacity: ${frame.y}; }`);
            });
            alpha = getAlphaFromAnimation(animArr, value);
        } else {
            alpha = Math.max(0, Math.min(1, value / 100));
        }
        urgency.style.background = cache.UrgencyMaskColor
            ? hexToRgba(cache.UrgencyMaskColor, alpha)
            : `rgba(255,0,0,${alpha})`;
    } else {
        urgency.style.display = 'none';
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 将HEX颜色转为RGBA
 * @param {string} hex - 颜色字符串
 * @param {number} alpha - 透明度
 * @returns {string} rgba颜色
 */
function hexToRgba(hex, alpha) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * 解析动画字符串为关键帧数组
 * 例如 "0-1/100-0" => [{x:0, y:1}, {x:100, y:0}]
 * @param {string} str
 * @returns {Array<{x:number, y:number}>}
 */
function parseAnimationString(str) {
    return str.split('/').map(pair => {
        const [x, y] = pair.split('-').map(Number);
        return { x, y };
    });
}

/**
 * 根据当前值和关键帧数组计算透明度
 * @param {Array<{x:number, y:number}>} animationArr
 * @param {number} value
 * @returns {number}
 */
function getAlphaFromAnimation(animationArr, value) {
    if (!animationArr || animationArr.length === 0) return 1;
    // 线性插值
    for (let i = 0; i < animationArr.length - 1; i++) {
        const a = animationArr[i], b = animationArr[i + 1];
        if (value >= a.x && value <= b.x) {
            const t = (value - a.x) / (b.x - a.x);
            return a.y + (b.y - a.y) * t;
        }
    }
    // 超出范围时取端点
    if (value <= animationArr[0].x) return animationArr[0].y;
    if (value >= animationArr[animationArr.length - 1].x) return animationArr[animationArr.length - 1].y;
    return 1;
}
