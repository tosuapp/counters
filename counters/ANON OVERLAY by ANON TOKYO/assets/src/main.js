import { ZEngine } from "../deps/vendor.js";
import { query } from "./handlers/CountUpHandler.js";
import { GameplayHandler } from "./handlers/GameplayHandler/index.js";
import { RankingPanelHandler } from "./handlers/RankingPanelHandler/index.js";
//#region src/main.ts
var WS_URL = `ws://${window.location.host}/websocket/v2`;
var WS_PRECISE_URL = `ws://${window.location.host}/websocket/v2/precise`;
var engine = new ZEngine(WS_URL, [
	"state",
	{
		field: "beatmap",
		keys: [
			"time",
			"artist",
			"title",
			"version",
			"mapper",
			{
				field: "stats",
				keys: [
					{
						field: "stars",
						keys: ["total"]
					},
					{
						field: "cs",
						keys: ["converted"]
					},
					{
						field: "ar",
						keys: ["converted"]
					},
					{
						field: "od",
						keys: ["converted"]
					}
				]
			}
		]
	},
	{
		field: "play",
		keys: [
			"playerName",
			"score",
			"accuracy",
			"combo",
			{
				field: "hits",
				keys: [
					"100",
					"50",
					"0"
				]
			},
			{
				field: "rank",
				keys: ["current"]
			},
			{
				field: "pp",
				keys: ["current"]
			},
			"unstableRate",
			{
				field: "mods",
				keys: ["name", "array"]
			}
		]
	},
	"leaderboard",
	"directPath",
	"resultsScreen",
	{
		field: "settings",
		keys: ["interfaceVisible"]
	}
]);
new GameplayHandler(engine, new ZEngine(WS_PRECISE_URL));
new RankingPanelHandler(engine);
for (const [key, id] of [
	["hide_np", "#np-container"],
	["hide_leaderboard", "#leaderboard"],
	["hide_combo", "#combo-container"],
	["hide_ur", "#ur-container"],
	["hide_judgements", "#judgements-container"],
	["hide_key", "#key-container"],
	["hide_profile", "#profile-container"],
	["hide_ranking", "#rankingPanel"],
	["hide_grade", "#grade-wrapper"],
	["hide_performance", "#performance-container"],
	["hide_score", "#score"],
	["hide_accuracy", "#accuracy-container"]
]) {
	if (!query.has(key)) continue;
	document.querySelector(id)?.classList.add("hidden!");
}
//#endregion
