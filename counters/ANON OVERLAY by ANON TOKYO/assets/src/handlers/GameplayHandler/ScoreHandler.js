import { i } from "../../../deps/vendor.js";
import { BaseHandler } from "../BaseHandler.js";
//#region src/handlers/GameplayHandler/ScoreHandler.ts
var ScoreHandler = class extends BaseHandler {
	countUp;
	constructor(engine, onUpdate) {
		super(engine, { id: "#score" });
		this.onUpdate = onUpdate;
		if (!this.element) return;
		const formatter = new Intl.NumberFormat("en-US", { minimumIntegerDigits: 6 });
		this.countUp = new i(this.element, 0, {
			decimalPlaces: 0,
			autoAnimate: true,
			duration: 1,
			formattingFn: (value) => formatter.format(value)
		});
		this.countUp.start();
		engine.register_jq(".play?.score?", (_, score) => {
			const value = this.update(score);
			this.onUpdate?.(value);
		});
	}
	update(value, element = this.element) {
		if (!element) return 0;
		if (this.engine.cache.beatmap?.time?.live < this.engine.cache?.beatmap?.time?.firstObject) {
			this.countUp.update(0);
			this.onUpdate?.(0);
			return 0;
		}
		this.countUp.update(value ?? 0);
		return value ?? 0;
	}
};
//#endregion
export { ScoreHandler };
