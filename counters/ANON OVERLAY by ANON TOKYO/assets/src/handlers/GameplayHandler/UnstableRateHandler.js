import { CountUpHandler } from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/UnstableRateHandler.ts
var UnstableRateHandler = class extends CountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#ur",
			format: {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			},
			numberSuffix: "UR",
			defaultValue: 0
		});
		engine.register_jq(".play?.unstableRate?", (_, ur) => {
			this.update(ur);
		});
	}
};
//#endregion
export { UnstableRateHandler };
