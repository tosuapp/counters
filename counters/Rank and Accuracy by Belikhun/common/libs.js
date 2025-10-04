
function time(date) {
	if (date instanceof Date)
		return date.getTime() / 1000;

	return Date.now() / 1000;
}

function delayAsync(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(), time);
	});
}

function nextFrameAsync() {
	return new Promise((resolve, reject) => {
		requestAnimationFrame(() =>  resolve());
	});
}

/**
 * @typedef {"div" | "span" | "a" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "table" | "thead"
 * 			| "tbody" | "tr" | "th" | "td" | "input" | "img" | "video" | "audio" | "iframe" | "b"
 * 			| "canvas" | "code" | "em" | "footer" | "form" | "hr" | "i" | "label" | "ul" | "ol"
 * 			| "li" | "meta" | "nav" | "option" | "optgroup" | "param" | "picture" | "pre" | "q"
 * 			| "s" | "script" | "strong" | "style" | "svg" | "textarea"} MakeTreeHTMLTags
 */

/**
 * Object represent the DOM structure will be passed into `makeTree()`
 * @typedef {{
 * 	id: String
 * 	tag: MakeTreeHTMLTags
 * 	text: String
 * 	html: String
 * 	for: String
 * 	data: Object<string, string>
 * 	attribute: Object<string, string>
 * 	class: string | string[]
 * 	child: Object<string, TreeObject>
 *	src: String
 * 	href: String
 * }} TreeObject
 */

/**
 * Object represent structure returned by `makeTree()`
 * @typedef {{
 * 	[x: string]: TreeDOM
 * } & HTMLElement & HTMLInputElement} TreeDOM
 */

/**
 * Make DOM tree quickly with javascript object...
 *
 * @param	{String}						tag			Tag Name
 * @param	{String|String[]}				classes		Classes
 * @param	{Object<string, TreeObject>}	child		Child List
 * @param	{String}						path		Path (optional)
 * @returns	{TreeDOM}
 */
function makeTree(tag, classes, child = {}, path = "") {
	let container = document.createElement(tag);

	switch (typeof classes) {
		case "string":
			container.classList.add(classes);
			break;

		case "object":
			if (classes.length && classes.length > 0)
				container.classList.add(...classes);
			else
				throw { code: -1, description: `makeTree(${path}): Invalid or empty "classes" type: ${typeof classes}` }

			break;
	}

	// If child list is invalid, we can just stop parsing
	// now
	if (typeof child !== "object")
		return container;

	let keys = Object.keys(child);

	for (let key of keys) {
		if (typeof child[key] !== "object" || child[key] === null || child[key] === undefined)
			continue;

		let item = child[key];
		let currentPath = (path === "")
			? key
			: `${path}.${key}`

		if (typeof container[key] !== "undefined")
			throw { code: -1, description: `makeTree(${currentPath}): Illegal key name: "${key}"` }

		/**
		 * If node key is defined and is an object, this is
		 * possibility a custom element data
		 *
		 * Example: `createInput()`
		 */
		let customNode;

		try {
			customNode = (item.group && item.group.classList)
				? item.group
				: (item.container && item.container.classList)
					? item.container
					: (item.classList)
						? item
						: null;
		} catch(e) {
			throw { code: -1, description: `makeTree(${currentPath}): Custom node parse failed!`, data: e }
		}

		if (customNode) {
			customNode.setAttribute("key", key);
			customNode.dataset.path = currentPath;
			container.appendChild(customNode);
			container[key] = item;

			continue;
		}

		// Normal Building
		if (typeof item.tag !== "string")
			throw { code: -1, description: `makeTree(${currentPath}): Invalid or undefined "tag" value` }

		/** @type {HTMLElement} */
		let node = makeTree(item.tag, item.class, item.child, currentPath);
		node.dataset.path = currentPath;

		if (typeof item.html !== "undefined")
			node.innerHTML = item.html;

		if (typeof item.text !== "undefined")
			node.innerText = item.text;

		if (typeof item.for === "string")
			node.htmlFor = item.for;

		if (typeof item.data === "object") {
			for (let key of Object.keys(item.data))
				node.dataset[key] = item.data[key];
		}

		if (typeof item.attribute === "object") {
			for (let key of Object.keys(item.attribute))
				node.setAttribute(key, item.attribute[key]);
		}

		// Special rule for icon tag
		if (item.tag === "icon" && typeof item.icon === "string") {
			node.dataset.icon = item.icon;

			if (typeof item.style === "string")
				node.classList.add(`style-${item.style}`);
		}

		for (let key of Object.keys(item)) {
			if (!["tag", "class", "child", "html", "for", "text", "data", "attribute"].includes(key) && typeof node[key] !== "undefined")
				node[key] = item[key];
		}

		node.setAttribute("key", key);
		container.appendChild(node);
		container[key] = node;
	}

	return container;
}

