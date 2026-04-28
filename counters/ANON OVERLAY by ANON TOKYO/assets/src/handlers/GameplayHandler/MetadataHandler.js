import { BaseHandler } from "../BaseHandler.js";
//#region src/handlers/GameplayHandler/MetadataHandler.ts
var MetadataHandler = class extends BaseHandler {
	constructor(engine, key) {
		super(engine, { id: `#${key}` });
		engine.register_jq(`.beatmap?.${key}?`, (_, stats) => {
			this.update(stats);
		});
	}
};
//#endregion
export { MetadataHandler };
