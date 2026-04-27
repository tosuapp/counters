import RankingCountUpHandler from "./RankingCountUpHandler.js";
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
export { RankingAccuracyHandler as default };
