import { i, l } from "../../deps/vendor.js";
import { BaseHandler } from "./BaseHandler.js";
//#region src/utils.ts
var defaultTimingFunction = { duration: 250 };
var debounce = (fn, timeout = 3e3) => {
	let timeoutId = null;
	return (...args) => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fn(...args);
		}, timeout);
	};
};
var query = new URLSearchParams(window.location.search);
var getPlayerData = async (playerName, controller) => {
	return await (await fetch(`https://api.try-z.net/u/${playerName}`, { signal: controller.signal })).json();
};
//#endregion
//#region src/handlers/CountUpHandler.ts
var CountUpHandler = class extends BaseHandler {
	countUp;
	constructor(engine, config) {
		super(engine, config);
		this.engine = engine;
		this.config = config;
		if (!this.element) return;
		const { format, numberSuffix, numberPrefix, defaultValue } = config;
		if (query.has("odometer")) {
			this.element.plugins = [l];
			this.element.transformTiming = defaultTimingFunction;
			this.element.format = format;
			this.element.numberPrefix = numberPrefix;
			this.element.numberSuffix = numberSuffix;
			this.element.update(defaultValue ?? 0);
			return;
		}
		this.element.classList.add("tabular-nums");
		const formatter = new Intl.NumberFormat("en-US", format);
		this.countUp = new i(this.element, defaultValue ?? 0, {
			autoAnimate: true,
			duration: 1,
			formattingFn: (value) => `${numberPrefix ?? ""}${formatter.format(value)}${numberSuffix ?? ""}`
		});
		this.countUp.start();
	}
	update(value, element = this.element) {
		if (!element) return;
		const isPreMap = this.engine.cache.beatmap?.time?.live < this.engine.cache?.beatmap?.time?.firstObject;
		if (typeof value !== "number" && !value) return;
		if (isPreMap) {
			if (query.has("odometer")) element.update(this.config.defaultValue ?? 0);
			if (!query.has("odometer")) this.countUp.update(this.config.defaultValue ?? 0);
			return;
		}
		if (query.has("odometer")) element.update(value);
		if (!query.has("odometer")) this.countUp.update(value);
	}
};
//#endregion
export { CountUpHandler, debounce, getPlayerData, query };
