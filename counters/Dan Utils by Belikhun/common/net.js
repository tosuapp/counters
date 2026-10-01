
/**
 * @typedef {object} NetProxy
 * @property {string}									url
 * @property {?(response: any) => NetProxyEnvelope}		unwrap
 */

/**
 * @typedef {object} NetProxyEnvelope
 * @property {number}		status
 * @property {?string}		body
 */

/**
 * @typedef {object} NetResponse
 * @property {number}		status
 * @property {any}			data
 */

/**
 * @typedef {object} NetCacheEntry
 * @property {any}			value
 * @property {number}		expire
 * @property {number}		storedAt
 */

const Net = {
	/** @type {NetProxy[]} */
	PROXIES: [
		{
			url: "https://proxy.belikhun.dev/",
			unwrap: null
		},

		{
			url: "https://api.allorigins.win/get?url=",
			unwrap: (response) => ({
				status: (response && response.status && response.status.http_code) || 0,
				body: (response) ? response.contents : null
			})
		}
	],

	COOLDOWN: 5 * 60 * 1000,

	CACHE_PREFIX: "net-cache-",

	/** @type {Object<string, number>} */
	cooldowns: {},

	/** @type {Promise} */
	chain: Promise.resolve(),

	/**
	 * Proxies to try, with the ones that recently failed moved to the back.
	 *
	 * @returns	{NetProxy[]}
	 */
	proxies() {
		const now = Date.now();

		return [...this.PROXIES].sort((a, b) => {
			const aDown = (this.cooldowns[a.url] > now) ? 1 : 0;
			const bDown = (this.cooldowns[b.url] > now) ? 1 : 0;
			return aDown - bDown;
		});
	},

	/**
	 * Fetch an url through the first proxy that answers.
	 *
	 * Only the proxy layer is retried. An answer from the target, 404
	 * included, comes back as-is so the caller can tell the two apart.
	 *
	 * @param	{string}		url
	 * @param	{object}		[options]
	 * @param	{number}		[options.retries]
	 * @param	{number}		[options.delay]
	 * @param	{number}		[options.timeout]
	 * @param	{?AbortSignal}	[options.signal]
	 * @returns	{Promise<NetResponse>}
	 */
	async request(url, {
		retries = 4,
		delay = 1000,
		timeout = 8000,
		signal = null
	} = {}) {
		const task = () => this.attempt(url, { retries, delay, timeout, signal });
		const queued = this.chain.then(task, task);
		this.chain = queued.catch(() => null);
		return await queued;
	},

	/**
	 * @param	{string}		url
	 * @param	{object}		options
	 * @param	{number}		options.retries
	 * @param	{number}		options.delay
	 * @param	{number}		options.timeout
	 * @param	{?AbortSignal}	options.signal
	 * @returns	{Promise<NetResponse>}
	 */
	async attempt(url, { retries, delay, timeout, signal }) {
		let lastError = new Error(`No proxy answered for ${url}`);

		for (let attempt = 0; attempt < retries; attempt++) {
			if (signal && signal.aborted)
				throw signal.reason || new Error("aborted");

			const proxies = this.proxies();
			const proxy = proxies[attempt % proxies.length];

			try {
				const response = await this.viaProxy(proxy, url, { timeout, signal });

				if (response.status === 429) {
					const wait = this.retryAfter(response) || delay;
					console.warn(`Net: ${proxy.url} rate limited, waiting ${wait}ms`);
					await delayAsync(wait);
					continue;
				}

				if (response.status === 0 || response.status >= 500)
					throw new Error(`Proxy ${proxy.url} returned ${response.status}`);

				if (response.status === 403 && response.data && response.data.error === "forbidden_origin")
					throw new Error(`Proxy ${proxy.url} passed the calling origin upstream`);

				return { status: response.status, data: response.data };
			} catch (error) {
				if (signal && signal.aborted)
					throw signal.reason || error;

				lastError = error;
				this.cooldowns[proxy.url] = Date.now() + this.COOLDOWN;
				console.warn(`Net: attempt ${attempt + 1} via ${proxy.url} failed:`, error);

				if (attempt < retries - 1)
					await delayAsync(delay);
			}
		}

		throw lastError;
	},

	/**
	 * @param	{NetProxy}		proxy
	 * @param	{string}		url
	 * @param	{object}		options
	 * @param	{number}		options.timeout
	 * @param	{?AbortSignal}	options.signal
	 * @returns	{Promise<NetResponse & { headers: Headers }>}
	 */
	async viaProxy(proxy, url, { timeout, signal }) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${timeout}ms`)), timeout);
		const forward = () => controller.abort(signal.reason);

		if (signal)
			signal.addEventListener("abort", forward);

		try {
			const response = await fetch(proxy.url + encodeURIComponent(url), { signal: controller.signal });
			const text = await response.text();

			if (!proxy.unwrap)
				return { status: response.status, data: this.parse(text), headers: response.headers };

			const envelope = proxy.unwrap(this.parse(text));

			if (!envelope || !envelope.status)
				throw new Error(`Proxy ${proxy.url} returned an envelope without a status`);

			return { status: envelope.status, data: this.parse(envelope.body), headers: response.headers };
		} finally {
			clearTimeout(timer);

			if (signal)
				signal.removeEventListener("abort", forward);
		}
	},

	/**
	 * @param	{?string}	text
	 * @returns	{any}
	 */
	parse(text) {
		if (typeof text !== "string" || text.length === 0)
			return null;

		return JSON.parse(text);
	},

	/**
	 * @param	{{ headers?: Headers }}		response
	 * @returns	{number}
	 */
	retryAfter(response) {
		const header = (response.headers) ? response.headers.get("retry-after") : null;
		const seconds = parseFloat(header);

		if (!isNaN(seconds) && seconds > 0)
			return seconds * 1000;

		return 0;
	},

	/**
	 * Fetch an url and return its payload, throwing when the target answered
	 * with anything but success.
	 *
	 * @param	{string}	url
	 * @param	{object}	[options]
	 * @returns	{Promise<any>}
	 */
	async tryFetch(url, options = {}) {
		const { status, data } = await this.request(url, options);

		if (status >= 400) {
			const error = new Error(`Request to ${url} failed with status ${status}`);
			error.status = status;
			error.data = data;
			throw error;
		}

		return data;
	},

	/**
	 * @param	{string}			key
	 * @returns	{?NetCacheEntry}
	 */
	cacheGet(key) {
		try {
			const stored = localStorage.getItem(this.CACHE_PREFIX + key);

			if (!stored)
				return null;

			return JSON.parse(stored);
		} catch (error) {
			return null;
		}
	},

	/**
	 * @param	{string}	key
	 * @param	{any}		value
	 * @param	{number}	ttl		Lifetime in milliseconds.
	 */
	cacheSet(key, value, ttl) {
		try {
			localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify({
				value,
				expire: Date.now() + ttl,
				storedAt: Date.now()
			}));
		} catch (error) {
			console.warn(`Net: could not cache ${key}:`, error);
		}
	},

	/**
	 * Read a value from cache, fetching it when missing or expired.
	 *
	 * A failed fetch falls back to the expired copy when there is one, so a
	 * dropped connection keeps the last known value on screen.
	 *
	 * @template	T
	 * @param		{string}			key
	 * @param		{number}			ttl
	 * @param		{() => Promise<T>}	fetcher
	 * @param		{object}			[options]
	 * @param		{boolean}			[options.force]
	 * @param		{boolean}			[options.staleOnError]
	 * @returns		{Promise<T>}
	 */
	async cached(key, ttl, fetcher, { force = false, staleOnError = true } = {}) {
		const entry = this.cacheGet(key);

		if (!force && entry && entry.expire > Date.now())
			return entry.value;

		try {
			const value = await fetcher();
			this.cacheSet(key, value, ttl);
			return value;
		} catch (error) {
			if (staleOnError && entry) {
				console.warn(`Net: serving stale ${key} after:`, error);
				return entry.value;
			}

			throw error;
		}
	}
}

/**
 * Runs one task at a time for a changing target, dropping work that a newer
 * call made pointless.
 */
class RequestGate {
	/**
	 * @param	{number}	debounce	Quiet period before a task starts, in milliseconds.
	 */
	constructor(debounce = 300) {
		this.debounce = debounce;

		/** @type {?string} */
		this.key = null;

		/** @type {?Promise} */
		this.running = null;

		/** @type {?AbortController} */
		this.controller = null;

		/** @type {?number} */
		this.timer = null;
	}

	/**
	 * @template	T
	 * @param		{string}								key
	 * @param		{(signal: AbortSignal) => Promise<T>}	task
	 * @returns		{Promise<?T>}
	 */
	run(key, task) {
		if (this.key === key && this.running)
			return this.running;

		this.cancel();
		this.key = key;

		const controller = new AbortController();
		this.controller = controller;

		this.running = new Promise((resolve) => {
			this.timer = setTimeout(() => {
				this.timer = null;

				task(controller.signal)
					.then((value) => resolve((controller.signal.aborted) ? null : value))
					.catch((error) => {
						if (!controller.signal.aborted)
							console.warn(`RequestGate: task for ${key} failed:`, error);

						resolve(null);
					});
			}, this.debounce);
		});

		return this.running;
	}

	cancel() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}

		if (this.controller) {
			this.controller.abort(new Error("superseded"));
			this.controller = null;
		}

		this.running = null;
	}
}
