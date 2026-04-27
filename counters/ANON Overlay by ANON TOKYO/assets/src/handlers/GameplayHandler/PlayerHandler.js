import { getPlayerData } from "../../utils.js";
import BaseHandler from "../BaseHandler.js";
//#region src/handlers/GameplayHandler/PlayerHandler.ts
var PlayerHandler = class extends BaseHandler {
	constructor(engine, onUpdate) {
		super(engine, { id: "#user-name" });
		this.onUpdate = onUpdate;
		let controller = null;
		engine.register_jq(".play?.playerName?", async (_, playerName) => {
			controller?.abort();
			controller = await this.update(playerName);
		});
	}
	async update(playerName) {
		const controller = new AbortController();
		const data = {
			name: playerName,
			performance: "loading... ",
			rank: "loading...",
			avatar: "",
			country: "",
			id: -1
		};
		this.applyData(data);
		try {
			if (!playerName) {
				data.name = "?";
				throw new Error("Empty Username");
			}
			const { username, statistics: { global_rank, pp }, avatar_url, country_code, id } = await getPlayerData(playerName, controller);
			data.name = username;
			data.performance = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(pp);
			data.rank = new Intl.NumberFormat("en-US").format(global_rank);
			data.avatar = `url("${avatar_url}")`;
			data.country = `url("https://osu.ppy.sh/assets/images/flags/${this.getCountryCode(country_code)}.svg")`;
			data.id = id;
		} catch {
			data.performance = "-- ";
			data.rank = "-";
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
		const userPerformance = document.querySelector("#user-performance");
		const userRank = document.querySelector("#user-rank");
		const userAvatar = document.querySelector("#user-avatar");
		const userCountry = document.querySelector("#user-country");
		if (!userName || !userPerformance || !userRank || !userAvatar || !userCountry) return;
		const { name, performance, rank, avatar, country } = data;
		userName.textContent = name;
		userPerformance.textContent = performance;
		userRank.textContent = rank;
		userAvatar.style.backgroundImage = avatar;
		userCountry.style.backgroundImage = country;
	}
	getCountryCode(country = "__") {
		return `${country.split("").map((char) => 127397 + char.charCodeAt(0))[0].toString(16)}-${country.split("").map((char) => 127397 + char.charCodeAt(0))[1].toString(16)}`;
	}
};
//#endregion
export { PlayerHandler as default };
