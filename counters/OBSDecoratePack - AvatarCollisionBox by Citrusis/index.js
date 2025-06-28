import WebSocketManager from './socket.js';
const socket = new WebSocketManager('127.0.0.1:24050');

const cache = {};

// DOM 元素
const avatar = document.getElementById('avatar');
const box = document.getElementById('box');

// 全局变量
let boxWidth = 0, boxHeight = 0;
let avatarWidth = 0, avatarHeight = 0;
let pos = { x: 0, y: 0 };           // 头像位置
let vel = { x: 0, y: 0 };           // 头像速度
let acceleration = { x: 0, y: 0 };  // 头像加速度
let mousePos = { x: 0, y: 0 };      // 鼠标位置

let avatarSize;                 // 头像目标短边(px)
let fillet;                     // 圆角(px)
let speed;                      // 速度(px/s)
let accelerationValue;          // 加速度(px/s²)
let accelerationRotation;       // 加速度方向(度)
let cursorMode = 'none';        // 'none' | 'attract' | 'repel'

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// SETTINGS /////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
  try {
    const { command, message } = data;
    if (command === 'getSettings') {
      console.log(command, message);
    }

    let changed = false; // 标记本次是否有设置变更

    // 图片URL
    if (cache.CollisionBoxIMG !== message.CollisionBoxIMG) {
      cache.CollisionBoxIMG = message.CollisionBoxIMG;
      if (message.CollisionBoxIMG && message.CollisionBoxIMG.trim() !== '') {
        setAvatarSrcWithAssetsFallback(message.CollisionBoxIMG.trim());
      } else if (cache.profileid) {
        avatar.src = `https://a.ppy.sh/${cache.profileid}`;
      } else {
        avatar.src = 'https://a.ppy.sh/1';
      }
      // 只刷新图片，不做其他设置
      changed = true;
    }

    // 头像大小
    if (cache.CollisionBoxSize !== message.CollisionBoxSize) {
      cache.CollisionBoxSize = message.CollisionBoxSize;
      avatarSize = Number(message.CollisionBoxSize);
      setAvatarSizeAndPosition();
      changed = true;
    }

    // 圆角
    if (cache.CollisionBoxFillet !== message.CollisionBoxFillet) {
      cache.CollisionBoxFillet = message.CollisionBoxFillet;
      fillet = Number(message.CollisionBoxFillet);
      avatar.style.borderRadius = `${fillet}px`;
      changed = true;
    }

    // 速度
    if (cache.CollisionBoxSpeed !== message.CollisionBoxSpeed) {
      cache.CollisionBoxSpeed = message.CollisionBoxSpeed;
      speed = message.CollisionBoxSpeed !== undefined && message.CollisionBoxSpeed !== null
        ? Number(message.CollisionBoxSpeed)
        : 100;
      vel = randomVelocity();
      changed = true;
    }

    // 加速度
    if (cache.CollisionBoxAcceleration !== message.CollisionBoxAcceleration) {
      cache.CollisionBoxAcceleration = message.CollisionBoxAcceleration;
      accelerationValue = message.CollisionBoxAcceleration !== undefined && message.CollisionBoxAcceleration !== null
        ? Number(message.CollisionBoxAcceleration)
        : 9.8;
      updateAcceleration();
      changed = true;
    }

    // 加速度角度
    if (cache.CollisionBoxAccelerationRotation !== message.CollisionBoxAccelerationRotation) {
      cache.CollisionBoxAccelerationRotation = message.CollisionBoxAccelerationRotation;
      accelerationRotation = (message.CollisionBoxAccelerationRotation ?? -90);
      updateAcceleration();
      changed = true;
    }

    // 光标吸引/排斥/无
    if (cache.CollisionBoxCursor !== message.CollisionBoxCursor) {
      cache.CollisionBoxCursor = message.CollisionBoxCursor;
      if (cache.CollisionBoxCursor === 'Attract') {
        cursorMode = 'attract';
      } else if (cache.CollisionBoxCursor === 'Repel') {
        cursorMode = 'repel';
      } else {
        cursorMode = 'none';
      }
      changed = true;
    }

    // 只在有设置变更时打印一次日志
    if (changed) {
      console.log(
        `头像大小：${avatarWidth}x${avatarHeight}px，速度（每秒）：${speed}px，加速度：${accelerationValue} px/s²，加速度角度：${accelerationRotation}，圆角：${fillet}px，光标模式：${cursorMode}`
      );
    }

  } catch (error) {
    console.log(error);
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////// MAIN FUNCTION //////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

socket.api_v2(({ profile }) => {

  // 玩家ID更新
  if (cache.profileid != profile.id) {
    cache.profileid = profile.id;
    avatar.src = `https://a.ppy.sh/${profile.id}`;
  }
  
});

// 初始化时只绑定一次 onload
avatar.onload = () => {
  setAvatarSizeAndPosition();
  vel = randomVelocity();
  updateAcceleration();
  requestAnimationFrame(animate);
};

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////// FUNCTIONS ////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

// 监听鼠标移动，记录鼠标在box内的坐标
document.addEventListener('mousemove', (e) => {
  const rect = box.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;
});

// 随机生成初始速度（避免与边界平行）
function randomVelocity() {
  let angle;
  while (true) {
    angle = Math.random() * Math.PI * 2;
    const deg = angle * 180 / Math.PI;
    if (
      Math.abs(deg % 180) > 15 && Math.abs((deg - 90) % 180) > 15
    ) break;
  }
  const frameSpeed = speed / 60;
  return {
    x: Math.cos(angle) * frameSpeed,
    y: Math.sin(angle) * frameSpeed
  };
}

// 计算头像尺寸、初始位置（居中），并设置圆角
function setAvatarSizeAndPosition() {
  // 判断是否为默认头像
  const isDefault =
    (!cache.CollisionBoxIMG || cache.CollisionBoxIMG.trim() === '') &&
    (!cache.profileid || avatar.src === `https://a.ppy.sh/${cache.profileid}` || avatar.src === 'https://a.ppy.sh/1');

  // 获取box尺寸
  boxWidth = box.clientWidth;
  boxHeight = box.clientHeight;

  // 限制最大尺寸
  const maxAvatarWidth = boxWidth / 4;
  const maxAvatarHeight = boxHeight / 4;
  const size = Math.max(1, Math.min(avatarSize, maxAvatarWidth, maxAvatarHeight));

  if (!isDefault && avatar.naturalWidth && avatar.naturalHeight) {
    // 非默认图片，短边等比缩放到size
    let w = avatar.naturalWidth;
    let h = avatar.naturalHeight;
    if (w < h) {
      avatar.width = size;
      avatar.height = Math.round(size * h / w);
    } else {
      avatar.height = size;
      avatar.width = Math.round(size * w / h);
    }
    // 如果长边超过box最大限制，再整体缩放
    if (avatar.width > maxAvatarWidth || avatar.height > maxAvatarHeight) {
      const scale = Math.min(maxAvatarWidth / avatar.width, maxAvatarHeight / avatar.height);
      avatar.width = Math.round(avatar.width * scale);
      avatar.height = Math.round(avatar.height * scale);
    }
  } else {
    // 默认图片，正方形
    avatar.width = size;
    avatar.height = size;
  }
  avatarWidth = avatar.width;
  avatarHeight = avatar.height;

  // 圆角
  avatar.style.borderRadius = `${fillet}px`;

  // 初始位置设为box中心
  pos = {
    x: (boxWidth - avatarWidth) / 2,
    y: (boxHeight - avatarHeight) / 2
  };
}

// 更新基础加速度（重力/角度），若角度为负则无基础加速度
function updateAcceleration() {
  if (accelerationRotation < 0) {
    acceleration.x = 0;
    acceleration.y = 0;
    return;
  }
  const rad = (accelerationRotation ?? 0) * Math.PI / 180;
  const acc = accelerationValue / 60;
  acceleration.x = Math.cos(rad) * acc;
  acceleration.y = Math.sin(rad) * acc;
}

// 动画主循环
function animate() {
  // 基础加速度
  updateAcceleration();

  // 光标吸引/排斥加速度（叠加，强度随距离变化，box对角线为100）
  if (cursorMode === 'attract' || cursorMode === 'repel') {
    const avatarCenter = {
      x: pos.x + avatarWidth / 2,
      y: pos.y + avatarHeight / 2
    };
    let dx = mousePos.x - avatarCenter.x;
    let dy = mousePos.y - avatarCenter.y;
    let dist = Math.sqrt(dx * dx + dy * dy);

    // 计算box对角线长度
    const diag = Math.sqrt(boxWidth * boxWidth + boxHeight * boxHeight);
    // 距离比例，box对角线为100
    let ratio = 1 - Math.min(dist / diag, 1); // 距离越近，ratio越大，远时为0，近时为1

    if (dist > 1) {
      dx /= dist;
      dy /= dist;
      if (cursorMode === 'repel') {
        dx = -dx;
        dy = -dy;
      }
      // 每帧加速度，强度随距离变化
      const acc = (accelerationValue / 60) * ratio;
      acceleration.x += dx * acc;
      acceleration.y += dy * acc;
    }
  }

  // 应用加速度
  vel.x += acceleration.x;
  vel.y += acceleration.y;

  pos.x += vel.x;
  pos.y += vel.y;

  // 边界反弹
  if (pos.x <= 0) {
    pos.x = 0;
    vel.x *= -1;
  } else if (pos.x + avatarWidth >= boxWidth) {
    pos.x = boxWidth - avatarWidth;
    vel.x *= -1;
  }
  if (pos.y <= 0) {
    pos.y = 0;
    vel.y *= -1;
  } else if (pos.y + avatarHeight >= boxHeight) {
    pos.y = boxHeight - avatarHeight;
    vel.y *= -1;
  }

  avatar.style.left = `${pos.x}px`;
  avatar.style.top = `${pos.y}px`;

  requestAnimationFrame(animate);
}

// 设置头像图片源，直接使用 CollisionBoxIMG 的 url，留空则用玩家头像，加载失败用默认头像
function setAvatarSrcWithAssetsFallback(url) {
  if (url && url.trim() !== '') {
    // 只有图片url真正变化时才设置src
    if (avatar.src !== url && !avatar.src.endsWith(url)) {
      avatar.src = url;
    }
  } else if (cache.profileid) {
    const profileUrl = `https://a.ppy.sh/${cache.profileid}`;
    if (avatar.src !== profileUrl) {
      avatar.src = profileUrl;
    }
  } else {
    const defaultUrl = 'https://a.ppy.sh/1';
    if (avatar.src !== defaultUrl) {
      avatar.src = defaultUrl;
    }
  }
}

// 只绑定一次 onerror，加载失败时使用默认头像
avatar.onerror = () => {
  if (avatar.src !== 'https://a.ppy.sh/1') {
    avatar.src = 'https://a.ppy.sh/1';
  }
}
