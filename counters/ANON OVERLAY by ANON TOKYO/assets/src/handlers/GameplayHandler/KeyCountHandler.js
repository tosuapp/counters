import { CountUpHandler } from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/KeyCountHandler.ts
var KeyCountHandler = class extends CountUpHandler {
	constructor(engine, id) {
		super(engine, {
			id: `#${id}`,
			format: { maximumFractionDigits: 0 },
			defaultValue: 0
		});
		this.id = id;
		engine.register_jq(`.keys?.${id}?.count?`, (_, count) => {
			this.update(count);
		});
	}
	updateColor(palette) {
		const ele = document.querySelector(`#${this.id}-container`);
		if (!ele) return;
		if (this.id.includes("1")) ele.style.backgroundColor = palette.Muted?.hex ?? "white";
		if (this.id.includes("2")) ele.style.backgroundColor = palette.LightMuted?.hex ?? "white";
	}
};
//#endregion
export { KeyCountHandler };
