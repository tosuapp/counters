
const DanUtilsPanel = {
	STEP_PX: 4,
	CHART_PAD_VERT: 2,
	TREND_SCALE: 0.02,
	CURVE_PAD: 2,
	CURVE_STEPS: 96,
	CURVE_DURATION: 0.7,

	/**
	 * How each beatmap number is written out, keyed the way
	 * {@link DanUtilsPanel.beatmapStats} names it.
	 *
	 * @type {Object<string, { name: string, format: (value: number) => string }>}
	 */
	STATS: {
		keys: { name: "keys", format: (value) => `${Math.round(value)}K` },
		stars: { name: "stars", format: (value) => value.toFixed(2) },
		bpm: { name: "bpm", format: (value) => String(Math.round(value)) },
		od: { name: "od", format: (value) => String(round(value, 1)) },
		ln: { name: "ln", format: (value) => `${Math.round(value)}%` },
		bar: { name: "pass bar", format: (value) => `${round(value, 2)}%` }
	},

	/** @type {TreeDOM} */
	container: null,

	/** @type {SmoothValue} */
	rawValue: undefined,

	/** @type {TrendCalculator} */
	danTrend: undefined,

	/** @type {SmoothNumber} */
	danTrendNumber: null,

	/** @type {Odometer} */
	badgeRoll: undefined,

	/** @type {SVGElement} */
	curve: undefined,

	/** @type {SVGPathElement} */
	curveLine: undefined,

	/** @type {SVGLineElement} */
	curveZero: undefined,

	/** @type {SVGLineElement} */
	curveBar: undefined,

	/** @type {SVGCircleElement} */
	curveDot: undefined,

	curveWidth: 0,
	curveHeight: 0,

	/** @type {?CurveShape} */
	curveShape: null,

	/** @type {?Animator} */
	curveAnimator: null,

	curveKey: "",

	/** @type {SmoothValue} */
	msdOverall: undefined,

	/** @type {Object<string, TreeDOM>} */
	msdColumns: {},

	/** @type {Object<string, TreeDOM>} */
	stripStats: {},

	/** @type {SVGElement} */
	chart: undefined,

	/** @type {SVGDefsElement} */
	chartDefs: undefined,

	/** @type {SVGLinearGradientElement} */
	chartGradient: undefined,

	/** @type {SVGStopElement} */
	chartGradientFrom: undefined,

	/** @type {SVGStopElement} */
	chartGradientTo: undefined,

	/** @type {SVGPathElement} */
	chartUnderlayLine: undefined,

	/** @type {SVGLinearGradientElement} */
	chartUnderlayGradient: undefined,

	/** @type {SVGStopElement} */
	chartUnderlayFrom: undefined,

	/** @type {SVGStopElement} */
	chartUnderlayTo: undefined,

	/** @type {SVGPathElement} */
	chartArea: undefined,

	/** @type {SVGPathElement} */
	chartLine: undefined,

	/** @type {SVGCircleElement} */
	chartDot: undefined,

	/** @type {SVGLineElement} */
	chartPredictLine: undefined,

	/** @type {RequestGate} */
	mapGate: undefined,

	/** @type {RequestGate} */
	playerGate: undefined,

	/**
	 * @type {{
	 * 	status: "idle" | "loading" | "ready" | "unknown" | "pending" | "notMania" | "convert" | "unsupported" | "error",
	 * 	entry: ?object,
	 * 	analysis: ?object,
	 * 	stale: boolean
	 * }}
	 */
	map: { status: "idle", entry: null, analysis: null, stale: false },

	/**
	 * @type {?{
	 * 	ladder: DanLadder,
	 * 	side: DanSide,
	 * 	keys: number,
	 * 	raw: number,
	 * 	label: string,
	 * 	bar: number,
	 * 	vibro: boolean,
	 * 	rate: number,
	 * 	msd: ?Object<string, number>
	 * }}
	 */
	mapDan: null,

	/**
	 * @type {{
	 * 	status: "none" | "loading" | "ready" | "untracked" | "error",
	 * 	skills: ?object,
	 * 	stale: boolean
	 * }}
	 */
	player: { status: "none", skills: null, stale: false },

	currentTime: 0,
	renderedTime: 0,
	curveAccuracy: null,
	shownDan: 0,
	renderTask: null,
	lastTimePoint: 0,
	currentTimePoint: 0,
	timeFrom: 0,
	timeTo: 0,
	points: [],

	/** @type {?{ series: object[], xaxis: number[] }} */
	strains: null,

	current200Hits: null,
	current100Hits: null,
	current50Hits: null,
	currentMissHits: null,

	/** @type {?number} */
	overlayTask: null,

	isPlaying: false,
	isViewingResult: false,
	shouldDisplayGraph: false,
	refreshTask: null,
	lastRefresh: 0,

	chartWidth: 0,
	chartHeight: 0,
	showing: false,

	alwaysVisible: false,
	displayOnResultScreen: false,
	transparent: true,

	keymodeOverride: "auto",
	showBadges: true,
	showSkillsets: true,
	showMapStats: true,
	showMsd: true,
	showMarkers: true,
	refreshAfterResult: true,

	init({
		alwaysVisible = false,
		transparent = true
	} = {}) {
		const lastBaseSize = localStorage.getItem("dan-utils-base-size");

		if (lastBaseSize && !isNaN(lastBaseSize))
			document.documentElement.style.fontSize = `${lastBaseSize}px`;

		this.alwaysVisible = alwaysVisible;
		this.transparent = transparent;

		this.mapGate = new RequestGate(300);
		this.playerGate = new RequestGate(200);

		this.rawValue = new SmoothValue({
			classes: ["raw"],
			duration: 0.2,
			decimal: 2
		});

		this.msdOverall = new SmoothValue({
			classes: "value",
			duration: 0.5,
			decimal: 2
		});

		this.badgeRoll = new Odometer({
			classes: "badge",
			split: false,
			placeholder: "",
			render: (url) => {
				const slot = document.createElement("span");
				const image = document.createElement("img");
				image.src = url;
				image.addEventListener("error", () => slot.classList.add("broken"));
				slot.appendChild(image);
				return slot;
			}
		});

		this.curve = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		this.curve.classList.add("plot");

		this.curveZero = document.createElementNS("http://www.w3.org/2000/svg", "line");
		this.curveZero.classList.add("zero");
		this.curve.appendChild(this.curveZero);

		this.curveBar = document.createElementNS("http://www.w3.org/2000/svg", "line");
		this.curveBar.classList.add("bar");
		this.curve.appendChild(this.curveBar);

		this.curveLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.curveLine.classList.add("line");
		this.curve.appendChild(this.curveLine);

		this.curveDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.curveDot.classList.add("dot");
		this.curve.appendChild(this.curveDot);

		this.chart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		this.chart.classList.add("chart");

		this.chartDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
		this.chart.appendChild(this.chartDefs);

		this.chartGradientFrom = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		this.chartGradientFrom.offset.baseVal = 0;
		this.chartGradientFrom.style.stopColor = "var(--chart-color)";
		this.chartGradientFrom.style.stopOpacity = 0;

		this.chartGradientTo = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		this.chartGradientTo.offset.baseVal = 1;
		this.chartGradientTo.style.stopColor = "var(--chart-color)";
		this.chartGradientTo.style.stopOpacity = 0.8;

		this.chartGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
		this.chartGradient.id = "dan-gradient";
		this.chartGradient.setAttribute("gradientUnits", "userSpaceOnUse");
		this.chartGradient.append(this.chartGradientFrom, this.chartGradientTo);
		this.chartDefs.appendChild(this.chartGradient);

		this.chartUnderlayFrom = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		this.chartUnderlayFrom.offset.baseVal = 0;
		this.chartUnderlayFrom.style.stopColor = "#ffffff";
		this.chartUnderlayFrom.style.stopOpacity = 0.06;

		this.chartUnderlayTo = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		this.chartUnderlayTo.offset.baseVal = 1;
		this.chartUnderlayTo.style.stopColor = "#ffffff";
		this.chartUnderlayTo.style.stopOpacity = 0.3;

		this.chartUnderlayGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
		this.chartUnderlayGradient.id = "dan-underlay-gradient";
		this.chartUnderlayGradient.setAttribute("gradientUnits", "userSpaceOnUse");
		this.chartUnderlayGradient.append(this.chartUnderlayFrom, this.chartUnderlayTo);
		this.chartDefs.appendChild(this.chartUnderlayGradient);

		this.chartUnderlayLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.chartUnderlayLine.classList.add("underlay-line");
		this.chartUnderlayLine.style.stroke = "url(#dan-underlay-gradient)";
		this.chart.appendChild(this.chartUnderlayLine);

		this.chartArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.chartArea.classList.add("area");
		this.chartArea.style.fill = "url(#dan-gradient)";
		this.chart.appendChild(this.chartArea);

		this.chartLine = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.chartLine.classList.add("line");
		this.chart.appendChild(this.chartLine);

		this.chartDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		this.chartDot.classList.add("dot");
		this.chart.appendChild(this.chartDot);

		this.chartPredictLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
		this.chartPredictLine.classList.add("line", "predict");
		this.chart.appendChild(this.chartPredictLine);

		this.container = makeTree("div", ["counter-panel", "dan-utils-panel"], {
			body: { tag: "div", class: "body", child: {
				labelNode: { tag: "div", class: "label", text: "dan" },

				head: { tag: "div", class: "head", child: {
					badge: this.badgeRoll,

					main: { tag: "div", class: "main", child: {
						valueNode: { tag: "div", class: "value", text: "---" },
						caption: { tag: "div", class: "caption" }
					}},

					meta: { tag: "div", class: "meta", child: {
						rawNode: this.rawValue,
						chip: { tag: "div", class: "chip" }
					}}
			}},

			info: { tag: "div", class: ["info", "show"], child: {
				beatmap: { tag: "div", class: ["card", "beatmap"], child: {
					heading: { tag: "div", class: "heading", child: {
						titleNode: { tag: "div", class: "title", text: "beatmap" },
						verdict: { tag: "div", class: "verdict" }
					}},

					tags: { tag: "div", class: "tags" },

					curve: { tag: "div", class: "curve", child: {
						plot: this.curve,

						levels: { tag: "div", class: "levels", child: {
							high: { tag: "div", class: "level", text: "+0.00" },
							zero: { tag: "div", class: ["level", "zero"], text: "0" },
							low: { tag: "div", class: "level", text: "-0.00" }
						}},

						marks: { tag: "div", class: "marks", child: {
							start: { tag: "div", class: "mark", text: "nothing" },
							bar: { tag: "div", class: ["mark", "pass"], text: "96%" },
							end: { tag: "div", class: "mark", text: "100%" }
						}}
					}},

					msd: { tag: "div", class: "msd", child: {
						overall: { tag: "div", class: "overall", child: {
							value: this.msdOverall,
							name: { tag: "div", class: "name", text: "msd" }
						}},

						bars: { tag: "div", class: "bars" }
					}},

					strip: { tag: "div", class: "strip" },
					note: { tag: "div", class: "note" }
				}}
			}},

			graph: { tag: "div", class: "graph", child: {
				delta: { tag: "div", class: "delta", child: {
					up: { tag: "span", class: "up" },
					down: { tag: "span", class: "down" }
				}},

				guides: { tag: "div", class: "guides" },
				chart: this.chart,

				values: { tag: "div", class: "values", child: {
					clear: { tag: "div", class: ["item", "clear"], child: {
						line: { tag: "span", class: "line" },
						value: { tag: "span", class: "value" }
					}},

					person: { tag: "div", class: ["item", "person"], child: {
						line: { tag: "span", class: "line" },
						value: { tag: "span", class: "value" }
					}},

					achievable: { tag: "div", class: ["item", "achievable"], child: {
						value: { tag: "span", class: "value" }
					}}
				}},

				markers: { tag: "div", class: "markers" },

				legends: { tag: "div", class: "legends", child: {
					l200: { tag: "div", class: ["legend", "l200"], text: 200 },
					l100: { tag: "div", class: ["legend", "l100"], text: 100 },
					l50: { tag: "div", class: ["legend", "l50"], text: 50 },
					lmiss: { tag: "div", class: ["legend", "lmiss"], text: "miss" },
					lclear: { tag: "div", class: ["legend", "lclear"], text: "chart dan" },
					lperson: { tag: "div", class: ["legend", "lperson"], text: "your dan" },
					lacv: { tag: "div", class: ["legend", "lacv"], text: "best possible" }
				}},

				cursor: { tag: "div", class: "cursor" }
			}},

			overlay: { tag: "div", class: "overlay", child: {
				spinner: { tag: "div", class: "spinner" }
			}}
			}},

			bottom: { tag: "div", class: "bottom", child: {
				blade: { tag: "div", class: "blade", child: {
					avatar: { tag: "img", class: "avatar", src: "./images/avatar-guest.png" },

					meta: { tag: "div", class: "meta", child: {
						username: { tag: "div", class: "username", text: "---" },
						flag: { tag: "div", class: "flag" }
					}},

					items: { tag: "div", class: "items", child: {
						dan: { tag: "div", class: ["item", "dan"], child: {
							label: { tag: "div", class: "label", text: "dan" },
							value: { tag: "div", class: "value", child: {
								badge: { tag: "img", class: "badge" },
								text: { tag: "span", class: "text", text: "---" },
								raw: { tag: "span", class: "raw" }
							}}
						}},

						rank: { tag: "div", class: ["item", "rank"], child: {
							label: { tag: "div", class: "label", text: "rank" },
							value: { tag: "div", class: "value", text: "---" }
						}},

						pp: { tag: "div", class: "item", child: {
							label: { tag: "div", class: "label", text: "pp" },
							value: { tag: "div", class: "value", text: "---" }
						}},

						accuracy: { tag: "div", class: "item", child: {
							label: { tag: "div", class: "label", text: "accuracy" },
							value: { tag: "div", class: "value", text: "---" }
						}}
					}}
				}},

				person: { tag: "div", class: ["card", "person"], child: {
					skills: { tag: "div", class: "skills" },
					note: { tag: "div", class: "note" }
				}}
			}}
		});

		for (const item of Dan.MSD) {
			const column = makeTree("div", ["column", item.key.toLowerCase()], {
				valueNode: new SmoothValue({ classes: "value", duration: 0.5, decimal: 2 }),

				bar: { tag: "div", class: "bar", child: {
					fill: { tag: "div", class: "fill" }
				}},

				name: { tag: "div", class: "name", text: item.short }
			});

			column.setAttribute("title", item.key);
			this.msdColumns[item.key] = column;
			this.container.body.info.beatmap.msd.bars.appendChild(column);
		}

		this.container.style.setProperty("--vert-space", this.CHART_PAD_VERT + "px");
		(new ResizeObserver(() => this.updateSize())).observe(this.container.body.graph);

		app.subscribe("beatmap.time.live", (value) => {
			this.currentTime = value;
			this.requestRender();
		});

		app.subscribe("performance.graph", (graph) => {
			this.strains = graph;
			this.updateUnderlay();
		}, "common", 4);

		app.subscribe("beatmap.time.firstObject", (value) => {
			this.timeFrom = value;
			this.updateUnderlay();
		});

		app.subscribe("beatmap.time.lastObject", (value) => {
			this.timeTo = value;
			this.updateUnderlay();
		});

		app.subscribe("client", () => this.requestRender());
		app.subscribe("beatmap.id", () => this.refreshMap());
		app.subscribe("beatmap.mode.name", () => this.refreshMap());
		app.subscribe("beatmap.isConvert", () => this.refreshMap());
		app.subscribe("beatmap.stats.cs.converted", () => this.refreshMap());
		app.subscribe("beatmap.stats.objects", () => {
			this.requestRender();
			this.renderBeatmap();
		});
		app.subscribe("beatmap.stats.od.converted", () => this.renderBeatmap());
		app.subscribe("beatmap.stats.stars.total", () => this.renderBeatmap());
		app.subscribe("beatmap.stats.bpm.common", () => this.renderBeatmap());
		app.subscribe("play.mods.rate", () => this.refreshMap());

		app.subscribe("play.hits", (hits) => {
			this.updateHits(hits);
			this.requestRender();
		});

		app.subscribe("profile.id", () => {
			this.refreshPlayer();
			this.renderBlade();
		});

		app.subscribe("profile.name", () => this.renderBlade());
		app.subscribe("profile.globalRank", () => this.renderBlade());
		app.subscribe("profile.pp", () => this.renderBlade());
		app.subscribe("profile.accuracy", () => this.renderBlade());
		app.subscribe("profile.countryCode.name", () => this.renderBlade());
		app.subscribe("profile.mode.name", () => this.renderBlade());
		app.subscribe("state.name", () => this.renderBlade());
		app.subscribe("play.playerName", () => this.updateDisplayState());
		app.subscribe("state.name", () => this.updateDisplayState());
		app.subscribe("resultsScreen.hits", () => this.requestRender());
		app.subscribe("resultsScreen.mods.rate", () => this.requestRender());

		if (this.transparent)
			this.container.classList.add("do-transparent");

		if (this.alwaysVisible) {
			this.container.classList.add("display", "show");

			if (this.transparent)
				this.container.classList.add("transparent");
		}

		this.danTrend = new TrendCalculator(1000);

		this.danTrendNumber = new SmoothNumber((value) => {
			const progress = Math.min(Math.abs(value) / this.TREND_SCALE, 1);

			if (value > 0) {
				this.container.body.graph.delta.down.style.height = "0%";
				this.container.body.graph.delta.up.style.height = `${(progress / 2) * 100}%`;
			} else {
				this.container.body.graph.delta.down.style.height = `${(progress / 2) * 100}%`;
				this.container.body.graph.delta.up.style.height = "0%";
			}
		}, { duration: 0.2 });

		let lastTrend = 0;
		setInterval(() => {
			const trend = this.danTrend.getTrend();

			if (trend === lastTrend)
				return;

			lastTrend = trend;
			this.danTrendNumber.value = trend;
		}, 100);

		(new ResizeObserver(() => this.updateCurveSize())).observe(this.container.body.info.beatmap.curve);


		this.container.bottom.blade.avatar.addEventListener("error", () => {
			this.container.bottom.blade.avatar.src = "./images/avatar-guest.png";
		});

		this.color = "#4db8ff";
		this.updateSize();
		this.updatePlayingState();
		this.renderPlayer();
		this.renderBeatmap();
		this.renderBlade();
	},

	/**
	 * Set the accent color of the counter.
	 *
	 * @param	{string}	color
	 */
	set color(color) {
		this.container.style.setProperty("--accent-color", color);
	},

	/**
	 * Keymode the ladders are read for.
	 *
	 * @returns	{number}
	 */
	keys() {
		if (this.keymodeOverride && this.keymodeOverride !== "auto")
			return parseInt(this.keymodeOverride);

		return Math.round(app.get("beatmap.stats.cs.converted", 0));
	},

	/**
	 * @returns	{number}
	 */
	userId() {
		return app.get("profile.id", 0);
	},

	/**
	 * @returns	{number}
	 */
	rate() {
		if (this.isViewingResult)
			return app.get("resultsScreen.mods.rate", 1) || 1;

		return app.get("play.mods.rate", 1) || 1;
	},

	/**
	 * Judgements the counter reads, which the result screen keeps after a
	 * play ends.
	 *
	 * @returns	{?DanHits}
	 */
	hits() {
		if (this.isViewingResult) {
			const results = app.get("resultsScreen.hits", null);

			if (results && Object.values(results).some((count) => count > 0))
				return results;
		}

		return app.get("play.hits", null);
	},

	updateDisplayState() {
		const isPlaying = app.get("play.playerName", "").length > 0;
		const isViewingResult = (app.get("state.name", "") === "resultScreen");

		if (isPlaying && !this.isPlaying) {
			this.reset();
			this.render();
		}

		if (isViewingResult && !this.isViewingResult)
			this.scheduleRefresh();

		this.container.classList.toggle("showing-result", isViewingResult);
		this.isPlaying = isPlaying;
		this.isViewingResult = isViewingResult;

		const shouldDisplay = (this.displayOnResultScreen)
			? isPlaying
			: (isPlaying && !isViewingResult);

		this.shouldDisplayGraph = shouldDisplay;

		if (shouldDisplay || this.alwaysVisible)
			this.show();
		else
			this.hide();

		this.updatePlayingState();
	},

	settings({
		label = "dan",
		accentColor = "#4db8ff",
		baseSize = 16,
		keymodeOverride = "auto",
		showBadges = true,
		showSkillsets = true,
		showMapStats = true,
		showMsd = true,
		showMarkers = true,
		refreshAfterResult = true,
		alwaysDisplay = true,
		displayOnResultScreen = true,
		disableBackground = false,
		backgroundColor = "#212121",
		backgroundOpacity = 20,
		resultBackgroundOpacity = 60,
		borderRadius = 0.5
	}) {
		this.container.body.labelNode.innerText = label;
		this.container.style.setProperty("--background-rgb", hexToRgb(backgroundColor).join(", "));

		document.documentElement.style.fontSize = `${baseSize}px`;
		localStorage.setItem("dan-utils-base-size", baseSize.toString());

		this.color = accentColor;

		const keysChanged = (this.keymodeOverride !== keymodeOverride);

		this.keymodeOverride = keymodeOverride;
		this.showBadges = showBadges;
		this.showSkillsets = showSkillsets;
		this.showMapStats = showMapStats;
		this.showMsd = showMsd;
		this.showMarkers = showMarkers;
		this.refreshAfterResult = refreshAfterResult;

		this.alwaysVisible = alwaysDisplay;
		this.displayOnResultScreen = displayOnResultScreen;
		this.updateDisplayState();

		this.container.style.setProperty("--transaprent-opacity", backgroundOpacity / 100);
		this.container.style.setProperty("--result-opacity", resultBackgroundOpacity / 100);
		this.container.style.setProperty("--border-radius", `${borderRadius}rem`);
		this.container.classList.toggle("full-transparent", disableBackground);

		if (keysChanged) {
			this.refreshPlayer();
			this.refreshMap();
		}

		this.renderPlayer();
		this.renderBeatmap();
	},

	async show() {
		if (this.showing)
			return this;

		this.showing = true;
		this.container.classList.add("display");
		await nextFrameAsync();
		await delayAsync(100);
		this.container.classList.add("show");
		await delayAsync(500);
		this.container.classList.add("transparent");
	},

	async hide() {
		if (!this.showing || this.alwaysVisible)
			return this;

		this.showing = false;
		this.container.classList.remove("show");
		await delayAsync(500);
		this.container.classList.remove("display", "transparent");
	},

	updateSize() {
		this.chartWidth = this.container.body.graph.clientWidth;
		this.chartHeight = this.container.body.graph.clientHeight + this.CHART_PAD_VERT * 2;
		this.chart.style.top = `-${this.CHART_PAD_VERT}px`;
		this.chart.setAttribute("width", this.chartWidth);
		this.chart.setAttribute("height", this.chartHeight);
		for (const gradient of [this.chartGradient, this.chartUnderlayGradient]) {
			gradient.setAttribute("x1", 0);
			gradient.setAttribute("y1", this.chartHeight);
			gradient.setAttribute("x2", 0);
			gradient.setAttribute("y2", 0);
		}

		this.updateUnderlay();
		this.updateZones();
		this.requestRender();
	},

	async updatePlayingState() {
		const isGraphShowing = this.container.body.graph.classList.contains("show");

		if (this.shouldDisplayGraph != isGraphShowing) {
			if (isGraphShowing) {
				this.container.body.graph.classList.add("hide");
				this.container.body.info.classList.add("show");
				await delayAsync(500);
				this.container.body.graph.classList.remove("show", "hide");
			} else {
				this.container.body.graph.classList.add("show");
				this.container.body.info.classList.add("hide");
				await delayAsync(500);
				this.container.body.info.classList.remove("show", "hide");
			}
		}

		if (this.shouldDisplayGraph)
			this.requestRender();
		else
			this.renderHead();
	},

	/**
	 * Look the selected beatmap up, once the state settles.
	 */
	refreshMap() {
		const beatmapId = app.get("beatmap.id", 0);
		const mode = app.get("beatmap.mode.name", "");
		const keys = this.keys();

		if (!beatmapId || !mode)
			return this.clearMap("idle");

		if (mode !== "mania")
			return this.clearMap("notMania");

		if (app.get("beatmap.isConvert", false))
			return this.clearMap("convert");

		if (!Dan.ladder(keys, "rc"))
			return this.clearMap("unsupported");

		const rate = Dan.rateKey(this.rate());
		this.mapGate.run(`${beatmapId}-${keys}-${rate}`, (signal) => this.loadMap(beatmapId, keys, signal));
	},

	clearMap(status) {
		this.mapGate.cancel();
		this.setMap({ status });
	},

	/**
	 * Dim a block and spin over it while its data is on the way.
	 *
	 * @param	{TreeDOM}	node
	 * @param	{boolean}	loading
	 */
	setLoading(node, loading) {
		clearTimeout(this.overlayTask);

		if (loading) {
			node.overlay.classList.add("visible");
			this.overlayTask = setTimeout(() => node.overlay.classList.add("show"), 1);
			return;
		}

		node.overlay.classList.remove("show");
		this.overlayTask = setTimeout(() => node.overlay.classList.remove("visible"), 600);
	},

	/**
	 * @param	{number}		beatmapId
	 * @param	{number}		keys
	 * @param	{AbortSignal}	signal
	 */
	async loadMap(beatmapId, keys, signal) {
		if (this.map.status === "idle" || this.map.status === "notMania" || this.map.status === "convert")
			this.setMap({ status: "loading" });

		this.setLoading(this.container.body, true);

		let entry = null;
		let analysis = null;

		try {
			[entry, analysis] = await Promise.all([
				ManiaTracker.entry(beatmapId, { signal }),
				ManiaTracker.analysis(beatmapId, { signal }).catch(() => null)
			]);
		} catch (error) {
			if (signal.aborted)
				return;

			console.warn("DanUtils: could not read the beatmap:", error);
			return this.setMap({ status: "error" });
		}

		if (signal.aborted)
			return;

		if (!entry || entry.missing)
			return this.setMap({ status: "unknown", analysis });

		const dan = await this.resolveDan(beatmapId, entry, keys, signal);

		if (signal.aborted)
			return;

		this.setMap({
			status: (dan) ? "ready" : "pending",
			entry,
			analysis,
			stale: !!(entry.stale || (analysis && analysis.stale))
		}, dan);
	},

	/**
	 * Dan of the chart at the speed it is about to be played at.
	 *
	 * @param	{number}		beatmapId
	 * @param	{object}		entry
	 * @param	{number}		keys
	 * @param	{AbortSignal}	signal
	 * @returns	{Promise<?object>}
	 */
	async resolveDan(beatmapId, entry, keys, signal) {
		const rate = this.rate();
		const key = Dan.rateKey(rate);
		let dan = null;
		let msd = entry.msd || null;

		if (key === "1.00")
			dan = entry.dan;
		else if (key === "1.50" && entry.danDt)
			dan = entry.danDt;
		else {
			try {
				const rated = await ManiaTracker.rated(beatmapId, rate, { signal });
				dan = (rated) ? rated.dan : null;

				if (rated && rated.msd)
					msd = rated.msd;
			} catch (error) {
				if (signal.aborted)
					return null;

				console.warn(`DanUtils: no dan for ${beatmapId} at ${key}x:`, error);
			}
		}

		if (!dan || typeof dan.rawDan !== "number")
			return null;

		const side = Dan.side(dan.family);
		const ladder = Dan.ladder(entry.keyCount || keys, side);

		if (!ladder)
			return null;

		return {
			ladder,
			side,
			keys: entry.keyCount || keys,
			raw: dan.rawDan,
			label: dan.label,
			bar: Dan.passBar(entry.keyCount || keys, side, dan.rawDan),
			vibro: !!entry.vibro,
			rate,
			msd
		};
	},

	/**
	 * Ratings of the chart at the speed it is played at, or at 1.0x when the
	 * site has no dan for it yet.
	 *
	 * @returns	{?Object<string, number>}
	 */
	chartMsd() {
		if (this.mapDan && this.mapDan.msd)
			return this.mapDan.msd;

		return (this.map.entry) ? this.map.entry.msd || null : null;
	},

	/**
	 * Skill the chart leans on, which colours the graph.
	 *
	 * @returns	{?string}
	 */
	chartSkill() {
		return Dan.skillset(this.chartMsd());
	},

	/**
	 * Tint the panel after the chart's skill.
	 */
	updateSkillColor() {
		const skill = this.chartSkill();

		for (const name of ["jack", "tech", "speed", "stamina"])
			this.container.classList.toggle(`skill-${name}`, name === skill);
	},

	/**
	 * @param	{object}	map
	 * @param	{?object}	[dan]
	 */
	setMap(map, dan = null) {
		this.map = {
			status: map.status,
			entry: map.entry || null,
			analysis: map.analysis || null,
			stale: !!map.stale
		};

		this.mapDan = dan;
		this.curveAccuracy = null;
		this.setLoading(this.container.body, false);
		this.reset();
		this.updateSkillColor();
		this.updateUnderlay();
		this.updateZones();
		this.renderBeatmap();
		this.renderPlayer();
		this.requestRender();
	},

	/**
	 * Read the player's dan estimates.
	 *
	 * @param	{boolean}	[force]
	 */
	refreshPlayer(force = false) {
		const userId = this.userId();

		if (!userId || userId <= 0)
			return this.clearPlayer();

		const key = (force) ? `player-${userId}-${Date.now()}` : `player-${userId}`;
		this.playerGate.run(key, (signal) => this.loadPlayer(userId, force, signal));
	},

	clearPlayer() {
		this.playerGate.cancel();
		this.player = { status: "none", skills: null, stale: false };
		this.renderPlayer();
	},

	/**
	 * @param	{number}		userId
	 * @param	{boolean}		force
	 * @param	{AbortSignal}	signal
	 */
	async loadPlayer(userId, force, signal) {
		if (this.player.status === "none")
			this.player = { status: "loading", skills: null, stale: false };

		this.renderPlayer();

		try {
			const skills = await ManiaTracker.skills(userId, { force, signal });

			if (signal.aborted)
				return;

			this.player = {
				status: (skills && skills.tracked === false) ? "untracked" : "ready",
				skills,
				stale: !!(skills && skills.stale)
			};
		} catch (error) {
			if (signal.aborted)
				return;

			console.warn("DanUtils: could not read the player's dan:", error);
			this.player = { status: "error", skills: null, stale: false };
		}

		this.lastRefresh = Date.now();
		this.renderPlayer();
		this.requestRender();
	},

	/**
	 * A finished play can change the estimate, so read it again once the
	 * site has had time to pick the score up.
	 */
	scheduleRefresh() {
		if (!this.refreshAfterResult)
			return;

		if (Date.now() - this.lastRefresh < 60 * 1000)
			return;

		clearTimeout(this.refreshTask);
		this.refreshTask = setTimeout(() => this.refreshPlayer(true), 20 * 1000);
	},

	/**
	 * Ratings of the keymode being played.
	 *
	 * @returns	{?object}
	 */
	playerMode() {
		if (!this.player.skills)
			return null;

		return ManiaTracker.mode(this.player.skills, this.keys());
	},

	/**
	 * Side the panel reads the player on: the one the chart belongs to when
	 * the player has a dan there, otherwise the side they do have.
	 *
	 * @returns	{DanSide}
	 */
	shownSide() {
		const wanted = (this.mapDan) ? this.mapDan.side : "rc";
		const mode = this.playerMode();

		if (!mode || !mode.dan || mode.dan[wanted])
			return wanted;

		return (wanted === "rc") ? "ln" : "rc";
	},

	/**
	 * The player's dan on the side the selected chart belongs to.
	 *
	 * @param	{DanSide}	[side]
	 * @returns	{?object}
	 */
	playerDan(side = null) {
		const mode = this.playerMode();

		if (!mode || !mode.dan)
			return null;

		return mode.dan[side || this.shownSide()] || null;
	},

	/**
	 * @param	{HTMLImageElement}	node
	 * @param	{?DanLadder}		ladder
	 * @param	{?string}			label
	 */
	setBadge(node, ladder, label) {
		const url = (this.showBadges) ? Dan.badgeUrl(ladder, label) : null;

		if (!url) {
			node.classList.remove("show");
			node.removeAttribute("src");
			return;
		}

		if (node.getAttribute("src") !== url)
			node.setAttribute("src", url);

		node.classList.add("show");
	},

	/**
	 * Turn the head badge over to a new level.
	 *
	 * @param	{?DanLadder}		ladder
	 * @param	{?string}			label
	 * @param	{"up" | "down"}		direction
	 */
	rollBadge(ladder, label, direction) {
		const url = (this.showBadges) ? Dan.badgeUrl(ladder, label) : null;
		this.badgeRoll.set(url || "", direction);
	},

	renderHead() {
		const head = this.container.body.head;

		if (this.shouldDisplayGraph)
			return;

		const dan = this.playerDan();
		const mode = this.playerMode();
		const ladder = Dan.ladder((mode) ? mode.keyCount : this.keys(), this.shownSide());

		this.container.classList.remove("below-bar");

		if (!dan) {
			head.main.valueNode.innerText = (this.player.status === "loading") ? "..." : "---";
			head.main.valueNode.removeAttribute("data-suffix");
			this.rawValue.set(NaN);
			this.rollBadge(null, null, "down");
			head.main.caption.innerText = this.playerNote();
			head.meta.chip.innerText = "";
			head.meta.chip.classList.remove("show");
			return;
		}

		const rising = (dan.rawDan >= (this.shownDan || 0));
		this.shownDan = dan.rawDan;

		head.main.valueNode.innerText = dan.label;
		head.main.valueNode.dataset.suffix = Dan.labelSuffix(dan.label);
		this.rawValue.set(dan.rawDan);
		this.rollBadge(ladder, dan.label, (rising) ? "up" : "down");
		head.main.caption.innerText = this.playerCaption(mode, dan);

		const chip = (this.player.stale) ? "offline" : "";
		head.meta.chip.innerText = chip;
		head.meta.chip.classList.toggle("show", chip.length > 0);
	},

	/**
	 * Where the estimate stands, in the terms mania-tracker uses for it.
	 *
	 * @param	{object}	mode
	 * @param	{object}	dan
	 * @returns	{string}
	 */
	playerCaption(mode, dan) {
		const parts = [];
		const overall = (mode.percentiles) ? mode.percentiles.Overall : null;

		if (overall && typeof overall.value === "number")
			parts.push(`top ${Math.round(100 - overall.value)}%`);

		const clears = dan.clearWindow;

		if (clears && clears.need > 0)
			parts.push(`${clears.have}/${clears.need} clears`);
		else if (dan.clears)
			parts.push(`${dan.clears} clears`);

		return parts.join("  ·  ");
	},

	/**
	 * @returns	{string}
	 */
	playerNote() {
		switch (this.player.status) {
			case "none":
				return "sign in to read your dan";

			case "loading":
				return "reading mania-tracker";

			case "untracked":
				return "not tracked by mania-tracker";

			case "error":
				return "mania-tracker is unreachable";
		}

		const mode = this.playerMode();

		if (!mode)
			return `no ${this.keys()}K ratings yet`;

		if (!mode.dan || (!mode.dan.rc && !mode.dan.ln))
			return "not enough qualifying passes";

		return "";
	},

	renderPlayer() {
		const person = this.container.bottom.person;
		const mode = this.playerMode();
		const keys = (mode) ? mode.keyCount : this.keys();

		emptyNode(person.skills);
		this.renderBlade();

		const note = this.playerNote();
		person.note.innerText = note;
		person.note.classList.toggle("show", note.length > 0);

		if (!mode || !mode.dan) {
			this.renderHead();
			return;
		}

		if (!this.showSkillsets) {
			person.classList.toggle("empty", note.length === 0);
			this.renderHead();
			return;
		}

		const dan = this.playerDan();
		const skillsets = (dan) ? dan.skillsets : null;
		const names = (skillsets) ? Object.keys(skillsets).filter((name) => !!skillsets[name]) : [];

		person.classList.toggle("empty", names.length === 0 && note.length === 0);

		if (names.length > 0) {
			const peak = Math.max(...names.map((name) => skillsets[name].rawDan), 0.001);
			const chartSkill = this.chartSkill();

			for (const name of names) {
				const skill = skillsets[name];

				const row = makeTree("div", ["row", name, (name === chartSkill) ? "active" : "idle"], {
					name: { tag: "div", class: "name", text: name },
					bar: { tag: "div", class: "bar", child: {
						fill: { tag: "div", class: "fill" }
					}},
					value: { tag: "div", class: "value", text: skill.label }
				});

				row.bar.fill.style.width = `${clamp(skill.rawDan / peak, 0, 1) * 100}%`;
				row.value.dataset.suffix = Dan.labelSuffix(skill.label);
				row.setAttribute("title", `${round(skill.rawDan, 2)} from ${skill.clears} clears`);
				person.skills.appendChild(row);
			}
		}

		this.renderHead();
	},

	/**
	 * Who is being read, shown the way the user card does it.
	 */
	/**
	 * Who is being read and where their dan stands, in the user card's style.
	 */
	renderBlade() {
		const blade = this.container.bottom.blade;
		const userId = this.userId();
		const name = app.get("profile.name", "");
		const rank = app.get("profile.globalRank", 0);
		const pp = app.get("profile.pp", 0);
		const accuracy = app.get("profile.accuracy", 0);
		const country = app.get("profile.countryCode.name", "");
		const ruleset = String(app.get("profile.mode.name", "mania") || "mania").toLowerCase();
		const state = app.get("state.name", "");

		blade.meta.username.innerText = name || "guest";
		blade.avatar.src = (userId > 0) ? `https://a.ppy.sh/${userId}` : "./images/avatar-guest.png";

		const flag = countryFlagUrl(country);
		blade.meta.flag.style.backgroundImage = (flag) ? `url(${flag})` : "";
		blade.meta.flag.style.display = (flag) ? null : "none";

		const status = (state === "play") ? "playing" : (state === "edit") ? "editing" : "idle";
		this.container.bottom.style.setProperty("--status-color", `var(--status-${status})`);

		const tier = (rank > 0) ? rankTier(rank, ruleset) : "iron";
		blade.items.rank.value.style.setProperty("--rank-color", `var(--level-tier-${tier})`);
		blade.items.rank.value.innerText = (rank > 0) ? `#${rank.toLocaleString("en-US")}` : "---";
		blade.items.pp.value.innerText = (pp > 0) ? Math.round(pp).toLocaleString("en-US") : "---";
		blade.items.accuracy.value.innerText = (accuracy > 0) ? `${round(accuracy, 2).toFixed(2)}%` : "---";

		const ratings = this.playerMode();
		const keys = (ratings) ? ratings.keyCount : this.keys();
		const side = this.shownSide();
		const dan = this.playerDan(side);
		const item = blade.items.dan;

		item.label.innerText = (keys > 0) ? `${keys}K ${(side === "ln") ? "LN" : "regular"}` : "dan";

		if (!dan) {
			item.value.text.innerText = "---";
			item.value.text.removeAttribute("data-suffix");
			item.value.raw.innerText = "";
			this.setBadge(item.value.badge, null, null);
			return;
		}

		item.value.text.innerText = dan.label;
		item.value.text.dataset.suffix = Dan.labelSuffix(dan.label);
		item.value.raw.innerText = round(dan.rawDan, 2).toFixed(2);
		this.setBadge(item.value.badge, Dan.ladder(keys, side), dan.label);
	},

	renderBeatmap() {
		const beatmap = this.container.body.info.beatmap;
		const entry = this.map.entry;
		const analysis = this.map.analysis;

		emptyNode(beatmap.tags);

		const note = this.beatmapNote();
		beatmap.note.innerText = note;
		beatmap.note.classList.toggle("show", note.length > 0);

		this.renderVerdict(analysis);
		this.renderMsd();

		beatmap.curve.classList.toggle("show", !!this.mapDan);
		beatmap.classList.toggle("empty", !this.mapDan);
		this.renderStrip();

		if (this.mapDan) {
			const label = this.mapDan.label || Dan.format(this.mapDan.ladder, this.mapDan.raw).text;
			const badge = document.createElement("img");
			badge.classList.add("badge");
			this.setBadge(badge, this.mapDan.ladder, label);
			beatmap.tags.appendChild(badge);

			beatmap.tags.appendChild(makeTree("div", ["tag", "side"], {
				value: { tag: "div", class: "value", text: `${label} ${(this.mapDan.side === "ln") ? "LN" : "regular"}` }
			}));

			if (this.mapDan.rate !== 1) {
				beatmap.tags.appendChild(makeTree("div", ["tag", "rate"], {
					value: { tag: "div", class: "value", text: `${Dan.rateKey(this.mapDan.rate)}x` }
				}));
			}

			if (this.mapDan.vibro) {
				beatmap.tags.appendChild(makeTree("div", ["tag", "vibro"], {
					value: { tag: "div", class: "value", text: "vibro" }
				}));
			}
		}

		const sideTag = (this.mapDan && this.mapDan.side === "ln") ? "ln" : null;

		if (entry && entry.primaryPattern && entry.primaryPattern !== sideTag) {
			beatmap.tags.appendChild(makeTree("div", ["tag", "pattern"], {
				value: { tag: "div", class: "value", text: entry.primaryPattern }
			}));
		}

		if (this.map.stale) {
			beatmap.tags.appendChild(makeTree("div", ["tag", "stale"], {
				value: { tag: "div", class: "value", text: "offline" }
			}));
		}

		this.updateCurve();
	},

	/**
	 * How mania-tracker reads the chart, split into the side it belongs to
	 * and the side it only brushes against.
	 *
	 * @param	{?object}	analysis
	 */
	renderVerdict(analysis) {
		const verdict = this.container.body.info.beatmap.heading.verdict;
		emptyNode(verdict);

		if (!analysis || !analysis.verdictText || !this.mapDan)
			return;

		const parts = String(analysis.verdictText)
			.split("||")
			.map((part) => part.trim())
			.filter(Boolean);

		const wanted = (this.mapDan.side === "ln");

		for (const part of parts) {
			const isLn = /\bLN\b/.test(part);

			verdict.appendChild(makeTree("span", ["part", (isLn === wanted) ? "active" : "idle"], {
				under: { tag: "span", class: "under", text: (part.startsWith("<")) ? "under" : "" },
				value: { tag: "span", class: "value", text: part.replace(/^<\s*/, "") }
			}));
		}
	},

	/**
	 * Draw the chart's MSD ratings as a row of bars, tallest one lit, the way
	 * a glance at the mania-tracker card reads them.
	 */
	renderMsd() {
		const box = this.container.body.info.beatmap.msd;
		const msd = (this.showMsd) ? this.chartMsd() : null;
		const items = (msd)
			? Dan.MSD.filter((item) => typeof msd[item.key] === "number")
				.sort((a, b) => msd[b.key] - msd[a.key])
			: [];

		const wasShowing = box.classList.contains("show");
		box.classList.toggle("show", items.length > 0);

		if (items.length === 0)
			return;

		const peak = Math.max(...items.map((item) => msd[item.key]), 0.001);
		const places = new Map();

		for (const item of Dan.MSD)
			places.set(item.key, this.msdColumns[item.key].getBoundingClientRect().left);

		this.msdOverall.set((typeof msd.Overall === "number") ? msd.Overall : peak);

		for (const item of Dan.MSD) {
			const column = this.msdColumns[item.key];
			const place = items.indexOf(item);

			column.classList.toggle("hidden", place < 0);

			if (place < 0)
				continue;

			column.style.order = place;
			column.classList.toggle("top", place === 0);
			column.valueNode.set(msd[item.key]);
			column.bar.fill.style.height = `${clamp(msd[item.key] / peak, 0, 1) * 100}%`;
		}

		if (!wasShowing)
			return;

		for (const item of items) {
			const column = this.msdColumns[item.key];
			const shift = places.get(item.key) - column.getBoundingClientRect().left;

			if (Math.abs(shift) < 1)
				continue;

			column.style.transition = "none";
			column.style.transform = `translateX(${round(shift, 2)}px)`;
			void column.offsetWidth;
			column.style.transition = "";
			column.style.transform = "";
		}
	},

	/**
	 * Write the beatmap numbers out, keeping each one on the node it already
	 * has so it can count over to the new beatmap's value.
	 */
	renderStrip() {
		const strip = this.container.body.info.beatmap.strip;
		const stats = (this.showMapStats) ? this.beatmapStats() : [];
		const shown = new Set();

		for (const [key, value] of stats) {
			const stat = this.STATS[key];

			if (!this.stripStats[key]) {
				this.stripStats[key] = makeTree("div", "stat", {
					valueNode: new SmoothValue({
						classes: "value",
						duration: 0.6,
						processor: stat.format
					}),

					name: { tag: "div", class: "name", text: stat.name }
				});
			}

			const item = this.stripStats[key];
			strip.appendChild(item);
			item.valueNode.set(value);
			shown.add(key);
		}

		for (const key of Object.keys(this.stripStats)) {
			if (!shown.has(key))
				this.stripStats[key].remove();
		}
	},

	/**
	 * Numbers describing the chart, read from mania-tracker when it knows it
	 * and from the game itself when it does not.
	 *
	 * @returns	{[string, number][]}
	 */
	beatmapStats() {
		const entry = this.map.entry;
		const analysis = this.map.analysis;
		const objects = app.get("beatmap.stats.objects", null);

		const keys = (entry) ? entry.keyCount : this.keys();
		const stars = (entry) ? entry.stars : app.get("beatmap.stats.stars.total", 0);
		const bpm = (entry) ? entry.bpm : app.get("beatmap.stats.bpm.common", 0);
		const od = (entry) ? entry.od : app.get("beatmap.stats.od.converted", 0);

		if (!keys || !stars)
			return [];

		const stats = [
			["keys", keys],
			["stars", stars]
		];

		if (bpm > 0)
			stats.push(["bpm", bpm]);

		if (od > 0)
			stats.push(["od", od]);

		const lnRatio = (analysis && typeof analysis.lnRatio === "number")
			? analysis.lnRatio
			: (objects && objects.total > 0) ? objects.holds / objects.total : null;

		if (lnRatio !== null)
			stats.push(["ln", lnRatio * 100]);

		if (this.mapDan)
			stats.push(["bar", this.mapDan.bar * 100]);

		return stats;
	},

	updateCurveSize() {
		const box = this.container.body.info.beatmap.curve;
		this.curveWidth = box.clientWidth;
		this.curveHeight = box.clientHeight;
		this.curve.setAttribute("width", this.curveWidth);
		this.curve.setAttribute("height", this.curveHeight);
		this.updateCurve();
	},

	/**
	 * How accuracy turns into dan credit on a chart, held in a shape the
	 * counter can walk from one beatmap's to the next one's. Everything is a
	 * fraction of the plot, so a resize does not disturb a running move.
	 *
	 * @typedef {{
	 * 	points: number[][],
	 * 	from: number,
	 * 	bar: number,
	 * 	barPercent: number,
	 * 	zero: number,
	 * 	high: number,
	 * 	low: number
	 * }} CurveShape
	 *
	 * @param	{object}	dan
	 * @returns	{CurveShape}
	 */
	curveShapeOf(dan) {
		const range = Dan.creditRange(dan.side, dan.keys);
		const from = dan.bar - Dan.belowBarWindow(dan.side, dan.keys);
		const toX = (accuracy) => scaleValue(accuracy, [from, 1], [0, 1]);
		const toY = (credit) => scaleValue(credit, [range.min, range.max], [0, 1]);
		const points = [];

		for (let step = 0; step <= this.CURVE_STEPS; step++) {
			const accuracy = from + (1 - from) * (step / this.CURVE_STEPS);
			const credit = Dan.credit(accuracy, dan.bar, dan.side, dan.keys);

			points.push([toX(accuracy), toY((credit === null) ? range.min : credit)]);
		}

		return {
			points,
			from,
			bar: toX(dan.bar),
			barPercent: dan.bar * 100,
			zero: toY(0),
			high: range.max,
			low: range.min
		};
	},

	/**
	 * @param	{CurveShape}	from
	 * @param	{CurveShape}	to
	 * @param	{number}		t
	 * @returns	{CurveShape}
	 */
	curveBetween(from, to, t) {
		const mix = (start, end) => start + (end - start) * t;

		return {
			points: to.points.map((point, index) => {
				const start = from.points[index] || point;
				return [mix(start[0], point[0]), mix(start[1], point[1])];
			}),

			from: mix(from.from, to.from),
			bar: mix(from.bar, to.bar),
			barPercent: mix(from.barPercent, to.barPercent),
			zero: mix(from.zero, to.zero),
			high: mix(from.high, to.high),
			low: mix(from.low, to.low)
		};
	},

	/**
	 * Walk the plot over to the selected chart's credit curve. A chart the
	 * counter has no curve for yet grows out of its own zero line.
	 */
	updateCurve() {
		const dan = this.mapDan;
		const key = (dan && this.curveWidth > 0 && this.curveHeight > 0)
			? `${dan.side}-${dan.keys}-${round(dan.bar, 4)}`
			: "";

		if (key === this.curveKey) {
			this.drawCurve();
			return;
		}

		this.curveKey = key;

		if (this.curveAnimator) {
			this.curveAnimator.cancel();
			this.curveAnimator = null;
		}

		if (!key) {
			this.curveShape = null;
			this.drawCurve();
			return;
		}

		const target = this.curveShapeOf(dan);
		const from = this.curveShape
			|| { ...target, points: target.points.map(([x]) => [x, target.zero]) };

		this.curveAnimator = new Animator(this.CURVE_DURATION, Easing.OutQuart, (t) => {
			this.curveShape = this.curveBetween(from, target, t);
			this.drawCurve();
		});
	},

	/**
	 * Plot how accuracy turns into dan credit on the selected chart, the way
	 * the mania-tracker estimate page draws it.
	 */
	drawCurve() {
		const box = this.container.body.info.beatmap.curve;
		const shape = this.curveShape;

		if (!shape || this.curveWidth <= 0 || this.curveHeight <= 0) {
			this.curveLine.setAttribute("d", "");
			this.curveDot.classList.remove("show");
			return;
		}

		const height = this.curveHeight - this.CURVE_PAD * 2;
		const toX = (point) => round(point * this.curveWidth, 2);
		const toY = (point) => round(this.CURVE_PAD + height - point * height, 2);

		this.curveLine.setAttribute("d", shape.points
			.map(([x, y], index) => `${(index === 0) ? "M" : "L"} ${toX(x)} ${toY(y)}`)
			.join(" "));

		const zeroY = toY(shape.zero);
		this.curveZero.setAttribute("x1", 0);
		this.curveZero.setAttribute("x2", this.curveWidth);
		this.curveZero.setAttribute("y1", zeroY);
		this.curveZero.setAttribute("y2", zeroY);

		const barX = toX(shape.bar);
		this.curveBar.setAttribute("x1", barX);
		this.curveBar.setAttribute("x2", barX);
		this.curveBar.setAttribute("y1", 0);
		this.curveBar.setAttribute("y2", this.curveHeight);

		box.levels.high.innerText = `+${round(shape.high, 2).toFixed(2)}`;
		box.levels.low.innerText = round(shape.low, 2).toFixed(2);
		box.marks.bar.innerText = `${round(shape.barPercent, 2)}%`;
		box.marks.bar.style.left = `${round(shape.bar * 100, 2)}%`;

		const dan = this.mapDan;
		const accuracy = this.curveAccuracy;
		const credit = (dan && accuracy !== null && accuracy !== undefined)
			? Dan.credit(accuracy, dan.bar, dan.side, dan.keys)
			: null;

		if (credit === null) {
			this.curveDot.classList.remove("show");
			return;
		}

		this.curveDot.setAttribute("cx", toX(scaleValue(accuracy, [shape.from, 1], [0, 1])));
		this.curveDot.setAttribute("cy", toY(scaleValue(credit, [shape.low, shape.high], [0, 1])));
		this.curveDot.classList.add("show");
	},

	/**
	 * @returns	{string}
	 */
	beatmapNote() {
		switch (this.map.status) {
			case "idle":
				return "pick a beatmap";

			case "loading":
				return "reading mania-tracker";

			case "notMania":
				return "only osu!mania beatmaps have a dan";

			case "convert":
				return "converts are not rated";

			case "unsupported":
				return `no ladder measures ${this.keys()}K`;

			case "unknown":
				return "this beatmap has no dan estimate";

			case "pending":
				return "mania-tracker has not rated this yet";

			case "error":
				return "mania-tracker is unreachable";
		}

		if (this.mapDan && this.mapDan.vibro)
			return "vibro charts earn no dan credit";

		return "";
	},

	/**
	 * Dan levels the chart spans, from the worst clear that still counts to
	 * the best one the ladder allows.
	 *
	 * @returns	{?{ low: number, high: number }}
	 */
	bounds() {
		if (!this.mapDan)
			return null;

		const range = Dan.creditRange(this.mapDan.side, this.mapDan.keys);

		return {
			low: Math.max(this.mapDan.ladder.min, this.mapDan.raw + range.min),
			high: Math.min(this.mapDan.ladder.max, this.mapDan.raw + range.max)
		};
	},

	/**
	 * Draw the beatmap's own difficulty behind the graph. The hardest section
	 * sits on the chart's dan and silence sits at the floor, so the shape
	 * reads against the same scale as the line in front of it.
	 */
	updateUnderlay() {
		const bounds = this.bounds();
		const series = (this.strains && Array.isArray(this.strains.series))
			? this.strains.series.find((item) => Array.isArray(item.data) && item.data.length > 0)
			: null;

		const axis = (this.strains) ? this.strains.xaxis : null;

		if (!bounds || !series || !Array.isArray(axis) || axis.length === 0 || this.chartWidth <= 0 || this.timeTo <= this.timeFrom)
			return this.clearUnderlay();

		const count = Math.min(series.data.length, axis.length);
		let lowest = Infinity;
		let highest = -Infinity;

		for (let index = 0; index < count; index++) {
			const strain = series.data[index];

			if (!(strain > 0) || axis[index] < this.timeFrom || axis[index] > this.timeTo)
				continue;

			lowest = Math.min(lowest, strain);
			highest = Math.max(highest, strain);
		}

		if (!isFinite(lowest) || !isFinite(highest))
			return this.clearUnderlay();

		const spread = Math.max(highest - lowest, 0.001);
		const chartRenderHeight = this.chartHeight - this.CHART_PAD_VERT * 2;
		const top = this.mapDan.raw - bounds.low;
		const path = [];
		let previous = null;

		for (let index = 0; index < count; index++) {
			if (axis[index] < this.timeFrom || axis[index] > this.timeTo)
				continue;

			const strain = series.data[index];
			const point = (strain > 0) ? clamp((strain - lowest) / spread, 0, 1) : 0;
			const level = bounds.low + point * top;

			const x = round(scaleValue(axis[index], [this.timeFrom, this.timeTo], [0, 1]) * this.chartWidth, 2);
			const y = round(this.CHART_PAD_VERT + chartRenderHeight
				- scaleValue(level, [bounds.low, bounds.high], [0, 1]) * chartRenderHeight, 2);

			if (previous && previous[0] === x && previous[1] === y)
				continue;

			path.push(`${(path.length === 0) ? "M" : "L"} ${x} ${y}`);
			previous = [x, y];
		}

		if (path.length < 2)
			return this.clearUnderlay();

		this.chartUnderlayLine.setAttribute("d", path.join(" "));
	},

	/**
	 * Shade the band of song each dan level covers, so the line reads against
	 * the ladder rather than against bare space.
	 */
	updateZones() {
		const guides = this.container.body.graph.guides;
		emptyNode(guides);

		const bounds = this.bounds();

		if (!bounds || !this.mapDan || this.chartHeight <= 0)
			return;

		const ladder = this.mapDan.ladder;
		const height = this.chartHeight - this.CHART_PAD_VERT * 2;
		const first = Math.max(ladder.min, Math.round(bounds.low));
		const last = Math.min(ladder.max, Math.round(bounds.high));
		const at = (level) => this.CHART_PAD_VERT + height
			- scaleValue(level, [bounds.low, bounds.high], [0, 1]) * height;

		for (let level = first; level <= last; level++) {
			const top = at(Math.min(level + 0.5, bounds.high));
			const bottom = at(Math.max(level - 0.5, bounds.low));

			if (bottom - top < 1)
				continue;

			const zone = makeTree("div", ["zone", (level % 2 === 0) ? "even" : "odd"], {
				name: { tag: "div", class: "name", text: ladder.names[level - ladder.min] }
			});

			zone.style.top = `${round(top, 2)}px`;
			zone.style.height = `${round(bottom - top, 2)}px`;
			zone.style.opacity = Easing.InSine(scaleValue(level, [first, last], [0.35, 1]));
			zone.classList.toggle("tight", bottom - top < 14);
			guides.appendChild(zone);
		}
	},

	clearUnderlay() {
		this.chartUnderlayLine.setAttribute("d", "");
	},

	/**
	 * @param	{?DanHits}	hits
	 */
	updateHits(hits) {
		if (!hits)
			return;

		const miss = hits["0"] || 0;
		const h50 = hits["50"] || 0;
		const h100 = hits["100"] || 0;
		const h200 = hits.katu || 0;

		if (this.current100Hits === null) {
			this.current200Hits = h200;
			this.current100Hits = h100;
			this.current50Hits = h50;
			this.currentMissHits = miss;
			emptyNode(this.container.body.graph.markers);
			return;
		}

		if (this.current200Hits < h200) {
			this.addHit("200", h200 - this.current200Hits);
			this.current200Hits = h200;
		}

		if (this.current100Hits < h100) {
			this.addHit("100", h100 - this.current100Hits);
			this.current100Hits = h100;
		}

		if (this.current50Hits < h50) {
			this.addHit("50", h50 - this.current50Hits);
			this.current50Hits = h50;
		}

		if (this.currentMissHits < miss) {
			this.addHit("miss", miss - this.currentMissHits);
			this.currentMissHits = miss;
		}
	},

	/**
	 * Mark a judgement at the point of the song it happened.
	 *
	 * @param	{"200" | "100" | "50" | "miss"}		type
	 * @param	{number}							[amount]
	 */
	async addHit(type, amount = 1) {
		if (!this.showMarkers || this.isViewingResult)
			return;

		const left = scaleValue(this.currentTime, [this.timeFrom, this.timeTo], [0, 100]);

		const hit = document.createElement("div");
		hit.classList.add("hit", `h${type}`);
		hit.style.left = `${left}%`;
		this.container.body.graph.markers.appendChild(hit);

		if (type == "miss") {
			const hitThin = document.createElement("div");
			hitThin.classList.add("hit", `h${type}`, "thin-line");
			hitThin.style.left = `${left}%`;
			this.container.body.graph.markers.appendChild(hitThin);

			requestAnimationFrame(async () => {
				await nextFrameAsync();
				hitThin.classList.add("show");
			});
		}

		await nextFrameAsync();
		await nextFrameAsync();
		hit.style.height = `${amount * 10}%`;
		hit.classList.add("show");
	},

	requestRender() {
		if (this.renderTask)
			return;

		this.renderTask = requestAnimationFrame(() => {
			try {
				this.render();
			} catch (e) {
				console.warn("render error:", e);
			}

			this.renderTask = null;
		});
	},

	reset() {
		this.points = [];
		this.currentTimePoint = 0;
		this.lastTimePoint = 0;
		emptyNode(this.container.body.graph.markers);
		this.current200Hits = null;
		this.current100Hits = null;
		this.current50Hits = null;
		this.currentMissHits = null;

		if (this.danTrend)
			this.danTrend.clear();

		if (this.danTrendNumber)
			this.danTrendNumber.value = 0;
	},

	render() {
		if (!this.shouldDisplayGraph)
			return;

		if (this.timeTo <= 0 || !this.isPlaying)
			return;

		if (this.renderedTime - this.currentTime > 1000)
			this.reset();

		const dan = this.mapDan;
		const graph = this.container.body.graph;

		graph.classList.toggle("no-dan", !dan);

		if (!dan) {
			this.container.body.head.main.valueNode.innerText = "---";
			this.container.body.head.meta.chip.innerText = this.beatmapNote();
			this.container.body.head.meta.chip.classList.add("show");
			this.rawValue.set(NaN);
			this.rollBadge(null, null, "down");
			this.renderedTime = this.currentTime;
			return;
		}

		const chartRenderHeight = this.chartHeight - this.CHART_PAD_VERT * 2;
		const hits = this.hits();
		const total = Dan.totalJudgements(app.get("beatmap.stats.objects", null), app.get("client", "stable"));

		const accuracy = (dan.vibro) ? null : (Dan.accuracy(hits, dan.side, dan.keys) ?? 1);
		const bestAccuracy = (dan.vibro) ? null : (Dan.maxAccuracy(hits, total, dan.side, dan.keys) ?? accuracy);

		const { low, high } = this.bounds();

		const credit = (accuracy === null) ? null : Dan.credit(accuracy, dan.bar, dan.side, dan.keys);
		const bestCredit = (bestAccuracy === null) ? null : Dan.credit(bestAccuracy, dan.bar, dan.side, dan.keys);

		const value = (credit === null) ? low : Dan.creditedDan(dan.raw, credit, dan.ladder);
		const best = (bestCredit === null) ? low : Dan.creditedDan(dan.raw, bestCredit, dan.ladder);

		const valuePoint = scaleValue(value, [low, high], [0, 1]);
		const predictPoint = scaleValue(best, [low, high], [0, 1]);
		const clearPoint = scaleValue(dan.raw, [low, high], [0, 1]);

		this.currentTimePoint = scaleValue(this.currentTime, [this.timeFrom, this.timeTo], [0, 1]);
		const currentPoint = this.currentTimePoint * this.chartWidth;
		const lastPoint = this.lastTimePoint * this.chartWidth;
		const currentY = this.CHART_PAD_VERT + chartRenderHeight - valuePoint * chartRenderHeight;
		const predictY = this.CHART_PAD_VERT + chartRenderHeight - predictPoint * chartRenderHeight;

		let points = [];

		if (this.points.length === 0) {
			this.points.push([this.currentTimePoint, valuePoint]);
			this.lastTimePoint = this.currentTimePoint;
			points = this.points;
		} else if (!this.isViewingResult && currentPoint - lastPoint >= this.STEP_PX) {
			this.points.push([this.currentTimePoint, valuePoint]);
			this.lastTimePoint = this.currentTimePoint;
			points = this.points;
		} else {
			points = [...this.points, [this.currentTimePoint, valuePoint]];
		}

		points = points.map(([x, y], index) => {
			const yPos = this.CHART_PAD_VERT + chartRenderHeight - y * chartRenderHeight;

			if (index == 0)
				return `M ${x * this.chartWidth} ${yPos}`;

			return `L ${x * this.chartWidth} ${yPos}`;
		});

		graph.cursor.style.transform = `translateX(${currentPoint}px)`;

		this.chartLine.setAttribute("d", points.join(" "));
		this.chartArea.setAttribute("d", points.concat([
			`L ${currentPoint} ${this.chartHeight}`,
			`L 0 ${this.chartHeight}`,
			"Z"
		]).join(" "));

		this.chartDot.setAttribute("cx", currentPoint);
		this.chartDot.setAttribute("cy", currentY);

		this.chartPredictLine.setAttribute("x1", currentPoint);
		this.chartPredictLine.setAttribute("y1", currentY);
		this.chartPredictLine.setAttribute("x2", this.chartWidth);
		this.chartPredictLine.setAttribute("y2", predictY);
		this.chartPredictLine.style.strokeDashoffset = currentPoint;

		graph.values.clear.style.transform = `translateY(${this.chartHeight - clearPoint * this.chartHeight}px)`;
		graph.values.clear.value.innerText = dan.label || Dan.format(dan.ladder, dan.raw).text;

		const person = this.playerDan(dan.side);

		if (person && person.rawDan >= low && person.rawDan <= high) {
			const personPoint = scaleValue(person.rawDan, [low, high], [0, 1]);
			graph.values.person.style.display = null;
			graph.values.person.style.transform = `translateY(${this.chartHeight - personPoint * this.chartHeight}px)`;
			graph.values.person.value.innerText = person.label;
		} else {
			graph.values.person.style.display = "none";
		}

		if (bestCredit === null || best <= value) {
			graph.values.achievable.style.display = "none";
		} else {
			graph.values.achievable.style.display = null;
			graph.values.achievable.style.transform = `translateY(${this.chartHeight - predictPoint * this.chartHeight}px)`;
			graph.values.achievable.value.innerText = Dan.format(dan.ladder, best).text;
		}

		this.danTrend.addValue(value);
		this.renderHeadLive(dan, value, credit, accuracy);

		if (accuracy !== this.curveAccuracy) {
			this.curveAccuracy = accuracy;
			this.drawCurve();
		}

		this.renderedTime = this.currentTime;
	},

	/**
	 * @param	{object}	dan
	 * @param	{number}	value
	 * @param	{?number}	credit
	 * @param	{?number}	accuracy
	 */
	renderHeadLive(dan, value, credit, accuracy) {
		const head = this.container.body.head;
		const label = Dan.format(dan.ladder, value);

		this.container.classList.toggle("below-bar", credit === null);

		const rising = (value >= (this.shownDan || 0));
		this.shownDan = value;

		head.main.valueNode.innerText = (credit === null) ? "---" : label.text;
		head.main.valueNode.dataset.suffix = (credit === null) ? "" : label.suffix;
		this.rawValue.set((credit === null) ? NaN : value);
		this.rollBadge(dan.ladder, (credit === null) ? null : label.text, (rising) ? "up" : "down");

		head.main.caption.innerText = (dan.vibro)
			? "vibro charts earn no credit"
			: (accuracy === null)
				? ""
				: `${round(accuracy * 100, 2).toFixed(2)}%  ·  ${(credit === null) ? "no credit" : `${(credit >= 0) ? "+" : ""}${round(credit, 2).toFixed(2)}`}`;

		const chip = (dan.vibro)
			? "vibro"
			: (credit === null)
				? "under the bar"
				: (this.map.stale) ? "offline" : "";

		head.meta.chip.innerText = chip;
		head.meta.chip.classList.toggle("show", chip.length > 0);
	}
}