const Easing = {
	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	Linear: t => t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InSine: t => 1 - Math.cos((t * Math.PI) / 2),

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	OutSine: t => Math.sin((t * Math.PI) / 2),

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InQuad: t => t*t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	OutQuad: t => t*(2-t),

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InOutQuad: t => (t < .5) ? 2*t*t : -1+(4-2*t)*t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InCubic: t => t*t*t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	OutCubic: t => (--t)*t*t+1,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InOutCubic: t => (t < .5) ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	OutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InOutExpo: t => t === 0
				? 0
				: t === 1
					? 1
					: t < 0.5
						? Math.pow(2, 20 * t - 10) / 2
						: (2 - Math.pow(2, -20 * t + 10)) / 2,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InQuart: t => t*t*t*t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	OutQuart: t => 1-(--t)*t*t*t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InOutQuart: t => (t < .5) ? 8*t*t*t*t : 1-8*(--t)*t*t*t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InQuint: t => t*t*t*t*t,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	OutQuint: t => 1 - Math.pow(1 - t, 5),

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InOutQuint: t => (t < 0.5) ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	InElastic: t => {
		const c4 = (2 * Math.PI) / 3;

		return t === 0
			? 0
			: t === 1
				? 1
				: -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
	},

	/**
	 * @param	{Number}	t	Point [0, 1]
	 * @return	{Number}		Point [0, 1]
	 */
	OutElastic: t => {
		const c4 = (2 * Math.PI) / 3;

		return t === 0
			? 0
			: t === 1
				? 1
				: Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
	}
}

class Animator {
	/**
	 * Animate a value
	 *
	 * @param	{Number}		duration 			Animation Duration in Seconds
	 * @param	{Function}		timingFunction 		Animation Timing Function
	 * @param	{Function}		animate 			Function To Handle Animation
	 */
	constructor(duration, timingFunction, animate) {
		if (duration < 0) {
			clog("WARN", `Animator(): duration is a negative number! (${duration}s). This animation will be completed instantly.`);

			animate(1);
			return;
		}

		this.duration = duration * 1000;
		this.timingFunction = timingFunction;
		this.animate = animate;
		this.completed = false;
		this.cancelled = false;

		/** @type {Function[]} */
		this.completeHandlers = []

		this.start = performance.now();
		this.animationFrameID = requestAnimationFrame(() => this.update());
	}

	update() {
		if (this.completed || this.cancelled)
			return;

		let tPoint = (performance.now() - this.start) / this.duration;

		// Safe executing update function to prevent stopping
		// animation entirely
		try {
			if (this.animate(Math.min(this.timingFunction(tPoint), 1)) === false)
				// Stop Animator
				tPoint = 1.1;
		} catch (e) {
			let error = parseException(e);
			clog("WARN", `Animator().update(): [${error.code}] ${error.description}`);
		}

		if (tPoint <= 1)
			this.animationFrameID = requestAnimationFrame(() => this.update());
		else {
			this.animate(1);
			this.completed = true;

			for (let f of this.completeHandlers) {
				try {
					f(true);
				} catch(e) {
					clog("WARN", `Animator().update(): an error occured while handing complete handlers`, e);
					continue;
				}
			}
		}
	}

	cancel() {
		if (this.completed || this.cancelled)
			return;

		cancelAnimationFrame(this.animationFrameID);
		this.cancelled = true;

		for (let f of this.completeHandlers) {
			try {
				f(false);
			} catch(e) {
				clog("WARN", `Animator().cancel(): an error occured while handing complete handlers`, e);
				continue;
			}
		}
	}

	/**
	 * Wait for animation to complete.
	 * 
	 * @returns	{Promise<Boolean>}	true if animation completed, false if cancelled
	 */
	complete() {
		return new Promise((resolve) => {
			if (this.completed)
				resolve(true);

			this.onComplete((completed) => resolve(completed));
		});
	}

	/**
	 * Animation complete handler
	 * 
	 * @param	{(completed: Boolean) => any}	f
	 */
	onComplete(f) {
		if (!f || typeof f !== "function")
			throw { code: -1, description: "Animator().onComplete(): not a valid function" }

		this.completeHandlers.push(f);
	}
}

class SmoothNumber {
	/**
	 * Create a new smooth number.
	 *
	 * @param	{(value: number) => void}	handler
	 * @param	{object}					options
	 * @param	{number}					options.duration	Animation duration, in seconds.
	 * @param	{(number) => number}		options.timing		Timing functions, see {@link Easing}.
	 * @param	{number}					options.initial		Initial value.
	 */
	constructor(handler, {
		duration = 1,
		timing = Easing.OutExpo,
		initial = 0
	} = {}) {
		this.handler = handler;
		this.duration = duration;
		this.timing = timing;

		/** @type {Animator} */
		this.animator = null;

		this.currentValue = initial;
		handler(initial);
	}

	set value(value) {
		this.set(value);
	}

	async set(value) {
		// Reject invalid value
		if (isNaN(value) || !isFinite(value))
			return this;

		if (this.animator) {
			this.animator.cancel();
			this.animator = null;
		}

		if (this.currentValue === value)
			return this;

		let start = this.currentValue;
		let delta = (value - this.currentValue);

		this.animator = new Animator(this.duration, this.timing, (t) => {
			this.currentValue = start + (delta * t);
			this.handler(this.currentValue);
		});

		await this.animator.complete();
		return this;
	}
}

