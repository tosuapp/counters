
/**
 * Calculate time windows
 * 
 * @param	{number}								od 
 * @param	{"osu" | "mania" | "taiko" | "catch"}	mode 
 * @param	{string[]}								mods
 */
function odToMs(od, mode, mods = []) {
	switch (mode) {
		case "osu": {
			if (mods.includes("EZ")) {
				od = od / 2;
			} else if (mods.includes("HR")) {
				od = Math.min(od * 1.4, 10);
			}

			return {
				hit300: 80 - 6 * od,
				hit100: 140 - 8 * od,
				hit50: 200 - 10 * od
			};
		}

		case "mania": {
			let windowMultiplier = 1;
			let hit300g = 16.5;

			if (mods.includes("EZ")) {
				od = od / 2;
				hit300g = 22.5;
			} else if (mods.includes("HR")) {
				windowMultiplier = 1.4;
				hit300g = 11.43;
			}

			return {
				hit300g,
				hit300: (64 - 3 * od) / windowMultiplier,
				hit200: (97 - 3 * od) / windowMultiplier,
				hit100: (127 - 3 * od) / windowMultiplier,
				hit50: (151 - 3 * od) / windowMultiplier
			};
		}

		case "taiko": {
			let modOd = od;
			let altTw = (od >= 5);

			if (mods.includes("EZ")) {
				modOd = od / 2;
			} else if (mods.includes("HR")) {
				modOd = Math.min(od * 1.4, 10);
				altTw = (modOd >= 5);
			}

			return {
				hit300: 50 - 3 * modOd,
				hit100: (altTw)
					? 120 - 8 * modOd
					: 110 - 6 * modOd,
				hit50: (altTw)
					? 135 - 8 * modOd
					: 120 - 5 * modOd
			}
		}
	}

	// Idk what is this...
	return {
		hit300: (159 - 12 * od) / 2,
		hit100: (279 - 16 * od) / 2,
		hit50: (399 - 20 * od) / 2
	}
}
