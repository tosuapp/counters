# HitDelay

In-game early/late feedback for **osu!stable standard and mania** using tosu's
official in-game renderer. This counter contains only web assets. No private
renderer archive, native sidecar, installer, additional memory reader or OBS
window is required.

## Set up

Validated with tosu 4.26.3 and its matching official in-game overlay component.
Place this entire folder in tosu's `static` directory, then select **HitDelay by
HitDelay** in the in-game overlay editor. Set its canvas to the **actual game
rendering resolution**, position `(0, 0)` and scale `1`. Do not resize it to the
small area occupied by the cue: circle following and skin-relative mania
placement use the full game coordinate space.

Start with osu!'s **Optimal** frame limiter and a **30 FPS overlay cap**. The
overlay cap is separate from the game's frame rate. The renderer uses the
official shared-texture GPU path; a full-size logical canvas does not mean a
full CPU bitmap upload on every hit.

Open `configure.html` in this folder through tosu. Its preview is synthetic by
default; switch to the live preview to inspect the currently selected skin.
Press **保存到 tosu** to save. Settings can also be changed in tosu's dashboard.

## Controls

| Setting                            | Meaning                                                   |
| ---------------------------------- | --------------------------------------------------------- |
| 中文快慢提示                       | Use 快/慢 instead of F/S or custom labels                 |
| 反向快慢文字                       | Reverse the text independently of the signed timing error |
| 交换快慢颜色                       | Swap early/late colours                                   |
| osu! / osu!mania timing tiers      | Select which estimated judgement tiers show cues          |
| 评分图片也染色                     | Tint the skin artwork; off preserves its original colours |
| mania horizontal / vertical offset | Move the cue relative to the skin's judgement position    |

In mania, the most recent cue replaces the existing cue in one fixed slot; it
does not enqueue previous results. The default vertical offset is `-96` at
1080p, above the skin's judgement. Missing artwork falls back to text.

## How it works

One filtered `/websocket/v2/precise` connection supplies hit errors and carries
settings commands. Context comes from a serial HTTP `/json/v2` request on the
same tosu origin: approximately every 40 ms while playing and 250 ms when idle.
A changed timing packet wakes an idle context request immediately. The context
request has a short deadline; disconnects, expired requests, pauses, retries and
results clear or rebaseline feedback instead of replaying a backlog.

The settings page owns one connection and relays data to its preview iframe.
The preview does not open another socket. Settings refreshes with unchanged
values do not clear a visible cue. Browser settings use a separate storage key
from the earlier experimental HitDelay build.

For standard-mode circle following, the map clock and offsets come from the
same HTTP snapshot. Only uniquely matched circles are labelled. Mania uses
the precise stream directly after context has been established.

## Limits

- `≈100` and similar labels are timing-window estimates, not final slider,
  spinner, hold-note, geki or katu judgements. Misses do not have an early/late
  direction. Anonymous timing errors do not identify a mania lane or hold.
- Standard mode skips sliders, spinners, ambiguous matches and unsupported old
  stacking layouts. Custom letterbox offsets have not been calibrated.
- This supports stable standard and mania; it does not claim lazer, taiko or
  catch support. Actual latency depends on the game, tosu, renderer and system.
- This is an independent counter. Acceptance in this repository is separate
  from osu! gameplay-policy approval; no approval or ban guarantee is claimed.

The source is MIT licensed. Skin and beatmap assets remain on the user's
machine and are not distributed with the counter.