/**
 * Calculates the trend of a series of values over a given time duration using an
 * optimized, incremental approach suitable for high-frequency, real-time data.
 *
 * The trend is determined by the slope of a linear regression line. This class
 * maintains running sums of the data points, so calculating the trend is an
 * O(1) operation, and adding/removing data is highly efficient.
 */
class TrendCalculator {
	/**
	 * @param	{number}	duration	The time window in milliseconds to consider for the trend calculation.
	 */
	constructor(duration) {
		if (typeof duration !== 'number' || duration <= 0)
			throw new Error('Duration must be a positive number in milliseconds.');

		this.duration = duration;

		/** @type {{ value: number, timestamp: number }[]} */
		this.dataPoints = [];

		this.sumX = 0;  // Sum of relative timestamps
		this.sumY = 0;  // Sum of values
		this.sumXY = 0; // Sum of (relative timestamp * value)
		this.sumX2 = 0; // Sum of (relative timestamp squared)
		
		this.firstTimestamp = 0;
	}

	/**
	 * Adds a new value to the data set and updates the trend calculation incrementally.
	 * 
	 * @param	{number}	value	The numeric value to add.
	 */
	addValue(value) {
		if (typeof value !== 'number' || !isFinite(value)) {
			console.warn('Invalid value provided. Must be a finite number.');
			return;
		}

		const now = Date.now();
		const point = { value, timestamp: now };
		this.dataPoints.push(point);

		// If this is the first point, set the baseline timestamp.
		if (this.dataPoints.length === 1)
			this.firstTimestamp = now;

		// Incrementally ADD this point's contribution to the sums
		const x = point.timestamp - this.firstTimestamp; // Relative time
		const y = point.value;

		this.sumX += x;
		this.sumY += y;
		this.sumXY += x * y;
		this.sumX2 += x * x;

		// Prune old data points from the front of the array.
		this._pruneData();
	}

	/**
	 * Efficiently removes data points older than the specified duration
	 * and incrementally updates the sums. This is a private helper method.
	 */
	_pruneData() {
		const cutoff = Date.now() - this.duration;

		// Remove old points from the beginning of the array.
		while (this.dataPoints.length > 0 && this.dataPoints[0].timestamp < cutoff) {
			const oldPoint = this.dataPoints.shift(); // Remove the oldest point

			// Incrementally SUBTRACT the old point's contribution
			const x = oldPoint.timestamp - this.firstTimestamp;
			const y = oldPoint.value;

			this.sumX -= x;
			this.sumY -= y;
			this.sumXY -= x * y;
			this.sumX2 -= x * x;
		}
		
		// If all points were pruned, reset the sums and baseline to prevent drift.
		if (this.dataPoints.length === 0) {
			this._resetSums();
		}
	}
	
	/**
	 * Resets the internal sums to zero.
	 */
	_resetSums() {
		this.sumX = 0;
		this.sumY = 0;
		this.sumXY = 0;
		this.sumX2 = 0;
		this.firstTimestamp = 0;
	}

	/**
	 * Calculates the trend of the values within the duration using the pre-calculated sums.
	 * This is a very fast O(1) operation.
	 * 
	 * @returns {number} The slope of the trend line (value per second).
	 * A positive value indicates an increasing trend.
	 * A negative value indicates a decreasing trend.
	 * A value of 0 indicates no trend or insufficient data.
	 */
	getTrend() {
		// Prune in case getTrend is called after a period of inactivity.
		this._pruneData();
		
		const n = this.dataPoints.length;

		// We need at least two points to determine a trend.
		if (n < 2) {
			return 0;
		}

		// Calculate the slope (m) of the linear regression line
		// Formula: m = (n * Σ(xy) - Σx * Σy) / (n * Σ(x^2) - (Σx)^2)
		const numerator = (n * this.sumXY) - (this.sumX * this.sumY);
		const denominator = (n * this.sumX2) - (this.sumX * this.sumX);

		// If the denominator is 0, all timestamps are effectively the same.
		if (denominator === 0)
			return 0;

		const slopeInMs = numerator / denominator;
		
		// Convert slope from (value / millisecond) to (value / second).
		return slopeInMs * 1000;
	}

	/**
	 * Clears all data points and resets the calculator.
	 */
	clear() {
		this.dataPoints = [];
		this._resetSums();
	}
}

/**
 * Converts a hex color code (long or short format) to an RGB color string.
 * 
 * @param	{string}								hex		The hex color code string (e.g., "#212121" or "#f0c").
 * @returns	{?[r: number, g: number, b: number]}			The RGB values or null if the format is invalid.
 */
function hexToRgb(hex) {
	if (!hex || typeof hex !== "string")
		return null;

	const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => {
		return r + r + g + g + b + b;
	});

	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);

	if (!result)
		return null;
	
	const r = parseInt(result[1], 16);
	const g = parseInt(result[2], 16);
	const b = parseInt(result[3], 16);
	return [r, g, b];
}
