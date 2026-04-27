//#region src/utils.ts
var defaultTimingFunction = { duration: 250 };
var debounce = (fn, timeout = 3e3) => {
	let timeoutId = null;
	return (...args) => {
		if (timeoutId) clearTimeout(timeoutId);
		timeoutId = setTimeout(() => {
			fn(...args);
		}, timeout);
	};
};
var query = new URLSearchParams(window.location.search);
var getPlayerData = async (playerName, controller) => {
	return await (await fetch(`https://api.try-z.net/u/${playerName}`, { signal: controller.signal })).json();
};
//#endregion
export { debounce, defaultTimingFunction, getPlayerData, query };
