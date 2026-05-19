import { CountUpHandler, debounce } from "../CountUpHandler.js";
//#region src/handlers/RankingPanelHandler/RankingCountUpHandler.ts
var RankingCountUpHandler = class extends CountUpHandler {
	stored = 0;
	constructor(engine, config) {
		super(engine, config);
		if (!this.element) return;
		this.element.transformTiming = {
			easing: "ease-out",
			duration: 1e3
		};
		engine.register_jq(".state?.name?", debounce((_, state) => {
			if (state !== "resultScreen") {
				this.update(0);
				return;
			}
			this.update(this.stored);
		}, 200));
	}
};
//#endregion
//#region src/handlers/RankingPanelHandler/RankingAccuracyHandler.ts
var RankingAccuracyHandler = class extends RankingCountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#ranking-accuracy",
			format: {
				maximumFractionDigits: 2,
				minimumFractionDigits: 2
			},
			defaultValue: 0,
			numberSuffix: "%"
		});
		engine.register_jq(".resultsScreen?.accuracy?", (_, accuracy) => {
			this.stored = accuracy;
		});
	}
};
//#endregion
export { RankingAccuracyHandler, RankingCountUpHandler };
