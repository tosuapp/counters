import { Vibrant } from "../../../node_modules/@vibrant/core/dist/esm/index.js";
import "../../../node_modules/node-vibrant/dist/esm/browser.js";
//#region src/handlers/GameplayHandler/BackgroundHandler.ts
var BASE_URL = `http://${window.location.host}`;
var BackgroundHandler = class {
	palette = {
		Vibrant: null,
		Muted: null,
		DarkVibrant: null,
		DarkMuted: null,
		LightVibrant: null,
		LightMuted: null
	};
	constructor(engine, onUpdate) {
		engine.register_jq(".directPath?.beatmapBackground?", async (_, background) => {
			if (!document.querySelector("#app")) return;
			const rankingPanel = document.querySelector("#rankingPanel");
			if (!rankingPanel) return;
			const url = `${BASE_URL}/Songs/${background.replaceAll("\\", "/")}`;
			rankingPanel.style.backgroundImage = `linear-gradient(to bottom, transparent 40%, rgb(0 0 0 /.6) 100%), url("${url}")`;
			try {
				this.palette = await Vibrant.from(url).getPalette();
			} catch {
				this.palette = {
					Vibrant: null,
					Muted: null,
					DarkVibrant: null,
					DarkMuted: null,
					LightVibrant: null,
					LightMuted: null
				};
			}
			document.documentElement.style.setProperty("--accent", this.palette.Muted?.hex ?? "#f84f84");
			onUpdate?.(this.palette);
		});
	}
};
//#endregion
export { BackgroundHandler as default };
