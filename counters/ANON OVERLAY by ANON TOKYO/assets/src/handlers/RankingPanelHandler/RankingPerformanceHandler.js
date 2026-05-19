import { RankingCountUpHandler } from "./RankingAccuracyHandler.js";
//#region src/handlers/RankingPanelHandler/RankingPerformanceHandler.ts
var RankingPerformanceHandler = class extends RankingCountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#ranking-performance",
			format: {
				maximumFractionDigits: 0,
				useGrouping: true
			},
			defaultValue: 0,
			numberSuffix: "pp"
		});
		engine.register_jq(".resultsScreen?.pp?.current?", (_, performance) => {
			this.stored = performance;
		});
	}
};
//#endregion
export { RankingPerformanceHandler };
