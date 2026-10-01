
/**
 * @typedef {object} ManiaTrackerDan
 * @property {string}		label
 * @property {string}		family
 * @property {number}		rawDan
 */

/**
 * @typedef {object} ManiaTrackerEntry
 * @property {number}						beatmapId
 * @property {number}						keyCount
 * @property {number}						od
 * @property {number}						stars
 * @property {number}						bpm
 * @property {number}						lnCount
 * @property {string}						primaryPattern
 * @property {string[]}						patternTags
 * @property {?ManiaTrackerDan}				dan
 * @property {?ManiaTrackerDan}				danDt
 * @property {Object<string, number>}		msd
 * @property {Object<string, number>}		msdLn
 * @property {boolean}						vibro
 */

/**
 * @typedef {object} ManiaTrackerAnalysis
 * @property {string}						status
 * @property {number}						keyCount
 * @property {object[]}						patterns
 * @property {object[]}						clusters
 * @property {string}						clusterCategory
 * @property {string}						modeTag
 * @property {string}						verdictText
 * @property {number}						lnRatio
 * @property {object}						vibroAnalysis
 */

/**
 * Reads dan estimates from mania-tracker.
 *
 * @see https://mania-tracker.com/dan-estimates
 */
const ManiaTracker = {
	BASE: "https://api.mania-tracker.com/api",

	TTL: {
		skills: 5 * 60 * 1000,
		entry: 24 * 60 * 60 * 1000,
		analysis: 24 * 60 * 60 * 1000,
		rate: 24 * 60 * 60 * 1000,
		pending: 60 * 1000,
		missing: 6 * 60 * 60 * 1000
	},

	/**
	 * @param	{string}		path
	 * @param	{string}		key
	 * @param	{number}		ttl
	 * @param	{object}		[options]
	 * @param	{boolean}		[options.force]
	 * @param	{?AbortSignal}	[options.signal]
	 * @param	{(value: any) => number} [options.ttlFor]
	 * @returns	{Promise<any>}
	 */
	async read(path, key, ttl, { force = false, signal = null, ttlFor = null } = {}) {
		const entry = Net.cacheGet(`dan-utils-${key}`);

		if (!force && entry && entry.expire > Date.now())
			return entry.value;

		try {
			const { status, data } = await Net.request(this.BASE + path, { signal });

			if (status === 404)
				return this.store(key, { missing: true }, this.TTL.missing);

			if (status >= 400) {
				const error = new Error(`mania-tracker answered ${status} for ${path}`);
				error.status = status;
				throw error;
			}

			return this.store(key, data, (ttlFor) ? ttlFor(data) : ttl);
		} catch (error) {
			if (signal && signal.aborted)
				throw error;

			if (entry) {
				console.warn(`ManiaTracker: serving stale ${key} after:`, error);
				return { ...entry.value, stale: true };
			}

			throw error;
		}
	},

	/**
	 * @param	{string}	key
	 * @param	{any}		value
	 * @param	{number}	ttl
	 * @returns	{any}
	 */
	store(key, value, ttl) {
		Net.cacheSet(`dan-utils-${key}`, value, ttl);
		return value;
	},

	/**
	 * @param	{number}		userId
	 * @param	{object}		[options]
	 * @returns	{Promise<object>}
	 */
	async skills(userId, options = {}) {
		return await this.read(`/profiles/${userId}/skills`, `skills-${userId}`, this.TTL.skills, options);
	},

	/**
	 * @param	{number}		beatmapId
	 * @param	{object}		[options]
	 * @returns	{Promise<?ManiaTrackerEntry & { missing?: boolean, stale?: boolean }>}
	 */
	async entry(beatmapId, options = {}) {
		const payload = await this.read(
			`/snapshots/map-search-entry?beatmapId=${beatmapId}`,
			`entry-${beatmapId}`,
			this.TTL.entry,
			options
		);

		if (!payload || payload.missing)
			return payload;

		const entry = payload.entry || payload;
		return (payload.stale) ? { ...entry, stale: true } : entry;
	},

	/**
	 * @param	{number}		beatmapId
	 * @param	{object}		[options]
	 * @returns	{Promise<?ManiaTrackerAnalysis>}
	 */
	async analysis(beatmapId, options = {}) {
		return await this.read(
			`/chart-analysis?beatmapId=${beatmapId}`,
			`analysis-${beatmapId}`,
			this.TTL.analysis,
			{
				...options,
				ttlFor: (data) => (data && data.status === "ready") ? this.TTL.analysis : this.TTL.pending
			}
		);
	},

	/**
	 * Dan of a chart played at a speed other than the one it was mapped at.
	 *
	 * @param	{number}		beatmapId
	 * @param	{number}		rate
	 * @param	{object}		[options]
	 * @returns	{Promise<?object>}
	 */
	async rated(beatmapId, rate, options = {}) {
		const key = Dan.rateKey(rate);

		return await this.read(
			`/chart-analysis/rate?beatmapId=${beatmapId}&rate=${key}`,
			`rate-${beatmapId}-${key}`,
			this.TTL.rate,
			{
				...options,
				ttlFor: (data) => (data && data.status === "ready") ? this.TTL.rate : this.TTL.pending
			}
		);
	},

	/**
	 * Ratings for a keymode, falling back to 4K when the player has none.
	 *
	 * @param	{object}	skills
	 * @param	{number}	keys
	 * @returns	{?object}
	 */
	mode(skills, keys) {
		if (!skills || !Array.isArray(skills.modes))
			return null;

		return skills.modes.find((mode) => mode.keyCount === keys)
			|| skills.modes.find((mode) => mode.keyCount === 4)
			|| null;
	}
}
