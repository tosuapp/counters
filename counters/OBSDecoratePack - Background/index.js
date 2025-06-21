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

    let animChanged = false;

    // 更新动画时长
    if (cache.BackgroundAnimationDuration !== message.BackgroundAnimationDuration) {
        cache.BackgroundAnimationDuration = message.BackgroundAnimationDuration;
    }

    // 更新切换时间
    if (cache.BackgroundSwitchTime !== message.BackgroundSwitchTime) {
        cache.BackgroundSwitchTime = message.BackgroundSwitchTime;
    }

    // 更新 Blur 动画
    if (cache.BackgroundBlurAnimation !== message.BackgroundBlurAnimation) {
        cache.BackgroundBlurAnimation = message.BackgroundBlurAnimation;
        setCustomAnimation('blur', cache.BackgroundBlurAnimation);
        animChanged = true;
    }

    // 更新 Brightness 动画
    if (cache.BackgroundBrightnessAnimation !== message.BackgroundBrightnessAnimation) {
        cache.BackgroundBrightnessAnimation = message.BackgroundBrightnessAnimation;
        setCustomAnimation('brightness', cache.BackgroundBrightnessAnimation);
        animChanged = true;
    }

    // 动画有变化时统一打印
    if (animChanged) {
        printAllCustomAnimations();
    }

  } catch (error) {
    console.log(error);
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// MAIN FUNCTION //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.api_v2(({ directPath, folders }) => {
    // 谱面背景更新
    if (cache.beatmapBackground !== directPath.beatmapBackground) {
        cache.beatmapBackground = directPath.beatmapBackground;
        updateBackground(directPath, folders);
    }

    // 皮肤更新
    if (cache.skinFolder !== directPath.skinFolder) {
        cache.skinFolder = directPath.skinFolder;
        updateBackground(directPath, folders);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// 加载 URL（返回一个 Promise）
function urlFallback(urls) {
    return new Promise((resolve) => {
        let currentIndex = 0;
        const testImg = new Image();

        function tryLoadImage() {
            if (currentIndex >= urls.length) {
                resolve('');
                return;
            }
            testImg.src = urls[currentIndex];
            testImg.onload = () => resolve(testImg.src);
            testImg.onerror = () => {
                currentIndex++;
                tryLoadImage();
            };
        }
        tryLoadImage();
    });
}

// 动态生成 blur/brightness 动画，并插入 style
function setCustomAnimation(type, animStr) {
    if (!animStr) return;
    // type: 'blur' or 'brightness'
    const animName = `bg-${type}-custom`;
    const styleId = `bg-${type}-style`;
    // 解析动画字符串
    const keyframesArr = animStr.split('/').map((seg) => {
        const [percent, value] = seg.split('-').map(Number);
        let percentStr = percent + '%';
        if (type === 'blur') {
            // blur直接用px值
            return `${percentStr.padEnd(6, ' ')}{ filter: blur(${value}px) brightness(var(--bg-brightness,0.6)); }`;
        } else if (type === 'brightness') {
            // brightness直接用百分比
            return `${percentStr.padEnd(6, ' ')}{ filter: blur(var(--bg-blur,0px)) brightness(${value}%); }`;
        }
        return '';
    });
    const keyframes = keyframesArr.join('\n');

    // 移除旧的自定义动画
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();

    // 插入新的 keyframes
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `@keyframes ${animName} {\n${keyframes}\n}`;
    document.head.appendChild(style);

    // 保存动画格式到全局，供统一打印
    if (!window._bgAnimPrintCache) window._bgAnimPrintCache = {};
    window._bgAnimPrintCache[type] = `@keyframes ${animName} {\n${keyframes}\n}`;
}

// 统一打印动画格式
function printAllCustomAnimations() {
    if (!window._bgAnimPrintCache) return;
    const blurAnim = window._bgAnimPrintCache['blur'] || '';
    const brightAnim = window._bgAnimPrintCache['brightness'] || '';
    if (blurAnim || brightAnim) {
        console.log(
            '自定义背景动画格式:\n' +
            (blurAnim ? '[blur]\n' + blurAnim + '\n' : '') +
            (brightAnim ? '[brightness]\n' + brightAnim + '\n' : '')
        );
    }
}

// 获取动画字符串的最后一个值
function getLastAnimValue(animStr) {
    if (!animStr) return 0;
    const lastSeg = animStr.split('/').pop();
    const [, value] = lastSeg.split('-').map(Number);
    return value;
}

// 合并动画字符串为关键帧
function combineKeyframes(blurAnim, brightAnim) {
    // 解析为数组
    const blurArr = blurAnim.split('/').map(seg => {
        const [percent, value] = seg.split('-').map(Number);
        return { percent, blur: value };
    });
    const brightArr = brightAnim.split('/').map(seg => {
        const [percent, value] = seg.split('-').map(Number);
        return { percent, bright: value };
    });
    // 合并百分比节点
    const percents = Array.from(new Set([
        ...blurArr.map(b => b.percent),
        ...brightArr.map(b => b.percent)
    ])).sort((a, b) => a - b);

    // 插值
    function getValue(arr, percent, key) {
        for (let i = 0; i < arr.length - 1; i++) {
            if (percent >= arr[i].percent && percent <= arr[i + 1].percent) {
                const p1 = arr[i].percent, v1 = arr[i][key];
                const p2 = arr[i + 1].percent, v2 = arr[i + 1][key];
                if (p2 === p1) return v1;
                return v1 + (v2 - v1) * (percent - p1) / (p2 - p1);
            }
        }
        // 超出范围取端点
        if (percent <= arr[0].percent) return arr[0][key];
        return arr[arr.length - 1][key];
    }

    // 生成关键帧
    return percents.map(percent => {
        const blur = getValue(blurArr, percent, 'blur');
        const bright = getValue(brightArr, percent, 'bright');
        return `${percent}% { filter: blur(${blur}px) brightness(${bright}%); }`;
    }).join('\n');
}

// 动态生成合并动画
function setCombinedAnimation(blurAnim, brightAnim, duration) {
    const animName = 'bg-combined-custom';
    const styleId = 'bg-combined-style';
    const keyframes = combineKeyframes(blurAnim, brightAnim);

    // 移除旧的自定义动画
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();

    // 插入新的 keyframes
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `@keyframes ${animName} {\n${keyframes}\n}`;
    document.head.appendChild(style);

    // 应用动画到图片
    const bg = document.getElementById('bg');
    bg.style.animation = `${animName} ${duration}ms linear 1`;
}

// 淡入图片，应用自定义动画
function imageFade(imgElement, url) {
    if (!url) {
        imgElement.style.backgroundColor = 'transparent';
        imgElement.src = url;
        return;
    }

    // 动画参数
    const blurAnim = cache.BackgroundBlurAnimation || '0-20/100-0';
    const brightAnim = cache.BackgroundBrightnessAnimation || '0-10/100-100';
    const duration = Number(cache.BackgroundAnimationDuration) || 600;

    // 计算切换时机
    let switchPercent = Number(cache.BackgroundSwitchTime);
    if (isNaN(switchPercent)) switchPercent = 50;
    switchPercent = Math.max(0, Math.min(100, switchPercent));
    const switchTime = duration * (switchPercent / 100);

    // 应用合并动画
    setCombinedAnimation(blurAnim, brightAnim, duration);

    // 在动画指定百分比时切换图片
    setTimeout(() => {
        imgElement.src = url;
    }, switchTime);

    // 动画结束后设置为动画最后一帧的属性
    setTimeout(() => {
        const blurValue = getLastAnimValue(blurAnim); // px
        const brightValue = getLastAnimValue(brightAnim); // %
        imgElement.style.animation = '';
        imgElement.style.filter = `blur(${blurValue}px) brightness(${brightValue}%)`;
    }, duration);
}

// 更新背景
function updateBackground(directPath, folders) {
    const background = document.querySelector('#bg');
    const backgroundPath = encodeURIComponent(directPath.beatmapBackground.replace(folders.songs, ''));

    urlFallback([
        `http://127.0.0.1:24050/files/beatmap/${backgroundPath}`,
        `http://127.0.0.1:24050/files/skin/menu-background@2x.jpg?skin=${encodeURIComponent(cache.skinFolder)}`,
        `http://127.0.0.1:24050/files/skin/menu-background.jpg?skin=${encodeURIComponent(cache.skinFolder)}`
    ])
        .then(validUrl => {
            imageFade(background, validUrl);
        });
}


