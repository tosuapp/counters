
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
