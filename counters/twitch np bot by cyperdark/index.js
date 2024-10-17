import WebSocketManager from './js/socket.js';



const cache = {};
const url = new URL(`${window.location.origin}${window.location.pathname}${window.location.hash.replace('#', '?')}`);

const presets = [
    'beatmapStatus',
    'beatmapID',
    'beatmapSetID',
    'beatmapArtist',
    'beatmapTitle',
    'beatmapMapper',
    'beatmapAuthor',
    'beatmapCreator',
    'beatmapVersion',
    'beatmapMode',
    'beatmapStars',
    'beatmapStarsLive',
    'beatmapStarsAim',
    'beatmapStarsSpeed',
    'beatmapStarsFlashlight',
    'beatmapStarsSliderFactor',
    'beatmapAR',
    'beatmapCS',
    'beatmapOD',
    'beatmapHP',
    'beatmapBPM',
    'beatmapMaxBPM',
    'beatmapLiveBPM',
    'beatmapMaxCombo',
    'beatmapTimeMapped',
    'beatmapTime',
    'cursorSize',
    'mouseSens',
    'skinName',
    'audioVolume',
    'audioVolumeMusic',
    'audioVolumeEffects',
    'audioOffset',
    'backgroundDim',
    'retryKey',
    'osuK1',
    'osuK2',
    'osuSmoke',
    'fruitsK1',
    'fruitsK2',
    'fruitsDash',
    'taikoInnerLeft',
    'taikoInnerRight',
    'taikoOuterLeft',
    'taikoOuterRight',
    'gameWidth',
    'gameHeight',
    'sessionTime',
    'gameState',
    'userID',
    'userName',
    'userCountry',
    'userPP',
    'userAccuracy',
    'userGlobalRank',
    'userRankedScore',
    'userLevel',
    'userPlaycount',
    'pp100',
    'pp99',
    'pp98',
    'pp97',
    'pp96',
    'pp95',
    'mods',

    'calcMods',
    'calcAcc',
    'calcCombo',
    'calcMisses',
    'calcPP',
    'calcPPAccuracy',
    'calcPPAim',
    'calcPPFlashlight',
    'calcPPSpeed',
    'calcPPDifficulty',
    'calcStars',
    'calcStarsAim',
    'calcStarsSpeed',
    'calcStarsFlashlight',
    'calcOD',
    'calcHP',
    'calcAR',
    'calcStarsStamina',
    'calcStarsRhythm',
    'calcStarsColor',
    'calcStarsPeak',
];

const descriptions = [
    'aka ranked, loved and etc.',
    'difficulty id',
    'beatmapset id',
    'artist name',
    'title of the song',
    'beatmap creator',
    'beatmap creator',
    'beatmap creator',
    'difficulty name',
    'beatmap gamemode name',
    'total Star rating',
    'Star rating up until current beatmap time',
    'Aim Star Rating',
    'Speed Star Rating',
    'Flashlight Star Rating',
    'SliderFactor Star Rating',
    'Approach rate',
    'Circle size',
    'Overall difficulty',
    'HP drain rate',
    'common beatmap bpm',
    'maximum beatmap bpm',
    'current beatmap bpm (based on timings)',
    'max beatmap combo',
    'beatmap drain time',
    'beatamp mp3 time',
    'in-game cursor size',
    'in-game mouse sens',
    'name of the skin from skin.ini',
    'total game volume',
    'music volume',
    'effects volume',
    'in-game audio offset',
    'background dim (from 0 to 100)',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    'keybind',
    '',
    '',
    'total osu running time',
    'game state name',
    '',
    '',
    'user country code',
    '',
    '',
    '',
    '',
    '',
    '',
    'PP for 100% with selected mods',
    'PP for 99% with selected mods',
    'PP for 98% with selected mods',
    'PP for 97% with selected mods',
    'PP for 96% with selected mods',
    'PP for 95% with selected mods',
    'mods name',

    '!calc used mods',
    '!calc used accuracy',
    '!calc used combo',
    '!calc used misses',
    '!calc total pp',
    '!calc accuracy portion of pp (Only available for osu! and osu!taiko)',
    '!calc aim portion of pp (Only available for osu!)',
    '!calc flashlight portion of pp (Only available for osu!)',
    '!calc speed portion of pp (Only available for osu!)',
    '!calc strain of pp (Only available for osu!taiko and osu!mania)',
    '!calc total stars',
    '!calc aim portion of the stars (Only available for osu!)',
    '!calc speed portion of the stars (Only available for osu!)',
    '!calc flashlight portion of the stars (Only available for osu!)',
    '!calc OD (Only available for osu!',
    '!calc HP (Only available for osu!',
    '!calc AR (Only available for osu! and osu!catch)',
    '!calc difficulty of the stamina skill (Only available for osu!taiko)',
    '!calc rhythm of the stamina skill (Only available for osu!taiko)',
    '!calc color of the stamina skill (Only available for osu!taiko)',
    '!calc peak of the stamina skill (Only available for osu!taiko)',
];



