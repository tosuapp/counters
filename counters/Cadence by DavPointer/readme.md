# Cadence by DavPointer

**A compact live pp overlay for osu!, built for tosu.**

Cadence shows the live pp of the current play, the hit counts and a progress bar in a small card.
It connects to tosu's v2 websocket with a filtered stream, keeps a single connection and has no
external assets or polling.

## Features

- Live pp with optional smooth glide and a flash when the value drops.
- Hit counts for 300s, 100s, 50s and misses, each on its own coloured chip.
- Progress bar filled up to the last object of the map.
- FC border that reacts to misses and slider breaks.
- Song-select readout: with `Show only while playing` off, the card shows what the selected map is
  worth at 100% accuracy with the current mods.
- 34 settings in the tosu dashboard, including scale, colours, card, slide and visibility.
- One filtered WebSocket connection; no `/json` polling and no external dependencies.

## Install

### From the tosu dashboard

1. Open the tosu dashboard at **http://127.0.0.1:24050**.
2. Find **Cadence** in the counter list and click **Download**.
3. Add a **Browser source** in OBS with this URL:

   ```text
   http://127.0.0.1:24050/Cadence%20by%20DavPointer/
   ```

4. Set the source size to **480 x 140** and leave *Shutdown source when not visible* **off**, so the
   overlay keeps its state when you switch scenes.

### Manually

Copy this folder into tosu's `static` directory, so the path is
`tosu/static/Cadence by DavPointer/`, then add the browser source as above. The dashboard reads the
counter's `metadata.txt` and `settings.json` automatically.

## Settings

The settings cover:

- **What it shows** - live pp, misses, 50s, 100s, 300s, progress bar and decimals.
- **Type and colors** - font family and size, text and unit colours, glow, hit-count colours and
  progress colours.
- **Card** - card background, tint, opacity and corner radius.
- **Slide** - entrance side, duration, live-pp smoothing and smoothing time.
- **Feedback** - flash on pp loss and the FC border.
- **Visibility** - show only while playing, hide while paused, keep on the results screen and scale.

`Show only while playing` is on by default. Turn it off if you want the card visible between maps;
in the song select it then shows the selected map's 100% pp instead of an empty play.

## Technical notes

- The counter uses the `applyFilters` command on tosu's v2 websocket and asks only for the fields it
  draws.
- If tosu restarts, the connection reopens with a backoff of up to 10 seconds.
- The layout is responsive to the `Scale` setting, from 1x to 2x in steps of 0.25.
- The counter has no network requests other than the local tosu websocket.

## License

MIT - see [LICENSE](LICENSE). Cadence is free to use, change and share; keep the copyright notice
with it.
