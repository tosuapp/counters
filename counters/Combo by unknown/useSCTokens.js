//provides access to: rws - websocket client; tokens - object with current tokens; getToken - method for getting token values
const useSCTokens = (requiredTokensArray) => {
  let tokensObj = Vue.inject('SCTokens');
  tokensObj.rws.AddTokens(requiredTokensArray || []);

  return tokensObj;
};

export { useSCTokens };