let host = "127.0.0.1:24050" || window.location.host;
const socket = new WebSocketManager(host);
const client_id = 'tkczcp9ksjp7sji2tww43eerc4vqz7';


const commands_text = document.createElement('div');
commands_text.id = 'commands_text';
commands_text.classList.add('commands');


const authorization = document.createElement('div');
authorization.id = 'authorization';
authorization.classList.add('authorization');
authorization.innerHTML = 'Pending';

const modal = document.createElement('div');
modal.id = 'modal';
modal.classList.add('modal');


document.body.appendChild(commands_text);
document.body.appendChild(authorization);
document.body.appendChild(modal);


function on_open() {
    try {
        console.log('[] started');
        socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));

    } catch (error) {
        console.log(error);
    };
};


if (url.searchParams.has('help')) {
    cache.screen = 'help';
    display_cheatsheet();
};

if (url.searchParams.has('access_token')) {
    cache.screen = 'token';
    display_auth_token();
};




async function startTwitchClient(clientToken) {
    if (cache.screen == 'help' || cache.screen == 'token') return;
    if (!window.obsstudio) {
        modal.classList.add('-yellow');
        modal.classList.remove('-red');
        modal.innerHTML = `Add this Bot as browser in obs instead`;
        return;
    };


    console.log('[startTwitchClient]', `started`);

    if (cache['twitch-client']) cache['twitch-client'].disconnect();
    let user_login = '';

    modal.classList.remove('-yellow');
    modal.classList.remove('-red');
    modal.innerHTML = ``;


    try {
        const cached = getCookie('user_login');
        if (cached) {
            user_login = cached;
            console.log('[startTwitchClient]', `logined as cached ${user_login}`);
        }
        else {
            const request = await fetch('https://api.twitch.tv/helix/users', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${clientToken}`,
                    'Client-Id': client_id,
                },
            }).then(async response => {
                if (response.status >= 400 && response.status < 600) {
                    throw await response.json();
                }
                return await response.json();
            });


            if (Array.isArray(request.data)) {
                user_login = request.data[0].login;

                setCookie('user_login', user_login, 7);
                console.log('[startTwitchClient]', `logined as ${user_login}`);
            };
        };
    } catch (error) {
        console.log('[startTwitchClient]', 'name-error', error);

        authorization.innerHTML = 'Error';
        authorization.classList.add('-red');
        authorization.classList.remove('-yellow');
        authorization.classList.remove('-green');

        modal.classList.add('-red');
        modal.classList.remove('-yellow');
        modal.innerHTML = error.message;
        return;
    };


    // eslint-disable-next-line
    cache['twitch-client'] = new tmi.Client({
        options: { debug: true },
        connection: {
            reconnect: false,
            secure: false,
        },
        identity: {
            username: user_login,
            password: `oauth:${clientToken}`,
        },
        channels: [],
    });


    cache['twitch-client']
        .connect()
        .then(() => {
            console.log('[startTwitchClient]', 'connected');
            cache['twitch-client'].join(cache['twitch-channel']);
        })
        .catch(v => {
            console.error('[startTwitchClient]', 'catch', v);
            authorization.innerHTML = 'Re:authorize';
            authorization.classList.add('-red');
            authorization.classList.remove('-green');


            modal.classList.add('-yellow');
            modal.classList.remove('-red');
            modal.innerHTML = `Unable to connect to the server, please double check access_token`;
        });


    cache['twitch-client'].on('message', async (channel, tags, message, self) => {
        if (self) return;


        const msg = message.toLowerCase();
        const first = message.split(' ')?.[0] || ' ';
        // buil-in commands
        if (msg.includes('!commands')) {
            if (cache[`commands-list`]) return;


            const all = cache['twitch-commands'].filter(r => r.commandStatus == true);
            const response = all
                .map(r => {
                    if (r.commandAliases.trim() != '') return `${r.commandName} (${r.commandAliases})`;
                    return r.commandName;
                })
                .join(' ') || 'No commands enabled';


            say(channel, response, tags.id);

            cache[`commands-list`] = true;
            await sleep(5000);
            cache[`commands-list`] = false;
            return;
        };


        if (msg.startsWith('!calc')) {
            if (cache['commands-cd-calc'] && tags.badges.broadcaster == null) return;

            try {
                const command = cache['twitch-commands'].find(r => r.commandName.toLowerCase() == '!calc');
                if (command && command.commandStatus != true) return;

                const preset = command?.commandResponse || '{calcStars}* - {calcPP}pp [calcMods != ]+{calcMods} [/calcMods][calcAcc != ]{calcAcc}% [/calcAcc][calcCombo != ]{calcCombo}x [/calcCombo][calcMisses != ]{calcMisses}xMiss [/calcMisses]';
                const commands = message.toLowerCase().replace('!calc ', '').split(' ');

                let accuracy = '';
                let combo = '';
                let modsName = '';
                let mods = -1;
                let misses = '';


                commands.forEach(r => {
                    const _combo = /\d+c/.exec(r);
                    if (_combo) {
                        combo = +_combo[0].replace('c', '');
                        return;
                    };


                    const _misses = /\d+x/.exec(r);
                    if (_misses) {
                        misses = +_misses[0].replace('x', '');
                        return;
                    };


                    const _accuracy = /\d+(\.\d+)?/.exec(r);
                    if (_accuracy) {
                        accuracy = +_accuracy[0];
                        return;
                    };


                    const _mods = /(?!x)[a-zA-Z]+/.exec(r);
                    if (_mods) {
                        mods = j6h(_mods[0]);
                        if (mods > 0)
                            modsName = _mods[0]?.toUpperCase();
                        return;
                    };
                });


                const obj = {};
                if (accuracy) obj.acc = accuracy;
                if (combo) obj.combo = combo;
                if (mods > 0) obj.mods = mods;
                else obj.mods = cache['modsID'];

                if (misses) obj.nMisses = misses;

                try {
                    const calculate = await socket.calculate_pp(obj);
                    if (calculate.error) {
                        say(channel, calculate.error == 'not_ready' ? 'osu not running' : calculate.error, { 'reply-parent-msg-id': tags.id });
                        return;
                    }

                    cache['calcMods'] = modsName;
                    cache['calcAcc'] = accuracy;
                    cache['calcCombo'] = combo;
                    cache['calcMisses'] = misses;

                    cache['calcPP'] = Math.round(calculate.pp) || 0;
                    if (calculate?.ppAccuracy != null) cache['calcPPAccuracy'] = Math.round(calculate.ppAccuracy) || 0;
                    if (calculate?.ppAim != null) cache['calcPPAim'] = Math.round(calculate.ppAim) || 0;
                    if (calculate?.ppFlashlight != null) cache['calcPPFlashlight'] = Math.round(calculate.ppFlashlight) || 0;
                    if (calculate?.ppSpeed != null) cache['calcPPSpeed'] = Math.round(calculate.ppSpeed) || 0;
                    if (calculate?.ppDifficulty != null) cache['calcPPDifficulty'] = Math.round(calculate.ppDifficulty) || 0;

                    if (calculate?.difficulty?.stars != null) cache['calcStars'] = calculate.difficulty.stars.toFixed(2) || 0;
                    if (calculate?.difficulty?.aim != null) cache['calcStarsAim'] = calculate.difficulty.aim.toFixed(2) || 0;
                    if (calculate?.difficulty?.speed != null) cache['calcStarsSpeed'] = calculate.difficulty.speed.toFixed(2) || 0;
                    if (calculate?.difficulty?.flashlight != null) cache['calcStarsFlashlight'] = calculate.difficulty.flashlight.toFixed(2) || 0;
                    if (calculate?.difficulty?.od != null) cache['calcOD'] = calculate.difficulty.od.toFixed(2) || 0;
                    if (calculate?.difficulty?.hp != null) cache['calcHP'] = calculate.difficulty.hp.toFixed(2) || 0;
                    if (calculate?.difficulty?.ar != null) cache['calcAR'] = calculate.difficulty.ar.toFixed(2) || 0;
                    if (calculate?.difficulty?.stamina != null) cache['calcStarsStamina'] = calculate.difficulty.stamina.toFixed(2) || 0;
                    if (calculate?.difficulty?.rhythm != null) cache['calcStarsRhythm'] = calculate.difficulty.rhythm.toFixed(2) || 0;
                    if (calculate?.difficulty?.color != null) cache['calcStarsColor'] = calculate.difficulty.color.toFixed(2) || 0;
                    if (calculate?.difficulty?.peak != null) cache['calcStarsPeak'] = calculate.difficulty.peak.toFixed(2) || 0;

                    say(channel, tosuRenamer(preset), tags.id);

                    await sleep(1);
                    cache['calcMods'] = cache['calcAccuracy'] = cache['calcCombo'] = cache['calcMisses'] = cache['calcPP'] = cache['calcPPAccuracy'] = cache['calcPPAim'] = cache['calcPPFlashlight'] = cache['calcPPSpeed'] = cache['calcPPDifficulty'] = cache['calcStars'] = cache['calcStarsAim'] = cache['calcStarsSpeed'] = cache['calcStarsFlashlight'] = cache['calcOD'] = cache['calcHP'] = cache['calcAR'] = cache['calcStarsStamina'] = cache['calcStarsRhythm'] = cache['calcStarsColor'] = cache['calcStarsPeak'] = undefined;
                } catch (error) {
                    console.log(error);
                    say(channel, `Error, format: !calc accuracy (96.34) combo (1324x) mods (HDDT) miss (10m)`, { 'reply-parent-msg-id': tags.id });
                };
            } catch (error) {
                console.log(error);
            } finally {
                cache['calc'] = true;
                await sleep(5000);
                cache['calc'] = false;
            };
            return;
        };


        const command = cache['twitch-commands'].find(r => {
            if (r.commandStatus != true) return false;

            const alias = r.commandAliases?.split(',').map(r => r.trim()).filter(r => r != null && r != '') || [];
            return first == r.commandName.toLowerCase() || alias.some(a => first == a.toLowerCase());
        }) || cache['twitch-commands'].find(r => {
            if (r.commandStatus != true) return false;

            const alias = r.commandAliases?.split(',').map(r => r.trim()).filter(r => r != null && r != '') || [];
            return msg.includes(r.commandName.toLowerCase()) || alias.some(a => msg.includes(a.toLowerCase()));
        });
        if (command) {
            if (command.userLevel != 'everyone' && command.userLevel == 'broadcaster') {
                if (command.userLevel == 'moderator' && tags.badges.moderator == null) return;
                if (command.userLevel == 'subscriber' && (tags.badges.subscriber == null && tags.badges.moderator == null)) return;
                if (command.userLevel == 'vip' && (tags.badges.vip == null && tags.badges.moderator == null)) return;
            };


            const cooldown = command.commandCooldown || 5000;
            if (cooldown && cache[`commands-cd-${command.commandName}`]) return;

            say(channel, tosuRenamer(command.commandResponse), tags.id);

            if (cooldown) cache[`commands-cd-${command.commandName}`] = true;
            if (cooldown) await sleep(cooldown);
            if (cooldown) cache[`commands-cd-${command.commandName}`] = false;
        };
    });

    cache['twitch-client'].on('join', (channel) => {
        if (channel != `#${cache['twitch-channel']}`) return;


        authorization.innerHTML = 'Authorized';
        authorization.classList.add('-green');
        authorization.classList.remove('-red');

        modal.classList.remove('-yellow');
        modal.classList.remove('-red');
        modal.innerHTML = ``;
    });

    cache['twitch-client'].on('disconnected', (one) => {
        authorization.innerHTML = 'Disconnected';
        authorization.classList.remove('-red');
        authorization.classList.remove('-green');

        if (one != '') return;

        modal.classList.add('-yellow');
        modal.classList.remove('-red');
        modal.innerHTML = `Unable to connect to the server, please double check access_token`;
    });


    function say(channel, text, id) {
        if (!cache.osu_is_running)
            cache['twitch-client'].say(channel, `oops, osu/tosu is not running`, { 'reply-parent-msg-id': id });
        else
            cache['twitch-client'].say(channel, text, { 'reply-parent-msg-id': id });
    };
};


socket.commands(async (data) => {
    try {
        const { command, message } = data;
        if (command != 'getSettings') return;
        if (url.searchParams.has('access_token')) return;


        if (Array.isArray(message['twitchCommands'])) {
            cache['twitch-commands'] = message['twitchCommands'];


            const active = cache['twitch-commands'].filter(r => r.commandStatus == true);
            const inactive = cache['twitch-commands'].filter(r => r.commandStatus != true);
            commands_text.innerHTML = `<span>Commands:</span> Active <b>${active.length}</b> <a>•</a> Inactive <b class="red">${inactive.length}</b>`;
        };

        if (message['twitchChannel'])
            cache['twitch-channel'] = message['twitchChannel'];

        if (message['twitchToken']) {
            if (cache['twitch-token'] != message['twitchToken'] && cache['twitch-client']) {
                cache['twitch-client'].disconnect();
                cache['twitch-client'] = undefined;

                await sleep(2000);
            };


            cache['twitch-token'] = message['twitchToken'];
            if (!cache['twitch-client'] && cache['twitch-channel'] && cache['twitch-token'])
                startTwitchClient(cache['twitch-token']);
        }
        else if (!cache.screen) {
            cache.screen = 'broken_auth';
            authorization.innerHTML = 'Unauthorized';


            modal.classList.add('-red');
            modal.classList.remove('-yellow');
            modal.innerHTML = 'Please authorize';
        };
    } catch (error) {
        console.log(error);
    };
});

socket.api_v2(async (data) => {
    if (!cache.osu_is_running) cache.osu_is_running = true;
    try {
        if (cache['beatmapStatus'] != data.beatmap.status.name.toLowerCase()) cache['beatmapStatus'] = data.beatmap.status.name.toLowerCase();
        if (cache['beatmapID'] != data.beatmap.id) cache['beatmapID'] = data.beatmap.id;
        if (cache['beatmapSetID'] != data.beatmap.set) cache['beatmapSetID'] = data.beatmap.set;
        if (cache['beatmapArtist'] != data.beatmap.artist) cache['beatmapArtist'] = data.beatmap.artist;
        if (cache['beatmapTitle'] != data.beatmap.title) cache['beatmapTitle'] = data.beatmap.title;
        if (cache['beatmapMapper'] != data.beatmap.mapper) cache['beatmapMapper'] = cache['beatmapAuthor'] = cache['beatmapCreator'] = data.beatmap.mapper;
        if (cache['beatmapVersion'] != data.beatmap.version) cache['beatmapVersion'] = data.beatmap.version;
        if (cache['beatmapMode'] != data.beatmap.mode.name) cache['beatmapMode'] = data.beatmap.mode.name;

        if (cache['beatmapStars'] != data.beatmap.stats.stars.total) cache['beatmapStars'] = data.beatmap.stats.stars.total;
        if (cache['beatmapStarsLive'] != data.beatmap.stats.stars.live) cache['beatmapStarsLive'] = data.beatmap.stats.stars.live;
        if (cache['beatmapStarsAim'] != data.beatmap.stats.stars.aim) cache['beatmapStarsAim'] = data.beatmap.stats.stars.aim;
        if (cache['beatmapStarsSpeed'] != data.beatmap.stats.stars.speed) cache['beatmapStarsSpeed'] = data.beatmap.stats.stars.speed;
        if (cache['beatmapStarsFlashlight'] != data.beatmap.stats.stars.flashlight) cache['beatmapStarsFlashlight'] = data.beatmap.stats.stars.flashlight;
        if (cache['beatmapStarsSliderFactor'] != data.beatmap.stats.stars.sliderFactor) cache['beatmapStarsSliderFactor'] = data.beatmap.stats.stars.sliderFactor;

        if (cache['beatmapAR'] != data.beatmap.stats.ar.converted) cache['beatmapAR'] = data.beatmap.stats.ar.converted;
        if (cache['beatmapCS'] != data.beatmap.stats.cs.converted) cache['beatmapCS'] = data.beatmap.stats.cs.converted;
        if (cache['beatmapOD'] != data.beatmap.stats.od.converted) cache['beatmapOD'] = data.beatmap.stats.od.converted;
        if (cache['beatmapHP'] != data.beatmap.stats.hp.converted) cache['beatmapHP'] = data.beatmap.stats.hp.converted;
        if (cache['beatmapBPM'] != data.beatmap.stats.bpm.common) cache['beatmapBPM'] = data.beatmap.stats.bpm.common;
        if (cache['beatmapMaxBPM'] != data.beatmap.stats.bpm.max) cache['beatmapMaxBPM'] = data.beatmap.stats.bpm.max;
        if (cache['beatmapLiveBPM'] != data.beatmap.stats.bpm.realtime) cache['beatmapLiveBPM'] = data.beatmap.stats.bpm.realtime;
        if (cache['beatmapMaxCombo'] != data.beatmap.stats.maxCombo) cache['beatmapMaxCombo'] = data.beatmap.stats.maxCombo;


        const drainTime = secondsTime(data.beatmap.time.lastObject - data.beatmap.time.firstObject);
        if (cache['beatmapTimeMapped'] != drainTime) cache['beatmapTimeMapped'] = drainTime;

        const totalTime = secondsTime(data.beatmap.time.mp3Length);
        if (cache['beatmapTime'] != totalTime) cache['beatmapTime'] = totalTime;


        if (cache['cursorSize'] != data.settings.cursor.size) cache['cursorSize'] = data.settings.cursor.size;
        if (cache['mouseSens'] != data.settings.mouse.sensitivity) cache['mouseSens'] = data.settings.mouse.sensitivity;
        // if (cache['skinName'] != data.settings.skin.name) cache['skinName'] = data.settings.skin.name;

        if (cache['skin-name'] != data.folders.skin) {
            try {
                const request = await fetch(`http://${host}/files/skin/skin.ini`);
                const text = await request.text();

                const lines = text.split('\n');

                const name = lines.find(r => r.trim().toLowerCase().startsWith('name') && r.includes(':'))?.split(':')[1].trim() || '';
                const author = lines.find(r => r.trim().toLowerCase().startsWith('author') && r.includes(':'))?.split(':')[1].trim() || '';
                const custom_url = lines.find(r => r.trim().toLowerCase().startsWith('custom_url') && r.includes(':'))?.split(':')[1].trim() || '';

                const url = custom_url ? ` ${custom_url}` : '';

                cache['skin-name'] = data.folders.skin;
                cache['skinName'] = name && author ? `${name} by ${author}${url}` : name ? `${name}${url}` : data.folders.skin;
            } catch (error) {
                console.log(error);
            };
        }

        if (cache['audioVolume'] != data.settings.audio.volume.master) cache['audioVolume'] = data.settings.audio.volume.master;
        if (cache['audioVolumeMusic'] != data.settings.audio.volume.music) cache['audioVolumeMusic'] = data.settings.audio.volume.music;
        if (cache['audioVolumeEffects'] != data.settings.audio.volume.effect) cache['audioVolumeEffects'] = data.settings.audio.volume.effect;
        if (cache['audioOffset'] != data.settings.audio.offset.universal) cache['audioOffset'] = data.settings.audio.offset.universal;


        if (cache['backgroundDim'] != data.settings.background.dim) cache['backgroundDim'] = data.settings.background.dim;

        if (cache['retryKey'] != data.settings.keybinds.quickRetry) cache['retryKey'] = data.settings.keybinds.quickRetry;

        if (cache['osuK1'] != data.settings.keybinds.osu.k1) cache['osuK1'] = data.settings.keybinds.osu.k1;
        if (cache['osuK2'] != data.settings.keybinds.osu.k2) cache['osuK2'] = data.settings.keybinds.osu.k2;
        if (cache['osuSmoke'] != data.settings.keybinds.osu.smokeKey) cache['osuSmoke'] = data.settings.keybinds.osu.smokeKey;

        if (cache['fruitsK1'] != data.settings.keybinds.fruits.k1) cache['fruitsK1'] = data.settings.keybinds.fruits.k1;
        if (cache['fruitsK2'] != data.settings.keybinds.fruits.k2) cache['fruitsK2'] = data.settings.keybinds.fruits.k2;
        if (cache['fruitsDash'] != data.settings.keybinds.fruits.Dash) cache['fruitsDash'] = data.settings.keybinds.fruits.Dash;

        if (cache['taikoInnerLeft'] != data.settings.keybinds.taiko.innerLeft) cache['taikoInnerLeft'] = data.settings.keybinds.taiko.innerLeft;
        if (cache['taikoInnerRight'] != data.settings.keybinds.taiko.innerRight) cache['taikoInnerRight'] = data.settings.keybinds.taiko.innerRight;
        if (cache['taikoOuterLeft'] != data.settings.keybinds.taiko.outerLeft) cache['taikoOuterLeft'] = data.settings.keybinds.taiko.outerLeft;
        if (cache['taikoOuterRight'] != data.settings.keybinds.taiko.outerRight) cache['taikoOuterRight'] = data.settings.keybinds.taiko.outerRight;


        if (cache['gameWidth'] != data.settings.resolution.width) cache['gameWidth'] = data.settings.resolution.width;
        if (cache['gameHeight'] != data.settings.resolution.height) cache['gameHeight'] = data.settings.resolution.height;

        if (cache['sessionTime'] != data.session.playTime) cache['sessionTime'] = secondsTime(data.session.playTime / 1000);

        if (cache['gameState'] != data.state.name.toLowerCase()) cache['gameState'] = data.state.name.toLowerCase();

        if (cache['userID'] != data.profile.id) cache['userID'] = data.profile.id;
        if (cache['userName'] != data.profile.name) cache['userName'] = data.profile.name;
        if (cache['userCountry'] != data.profile.countryCode.name) cache['userCountry'] = data.profile.countryCode.name;
        if (cache['userPP'] != space_number(data.profile.pp)) cache['userPP'] = space_number(data.profile.pp);
        if (cache['userAccuracy'] != data.profile.accuracy) cache['userAccuracy'] = data.profile.accuracy;
        if (cache['userGlobalRank'] != space_number(data.profile.globalRank)) cache['userGlobalRank'] = space_number(data.profile.globalRank);
        if (cache['userRankedScore'] != space_number(data.profile.rankedScore)) cache['userRankedScore'] = space_number(data.profile.rankedScore);
        if (cache['userLevel'] != data.profile.level) cache['userLevel'] = data.profile.level;
        if (cache['userPlaycount'] != space_number(data.profile.playCount)) cache['userPlaycount'] = space_number(data.profile.playCount);



        if (cache['pp100'] != data.performance.accuracy[100]) cache['pp100'] = data.performance.accuracy[100];
        if (cache['pp99'] != data.performance.accuracy[99]) cache['pp99'] = data.performance.accuracy[99];
        if (cache['pp98'] != data.performance.accuracy[98]) cache['pp98'] = data.performance.accuracy[98];
        if (cache['pp97'] != data.performance.accuracy[97]) cache['pp97'] = data.performance.accuracy[97];
        if (cache['pp96'] != data.performance.accuracy[96]) cache['pp96'] = data.performance.accuracy[96];
        if (cache['pp95'] != data.performance.accuracy[95]) cache['pp95'] = data.performance.accuracy[95];


        if (data.state.number == 2) {
            cache['mods'] = data.play.mods.name;
            cache['modsID'] = data.play.mods.number;
        }

        else if (data.state.number == 7) {
            cache['mods'] = data.resultsScreen.name;
            cache['modsID'] = data.resultsScreen.number;
        }

        else {
            cache['mods'] = data.play.mods.name;
            cache['modsID'] = data.play.mods.number;
        }



    } catch (error) {
        console.log('api-v2', error);
    };
}, undefined, on_open);


function tosuRenamer(text) {
    function comparison(field) {
        const regex = new RegExp(`\\[${field}\\s*(!=|==|>=|<=|>|<|startsWith|endsWith|includes)\\s*([^\\]]+)\\].*?\\[\\/${field}\\]`, 'g');

        return text.replace(regex, (match, operator, value) => {
            const fieldValue = cache[field] || "";
            let result;
            value = value?.trim();


            switch (operator) {
                case '!=': result = fieldValue != value; break;
                case '==': result = fieldValue == value; break;
                case '>=': result = parseFloat(fieldValue) >= parseFloat(value); break;
                case '<=': result = parseFloat(fieldValue) <= parseFloat(value); break;
                case '>': result = parseFloat(fieldValue) > parseFloat(value); break;
                case '<': result = parseFloat(fieldValue) < parseFloat(value); break;
                case 'startsWith': result = fieldValue.startsWith(value); break;
                case 'endsWith': result = fieldValue.endsWith(value); break;
                case 'includes': result = fieldValue.includes(value); break;
                default: result = false;
            };

            return result ? match.slice(match.indexOf(']') + 1, match.lastIndexOf('[')) : '';
        });
    };


    presets.forEach(preset => {
        text = comparison(preset);
    });


    return presets.reduce((acc, preset) => {
        const regex = new RegExp(`{${preset}}`, "g");
        return acc.replace(regex, cache[preset] || "");
    }, text);
};

function secondsTime(time) {
    let _temp = time;

    // eslint-disable-next-line
    const years = Math.floor(_temp / 31536000),
        days = Math.floor((_temp %= 31536000) / 86400),
        hours = Math.floor((_temp %= 86400) / 3600),
        minutes = Math.floor((_temp %= 3600) / 60),
        seconds = Math.floor(_temp % 60);

    let text = '';

    if (days > 0) text += `${days}d`;
    if (hours > 0) text += `${hours}h`;
    if (minutes > 0) text += `${minutes}min`;
    if (seconds > 0) text += `${seconds}s`;

    return text;
}

function display_auth_token() {
    const div = document.createElement('div');
    div.classList.add('modal', '-copy');
    div.innerHTML = `<div class="description">Click to copy <a id="name" class="copy_text" onclick="copy_text(this, '${url.searchParams.get('access_token')}')">access_token</a></div>`;

    document.body.appendChild(div);
};


function display_cheatsheet() {
    authorization.innerHTML = 'Reading books';


    let html = '';

    html += '<h2>Cheatsheet</h2>\n';
    html += '<p>You can use "if" statements to check different conditions, like:</p>\n';
    html += `<ul>`;
    html += `<li><b>!=</b> means not equal to</li>`;
    html += `<li><b>==</b> means equal to</li>`;
    html += `<li><b>>=</b> means greater than or equal to</li>`;
    html += `<li><b><=</b> means less than or equal to</li>`;
    html += `<li><b>></b> means greater than</li>`;
    html += `<li><b><</b> means less than</li>`;
    html += `<li><b>startsWith</b> checks if something begins with certain letters</li>`;
    html += `<li><b>endsWith</b> checks if something ends with certain letters</li>`;
    html += `<li><b>includes</b> checks if something contains a certain part</li>`;
    html += `</ul>`;
    html += '<br><p>Usage example: [beatmapStatus == loved]hello world {userName} [/beatmapStatus]</p>\n';
    html += '<div class="scroll">';

    for (let i = 0; i < presets.length; i++) {
        const presetName = presets[i];

        html += '<div>';
        html += `<span class="copy_text" onclick="copy_text(this, '${presetName}')">${presetName}</span>`;
        if (descriptions[i]) html += `&nbsp; - &nbsp;`;
        if (descriptions[i]) html += `<span class="desc">${descriptions[i]}</span>`;
        html += '</div>\n';
    };

    html += '</div>';

    modal.classList.add('modal', '-help');
    modal.innerHTML = html;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
};

function setCookie(name, value, daysToExpire) {
    const date = new Date();
    date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000)); // Convert days to milliseconds
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${value}; ${expires}; path=/`;
};


function j6h(dah) {
    if (dah == null) {
        return -1;
    };


    let mods_id = 0;
    const ModsArray = dah.toLowerCase().match(/.{1,2}/g);


    if (!Array.isArray(ModsArray)) {
        return -1;
    };


    for (let i = 0; i < ModsArray.length; i++) {
        const mod_name = ModsArray[i];
        switch (mod_name) {
            case 'nf':
                mods_id += 1;
                break;
            case 'ez':
                mods_id += 2;
                break;
            case 'td':
                mods_id += 4;
                break;
            case 'hd':
                mods_id += 8;
                break;
            case 'hr':
                mods_id += 16;
                break;
            case 'sd':
                mods_id += 32;
                break;
            case 'dt':
                mods_id += 64;
                break;
            case 'rx':
                mods_id += 128;
                break;
            case 'ht':
                mods_id += 256;
                break;
            case 'nc':
                mods_id += 576;
                break;
            case 'fl':
                mods_id += 1024;
                break;
            case 'at':
                mods_id += 2048;
                break;
            case 'so':
                mods_id += 4096;
                break;
            case 'ap':
                mods_id += 8192;
                break;
            case 'pf':
                mods_id += 16416;
                break;
            case '4k':
                mods_id += 32768;
                break;
            case '5k':
                mods_id += 65536;
                break;
            case '6k':
                mods_id += 131072;
                break;
            case '7k':
                mods_id += 262144;
                break;
            case '8k':
                mods_id += 524288;
                break;
            case 'fi':
                mods_id += 1048576;
                break;
            case 'rd':
                mods_id += 2097152;
                break;
            case 'cn':
                mods_id += 4194304;
                break;
            case 'target':
                mods_id += 8388608;
                break;
            case '9k':
                mods_id += 16777216;
                break;
            case 'keycoop':
                mods_id += 33554432;
                break;
            case '1k':
                mods_id += 67108864;
                break;
            case '3k':
                mods_id += 134217728;
                break;
            case '2k':
                mods_id += 268435456;
                break;
            case 'scorev2':
                mods_id += 536870912;
                break;
            case 'mr':
                mods_id += 1073741824;
                break;

            default:
                return -1;
        };
    };

    return mods_id;
}

function space_number(text) {
    return text.toLocaleString('en-US').replace(/,/g, ' ');
}
