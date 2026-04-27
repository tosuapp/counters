import { l } from "../../node_modules/number-flow/dist/plugins.js";
import { defaultTimingFunction } from "../utils.js";
import BaseHandler from "./BaseHandler.js";
//#region src/handlers/CountUpHandler.ts
var CountUpHandler = class extends BaseHandler {
	constructor(engine, config) {
		super(engine, config);
		this.engine = engine;
		this.config = config;
		if (!this.element) return;
		const { format, numberSuffix, numberPrefix, defaultValue } = config;
		this.element.plugins = [l];
		this.element.transformTiming = defaultTimingFunction;
		this.element.format = format;
		this.element.numberPrefix = numberPrefix;
		this.element.numberSuffix = numberSuffix;
		this.element.update(defaultValue ?? 0);
	}
	update(value, element = this.element) {
		if (!element) return;
		const isPreMap = this.engine.cache.beatmap?.time?.live < this.engine.cache?.beatmap?.time?.firstObject;
		if (typeof value !== "number" && !value) return;
		if (isPreMap) {
			element.update(this.config.defaultValue ?? 0);
			return;
		}
		element.update(value);
	}
};
//#endregion
export { CountUpHandler as default };
