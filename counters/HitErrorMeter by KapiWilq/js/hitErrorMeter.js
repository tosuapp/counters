/**
 * A helper class for managing the hit error meter.
 */
class HitErrorMeter {
    constructor() {
        this.client = 'stable';
        this.rulesetName = 'osu';
        this.isConvert = false;
        this.overallDiff = 0;
        this.circleSize = 0;
        this.mods = '';
        this.rate = 1;
        this.hitWindows = {
            hit320: 0,
            hit300: 80,
            hit200: 0,
            hit100: 140,
            hit50: 200
        };

        this.hitErrorMeterScale = 1;
        this.movingAverageArrowAnimationDuration = 800;
        this.movingAverageArrowAnimation = 'cubic-bezier(0.22, 1, 0.36, 1)';
        this.maniaHit50LateStyle = 'Show nothing';
        this.normalizeHitErrorMeterWidth = false;
        this.hitWindowsWidthMultiplier = 1;
        this.tickHeight = 36;
        this.tickWidth = 4;
        this.tickAppearanceStyle = 'Only expand';
        this.tickAppearanceAnimation = 'cubic-bezier(0, 1, 0.33, 1)';
        this.tickAppearanceDuration = 250;
        this.tickDisappearanceStyle = 'Only fade out';
        this.tickAppearanceAnimation = 'linear';
        this.tickDisappearanceDuration = 3000;
    };

    /**
     * Applies user's settings.
     * @param {{hitErrorMeterScale: number,
     *          unstableRateStyle: 'Show nothing' | 'Show only the value' | 'Show both the prefix and the value',
     *          unstableRateSize: number,
     *          unstableRateFont: string,
     *          unstableRateColor: string,
     *          showMovingAverageArrow: boolean,
     *          movingAverageArrowSize: number,
     *          movingAverageArrowColor: string,
     *          movingAverageArrowAnimationDuration: number,
     *          movingAverageArrowAnimation: string,
     *          mainTickHeight: number,
     *          mainTickColor: string,
     *          showHitWindows: boolean,
     *          showHitErrorMeterInCatch: boolean,
     *          maniaHit50LateStyle: 'Show nothing' | 'Show only the hit errors' | 'Show both the hit errors and the hit window (inaccurate)'
     *          normalizeHitErrorMeterWidth: boolean
     *          hitWindowsWidthMultiplier: number,
     *          hit320Color: string,
     *          hit300Color: string,
     *          hit200Color: string,
     *          hit100Color: string,
     *          hit50Color: string,
     *          tickHeight: number,
     *          tickWidth: number,
     *          tickAppearanceStyle: 'Only expand' | 'Fade in and expand' | 'Fade in fully expanded',
     *          tickAppearanceDuration: number,
     *          tickAppearanceAnimation: string,
     *          tickDisappearanceStyle: 'Only fade out' | 'Only decrease the height' | 'Fade out and decrease the height',
     *          tickDisappearanceDuration: number,
     *          tickDisappearanceAnimation: string,
     *          hideInGameScoreMeter: boolean}} settings - User settings.
     */
    applyUserSettings(settings) {
        let mainTickHeight = Math.max(8, settings.mainTickHeight);
        this.tickHeight = Math.max(8, settings.tickHeight);
        this.tickWidth = this.clamp(settings.tickWidth, 1, 8);
        let hemHeight = mainTickHeight > this.tickHeight ? mainTickHeight : this.tickHeight;

        this.hitErrorMeterScale = this.clamp(settings.hitErrorMeterScale, 0.5, 5);
        document.querySelector('.segments').style.transform = `scale(${this.hitErrorMeterScale})`;
        document.querySelector('.segments').style.height = `${hemHeight * this.hitErrorMeterScale / 16}rem`;

        if (settings.unstableRateSize >= 0)
            document.querySelector('#unstableRate').style.transform = `scale(${Math.max(0, settings.unstableRateSize) / 24})`;
        document.querySelector('#unstableRate').style.fontFamily = `"${settings.unstableRateFont}", "Roboto", sans-serif`;
        document.querySelector('#unstableRate').style.color = settings.unstableRateColor;

        document.querySelector('.movingAverageArrow').style.opacity = Number(settings.showMovingAverageArrow);
        if (settings.showMovingAverageArrow) {
            if (settings.movingAverageArrowSize >= 0) {
                document.querySelector('.movingAverageArrow').style.height = `${settings.movingAverageArrowSize * this.hitErrorMeterScale / 16}rem`;
                document.querySelector('.movingAverageArrow').style.filter = `drop-shadow(0 0 ${2 * (settings.movingAverageArrowSize / 8) * this.hitErrorMeterScale / 16}rem black)`;
            };
        } else {
            document.querySelector('.movingAverageArrow').style.height = 0;
            document.querySelector('.movingAverageArrow').style.filter = 'drop-shadow(0 0 0 black)';
        };
        document.querySelector('.movingAverageArrow').style.marginBottom = `${4 * this.hitErrorMeterScale / 16}rem`;
        document.querySelector('.movingAverageArrow').style.fill = settings.movingAverageArrowColor;
        // Doing it this way allows me to put a safeguard against negative values while being able to change the transition timing function.
        if (settings.movingAverageArrowAnimationDuration >= 0)
            this.movingAverageArrowAnimationDuration = Math.min(settings.movingAverageArrowAnimationDuration, 3000);
        document.querySelector('.movingAverageArrow').style.transition = `${settings.movingAverageArrowAnimation} ${this.movingAverageArrowAnimationDuration}ms`;

        document.querySelector('.mainTick').style.height = `${mainTickHeight / 16}rem`;
        document.querySelector('.mainTick').style.backgroundColor = settings.mainTickColor;

        this.maniaHit50LateStyle = settings.maniaHit50LateStyle;

        this.normalizeHitErrorMeterWidth = settings.normalizeHitErrorMeterWidth;
        this.hitWindowsWidthMultiplier = this.clamp(settings.hitWindowsWidthMultiplier, 0.5, 5);

        this.applyColorToRootProperty('--hit320BG', settings.hit320Color, settings.showHitWindows);
        this.applyColorToRootProperty('--hit300BG', settings.hit300Color, settings.showHitWindows);
        this.applyColorToRootProperty('--hit200BG', settings.hit200Color, settings.showHitWindows);
        this.applyColorToRootProperty('--hit100BG', settings.hit100Color, settings.showHitWindows);
        this.applyColorToRootProperty('--hit50BG', settings.hit50Color, settings.showHitWindows);

        this.tickAppearanceStyle = settings.tickAppearanceStyle;
        this.tickDisappearanceStyle = settings.tickDisappearanceStyle;
        if (settings.tickAppearanceDuration >= 0)
            this.tickAppearanceDuration = Math.min(settings.tickAppearanceDuration, 5000);
        if (settings.tickDisappearanceDuration >= 0)
            this.tickDisappearanceDuration = Math.min(settings.tickDisappearanceDuration, 10000);
        this.tickAppearanceAnimation = settings.tickAppearanceAnimation;
        this.tickDisappearanceAnimation = settings.tickDisappearanceAnimation;

        this.prepareHitErrorMeter();
    };

