import { Vibrant } from "../../../deps/vendor.js";
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
			const app = document.querySelector("#app");
			if (!app) return;
			const rankingPanel = document.querySelector("#rankingPanel");
			if (!rankingPanel) return;
			const url = `${BASE_URL}/Songs/${background.replaceAll("\\", "/")}`;
			app.style.backgroundImage = `linear-gradient(to bottom, rgb(0 0 0 /.6), rgb(0 0 0 /.6) 100%), url("${url}")`;
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
export { BackgroundHandler };
