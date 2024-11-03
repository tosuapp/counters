import background from "./Background.js";

const app = {
  name: "App",
  components: {
    Background: background,
  },
  setup(props, context) {
    const data = Vue.reactive({
      tokens: {},
      rws: {},
    });

    const getToken = (tokenName, decimalPlaces) =>
      _GetToken(data.rws, data.tokens, tokenName, decimalPlaces);
    let isMania = Vue.computed(() => getToken("gameMode") === "OsuMania");
    let isPlayingOrWatching = Vue.computed(() =>
      _IsInStatus(data.rws, data.tokens, [
        window.overlay.osuStatus.Playing,
        window.overlay.osuStatus.Watching,
      ])
    );
    let Listening = Vue.computed(() =>
      _IsInStatus(data.rws, data.tokens, [window.overlay.osuStatus.Listening])
    );
    let ResultsScreen = Vue.computed(() =>
      _IsInStatus(data.rws, data.tokens, [
        window.overlay.osuStatus.ResultsScreen,
      ])
    );

    data.rws = watchTokens([], (values) => {
      Object.assign(data.tokens, values);
    });

    Vue.provide("SCTokens", {
      rws: data.rws,
      data,
      get tokens() {
        return this.data.tokens;
      },
      getToken,
    });

    let mapTime = Vue.computed(() => {
      let time = getToken("time") * 1000;
      return (
        Math.floor(time / 1000 / 60).pad() +
        ":" +
        Math.floor((time / 1000) % 60).pad()
      );
    });

    let mapTimePercent = Vue.computed(() =>
      ((getToken("time") / (getToken("totaltime") / 1000)) * 100).clamp(0, 100)
    );
    let fcing = Vue.computed(
      () => getToken("miss") === 0 && getToken("sliderBreaks") === 0
    );

    const radius = 30;
    const circumference = radius * Math.PI * 2;
    let progressStyle = Vue.computed(
      () =>
        `stroke-dashoffset: ${(1 - mapTimePercent.value / 100) * circumference
        }px`
    );
    let backingUR = 0;
    let lastTime = Number.MIN_SAFE_INTEGER;
    let computedUR = Vue.computed(() => {
      let ur = getToken("unstableRate");
      let time = getToken("time");
      console.log(time);
      if (time < 0.1) lastTime = time;

      if (isPlayingOrWatching && time > lastTime) {
        lastTime = time;
        return (backingUR = ur);
      }

      return backingUR;
    });
    return {
      getToken,
      isPlayingOrWatching,
      Listening,
      ResultsScreen,
      isMania,
      mapTime,
      mapTimePercent,
      progressStyle,
      osuGrade: window.overlay.osuGrade,
      fcing,
      computedUR,
    };
  },
};

export default app;
