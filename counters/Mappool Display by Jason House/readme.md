## Mappool Display by Jason House

<a href="https://osuck.link/redirect/https://files.osuck.link/tosu/Mappool Display by Jason House v1.0.zip" target="_blank"><img height="35" src="https://img.shields.io/badge/Download_PP_Counter-67A564?style=for-the-badge&logo=cloud&logoColor=white" /></a>  <a href="https://github.com/mas-alone" target="_blank"><img height="35" src="https://img.shields.io/badge/github-000000?style=for-the-badge&logo=github&logoColor=white" /></a>

|||
| ------------- | ------------- |
| For | ingame, obs-overlay |
| Compatible with | tosu |
| Size |  500x100 |

> For tournament mappool showcase. Supports all rulesets.

<img src="/.github/images/Mappool Display by Jason House.jpg" />

## How to use?
1. Edit the `amxmodx.json` file.
 - If has custom mappool. Just input "custom" in the json file
```
{
    "NM": [
        {
            "id": "custom",
            "skill":  "Consistency"
        }
    ]
}
```

2. Use [http://localhost:24050/Mappool Display by Jason House](http://localhost:24050/Mappool Display by Jason House)
 - If the custom beatmap is HD2. Then use [http://localhost:24050/Mappool Display by Jason House/?mod=hd2](http://localhost:24050/Mappool Display by Jason House/?mod=hd2)

> `amxmodx.json` Template here

```
{
    "NM": [
        {
            "id": 4809883,
            "skill":  "Consistency"
        },
        {
            "id": 4053455,
            "skill":  "Tech"
        },
        {
            "id": 3182197,
            "skill":  "Convert Jumps"
        }
    ],
    "HD": [
        {
            "id": 4268584,
            "skill":  "Low AR Reading"
        },
        {
            "id": 3570291,
            "skill":  "HD Jumps"
        }
    ],
    "HR": [
        {
            "id": 4564624,
            "skill": "Consistency"
        },
        {
            "id": 2244507,
            "skill": "Precision"
        }
    ],
    "DT": [
        {
            "id": 4366254,
            "skill": "Consistency"
        },
        {
            "id": 4610750,
            "skill": "Control"
        }
    ],
	"TB": [
        {
            "id": "custom",
            "skill": ""
        }
    ]
}
```
