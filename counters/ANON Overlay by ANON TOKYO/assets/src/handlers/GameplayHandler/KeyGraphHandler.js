import { Item, List } from "../../../node_modules/linked-list/index.js";
//#region src/handlers/GameplayHandler/KeyGraphHandler.ts
var KeyArrayNode = class extends Item {
	constructor(data) {
		super();
		this.data = data;
	}
};
var KeyGraphHandler = class KeyGraphHandler {
	key1Array = new List();
	key2Array = new List();
	canvas = document.querySelector("#key-graph");
	static TIME_WINDOW = 500;
	_k1Color = "white";
	_k2Color = "white";
	constructor(engine) {
		requestAnimationFrame(() => {
			this.draw();
		});
		engine.register_jq(".keys?.k1?.isPressed?", (_, isPressed) => {
			this.processKeyInputs(this.key1Array, isPressed);
			const ele = document.querySelector("#k1-container");
			if (!ele) return;
			if (isPressed) ele.classList.add("pressed");
			else ele.classList.remove("pressed");
		});
		engine.register_jq(".keys?.k2?.isPressed?", (_, isPressed) => {
			this.processKeyInputs(this.key2Array, isPressed);
			const ele = document.querySelector("#k2-container");
			if (!ele) return;
			if (isPressed) ele.classList.add("pressed");
			else ele.classList.remove("pressed");
		});
	}
	processKeyInputs(list, isPressed) {
		const now = performance.now();
		const data = {
			timestamp: now,
			state: isPressed ? 1 : 0
		};
		while (list.head?.next?.data.timestamp && list.head.next.data.timestamp < now - KeyGraphHandler.TIME_WINDOW) {
			const newHead = list.head.next;
			const oldHead = list.head;
			newHead.prev = null;
			oldHead.next = null;
			oldHead.detach();
			list.head = newHead;
		}
		const newNode = new KeyArrayNode(data);
		list.append(newNode);
	}
	draw() {
		const now = performance.now();
		const context = this.canvas?.getContext("2d");
		if (!context) {
			requestAnimationFrame(() => {
				this.draw();
			});
			return;
		}
		context.clearRect(0, 0, 100, 45);
		let cur1 = this.key1Array.head;
		while (cur1 !== null) {
			if (cur1.data.state === 0) {
				cur1 = cur1.next;
				continue;
			}
			this.drawKey(1, now, cur1.data, cur1.next?.data, context);
			cur1 = cur1.next;
		}
		let cur2 = this.key2Array.head;
		while (cur2 !== null) {
			if (cur2.data.state === 0) {
				cur2 = cur2.next;
				continue;
			}
			this.drawKey(2, now, cur2.data, cur2.next?.data, context);
			cur2 = cur2.next;
		}
		requestAnimationFrame(() => {
			this.draw();
		});
	}
	drawKey(key, now, curr, next, context) {
		const rate = 100 / KeyGraphHandler.TIME_WINDOW;
		const distanceNext = (now - (next?.timestamp ?? now)) * rate;
		const distance = (now - curr.timestamp) * rate;
		context.beginPath();
		context.roundRect(100 - distance, key === 1 ? 0 : 25, distance - distanceNext, 20, 5);
		context.fillStyle = key === 1 && this._k1Color || key === 2 && this._k2Color || "white";
		context.fill();
		context.closePath();
	}
	updateColor(palette) {
		this._k1Color = palette.Muted?.hex ?? "white;";
		this._k2Color = palette.LightMuted?.hex ?? "white;";
	}
};
//#endregion
export { KeyGraphHandler as default };
