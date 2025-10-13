
const PPPanel = {
	STEP_PX: 4,
	CHART_PAD_VERT: 2,

	/** @type {TreeDOM} */
	container: null,

	/** @type {SmoothValue} */
	ppValue: undefined,

	/** @type {TrendCalculator} */
	ppTrend: undefined,

	/** @type {SmoothNumber} */
	ppTrendNumber: null,

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
	chartArea: undefined,

	/** @type {{ [name: string]: SVGLineElement }} */
	chartGuides: {},

	/** @type {SVGPathElement} */
	chartLine: undefined,

	/** @type {SVGCircleElement} */
	chartDot: undefined,

	/** @type {SVGLineElement} */
	chartPredictLine: undefined,

	currentTime: 0,
	renderedTime: 0,
	renderTask: null,
	lastTimePoint: 0,
	currentTimePoint: 0,
	timeFrom: 0,
	timeTo: 0,
	points: [[0, 0]],
	accuracy: { 100: 0 },
	current100Hits: null,
	current50Hits: null,
	currentMissHits: null,
	isPlaying: false,
	isViewingResult: false,
	shouldDisplayGraph: false,

	chartWidth: 0,
	chartHeight: 0,
	showing: false,

	alwaysVisible: false,
	displayOnResultScreen: false,
	transparent: true,

	init({
		alwaysVisible = false,
		transparent = true
	} = {}) {
		this.alwaysVisible = alwaysVisible;
		this.transparent = transparent;

		this.ppValue = new SmoothValue({
			classes: ["value"],
			duration: 0.2,
			decimal: 2
		});

		this.chart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		this.chart.classList.add("chart");

		this.chartDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
		this.chart.appendChild(this.chartDefs);

		this.chartGradientFrom = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		this.chartGradientFrom.offset.baseVal = 0;
		this.chartGradientFrom.style.stopColor = "#ffffff";
		this.chartGradientFrom.style.stopOpacity = 0;

		this.chartGradientTo = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		this.chartGradientTo.offset.baseVal = 1;
		this.chartGradientTo.style.stopColor = "#ffffff";
		this.chartGradientTo.style.stopOpacity = 0.8;

		this.chartGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
		this.chartGradient.id = "pp-gradient";
		this.chartGradient.setAttribute("gradientUnits", "userSpaceOnUse");
		this.chartGradient.append(this.chartGradientFrom, this.chartGradientTo);
		this.chartDefs.appendChild(this.chartGradient);

		this.chartArea = document.createElementNS("http://www.w3.org/2000/svg", "path");
		this.chartArea.classList.add("area");
		this.chartArea.style.fill = "url(#pp-gradient)";
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

		this.container = makeTree("div", ["counter-panel", "pp-panel"], {
			labelNode: { tag: "div", class: "label", text: "pp" },
			valueNode: this.ppValue,

			info: { tag: "div", class: ["info", "show"], child: {
				accuracy: { tag: "div", class: ["item", "accuracy"], child: {
					label: { tag: "div", class: "label", text: "accuracy" },
					items: { tag: "div", class: "items" }
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
					max: { tag: "div", class: ["value", "max"], text: "0" },
					half: { tag: "div", class: ["value", "half"], text: "0" },
					fc: { tag: "div", class: ["item", "fc"], child: {
						line: { tag: "span", class: "line" },
						value: { tag: "span", class: "value" }
					}},
					achievable: { tag: "div", class: ["item", "achievable"], child: {
						value: { tag: "span", class: "value" }
					}}
				}},

				markers: { tag: "div", class: "markers" },

				legends: { tag: "div", class: "legends", child: {
					l100: { tag: "div", class: ["legend", "l100"], text: 100 },
					l50: { tag: "div", class: ["legend", "l50"], text: 50 },
					lmiss: { tag: "div", class: ["legend", "lmiss"], text: "miss" },
					ppfc: { tag: "div", class: ["legend", "ppfc"], text: "pp if fc" },
					ppacv: { tag: "div", class: ["legend", "ppacv"], text: "max achievable pp" },
				}},

				cursor: { tag: "div", class: "cursor" }
			}}
		});

		this.container.style.setProperty("--vert-space", this.CHART_PAD_VERT + "px");
		(new ResizeObserver(() => this.updateSize())).observe(this.container.graph);

		this.ppTrend = new TrendCalculator(1000);

		this.ppTrendNumber = new SmoothNumber((value) => {
			const prog = Math.min(Math.abs(value) / 5, 1);

			if (value > 0) {
				this.container.graph.delta.down.style.height = `0%`;
				this.container.graph.delta.up.style.height = `${(prog / 2) * 100}%`;
			} else {
				this.container.graph.delta.down.style.height = `${(prog / 2) * 100}%`;
				this.container.graph.delta.up.style.height = `0%`;
			}
		}, { duration: 0.2 });

		app.subscribe("currentTime", (value) => {
			this.currentTime = value;
			this.requestRender();
		}, "precise");

		app.subscribe("beatmap.time.firstObject", (value) => {
			this.timeFrom = value;
		});

		app.subscribe("beatmap.time.lastObject", (value) => {
			this.timeTo = value;
		});

		app.subscribe("play.pp", () => this.updatePPValue());

		let prevTrend = 0;
		setInterval(() => {
			const trend = this.ppTrend.getTrend();

			if (trend == prevTrend)
				return;

			prevTrend = trend;
			this.ppTrendNumber.value = trend;
		}, 100);

		app.subscribe("performance.accuracy", (value) => {
			this.accuracy = value;

			if (!this.isPlaying)
				this.ppValue.value = this.accuracy[100] || 0;

			this.updateAccuracyGuides();
			this.requestRender();
		});

		app.subscribe("play.hits", ({ "0": miss, "50": h50, "100": h100 }) => {
			if (this.current100Hits === null) {
				this.current100Hits = h100;
				this.current50Hits = h50;
				this.currentMissHits = miss;
				emptyNode(this.container.graph.markers);
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
		});

		if (this.transparent)
			this.container.classList.add("do-transparent");

		if (this.alwaysVisible) {
			this.container.classList.add("display", "show");

			if (this.transparent)
				this.container.classList.add("transparent");
		}

		app.subscribe("play.playerName", () => this.updateDisplayState());
		app.subscribe("resultsScreen.playerName", () => this.updateDisplayState());
		app.subscribe("resultsScreen.pp.current", () => this.updatePPValue());

		this.color = "#4db8ff";
		this.updateSize();
		this.updatePlayingState();
	},

	/**
	 * Set the accent color of the counter.
	 * 
	 * @param	{string}	color
	 */
	set color(color) {
		this.chartGradientFrom.style.stopColor = color;
		this.chartGradientTo.style.stopColor = color;
		this.container.style.setProperty("--accent-color", color);
	},

	updateDisplayState() {
		const isPlaying = app.get("play.playerName", "").length > 0;
		const isViewingResult = app.get("resultsScreen.playerName", "").length > 0;

		this.container.classList.toggle("showing-result", isViewingResult);
		this.isPlaying = isPlaying;
		this.isViewingResult = isViewingResult;

		const shouldDisplay = (this.displayOnResultScreen)
			? isPlaying
			: (isPlaying && !isViewingResult);

		this.shouldDisplayGraph = shouldDisplay;

		if (shouldDisplay) {
			this.show();
			this.updatePlayingState();
			return;
		}

		this.hide();
		this.updatePlayingState();
	},

	settings({
		label = "pp",
		accentColor = "#4db8ff",
		alwaysDisplay = false,
		displayOnResultScreen = false,
		disableBackground = false,
		backgroundColor = "#212121",
		backgroundOpacity = 20,
		resultBackgroundOpacity = 60,
		borderRadius = 0.5
	}) {
		this.container.labelNode.innerText = label;
		this.container.style.setProperty("--background-rgb", hexToRgb(backgroundColor).join(", "));
		this.color = accentColor;

		if (alwaysDisplay) {
			this.show();
			this.alwaysVisible = true;
		} else {
			this.alwaysVisible = false;
			this.updateDisplayState();
		}

		this.displayOnResultScreen = displayOnResultScreen;
		this.container.style.setProperty("--transaprent-opacity", backgroundOpacity / 100);
		this.container.style.setProperty("--result-opacity", resultBackgroundOpacity / 100);
		this.container.style.setProperty("--border-radius", `${borderRadius}rem`);
		this.container.classList.toggle("full-transparent", disableBackground);
	},

	async show() {
		if (this.showing || this.alwaysVisible)
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
		this.chartWidth = this.container.graph.clientWidth;
		this.chartHeight = this.container.graph.clientHeight + this.CHART_PAD_VERT * 2;
		this.chart.style.top = `-${this.CHART_PAD_VERT}px`;
		this.chart.setAttribute("width", this.chartWidth);
		this.chart.setAttribute("height", this.chartHeight);
		this.chartGradient.setAttribute("x1", 0);
		this.chartGradient.setAttribute("y1", this.chartHeight);
		this.chartGradient.setAttribute("x2", 0);
		this.chartGradient.setAttribute("y2", 0);

		this.updateAccuracyGuides();
		this.requestRender();
	},

	async updatePlayingState() {
		const isGraphShowing = this.container.graph.classList.contains("show");

		if (this.shouldDisplayGraph != isGraphShowing) {
			if (isGraphShowing) {
				this.container.graph.classList.add("hide");
				this.container.info.classList.add("show");
				await delayAsync(500);
				this.container.graph.classList.remove("show", "hide");
			} else {
				this.container.graph.classList.add("show");
				this.container.info.classList.add("hide");
				await delayAsync(500);
				this.container.info.classList.remove("show", "hide");
			}
		}

		this.updatePPValue();
	},

	updatePPValue() {
		if (!osuHasHit()) {
			this.ppTrend.clear();
		}

		if (this.isViewingResult) {
			this.ppValue.value = app.get("resultsScreen.pp.current");
			return;
		}

		if (!this.isPlaying) {
			this.ppValue.value = this.accuracy[100] || 0;
			return;
		}

		const current = app.get("play.pp.current", 0);
		this.ppValue.value = current;
		this.ppTrend.addValue(current);
	},

	updateAccuracyGuides() {
		const infoItems = this.container.info.accuracy.items;
		const maxPP = this.accuracy[100] || 0;
		const step = 2;
		const keys = Object.keys(this.accuracy).sort((a, b) => parseInt(b) - parseInt(a));

		for (const name of keys) {
			const value = this.accuracy[name];

			if (!infoItems[name]) {
				infoItems[name] = makeTree("div", "item", {
					label: { tag: "div", class: "label", text: name + "%" },
					value: { tag: "div", class: "value", text: round(value, 2) + "pp" }
				});

				infoItems.appendChild(infoItems[name]);
			} else {
				infoItems[name].value.innerText = round(value, 2) + "pp";
			}

			if (name % step > 0)
				continue;

			// Disable 100% guide line for now since I don't have
			// any good idea how to display it properly.
			if (name == 100)
				continue;

			const useGuide = (name == 100);

			if (!this.chartGuides[name]) {
				if (useGuide) {
					const line = document.createElement("div");
					line.classList.add("guide", "accuracy", `a${name}`);
					this.container.graph.guides.appendChild(line);
					this.chartGuides[name] = line;
				} else {
					const area = document.createElement("div");
					area.classList.add("area", "accuracy", `a${name}`);
					this.container.graph.guides.appendChild(area);
					this.chartGuides[name] = area;
				}

				this.chartGuides[name].style.opacity = Easing.InSine(scaleValue(name, [90, 100], [0.4, 1]));
			}

			if (!useGuide) {
				const nextValue = this.accuracy[parseInt(name) + step] || maxPP;
				const top = scaleValue(nextValue, [0, maxPP], [this.chartHeight, 0]);
				const height = scaleValue(Math.abs(nextValue - value), [0, maxPP], [0, this.chartHeight]);
				this.chartGuides[name].style.top = `${top}px`;
				this.chartGuides[name].style.height = `${height}px`;

				this.chartGuides[name].innerText = (height > 14)
					? name + "%"
					: "";
			} else {
				const y = scaleValue(value, [0, maxPP], [this.chartHeight, 0]);
				this.chartGuides[name].style.transform = `translateY(${y}px)`;
			}
		}
	},

	/**
	 * Add hit at current time.
	 * 
	 * @param	{"100" | "50" | "miss"}		type
	 */
	async addHit(type, amount = 1) {
		const left = scaleValue(this.currentTime, [this.timeFrom, this.timeTo], [0, 100]);

		const hit = document.createElement("div");
		hit.classList.add("hit", `h${type}`);
		hit.style.left = `${left}%`;
		this.container.graph.markers.appendChild(hit);

		if (type == "miss") {
			const hitThin = document.createElement("div");
			hitThin.classList.add("hit", `h${type}`, "thin-line");
			hitThin.style.left = `${left}%`;
			this.container.graph.markers.appendChild(hitThin);

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
		this.points = [[0, 0]];
		this.currentTimePoint = 0;
		this.lastTimePoint = 0;
		emptyNode(this.container.graph.markers);
		this.current100Hits = null;
		this.current50Hits = null;
		this.currentMissHits = null;
		this.ppTrend.clear();
		this.ppTrendNumber.value = 0;
		this.ppValue.value = 0;
	},

	render() {
		if (this.timeTo <= 0 || !this.isPlaying)
			return;

		if ((this.currentTime < this.timeFrom || this.currentTime < this.renderedTime) && this.lastTimePoint > 0)
			this.reset();

		// == CALCULATE ==

		const chartRenderHeight = this.chartHeight - this.CHART_PAD_VERT * 2;

		const { current, fc, maxAchievable, maxAchieved } = app.get("play.pp", { current: 0, fc: 0, maxAchievable: 0, maxAchieved: 0 });
		const maxPP = this.accuracy[100] || 0;
		const valuePoint = scaleValue(current, [0, maxPP], [0, 1]);
		const predictPoint = scaleValue((maxAchievable > 0) ? maxAchievable : maxPP, [0, maxPP], [0, 1]);
		const fcPoint = scaleValue(fc, [0, maxPP], [0, 1]);

		this.currentTimePoint = scaleValue(this.currentTime, [this.timeFrom, this.timeTo], [0, 1]);
		const currentPoint = this.currentTimePoint * this.chartWidth;
		const lastPoint = this.lastTimePoint * this.chartWidth;
		const currentY = this.CHART_PAD_VERT + chartRenderHeight - valuePoint * chartRenderHeight;
		const predictY = this.CHART_PAD_VERT + chartRenderHeight - predictPoint * chartRenderHeight;

		let points = [];

		if (currentPoint - lastPoint >= this.STEP_PX) {
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

		// == UPDATE ==

		this.container.graph.cursor.style.transform = `translateX(${currentPoint}px)`;

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

		this.container.graph.values.max.innerText = round(maxPP, 2);
		this.container.graph.values.half.innerText = round(maxPP / 2, 2);
		this.container.graph.values.fc.style.transform = `translateY(${this.chartHeight - fcPoint * this.chartHeight}px)`;
		this.container.graph.values.fc.value.innerText = (fc > 0) ? round(fc, 1) : "0";

		if (!maxAchievable || maxAchievable <= 0) {
			this.container.graph.values.achievable.style.display = "none";
		} else {
			this.container.graph.values.achievable.style.display = null;
			this.container.graph.values.achievable.style.transform = `translateY(${this.chartHeight - predictPoint * this.chartHeight}px)`;
			this.container.graph.values.achievable.value.innerText = (maxAchievable > 0) ? round(maxAchievable, 1) : "0";
		}

		this.renderedTime = this.currentTime;
	}
}
