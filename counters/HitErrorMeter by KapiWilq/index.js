import WebSocketManager from './js/socket.js';
import HitErrorMeter from './js/hitErrorMeter.js';
const socket = new WebSocketManager(location.host);

let cache = {
    showHitErrorMeterInCatch: false,
    maniaHit50LateStyle: 'Show nothing',
    scaleHitErrorMeterWithResolution: true,
    hideInGameScoreMeter: true,
    unstableRateStyle: '',
    client: '',
    previousState: '',
    currentState: '',
    isConvert: false,
    rulesetName: '',
    overallDiff: 0,
    circleSize: 0,
    mods: 'asdf',
    rate: -1,
    isFullscreen: true,
    gameWindowedHeight: -1,
    gameFullscreenHeight: -1,
    foldersBeatmap: '',
    filesBackground: '',
    backgroundDim: -1,
    scoreMeterSize: 0,
    hitErrors: [14, 34, 69, 420, 1337, 2137],
    unstableRate: -1,
    hitErrorsPreviousAmount: -1,
    relativeMovingAverageArrowPosition: 0
};

let unstableRateCountUp = new CountUp('unstableRate', 0, 0, 2, .5, { useEasing: true, useGrouping: true, separator: ' ', decimal: '.', prefix: 'UR: ' });

const hitErrorMeterManager = new HitErrorMeter();



/**
 * A helper method to prepare the Unstable Rate display.
 * @param {'Show nothing' | 'Show only the value' | 'Show both the prefix and the value'} unstableRateStyle - The display style of the Unstable Rate display.
 */
function prepareUnstableRateDisplay(unstableRateStyle) {
    cache.unstableRateStyle = unstableRateStyle;

    // You cannot edit existing CountUps' properties, therefore redeclare it.
    if (cache.unstableRateStyle === 'Show only the value')
        unstableRateCountUp = new CountUp('unstableRate', cache.unstableRate, 0, 2, .5, { useEasing: true, useGrouping: true, separator: ' ', decimal: '.' });
    else if (cache.unstableRateStyle === 'Show both the prefix and the value')
        unstableRateCountUp = new CountUp('unstableRate', cache.unstableRate, 0, 2, .5, { useEasing: true, useGrouping: true, separator: ' ', decimal: '.', prefix: 'UR: ' });

    // Show either during gameplay or when going to the results screen from gameplay (and when user wants to see it).
    document.querySelector('#unstableRate').style.opacity = Number((cache.currentState === 'play' || (cache.currentState === 'resultScreen' && cache.previousState === 'play')) && cache.unstableRateStyle !== 'Show nothing');
};

/**
 * A helper function to determine whether the hit error meter should be visible.
 * @returns {boolean} Whether the hit error meter should be visible.
 */
function shouldHitErrorMeterBeVisible() {
    return cache.currentState === 'play' && (cache.showHitErrorMeterInCatch || cache.rulesetName !== 'fruits');
};

/**
 * A helper method to handle osu!mania's hit windows edge case (namely it not using 50's late hit window)
 */
function shouldLateHitErrorBeConsideredInMania(hitError) {
    // Not taking an absolute value since early hits are negative, so let's take an advantage of this.
    return cache.rulesetName !== 'mania' || cache.maniaHit50LateStyle !== 'Show nothing' || hitError <= hitErrorMeterManager.hitWindows.hit50;
}


socket.sendCommand('getSettings', encodeURI(window.COUNTER_PATH));

socket.commands(({ command, message }) => {
    try {
        if (command === 'getSettings') {
            cache.showHitErrorMeterInCatch = message.showHitErrorMeterInCatch;
            cache.maniaHit50LateStyle = message.maniaHit50LateStyle;
            cache.scaleHitErrorMeterWithResolution = message.scaleHitErrorMeterWithResolution;
            cache.hideInGameScoreMeter = message.hideInGameScoreMeter;

            // Here is a thing - osu!(lazer) already has way more flexibility when it comes to resizing (and moving, and scaling, and everything in between).
            // It wouldn't make sense to scale this overlay in osu!lazer since not only you can have multiple hit error meters, you can scale them however you want.
            // Therefore, limit this to osu!(stable) only.
            if (cache.client === 'stable' && cache.scaleHitErrorMeterWithResolution)
                document.querySelector('.main').style.transform = cache.isFullscreen
                    ? `scale(${cache.gameFullscreenHeight / 1080})`
                    : `scale(${cache.gameWindowedHeight / 1080})`;
            else
                document.querySelector('.main').style.transform = `scale(1)`;

            hitErrorMeterManager.applyUserSettings(message);
            document.querySelector('.hitErrorMeterContainer').style.opacity = Number(shouldHitErrorMeterBeVisible());
            // osu!taiko applies a vertical offset to the map background only in some maps
            // (can't determine why (and how) yet, therefore let's disable the in-game score meter hider in osu!taiko for now).
            // See https://github.com/ppy/osu/issues/14238#issuecomment-2167691307
            document.querySelector('.inGameScoreMeterHider').style.opacity = Number(cache.currentState === 'play' && cache.hideInGameScoreMeter && cache.rulesetName !== 'taiko');

            prepareUnstableRateDisplay(message.unstableRateStyle);
        };
    } catch (error) {
        console.error(error);
    };
});

