
/**
 * Tier a global rank sits in, used to colour the number.
 *
 * Player counts are the estimates from
 * https://github.com/ppy/osu-web/pull/12483
 *
 * @param	{number}								rank
 * @param	{"osu" | "taiko" | "fruits" | "mania"}	mode
 * @returns	{string}
 */
function rankTier(rank, mode = "osu") {
	if (rank <= 100)
		return "lustrous";

	const players = {
		osu: 2600000,
		taiko: 340000,
		fruits: 250000,
		mania: 870000
	}[mode] || 2600000;

	const percent = (rank / players) * 100;

	if (percent <= 0.05)
		return "radiant";

	if (percent <= 0.15)
		return "rhodium";

	if (percent <= 0.5)
		return "platinum";

	if (percent <= 1.5)
		return "gold";

	if (percent <= 5)
		return "silver";

	if (percent <= 15)
		return "bronze";

	return "iron";
}
