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

        // 处理设置返回
        if (command === 'getSettings') {
            console.log(command, message);
        }

        // 更新自定义动画
        if (cache.KiaiFlashMaskAnimation !== message.KiaiFlashMaskAnimation) {
            cache.KiaiFlashMaskAnimation = message.KiaiFlashMaskAnimation;
            const { animName, keyframes } = setFlashBpmAnimation(cache.KiaiFlashMaskAnimation);
            currentFlashBpmAnimName = animName;
            currentFlashBpmAnimKeyframes = keyframes;
            if (keyframes) {
                console.log('flash-bpm动画格式:\n' + keyframes);
            }
        }
    } catch (error) {
        console.log(error);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// MAIN FUNCTION //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.api_v2(({ state, settings, session, profile, performance, resultsScreen, play, beatmap, directPath, folders }) => {
    // 状态更新
    if (cache.stateNumber !== state.number) {
        cache.stateNumber = state.number;
        updateFlashAnimation();
    }
    // bpm 更新
    if (cache.bpm !== beatmap.stats.bpm.realtime) {
        cache.bpm = beatmap.stats.bpm.realtime;
        updateFlashAnimation();
        onKiaiOrBpmChanged();
    }
    // 谱面更新
    if (cache.beatmapFile !== directPath.beatmapFile) {
        cache.beatmapFile = directPath.beatmapFile;
        checkOsuFile(directPath).then(onKiaiOrBpmChanged);
    }
    // 播放进度更新
    if (cache.live != beatmap.time.live) {
        cache.live = beatmap.time.live;
        updateFlashAnimation();
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// 当前自定义动画名和格式
let currentFlashBpmAnimName = 'flash-bpm';
let currentFlashBpmAnimKeyframes = '';

// 动态生成 flash-bpm 动画
function setFlashBpmAnimation(animStr) {
    if (!animStr) return { animName: 'flash-bpm', keyframes: '' };
    const keyframesArr = animStr.split('/').map((seg) => {
        const [percent, opacity] = seg.split('-').map(Number);
        let percentStr = percent + '%';
        return `${percentStr.padEnd(6, ' ')}{ opacity: ${opacity}; }`;
    });
    const keyframes = keyframesArr.join('\n');
    const animName = 'flash-bpm-custom';

    // 移除旧的自定义动画
    const oldStyle = document.getElementById('flash-bpm-style');
    if (oldStyle) oldStyle.remove();

    // 插入新的 keyframes
    const style = document.createElement('style');
    style.id = 'flash-bpm-style';
    style.innerHTML = `@keyframes ${animName} {\n${keyframes}\n}`;
    document.head.appendChild(style);

    return { animName, keyframes };
}

// 更新 flash 动画（非kiai段固定透明度，kiai段播放动画）
function updateFlashAnimation() {
    const flash = document.getElementById('flash');
    if (!flash) return;
    let animName = currentFlashBpmAnimName || 'flash-bpm';
    let bpm = cache.bpm || 120;
    let beatDuration = 60000 / bpm;
    if (cache.stateNumber === 2 && isInKiaiAnim(cache.live)) {
        // kiai动画区间，使用动画透明度
        flash.style.animation = `${animName} ${beatDuration}ms linear infinite`;
        flash.style.opacity = '';
    } else {
        // 非kiai段，固定透明度为自定义动画末尾透明度
        let opacity = 0.5;
        if (typeof cache.KiaiFlashMaskAnimation === 'string' && cache.KiaiFlashMaskAnimation.length > 0) {
            const lastSeg = cache.KiaiFlashMaskAnimation.split('/').pop();
            const lastOpacity = Number(lastSeg.split('-')[1]);
            if (!isNaN(lastOpacity)) opacity = lastOpacity;
        }
        flash.style.animation = 'none';
        flash.style.opacity = opacity;
    }
}

// 谱面kiai段信息
let kiaiSections = []; // [{start, end, animEnd}]
let kiaiAnimEndTime = null; // 未用，可移除

// 解析osu文件，提取kiai段
function checkOsuFile(directPath) {
    const osuUrl = `http://127.0.0.1:24050/files/beatmap/${encodeURIComponent(directPath.beatmapFile)}`;
    console.log('osu文件路径:', osuUrl);
    return fetch(osuUrl)
        .then(res => {
            if (!res.ok) throw new Error('osu文件请求失败');
            return res.text();
        })
        .then(osuText => {
            kiaiSections = [];
            const timingSection = osuText.split('[TimingPoints]')[1]?.split('\n') || [];
            let kiaiOn = false;
            let kiaiStart = null;
            for (const line of timingSection) {
                const parts = line.split(',');
                if (parts.length < 8) continue;
                const time = parseInt(parts[0]);
                const kiai = parseInt(parts[7]);
                if (!kiaiOn && kiai === 1) {
                    kiaiOn = true;
                    kiaiStart = time;
                }
                if (kiaiOn && kiai === 0) {
                    kiaiOn = false;
                    kiaiSections.push({ start: kiaiStart, end: time });
                    kiaiStart = null;
                }
            }
            if (kiaiOn && kiaiStart !== null) {
                kiaiSections.push({ start: kiaiStart, end: null });
            }
            calcKiaiAnimEndTimes();
            console.log('kiai段时间点:', kiaiSections);
            return kiaiSections;
        });
}

// 计算每个kiai段的动画实际结束时间（对齐节拍）
function calcKiaiAnimEndTimes() {
    for (let i = 0; i < kiaiSections.length; i++) {
        const section = kiaiSections[i];
        if (section.end === null) {
            section.animEnd = null;
            continue;
        }
        let bpm = cache.bpm || 120;
        let beatDuration = 60000 / bpm;
        let kiaiLen = section.end - section.start;
        let beats = Math.ceil(kiaiLen / beatDuration);
        section.animEnd = section.start + beats * beatDuration;
    }
}

// 判断当前时间是否在kiai动画区间（包括延长区间和短间隔衔接）
function isInKiaiAnim(time) {
    for (let i = 0; i < kiaiSections.length; i++) {
        const section = kiaiSections[i];
        if (section.end === null) {
            if (time >= section.start) return true;
        } else {
            const nextSection = kiaiSections[i + 1];
            if (time >= section.start && time < section.animEnd) {
                // 下一个kiai段很近，直接连续
                if (
                    nextSection &&
                    nextSection.start < section.animEnd &&
                    time >= section.end &&
                    time < nextSection.start
                ) {
                    return true;
                }
                return true;
            }
        }
    }
    return false;
}

// 计算所有需要闪光的拍点时间（ms）
let flashBeats = [];
function calcFlashBeats() {
    flashBeats = [];
    let bpm = cache.bpm || 120;
    let beatDuration = 60000 / bpm;
    for (let i = 0; i < kiaiSections.length; i++) {
        const section = kiaiSections[i];
        let start = section.start;
        let end = section.end ?? (start + 10 * 60 * 1000); // 没有end就假设很长
        let t = start;
        while (t < end) {
            flashBeats.push(t);
            t += beatDuration;
        }
        // 下一个kiai段间隔短于一拍，直接连续
        const nextSection = kiaiSections[i + 1];
        if (nextSection && nextSection.start - end < beatDuration) {
            continue;
        }
    }
    flashBeats = [...new Set(flashBeats)].sort((a, b) => a - b);
}

// kiai段或bpm变化后调用
function onKiaiOrBpmChanged() {
    calcKiaiAnimEndTimes();
    calcFlashBeats();
}

// 闪光主循环，精准触发每一拍动画
let lastFlashIndex = -1;
function flashLoop() {
    if (cache.stateNumber !== 2) {
        requestAnimationFrame(flashLoop);
        return;
    }
    const now = cache.live;
    for (let i = lastFlashIndex + 1; i < flashBeats.length; i++) {
        if (now >= flashBeats[i]) {
            triggerFlash();
            lastFlashIndex = i;
        } else {
            break;
        }
    }
}

// 触发单次闪光动画
function triggerFlash() {
    const flash = document.getElementById('flash');
    if (!flash) return;
    flash.style.animation = 'none';
    void flash.offsetWidth; // 触发重绘
    flash.style.animation = `${currentFlashBpmAnimName} ${60000 / (cache.bpm || 120)}ms linear 1`;
}

// 页面加载后启动闪光循环
window.addEventListener('DOMContentLoaded', () => {
    flashLoop();
});


