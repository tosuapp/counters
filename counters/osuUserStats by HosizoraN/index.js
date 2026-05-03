import WebSocketManager from './deps/socket.js';

const socket = new WebSocketManager(window.location.host);

const cache = {};
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

socket.api_v2(({ profile, play, beatmap, server }) => {
    try {    

    if (cache['UserAvatar'] != profile.id) {
        cache['UserAvatar'] = profile.id;
        UserAvatar.style.backgroundImage = `url("https://a.${server}/${profile.id}")`;
    };

    if (cache['UserFlag'] != profile.countryCode.name) {
        cache['UserFlag'] = profile.countryCode.name;
        const country =
            `${profile.countryCode.name
            .split("")
            .map((char) => 127397 + char.charCodeAt())[0]
            .toString(16)}-${profile.countryCode.name
            .split("")
            .map((char) => 127397 + char.charCodeAt())[1]
            .toString(16)}`;

        UserFlag.style.backgroundImage = `url("https://osu.ppy.sh/assets/images/flags/${country}.svg")`;
    };

    if (cache['UserMode'] != profile.mode.name) {
        cache['UserMode'] = profile.mode.name;
        UserMode.style.backgroundImage = `url("./images/${profile.mode.name}.png")`;
    };

    if (cache['profile.banchoStatus'] != profile.banchoStatus.number) {
        cache['profile.banchoStatus'] = profile.banchoStatus.number;

        ColorBG.setAttribute('class', `Status${profile.banchoStatus.number}`);
        switch (profile.banchoStatus.number) {
            case 0: UserCurrentStatus.innerHTML = `Idle`; break;
            case 1: UserCurrentStatus.innerHTML = `AFK`; break;
            case 2: UserCurrentStatus.innerHTML = `Playing ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 3: UserCurrentStatus.innerHTML = `Editing ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 4: UserCurrentStatus.innerHTML = `Modding ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 5: UserCurrentStatus.innerHTML = `Multiplayer`; break;
            case 6: UserCurrentStatus.innerHTML = `Watching ${play.playerName} play ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 8: UserCurrentStatus.innerHTML = `Testing ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 9: UserCurrentStatus.innerHTML = `Submitting`; break;
            case 11: UserCurrentStatus.innerHTML = `Multiplayer ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 12: UserCurrentStatus.innerHTML = `Multiplaying ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 13: UserCurrentStatus.innerHTML = `OsuDirect ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
        }
    };

    if (cache['profile.name'] != profile.name) {
        cache['profile.name'] = profile.name;

        Username.innerHTML = profile.name;
    };

    if (cache['profile.globalRank'] != profile.globalRank) {
        cache['profile.globalRank'] = profile.globalRank;

        UserRank.innerHTML = "#" + profile.globalRank;

        if (profile.globalRank <= 10 && profile.globalRank !== 1, 0) UserRank.style.color = `rgb(255, 255, 117)`
        else if (profile.globalRank === 1) UserRank.style.color = `rgb(99, 154, 255)`
        else UserRank.style.color = `white`
    };

    if (cache['profile.pp'] != profile.pp) {
        cache['profile.pp'] = profile.pp;

        UserPP.innerHTML = `Performance: ${profile.pp}pp`;
    };

    if (cache['profile.accuracy'] != profile.accuracy) {
        cache['profile.accuracy'] = profile.accuracy;

        UserAcc.innerHTML = `Accuracy: ${profile.accuracy.toFixed(2)}%`;
    };


    if (cache['profile.playCount'] != profile.playCount || cache['profile.level'] != profile.level) {
        cache['profile.playCount'] = profile.playCount;
        cache['profile.level'] = profile.level;

        UserPlayCountAndLevels.innerHTML = `Play Count: ${profile.playCount} (Lv${profile.level.toFixed(0)})`
    };

    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;

    UserCountryNameAndTimes.innerHTML = `${formattedTime} @ ${regionNames.of(profile.countryCode.name)}`;

    } catch (error) {
        console.log(error);
    }
}, [
    'server',
    'profile',
    {
        field: 'beatmap',
        keys: [
            'artist',
            'title',
            'version',
        ]
    },
    {
        field: 'play',
        keys: [
            'playerName'
        ]
    }
]);