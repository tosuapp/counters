import { RankingCountUpHandler } from "./RankingAccuracyHandler.js";
//#region src/handlers/RankingPanelHandler/RankingScoreHandler.ts
var RankingScoreHandler = class extends RankingCountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#ranking-score",
			format: { maximumFractionDigits: 0 },
			defaultValue: 0
		});
		engine.register_jq(".resultsScreen?.score?", (_, score) => {
			this.stored = score;
		});
	}
};
//#endregion
export { RankingScoreHandler };
