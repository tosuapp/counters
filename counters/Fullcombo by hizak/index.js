import WebSocketManager from './js/socket.js';
const socket = new WebSocketManager(window.location.host);

const FullcomboImageElement = document.getElementById("fullcombo")

let is_animation_playable = false
let animationPlayer_

const DEFAULT_PATH = "assets"
const EMPTY_IMAGE = "assets/empty.png"
const FULLCOMBO_BASENAME = "custom_fullcombo"

const cache = {
    beatmapTimeLive: -1,
    beatmapTimeLastobject: 0,
    beatmapTimeMp3Length: 0,
    hits: 0,
    combo: 0,

    directPathSkin: 0,

    enableSkinFolderAnimation: false
};

function createAnimationplayer(imgElement, path) {
    animationPlayer_ = new AnimationPlayer(
        imgElement,
        path + "/" + FULLCOMBO_BASENAME + ".png",
        EMPTY_IMAGE
    )
}

function update_animation() {
    if (Boolean(cache.enableSkinFolderAnimation) == true) {
        createAnimationplayer(FullcomboImageElement, `http://127.0.0.1:24050/files/skin`)
    } else {
        createAnimationplayer(FullcomboImageElement, DEFAULT_PATH)
    }
}

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
        const { message } = data;
        if (message['enableSkinFolderAnimation'] != null) {
            cache.enableSkinFolderAnimation = message['enableSkinFolderAnimation'];
            update_animation()
        }
    } catch { console.log("a") }
})

update_animation()

socket.api_v2(({ play, directPath, beatmap }) => {
    try {
        if (cache.beatmapTimeLive !== beatmap.time.live) cache.beatmapTimeLive = beatmap.time.live
        if (cache.beatmapTimeLastobject !== beatmap.time.lastObject) cache.beatmapTimeLastobject = beatmap.time.lastObject
        if (cache.beatmapTimeMp3Length !== beatmap.time.mp3Length) cache.beatmapTimeMp3Length = beatmap.time.mp3Length
        if (cache.hits !== play.hits) cache.hits = play.hits
        if (cache.combo !== play.combo.current) cache.combo = play.combo.current

        if (cache.directPathSkin !== directPath.skinFolder) {
            cache.directPathSkin = directPath.skinFolder
            update_animation()
        }

        if (cache.beatmapTimeLive > 1000 && cache.beatmapTimeLive >= cache.beatmapTimeLastobject) {
            if (cache.hits[0] == 0 && cache.combo > 0) {
                if (is_animation_playable) {
                    is_animation_playable = false
                    animationPlayer_.play()
                }
            }
        }

        if (cache.beatmapTimeLive < 0 || cache.combo == 0) {
            is_animation_playable = true
            animationPlayer_.reset_frame()
        }

    } catch (error) { console.log(error) };
});