import RankingAccuracyHandler from "./RankingAccuracyHandler.js";
import RankingComboHandler from "./RankingComboHandler.js";
import RankingGradeHandler from "./RankingGradeHandler.js";
import RankingJudgementHandler from "./RankingJudgementHandler.js";
import MetadataHandler from "./RankingMetadataHandler.js";
import RankingPerformanceHandler from "./RankingPerformanceHandler.js";
import RankingPlayerHandler from "./RankingPlayerHandler.js";
import RankingScoreHandler from "./RankingScoreHandler.js";
import RankingModsHandler from "./RankingModsHandler.js";
//#region src/handlers/RankingPanelHandler/index.ts
var RankingPanelHandler = class {
	constructor(engine) {
		new RankingScoreHandler(engine);
		new RankingAccuracyHandler(engine);
		new RankingComboHandler(engine);
		new RankingPerformanceHandler(engine);
		for (const value of [
			300,
			100,
			50,
			0
		]) new RankingJudgementHandler(engine, `${value}`);
		for (const key of [
			"artist",
			"title",
			"version",
			"mapper"
		]) new MetadataHandler(engine, key);
		new RankingPlayerHandler(engine);
		new RankingGradeHandler(engine);
		new RankingModsHandler(engine);
		const element = document.querySelector("#rankingPanel");
		if (!element) return;
		engine.register_jq(".state?.name?", (_, state) => {
			if (state !== "resultScreen") {
				element.classList.add("hidden", "opacity-0");
				return;
			}
			element.classList.remove("hidden", "opacity-0");
		});
	}
};
//#endregion
export { RankingPanelHandler as default };
