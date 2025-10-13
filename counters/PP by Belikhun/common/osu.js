
function osuHasHit() {
	const hits = app.get("play.hits");

	if (!hits)
		return false;

	for (const value of Object.values(hits)) {
		if (value > 0)
			return true;
	}

	return false;
}

function getMinAcc() {
	const hits = app.get("play.hits");

	if (!hits)
		return 0;

	const {
		"0": c0,
		"50": c50,
		"100": c100,
		"300": c300,
		geki,
		katu
	} = hits;

	const accuracy = (app.get("play.mode.name") == "mania")
		? (300 * (geki + c300) + (200 * katu) + (100 * c100) + (50 * c50))
			/ (300 * getTotalObjects())
		: (300 * c300 + 100 * c100 + 50 * c50)
			/ (300 * getTotalObjects());

	if (isNaN(accuracy) || !isFinite(accuracy))
		return 0;

	return accuracy * 100;
}

function getTotalObjects() {
	const objects = app.get("beatmap.stats.objects");

	if (!objects)
		return 0;

	const { circles, holds, sliders, spinners } = objects;
	return circles + (holds * 2) + sliders + spinners;
}
