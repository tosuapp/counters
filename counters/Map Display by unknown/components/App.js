import background from './Background.js';

const app = {
  name: 'App',
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
    //either request all tokens upfront by filling their names in array
    //or request them later using helper getToken method above
    data.rws = watchTokens([], (values) => {
        const array = Object.keys(values);

        for (let i = 0; i < array.length; i++) {
            const key = array[i];
            const value = values[key];

            if (typeof value == 'object') {
                if (JSON.stringify(data.tokens[key]) != JSON.stringify(value)) data.tokens[key] = value;
            }
            else if (data.tokens[key] != value) data.tokens[key] = value;
        };
    });

    const totalTime = Vue.computed(() => {
      const time = ApplyModsToTime(getToken('totaltime'), getToken('modsEnum'));
      return (
        Math.floor(time / 1000 / 60).pad() +
        ':' +
        Math.floor((time / 1000) % 60).pad()
      );
    });

    return {
      getToken,

      totalTime,
    };
  },
};

export default app;