socket.api_v2(({ client, state, settings, beatmap, play, folders, files }) => {
    try {
        if (cache.client !== client)
            cache.client = client;

        // Normally, all of these checks would be separate `if` statements (especially the state check),
        // however this approach avoids code duplication due to the way the overlay is supposed to work.
        if (cache.currentState !== state.name
            || cache.rulesetName !== settings.mode.name
            || cache.isConvert !== beatmap.isConvert
            || cache.overallDiff !== beatmap.stats.od.original
            || cache.circleSize !== beatmap.stats.cs.original
            || cache.mods !== play.mods.name
            || cache.rate !== play.mods.rate) {
            cache.previousState = cache.currentState;
            cache.currentState = state.name;

            cache.rulesetName = settings.mode.name;
            cache.isConvert = beatmap.isConvert;
            cache.overallDiff = beatmap.stats.od.original;
            cache.circleSize = beatmap.stats.cs.original;
            cache.mods = play.mods.name;
            cache.rate = play.mods.rate;

            prepareUnstableRateDisplay(cache.unstableRateStyle);
            hitErrorMeterManager.prepareHitErrorMeter(cache.client, cache.rulesetName, cache.isConvert, cache.overallDiff, cache.circleSize, cache.mods, cache.rate);
            document.querySelector('.hitErrorMeterContainer').style.opacity = Number(shouldHitErrorMeterBeVisible());

            // osu!taiko applies a vertical offset to the map background only in some maps
            // (can't determine why (and how) yet, therefore disable the in-game score meter hider in osu!taiko for now).
            // See https://github.com/ppy/osu/issues/14238#issuecomment-2167691307
            document.querySelector('.inGameScoreMeterHider').style.opacity = Number(cache.currentState === 'play' && cache.hideInGameScoreMeter && cache.rulesetName !== 'taiko');

            if (cache.scoreMeterSize !== settings.scoreMeter.size)
                cache.scoreMeterSize = settings.scoreMeter.size;

            if (cache.rulesetName === 'fruits' || settings.scoreMeter.type.name === 'colour') {
                // It's actually 21.5px, hovewer let's use that to make sure the hider actually covers the entire thing.
                document.querySelector('.inGameScoreMeterHider').style.height = `${Math.ceil(22 * cache.scoreMeterSize) / 16}rem`;
                // 1 pixel for each side is added for a good measure in case the in-game hit error meter peeks on one side or the other.
                document.querySelector('.inGameScoreMeterHider').style.width = `${Math.ceil((639 + 2) * cache.scoreMeterSize) / 16}rem`;

            } else if (settings.scoreMeter.type.name === 'error') {
                document.querySelector('.inGameScoreMeterHider').style.height = `${Math.ceil(27 * cache.scoreMeterSize) / 16}rem`;

                // The additional 19px is for the 50's hit windows that don't actually do anything in osu!taiko in osu!(stable).
                document.querySelector('.inGameScoreMeterHider').style.width = cache.rulesetName === 'taiko'
                    ? `${Math.ceil(((hitErrorMeterManager.hitWindows.hit100 * 1.125 + 19) * 2 + 2) * cache.scoreMeterSize) / 16}rem`
                    : `${Math.ceil((hitErrorMeterManager.hitWindows.hit50 * 1.125 * 2 + 2) * cache.scoreMeterSize) / 16}rem`;

            } else {
                document.querySelector('.inGameScoreMeterHider').style.width = '0';
                document.querySelector('.inGameScoreMeterHider').style.height = '0';
            };
        };

        if (cache.unstableRate !== play.unstableRate) {
            cache.unstableRate = play.unstableRate;
            unstableRateCountUp.update(cache.unstableRate);
        }

        if (cache.isFullscreen !== settings.resolution.fullscreen || cache.gameWindowedHeight !== settings.resolution.height || cache.gameFullscreenHeight !== settings.resolution.heightFullscreen) {
            cache.isFullscreen = settings.resolution.fullscreen;
            cache.gameWindowedHeight = settings.resolution.height;
            cache.gameFullscreenHeight = settings.resolution.heightFullscreen;

            // Here is a thing - osu!(lazer) already has way more flexibility when it comes to resizing (and moving, and scaling, and everything in between).
            // It wouldn't make sense to scale this overlay in osu!lazer since not only you can have multiple hit error meters, you can scale them however you want.
            // Therefore, limit this to osu!(stable) only.
            if (cache.client === 'stable' && cache.scaleHitErrorMeterWithResolution)
                document.querySelector('.main').style.transform = cache.isFullscreen
                    ? `scale(${cache.gameFullscreenHeight / 1080})`
                    : `scale(${cache.gameWindowedHeight / 1080})`;
            else
                document.querySelector('.main').style.transform = `scale(1)`;
        };

        if (cache.foldersBeatmap !== folders.beatmap || cache.filesBackground !== files.background) {
            cache.foldersBeatmap = folders.beatmap;
            cache.filesBackground = files.background;
            document.querySelector('#background').src = cache.filesBackground !== '' ? `${location.origin}/files/beatmap/${cache.foldersBeatmap}/${cache.filesBackground}` : '';
        };

        if (cache.backgroundDim !== settings.background.dim) {
            cache.backgroundDim = settings.background.dim;
            document.querySelector('#background').style.filter = `brightness(${1 - cache.backgroundDim / 100})`;
        };
    } catch (error) {
        console.error(error);
    };
}, [
    'client',
    {
        field: 'state',
        keys: ['name'],
    },
    {
        field: 'beatmap',
        keys: [
            'isConvert',
            {
                field: 'stats',
                keys: ['od', 'cs']
            }
        ],
    },
    {
        field: 'settings',
        keys: [
            {
                field: 'mode',
                keys: ['name'],
            },
            {
                field: 'scoreMeter',
                keys: [
                    'size',
                    {
                        field: 'type',
                        keys: ['name'],
                    }
                ],
            },
            {
                field: 'resolution',
                keys: ['fullscreen', 'height', 'heightFullscreen'],
            },
            {
                field: 'background',
                keys: ['dim'],
            }
        ],
    },
    {
        field: 'play',
        keys: [
            {
                field: 'mods',
                keys: ['name', 'rate']
            },
            'unstableRate'
        ],
    },
    {
        field: 'folders',
        keys: [
            'beatmap',
        ],
    },
    {
        field: 'files',
        keys: [
            'background',
        ],
    },
]);

