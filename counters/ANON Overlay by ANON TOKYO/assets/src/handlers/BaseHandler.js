//#region src/handlers/BaseHandler.ts
var BaseHandler = class {
	element = null;
	constructor(engine, { document = window.document, ...config }) {
		this.engine = engine;
		this.element = document.querySelector(config.id);
	}
	update(value, element = this.element) {
		if (!element) return;
		element.textContent = `${value ?? ""}`;
	}
};
//#endregion
export { BaseHandler as default };
