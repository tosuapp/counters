import { RankingCountUpHandler } from "./RankingAccuracyHandler.js";
//#region src/handlers/RankingPanelHandler/RankingJudgementHandler.ts
var RankingJudgementHandler = class extends RankingCountUpHandler {
	constructor(engine, id) {
		super(engine, {
			id: `#ranking-h${id}`,
			format: { maximumFractionDigits: 0 },
			defaultValue: 0
		});
		engine.register_jq(`.resultsScreen?.hits?."${id}"`, (_, count) => {
			this.stored = count;
		});
	}
};
//#endregion
export { RankingJudgementHandler };
