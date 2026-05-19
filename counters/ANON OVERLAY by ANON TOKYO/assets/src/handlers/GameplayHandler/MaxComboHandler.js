import { CountUpHandler } from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/MaxComboHandler.ts
var MaxComboHandler = class extends CountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#maxCombo",
			format: { maximumFractionDigits: 0 },
			numberSuffix: "x",
			numberPrefix: "/",
			defaultValue: 0
		});
		engine.register_jq(".play?.combo?.max?", (_, maxCombo) => {
			this.update(maxCombo);
		});
	}
};
//#endregion
export { MaxComboHandler };
