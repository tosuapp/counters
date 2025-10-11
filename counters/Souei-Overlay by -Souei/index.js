if (!window.COUNTER_PATH) {
	window.COUNTER_PATH = window.location.pathname;
}

let socket = new ReconnectingWebSocket('ws://127.0.0.1:24050/websocket/v2');
let socketPrecise = new ReconnectingWebSocket('ws://127.0.0.1:24050/websocket/v2/precise');
let socketCommands;

let bottom = document.getElementById('bottom');
let combo_container = document.getElementById('combo_container');
let combo_current = document.getElementById('combo_current');
let combo_suffix = document.getElementById('combo_suffix');
let pp_container = document.getElementById('pp_container');
let pp = document.getElementById('pp');
let pp_current = document.getElementById('pp_current');
let pp_separator = document.getElementById('pp_separator');
let pp_max = document.getElementById('pp_max');
let pp_suffix = document.getElementById('pp_suffix');
let h100 = document.getElementById('h100_count');
let h50 = document.getElementById('h50_count');
let h0 = document.getElementById('h0_count');
let sb = document.getElementById('sb_count');
let hit_counter_container = document.getElementById('hit_counter_container');
let menu_counter = document.getElementById('menu_counter');
let menu_pp_max = document.getElementById('menu_pp_max');
let keys = document.getElementById('keys');

let tempCombo,
	tempPP,
	tempMaxPP,
	tempH100,
	tempH50,
	tempH0,
	tempSB,
	tempKeys,
	tempMenuPP;
let combo_container_width, pp_container_width;

socket.onopen = () => {
	console.log('Successfully Connected');
};

socket.onclose = (event) => {
	console.log('Socket Closed Connection: ', event);
	socket.send('Client Closed!');
};

socket.onerror = (error) => {
	console.log('Socket Error: ', error);
};

socketPrecise.onopen = () => {
	console.log('Precise WebSocket Connected');
};

socketPrecise.onclose = (event) => {
	console.log('Precise Socket Closed Connection: ', event);
};

socketPrecise.onerror = (error) => {
	console.log('Precise Socket Error: ', error);
};

async function loadCustomFont(fontFileName) {
	if (!fontFileName) {
		console.log('No font specified, using default');
		return;
	}

	const fontName = fontFileName.replace(/\.(ttf|woff|woff2|otf)$/i, '');
	const extensions = ['woff2', 'woff', 'ttf', 'otf'];

	for (const ext of extensions) {
		const fontPath = `fonts/${fontName}.${ext}`;

		try {
			const fontFace = new FontFace('CustomFont', `url(${fontPath})`);
			const loadedFace = await fontFace.load();

			document.fonts.add(loadedFace);
			console.log(`Font loaded successfully: ${fontName}.${ext}`);

			const root = document.documentElement;
			root.style.setProperty('--mainFont', `'CustomFont', Arial, sans-serif`);
			return;
		} catch (error) {
			continue;
		}
	}

	console.warn(`Could not load font: ${fontName}. Using default.`);
}

function initSettingsWebSocket() {
	console.log('Initializing settings WebSocket with path:', window.COUNTER_PATH);
	socketCommands = new ReconnectingWebSocket(`ws://127.0.0.1:24050/websocket/commands?l=${encodeURI(window.COUNTER_PATH)}`);

	socketCommands.onopen = () => {
		console.log('Commands WebSocket Connected');
		socketCommands.send(`getSettings:${encodeURI(window.COUNTER_PATH)}`);
	};

	socketCommands.onclose = (event) => {
		console.log('Commands Socket Closed Connection: ', event);
	};

	socketCommands.onerror = (error) => {
		console.log('Commands Socket Error: ', error);
	};

	socketCommands.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			if (data.error != null) {
				console.error('[SETTINGS_ERROR]:', data.error);
				return;
			}

			if (data.message != null) {
				const message = data.message;
				const root = document.documentElement;

				if (message['MainFont'] != null) {
					loadCustomFont(message['MainFont']);
				}
				if (message['AccentColor'] != null) {
					root.style.setProperty('--accentColor', message['AccentColor']);
				}
				if (message['BackgroundColor'] != null) {
					root.style.setProperty('--backgroundColor', message['BackgroundColor']);
				}
				if (message['TextColor'] != null) {
					root.style.setProperty('--textColor', message['TextColor']);
				}
				if (message['Hit100Color'] != null) {
					root.style.setProperty('--hit100Color', message['Hit100Color']);
				}
				if (message['Hit50Color'] != null) {
					root.style.setProperty('--hit50Color', message['Hit50Color']);
				}
				if (message['Hit0Color'] != null) {
					root.style.setProperty('--hit0Color', message['Hit0Color']);
				}
				if (message['SliderBreakColor'] != null) {
					root.style.setProperty('--sliderBreakColor', message['SliderBreakColor']);
				}
				if (message['KeyColor'] != null) {
					root.style.setProperty('--keyColor', message['KeyColor']);
				}
				if (message['KeyPressedColor'] != null) {
					root.style.setProperty('--keyPressedColor', message['KeyPressedColor']);
				}
				if (message['KeyTileColor'] != null) {
					root.style.setProperty('--keyTileColor', message['KeyTileColor']);
				}
				if (message['URBarSpacing'] != null) {
					const spacing = parseFloat(message['URBarSpacing']);
					if (spacing >= 0.5 && spacing <= 5) {
						root.style.setProperty('--urBarSpacing', spacing);
					}
				}

				console.log('Settings applied successfully');
			}
		} catch (error) {
			console.error('[SETTINGS_PARSE_ERROR]:', error);
		}
	};
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initSettingsWebSocket);
} else {
	initSettingsWebSocket();
}