    /**
     * Prepares the hit error meter.
     * @param {'stable' | 'lazer'} client - The currently played client.
     * @param {'osu' | 'taiko' | 'fruits' | 'mania'} rulesetName - The currently played ruleset.
     * @param {boolean} isConvert - Whether the currently played map is a converted one. 
     * @param {number} overallDiff - The Overall Difficulty value of the currently played map. NOTE: This is the original value (without any mods).
     * @param {number} circleSize - The Circle Size value of the currently played map. NOTE: This is the original value (without any mods).
     * @param {string} mods - A list of mods formatted as a not separate list of acronyms, e.g. `HDDT`.
     * @param {number} rate - The speed of the currently played beatmap.
     */
    prepareHitErrorMeter(client = this.client, rulesetName = this.rulesetName, isConvert = this.isConvert, overallDiff = this.overallDiff, circleSize = this.circleSize, mods = this.mods, rate = this.rate) {
        this.applyBaseSettings(client, rulesetName, isConvert, overallDiff, circleSize, mods, rate);
        this.recalculateHitWindows();

        const WIDTH_CONSTANT = 1.125;
        let hit320Size = 0, hit300Size = 0, hit200Size = 0, hit100Size = 0, hit50Size = 0;

        switch (this.rulesetName) {
        case 'osu':
            hit300Size = this.hitWindows.hit300 * WIDTH_CONSTANT;
            hit100Size = (this.hitWindows.hit100 - this.hitWindows.hit300) * WIDTH_CONSTANT;
            hit50Size = (this.hitWindows.hit50 - this.hitWindows.hit100) * WIDTH_CONSTANT;
            break;
        case 'taiko':
            hit300Size = this.hitWindows.hit300 * WIDTH_CONSTANT;
            hit100Size = (this.hitWindows.hit100 - this.hitWindows.hit300) * WIDTH_CONSTANT;
            break;
        case 'fruits':
            hit300Size = this.hitWindows.hit300 * WIDTH_CONSTANT;
            break;
        default:
            hit320Size = this.hitWindows.hit320 * WIDTH_CONSTANT;
            hit300Size = (this.hitWindows.hit300 - this.hitWindows.hit320) * WIDTH_CONSTANT;
            hit200Size = (this.hitWindows.hit200 - this.hitWindows.hit300) * WIDTH_CONSTANT;
            hit100Size = (this.hitWindows.hit100 - this.hitWindows.hit200) * WIDTH_CONSTANT;
            hit50Size = (this.hitWindows.hit50 - this.hitWindows.hit100) * WIDTH_CONSTANT;
            break;
        };

        let sumOfHitWindowsSizes = hit320Size + hit300Size + hit200Size + hit100Size + hit50Size;
        if (this.normalizeHitErrorMeterWidth) {
            let normalizationFactor = sumOfHitWindowsSizes / 142;
            hit320Size /= normalizationFactor;
            hit300Size /= normalizationFactor;
            hit200Size /= normalizationFactor;
            hit100Size /= normalizationFactor;
            hit50Size /= normalizationFactor;
            // Recalculate the sum for the moving average arrow.
            sumOfHitWindowsSizes = hit320Size + hit300Size + hit200Size + hit100Size + hit50Size;
        }

        document.querySelectorAll('.hit320').forEach(segment => segment.style.width = `${Math.floor(hit320Size * this.hitWindowsWidthMultiplier) / 16}rem`);
        document.querySelectorAll('.hit300').forEach(segment => segment.style.width = `${Math.floor(hit300Size * this.hitWindowsWidthMultiplier) / 16}rem`);
        document.querySelectorAll('.hit200').forEach(segment => segment.style.width = `${Math.floor(hit200Size * this.hitWindowsWidthMultiplier) / 16}rem`);
        document.querySelectorAll('.hit100').forEach(segment => segment.style.width = `${Math.floor(hit100Size * this.hitWindowsWidthMultiplier) / 16}rem`);
        document.querySelectorAll('.hit50').forEach(segment => segment.style.width = `${Math.floor(hit50Size * this.hitWindowsWidthMultiplier) / 16}rem`);

        // Applying CSS scaling affects it only visually - everything has the "1x scale" sizing under the hood.
        // Since the average chevron relies on the hit error meter's width, not the segments' width, resize the parent container.
        document.querySelector('.hitErrorMeterContainer').style.width = `${Math.floor(sumOfHitWindowsSizes) * 2 * this.hitErrorMeterScale / 16}rem`;

        let edgeSegments = null;
        // This is done only because osu!mania does not use the 50's late hit window.
        // Reset the hit window's color - it will be changed back later anyway.
        let hit50Late = document.querySelector('#hit50Late');
        hit50Late.style.backgroundColor = 'var(--hit50BG)';
        if (this.rulesetName === 'osu' || (this.rulesetName === 'mania' && this.maniaHit50LateStyle === 'Show both the hit errors and the hit window (inaccurate)')) {
            edgeSegments = document.querySelectorAll('.hit50');
            document.querySelectorAll('.hit100').forEach(segment => segment.style.borderRadius = '0');
            document.querySelectorAll('.hit300').forEach(segment => segment.style.borderRadius = '0');
        } else if (this.rulesetName === 'taiko') {
            edgeSegments = document.querySelectorAll('.hit100');
            document.querySelectorAll('.hit300').forEach(segment => segment.style.borderRadius = '0');
            document.querySelectorAll('.hit50').forEach(segment => segment.style.borderRadius = '0');
        } else if (this.rulesetName === 'mania') {
            // Case: user selected to NOT show the 50's late hit window in osu!mania.
            edgeSegments = [ document.querySelector('#hit100Late'), document.querySelector('#hit50Early') ];
            document.querySelectorAll('.hit300').forEach(segment => segment.style.borderRadius = '0');
            document.querySelectorAll('.hit100').forEach(segment => segment.style.borderRadius = '0');
            document.querySelectorAll('.hit50').forEach(segment => segment.style.borderRadius = '0');

            const [r, g, b] = getComputedStyle(hit50Late).backgroundColor.replace('rgba(', '').replace('rgb(', '').replace(')', '').split(',').map(r => r.trim());
            // The exact same dirty hack as in the `addColorToRootProperty` method.
            hit50Late.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${1 / 255})`;
        } else {
            edgeSegments = document.querySelectorAll('.hit300');
            document.querySelectorAll('.hit100').forEach(segment => segment.style.borderRadius = '0');
            document.querySelectorAll('.hit50').forEach(segment => segment.style.borderRadius = '0');
        };

        let edgeSegmentsHeight = parseFloat(getComputedStyle(edgeSegments[0]).height.replace('px', '')) / 16;
        setTimeout(() => edgeSegments.forEach(segment => segment.style.borderRadius = `0 ${edgeSegmentsHeight / 2}rem ${edgeSegmentsHeight / 2}rem 0`), 500);
    };

    /**
     * A helper method to apply base play settings for use everywhere else.
     * @param {'stable' | 'lazer'} client - The client version that the game is currently being played.
     * @param {'osu' | 'taiko' | 'fruits' | 'mania'} rulesetName - The currently played ruleset.
     * @param {boolean} isConvert - Whether the currently played map is a converted one. 
     * @param {number} overallDiff - The Overall Difficulty value of the currently played map. NOTE: This is the original value (without any mods).
     * @param {number} circleSize - The Circle Size value of the currently played map. NOTE: This is the original value (without any mods).
     * @param {string} mods - A list of mods formatted as a not separate list of acronyms, e.g. `HDDT`.
     * @param {number} rate - The speed of the map that is being currently played.
     */
    applyBaseSettings(client, rulesetName, isConvert, overallDiff, circleSize, mods, rate) {
        this.client = client;
        this.rulesetName = rulesetName;
        this.isConvert = isConvert;
        this.rate = rate;
        this.mods = mods;

        // This mess exists purely because osu!mania calculates hit windows differently.
        // See the osu!mania section in the `recalculateHitWindows` method.
        if (this.rulesetName === 'mania') {
            this.overallDiff = overallDiff;
            this.circleSize = circleSize;
        } else {
            if (this.mods.includes('EZ')) {
                this.overallDiff = overallDiff / 2;
                this.circleSize = circleSize / 2;
            } else if (this.mods.includes('HR')) {
                this.overallDiff = Math.min(overallDiff * 1.4, 10);
                this.circleSize = Math.min(circleSize * 1.3, 10);
            } else {
                this.overallDiff = overallDiff;
                this.circleSize = circleSize;
            };
        };
    };

    /**
     * A helper method to recalculate hit windows for given overall difficulty (except for osu!catch - it uses Circle Size).
     */
    recalculateHitWindows() {
        switch (this.rulesetName) {
        case 'osu':
            this.hitWindows = {
                hit320: 0,
                hit300: Math.floor(80 - 6 * this.overallDiff),
                hit200: 0,
                hit100: Math.floor(140 - 8 * this.overallDiff),
                hit50: Math.floor(200 - 10 * this.overallDiff)
            };
            break;

        case 'taiko':
            this.hitWindows = {
                hit320: 0,
                hit300: Math.floor(50 - 3 * this.overallDiff),
                hit200: 0,
                hit100: Math.floor(this.overallDiff <= 5 ? 120 - 8 * this.overallDiff : 110 - 6 * this.overallDiff),
                hit50: 0
            };
            break;

        // osu!catch shows where the fruit landed relative to the catcher's center.
        case 'fruits':
            this.hitWindows = {
                hit320: 0,
                hit300: Math.floor(72 - 6 * this.circleSize),
                hit200: 0,
                hit100: 0,
                hit50: 0
            };
            break;

        case 'mania':
            // 320's hit windows scale in osu!(lazer) (and in osu!(stable) with ScoreV2).
            // Note that in osu!(lazer) the scaling is done "internally" - the visual size of the hit error meter stays the same.
            // See https://osu.ppy.sh/wiki/en/Client/Release_stream/Lazer/Gameplay_differences_in_osu%21%28lazer%29#the-perfect-judgement-hit-window-scales-with-od
            //     https://osu.ppy.sh/wiki/en/Gameplay/Judgement/osu%21mania#scorev2
            //     https://github.com/ppy/osu/pull/25415
            if (this.client === 'lazer' || (this.client === 'stable' && this.mods.includes('v2')))
                this.hitWindows = {
                    hit320: (this.overallDiff <= 5 ? 22.4 - 0.6 * this.overallDiff : 24.9 - 1.1 * this.overallDiff) * this.rate,
                    hit300: (64 - 3 * this.overallDiff) * this.rate,
                    hit200: (97 - 3 * this.overallDiff) * this.rate,
                    hit100: (127 - 3 * this.overallDiff) * this.rate,
                    hit50: (151 - 3 * this.overallDiff) * this.rate
                };
            // osu!mania converts have different hit windows only in osu!(stable).
            // See https://osu.ppy.sh/wiki/en/Gameplay/Judgement/osu%21mania#judgements.
            //     https://osu.ppy.sh/wiki/en/Client/Release_stream/Lazer/Gameplay_differences_in_osu%21%28lazer%29#converts-no-longer-have-different-hit-windows
            else if (this.rulesetName === 'mania' && this.isConvert)
                this.hitWindows = {
                    hit320: 16 * this.rate,
                    hit300: (this.overallDiff > 4 ? 34 : 47) * this.rate,
                    hit200: (this.overallDiff > 4 ? 67 : 77) * this.rate,
                    hit100: 97 * this.rate,
                    hit50: 121 * this.rate
                };
            else
                this.hitWindows = {
                    hit320: 16 * this.rate,
                    hit300: (64 - 3 * this.overallDiff) * this.rate,
                    hit200: (97 - 3 * this.overallDiff) * this.rate,
                    hit100: (127 - 3 * this.overallDiff) * this.rate,
                    hit50: (151 - 3 * this.overallDiff) * this.rate
                };

            // I've Been Tricked, I've Been Backstabbed and I've Been, Quite Possibly, Bamboozled.
            // For some reason, osu!mania not only uses the original OD value when playing with EZ or HR,
            // it also scales every hit window by a factor of 1.4 one way or the other, depending on the mod selected.

            // See it for yourself by selecting an osu!mania map and switch between EZ, HR, and NoMod and compare the hit windows' sizes by hovering on the map stats (at least in osu!(stable)).
            // This is the only reason why the hit windows are being floored here and not in the actual calculation.
            for (let hitWindow in this.hitWindows)
                if (this.mods.includes('HR'))
                    this.hitWindows[hitWindow] = Math.floor(this.hitWindows[hitWindow] / 1.4);
                else if (this.mods.includes('EZ'))
                    this.hitWindows[hitWindow] = Math.floor(this.hitWindows[hitWindow] * 1.4);
                else
                    this.hitWindows[hitWindow] = Math.floor(this.hitWindows[hitWindow]);
            break;

        default:
            console.error(`Couldn't calculate hit windows.\nClient: ${this.client}\nRuleset: ${this.rulesetName}\nOverall Difficulty: ${this.overallDiff}\nCircle Size: ${this.circleSize}\nHit windows: ${JSON.stringify(this.hitWindows)}`);
            break;
        };
    };

    /**
     * A helper method to set a property value in the root pseudo-class.
     * @param {string} property - A property to be changed.
     * @param {string} color - A color that should be set for this property.
     * @param {boolean} shouldBeVisible - Whether the color should be opaque or transparent.
     */
    applyColorToRootProperty(property, color, shouldBeVisible) {
        // Remove the alpha value in case it's there somehow.
        if (color.length === 9)
            color = color.slice(0, -2);

        // Dirty hack to make the computed style not return black for hit error ticks.
        color += shouldBeVisible ? 'FF' : '01';
        document.querySelector(':root').style.setProperty(property, color);
    };

    /**
     * A helper method to get a value with lower and upper bounds.
     * @param {number} val - The value to be clamped.
     * @param {number} min - The lower bound. If the value is below it, this will return `min`.
     * @param {number} max - The upper bound. If the value is above it, this will return `max`.
     * @returns {number} A number between `min` and `max` inclusive.
     */
    clamp(val, min, max) {
        return Math.min(Math.max(min, val), max);
    };

    /**
     * A helper method to determine where should a hit error tick be placed.
     * @param {number} absHitError - The absolute value of the given hit error.
     * @param {string} whichSegment - Whether the hit error tick should be placed either in the `early` or `late` half of the hit error meter.
     * @returns {HTMLElement} HTML element that will store the hit error tick inside of it.
     */
    getHitWindowSegment(absHitError, whichSegment) {
        // osu!(lazer) does these comparisons differently than stable.
        // See https://osu.ppy.sh/wiki/en/Client/Release_stream/Lazer/Gameplay_differences_in_osu%21%28lazer%29#hit-window-edge-calculations-do-not-match-stable
        if (this.client === 'stable') {
            switch (this.rulesetName) {
            case 'osu':
                if (absHitError < this.hitWindows.hit300)
                    return document.querySelector(`#hit300${whichSegment}`);

                if (absHitError < this.hitWindows.hit100)
                    return document.querySelector(`#hit100${whichSegment}`);

                return document.querySelector(`#hit50${whichSegment}`);
        
            case 'taiko':
                if (absHitError < this.hitWindows.hit300)
                    return document.querySelector(`#hit300${whichSegment}`);

                return document.querySelector(`#hit100${whichSegment}`);
        
            case 'fruits':
                return document.querySelector(`#hit300${whichSegment}`);
        
            case 'mania':
                if (absHitError <= this.hitWindows.hit320)
                    return document.querySelector(`#hit320${whichSegment}`);

                if (absHitError <= this.hitWindows.hit300)
                    return document.querySelector(`#hit300${whichSegment}`);

                if (absHitError <= this.hitWindows.hit200)
                    return document.querySelector(`#hit200${whichSegment}`);

                if (absHitError <= this.hitWindows.hit100)
                    return document.querySelector(`#hit100${whichSegment}`);

                return document.querySelector(`#hit50${whichSegment}`);
        
            default:
                console.error(`Couldn't determine the hit window segment.\nClient: ${this.client}\nRuleset: ${this.rulesetName}\nAbsolute hit error: ${absHitError}\nOverall Difficulty: ${this.overallDiff}\nCircle Size: ${this.circleSize}\nHit windows: ${JSON.stringify(this.hitWindows)}`);
                break;
            };
        } else {
            switch (this.rulesetName) {
            case 'osu':
                if (absHitError <= this.hitWindows.hit300)
                    return document.querySelector(`#hit300${whichSegment}`);

                if (absHitError <= this.hitWindows.hit100)
                    return document.querySelector(`#hit100${whichSegment}`);

                return document.querySelector(`#hit50${whichSegment}`);
        
            case 'taiko':
                if (absHitError <= this.hitWindows.hit300)
                    return document.querySelector(`#hit300${whichSegment}`);

                return document.querySelector(`#hit100${whichSegment}`);
        
            case 'fruits':
                return document.querySelector(`#hit300${whichSegment}`);
        
            case 'mania':
                if (absHitError <= this.hitWindows.hit320)
                    return document.querySelector(`#hit320${whichSegment}`);

                if (absHitError <= this.hitWindows.hit300)
                    return document.querySelector(`#hit300${whichSegment}`);

                if (absHitError <= this.hitWindows.hit200)
                    return document.querySelector(`#hit200${whichSegment}`);

                if (absHitError <= this.hitWindows.hit100)
                    return document.querySelector(`#hit100${whichSegment}`);

                return document.querySelector(`#hit50${whichSegment}`);
        
            default:
                console.error(`Couldn't determine the hit window segment.\nClient: ${this.client}\nRuleset: ${this.rulesetName}\nAbsolute hit error: ${absHitError}\nOverall Difficulty: ${this.overallDiff}\nCircle Size: ${this.circleSize}\nHit windows: ${JSON.stringify(this.hitWindows)}`);
                break;
            };
        };
    };

    /**
     * A helper method to get a relative position of the hit error tick inside a hit error window.
     * @param {number} absHitError - The absolute value of the given hit error.
     * @returns {number} Relative position of the hit error tick.
     */
    getTickPositionPercentage(absHitError) {
        if (this.client === 'stable') {
            switch (this.rulesetName) {
            case 'osu':
                if (absHitError < this.hitWindows.hit300)
                    return absHitError / this.hitWindows.hit300;

                if (absHitError < this.hitWindows.hit100)
                    return (absHitError - this.hitWindows.hit300) / (this.hitWindows.hit100 - this.hitWindows.hit300);

                return (absHitError - this.hitWindows.hit100) / (this.hitWindows.hit50 - this.hitWindows.hit100);
        
            case 'taiko':
                if (absHitError < this.hitWindows.hit300)
                    return absHitError / this.hitWindows.hit300;

                return (absHitError - this.hitWindows.hit300) / (this.hitWindows.hit100 - this.hitWindows.hit300);
        
            case 'fruits':
                return absHitError / this.hitWindows.hit300;
        
            case 'mania':
                if (absHitError <= this.hitWindows.hit320)
                    return absHitError / this.hitWindows.hit320;

                if (absHitError <= this.hitWindows.hit300)
                    return (absHitError - this.hitWindows.hit320) / (this.hitWindows.hit300 - this.hitWindows.hit320);

                if (absHitError <= this.hitWindows.hit200)
                    return (absHitError - this.hitWindows.hit300) / (this.hitWindows.hit200 - this.hitWindows.hit300);

                if (absHitError <= this.hitWindows.hit100)
                    return (absHitError - this.hitWindows.hit200) / (this.hitWindows.hit100 - this.hitWindows.hit200);

                return (absHitError - this.hitWindows.hit100) / (this.hitWindows.hit50 - this.hitWindows.hit100);
        
            default:
                console.error(`Couldn't determine the tick's position percentage.\nClient: ${this.client}\nRuleset: ${this.rulesetName}\nAbsolute hit error: ${absHitError}\nOverall Difficulty: ${this.overallDiff}\nCircle Size: ${this.circleSize}\nHit windows: ${JSON.stringify(this.hitWindows)}`);
                break;
            };
        } else {
            switch (this.rulesetName) {
            case 'osu':
                if (absHitError <= this.hitWindows.hit300)
                    return absHitError / this.hitWindows.hit300;

                if (absHitError <= this.hitWindows.hit100)
                    return (absHitError - this.hitWindows.hit300) / (this.hitWindows.hit100 - this.hitWindows.hit300);
                
                return (absHitError - this.hitWindows.hit100) / (this.hitWindows.hit50 - this.hitWindows.hit100);
        
            case 'taiko':
                if (absHitError <= this.hitWindows.hit300)
                    return absHitError / this.hitWindows.hit300;

                return (absHitError - this.hitWindows.hit300) / (this.hitWindows.hit100 - this.hitWindows.hit300);
        
            case 'fruits':
                return absHitError / this.hitWindows.hit300;
        
            case 'mania':
                if (absHitError <= this.hitWindows.hit320)
                    return absHitError / this.hitWindows.hit320;

                if (absHitError <= this.hitWindows.hit300)
                    return (absHitError - this.hitWindows.hit320) / (this.hitWindows.hit300 - this.hitWindows.hit320);

                if (absHitError <= this.hitWindows.hit200)
                    return (absHitError - this.hitWindows.hit300) / (this.hitWindows.hit200 - this.hitWindows.hit300);

                if (absHitError <= this.hitWindows.hit100)
                    return (absHitError - this.hitWindows.hit200) / (this.hitWindows.hit100 - this.hitWindows.hit200);

                return (absHitError - this.hitWindows.hit100) / (this.hitWindows.hit50 - this.hitWindows.hit100);
        
            default:
                console.error(`Couldn't determine the tick's position percentage.\nClient: ${this.client}\nRuleset: ${this.rulesetName}\nAbsolute hit error: ${absHitError}\nOverall Difficulty: ${this.overallDiff}\nCircle Size: ${this.circleSize}\nHit windows: ${JSON.stringify(this.hitWindows)}`);
                break;
            };
        };
    };

    /**
     * A helper method to remove all hit error ticks in the hit error meter.
     */
    removeAllHitErrorTicks() {
        // This is needed so that the expansion animation plays correctly, otherwise it just doesn't apply the transition.
        const ANIMATION_DELAY = 17;

        document.querySelectorAll('.tick').forEach(tick => {
            tick.style.transition = 'cubic-bezier(0, 1, 0.33, 1) 500ms';
            tick.style.opacity = getComputedStyle(tick).opacity;
            tick.style.height = getComputedStyle(tick).height;
            setTimeout(() => {
                if (this.tickDisappearanceStyle !== 'Only decrease the height')
                    tick.style.opacity = 0;
                if (this.tickDisappearanceStyle !== 'Only fade out')
                    tick.style.height = 0;
            }, ANIMATION_DELAY);
            setTimeout(() => tick.remove(), 500 + ANIMATION_DELAY);
        });
    }

    /**
     * Adds a hit error tick in the hit error meter.
     * @param {number} hitError - The hit error value.
     */
    addTick(hitError) {
        // This is needed so that the expansion animation plays correctly, otherwise it just doesn't apply the transition.
        const ANIMATION_DELAY = 17;

        // osu!catch stores fruits landing on the right side of the catcher as ""early hits"" - flip the hit error to correct it.
        if (this.rulesetName === 'fruits') {
            hitError = -hitError;
        };

        let segmentForTheTick = hitError <= 0 ? this.getHitWindowSegment(-hitError, 'Early') : this.getHitWindowSegment(hitError, 'Late');
        let tickPositionPercentage = this.getTickPositionPercentage(Math.abs(hitError));

        let tick = document.createElement('div');
        tick.classList.add('tick');

        // We don't know if hit error segments are hidden - extract RGB(A) values and set the opacity manually.
        const [r, g, b] = getComputedStyle(segmentForTheTick).backgroundColor.replace('rgba(', '').replace('rgb(', '').replace(')', '').split(',').map(r => r.trim());
        tick.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 1)`;

        tick.style.left = `${tickPositionPercentage * 100}%`;
        tick.style.transition = `${this.tickAppearanceAnimation} ${this.tickAppearanceDuration}ms`;
        tick.style.width = `${this.tickWidth / 16}rem`;
        tick.style.borderRadius = `${this.tickWidth / 2 / 16}rem`;

        if (this.tickAppearanceStyle !== 'Only expand')
            tick.style.opacity = 0;
        if (this.tickAppearanceStyle === 'Fade in fully expanded')
            tick.style.height = `${this.tickHeight / 16}rem`;

        segmentForTheTick.appendChild(tick);
        setTimeout(() => {
            if (this.tickAppearanceStyle !== 'Only expand')
                tick.style.opacity = 1;
            if (this.tickAppearanceStyle !== 'Fade in fully expanded')
                tick.style.height = `${this.tickHeight / 16}rem`;
        }, ANIMATION_DELAY);
        setTimeout(() => {
            tick.style.transition = `${this.tickDisappearanceAnimation} ${this.tickDisappearanceDuration}ms`;
            if (this.tickDisappearanceStyle !== 'Only decrease the height')
                tick.style.opacity = 0;
            if (this.tickDisappearanceStyle !== 'Only fade out')
                tick.style.height = 0;

            setTimeout(() => tick.remove(), this.tickDisappearanceDuration);
        }, this.tickAppearanceDuration + ANIMATION_DELAY);
    };

    /**
     * A helper method to get the hit error's relative position. Used for the moving average arrow.
     * NOTE: This is a slight modification of the osu!(lazer)'s implementation of this functionality.
     * @param {number} hitError - The hit error value.
     * @returns {number} The position for the moving average arrow.
     * @see {@link https://github.com/ppy/osu/blob/master/osu.Game/Screens/Play/HUD/HitErrorMeters/BarHitErrorMeter.cs#L430-L435}
     */
    getRelativeHitErrorPosition(hitError) {
        return hitError / this.getMaxHitWindow() / 2;
    };

    /**
     * A helper method to get the max hit window for given gamemode. NOTE: This uses the ruleset ID stored inside the class.
     * @returns {number} Max hit window for given ruleset.
     */
    getMaxHitWindow() {
        switch (this.rulesetName) {
        case 'osu':
        case 'mania':
            return this.hitWindows.hit50;

        case 'taiko':
            return this.hitWindows.hit100;

        case 'fruits':
            return this.hitWindows.hit300;

        default:
            console.error(`Couldn't get the max hit window.\nClient: ${this.client}\nRuleset: ${this.rulesetName}\nOverall Difficulty: ${this.overallDiff}\nCircle Size: ${this.circleSize}\nHit windows: ${this.hitWindows}`);
            break;
        };
    };
};

export default HitErrorMeter;