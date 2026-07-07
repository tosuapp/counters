# BPM Graph Overlay

An osu! key BPM graph for tosu/gosu overlays.

The graph converts combined keypress intervals to the BPM naming osu! players usually use, then averages over the latest 10 samples.

K1 and K2 presses are combined into one green Player line across the first-to-last-note duration. The yellow Perfect line is calculated from the beatmap hit object start times using the same rolling BPM method, with mod rate applied.

The graph resets when the beatmap changes or the live time jumps backwards.

Settings are available in tosu for line colors, graph colors, text/background colors, and the rolling average note count.
