
/**
 * Remove all childs in a Node
 * 
 * @param	{Element}	node	Node to empty
 */
function emptyNode(node) {
	while (node.firstChild)
		node.firstChild.remove();
}

/**
 * Insert a node after a node.
 * 
 * @param	{HTMLElement}	newNode
 * @param	{HTMLElement}	existingNode
 */
function insertAfter(newNode, existingNode) {
	existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}

function time(date) {
	if (date instanceof Date)
		return date.getTime() / 1000;

	return Date.now() / 1000;
}

function parseTime(t = 0, {
	forceShowHours = false,
	msDigit = 3,
	showPlus = false,
	strVal = true,
	calcDays = false
} = {}) {
	const d = showPlus ? "+" : "";
	let days = 0;
	
	if (t < 0) {
		t = -t;
		d = "-";
	}

	if (calcDays) {
		days = Math.floor(t / 86400);
		t %= 86400;
	}
	
	const h = Math.floor(t / 3600);
	const m = Math.floor(t % 3600 / 60);
	const s = Math.floor(t % 3600 % 60);
	const ms = pleft(parseInt(t.toFixed(msDigit).split(".")[1]), msDigit);

	return {
		h, m, s, ms, d,
		days,
		str: (strVal)
			? d + [h, m, s]
				.map(v => v < 10 ? "0" + v : v)
				.filter((v, i) => i > 0 || forceShowHours || v !== "00")
				.join(":")
			: null
	}
}

function convertSize(bytes) {
	let sizes = ["B", "KB", "MB", "GB", "TB"];
	for (var i = 0; bytes >= 1024 && i < (sizes.length -1 ); i++)
		bytes /= 1024;

	return `${round(bytes, 2)} ${sizes[i]}`;
}

function round(number, to = 2) {
	const d = Math.pow(10, to);
	return Math.round(number * d) / d;
}

/**
 * Returns a number whose value is limited to the given range.
 *
 * Example: limit the output of this computation to between 0 and 255
 * (x * 255).clamp(0, 255)
 *
 * @param		{Number}	value	The input value
 * @param		{Number}	min		The lower boundary of the output range
 * @param		{Number}	max		The upper boundary of the output range
 * @returns		{Number}	A number in the range [min, max]
 */
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

/**
 * Scale value from range [a, b] to [c, d]
 * 
 * @param	{Number}		value		Value to scale
 * @param	{Number[]}		from		Contain 2 points of input value range. Ex: [0, 1]
 * @param	{Number[]}		to			Target scale range of input value. Ex: [50, 100]
 * @returns	{Number}		Scaled value
 */
function scaleValue(value, from, to) {
	let scale = (to[1] - to[0]) / (from[1] - from[0]);
	let capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
	return capped * scale + to[0];
}

/**
 * Generate Random Number
 * 
 * @param	{Number}		min		Minimum Random Number
 * @param	{Number}		max		Maximum Random Number
 * @param	{Boolean}		toInt	Return an Integer Value
 * @returns	{Number}
 */
function randBetween(min, max, toInt = true) {
	return toInt
		? Math.floor(Math.random() * (max - min + 1) + min)
		: (Math.random() * (max - min) + min)
}

/**
 * Generate Random String
 * 
 * @param	{Number}	len			Length of the randomized string
 * @param	{String}	charSet
 * @returns	{String}
 */
function randString(len = 16, charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789") {
	let randomString = "";

	for (let i = 0; i < len; i++) {
		let p = Math.floor(Math.random() * charSet.length);
		randomString += charSet.substring(p, p + 1);
	}

	return randomString;
}

/**
 * Pick a random item in an Array
 * 
 * @template	T
 * @param		{T[]}	array
 * @returns		{T}
 */
