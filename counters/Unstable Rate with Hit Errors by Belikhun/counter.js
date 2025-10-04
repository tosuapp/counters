
const UnstableRateCounter = {
	init() {
		UnstableRatePanel.init();
		app.root.append(UnstableRatePanel.container);
		UnstableRatePanel.container.classList.add("full-size");

		app.onCommand("getSettings", (settings) => {
			UnstableRatePanel.settings(settings);
		});
	}
}

app.registerCounter(UnstableRateCounter);
