
const RankAndAccuracyPanel = {
	/** @type {TreeDOM} */
	container: null,

	/** @type {SmoothNumber} */
	accNumber: null,
	
	/** @type {TrendCalculator} */
	accTrend: null,
	
	/** @type {SmoothNumber} */
	accTrendNumber: null,

	/** @type {SmoothNumber} */
	minAccNumber: null,

	showing: false,

	alwaysVisible: false,
	transparent: true,

	init({
		alwaysVisible = false,
		transparent = true
	} = {}) {
		this.alwaysVisible = alwaysVisible;
		this.transparent = transparent;
		
		this.container = makeTree("div", ["counter-panel", "rank-acc-panel", "big", "center", "grade"], {
			labelNode: { tag: "div", class: "label", text: "rank" },
			valueNode: { tag: "div", class: "value", text: "---" },

			progress: { tag: "div", class: "progBar", child: {
				current: { tag: "span", class: ["bar", "orange"] },
				real: { tag: "span", class: ["bar", "blue"] }
			}},

			delta: { tag: "div", class: ["deltaBar", "t5"], child: {
				left: { tag: "span", class: "left" },
				right: { tag: "span", class: "right" },
				labelCenter: { tag: "span", class: ["label", "c"], text: "0" },
				labelLeft: { tag: "span", class: ["label", "l"], text: "-0.5%" },
				labelRight: { tag: "span", class: ["label", "r"], text: "+0.5%" }
			}},

			space: { tag: "div", class: ["space", "large"] },
			right: { tag: "span", class: "right", child: {
				minLabel: { tag: "span", class: "minLabel", text: "min" },
				minAcc: { tag: "span", class: "minAcc", text: "0%" },
				separator: { tag: "span", class: "separator" },
				currentLabel: { tag: "span", class: "currentLabel", text: "avg" },
				currentAcc: { tag: "span", class: ["currentAcc", "big"], text: "0%" }
			}}
		});

		this.accNumber = new SmoothNumber((value) => {
			this.container.progress.current.style.width = `${value}%`;
			this.container.right.currentAcc.innerText = `${value.toFixed(2)}%`;
		}, { initial: 100 });

		this.minAccNumber = new SmoothNumber((value) => {
			this.container.progress.real.style.width = `${value}%`;
			this.container.right.minAcc.innerText = `${value.toFixed(2)}%`;
		}, { initial: 100 });

		this.accTrend = new TrendCalculator(1000);

		this.accTrendNumber = new SmoothNumber((value) => {
			const prog = Math.min(Math.abs(value) / 0.5, 1);

			if (value > 0) {
				this.container.delta.left.style.width = `0%`;
				this.container.delta.right.style.width = `${(prog / 2) * 100}%`;
			} else {
				this.container.delta.left.style.width = `${(prog / 2) * 100}%`;
				this.container.delta.right.style.width = `0%`;
			}
		}, { duration: 0.2 });

		app.subscribe("play.rank.current", (value) => {
			if (!osuHasHit()) {
				this.container.valueNode.innerText = "---";
				this.container.valueNode.dataset.color = "gray";
				return;
			}

			let color = "gray";

			if (value === "XX" || value === "X")
				color = "whitesmoke";
			else if (value === "SS" || value === "S")
				color = "yellow";
			else if (value === "A")
				color = "green";
			else if (value === "B")
				color = "blue";
			else if (value === "C" || value == "D")
				color = "red";

			this.container.valueNode.innerText = value;
			this.container.valueNode.dataset.color = color;
		});

		app.subscribe("play.accuracy", (value) => {
			if (!osuHasHit()) {
				this.accNumber.value = 100;
				this.minAccNumber.value = 0;
				this.accTrend.clear();
				return;
			}

			this.accNumber.value = value;
			this.minAccNumber.value = getMinAcc();
			this.accTrend.addValue(value);
		});

		let prevTrend = 0;
		setInterval(() => {
			const trend = this.accTrend.getTrend();

			if (trend == prevTrend)
				return;

			prevTrend = trend;
			this.accTrendNumber.value = trend;
		}, 100);

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
		label = "rank",
		alwaysDisplay = false,
		disableBackground = false,
		backgroundColor = "#212121",
		backgroundOpacity = 20,
		borderRadius = 0.5
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
		this.container.classList.toggle("full-transparent", disableBackground);
	},

	async show() {
		if (this.showing || this.alwaysVisible)
			return;

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
			return;

		this.showing = false;
		this.container.classList.remove("show");
		await delayAsync(500);
		this.container.classList.remove("display", "transparent");
	},
}
