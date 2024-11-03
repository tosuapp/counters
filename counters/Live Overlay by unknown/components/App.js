import background from './Background.js';
import lineChart from './LineChart.js';

function smooth(arr, windowSize, getter = (value) => value, setter) {
  const get = getter
  const result = []

  for (let i = 0; i < arr.length; i += 1) {
    const leftOffeset = i - windowSize
    const from = leftOffeset >= 0 ? leftOffeset : 0
    const to = i + windowSize + 1

    let count = 0
    let sum = 0
    for (let j = from; j < to && j < arr.length; j += 1) {
      sum += get(arr[j])
      count += 1
    }

    result[i] = setter ? setter(arr[i], sum / count) : sum / count
  }

  return result
}

const app = {
  name: 'App',
  components: {
    Background: background,
    Linechart: lineChart,
  },

  setup(props, context) {
    const data = Vue.reactive({
      tokens: {},
      rws: {},
      settings: {
        "chartColor": {
          "R": 255,
          "G": 178,
          "B": 227,
          "A": 80,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "50ffb2e3",
          "Value": null
        },
        "chartProgressColor": {
          "R": 255,
          "G": 178,
          "B": 227,
          "A": 140,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "8cffb2e3",
          "Value": null
        },
        "simulatePPWhenListening": true,
        "hideDiffText": false,
        "hideMapStats": false,
        "hideChartLegend": false,
        "font": "Arial",
        "chartHeight": 150,
        "backgroundColor": {
          "R": 0,
          "G": 0,
          "B": 0,
          "A": 255,
          "IsKnownColor": true,
          "IsEmpty": false,
          "IsNamedColor": true,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "Black",
          "Value": null
        },
        "imageDimColor": {
          "R": 0,
          "G": 0,
          "B": 0,
          "A": 102,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "66000000",
          "Value": null
        },
        "titleTextColor": {
          "R": 232,
          "G": 232,
          "B": 232,
          "A": 255,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "ffe8e8e8",
          "Value": null
        },
        "artistTextColor": {
          "R": 203,
          "G": 203,
          "B": 203,
          "A": 255,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "ffcbcbcb",
          "Value": null
        },
        "ppBackgroundColor": {
          "R": 0,
          "G": 0,
          "B": 0,
          "A": 102,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "66000000",
          "Value": null
        },
        "hit100BackgroundColor": {
          "R": 50,
          "G": 205,
          "B": 50,
          "A": 170,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "aa32cd32",
          "Value": null
        },
        "hit50BackgroundColor": {
          "R": 138,
          "G": 43,
          "B": 226,
          "A": 170,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "aa8a2be2",
          "Value": null
        },
        "hitMissBackgroundColor": {
          "R": 255,
          "G": 69,
          "B": 0,
          "A": 170,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "aaff4500",
          "Value": null
        },
        "ChartColor": {
          "R": 255,
          "G": 178,
          "B": 227,
          "A": 80,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "50ffb2e3",
          "Value": null
        },
        "ChartProgressColor": {
          "R": 255,
          "G": 178,
          "B": 227,
          "A": 140,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "8cffb2e3",
          "Value": null
        },
        "SimulatePPWhenListening": true,
        "HideDiffText": false,
        "HideMapStats": false,
        "HideChartLegend": false,
        "Font": "Arial",
        "ChartHeight": 150,
        "BackgroundColor": {
          "R": 0,
          "G": 0,
          "B": 0,
          "A": 255,
          "IsKnownColor": true,
          "IsEmpty": false,
          "IsNamedColor": true,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "Black",
          "Value": null
        },
        "ImageDimColor": {
          "R": 0,
          "G": 0,
          "B": 0,
          "A": 102,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "66000000",
          "Value": null
        },
        "TitleTextColor": {
          "R": 232,
          "G": 232,
          "B": 232,
          "A": 255,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "ffe8e8e8",
          "Value": null
        },
        "ArtistTextColor": {
          "R": 203,
          "G": 203,
          "B": 203,
          "A": 255,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "ffcbcbcb",
          "Value": null
        },
        "PpBackgroundColor": {
          "R": 0,
          "G": 0,
          "B": 0,
          "A": 102,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "66000000",
          "Value": null
        },
        "Hit100BackgroundColor": {
          "R": 50,
          "G": 205,
          "B": 50,
          "A": 170,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "aa32cd32",
          "Value": null
        },
        "Hit50BackgroundColor": {
          "R": 138,
          "G": 43,
          "B": 226,
          "A": 170,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "aa8a2be2",
          "Value": null
        },
        "HitMissBackgroundColor": {
          "R": 255,
          "G": 69,
          "B": 0,
          "A": 170,
          "IsKnownColor": false,
          "IsEmpty": false,
          "IsNamedColor": false,
          "IsSystemColor": false,
          "NameAndARGBValue": null,
          "Name": "aaff4500",
          "Value": null
        }
      },
    });

    const getToken = (tokenName, decimalPlaces) => _GetToken(data.rws, data.tokens, tokenName, decimalPlaces);
    //either request all tokens upfront by filling their names in array
    //or request them later using helper getToken method above
    data.rws = watchTokens(['mapStrains'], (values) => {
      Object.assign(data.tokens, values);
    });

    let mapStrains = Vue.computed(() => {
      const smoothedData = smooth(Object.entries(data.tokens.mapStrains || {}), 10, (value) => value[1], (original, smoothedValue) => [original[0], smoothedValue]);
      return smoothedData
    });
    let isMania = Vue.computed(() => getToken('gameMode') === 'OsuMania');
    let isPlayingOrWatching = Vue.computed(() =>
      _IsInStatus(data.rws, data.tokens, [window.overlay.osuStatus.Playing, window.overlay.osuStatus.ResultsScreen, window.overlay.osuStatus.Watching])
    );

    let ppValue = Vue.computed(() => {
      if (isPlayingOrWatching.value) return getToken('ppIfMapEndsNow', 1);
      if (data.settings.SimulatePPWhenListening) return getToken('simulatedPp', 1);
      return 0;
    });
    let mapProgress = Vue.computed(() => getToken('time') / (getToken('totaltime') / 1000));

    return {
      getToken,

      data,

      isPlayingOrWatching,
      isMania,
      mapStrains,
      ppValue,
      mapProgress,
    };
  },
  computed: {
    overlaySettings() {
      if (Object.keys(this.data.settings).length === 0) return {};
      let s = this.data.settings;

      return {
        backgroundColor: ColorFromDotNetColor(s.ChartColor),
        chartProgressColor: ColorFromDotNetColor(s.ChartProgressColor),
        imageDimColor: ColorFromDotNetColor(s.ImageDimColor),
        artistTextColor: ColorFromDotNetColor(s.ArtistTextColor),
        titleTextColor: ColorFromDotNetColor(s.TitleTextColor),
        ppBackgroundColor: ColorFromDotNetColor(s.PpBackgroundColor),
        hit100BackgroundColor: ColorFromDotNetColor(s.Hit100BackgroundColor),
        hit50BackgroundColor: ColorFromDotNetColor(s.Hit50BackgroundColor),
        hitMissBackgroundColor: ColorFromDotNetColor(s.HitMissBackgroundColor),
        yAxesFontColor: s.HideChartLegend ? 'transparent' : 'white',

        simulatePPWhenListening: s.SimulatePPWhenListening,
        hideDiffText: s.HideDiffText,
        hideMapStats: s.HideMapStats,
        hideChartLegend: s.HideChartLegend,

        chartHeight: s.ChartHeight,
      };
    },
    progressChartSettings() {
      return {
        backgroundColor: this.overlaySettings.chartProgressColor,
        yAxesFontColor: 'transparent',
      };
    },
    chartStyle() {
      if (Object.keys(this.overlaySettings).length === 0) return `height:200px`;
      return `height:${this.overlaySettings.chartHeight}px;`;
    },
    progressChartStyle() {
      return `clip-path: inset(0px ${100 - this.mapProgress * 100}% 0px 0px);`;
    },
    hitsStyle() {
      if (!this.overlaySettings.ppBackgroundColor) return ``;

      let { ppBackgroundColor: pp, hit100BackgroundColor: h100, hit50BackgroundColor: h50, hitMissBackgroundColor: hMiss } = this.overlaySettings;
      return `background: linear-gradient(to right, ${pp},${pp},${h100},${h100},${h50},${h50},${hMiss},${hMiss});`;
    },
  },
};
export default app;


