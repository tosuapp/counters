import WebSocketManager from './deps/socket.js';

const socket = new WebSocketManager(window.location.host);

const cache = {};
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));
socket.commands((data) => {
    try {
      const { command, message } = data;
      if (command === 'getSettings') {
        console.log(command, message);
      };

      if (cache['MatchmakingStats'] != message['MatchmakingStats']) {
        cache['MatchmakingStats'] = message['MatchmakingStats'];
      };

    } catch (error) {
        console.log(error);
    }
});

socket.api_v2(({ profile, play, beatmap, server }) => {
    try {    

    if (cache['profile.matchmaking'] != profile.matchmaking) {
        cache['profile.matchmaking'] = profile.matchmaking;
    };

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
            case 0: UserCurrentStatus.textContent = `Idle`; break;
            case 1: UserCurrentStatus.textContent = `AFK`; break;
            case 2: UserCurrentStatus.textContent = `Playing ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 3: UserCurrentStatus.textContent = `Editing ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 4: UserCurrentStatus.textContent = `Modding ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 5: UserCurrentStatus.textContent = `Multiplayer`; break;
            case 6: UserCurrentStatus.textContent = `Watching ${play.playerName} play ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 8: UserCurrentStatus.textContent = `Testing ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 9: UserCurrentStatus.textContent = `Submitting`; break;
            case 11: UserCurrentStatus.textContent = `Multiplayer ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 12: UserCurrentStatus.textContent = `Multiplaying ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
            case 13: UserCurrentStatus.textContent = `OsuDirect ${beatmap.artist} - ${beatmap.title} [${beatmap.version}]`; break;
        }
    };

    if (cache['profile.name'] != profile.name) {
        cache['profile.name'] = profile.name;

        Username.textContent = profile.name;
    };

    if (cache['profile.countryCode.name'] != profile.countryCode.name) {
        cache['profile.countryCode.name'] = profile.countryCode.name;

        const currentTime = new Date();
        const hours = currentTime.getHours().toString().padStart(2, '0');
        const minutes = currentTime.getMinutes().toString().padStart(2, '0');
        const formattedTime = `${hours}:${minutes}`;

        UserCountryNameAndTimes.textContent = `${formattedTime} @ ${regionNames.of(profile.countryCode.name)}`;
    };

    if (profile.globalRank <= 10 && (profile.globalRank !== 1 || profile.globalRank !== 0) && (cache['MatchmakingStats'] && cache['profile.matchmaking'] == null || !cache['MatchmakingStats'])) UserRank.style.color = `#ffff75`;
    else if(profile.matchmaking.rank <= 10 && (profile.matchmaking.rank !== 1 || profile.matchmaking.rank !== 0) && (cache['MatchmakingStats'] && cache['profile.matchmaking'] != null || cache['MatchmakingStats'])) UserRank.style.color = `#ffff75`;
    else if (profile.globalRank == 1 && (cache['MatchmakingStats'] && cache['profile.matchmaking'] == null || !cache['MatchmakingStats'])) UserRank.style.color = `#639aff`;
    else if (profile.matchmaking.rank == 1 && (cache['MatchmakingStats'] && cache['profile.matchmaking'] != null || cache['MatchmakingStats'])) UserRank.style.color = `#639aff`;
    else UserRank.style.color = `#fff`;

    //
    if (cache['MatchmakingStats'] && cache['profile.matchmaking'] != null) return;

    if (cache['profile.globalRank'] != profile.globalRank) {
        cache['profile.globalRank'] = profile.globalRank;

        UserRank.textContent = "#" + profile.globalRank;
    };

    if (cache['profile.pp'] != profile.pp) {
        cache['profile.pp'] = profile.pp;

        UserPP.textContent = `Performance: ${profile.pp.toLocaleString()}pp`;
    };

    if (cache['profile.accuracy'] != profile.accuracy) {
        cache['profile.accuracy'] = profile.accuracy;

        UserAcc.textContent = `Accuracy: ${profile.accuracy.toFixed(2)}%`;
    };


    if (cache['profile.playCount'] != profile.playCount || cache['profile.level'] != profile.level) {
        cache['profile.playCount'] = profile.playCount;
        cache['profile.level'] = profile.level;

        UserPlayCountAndLevels.textContent = `Play Count: ${profile.playCount} (Lv${profile.level.toFixed(0)})`
    };

    //
    if (cache['profile.matchmaking'] == null && cache['MatchmakingStats'] || !cache['MatchmakingStats']) return;

    if (cache['profile.matchmaking.rank'] != profile.matchmaking.rank) {
        cache['profile.matchmaking.rank'] = profile.matchmaking.rank;

        UserRank.textContent = `#` + profile.matchmaking.rank || 0;
    };

    if (cache['profile.matchmaking.rating'] != profile.matchmaking.rating) {
        cache['profile.matchmaking.rating'] = profile.matchmaking.rating;

        UserPP.textContent = `Rating: ` + profile.matchmaking.rating.toLocaleString();
    };

    if (cache['profile.matchmaking.wins'] != profile.matchmaking.wins) {
        cache['profile.matchmaking.wins'] = profile.matchmaking.wins;

        UserAcc.textContent = `Wins: ` + profile.matchmaking.wins;
    };

    if (cache['profile.matchmakingplays'] != profile.matchmaking.plays) {
        cache['profile.matchmakingplays'] = profile.matchmaking.plays;

        UserPlayCountAndLevels.textContent = `Plays: ` + profile.matchmaking.plays;
    };

    } catch (error) {
        console.log(error);
    }
}, [
    'server',
    'profile',
    {field: 'beatmap', keys: ['artist', 'title', 'version']},
    {field: 'play', keys: ['playerName']}
]);