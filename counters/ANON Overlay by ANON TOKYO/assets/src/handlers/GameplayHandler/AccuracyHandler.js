import CountUpHandler from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/AccuracyHandler.ts
var AccuracyHandler = class extends CountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#accuracy",
			format: {
				minimumFractionDigits: 2,
				maximumFractionDigits: 2
			},
			numberSuffix: "%",
			defaultValue: 100
		});
		engine.register_jq(".play?.accuracy?", (_, accuracy) => {
			this.update(accuracy);
		});
	}
};
//#endregion
export { AccuracyHandler as default };
