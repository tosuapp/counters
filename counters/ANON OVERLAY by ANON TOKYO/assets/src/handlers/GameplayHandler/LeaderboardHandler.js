import { debounce } from "../CountUpHandler.js";
//#region src/handlers/GameplayHandler/LeaderboardHandler.ts
var LeaderboardEntry = class LeaderboardEntry {
	static TEMPLATE = document.querySelector("#leaderboard-entry");
	element;
	constructor(entry) {
		this.entry = entry;
		if (!LeaderboardEntry.TEMPLATE || !LeaderboardEntry.TEMPLATE.content) return;
		const element = document.importNode(LeaderboardEntry.TEMPLATE.content, true).querySelector("div");
		if (!element) return;
		this.element = element;
		const userName = this.element.querySelector("[data-label='user-name']");
		const userScore = this.element.querySelector("[data-label='user-score']");
		if (userName) userName.textContent = entry.name;
		if (userScore) userScore.textContent = new Intl.NumberFormat("en-US").format(entry.score);
		this.position = 0;
	}
	set position(val) {
		if (!this.element) return;
		const userRank = this.element.querySelector("[data-label='user-rank']");
		if (userRank) userRank.textContent = `#${val}`;
	}
};
var LeaderboardMeEntry = class extends LeaderboardEntry {
	constructor() {
		super({
			name: "",
			score: 0
		});
		this.element?.classList.add("bg-linear-to-r", "from-accent", "to-transparent", "absolute");
	}
	set name(val) {
		const userName = this.element?.querySelector("[data-label='user-name']");
		if (userName) userName.textContent = val;
	}
	set score(val) {
		const userScore = this.element?.querySelector("[data-label='user-score']");
		if (userScore) userScore.textContent = new Intl.NumberFormat("en-US").format(val);
	}
};
var LeaderboardHandler = class {
	me;
	entries = [];
	leaderboardContainer;
	constructor(engine) {
		this.me = new LeaderboardMeEntry();
		const leaderboard = document.querySelector("#leaderboard");
		const leaderboardContainer = document.querySelector("#leaderboardContainer");
		leaderboard?.append(this.me.element);
		engine.register_jq(".leaderboard? | length", debounce((_, __, data) => {
			if (!leaderboardContainer) return;
			const leaderboard = data?.leaderboard ?? [];
			leaderboardContainer.innerHTML = "";
			this.entries = leaderboard.slice(0, -1).map((entry) => new LeaderboardEntry(entry));
			for (let i = 0; i < this.entries.length; i++) {
				const entry = this.entries[i];
				entry.position = i + 1;
				leaderboardContainer.append(entry.element);
			}
			this.updateScore(data.play?.score ?? 0);
		}, 500));
		this.leaderboardContainer = leaderboardContainer;
	}
	updateMe(data) {
		const { username } = data;
		this.me.name = username;
	}
	updateScore(score) {
		this.me.score = score;
		const currPos = this.getCurrentPosition(score);
		this.me.element.style.transform = `translateY(${Math.max(0, Math.min(6, currPos)) * 50}px)`;
		this.me.position = currPos + 1;
		for (let i = 0; i < this.entries.length; i++) {
			const entry = this.entries[i];
			if (entry.entry.score <= score) {
				entry.element.dataset.isLower = "true";
				entry.position = i + 1 + 1;
			} else {
				entry.element.dataset.isLower = "";
				entry.position = i + 1;
			}
		}
		if (!this.leaderboardContainer) return;
		this.leaderboardContainer.style.transform = `translateY(-${Math.max(0, currPos - 6) * 50}px)`;
	}
	getCurrentPosition(score) {
		if (this.entries.length === 0) return 0;
		let mid;
		let l = 0;
		let r = this.entries.length - 1;
		while (l <= r) {
			mid = Math.round((l + r) / 2);
			const midScore = this.entries[mid].entry.score;
			if (midScore <= score) r = mid - 1;
			if (midScore > score) l = mid + 1;
		}
		return this.entries[l]?.entry.score <= score ? l : this.entries[r]?.entry.score <= score ? r : this.entries.length;
	}
};
//#endregion
export { LeaderboardHandler };
