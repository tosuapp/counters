
const UserCardPanel = {
	/**
	 * @typedef {{
	 * 	id: number
	 * 	username: string
	 * 	avatar: string
	 * 	country: {
	 * 		code: string
	 * 		name: string
	 * 	}
	 * 	cover: string
	 * 	isSupporter: boolean
	 * 	profileColor: ?string
	 * 	team: {
	 * 		id: number
	 * 		name: string
	 * 		short_name: string
	 * 		flag_url: string
	 * 	} | null
	 * 	groups: {
	 * 		id: number
	 * 		name: string
	 * 		identifier: string
	 * 		color: string
	 * 		playmodes: ("osu" | "taiko" | "fruits" | "mania")[] | null
	 * 	}[]
	 * }} UserCardProfile
	 */

	/** @type {TreeDOM} */
	container: null,

	/** @type {number|null} */
	userId: null,

	loadingTransitionTask: false,
	hasStatus: false,
	statusDisplaying: false,
	statusCycleTask: null,
	statusWaitTask: null,

	/** @type {SmoothValue} */
	rankValue: undefined,

	/** @type {SmoothValue} */
	ppValue: undefined,

	/** @type {SmoothValue} */
	accValue: undefined,

	hideDuringPlay: false,
	hideDuringResult: false,
	overrideTitle: "",
	overrideUserColor: "#000000",
	overrideUserId: -1,
	overrideCoverImage: "",
	overrideRank: "default",

	init({} = {}) {
		const lastBaseSize = localStorage.getItem("user-card-base-size");
		if (lastBaseSize && !isNaN(lastBaseSize))
			document.documentElement.style.fontSize = `${lastBaseSize}px`;

		this.rankValue = new SmoothValue({
			processor: (value) => "#" + this.formatNumber(Math.floor(value)),
			defaultValue: "#---"
		});

		this.ppValue = new SmoothValue({
			processor: (value) => this.formatNumber(Math.floor(value)),
			defaultValue: "---"
		});

		this.accValue = new SmoothValue({
			processor: (value) => value.toFixed(2) + "%",
			defaultValue: "--.--%"
		});

		this.container = makeTree("div", "user-card-panel", {
			overlay: { tag: "div", class: "overlay", child: {
				spinner: { tag: "div", class: "spinner" }
			}},

			card: { tag: "div", class: "card", child: {
				background: { tag: "div", class: "background" },
				backgroundOverlay: { tag: "div", class: "background-overlay" },
				colorOverlay: { tag: "div", class: "color-overlay" },

				info: { tag: "div", class: "info", child: {
					avatar: { tag: "img", class: "avatar", src: "./images/avatar-guest.png" },

					meta: { tag: "div", class: "meta", child: {
						username: { tag: "div", class: "username" },
						userTitle: { tag: "div", class: "user-title" },
						badges: { tag: "div", class: "badges", child: {
							flag: { tag: "div", class: "flag" },
							team: { tag: "div", class: "team" },
							separator: { tag: "div", class: "separator" },
							groups: { tag: "div", class: "groups" },
							supporter: { tag: "div", class: "supporter", child: {
								icon: { tag: "img", class: "icon", src: "./icons/heart-solid.svg" }
							}}
						}}
					}},

					level: { tag: "div", class: "level", child: {
						value: { tag: "span", class: "value", text: "---" }
					}}
				}}
			}},

			details: { tag: "div", class: "details", child: {
				ruleset: { tag: "span", class: "ruleset", child: {
					icon: { tag: "img", class: "icon", src: "./icons/ruleset-osu.svg" }
				}},

				info: { tag: "span", class: ["info", "show-items"], child: {
					status: { tag: "span", class: "status", child: {
						inner: { tag: "div", class: "inner", text: "Idle" }
					}},

					rank: { tag: "span", class: ["item", "rank"], child: {
						value: { tag: "div", class: "value", child: {
							number: this.rankValue
						}}
					}},

					pp: { tag: "span", class: ["item", "pp"], child: {
						label: { tag: "div", class: "label", text: "pp" },
						value: { tag: "div", class: "value", child: {
							number: this.ppValue
						}}
					}},

					accuracy: { tag: "span", class: ["item", "accuracy"], child: {
						label: { tag: "div", class: "label", text: "accuracy" },
						value: { tag: "div", class: "value", child: {
							number: this.accValue
						}}
					}}
				}}
			}}
		});

		app.subscribe("profile.level", (value) => {
			this.container.card.info.level.value.innerText = Math.floor(value);
		});

		app.subscribe("profile.mode.name", (value) => {
			this.container.details.ruleset.icon.src = `./icons/ruleset-${value.toLowerCase()}.svg`;
		});

		app.subscribe("profile.globalRank", () => this.updateRankDisplay());

		app.subscribe("profile.pp", (value) => {
			this.ppValue.set(value);
		});

		app.subscribe("profile.accuracy", (value) => {
			this.accValue.set(value);
		});

		app.subscribe("beatmap", () => {});
		app.subscribe("state.name", (value) => {
			switch (value) {
				case "play": {
					if (this.hideDuringPlay) {
						this.visible = false;
						return;
					}

					this.container.style.setProperty("--status-color", "var(--status-playing)");
					this.status = `<hl>Playing</hl> ${app.get("beatmap.artist")} - ${app.get("beatmap.title")} [${app.get("beatmap.version")}]`;
					break;
				}

				case "resultScreen": {
					if (this.hideDuringResult) {
						this.visible = false;
						return;
					}

					break;
				}

				case "edit": {
					this.container.style.setProperty("--status-color", "var(--status-editing)");
					this.status = `<hl>Editing</hl> ${app.get("beatmap.artist")} - ${app.get("beatmap.title")} [${app.get("beatmap.version")}]`;
					break;
				}

				default: {
					this.container.style.setProperty("--status-color", "var(--status-idle)");
					this.visible = true;
					this.status = null;
					break;
				}
			}
		});

		// tosu for lazer does not support bancho status yet
		// app.subscribe("profile.banchoStatus", (value) => {
		// 	switch (value) {
		// 		case "playing":
		// 			this.container.style.setProperty("--status-color", "var(--status-playing)");
		// 			break;

		// 		case "watching":
		// 			this.container.style.setProperty("--status-color", "var(--status-spectating)");
		// 			break;

		// 		case "editing":
		// 			this.container.style.setProperty("--status-color", "var(--status-editing)");
		// 			break;

		// 		case "modding":
		// 			this.container.style.setProperty("--status-color", "var(--status-modding)");
		// 			break;

		// 		case "multiplayer":
		// 			this.container.style.setProperty("--status-color", "var(--status-multiplayer)");
		// 			break;

		// 		default:
		// 			this.container.style.setProperty("--status-color", "var(--status-idle)");
		// 			break;
		// 	}
		// });

		app.subscribe("profile.id", (value) => this.show(value));

		setTimeout(() => {
			this.visible = true;
		}, 100);
	},

	settings({
		background = "#ffffff",
		baseSize = 16,
		hideDuringPlay = false,
		hideDuringResult = false,
		overrideTitle = "",
		overrideUserColor = "#000000",
		overrideUserId = -1,
		overrideCoverImage = "",
		overrideRank = "default"
	} = {}) {
		if (background !== "#ffffff") {
			this.container.style.setProperty("--background-override", background);
		} else {
			this.container.style.removeProperty("--background-override");
		}

		document.documentElement.style.fontSize = `${baseSize}px`;
		localStorage.setItem("user-card-base-size", baseSize.toString());

		this.hideDuringPlay = hideDuringPlay;
		this.hideDuringResult = hideDuringResult;
		this.overrideTitle = overrideTitle;
		this.overrideUserColor = overrideUserColor;
		this.overrideUserId = overrideUserId;
		this.overrideCoverImage = overrideCoverImage;
		this.overrideRank = overrideRank;

		this.show(this.userId);
		this.updateRankDisplay();
	},

	updateRankDisplay() {
		const value = app.get("profile.globalRank");
		this.rankValue.set(value);

		const tier = (this.overrideRank !== "default")
			? this.overrideRank
			: this.rankTier(value, app.get("profile.mode.name").toLowerCase());

		this.container.details.info.rank.value.style.setProperty("--rank-color", `var(--level-tier-${tier})`);
	},

	async show(userId) {
		this.userId = userId;
		const user = await this.fetchUserData(userId);

		this.container.dataset.userId = user.id;
		this.container.card.info.avatar.src = user.avatar;
		this.container.card.info.meta.username.textContent = user.username;

		if (this.overrideCoverImage && this.overrideCoverImage.length > 0) {
			this.container.card.background.style.backgroundImage = `url(${this.overrideCoverImage})`;
		} else if (user.cover) {
			this.container.card.background.style.backgroundImage = `url(${user.cover})`;
		} else {
			this.container.card.background.style.backgroundImage = `url(./images/default-cover.png)`;
		}

		let hasRightSide = false;

		if (this.overrideUserColor && this.overrideUserColor !== "#000000") {
			this.container.style.setProperty("--profile-color", this.overrideUserColor);
			this.container.card.colorOverlay.style.display = null;
		} else if (user.profileColor) {
			this.container.style.setProperty("--profile-color", user.profileColor);
			this.container.card.colorOverlay.style.display = null;
		} else {
			this.container.card.colorOverlay.style.display = "none";
		}

		if (this.overrideTitle && this.overrideTitle.length > 0) {
			this.container.card.info.meta.userTitle.textContent = this.overrideTitle;
			this.container.card.info.meta.userTitle.style.display = null;
		} else if (user.groups[0]) {
			this.container.card.info.meta.userTitle.textContent = user.groups[0].name;
			this.container.card.info.meta.userTitle.style.display = null;
		} else {
			this.container.card.info.meta.userTitle.style.display = "none";
		}

		this.container.card.info.meta.badges.flag.style.backgroundImage = `url(${this.flagUrl(user.country.code)})`;

		if (user.team) {
			this.container.card.info.meta.badges.team.style.backgroundImage = `url(${user.team.flag_url})`;
			this.container.card.info.meta.badges.team.style.display = null;
		} else {
			this.container.card.info.meta.badges.team.style.display = "none";
		}

		if (user.groups && user.groups.length >= 1) {
			this.container.card.info.meta.badges.groups.style.display = "flex";
			emptyNode(this.container.card.info.meta.badges.groups);

			for (const { id, name, identifier, color, playmodes } of user.groups) {
				const badge = document.createElement("div");
				badge.classList.add("group-badge");
				badge.style.setProperty("--group-color", color || "#888");
				badge.dataset.groupId = id;
				badge.title = name;

				const ident = document.createElement("span");
				ident.classList.add("identifier");
				ident.innerText = identifier.toLocaleUpperCase();

				badge.appendChild(ident);

				if (playmodes && playmodes.length > 0) {
					const modes = document.createElement("span");
					modes.classList.add("playmodes");

					for (const mode of playmodes) {
						const modeIcon = document.createElement("img");
						modeIcon.classList.add("mode-icon");
						modeIcon.src = `./icons/ruleset-${mode}.svg`;
						modes.appendChild(modeIcon);
					}

					badge.appendChild(modes);
				}

				this.container.card.info.meta.badges.groups.appendChild(badge);
			}

			hasRightSide = true;
		} else {
			this.container.card.info.meta.badges.groups.style.display = "none";
		}

		if (user.isSupporter) {
			this.container.card.info.meta.badges.supporter.style.display = null;
			hasRightSide = true;
		} else {
			this.container.card.info.meta.badges.supporter.style.display = "none";
		}

		if (hasRightSide) {
			this.container.card.info.meta.badges.separator.style.display = null;
		} else {
			this.container.card.info.meta.badges.separator.style.display = "none";
		}
	},

	/**
	 * Set panel visibility
	 * 
	 * @param	{boolean}	visible
	 */
	set visible(visible) {
		this.container.classList.toggle("show", visible);
	},

	/**
	 * Set loading state
	 * 
	 * @param	{boolean}	loading
	 */
	set loading(loading) {
		clearTimeout(this.loadingTransitionTask);

		if (loading) {
			this.container.overlay.classList.add("visible");

			this.loadingTransitionTask = setTimeout(() => {
				this.container.overlay.classList.add("show");
			}, 1);
		} else {
			this.container.overlay.classList.remove("show");

			this.loadingTransitionTask = setTimeout(() => {
				this.container.overlay.classList.remove("visible");
			}, 600);
		}
	},

	/**
	 * Set user status text
	 * 
	 * @param	{string|null}	status
	 */
	set status(status) {
		if (!status) {
			if (this.hasStatus) {
				this.hideStatus();
				this.hasStatus = false;
			}

			clearInterval(this.statusCycleTask);
			return;
		}

		this.container.details.info.status.inner.innerHTML = status;

		if (this.hasStatus) {
			this.showStatus();
			return;
		}

		this.hasStatus = true;
		this.statusCycleTask = setInterval(() => {
			this.toggleStatusDisplay();
		}, 10000);

		this.showStatus();
	},

	async toggleStatusDisplay() {
		if (this.statusDisplaying) {
			this.hideStatus();
		} else {
			this.showStatus();
		}

		return this;
	},

	async showStatus() {
		if (this.statusDisplaying)
			return;

		this.statusDisplaying = true;
		clearTimeout(this.statusWaitTask);
		this.container.details.info.classList.remove("show-items")

		this.statusWaitTask = setTimeout(() => {
			this.container.details.info.classList.add("show-status");
		}, 600);
	},

	async hideStatus() {
		if (!this.statusDisplaying)
			return;

		this.statusDisplaying = false;
		clearTimeout(this.statusWaitTask);
		this.container.details.info.classList.remove("show-status");

		this.statusWaitTask = setTimeout(() => {
			this.container.details.info.classList.add("show-items");
		}, 600);
	},

	formatNumber(value) {
		return value.toLocaleString();
	},

	rankTier(rank, mode = "osu") {
		if (rank <= 100)
			return "lustrous";

		// Estimated stats taken from
		// https://github.com/ppy/osu-web/pull/12483
		const players = {
			osu: 2600000,
			taiko: 340000,
			fruits: 250000,
			mania: 870000,
		}[mode];

		const percent = (rank / players) * 100;

		if (percent <= 0.05)
			return "radiant";

		if (percent <= 0.15)
			return "rhodium";

		if (percent <= 0.5)
			return "platinum";

		if (percent <= 1.5)
			return "gold";

		if (percent <= 5)
			return "silver";

		if (percent <= 15)
			return "bronze";

		return "iron";
	},

	/**
	 * Fetch user data from API or cache
	 * 
	 * @param	{number}					userId
	 * @returns	{Promise<UserCardProfile>}
	 */
	async fetchUserData(userId) {
		if (this.overrideUserId > 0)
			userId = this.overrideUserId;

		if (userId > 0) {
			const url = `https://osu.ppy.sh/users/lookup?ids[]=${userId}`;
	
			const cached = localStorage.getItem(`user-data-${userId}`);
			if (cached) {
				const data = JSON.parse(cached);
	
				if (data.expire > Date.now())
					return data;
			}
	
			try {
				this.loading = true;
				const response = await this.tryFetch(url);
				const user = response.users[0];

				if (user) {
					const data = {
						id: user.id,
						username: user.username,
						avatar: user.avatar_url,
						country: user.country,
						cover: user.cover.url,
						isSupporter: user.is_supporter,
						profileColor: user.profile_colour,
						team: user.team,
						groups: user.groups.map((g) => ({
							id: g.id,
							name: g.name,
							identifier: g.identifier,
							color: g.colour,
							playmodes: g.playmodes
						})),
						expire: Date.now() + (5 * 60 * 1000),
					};
		
					localStorage.setItem(`user-data-${userId}`, JSON.stringify(data));
					return data;
				}
			} catch (error) {
				console.error("Failed to fetch user data:", error);
	
				if (cached)
					return JSON.parse(cached);
			} finally {
				this.loading = false;
			}
		}

		return {
			id: userId,
			username: app.get("profile.name"),
			avatar: userId > 0
				? `https://a.ppy.sh/${userId}`
				: "./images/avatar-guest.png",
			country: {
				code: app.get("profile.countryCode.name"),
				name: app.get("profile.countryCode.name"),
			},
			cover: null,
			isSupporter: false,
			profileColor: app.get("profile.backgroundColour"),
			team: null,
			groups: [],
		};
	},

	flagUrl(code) {
		if (!code)
			return `./flags/fallback.png`;

		const baseFileName = code
			.split('')
			.map((c) => (c.charCodeAt(0) + 127397).toString(16))
			.join('-');

		return `https://osu.ppy.sh/assets/images/flags/${baseFileName}.svg`;
	},

	async tryFetch(url, {
		retries = 4,
		delay = 1000,
		timeout = 10000
	} = {}) {
		const proxies = [
			// codetabs had ceased operations on june 30 2026 (https://github.com/jolav/codetabs)
			// "https://api.codetabs.com/v1/proxy/?quest=",

			"https://api.allorigins.win/get?url=",

			// last resort
			"https://proxy.belikhun.dev/"
		];

		for (let attempt = 1; attempt <= retries; attempt++) {
			try {
				const proxy = proxies[(attempt - 1) % proxies.length];
				const proxiedUrl = proxy + encodeURIComponent(url);
				const response = await fetch(proxiedUrl, { timeout }).then(res => res.json());

				if (proxy.includes("allorigins"))
					return JSON.parse(response.contents);

				return response;
			} catch (error) {
				console.warn(`Fetch attempt ${attempt} failed:`, error);

				if (attempt === retries)
					throw error;
				
				await delayAsync(delay);
			}
		}
	}
}
