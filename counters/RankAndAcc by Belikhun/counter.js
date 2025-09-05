
const RankAndAccuracyCounter = {
	init() {
		RankAndAccuracyPanel.init();
		app.root.append(RankAndAccuracyPanel.container);
		RankAndAccuracyPanel.container.classList.add("full-size");
	}
}

app.registerCounter(RankAndAccuracyCounter);
