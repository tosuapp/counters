import CountUpHandler from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/ComboHandler.ts
var ComboHandler = class extends CountUpHandler {
	constructor(engine) {
		super(engine, {
			id: "#combo",
			format: { maximumFractionDigits: 0 },
			numberSuffix: "x",
			defaultValue: 0
		});
		engine.register_jq(".play?.combo?.current?", (_, combo, data) => {
			this.update(combo);
			if (data?.play?.combo?.max > combo) document.querySelector("#maxComboContainer")?.classList.remove("w-0", "opacity-0");
			else document.querySelector("#maxComboContainer")?.classList.add("w-0", "opacity-0");
		});
	}
};
//#endregion
export { ComboHandler as default };