function randItem(array) {
	if (typeof array.length !== "number")
		throw { code: -1, description: `randItem(): not a valid array` }

	return array[randBetween(0, array.length - 1, true)];
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
 * Verify if a value is an element.
 *
 * @param   {HTMLElement}   element
 * @returns {boolean}
 */
function isElement(element) {
	return (element && typeof element === "object" && element.tagName);
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

/**
 * Implements a fixed-length queue (circular buffer) to calculate the moving average
 * of the last N numbers.
 */
class MovingAverage {
	/**
	 * Creates an instance of MovingAverage.
	 * 
	 * @param	{number}	[size=10]	The maximum number of elements to store in the queue.
	 */
	constructor(size = 10) {
		this.size = size;
		this.queueArray = new Array(size).fill(0);
		this.head = 0;
		this.currentSum = 0;
		this.count = 0;
	}

	/**
	 * Adds a new number to the queue and updates the sum.
	 * When the queue is full, it overwrites the oldest element.
	 * 
	 * @param	{number}	newNumber	The number to add.
	 */
	addNumber(newNumber) {
		if (this.count === this.size) {
			this.currentSum -= this.queueArray[this.head];
		} else {
			this.count++;
		}

		this.currentSum += newNumber;
		this.queueArray[this.head] = newNumber;
		this.head = (this.head + 1) % this.size;
	}

	/**
	 * Resets the moving average calculator to its initial empty state.
	 * All stored numbers are cleared, and the sum and count are reset to zero.
	 */
	clear() {
		this.queueArray.fill(0);
		this.head = 0;
		this.currentSum = 0;
		this.count = 0;
	}

	/**
	 * Calculates and returns the current average of the numbers in the queue.
	 * Returns 0 if the queue is empty.
	 * 
	 * @returns		{number}	The average of the numbers in the queue.
	 */
	getAverage() {
		if (this.count === 0)
			return 0;

		return this.currentSum / this.count;
	}

	/**
	 * Returns the current state of the underlying queue array (for debugging/inspection).
	 * 
	 * @returns		{number[]}	A copy of the underlying array representing the queue.
	 */
	getQueue() {
		return [...this.queueArray];
	}

	/**
	 * Returns the current number of valid elements in the queue.
	 * 
	 * @returns		{number}	The count of valid elements.
	 */
	getCount() {
		return this.count;
	}
}

/**
 * A class to calculate mean and standard deviation incrementally using Welford's online algorithm.
 * This is efficient for adding numbers one by one to a growing dataset.
 */
class StandardDeviationCalculator {
	/**
	 * Creates an instance of StandardDeviationCalculator.
	 * 
	 * @param	{boolean}	[isSample=true]		Whether to calculate sample standard deviation (n-1 denominator) or population (n denominator).
	 */
	constructor(isSample = true) {
		this.isSample = isSample;
		this.clear();
	}

	/**
	 * Resets the calculator to its initial empty state.
	 */
	clear() {
		this.count = 0;
		this.mean = 0;
		this.M2 = 0;
	}

	/**
	 * Adds a new number to the dataset and updates the statistics.
	 * 
	 * @param	{number}	newNumber	The number to add.
	 */
	addNumber(newNumber) {
		this.count++;
		const delta = newNumber - this.mean;
		this.mean += delta / this.count;
		const delta2 = newNumber - this.mean;
		this.M2 += delta * delta2;
	}

	/**
	 * Gets the current count of numbers added.
	 * 
	 * @returns {number} The count.
	 */
	getCount() {
		return this.count;
	}

	/**
	 * Gets the current mean (average) of the numbers added.
	 * 
	 * @returns {number} The mean. Returns 0 if no numbers added.
	 */
	getMean() {
		return this.mean;
	}

	/**
	 * Calculates and returns the current variance of the numbers added.
	 * 
	 * @returns {number} The variance. Returns 0 if insufficient data.
	 */
	getVariance() {
		if (this.count < (this.isSample ? 2 : 1)) {
			return 0;
		}

		const divisor = this.isSample ? (this.count - 1) : this.count;
		return this.M2 / divisor;
	}

	/**
	 * Calculates and returns the current standard deviation of the numbers added.
	 * 
	 * @returns {number} The standard deviation. Returns 0 if insufficient data.
	 */
	getStandardDeviation() {
		return Math.sqrt(this.getVariance());
	}
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
	 * @returns {Promise<Boolean>} true if animation completed, false if cancelled
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

class SmoothValue {
	/**
	 * Create a new smooth value element.
	 *
	 * @param	{object}				options
	 * @param	{string|string[]}		options.classes
	 * @param	{number}				options.duration	Animation duration, in seconds.
	 * @param	{(number) => number}	options.timing		Timing functions, see {@link Easing}.
	 * @param	{number}				[options.decimal]	Amount of decimal numbers to display
	 */
	constructor({
		classes = [],
		duration = 1,
		timing = Easing.OutExpo,
		decimal = 0
	} = {}) {
		if (typeof classes === "string")
			classes = [classes];

		this.container = document.createElement("span");
		this.container.classList.add("smooth-value", ...classes);

		this.decimal = decimal;

		this.number = new SmoothNumber((value) => {
			this.container.innerText = value.toFixed(this.decimal);
		}, { duration, timing });
	}

	set value(value) {
		this.number.set(value);
	}

	async set(value) {
		await this.number.set(value);
		return this;
	}
}

/**
 * @class TrendCalculator
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
