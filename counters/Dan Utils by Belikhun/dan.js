
/**
 * @typedef {"rc" | "ln"} DanSide
 */

/**
 * @typedef {object} DanLadder
 * @property {string}					key
 * @property {number}					min
 * @property {number}					max
 * @property {string[]}					names
 * @property {Object<number, string>}	[display]
 * @property {(name: string) => string}	badge
 */

/**
 * @typedef {object} DanLabel
 * @property {number}		raw
 * @property {number}		level
 * @property {string}		name
 * @property {string}		suffix
 * @property {string}		text
 * @property {string}		display
 * @property {?string}		color
 */

/**
 * @typedef {object} DanHits
 * @property {number}		geki	320s in the mania ruleset.
 * @property {number}		300
 * @property {number}		katu	200s in the mania ruleset.
 * @property {number}		100
 * @property {number}		50
 * @property {number}		0
 */

/**
 * Dan levels, labels and clear credit, following the mania-tracker ladders.
 *
 * @see https://mania-tracker.com/dan-estimates
 */
const Dan = {
	BADGE_BASE: "https://mania-tracker.com/images/dans/",

	SUFFIX_COLORS: {
		"--": "#4db8ff",
		"-": "#7ac8ea",
		"+": "#ffab74",
		"++": "#ef6f7f"
	},

	/** @type {Object<string, DanLadder>} */
	LADDERS: {
		reform: {
			key: "reform",
			min: 1,
			max: 20,
			names: [
				"1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
				"alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa"
			],
			badge: (name) => (isNaN(name))
				? `reform/${name}.webp`
				: `reform/${name}.svg`
		},

		ln: {
			key: "ln",
			min: 1,
			max: 17,
			names: [
				"1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
				"11", "12", "13", "14", "15", "16", "17"
			],
			display: {
				11: "Yoake",
				12: "Yuugure",
				13: "Yoru",
				14: "Yami",
				15: "Yume",
				16: "Yokaze",
				17: "Yeehee"
			},
			badge: (name) => `ln/${name}.svg`
		},

		"7k": {
			key: "7k",
			min: 0,
			max: 14,
			names: [
				"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
				"gamma", "azimuth", "zenith", "stellium"
			],
			badge: (name) => `7k/${name}.svg`
		},

		"7k-ln": {
			key: "7k-ln",
			min: 0,
			max: 14,
			names: [
				"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
				"gamma", "azimuth", "zenith", "stellium"
			],
			badge: (name) => `7k/ln-${name}.svg`
		},

		"6k": {
			key: "6k",
			min: 0,
			max: 14,
			names: [
				"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
				"terra", "celestial", "mystery", "nihility", "finish"
			],
			badge: (name) => `6k/${name}.svg`
		},

		"6k-ln": {
			key: "6k-ln",
			min: 0,
			max: 14,
			names: [
				"0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
				"terra", "celestial", "mystery", "nihility", "finish"
			],
			badge: (name) => `6k/ln-${name}.svg`
		}
	},

	ABOVE_BAR: [[0, 0], [0.25, 0], [0.675, 0.2], [0.75, 0.7], [0.875, 1.1], [1, 1.5]],
	BELOW_BAR: [[0, 0], [0.2, -0.5075], [0.8, -1.25], [1, -1.5]],
	BELOW_BAR_LN: [[0, -0.26], [1 / 3, -1.25], [2 / 3, -1.5], [1, -1.75]],
	ABOVE_BAR_LN_4K: [[0, 0], [0.01, 0], [0.015, 0.15], [0.02, 0.3], [0.025, 0.5], [0.027, 0.7]],
	BELOW_BAR_LN_4K: [[0, -0.3], [0.2, -0.9], [1, -1.55]],

	HEADROOM_FLOOR: 0.04,

	EPSILON: 1e-9,

	/**
	 * Ladder for a keymode and side, or null when no ladder measures it.
	 *
	 * @param	{number}		keys
	 * @param	{DanSide}		side
	 * @returns	{?DanLadder}
	 */
	ladder(keys, side) {
		const isLn = (side === "ln");

		switch (keys) {
			case 4:
				return (isLn) ? this.LADDERS.ln : this.LADDERS.reform;

			case 6:
				return (isLn) ? this.LADDERS["6k-ln"] : this.LADDERS["6k"];

			case 7:
				return (isLn) ? this.LADDERS["7k-ln"] : this.LADDERS["7k"];
		}

		return null;
	},

	/**
	 * @param	{?string}	family		`dan` or `ln`, as the api reports it.
	 * @returns	{DanSide}
	 */
	side(family) {
		return (family === "ln") ? "ln" : "rc";
	},

	/**
	 * @param	{DanLadder}		ladder
	 * @param	{number}		raw
	 * @returns	{number}
	 */
	level(ladder, raw) {
		return clamp(Math.round(raw), ladder.min, ladder.max);
	},

	/**
	 * Step inside a level, from the easiest fifth to the hardest.
	 *
	 * mania-tracker derives this from its own rating bands, so a value sitting
	 * right on a boundary can land one step away from what the site shows.
	 *
	 * @param	{number}	raw
	 * @returns	{string}
	 */
	suffix(raw) {
		const frac = raw - Math.round(raw);

		if (frac < -0.3)
			return "--";

		if (frac < -0.1)
			return "-";

		if (frac < 0.1)
			return "";

		if (frac < 0.3)
			return "+";

		return "++";
	},

	/**
	 * @param	{DanLadder}		ladder
	 * @param	{number}		raw
	 * @returns	{DanLabel}
	 */
	format(ladder, raw) {
		const level = this.level(ladder, raw);
		const name = ladder.names[level - ladder.min];
		const suffix = (raw <= ladder.min || raw >= ladder.max) ? "" : this.suffix(raw);
		const display = (ladder.display && ladder.display[level]) || name;

		return {
			raw,
			level,
			name,
			suffix,
			text: name + suffix,
			display: display + suffix,
			color: this.SUFFIX_COLORS[suffix] || null
		};
	},

	/**
	 * @param	{DanLadder}		ladder
	 * @param	{string}		label	Label as the api spells it, such as `beta+`.
	 * @returns	{?string}
	 */
	badgeUrl(ladder, label) {
		if (!ladder || !label)
			return null;

		const name = String(label).replace(/[+-]+$/, "").trim().toLowerCase();

		if (!ladder.names.includes(name))
			return null;

		return this.BADGE_BASE + ladder.badge(name);
	},

	/**
	 * @param	{string}	label
	 * @returns	{string}
	 */
	labelSuffix(label) {
		const match = String(label || "").trim().match(/[+-]+$/);
		return (match) ? match[0] : "";
	},

	/**
	 * Accuracy a clear has to reach on this ladder to credit the full level.
	 *
	 * @param	{number}	keys
	 * @param	{DanSide}	side
	 * @param	{number}	chartRaw
	 * @returns	{number}
	 */
	passBar(keys, side, chartRaw = 0) {
		if (side === "ln")
			return (keys === 4) ? 0.97 : 0.95;

		if (keys === 7 && chartRaw < 1)
			return 0.95;

		return 0.96;
	},

	/**
	 * @param	{DanSide}	side
	 * @param	{number}	keys
	 * @returns	{number}
	 */
	belowBarWindow(side, keys) {
		if (side !== "ln")
			return 0.05;

		return (keys === 4) ? 0.025 : 0.03;
	},

	/**
	 * Smallest penalty a clear under the bar can take.
	 *
	 * @param	{DanSide}	side
	 * @param	{number}	keys
	 * @returns	{number}
	 */
	nearBarCap(side, keys) {
		if (side === "rc")
			return 0;

		return (keys === 4) ? 0.3 : 0.26;
	},

	/**
	 * Read a piecewise linear table, holding the end values beyond its edges.
	 *
	 * @param	{number[][]}	table
	 * @param	{number}		at
	 * @returns	{number}
	 */
	interpolate(table, at) {
		const first = table[0];

		if (at <= first[0])
			return first[1];

		for (let index = 1; index < table.length; index++) {
			const [x, y] = table[index];

			if (at > x)
				continue;

			const [prevX, prevY] = table[index - 1];
			const span = x - prevX;
			const point = (span > 0) ? (at - prevX) / span : 1;
			return prevY + (y - prevY) * point;
		}

		return table[table.length - 1][1];
	},

	/**
	 * Levels a clear adds to or takes off the chart's own dan.
	 *
	 * Returns null when the accuracy is too far under the bar to count.
	 *
	 * @param	{number}	accuracy	Recalculated accuracy, from 0 to 1.
	 * @param	{number}	bar
	 * @param	{DanSide}	side
	 * @param	{number}	keys
	 * @returns	{?number}
	 */
	credit(accuracy, bar, side, keys) {
		const window = this.belowBarWindow(side, keys);
		const delta = accuracy - bar;

		if (!(delta >= -window - this.EPSILON))
			return null;

		if (delta < -this.EPSILON) {
			const table = (side !== "ln")
				? this.BELOW_BAR
				: (keys === 4) ? this.BELOW_BAR_LN_4K : this.BELOW_BAR_LN;

			const point = Math.min(1, -delta / window);
			return Math.min(this.interpolate(table, point), -this.nearBarCap(side, keys));
		}

		if (side === "ln" && keys === 4)
			return this.interpolate(this.ABOVE_BAR_LN_4K, Math.max(0, delta));

		const headroom = Math.max(1 - bar, this.HEADROOM_FLOOR);
		return this.interpolate(this.ABOVE_BAR, Math.min(1, Math.max(0, delta) / headroom));
	},

	/**
	 * Credit range a clear on this ladder can reach, used to scale the chart.
	 *
	 * @param	{DanSide}	side
	 * @param	{number}	keys
	 * @returns	{{ min: number, max: number }}
	 */
	creditRange(side, keys) {
		const below = (side !== "ln")
			? this.BELOW_BAR
			: (keys === 4) ? this.BELOW_BAR_LN_4K : this.BELOW_BAR_LN;

		const above = (side === "ln" && keys === 4)
			? this.ABOVE_BAR_LN_4K
			: this.ABOVE_BAR;

		return {
			min: below[below.length - 1][1],
			max: above[above.length - 1][1]
		};
	},

	/**
	 * @param	{number}		chartRaw
	 * @param	{?number}		credit
	 * @param	{DanLadder}		ladder
	 * @returns	{?number}
	 */
	creditedDan(chartRaw, credit, ladder) {
		if (credit === null || credit === undefined)
			return null;

		return clamp(chartRaw + credit, ladder.min, ladder.max);
	},

	/**
	 * Judgements a play will hand out, which is more than the object count
	 * because lazer judges both ends of a hold note.
	 *
	 * @param	{{ circles: number, holds: number }}	objects
	 * @param	{"stable" | "lazer"}				client
	 * @returns	{number}
	 */
	totalJudgements(objects, client) {
		if (!objects)
			return 0;

		const circles = objects.circles || 0;
		const holds = objects.holds || 0;

		return circles + holds * ((client === "lazer") ? 2 : 1);
	},

	/**
	 * Accuracy the ladder grades on, rebuilt from the judgements.
	 *
	 * Regular ladders read stable accuracy while 4K LN reads ScoreV2, which is
	 * why the number in game cannot be used directly.
	 *
	 * @param	{DanHits}	hits
	 * @param	{DanSide}	side
	 * @param	{number}	keys
	 * @param	{number}	[extra320]	Judgements not hit yet, counted as 320s.
	 * @returns	{?number}
	 */
	accuracy(hits, side, keys, extra320 = 0) {
		if (!hits)
			return null;

		const perfect = (hits.geki || 0) + Math.max(0, extra320);
		const great = hits["300"] || 0;
		const good = hits.katu || 0;
		const ok = hits["100"] || 0;
		const meh = hits["50"] || 0;
		const miss = hits["0"] || 0;
		const total = perfect + great + good + ok + meh + miss;

		if (total <= 0)
			return null;

		if (side === "ln" && keys === 4)
			return (305 * perfect + 300 * great + 200 * good + 100 * ok + 50 * meh) / (305 * total);

		return (300 * (perfect + great) + 200 * good + 100 * ok + 50 * meh) / (300 * total);
	},

	/**
	 * Accuracy the play still ends on if every remaining note is a 320.
	 *
	 * @param	{DanHits}	hits
	 * @param	{number}	total		Judgements the map hands out in full.
	 * @param	{DanSide}	side
	 * @param	{number}	keys
	 * @returns	{?number}
	 */
	maxAccuracy(hits, total, side, keys) {
		if (!hits || !total)
			return null;

		const judged = (hits.geki || 0) + (hits["300"] || 0) + (hits.katu || 0)
			+ (hits["100"] || 0) + (hits["50"] || 0) + (hits["0"] || 0);

		return this.accuracy(hits, side, keys, Math.max(0, total - judged));
	},

	/**
	 * The MSD ratings mania-tracker lists for a chart, in the order it lists
	 * them, with the short names the community uses for each.
	 *
	 * @type {{ key: string, short: string }[]}
	 */
	MSD: [
		{ key: "Stream", short: "stream" },
		{ key: "Jumpstream", short: "js" },
		{ key: "Handstream", short: "hs" },
		{ key: "Stamina", short: "stam" },
		{ key: "JackSpeed", short: "jack" },
		{ key: "Chordjack", short: "cj" },
		{ key: "Technical", short: "tech" }
	],

	/**
	 * Skill a chart leans on, read off its strongest rating.
	 *
	 * @param	{Object<string, number>}	msd
	 * @returns	{?string}
	 */
	skillset(msd) {
		if (!msd)
			return null;

		const buckets = {
			JackSpeed: "jack",
			Chordjack: "jack",
			Technical: "tech",
			Jumpstream: "tech",
			Stream: "speed",
			Handstream: "stamina",
			Stamina: "stamina"
		};

		let best = null;

		for (const name of Object.keys(buckets)) {
			const rating = msd[name];

			if (typeof rating !== "number")
				continue;

			if (!best || rating > best.rating)
				best = { rating, skill: buckets[name] };
		}

		return (best) ? best.skill : null;
	},

	/**
	 * @param	{number}	rate
	 * @returns	{string}
	 */
	rateKey(rate) {
		return clamp(rate || 1, 0.5, 2).toFixed(2);
	}
}
