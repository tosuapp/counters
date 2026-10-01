
const DanUtilsCounter = {
	init() {
		DanUtilsPanel.init();
		app.root.append(DanUtilsPanel.container);
		DanUtilsPanel.container.classList.add("full-size");

		app.onCommand("getSettings", (settings) => {
			DanUtilsPanel.settings(settings);
		});
	}
}

app.registerCounter(DanUtilsCounter);
