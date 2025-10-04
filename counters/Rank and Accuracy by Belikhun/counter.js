
const RankAndAccuracyCounter = {
	init() {
		RankAndAccuracyPanel.init();
		app.root.append(RankAndAccuracyPanel.container);
		RankAndAccuracyPanel.container.classList.add("full-size");

		app.onCommand("getSettings", (settings) => {
			RankAndAccuracyPanel.settings(settings);
		});
	}
}

app.registerCounter(RankAndAccuracyCounter);
