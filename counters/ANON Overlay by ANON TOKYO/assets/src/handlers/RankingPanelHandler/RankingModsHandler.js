import { debounce } from "../../utils.js";
import { DEC_MODS, INC_MODS, MODS, UTILS_MODS } from "../../const.js";
//#region src/handlers/RankingPanelHandler/RankingModsHandler.ts
var RankingModsHandler = class {
	element;
	constructor(engine) {
		this.element = document.querySelector("#ranking-mods");
		engine.register_jq(".resultsScreen?.mods?.name?", debounce((_, __, data) => {
			this.update(data?.resultsScreen?.mods?.array?.map((mod) => mod.acronym) ?? []);
		}, 200));
	}
	update(_mods) {
		if (!this.element) return;
		const container = document.querySelector("#ranking-mods-container");
		if (!container) return;
		this.element.innerHTML = "";
		const mods = _mods.filter((mod) => MODS.includes(mod));
		if (!mods.length) {
			container.classList.add("translate-x-100");
			return;
		}
		container.classList.remove("translate-x-100");
		for (const mod of mods) {
			if (!MODS.includes(mod)) continue;
			const modEle = document.createElement("div");
			modEle.classList.add("mod");
			if (INC_MODS.includes(mod)) modEle.classList.add("inc");
			if (DEC_MODS.includes(mod)) modEle.classList.add("dec");
			if (UTILS_MODS.includes(mod)) modEle.classList.add("utils");
			modEle.classList.add(mod);
			this.element.append(modEle);
		}
	}
};
//#endregion
export { RankingModsHandler as default };
