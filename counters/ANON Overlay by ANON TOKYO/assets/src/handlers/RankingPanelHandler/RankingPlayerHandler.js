import { getPlayerData } from "../../utils.js";
import BaseHandler from "../BaseHandler.js";
//#region src/handlers/RankingPanelHandler/RankingPlayerHandler.ts
var RankingPlayerHandler = class extends BaseHandler {
	constructor(engine, onUpdate) {
		super(engine, { id: "#ranking-user-name" });
		this.onUpdate = onUpdate;
		let controller = null;
		engine.register_jq(".resultsScreen?.playerName?", async (_, playerName) => {
			controller?.abort();
			controller = await this.update(playerName);
		});
	}
	async update(playerName) {
		const controller = new AbortController();
		const data = {
			name: playerName,
			performance: "loading... ",
			avatar: "",
			id: -1
		};
		this.applyData(data);
		try {
			if (!playerName) {
				data.name = "?";
				throw new Error("Empty Username");
			}
			const { username, statistics: { pp }, avatar_url, id } = await getPlayerData(playerName, controller);
			data.name = username;
			data.performance = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(pp);
			data.avatar = `url("${avatar_url}")`;
			data.id = id;
		} catch {
			data.performance = "-- ";
			data.avatar = "url('https://a.ppy.sh')";
		}
		this.applyData(data);
		this.onUpdate?.({
			username: data.name,
			id: data.id
		});
		return controller;
	}
	applyData(data) {
		const userName = this.element;
		const userPerformance = document.querySelector("#ranking-user-performance");
		const userAvatar = document.querySelector("#ranking-user-avatar");
		if (!userName || !userPerformance || !userAvatar) return;
		const { name, performance, avatar } = data;
		userName.textContent = name;
		userPerformance.textContent = performance;
		userAvatar.style.backgroundImage = avatar;
	}
};
//#endregion
export { RankingPlayerHandler as default };
