## Mappool Display by Jason House

<a href="https://osuck.link/redirect/https://files.osuck.link/tosu/mappool display by jason house v1.01.zip" target="_blank"><img height="35" src="https://img.shields.io/badge/Download_PP_Counter-67A564?style=for-the-badge&logo=cloud&logoColor=white" /></a>  <a href="https://github.com/mas-alone" target="_blank"><img height="35" src="https://img.shields.io/badge/github-000000?style=for-the-badge&logo=github&logoColor=white" /></a>

|||
| ------------- | ------------- |
| For | obs-overlay |
| Compatible with | tosu |
| Size |  400x106 |


<img src="/.github/images/mappool display by jason house.png" /> <img src="/.github/images/mappool display by jason house1.png" />

## How to use?
1. Edit the settings.
 - If has custom mappool. Just input "custom" in the settings
```
4809883,Consistency
custom,Tech
3182197
```
<img width="1353" height="786" alt="QQ20250713-141208" src="https://github.com/user-attachments/assets/af7d629d-103a-41cc-904e-21e9c8e507a7" />

2. Use [http://localhost:24050/Mappool Display by Jason House](<http://localhost:24050/Mappool Display by Jason House>) in OBS

## Multiple custom beatmaps?
1. If the custom beatmap is [**HD2 AND HR1**].
 - Use [http://localhost:24050/Mappool Display by Jason House/?mod=HD2](<http://localhost:24050/Mappool Display by Jason House/?mod=HD2>) in OBS
 - It will automatically determine the current BeatmapID of osu!. If it does not match the content in your settings.json, it will show the part of `?mod=xxx` in the url.

2. After the HD2 ends, simply replace the ?mod=HD2 in the URL with ?mod=HR1(Next custom beatmap)

------------

**Settings Template should be:**
```
[Mapid],[Skill] ← line break
[Mapid],[Skill]
```
*(Each line is one entry. `[Skill]` is optional.)*
