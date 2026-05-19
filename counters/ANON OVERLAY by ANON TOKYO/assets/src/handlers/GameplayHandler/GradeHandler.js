import { BaseHandler } from "../BaseHandler.js";
//#region src/handlers/GameplayHandler/GradeHandler.ts
var GradeHandler = class extends BaseHandler {
	constructor(engine) {
		super(engine, { id: "#grade" });
		engine.register_jq(".play?.rank?.current", (_, grade) => {
			this.update(grade);
		});
	}
	update(value, element = this.element) {
		if (!element) return;
		switch (value) {
			case "XH":
			case "X":
				element.style.transform = "translateY(0px)";
				break;
			case "SH":
			case "S":
				element.style.transform = "translateY(-48px)";
				break;
			case "A":
				element.style.transform = "translateY(-96px)";
				break;
			case "B":
				element.style.transform = "translateY(-144px)";
				break;
			case "C":
				element.style.transform = "translateY(-192px)";
				break;
			case "D":
				element.style.transform = "translateY(-240px)";
				break;
		}
	}
};
//#endregion
export { GradeHandler };
