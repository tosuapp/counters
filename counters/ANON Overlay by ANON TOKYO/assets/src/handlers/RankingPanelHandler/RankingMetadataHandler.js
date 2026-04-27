import BaseHandler from "../BaseHandler.js";
//#region src/handlers/RankingPanelHandler/RankingMetadataHandler.ts
var MetadataHandler = class extends BaseHandler {
	constructor(engine, key) {
		super(engine, { id: `#ranking-${key}` });
		engine.register_jq(`.beatmap?.${key}?`, (_, stats) => {
			this.update(stats);
		});
	}
};
//#endregion
export { MetadataHandler as default };
