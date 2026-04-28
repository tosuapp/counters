import { DEC_MODS, INC_MODS, MODS, UTILS_MODS } from "../../const.js";
//#region src/handlers/GameplayHandler/ModsHandler.ts
var ModsHandler = class {
	constructor(engine) {
		engine.register_jq(".play?.mods?.name?", (_, __, data) => {
			this.update(data?.play?.mods?.array?.map((mod) => mod.acronym) ?? []);
		});
	}
	update(_mods) {
		const element = document.querySelector("#mods");
		if (!element) return;
		const mods = _mods.filter((mod) => MODS.includes(mod));
		element.innerHTML = "";
		for (const mod of mods) {
			if (!MODS.includes(mod)) continue;
			const modEle = document.createElement("div");
			modEle.classList.add("mod");
			if (INC_MODS.includes(mod)) modEle.classList.add("inc");
			if (DEC_MODS.includes(mod)) modEle.classList.add("dec");
			if (UTILS_MODS.includes(mod)) modEle.classList.add("utils");
			modEle.classList.add(mod);
			element.append(modEle);
		}
	}
};
//#endregion
export { ModsHandler };
