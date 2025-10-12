
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

	filters: {
		/** @type {Filters[]} */
		common: [],

		/** @type {Filters[]} */
		precise: []
	},

	appliedFilterKeys: {
		common: {},
		precise: {}
	},

	filtersChanged: {
		common: false,
		precise: false
	},

	updateFilterTask: undefined,

	/** @type {{ [channel: string]: { key: string, handler: (value: any) => void }[] }} */
	handlers: {
		common: [],
		precise: []
	},

	/** @type {{ [command: string]: ((message: object) => void)[] }} */
	commandHandlers: {},
	commandSubscribed: false,

	counters: [],
	settings: null,

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
		}, this.filters.common);

		this.client.api_v2_precise((data) => {
			this.dispatch(data, "precise");
		}, this.filters.precise);
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
	 * Counter should call `app.addFilter()` before calling this to make sure data is pulled from tosu.
	 * 
	 * @param	{string}					key
	 * @param	{any}						[defaultValue]
	 * @param	{"common" | "precise"}		[channel]
	 * @param	{"current" | "previous"}	[store]
	 */
	get(key, defaultValue = null, channel = "common", store = "current") {
		// Hopefully we can get real value in later calls.
		this.addFilter(key, channel);

		const path = key.split(".");
		let value = this.data[channel][store];

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

		this.addFilter(key, channel);
		return this;
	},

	/**
	 * Add key path to filters
	 * 
	 * @param	{string}				key
	 * @param	{"common" | "precise"}	channel
	 */
	addFilter(key, channel) {
		if (this.appliedFilterKeys[channel][key])
			return this;

		const tokens = key.split(".");
		let filters = this.filters[channel];
		let path = [];

		for (const token of tokens) {
			path.push(token);

			if (this.appliedFilterKeys[channel][path.join(".")])
				return this;
		}

		for (const [level, token] of tokens.entries()) {
			if (level == tokens.length - 1) {
				// Last level, expect this token to be in the filter as string.
				if (!filters.includes(token))
					filters.push(token);

				break;
			}

			let exists = false;

			for (const item of filters) {
				if (item.field == token) {
					filters = item.keys;
					exists = true;
					break;
				}
			}

			if (!exists) {
				// Remove string key if inserted.
				if (filters.includes(token))
					filters.splice(filters.indexOf(token), 1);

				const index = filters.push({
					field: token,
					keys: []
				});

				filters = filters[index - 1].keys;
			}
		}

		console.debug(channel, "filters changed", this.filters[channel]);
		this.appliedFilterKeys[channel][key] = true;

		// Avoid spamming
		this.filtersChanged[channel] = true;
		clearTimeout(this.updateFilterTask);
		this.updateFilterTask = setTimeout(() => this.doUpdateFilters(), 50);

		return this;
	},

	doUpdateFilters() {
		if (this.filtersChanged.common) {
			this.client.sockets["/websocket/v2"].send(`applyFilters:${JSON.stringify(this.filters.common)}`);
			this.filtersChanged.common = false;
			console.debug("pushed new common filters to server");
		}

		if (this.filtersChanged.precise) {
			this.client.sockets["/websocket/v2/precise"].send(`applyFilters:${JSON.stringify(this.filters.precise)}`);
			this.filtersChanged.precise = false;
			console.debug("pushed new precise filters to server");
		}

		return this;
	},

	isChanged(value1, value2) {
		// Can't efficiently compare objects yet.
		if (value1 && typeof value1 == "object")
			return !isObjectEqual(value1, value2, 1);

		return value1 != value2;
	},

	dispatch(data, channel = "common") {
		this.data[channel].previous = this.data[channel].current;
		this.data[channel].current = data;

		for (const { key, handler } of this.handlers[channel]) {
			let current = this.get(key, null, channel, "current");
			let previous = this.get(key, null, channel, "previous");

			if (!this.isChanged(current, previous))
				continue;

			try {
				handler(current);
			} catch (e) {
				console.warn(`Error occured while handing subscriber`, e);
			}
		}
	},

	/**
	 * Register command handler.
	 * 
	 * @param	{string}						command
	 * @param	{(message: object) => void}		handler
	 */
	onCommand(command, handler) {
		if (!this.commandHandlers[command])
			this.commandHandlers[command] = [];

		this.commandHandlers[command].push(handler);

		if (command === "getSettings" && this.settings)
			handler(this.settings);

		if (!this.commandSubscribed) {
			this.client.commands(({ command, message }) => {
				if (command === "getSettings")
					this.settings = message;

				if (!this.commandHandlers[command])
					return;

				for (const handler of this.commandHandlers[command]) {
					try {
						handler(message);
					} catch (e) {
						console.warn(`Error occured while handing command ${command}`, e);
					}
				}
			});
		}

		if (command === "getSettings" && !this.settings)
			this.client.sendCommand("getSettings", encodeURI(window.COUNTER_PATH));

		return this;
	}
}

window.addEventListener("load", () => app.init());
