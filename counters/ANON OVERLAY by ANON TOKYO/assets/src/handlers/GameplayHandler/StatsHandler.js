import { BaseHandler } from "../BaseHandler.js";
//#region src/handlers/GameplayHandler/StatsHandler.ts
var StatsHandler = class extends BaseHandler {
	constructor(engine, stats) {
		super(engine, { id: `#${stats}` });
		engine.register_jq(stats !== "sr" && `.beatmap?.stats?.${stats}?.converted?` || `.beatmap?.stats?.stars?.total?`, (_, stats) => {
			this.update(stats.toFixed(2).replaceAll(/\.0+$|0+$/g, ""));
		});
	}
};
//#endregion
export { StatsHandler };
