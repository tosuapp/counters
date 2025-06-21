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

  } catch (error) {
    console.log(error);
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// MAIN FUNCTION //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.api_v2(({ state, settings, session, profile, performance, resultsScreen, play, beatmap, directPath, folders }) => {

    // 皮肤更新
    if (cache.skinFolder !== directPath.skinFolder) {
        cache.skinFolder = directPath.skinFolder;
        updateMenuGlowMask();
    }

});

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// 检查文本文件（如ini），返回文本文件URL
function updateSkinText(elementName, skinFolder) {
    const url = `http://127.0.0.1:24050/files/skin/${elementName}?skin=${encodeURIComponent(skinFolder)}`;
    return Promise.resolve(url);
}

// 解析 skin.ini 中 MenuGlow 的 rgb
function parseMenuGlow(iniContent) {
    // 匹配 MenuGlow: r,g,b
    const match = iniContent.match(/MenuGlow\s*:\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (match) {
        const [r, g, b] = match.slice(1, 4).map(Number);
        return `rgb(${r},${g},${b})`;
    }
    // 默认色
    return 'rgb(255,255,255)';
}

// 更新 menuglowmask 色块
function updateMenuGlowMask() {
    updateSkinText('skin.ini', cache.skinFolder).then(url => {
        const maskColor = document.getElementById('menuglowcolor');
        if (!url) {
            maskColor.style.background = 'rgb(255,255,255)';
            return;
        }
        fetch(url)
            .then(res => res.text())
            .then(text => {
                const color = parseMenuGlow(text);
                console.log('MenuGlow color:', color); 
                maskColor.style.background = color;
            });
    });
}