socket.api_v2_precise(({ hitErrors }) => {
    try {
        if (JSON.stringify(cache.hitErrors) !== JSON.stringify(hitErrors)) {
            cache.hitErrors = hitErrors;

            let hitErrorsCurrentAmount = cache.hitErrors.length;
            if (hitErrorsCurrentAmount === 0 || !shouldHitErrorMeterBeVisible()) {
                cache.relativeMovingAverageArrowPosition = 0;
                document.querySelector('.movingAverageArrow').style.left = '0%';
                hitErrorMeterManager.removeAllHitErrorTicks();
            };

            // This is only activated on the initial overlay load to not add every single hit error tick to the overlay.
            // Note that this will not protect against a situation where there is a lot of new hit errors AFTER loading.
            if (hitErrorsCurrentAmount > 0 && cache.hitErrorsPreviousAmount === -1) {
                cache.hitErrorsPreviousAmount = hitErrorsCurrentAmount - 50;
            };

            for (let i = cache.hitErrorsPreviousAmount; i < hitErrorsCurrentAmount; i++) {
                // Don't handle a new tick when:
                // - the hit error meter is invisible
                // - the hit error value does not make sense
                // - user does NOT want to see 50's late hit errors when playing osu!mania
                if (cache.hitErrors[i] != undefined && !isNaN(cache.hitErrors[i]) && cache.hitErrors[i] != null
                    && shouldHitErrorMeterBeVisible() && shouldLateHitErrorBeConsideredInMania(cache.hitErrors[i])) {
                    hitErrorMeterManager.addTick(cache.hitErrors[i]);

                    // This is pretty much a slight modification of osu!(lazer)'s implementation (except for the if).
                    // See more details by looking at the `getRelativeHitErrorPosition`'s JSDoc.
                    // Also, osu!catch stores fruits landing on the right side of the catcher as ""early hits"" - flip the hit error to correct it.
                    document.querySelector('.movingAverageArrow').style.left = cache.rulesetName !== 'fruits'
                        ? `${hitErrorMeterManager.getRelativeHitErrorPosition(cache.relativeMovingAverageArrowPosition = cache.relativeMovingAverageArrowPosition * 0.9 + cache.hitErrors[i] * 0.1) * 100}%`
                        : `${hitErrorMeterManager.getRelativeHitErrorPosition(cache.relativeMovingAverageArrowPosition = cache.relativeMovingAverageArrowPosition * 0.9 - cache.hitErrors[i] * 0.1) * 100}%`;
                };
            };

            cache.hitErrorsPreviousAmount = hitErrorsCurrentAmount;
        };
    } catch (error) {
        console.error(error);
    };
}, ['hitErrors']);