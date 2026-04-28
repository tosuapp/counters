import { Item, List } from "../../../deps/vendor.js";
//#region src/handlers/GameplayHandler/workers/CanvasWorker.ts?worker
function WorkerWrapper(options) {
	return new Worker("" + new URL("../../../workers/CanvasWorker.js", import.meta.url).href, {
		type: "module",
		name: options?.name
	});
}
//#endregion
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
	static TIME_WINDOW = 300;
	_k1Color = "white";
	_k2Color = "white";
	worker = new WorkerWrapper();
	constructor(engine) {
		const canvas = document.querySelector("#key-graph");
		if (!canvas) return;
		const offscreen = canvas.transferControlToOffscreen();
		this.worker.postMessage({
			type: "canvas",
			data: offscreen
		}, [offscreen]);
		engine.register_jq(".keys?.k1?.isPressed?", (_, isPressed) => {
			this.processKeyInputs(this.key1Array, isPressed);
			this.worker.postMessage({
				type: "arrayK1",
				data: {
					now: performance.now(),
					array: this.key1Array.toArray()
				}
			});
			const ele = document.querySelector("#k1-container");
			if (!ele) return;
			if (isPressed) ele.classList.add("pressed");
			else ele.classList.remove("pressed");
		});
		engine.register_jq(".keys?.k2?.isPressed?", (_, isPressed) => {
			this.processKeyInputs(this.key2Array, isPressed);
			this.worker.postMessage({
				type: "arrayK2",
				data: {
					now: performance.now(),
					array: this.key2Array.toArray()
				}
			});
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
	updateColor(palette) {
		this._k1Color = palette.Muted?.hex ?? "white;";
		this._k2Color = palette.LightMuted?.hex ?? "white;";
		this.worker.postMessage({
			type: "color",
			data: {
				k1Color: this._k1Color,
				k2Color: this._k2Color
			}
		});
	}
};
//#endregion
export { KeyGraphHandler };
