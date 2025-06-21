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
    
    // 更新 getSettings 指令
    if (command === 'getSettings') {
      console.log(command, message);
    }

    // 更新非 kiai 段透明度
    if (cache.KiaiFlashMaskOpacity !== message.KiaiFlashMaskOpacity) {
        cache.KiaiFlashMaskOpacity = message.KiaiFlashMaskOpacity;
    }

    // 更新 kiai 段闪烁动画
    if (cache.KiaiFlashMaskAnimation !== message.KiaiFlashMaskAnimation) {
        cache.KiaiFlashMaskAnimation = message.KiaiFlashMaskAnimation;
        const { animName, keyframes } = setFlashBpmAnimation(cache.KiaiFlashMaskAnimation);
        currentFlashBpmAnimName = animName;
        currentFlashBpmAnimKeyframes = keyframes;
        // 仅在此处打印动画格式
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
    }

    // 谱面更新
    if (cache.beatmapFile !== directPath.beatmapFile) {
        cache.beatmapFile = directPath.beatmapFile;
        checkOsuFile(directPath);
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

// 保存当前自定义动画名和格式
let currentFlashBpmAnimName = 'flash-bpm';
let currentFlashBpmAnimKeyframes = '';

// 动态生成 flash-bpm 动画，并返回动画名和动画格式
function setFlashBpmAnimation(animStr) {
    if (!animStr) return { animName: 'flash-bpm', keyframes: '' };
    const keyframesArr = animStr.split('/').map((seg) => {
        const [percent, opacity] = seg.split('-').map(Number);
        // 直接用percent作为百分比节点
        let percentStr = percent + '%';
        return `${percentStr.padEnd(6, ' ')}{ opacity: ${opacity}; }`;
    });
    const keyframes = keyframesArr.join('\n');

    // 动画名
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

// 更新 flash 动画
function updateFlashAnimation() {
    const flash = document.getElementById('flash');
    if (!flash) return;
    let animName = currentFlashBpmAnimName || 'flash-bpm';
    if (cache.stateNumber === 2 && isInKiai(cache.live)) {
        // 游戏中且在 kiai 段，使用动画透明度
        flash.style.animation = `${animName} ${60000 / cache.bpm}ms linear infinite`;
        flash.style.opacity = '';
    } else {
        // 其它情况，移除动画，固定透明度为设置值
        const opacity = (typeof cache.KiaiFlashMaskOpacity === 'number')
            ? cache.KiaiFlashMaskOpacity
            : 0.5;
        flash.style.animation = 'none';
        flash.style.opacity = opacity;
    }
}

// 检查 osu 文件，返回 fetch Promise，并解析 kiai 段
let kiaiSections = []; // 全局保存 kiai 段

// 检查 osu 文件，并获取 kiai 时间段
function checkOsuFile(directPath) {
    const osuUrl = `http://127.0.0.1:24050/files/beatmap/${encodeURIComponent(directPath.beatmapFile)}`;
    console.log('osu文件路径:', osuUrl);
    return fetch(osuUrl)
        .then(res => {
            if (!res.ok) throw new Error('osu文件请求失败');
            return res.text();
        })
        .then(osuText => {
            // 解析 kiai 段
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
            console.log('kiai段时间点:', kiaiSections);
            return kiaiSections;
        });
}

// 判断当前时间是否在 kiai 段
function isInKiai(time) {
    for (const section of kiaiSections) {
        if (section.end === null) {
            if (time >= section.start) return true;
        } else {
            if (time >= section.start && time < section.end) return true;
        }
    }
    return false;
}


