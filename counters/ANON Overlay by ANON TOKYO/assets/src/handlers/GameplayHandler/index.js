import AccuracyHandler from "./AccuracyHandler.js";
import BackgroundHandler from "./BackgroundHandler.js";
import ComboHandler from "./ComboHandler.js";
import GradeHandler from "./GradeHandler.js";
import HitCountHandler from "./HitCountHandler.js";
import KeyCountHandler from "./KeyCountHandler.js";
import KeyGraphHandler from "./KeyGraphHandler.js";
import LeaderboardHandler from "./LeaderboardHandler.js";
import MaxComboHandler from "./MaxComboHandler.js";
import MetadataHandler from "./MetadataHandler.js";
import ModsHandler from "./ModsHandler.js";
import PerformanceHandler from "./PerformanceHandler.js";
import PlayerHandler from "./PlayerHandler.js";
import ScoreHandler from "./ScoreHandler.js";
import StatsHandler from "./StatsHandler.js";
import UnstableRateHandler from "./UnstableRateHandler.js";
//#region src/handlers/GameplayHandler/index.ts
var GameplayHandler = class {
	constructor(engine, precise) {
		const leaderboardHandler = new LeaderboardHandler(engine);
		new ScoreHandler(engine, (score) => leaderboardHandler.updateScore(score));
		new PlayerHandler(engine, (data) => leaderboardHandler.updateMe(data));
		new AccuracyHandler(engine);
		new ComboHandler(engine);
		new MaxComboHandler(engine);
		new UnstableRateHandler(engine);
		new PerformanceHandler(engine);
		new GradeHandler(engine);
		const keyGraphHandler = new KeyGraphHandler(precise);
		for (const value of [
			100,
			50,
			0
		]) new HitCountHandler(engine, value);
		for (const stats of [
			"cs",
			"ar",
			"od",
			"sr"
		]) new StatsHandler(engine, stats);
		for (const key of [
			"artist",
			"title",
			"version"
		]) new MetadataHandler(engine, key);
		const k1CountHandler = new KeyCountHandler(precise, "k1");
		const k2CountHandler = new KeyCountHandler(precise, "k2");
		new BackgroundHandler(engine, (palette) => {
			keyGraphHandler.updateColor(palette);
			k1CountHandler.updateColor(palette);
			k2CountHandler.updateColor(palette);
		});
		new ModsHandler(engine);
		const element = document.querySelector("#app");
		if (!element) return;
		engine.register_jq(".state?.name?", (_, state, data) => {
			const visible = data?.settings?.intefaceVisible;
			if (state !== "play" || visible) {
				element.classList.add("hidden", "opacity-0");
				return;
			}
			element.classList.remove("hidden", "opacity-0");
		});
		engine.register_jq(".settings?.interfaceVisible?", (_, visible, data) => {
			if (data?.state?.name !== "play" || visible) {
				element.classList.add("hidden", "opacity-0");
				return;
			}
			element.classList.remove("hidden", "opacity-0");
		});
	}
};
//#endregion
export { GameplayHandler as default };
