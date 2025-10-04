
const PPCounter = {
	init() {
		PPPanel.init();
		app.root.append(PPPanel.container);
		PPPanel.container.classList.add("full-size");

		app.onCommand("getSettings", (settings) => {
			PPPanel.settings(settings);
		});
	}
}

app.registerCounter(PPCounter);
