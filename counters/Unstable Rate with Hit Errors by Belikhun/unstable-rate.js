
const UnstableRatePanel = {
	BAR_WIDTH: 2,
	BAR_SPACE: 2,

	/** @type {TreeDOM} */
	container: null,
	
	/** @type {HTMLDivElement} */
	barContainer: null,
	
	indicators: {
		/** @type {HTMLDivElement} */
		center: null,

		/** @type {HTMLDivElement} */
		avg: null
	},
	
	/** @type {HTMLDivElement} */
	hitContainer: null,
	
	/** @type {HTMLDivElement} */
	hintContainer: null,
	
	debug: {
		/** @type {HTMLSpanElement} */
		ms: null,

		/** @type {HTMLSpanElement} */
		delta: null,

		/** @type {HTMLSpanElement} */
		deviance: null,

		/** @type {HTMLSpanElement} */
		updates: null,

		/** @type {HTMLSpanElement} */
		index: null,

		/** @type {HTMLSpanElement} */
		step: null,

		/** @type {HTMLSpanElement} */
		max: null
	},
	
	od: 6,
	hitMs: { hit300: 0, hit100: 0, hit50: 0 },
	cWidth: 0,
	vWidth: 0,
	repeatedZero: 0,
	zeroHitCount: 0,
	nonZeroHitCount: 0,

	/** @type {SmoothValue} */
	urValue: undefined,

	/** @type {MovingAverage} */
	hitAvg: undefined,

	/** @type {StandardDeviationCalculator} */
	unstableRate: undefined,

	/**
	 * @typedef		BarObject
	 * @type		{Object}
	 * @property	{HTMLDivElement}	bar
	 * @property	{Number}			ms
	 * @property	{Number}			value
	 * @property	{Number}			height
	 * @property	{Number}			from
	 * @property	{Number}			to
	 * @property	{Boolean}			updated
	 */
	
	/** @type {BarObject[]} */
	bars: [],
	index: 0,
	max: 0,
	msDelta: 0,
	step: 5,
	angBarHideTimeout: null,
	liveUrAvailable: false,
	showing: false,

	alwaysVisible: false,
	transparent: true,

	init({
		alwaysVisible = false,
		transparent = true
	} = {}) {
		this.alwaysVisible = alwaysVisible;
		this.transparent = transparent;

		this.hitAvg = new MovingAverage(15);
		this.unstableRate = new StandardDeviationCalculator();
		this.urValue = new SmoothValue({
			classes: ["value"],
			duration: 0.2,
			decimal: 2
		});

		this.container = makeTree("div", ["counter-panel", "unstable-rate-panel"], {
			labelNode: { tag: "div", class: "label", text: "unstable rate" },
			valueNode: this.urValue,

			chart: { tag: "div", class: "hit-error-chart", child: {
				bars: { tag: "div", class: "bars" },
				indicators: { tag: "div", class: "indicators", child: {
					center: { tag: "div", class: "center" },
					avg: { tag: "div", class: "avg", html: `
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">
							<path stroke="none" d="M9.7321 13.7942A2 2 0 0 1 6.2679 13.7942L0.7321 4.2058A2 2 0 0 1 2.4641 1.2058L13.5359 1.2058A2 2 0 0 1 15.2679 4.2058"></path>
						</svg>` }
				}},

				hits: { tag: "div", class: "hits" },
				hints: { tag: "div", class: "hints" },

				debugs: { tag: "div", class: "debugs", child: {
					left: { tag: "div", class: "left", child: {
						ms: { tag: "span", class: "ms", text: "---" },
						delta: { tag: "span", class: "delta", text: "Δ 0" },
						deviance: { tag: "span", class: "deviance", text: "δ 0" },
						updates: { tag: "span", class: "updates", text: "U 0" },
						index: { tag: "span", class: "index", text: "I 0" }
					}},

					right: { tag: "div", class: "right", child: {
						step: { tag: "span", class: "step", text: "0 STP" },
						max: { tag: "span", class: "max", text: "0 MAX" }
					}}
				}}
			}}
		});

		this.barContainer = this.container.chart.bars;
		this.indicators = this.container.chart.indicators;
		this.hitContainer = this.container.chart.hits;
		this.hintContainer = this.container.chart.hints;
		this.debug.ms = this.container.chart.debugs.left.ms;
		this.debug.delta = this.container.chart.debugs.left.delta;
		this.debug.deviance = this.container.chart.debugs.left.deviance;
		this.debug.updates = this.container.chart.debugs.left.updates;
		this.debug.index = this.container.chart.debugs.left.index;
		this.debug.step = this.container.chart.debugs.right.step;
		this.debug.max = this.container.chart.debugs.right.max;

		(new ResizeObserver(() => {
			this.updateOD(this.od, true);
		})).observe(this.container);

		this.updateOD(this.od, true);

		app.subscribe("play.unstableRate", (value) => {
			if (value)
				this.liveUrAvailable = true;

			this.urValue.set(value);
		});

		app.subscribe("beatmap.stats.od.converted", (value) => {
			this.updateOD(value);
		});

		app.subscribe("hitErrors", (value) => {
			this.updateHits(value);
		}, "precise");

		// app.subscribe("beatmap.time.live", (value) => {
		// 	if (value > 100 && app.get("state.name") == "play") {
		// 		this.show();
		// 		return;
		// 	}

		// 	this.hide();
		// });

		app.subscribe("play.playerName", (value) => {
			if (value && value.length > 0) {
				this.show();
				return;
			}

			this.hide();
		});

		if (this.transparent)
			this.container.classList.add("do-transparent");

		if (this.alwaysVisible) {
			this.container.classList.add("display", "show");

			if (this.transparent)
				this.container.classList.add("transparent");
		}
	},

	settings({
		label = "unstable rate",
		alwaysDisplay = false,
		disableBackground = false,
		backgroundColor = "#212121",
		backgroundOpacity = 20,
		borderRadius = 0.5,
		declutter = false
	}) {
		this.container.labelNode.innerText = label;
		this.container.style.setProperty("--background-rgb", hexToRgb(backgroundColor).join(", "));

		if (alwaysDisplay) {
			this.show();
			this.alwaysVisible = true;
		} else {
			this.alwaysVisible = false;

			// Determine current state and update panel visibility accordingly.
			const playerName = app.get("play.playerName");

			if (playerName && playerName.length > 0) {
				this.show();
			} else {
				this.hide();
			}
		}

		this.container.style.setProperty("--transaprent-opacity", backgroundOpacity / 100);
		this.container.style.setProperty("--border-radius", `${borderRadius}rem`);
		this.container.classList.toggle("declutter", declutter);
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

	/**
	 * Update OD and redraw all bars
	 * 
	 * @param {number}	od
	 */
	updateOD(od, force = false) {
		if (od === this.od && !force)
			return;

		this.od = od;
		console.log("new od", od);

		if (!this.container)
			return;

		this.hardReset();

		this.hitMs = odToMs(od, app.get("beatmap.mode.name"));
		this.vWidth = this.hitMs.hit50 * 2;
		const bars = Math.floor((this.cWidth - this.BAR_SPACE) / (this.BAR_WIDTH + this.BAR_SPACE)) + 1;

		this.msDelta = this.vWidth / bars;
		this.debug.delta.innerText = `Δ ` + this.msDelta.toFixed(3) + "ms";
		this.debug.ms.innerHTML = [
			`<span class="bl">${this.hitMs.hit300.toFixed(1)}</span>`,
			`<span class="gr">${this.hitMs.hit100.toFixed(1)}</span>`,
			`<span class="ye">${this.hitMs.hit50.toFixed(1)}</span>`
		].join("/");

		for (let i = 0; i < bars; i++) {
			const bar = document.createElement("div");
			const left = i * (this.BAR_WIDTH + this.BAR_SPACE);
			const msScale = scaleValue(left, [0, this.cWidth], [-(this.vWidth / 2), (this.vWidth / 2)]);

			let color = "blue";
			if (this.hitMs.hit100 < Math.abs(msScale)) {
				color = "yellow";
			} else if (this.hitMs.hit300 < Math.abs(msScale)) {
				color = "green";
			}

			bar.style.width = this.BAR_WIDTH + "px";
			bar.style.left = left + "px";
			bar.dataset.ms = msScale;
			bar.dataset.color = color;

			this.bars.push({
				bar,
				ms: msScale,
				value: 0,
				height: 0,
				from: msScale - (this.msDelta / 2),
				to: msScale + (this.msDelta / 2),
				updated: false
			});

			this.barContainer.appendChild(bar);
		}

		emptyNode(this.hintContainer);
		let hints = [-120, -90, -60, -30, 0, 30, 60, 90, 120]

		for (let i = 0; i < hints.length; i++) {
			const hint = hints[i];
			const hintItem = document.createElement("span");
			const left = scaleValue(hint, [-(this.vWidth / 2), (this.vWidth / 2)], [0, this.cWidth]);

			hintItem.innerText = (hint > 0) ? `+${hint}` : hint;
			hintItem.style.left = left + "px";
			hintItem.dataset.level = Math.abs(i - ((hints.length - 1) / 2));
			this.hintContainer.appendChild(hintItem);

			if (hint == 0)
				this.indicators.center.style.left = left + "px";
		}

		console.log({ width: this.vWidth, bars, msDelta: this.msDelta, ms: this.hitMs });
	},

	hardReset() {
		emptyNode(this.barContainer);
		this.bars = Array();
		this.index = 0;
		this.max = 0;
		this.cWidth = this.container.chart.clientWidth;
		this.reset();
	},

	reset(hard = false) {
		for (let bar of this.bars) {
			bar.value = 0;
			bar.height = 0;
			bar.updated = false;
		}

		this.max = 0;
		this.index = 0;
		this.repeatedZero = 0;
		this.zeroHitCount = 0;
		this.nonZeroHitCount = 0;
		this.hitAvg.clear();
		this.unstableRate.clear();
		this.urValue.set(0);
		this.updateAverage();
	},

	render() {
		let step = Math.floor((this.max / 10) + 1) * 10;
		let updateAll = false;

		if (step !== this.step) {
			console.log("step", step, this.max);
			updateAll = true;
		}

		// Update bars
		let updated = 0;
		for (let bar of this.bars) {
			if (bar.updated && !updateAll)
				continue;
			
			bar.height = bar.value / step;
			bar.bar.style.height = `${bar.height * 100}%`;
			bar.updated = true;
			updated++;
		}

		this.debug.updates.innerText = `U ${updated}`;
		this.debug.index.innerText = `I ${this.index}`;
		this.debug.step.innerText = `${step} STP`;
		this.debug.max.innerText = `${this.max.toFixed(3)} MAX`;

		if (!this.liveUrAvailable)
			this.urValue.set(this.unstableRate.getStandardDeviation() * 10);

		this.updateAverage();
		this.step = step;
	},

	updateAverage() {
		const avg = this.hitAvg.getAverage();
		let avgLeft = scaleValue(avg, [-(this.vWidth / 2), (this.vWidth / 2)], [0, this.cWidth]);
		this.indicators.avg.style.left = avgLeft + "px";
		this.debug.deviance.innerText = `δ ` + avg.toFixed(3) + "ms";
		this.indicators.avg.classList.remove("hide");

		clearTimeout(this.angBarHideTimeout);
		this.angBarHideTimeout = setTimeout(() => {
			this.indicators.avg.classList.add("hide");
		}, 3000);
	},

	async visualizeHit(hit) {
		const hitNode = document.createElement("span");
		let left = scaleValue(hit, [-(this.vWidth / 2), (this.vWidth / 2)], [0, this.cWidth]);
		hitNode.style.left = left + "px";

		let color = "blue";
		if (this.hitMs.hit100 < Math.abs(hit)) {
			color = "yellow";
		} else if (this.hitMs.hit300 < Math.abs(hit)) {
			color = "green";
		}

		hitNode.dataset.color = color;
		this.hitContainer.appendChild(hitNode);

		await delayAsync(100);
		hitNode.classList.add("decay");
		await delayAsync(1000);
		hitNode.classList.add("hide");
		await delayAsync(500);
		this.hitContainer.removeChild(hitNode);
	},

	/**
	 * Update hits
	 * 
	 * @param	{number[]}	hits
	 */
	updateHits(hits) {
		if ((hits.length - 1 === this.index) || this.bars.length === 0)
			return;

		// This indicate an map restart/replay. Reset all hits.
		if (hits.length - 1 < this.index)
			this.reset();

		let newHits = hits.slice(this.index);
		this.index = hits.length - 1;

		for (let hit of newHits) {
			if (hit == 0) {
				// Too many zero hits, might be slider end.
				// TODO: pre-calculate amount of slider ends so we know how many we need to reject.
				if (this.nonZeroHitCount > 0 && (this.zeroHitCount / this.nonZeroHitCount) > 0.02)
					continue;

				this.zeroHitCount += 1;
				this.repeatedZero += 1;

				if (this.repeatedZero > 1) {
					console.log("zero combo", this.repeatedZero);
					continue;
				}
			} else {
				this.nonZeroHitCount += 1;
				this.repeatedZero = 0;
			}

			this.hitAvg.addNumber(hit);

			if (!this.liveUrAvailable)
				this.unstableRate.addNumber(hit);

			if (newHits.length < 10)
				this.visualizeHit(hit);

			for (let [i, bar] of this.bars.entries()) {
				if (hit <= bar.ms) {
					let pbar = this.bars[i - 1];

					if (!pbar) {
						bar.value += 1;
						bar.updated = false;

						if (bar.value > this.max)
							this.max = max;

						break;
					}

					let bInc = (1 - (Math.abs(hit - bar.ms) / this.msDelta));
					let nbInc = (1 - (Math.abs(hit - pbar.ms) / this.msDelta));

					bar.value += bInc;
					pbar.value += nbInc;
					bar.updated = false;
					pbar.updated = false;

					this.max = Math.max(this.max, bar.value, pbar.value);
					break;
				}
			}
		}

		this.render();
	}
}
