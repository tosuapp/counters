import { RankingCountUpHandler } from "./RankingAccuracyHandler.js";
//#region src/handlers/RankingPanelHandler/RankingComboHandler.ts
var RankingComboHandler = class extends RankingCountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#ranking-combo",
			format: {
				maximumFractionDigits: 0,
				useGrouping: true
			},
			defaultValue: 0,
			numberSuffix: "x"
		});
		engine.register_jq(".resultsScreen?.maxCombo?", (_, combo) => {
			this.stored = combo;
		});
	}
};
//#endregion
export { RankingComboHandler };
