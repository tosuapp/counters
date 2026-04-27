import CountUpHandler from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/PerformanceHandler.ts
var PerformanceHandler = class extends CountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#performance",
			format: { maximumFractionDigits: 0 },
			numberSuffix: "pp",
			defaultValue: 0
		});
		engine.register_jq(".play?.pp?.current?", (_, performance) => {
			this.update(performance);
		});
	}
};
//#endregion
export { PerformanceHandler as default };
