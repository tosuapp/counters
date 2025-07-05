const WS_HOST = window.location.host;
import WebSocketManager from './socket.js';
const socket = new WebSocketManager(WS_HOST);

const cache = {};

socket.onopen = () => {
    socket.sendCommand('applyFilters', [
        {
            field: 'settings',
            keys: [
                'BackgroundAnimationDuration',
                'BackgroundSwitchTime',
                'BackgroundBlurAnimation',
                'BackgroundBrightnessAnimation'
            ]
        },
        {
            field: 'directPath',
            keys: ['skinFolder', 'beatmapBackground']
        },
        {
            field: 'state',
            keys: []
        }
    ]);
};

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// SETTINGS /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
  try {
    const { command, message } = data;
    
    // Update getSettings command
    if (command === 'getSettings') {
      console.log(command, message);
    }

    let animChanged = false;

    // Update animation duration
    if (cache.BackgroundAnimationDuration !== message.BackgroundAnimationDuration) {
        cache.BackgroundAnimationDuration = message.BackgroundAnimationDuration;
    }

    // Update switch time
    if (cache.BackgroundSwitchTime !== message.BackgroundSwitchTime) {
        cache.BackgroundSwitchTime = message.BackgroundSwitchTime;
    }

    // Update Blur animation
    if (cache.BackgroundBlurAnimation !== message.BackgroundBlurAnimation) {
        cache.BackgroundBlurAnimation = message.BackgroundBlurAnimation;
        setCustomAnimation('blur', cache.BackgroundBlurAnimation);
        animChanged = true;
    }

    // Update Brightness animation
    if (cache.BackgroundBrightnessAnimation !== message.BackgroundBrightnessAnimation) {
        cache.BackgroundBrightnessAnimation = message.BackgroundBrightnessAnimation;
        setCustomAnimation('brightness', cache.BackgroundBrightnessAnimation);
        animChanged = true;
    }

    // Print all custom animations if changed
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
    // Update beatmap background
    if (cache.beatmapBackground !== directPath.beatmapBackground) {
        cache.beatmapBackground = directPath.beatmapBackground;
        updateBackground(directPath, folders);
    }

    // Update skin
    if (cache.skinFolder !== directPath.skinFolder) {
        cache.skinFolder = directPath.skinFolder;
        updateBackground(directPath, folders);
    }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// Load URL (returns a Promise)
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

// Dynamically generate blur/brightness animation and insert style
function setCustomAnimation(type, animStr) {
    if (!animStr) return;
    // type: 'blur' or 'brightness'
    const animName = `bg-${type}-custom`;
    const styleId = `bg-${type}-style`;
    // Parse animation string
    const keyframesArr = animStr.split('/').map((seg) => {
        const [percent, value] = seg.split('-').map(Number);
        let percentStr = percent + '%';
        if (type === 'blur') {
            // blur uses px value
            return `${percentStr.padEnd(6, ' ')}{ filter: blur(${value}px) brightness(var(--bg-brightness,0.6)); }`;
        } else if (type === 'brightness') {
            // brightness uses percentage
            return `${percentStr.padEnd(6, ' ')}{ filter: blur(var(--bg-blur,0px)) brightness(${value}%); }`;
        }
        return '';
    });
    const keyframes = keyframesArr.join('\n');

    // Remove old custom animation
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();

    // Insert new keyframes
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `@keyframes ${animName} {\n${keyframes}\n}`;
    document.head.appendChild(style);

    // Save animation format globally for unified printing
    if (!window._bgAnimPrintCache) window._bgAnimPrintCache = {};
    window._bgAnimPrintCache[type] = `@keyframes ${animName} {\n${keyframes}\n}`;
}

// Unified print animation format
function printAllCustomAnimations() {
    if (!window._bgAnimPrintCache) return;
    const blurAnim = window._bgAnimPrintCache['blur'] || '';
    const brightAnim = window._bgAnimPrintCache['brightness'] || '';
    if (blurAnim || brightAnim) {
        console.log(
            'Custom background animation format:\n' +
            (blurAnim ? '[blur]\n' + blurAnim + '\n' : '') +
            (brightAnim ? '[brightness]\n' + brightAnim + '\n' : '')
        );
    }
}

// Get the last value of the animation string
function getLastAnimValue(animStr) {
    if (!animStr) return 0;
    const lastSeg = animStr.split('/').pop();
    const [, value] = lastSeg.split('-').map(Number);
    return value;
}

// Merge animation strings into keyframes
function combineKeyframes(blurAnim, brightAnim) {
    // Parse to array
    const blurArr = blurAnim.split('/').map(seg => {
        const [percent, value] = seg.split('-').map(Number);
        return { percent, blur: value };
    });
    const brightArr = brightAnim.split('/').map(seg => {
        const [percent, value] = seg.split('-').map(Number);
        return { percent, bright: value };
    });
    // Merge percent nodes
    const percents = Array.from(new Set([
        ...blurArr.map(b => b.percent),
        ...brightArr.map(b => b.percent)
    ])).sort((a, b) => a - b);

    // Interpolation
    function getValue(arr, percent, key) {
        for (let i = 0; i < arr.length - 1; i++) {
            if (percent >= arr[i].percent && percent <= arr[i + 1].percent) {
                const p1 = arr[i].percent, v1 = arr[i][key];
                const p2 = arr[i + 1].percent, v2 = arr[i + 1][key];
                if (p2 === p1) return v1;
                return v1 + (v2 - v1) * (percent - p1) / (p2 - p1);
            }
        }
        // Out of range, take endpoint
        if (percent <= arr[0].percent) return arr[0][key];
        return arr[arr.length - 1][key];
    }

    // Generate keyframes
    return percents.map(percent => {
        const blur = getValue(blurArr, percent, 'blur');
        const bright = getValue(brightArr, percent, 'bright');
        return `${percent}% { filter: blur(${blur}px) brightness(${bright}%); }`;
    }).join('\n');
}

// Dynamically generate combined animation
function setCombinedAnimation(blurAnim, brightAnim, duration) {
    const animName = 'bg-combined-custom';
    const styleId = 'bg-combined-style';
    const keyframes = combineKeyframes(blurAnim, brightAnim);

    // Remove old custom animation
    const oldStyle = document.getElementById(styleId);
    if (oldStyle) oldStyle.remove();

    // Insert new keyframes
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `@keyframes ${animName} {\n${keyframes}\n}`;
    document.head.appendChild(style);

    // Apply animation to image
    const bg = document.getElementById('bg');
    bg.style.animation = `${animName} ${duration}ms linear 1`;
}

// Fade in image and apply custom animation
function imageFade(imgElement, url) {
    if (!url) {
        imgElement.style.backgroundColor = 'transparent';
        imgElement.src = url;
        return;
    }

    // Animation parameters
    const blurAnim = cache.BackgroundBlurAnimation || '0-20/100-0';
    const brightAnim = cache.BackgroundBrightnessAnimation || '0-10/100-100';
    const duration = Number(cache.BackgroundAnimationDuration) || 600;

    // Calculate switch timing
    let switchPercent = Number(cache.BackgroundSwitchTime);
    if (isNaN(switchPercent)) switchPercent = 50;
    switchPercent = Math.max(0, Math.min(100, switchPercent));
    const switchTime = duration * (switchPercent / 100);

    // Apply combined animation
    setCombinedAnimation(blurAnim, brightAnim, duration);

    // Switch image at specified animation percent
    setTimeout(() => {
        imgElement.src = url;
    }, switchTime);

    // Set to last frame properties after animation ends
    setTimeout(() => {
        const blurValue = getLastAnimValue(blurAnim); // px
        const brightValue = getLastAnimValue(brightAnim); // %
        imgElement.style.animation = '';
        imgElement.style.filter = `blur(${blurValue}px) brightness(${brightValue}%)`;
    }, duration);
}

// Update background
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


