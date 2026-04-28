import { CountUpHandler } from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/HitCountHandler.ts
var HitCountHandler = class extends CountUpHandler {
	constructor(engine, value) {
		super(engine, {
			id: `#h${value}`,
			format: { maximumFractionDigits: 0 },
			defaultValue: 0
		});
		engine.register_jq(`.play?.hits?."${value}"`, (_, value) => {
			this.update(value);
		});
	}
};
//#endregion
export { HitCountHandler };
