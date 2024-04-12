let socket = new ReconnectingWebSocket("ws://127.0.0.1:24050/websocket/v2");

socket.onopen = () => {
    console.log("api v2 connected");
};
socket.onclose = (event) => {
    console.log("Socket Closed Connection: ", event);
    socket.send("Client Closed!");
};
socket.onerror = (error) => {
    console.log("Socket Error: ", error);
};

socket.onmessage = (event) => {
    let data = JSON.parse(event.data);

    UserAvatar.style.backgroundImage = `url("https://a.ppy.sh/${data.profile.id}")`
    UserFlag.style.backgroundImage = `url("./images/flags/${data.profile.countryCode.name}.png")`
    UserMode.style.backgroundImage = `url("./images/${data.profile.mode.name}.png")`

    Username.innerHTML = data.profile.name
    UserRank.innerHTML = "#" + data.profile.globalRank
    UserPP.innerHTML = `Performance: ${data.profile.pp}pp`
    UserAcc.innerHTML = `Accuracy: ${data.profile.accuracy}%`
    UserPlayCountAndLevels.innerHTML = `Play Count: ${data.profile.playCount} (Lv${data.profile.level.toFixed(0)})`

    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    UserCountryNameAndTimes.innerHTML = `${formattedTime} @ ${data.profile.countryCode.name}`

    //my vietnamese friend forced to me code this :sob:
    if (data.profile.countryCode.name == 'VN') {
        UserCountryNameAndTimes.innerHTML = `${formattedTime} @ (Sponsored by Pho Real)`
    }

    if (data.profile.banchoStatus.number == 0 || data.profile.banchoStatus.number == 13) {
        ColorBG.style.backgroundColor = `rgba(63, 124, 169, 0.5)`
        ColorBG.style.borderColor = `rgb(110, 168, 230)`
        UserCurrentStatus.innerHTML = `Idle`
    }
    if (data.profile.banchoStatus.number == 1) {
        ColorBG.style.backgroundColor = `rgba(0, 0, 0, 0.5)`
        ColorBG.style.borderColor = `rgb(90, 90, 90)`
        UserCurrentStatus.innerHTML = `AFK`
    }
    if (data.profile.banchoStatus.number == 2) {
        ColorBG.style.backgroundColor = `rgba(156, 156, 156, 0.5)`
        ColorBG.style.borderColor = `rgb(160, 160, 160)`
        UserCurrentStatus.innerHTML = `Playing ${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`
    }
    if (data.profile.banchoStatus.number == 3) {
        ColorBG.style.backgroundColor = `rgba(205, 101, 101, 0.5)`
        ColorBG.style.borderColor = `rgb(173, 85, 85)`
        UserCurrentStatus.innerHTML = `Editing ${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`
    }
    if (data.profile.banchoStatus.number == 4) {
        ColorBG.style.backgroundColor = `rgba(90, 217, 82, 0.5)`
        ColorBG.style.borderColor = `rgb(85, 173, 90)`
        UserCurrentStatus.innerHTML = `Modding ${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`
    }
    if (data.profile.banchoStatus.number == 5) {
        ColorBG.style.backgroundColor = `rgba(205, 145, 101, 0.5)`
        ColorBG.style.borderColor = `rgb(230, 173, 110)`
        UserCurrentStatus.innerHTML = `Multiplayer`
        if (data.profile.banchoStatus.number == 11) {
            UserCurrentStatus.innerHTML = `Multiplayer ${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`
        }
    }
    if (data.profile.banchoStatus.number == 6) {
        ColorBG.style.backgroundColor = `rgba(141, 116, 255, 0.5)`
        ColorBG.style.borderColor = `rgb(143, 109, 222)`
        UserCurrentStatus.innerHTML = `Watching ${data.play.playerName} play ${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`
    }
    if (data.profile.banchoStatus.number == 8) {
        ColorBG.style.backgroundColor = `rgba(215, 82, 217, 0.5)`
        ColorBG.style.borderColor = `rgb(173, 85, 169)`
        UserCurrentStatus.innerHTML = `Testing ${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`
    }
    if (data.profile.banchoStatus.number == 9) {
        ColorBG.style.backgroundColor = `rgba(136, 255, 199, 0.5)`
        ColorBG.style.borderColor = `rgb(85, 184, 142)`
        UserCurrentStatus.innerHTML = `Submitting`
    }
    if (data.profile.banchoStatus.number == 12) {
        ColorBG.style.backgroundColor = `rgba(240, 232, 123, 0.5)`
        ColorBG.style.borderColor = `rgb(220, 216, 108)`
        UserCurrentStatus.innerHTML = `Multiplaying ${data.beatmap.artist} - ${data.beatmap.title} [${data.beatmap.version}]`
    }

    // api for user background don't touch (if touch it gonna fucking spam the request)
    // postUserID(data.profile.id)
    // async function postUserID(id) {
    //     try {
    //         const data = await axios.get(`https://phubahosi.vercel.app/api/user/${id}`).then((response) => {
    //            rawData = response.data
    //         });
    //         UserBG.style.backgroundImage = `url('${rawData.cover.url}')`;
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }

}