let animation = {
	combo_current: new CountUp('combo_current', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
		suffix: '',
	}),
	pp_current: new CountUp('pp_current', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
	}),
	pp_max: new CountUp('pp_max', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
		suffix: '',
	}),
	menu_pp_max: new CountUp('menu_pp_max', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
		suffix: '',
	}),
	h100: new CountUp('h100_count', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
		suffix: '',
	}),
	h50: new CountUp('h50_count', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
		suffix: '',
	}),
	h0: new CountUp('h0_count', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
		suffix: '',
	}),
	sb: new CountUp('sb_count', 0, 0, 0, 0.2, {
		useEasing: true,
		useGrouping: true,
		separator: ' ',
		decimal: '.',
		suffix: '',
	}),
	k1: new KeyOverlay('k1', 'k1Tiles', {
		speed: 0.4,
		keyTextId: 'k1Text',
	}),
	k2: new KeyOverlay('k2', 'k2Tiles', {
		speed: 0.4,
	}),
	m1: new KeyOverlay('m1', 'm1Tiles', {
		speed: 0.4,
	}),
	m2: new KeyOverlay('m2', 'm2Tiles', {
		speed: 0.4,
	}),
};

socket.onmessage = (event) => {
	let data = JSON.parse(event.data);
	let state = data.state.number;
	let play = data.play;
	let beatmap = data.beatmap;
	let performance = data.performance;

	if (state == 0) {
		bottom.style.opacity = 0;
		hit_counter_container.style.opacity = 0;
		menu_counter.style.opacity = 0;
		keys.style.opacity = 0;
	} else if (state == 2) {
		menu_counter.style.opacity = 0;
		bottom.style.opacity = 1;
		hit_counter_container.style.opacity = 1;
		keys.style.opacity = 1;
		let combo_length = 0;
		combo_length += play.combo.current.toString().length;
		combo_length *= 20;
		combo_length += 50;
		combo_container.style.width = combo_length + 'px';
		let pp_length = 0;
		pp_length += play.pp.current.toString().length;
		if (play.hits.sliderBreaks > 0 || play.hits[0] > 0) {
			pp_length += play.pp.fc.toString().length;
			pp_separator.style.opacity = '1';
			pp_separator.style.fontSize = '25px';
			pp_max.style.opacity = '1';
			pp_max.style.fontSize = '25px';
			pp_suffix.style.marginLeft = '0px';
		} else {
			pp_separator.style.opacity = '0';
			pp_separator.style.fontSize = '0px';
			pp_max.style.opacity = '0';
			pp_max.style.fontSize = '0px';
			pp_suffix.style.marginLeft = '-10px';
		}
		pp_length *= 20;
		pp_length += 65;
		pp_container.style.width = pp_length + 'px';
	} else if (state == 5) {
		bottom.style.opacity = 0;
		hit_counter_container.style.opacity = 0;
		menu_counter.style.opacity = 1;
		keys.style.opacity = 0;
	} else if (state == 7) {
		bottom.style.opacity = 0;
		hit_counter_container.style.opacity = 0;
		menu_counter.style.opacity = 0;
		keys.style.opacity = 0;
	} else {
		bottom.style.opacity = 0;
		hit_counter_container.style.opacity = 0;
		menu_counter.style.opacity = 1;
		keys.style.opacity = 0;
	}
	if (tempMaxPP !== play.pp.fc) {
		tempMaxPP = play.pp.fc;
		pp_max.innerHTML = tempMaxPP;
		animation.pp_max.update(pp_max.innerHTML);
	}
	if (tempH100 !== play.hits[100]) {
		tempH100 = play.hits[100];
		h100.innerHTML = tempH100;
		animation.h100.update(h100.innerHTML);
	}
	if (tempH50 !== play.hits[50]) {
		tempH50 = play.hits[50];
		h50.innerHTML = tempH50;
		animation.h50.update(h50.innerHTML);
	}
	if (tempH0 !== play.hits[0]) {
		tempH0 = play.hits[0];
		h0.innerHTML = tempH0;
		animation.h0.update(h0.innerHTML);
	}
	if (tempSB !== play.hits.sliderBreaks) {
		tempSB = play.hits.sliderBreaks;
		sb.innerHTML = tempSB;
		animation.sb.update(sb.innerHTML);
	}
	if (tempCombo !== play.combo.current) {
		tempCombo = play.combo.current;
		combo_current.innerHTML = tempCombo;
		animation.combo_current.update(combo_current.innerHTML);
	}
	if (tempPP !== play.pp.current) {
		tempPP = play.pp.current;
		pp_current.innerHTML = tempPP;
		animation.pp_current.update(pp_current.innerHTML);
	}
	if (tempMenuPP !== performance.accuracy[100]) {
		tempMenuPP = performance.accuracy[100];
		menu_pp_max.innerHTML = tempMenuPP;
		animation.menu_pp_max.update(menu_pp_max.innerHTML);
	}
};

socketPrecise.onmessage = (event) => {
	let preciseData = JSON.parse(event.data);
	if (preciseData.keys) {
		animation.k1.update(preciseData.keys.k1);
		animation.k2.update(preciseData.keys.k2);
		animation.m1.update(preciseData.keys.m1);
		animation.m2.update(preciseData.keys.m2);
	}
};
