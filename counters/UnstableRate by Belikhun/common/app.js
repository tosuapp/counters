
const app = {
	/** @type {HTMLDivElement} */
	root: undefined,

	/** @type {WebSocketManager} */
	client: undefined,

	data: {
		common: {
			current: {},
			previous: {}
		},

		precise: {
			current: {},
			previous: {}
		},
	},

	/** @type {{ [channel: string]: { key: string, handler: (value: any) => void }[] }} */
	handlers: {
		common: [],
		precise: []
	},

	counters: [],

	init() {
		this.root = document.getElementById("app");
		this.client = new WebSocketManager(window.location.host);

		for (const counter of this.counters) {
			try {
				counter.init(app);
			} catch (e) {
				console.warn("counter initialization failed", e);
			}
		}

		this.client.api_v2((data) => {
			this.dispatch(data, "common");
		});

		this.client.api_v2_precise((data) => {
			this.dispatch(data, "precise");
		});
	},

	registerCounter(counter) {
		if (typeof counter !== "object" || typeof counter.init !== "function")
			throw new Error("invalid counter!");

		this.counters.push(counter);
		return this;
	},

	/**
	 * Get value by key
	 * 
	 * @param	{string}	key
	 * @param	{any}		[defaultValue]
	 */
	get(key, defaultValue = null, store = this.data.common.current) {
		const path = key.split(".");
		let value = store;

		for (const token of path) {
			if (typeof value[token] == "undefined")
				return defaultValue;

			if ([value[token]] && typeof [value[token]] != "object")
				throw new Error(`Key ${key} is invalid`);

			value = value[token];
		}

		return value;
	},

	/**
	 * Subscribe for value change of the specified value key
	 * 
	 * @param	{string}				key
	 * @param	{(value: any) => void}	handler
	 * @param	{"common" | "precise"}	channel
	 */
	subscribe(key, handler, channel = "common") {
		this.handlers[channel].push({
			key,
			handler
		});

		return this;
	},

	isChanged(value1, value2) {
		// Can't efficiently compare objects yet.
		if (value1 && typeof value1 == "object")
			return true;

		return value1 != value2;
	},

	dispatch(data, channel = "common") {
		this.data[channel].previous = this.data[channel].current;
		this.data[channel].current = data;

		for (const { key, handler } of this.handlers[channel]) {
			let current = this.get(key, null, this.data[channel].current);
			let previous = this.get(key, null, this.data[channel].previous);

			if (!this.isChanged(current, previous))
				continue;

			try {
				handler(current);
			} catch (e) {
				console.warn(`Error occured while handing subscriber`, e);
			}
		}
	}
}

window.addEventListener("load", () => app.init());
