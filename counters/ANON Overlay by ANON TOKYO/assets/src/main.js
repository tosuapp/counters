import { ZEngine } from "../node_modules/@fukutotojido/z-engine/dist/index.js";
import "../node_modules/number-flow/dist/index.js";
/* empty css                                        */
import { query } from "./utils.js";
import GameplayHandler from "./handlers/GameplayHandler/index.js";
import RankingPanelHandler from "./handlers/RankingPanelHandler/index.js";
/* empty css      */
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
if (query.get("hide_np") !== null) document.body.classList.add("hideNp");
//#endregion
