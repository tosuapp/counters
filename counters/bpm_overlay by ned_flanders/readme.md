# BPM Graph Overlay

An osu! key BPM graph for tosu overlays.

The overlay draws a live BPM graph from the player's keypresses and compares it with a calculated perfect-play BPM line from the current beatmap.

K1 and K2 presses are combined into one Player line. The overlay converts combined keypress intervals to the BPM values osu! players usually use, then averages over the latest keypresses.

The yellow Perfect line is calculated from the beatmap hit object start times using the same rolling BPM method. Mod rate is applied, so DT, NC, and custom rate changes stay aligned with the Player line.

The graph uses a moving timeline window instead of always showing the full map. This keeps longer maps readable and reduces visual spikes. The current time marker keeps a small amount of future timeline visible ahead of it.

The y-axis max is based on the Perfect line, not player spikes, so the graph height stays stable during gameplay. If the Player line goes above the graph max, it continues off the top instead of flattening.

The graph stays visible on the results screen and resets when the beatmap changes or the live time jumps backwards.

Settings are available in tosu for line colors, graph colors, text/background colors, rolling average note count, timeline window length, y-axis curve, and y-axis headroom.
