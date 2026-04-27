import BaseHandler from "../BaseHandler.js";
//#region src/handlers/RankingPanelHandler/RankingGradeHandler.ts
var RankingGradeHandler = class extends BaseHandler {
	constructor(engine) {
		super(engine, { id: "#ranking-grade" });
		engine.register_jq(".resultsScreen?.rank?", (_, grade) => {
			this.update(grade);
		});
	}
	update(grade) {
		for (const element of document.querySelectorAll(".ranking-grade")) element.classList.add("hidden", "opacity-0");
		switch (grade) {
			case "XH":
			case "X":
				document.querySelector("#ranking-grade-x")?.classList.remove("hidden", "opacity-0");
				break;
			case "SH":
			case "S":
				document.querySelector("#ranking-grade-s")?.classList.remove("hidden", "opacity-0");
				break;
			case "A":
				document.querySelector("#ranking-grade-a")?.classList.remove("hidden", "opacity-0");
				break;
			case "B":
				document.querySelector("#ranking-grade-b")?.classList.remove("hidden", "opacity-0");
				break;
			case "C":
				document.querySelector("#ranking-grade-c")?.classList.remove("hidden", "opacity-0");
				break;
			case "D":
				document.querySelector("#ranking-grade-d")?.classList.remove("hidden", "opacity-0");
				break;
		}
	}
};
//#endregion
export { RankingGradeHandler as default };
