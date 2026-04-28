//#region node_modules/@fukutotojido/z-engine/dist/index.js
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_scanner = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Scanner = void 0;
	function testWithString(target, pattern) {
		return target.startsWith(pattern) ? [pattern] : [];
	}
	function testWithRegExp(target, pattern) {
		const result = pattern.exec(target);
		if (!result) return [];
		return result;
	}
	class Scanner {
		constructor(target, trim = true) {
			this.target = target;
			if (trim) this.trimWhitespaces();
		}
		scan(pattern, trim = true) {
			const [matched, ...groups] = typeof pattern === "string" ? testWithString(this.target, pattern) : testWithRegExp(this.target, pattern);
			if (!matched) return null;
			this.target = this.target.substring(matched.length);
			if (trim) this.trimWhitespaces();
			return [matched, ...groups];
		}
		trimWhitespaces() {
			this.target = this.target.replace(/^\s+/, "");
		}
	}
	exports.Scanner = Scanner;
});
var require_stmt = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Statements = exports.isExprStatement = exports.ExprStatement = exports.DefFuncStatement = void 0;
	class DefFuncStatement {
		constructor(name) {
			this.name = name;
		}
		dump() {
			return { deffun: this.name };
		}
	}
	exports.DefFuncStatement = DefFuncStatement;
	class ExprStatement {
		constructor(expr) {
			this.expr = expr;
		}
		dump() {
			return { expr: this.expr.dump() };
		}
	}
	exports.ExprStatement = ExprStatement;
	function isExprStatement(stmt) {
		return "expr" in stmt;
	}
	exports.isExprStatement = isExprStatement;
	class Statements {
		constructor() {
			this.stmts = [];
		}
		push(stmt) {
			this.stmts.push(stmt);
		}
		dump() {
			return { statements: this.stmts.map((stmt) => stmt.dump()) };
		}
	}
	exports.Statements = Statements;
});
var require_expr = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.OptionalExpr = exports.FilteredExpr = exports.ParallelExpr = exports.BinaryOperatorExpr = exports.IndexedExpr = exports.SpreadIndexer = exports.KeyIndexer = exports.RangeIndexer = exports.ObjectExpr = exports.Field = exports.ArrayExpr = exports.isIdentityExpr = exports.IdentityExpr = exports.RecursiveDescendantExpr = exports.IdExpr = exports.FunctionCallExpr = exports.StringLiteralExpr = exports.LiteralExpr = void 0;
	class LiteralExpr {
		constructor(value) {
			this.value = value;
		}
		dump() {
			return this.value;
		}
	}
	exports.LiteralExpr = LiteralExpr;
	class StringLiteralExpr {
		constructor(parts) {
			this.parts = parts;
		}
		get value() {
			return this.parts.join();
		}
		dump() {
			return this.value;
		}
	}
	exports.StringLiteralExpr = StringLiteralExpr;
	class FunctionCallExpr {
		constructor(funcname, args) {
			this.funcname = funcname;
			this.args = args;
		}
		dump() {
			return { call: { [this.funcname]: this.args } };
		}
	}
	exports.FunctionCallExpr = FunctionCallExpr;
	class IdExpr {
		constructor(value) {
			this.value = value;
		}
		dump() {
			return { id: this.value };
		}
	}
	exports.IdExpr = IdExpr;
	class RecursiveDescendantExpr {
		dump() {
			return { recursiveDescendant: 0 };
		}
	}
	exports.RecursiveDescendantExpr = RecursiveDescendantExpr;
	class IdentityExpr {
		constructor() {
			this.identity = true;
		}
		dump() {
			return { identity: 0 };
		}
	}
	exports.IdentityExpr = IdentityExpr;
	function isIdentityExpr(expr) {
		return "identity" in expr;
	}
	exports.isIdentityExpr = isIdentityExpr;
	class ArrayExpr {
		constructor() {
			this.elements = [];
		}
		push(expr) {
			this.elements.push(expr);
		}
		dump() {
			return { array: this.elements.map((x) => x.dump()) };
		}
	}
	exports.ArrayExpr = ArrayExpr;
	class Field {
		constructor(key, value = null) {
			this.key = key;
			this.value = value;
		}
		dump() {
			var _a;
			return {
				key: this.key.dump(),
				value: (_a = this.value) === null || _a === void 0 ? void 0 : _a.dump()
			};
		}
	}
	exports.Field = Field;
	class ObjectExpr {
		constructor() {
			this.fields = [];
		}
		push(field) {
			this.fields.push(field);
		}
		dump() {
			return { object: this.fields.map((x) => x.dump()) };
		}
	}
	exports.ObjectExpr = ObjectExpr;
	class RangeIndexer {
		constructor(first, last = null) {
			this.first = first;
			this.last = last;
		}
		dump() {
			if (this.first) if (this.last) return [this.first.dump(), this.last.dump()];
			else return [this.first.dump(), "last"];
			else if (this.last) return ["start", this.last.dump()];
		}
	}
	exports.RangeIndexer = RangeIndexer;
	class KeyIndexer {
		constructor(key) {
			this.key = key;
		}
		dump() {
			return { key: this.key };
		}
	}
	exports.KeyIndexer = KeyIndexer;
	class SpreadIndexer {
		dump() {
			return { spread: 0 };
		}
	}
	exports.SpreadIndexer = SpreadIndexer;
	class IndexedExpr {
		constructor(expr, indexer, isOptional) {
			this.expr = expr;
			this.indexer = indexer;
			this.isOptional = isOptional;
		}
		dump() {
			return {
				indexing: this.expr.dump(),
				indexer: this.indexer.dump(),
				isOptional: this.isOptional
			};
		}
	}
	exports.IndexedExpr = IndexedExpr;
	class BinaryOperatorExpr {
		constructor(op, lhs, rhs) {
			this.op = op;
			this.lhs = lhs;
			this.rhs = rhs;
		}
		dump() {
			var _a, _b;
			return { [this.op]: [(_a = this.lhs) === null || _a === void 0 ? void 0 : _a.dump(), (_b = this.rhs) === null || _b === void 0 ? void 0 : _b.dump()] };
		}
	}
	exports.BinaryOperatorExpr = BinaryOperatorExpr;
	class ParallelExpr {
		constructor() {
			this.exprs = [];
		}
		push(expr) {
			this.exprs.push(expr);
		}
		dump() {
			var _a;
			if (this.exprs.length < 2) return (_a = this.exprs[0]) === null || _a === void 0 ? void 0 : _a.dump();
			return { parallel: this.exprs.map((x) => x.dump()) };
		}
	}
	exports.ParallelExpr = ParallelExpr;
	class FilteredExpr {
		constructor() {
			this.exprs = [];
		}
		push(expr) {
			this.exprs.push(expr);
		}
		dump() {
			var _a;
			if (this.exprs.length < 2) return (_a = this.exprs[0]) === null || _a === void 0 ? void 0 : _a.dump();
			return { filtered: this.exprs.map((x) => x.dump()) };
		}
	}
	exports.FilteredExpr = FilteredExpr;
	class OptionalExpr {
		constructor(expr) {
			this.expr = expr;
		}
		dump() {
			optional: this.expr.dump();
		}
	}
	exports.OptionalExpr = OptionalExpr;
});
var require_parser = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.parse = void 0;
	var stmt_1 = require_stmt();
	var expr_1 = require_expr();
	class ParseError extends Error {}
	function parseFunctionDefinition(scanner) {
		if (scanner.target.length > 0) {
			if (scanner.scan("def")) throw new ParseError(`not supported: user-defined funtions`);
		}
		return null;
	}
	function parseNumberLiteral(scanner) {
		const result = scanner.scan(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
		if (result) return new expr_1.LiteralExpr(parseFloat(result[0]));
		else return null;
	}
	function parseBooleanLiteral(scanner) {
		if (scanner.scan("true")) return new expr_1.LiteralExpr(true);
		if (scanner.scan("false")) return new expr_1.LiteralExpr(false);
		return null;
	}
	function parseStringLiteral(scanner) {
		var _a, _b;
		const [quote] = (_a = scanner.scan(/^('|")/, false)) !== null && _a !== void 0 ? _a : [];
		if (!quote) return null;
		const parts = [];
		const pattern = new RegExp(`^[^${quote}\\\\]*`);
		while (scanner.target.length > 0) {
			const [part] = (_b = scanner.scan(pattern, false)) !== null && _b !== void 0 ? _b : [];
			if (part) parts.push(part);
			if (scanner.scan(quote)) return new expr_1.StringLiteralExpr(parts);
			if (scanner.scan("\\", false)) throw new ParseError(`escape sequence is not supported yet: ${scanner.target}`);
		}
		throw new ParseError(`cannot find closing ${quote}`);
	}
	function parseIdentifier(scanner) {
		var _a;
		const [id] = (_a = scanner.scan(/^[a-zA-Z_][a-zA-Z_0-9]*/)) !== null && _a !== void 0 ? _a : [];
		if (id) return new expr_1.IdExpr(id);
		return null;
	}
	function parseDoulbeDot(scanner) {
		if (scanner.scan("..")) return new expr_1.RecursiveDescendantExpr();
		return null;
	}
	function parseDot(scanner) {
		if (scanner.scan(".")) return new expr_1.IdentityExpr();
		return null;
	}
	function parseArrayElement(scanner) {
		const first = parseStandaloneExpression(scanner);
		if (!first) return null;
		const root = new expr_1.FilteredExpr();
		root.push(first);
		while (scanner.target.length > 0) {
			if (!scanner.scan("|")) break;
			const next = parseStandaloneExpression(scanner);
			if (!next) throw new ParseError(`missing right side expression right of '|': ${scanner.target}`);
			root.push(next);
		}
		return root;
	}
	function parseArrayExpr(scanner) {
		if (!scanner.scan("[")) return null;
		const expr = new expr_1.ArrayExpr();
		const first = parseArrayElement(scanner);
		if (!first) {
			if (scanner.scan("]")) return expr;
			throw new ParseError(`missing closing bracket: ${scanner.target}`);
		}
		expr.push(first);
		while (scanner.target.length > 0) {
			if (scanner.scan("]")) return expr;
			if (!scanner.scan(",")) throw new ParseError(`missing comma in array: ${scanner.target}`);
			const elem = parseArrayElement(scanner);
			if (!elem) throw new ParseError(`missing closing bracket: ${scanner.target}`);
			expr.push(elem);
		}
		if (!scanner.scan("]")) throw new ParseError(`missing closing bracket: ${scanner.target}`);
		return expr;
	}
	function parseObjectFieldKey(scanner) {
		const grp = parseGroupExpr(scanner);
		if (grp) return grp;
		const str = parseStringLiteral(scanner);
		if (str) return str;
		const id = parseIdentifier(scanner);
		if (id) return id;
		return null;
	}
	function parseObjectField(scanner) {
		const key = parseObjectFieldKey(scanner);
		if (!key) throw new ParseError(`missing field key: ${scanner.target}`);
		if (!scanner.scan(":")) return new expr_1.Field(key);
		const value = parseFilteredExpression(scanner, false);
		if (!value) throw new ParseError(`missing field value: ${scanner.target}`);
		return new expr_1.Field(key, value);
	}
	function parseObjectExpr(scanner) {
		if (!scanner.scan("{")) return null;
		const expr = new expr_1.ObjectExpr();
		if (scanner.scan("}")) return expr;
		const first = parseObjectField(scanner);
		if (!first) throw new ParseError(`missing closing brace: ${scanner.target}`);
		expr.push(first);
		while (scanner.target.length > 0) {
			if (scanner.scan("}")) return expr;
			if (!scanner.scan(",")) throw new ParseError(`missing comma in object: ${scanner.target}`);
			const field = parseObjectField(scanner);
			if (!field) throw new ParseError(`missing closing brace: ${scanner.target}`);
			expr.push(field);
		}
		throw new ParseError(`missing closing brace: ${scanner.target}`);
	}
	function parseGroupExpr(scanner) {
		if (!scanner.scan("(")) return null;
		const expr = parseExpression(scanner);
		if (!scanner.scan(")")) throw new ParseError(`missing closing paren: ${scanner.target}`);
		return expr;
	}
	function parseFunctionCall(scanner) {
		const id = parseIdentifier(scanner);
		if (!id) return null;
		const args = [];
		if (scanner.scan("(")) {
			for (;;) {
				const arg = parseExpression(scanner);
				if (!arg) break;
				args.push(arg);
				if (scanner.scan(";")) continue;
			}
			if (!scanner.scan(")")) throw new ParseError(`missing closing paren: ${scanner.target}`);
		}
		return new expr_1.FunctionCallExpr(id.value, args);
	}
	function parsePrimitiveExpression(scanner) {
		const grp = parseGroupExpr(scanner);
		if (grp) return grp;
		const ary = parseArrayExpr(scanner);
		if (ary) return ary;
		const obj = parseObjectExpr(scanner);
		if (obj) return obj;
		const str = parseStringLiteral(scanner);
		if (str) return str;
		const bool = parseBooleanLiteral(scanner);
		if (bool) return bool;
		const num = parseNumberLiteral(scanner);
		if (num) return num;
		const call = parseFunctionCall(scanner);
		if (call) {
			if (call.funcname == "null") return new expr_1.LiteralExpr(null);
			return call;
		}
		const recursive = parseDoulbeDot(scanner);
		if (recursive) return recursive;
		const dot = parseDot(scanner);
		if (dot) return dot;
		return null;
	}
	function parseArrayLikeIndexer(scanner) {
		if (scanner.target.length == 0) return null;
		if (!scanner.scan("[")) return null;
		const start = parseExpression(scanner);
		const isRange = scanner.scan(":");
		const last = isRange ? parseExpression(scanner) : null;
		if (!scanner.scan("]")) throw new ParseError(`no closing bracket: ${scanner.target}`);
		if (isRange) return new expr_1.RangeIndexer(start, last);
		else if (start === null) return new expr_1.SpreadIndexer();
		else return new expr_1.KeyIndexer(start);
	}
	function parseDotIndexer(scanner) {
		if (scanner.target.length == 0) return null;
		const str = parseStringLiteral(scanner);
		if (str) return new expr_1.KeyIndexer(str);
		const id = parseIdentifier(scanner);
		if (id) return new expr_1.KeyIndexer(id);
		return null;
	}
	function parseIndexer(scanner) {
		if (scanner.target.length > 0) {
			const arrayIndexer = parseArrayLikeIndexer(scanner);
			if (arrayIndexer) return arrayIndexer;
			if (!scanner.scan(".")) return null;
			const dotIndexer = parseDotIndexer(scanner);
			if (dotIndexer) return dotIndexer;
			throw new ParseError(`no valid key: ${scanner.target}`);
		}
		return null;
	}
	function parseIndexedExpr(scanner) {
		if (scanner.target.length > 0) {
			let lhs = parsePrimitiveExpression(scanner);
			if (!lhs) return null;
			if (expr_1.isIdentityExpr(lhs)) {
				const indexer = parseDotIndexer(scanner);
				if (indexer) lhs = new expr_1.IndexedExpr(lhs, indexer, false);
			}
			if (scanner.scan("?")) lhs = new expr_1.OptionalExpr(lhs);
			while (scanner.target.length > 0) {
				const indexer = parseIndexer(scanner);
				if (!indexer) break;
				lhs = new expr_1.IndexedExpr(lhs, indexer, false);
				if (scanner.scan("?")) lhs = new expr_1.OptionalExpr(lhs);
			}
			return lhs;
		}
		return null;
	}
	function parseMultiplicativeExpr(scanner) {
		let lhs = null;
		let op = null;
		while (scanner.target.length > 0) {
			const subexpr = parseIndexedExpr(scanner);
			if (!subexpr) break;
			if (lhs && op) {
				lhs = new expr_1.BinaryOperatorExpr(op, lhs, subexpr);
				op = null;
			} else lhs = subexpr;
			const result = scanner.scan(/^(\*|\/(?!\/)|%)/);
			if (!result) break;
			op = result[0];
		}
		return lhs;
	}
	function parseAdditiveExpr(scanner) {
		let lhs = null;
		let op = null;
		while (scanner.target.length > 0) {
			const subexpr = parseMultiplicativeExpr(scanner);
			if (!subexpr) break;
			if (lhs && op) {
				lhs = new expr_1.BinaryOperatorExpr(op, lhs, subexpr);
				op = null;
			} else lhs = subexpr;
			const result = scanner.scan(/^(\+|\-)/);
			if (!result) break;
			op = result[0];
		}
		return lhs;
	}
	function parseComparativeExpr(scanner) {
		let lhs = null;
		let op = null;
		while (scanner.target.length > 0) {
			const subexpr = parseAdditiveExpr(scanner);
			if (!subexpr) break;
			if (lhs && op) {
				lhs = new expr_1.BinaryOperatorExpr(op, lhs, subexpr);
				op = null;
			} else lhs = subexpr;
			const result = scanner.scan(/^(==|!=|<=|<|>=|>)/);
			if (!result) break;
			op = result[0];
		}
		return lhs;
	}
	function parseLogicalAndExpr(scanner) {
		let lhs = null;
		while (scanner.target.length > 0) {
			const subexpr = parseComparativeExpr(scanner);
			if (!subexpr) break;
			if (lhs) lhs = new expr_1.BinaryOperatorExpr("and", lhs, subexpr);
			else lhs = subexpr;
			if (!scanner.scan("and")) break;
		}
		return lhs;
	}
	function parseLogicalOrExpression(scanner) {
		let lhs = null;
		while (scanner.target.length > 0) {
			const subexpr = parseLogicalAndExpr(scanner);
			if (!subexpr) break;
			if (lhs) lhs = new expr_1.BinaryOperatorExpr("or", lhs, subexpr);
			else lhs = subexpr;
			if (!scanner.scan("or")) break;
		}
		return lhs;
	}
	function parseArithmeticExpression(scanner) {
		return parseLogicalOrExpression(scanner);
	}
	function parseAlternativeExpression(scanner) {
		let lhs = null;
		while (scanner.target.length > 0) {
			const subexpr = parseArithmeticExpression(scanner);
			if (!subexpr) break;
			if (lhs) lhs = new expr_1.BinaryOperatorExpr("//", lhs, subexpr);
			else lhs = subexpr;
			if (!scanner.scan("//")) break;
		}
		return lhs;
	}
	function parseStandaloneExpression(scanner) {
		return parseAlternativeExpression(scanner);
	}
	function parseParallelExpression(scanner) {
		const first = parseStandaloneExpression(scanner);
		if (!first) return null;
		const root = new expr_1.ParallelExpr();
		root.push(first);
		while (scanner.target.length > 0) {
			if (!scanner.scan(",")) break;
			const next = parseStandaloneExpression(scanner);
			if (!next) throw new ParseError(`missing expr right side of ',': ${scanner.target}`);
			root.push(next);
		}
		return root;
	}
	function parseFilteredExpression(scanner, allowParallel = true) {
		const first = allowParallel ? parseParallelExpression(scanner) : parseStandaloneExpression(scanner);
		if (!first) return null;
		const root = new expr_1.FilteredExpr();
		root.push(first);
		while (scanner.target.length > 0) {
			if (!scanner.scan("|")) break;
			const next = allowParallel ? parseParallelExpression(scanner) : parseStandaloneExpression(scanner);
			if (!next) throw new ParseError(`missing expr right side of '|': ${scanner.target}`);
			root.push(next);
		}
		return root;
	}
	function parseExpression(scanner) {
		return parseFilteredExpression(scanner);
	}
	function parseStatement(scanner) {
		if (scanner.target.length > 0) {
			const deffun = parseFunctionDefinition(scanner);
			if (deffun) return deffun;
			const expr = parseExpression(scanner);
			if (expr) return new stmt_1.ExprStatement(expr);
		}
		return null;
	}
	function parseStatements(scanner) {
		const stmts = new stmt_1.Statements();
		while (scanner.target.length > 0) {
			const stmt = parseStatement(scanner);
			if (!stmt) break;
			stmts.push(stmt);
			if (!scanner.scan(";")) break;
		}
		if (scanner.target.length > 0) throw new ParseError(`cannot parse whole pattern: consumed = ${JSON.stringify(stmts.dump())} rest = <${scanner.target}>`);
		return stmts;
	}
	function parse(scanner) {
		return parseStatements(scanner);
	}
	exports.parse = parse;
});
var require_context = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ContextWithTarget = exports.Context = exports.isJsonMap = void 0;
	function isJsonMap(x) {
		if (x === null) return false;
		if (typeof x === "number" || typeof x === "string" || typeof x === "boolean") return false;
		if (Array.isArray(x)) return false;
		return true;
	}
	exports.isJsonMap = isJsonMap;
	class Context {
		constructor(...values) {
			this.values = values;
		}
		withTarget(target) {
			return new ContextWithTarget(target, ...this.values);
		}
	}
	exports.Context = Context;
	class ContextWithTarget extends Context {
		constructor(target, ...values) {
			super(...values);
			this.target = target;
		}
	}
	exports.ContextWithTarget = ContextWithTarget;
});
var require_error = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.UnexpectedIdError = exports.RuntimeError = void 0;
	class RuntimeError extends Error {}
	exports.RuntimeError = RuntimeError;
	class UnexpectedIdError extends RuntimeError {
		constructor(id) {
			super(`unexpected identifier: ${id}`);
		}
	}
	exports.UnexpectedIdError = UnexpectedIdError;
});
var require_ensure = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.ensureSlicable = exports.ensureArrayIndexable = exports.ensureObjectKeyOrArrayIndexable = exports.ensureObjectKey = exports.ensureArray = exports.ensureNumberValue = exports.ensureValue = void 0;
	var error_1 = require_error();
	function ensureValue(value) {
		if ("error" in value) throw value.error;
		if ("id" in value) throw new error_1.UnexpectedIdError(value.id);
		return value.value;
	}
	exports.ensureValue = ensureValue;
	function ensureNumberValue(value) {
		if ("error" in value) throw value.error;
		if ("id" in value) throw new error_1.UnexpectedIdError(value.id);
		if (typeof value.value !== "number") throw new error_1.RuntimeError(`unexpected non-number value: ${value.value}`);
		return value.value;
	}
	exports.ensureNumberValue = ensureNumberValue;
	function ensureArray(value) {
		const values = ensureValue(value);
		if (Array.isArray(values)) return values;
		throw new error_1.RuntimeError(`unexpected non-array value: ${values}`);
	}
	exports.ensureArray = ensureArray;
	function ensureObjectKey(value) {
		if ("error" in value) throw value.error;
		if ("id" in value) return value.id;
		if (typeof value.value === "string") return value.value;
		throw new error_1.RuntimeError(`unexpected non-string value for object key: ${value.value}`);
	}
	exports.ensureObjectKey = ensureObjectKey;
	function ensureObjectKeyOrArrayIndexable(value) {
		if ("error" in value) throw value.error;
		if ("id" in value) return value.id;
		if (typeof value.value === "string" || typeof value.value === "number") return value.value;
		throw new error_1.RuntimeError(`unexpected non-string value for object key: ${value.value}`);
	}
	exports.ensureObjectKeyOrArrayIndexable = ensureObjectKeyOrArrayIndexable;
	function ensureArrayIndexable(value, size) {
		if ("error" in value) throw value.error;
		if ("id" in value) throw new error_1.RuntimeError(`unexpected identifier for array index: ${value.id}`);
		if (typeof value.value === "number") return value.value < 0 ? size + value.value : value.value;
		throw new error_1.RuntimeError(`unexpected non-string value for array index: ${value.value}`);
	}
	exports.ensureArrayIndexable = ensureArrayIndexable;
	function ensureSlicable(value) {
		if ("error" in value) throw value.error;
		if ("value" in value) {
			if (typeof value.value === "string" || Array.isArray(value.value)) return value.value;
			throw new error_1.RuntimeError(`cannot make slice from non-array value: ${value.value}`);
		}
		throw new error_1.RuntimeError(`cannot make slice from identifier: ${value.id}`);
	}
	exports.ensureSlicable = ensureSlicable;
});
var require_utility = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.mergeObject = exports.objectCompare = exports.arrayCompare = exports.valueCompare = exports.isNullish = exports.isFalsy = exports.flatten = exports.expandCombination = void 0;
	var context_1 = require_context();
	function expandCombination(xs, initValue, expand) {
		if (xs.length === 0) return [];
		return xs.reduce((prevValues, x) => {
			return prevValues.reduce((a, prevValue) => [...a, ...expand(prevValue, x)], []);
		}, [initValue]);
	}
	exports.expandCombination = expandCombination;
	function flatten(xs) {
		return xs.reduce((acc, x) => [...acc, ...x], []);
	}
	exports.flatten = flatten;
	function isFalsy(value) {
		return value === void 0 || value === null || value === false;
	}
	exports.isFalsy = isFalsy;
	function isNullish(value) {
		return value === void 0 || value === null;
	}
	exports.isNullish = isNullish;
	function valueCompare(lhs, rhs) {
		if (lhs === null) return rhs === null ? 0 : -1;
		if (rhs === null) return 1;
		if (lhs === false) return rhs === false ? 0 : -1;
		if (rhs === false) return 1;
		if (lhs === true) return rhs === true ? 0 : -1;
		if (rhs === true) return 1;
		if (typeof lhs === "number") {
			if (typeof rhs === "number") return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
			return -1;
		}
		if (typeof rhs === "number") return 1;
		if (typeof lhs === "string") {
			if (typeof rhs === "string") return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
			return -1;
		}
		if (typeof rhs === "string") return 1;
		if (Array.isArray(lhs)) {
			if (Array.isArray(rhs)) return arrayCompare(lhs, rhs);
			return -1;
		}
		if (Array.isArray(rhs)) return 1;
		return objectCompare(lhs, rhs);
	}
	exports.valueCompare = valueCompare;
	function arrayCompare(lhs, rhs) {
		for (let i = 0;; ++i) if (i < lhs.length) if (i < rhs.length) {
			const r = valueCompare(lhs[i], rhs[i]);
			if (r !== 0) return r;
		} else return -1;
		else if (i < rhs.length) return 1;
		else return 0;
	}
	exports.arrayCompare = arrayCompare;
	function objectCompare(lhs, rhs) {
		const r = arrayCompare(Object.keys(lhs), Object.keys(rhs));
		if (r !== 0) return r;
		return arrayCompare(Object.values(lhs), Object.values(rhs));
	}
	exports.objectCompare = objectCompare;
	function mergeObjects(...xs) {
		return xs.reduce((acc, x) => Object.assign(Object.assign({}, acc), x), {});
	}
	function mergeObject(lhs, rhs, overwrite) {
		if (overwrite) return mergeObjects(lhs, rhs);
		const tmp = Object.assign({}, lhs);
		Object.keys(rhs).forEach((key) => {
			const r = rhs[key];
			if (key in lhs) {
				const l = lhs[key];
				if (context_1.isJsonMap(l) && context_1.isJsonMap(r)) tmp[key] = mergeObject(l, r, false);
				else tmp[key] = r;
			} else tmp[key] = r;
		});
		return tmp;
	}
	exports.mergeObject = mergeObject;
});
var require_operators = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.equalOperator = exports.notEqualOperator = exports.lessThanOrEqualToOperator = exports.lessThanOperator = exports.greaterThanOrEqualToOperator = exports.greaterThanOperator = exports.alternativeOperator = exports.orOperator = exports.andOperator = exports.minusOperator = exports.addOperator = exports.moduloOperator = exports.divideOperator = exports.multiplyOperator = void 0;
	var context_1 = require_context();
	var utility_1 = require_utility();
	var error_1 = require_error();
	function multiplyOperator(lhs, rhs) {
		if (typeof lhs == "number" && typeof rhs == "number") return lhs * rhs;
		else if (typeof lhs == "string" && typeof rhs == "number") {
			if (rhs == 0) return null;
			return [...Array(rhs)].map(() => lhs).join();
		} else if (typeof rhs == "string" && typeof lhs == "number") {
			if (lhs == 0) return null;
			return [...Array(lhs)].map(() => rhs).join();
		} else if (context_1.isJsonMap(lhs) && context_1.isJsonMap(rhs)) return utility_1.mergeObject(lhs, rhs, false);
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.multiplyOperator = multiplyOperator;
	function divideOperator(lhs, rhs) {
		if (typeof lhs == "number" && typeof rhs == "number") {
			if (rhs === 0) throw new error_1.RuntimeError(`divison by zero`);
			return lhs / rhs;
		} else if (typeof lhs == "string" && typeof rhs == "string") return lhs.split(rhs);
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.divideOperator = divideOperator;
	function moduloOperator(lhs, rhs) {
		if (typeof lhs == "number" && typeof rhs == "number") return lhs % rhs;
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.moduloOperator = moduloOperator;
	function addOperator(lhs, rhs) {
		if (lhs === null) return rhs;
		else if (rhs === null) return lhs;
		else if (typeof lhs == "number" && typeof rhs == "number") return lhs + rhs;
		else if (typeof lhs == "string" && typeof rhs == "string") return lhs + rhs;
		else if (Array.isArray(lhs) && Array.isArray(rhs)) return [...lhs, ...rhs];
		else if (context_1.isJsonMap(lhs) && context_1.isJsonMap(rhs)) return utility_1.mergeObject(lhs, rhs, true);
		throw new error_1.RuntimeError(`cannot apply binary operator '+' with ${JSON.stringify(lhs)} and ${JSON.stringify(rhs)}`);
	}
	exports.addOperator = addOperator;
	function minusOperator(lhs, rhs) {
		if (lhs === null) return rhs;
		else if (rhs === null) return lhs;
		else if (typeof lhs == "number" && typeof rhs == "number") return lhs - rhs;
		else if (Array.isArray(lhs) && Array.isArray(rhs)) return lhs.filter((e) => !rhs.includes(e));
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.minusOperator = minusOperator;
	function andOperator(lhs, rhs) {
		return !utility_1.isFalsy(lhs) && !utility_1.isFalsy(rhs);
	}
	exports.andOperator = andOperator;
	function orOperator(lhs, rhs) {
		return !utility_1.isFalsy(lhs) || !utility_1.isFalsy(rhs);
	}
	exports.orOperator = orOperator;
	function alternativeOperator(lhs, rhs) {
		return !utility_1.isNullish(lhs) ? lhs : rhs;
	}
	exports.alternativeOperator = alternativeOperator;
	function greaterThanOperator(lhs, rhs) {
		if (typeof lhs == "number" && typeof rhs == "number") return lhs > rhs;
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.greaterThanOperator = greaterThanOperator;
	function greaterThanOrEqualToOperator(lhs, rhs) {
		if (typeof lhs == "number" && typeof rhs == "number") return lhs >= rhs;
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.greaterThanOrEqualToOperator = greaterThanOrEqualToOperator;
	function lessThanOperator(lhs, rhs) {
		if (typeof lhs == "number" && typeof rhs == "number") return lhs < rhs;
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.lessThanOperator = lessThanOperator;
	function lessThanOrEqualToOperator(lhs, rhs) {
		if (typeof lhs == "number" && typeof rhs == "number") return lhs <= rhs;
		throw new error_1.RuntimeError(`cannot apply binary operator '*' with ${typeof lhs} and ${typeof rhs}`);
	}
	exports.lessThanOrEqualToOperator = lessThanOrEqualToOperator;
	function notEqualOperator(lhs, rhs) {
		return JSON.stringify(lhs) != JSON.stringify(rhs);
	}
	exports.notEqualOperator = notEqualOperator;
	function equalOperator(lhs, rhs) {
		return JSON.stringify(lhs) == JSON.stringify(rhs);
	}
	exports.equalOperator = equalOperator;
});
var require_predefined = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.combinations = exports.endswith = exports.startswith = exports.rindex = exports.index = exports.indices = exports.contains = exports.reverse = exports.uniqueBy = exports.unique = exports.maxIndex = exports.minIndex = exports.groupBy = exports.sortBy = exports.sort = exports.isInfinite = exports._type = exports.toString = exports.toNumber = exports.range = exports.flattenArray = exports.allOf = exports.anyOf = exports.join = exports.isString = exports.isNormal = exports.isNumber = exports.isBoolean = exports.isIterable = exports.isObject = exports.isArray = exports.fromEntries = exports.toEntries = exports._in = exports.has = exports.keysUnsorted = exports.keys = exports.utf8bytelength = exports.length = void 0;
	var context_1 = require_context();
	var error_1 = require_error();
	var operators_1 = require_operators();
	var utility_1 = require_utility();
	function length(value) {
		if (context_1.isJsonMap(value)) return Object.keys(value).length;
		if (Array.isArray(value)) return value.length;
		if (typeof value === "string") return value.length;
		if (value === null) return 0;
		throw new error_1.RuntimeError(`cannot get length of ${value}`);
	}
	exports.length = length;
	function utf8bytelength(value) {
		if (typeof value !== "string") throw new error_1.RuntimeError(`cannot get byte length of ${value}`);
		return new TextEncoder().encode(value).length;
	}
	exports.utf8bytelength = utf8bytelength;
	function keys(value) {
		if (Array.isArray(value)) return [...value.keys()];
		if (context_1.isJsonMap(value)) return Object.keys(value).sort();
		throw new error_1.RuntimeError(`cannot get keys from: ${value}`);
	}
	exports.keys = keys;
	function keysUnsorted(value) {
		if (Array.isArray(value)) return [...value.keys()];
		if (context_1.isJsonMap(value)) return Object.keys(value);
		throw new error_1.RuntimeError(`cannot get keys from: ${value}`);
	}
	exports.keysUnsorted = keysUnsorted;
	function hasKey(input, key) {
		if (Array.isArray(input)) {
			if (typeof key !== "number") throw new error_1.RuntimeError(`cannot call has(key) with number`);
			return key < input.length;
		}
		if (context_1.isJsonMap(input)) {
			if (typeof key !== "string") throw new error_1.RuntimeError(`cannot call has(key) with non-string: ${JSON.stringify(key)}`);
			return key in input;
		}
		throw new error_1.RuntimeError(`cannot call has(key) against ${input}`);
	}
	function has(input, key) {
		if (key === void 0) throw new error_1.RuntimeError(`missing argment 'key' for has(key)`);
		return hasKey(input, key);
	}
	exports.has = has;
	function _in(input, obj) {
		if (obj === void 0) throw new error_1.RuntimeError(`missing argment 'obj' for in(obj)`);
		return hasKey(obj, input);
	}
	exports._in = _in;
	function toEntries(input) {
		if (!context_1.isJsonMap(input)) throw new error_1.RuntimeError(`cannot call to_entries against ${input}`);
		return Object.keys(input).map((key) => {
			return {
				key,
				value: input[key]
			};
		});
	}
	exports.toEntries = toEntries;
	function fromEntries(input) {
		if (!Array.isArray(input)) throw new error_1.RuntimeError(`cannot call from_entries against ${input}`);
		return input.reduce((acc, obj) => {
			if (context_1.isJsonMap(obj) && "key" in obj && typeof obj.key === "string" && "value" in obj) {
				const { key, value } = obj;
				return Object.assign(Object.assign({}, acc), { [key]: value });
			}
			throw new error_1.RuntimeError(`cannot call from_entries against ${input}`);
		}, {});
	}
	exports.fromEntries = fromEntries;
	function isArray(input) {
		return Array.isArray(input);
	}
	exports.isArray = isArray;
	function isObject(input) {
		return context_1.isJsonMap(input);
	}
	exports.isObject = isObject;
	function isIterable(input) {
		return isArray(input) || context_1.isJsonMap(input);
	}
	exports.isIterable = isIterable;
	function isBoolean(input) {
		return input === true || input === false;
	}
	exports.isBoolean = isBoolean;
	function isNumber(input) {
		return typeof input === "number";
	}
	exports.isNumber = isNumber;
	function isNormal(input) {
		return typeof input === "number" && isFinite(input) && !isNaN(input) && input != 0;
	}
	exports.isNormal = isNormal;
	function isString(input) {
		return typeof input === "string";
	}
	exports.isString = isString;
	function join(input) {
		if (!isArray(input)) throw new error_1.RuntimeError(`cannot add non-array elements: ${input}`);
		if (input.length === 0) return null;
		return input.reduce((acc, v) => acc ? operators_1.addOperator(acc, v) : v, void 0);
	}
	exports.join = join;
	function anyOf(input) {
		if (!isArray(input)) throw new error_1.RuntimeError(`cannot check any against non-array elements: ${input}`);
		if (input.length === 0) return false;
		return input.some((v) => !utility_1.isFalsy(v));
	}
	exports.anyOf = anyOf;
	function allOf(input) {
		if (!isArray(input)) throw new error_1.RuntimeError(`cannot check all against non-array elements: ${input}`);
		if (input.length === 0) return true;
		return input.every((v) => !utility_1.isFalsy(v));
	}
	exports.allOf = allOf;
	function flattenRecursive(input, depth) {
		if (depth === 0) return input;
		return input.reduce((acc, v) => [...acc, ...isArray(v) ? flattenRecursive(v, depth ? depth - 1 : void 0) : [v]], []);
	}
	function flattenArray(input, depth) {
		if (!isArray(input)) throw new error_1.RuntimeError(`cannot flatten non-array: ${input}`);
		if (depth !== void 0 && typeof depth !== "number") throw new error_1.RuntimeError(`cannot call flatten(depth) with non-number depth: ${JSON.stringify(depth)}`);
		return flattenRecursive(input, depth);
	}
	exports.flattenArray = flattenArray;
	function range(fromOrUpto, uptoOrUndef, byOrUndef) {
		const [from, upto] = uptoOrUndef === void 0 ? [0, fromOrUpto] : [fromOrUpto, uptoOrUndef];
		const by = byOrUndef !== null && byOrUndef !== void 0 ? byOrUndef : 1;
		const order = from < upto ? "asc" : "desc";
		if (order === "asc" && by <= 0) return [];
		if (order === "desc" && by >= 0) return [];
		const values = [];
		for (let i = from; order === "asc" ? i < upto : i > upto; i += by) values.push(i);
		return values;
	}
	exports.range = range;
	function toNumber(input) {
		if (typeof input === "number") return input;
		if (typeof input === "string") return parseFloat(input);
		throw new error_1.RuntimeError(`cannot convert to number from non-number/non-string value: ${input}`);
	}
	exports.toNumber = toNumber;
	function toString(input) {
		if (typeof input === "string") return input;
		else return JSON.stringify(input);
	}
	exports.toString = toString;
	function _type(input) {
		if (input === null) return "null";
		else if (isArray(input)) return "array";
		else return typeof input;
	}
	exports._type = _type;
	function isInfinite(input) {
		return isNumber(input) && !isFinite(input);
	}
	exports.isInfinite = isInfinite;
	function sort(values) {
		return values.sort(utility_1.valueCompare);
	}
	exports.sort = sort;
	function sortBy(values, keys2) {
		return keys2.map((key, index2) => ({
			key,
			index: index2
		})).sort((a, b) => utility_1.valueCompare(a.key, b.key)).map(({ index: index2 }) => values[index2]);
	}
	exports.sortBy = sortBy;
	function groupBy(values, keys2) {
		return [...keys2.reduce((groups, key, i) => {
			var _a;
			return groups.set(key, [...(_a = groups.get(key)) !== null && _a !== void 0 ? _a : [], values[i]]);
		}, /* @__PURE__ */ new Map()).entries()].sort((a, b) => utility_1.valueCompare(a[0], b[0])).map((x) => x[1]);
	}
	exports.groupBy = groupBy;
	function minIndex(input) {
		if (input.length == 0) throw new Error(`cannot get the minimum element from empty array value: ${input}`);
		return input.reduce((minIndex2, v, i) => utility_1.valueCompare(input[minIndex2], v) > 0 ? i : minIndex2, 0);
	}
	exports.minIndex = minIndex;
	function maxIndex(input) {
		if (input.length == 0) throw new Error(`cannot get the minimum element from empty array value: ${input}`);
		return input.reduce((minIndex2, v, i) => utility_1.valueCompare(input[minIndex2], v) < 0 ? i : minIndex2, 0);
	}
	exports.maxIndex = maxIndex;
	function unique(input) {
		return [...input.reduce((acc, v) => acc.add(v), /* @__PURE__ */ new Set()).values()].sort();
	}
	exports.unique = unique;
	function uniqueBy(values, keys2) {
		return groupBy(values, keys2).map((xs) => xs[0]);
	}
	exports.uniqueBy = uniqueBy;
	function reverse(input) {
		return input.reverse();
	}
	exports.reverse = reverse;
	function contains(input, target) {
		if (isString(input)) {
			if (!isString(target)) throw new error_1.RuntimeError(`a non-string value ${JSON.stringify(target)} cannot be contained in a string`);
			return input.indexOf(target) > 0;
		}
		if (isArray(input)) {
			if (!isArray(target)) throw new error_1.RuntimeError(`a non-array value ${JSON.stringify(target)} cannot be contained in an array`);
			return target.every((x) => input.some((y) => contains(y, x)));
		}
		if (isObject(input)) {
			if (!isObject(target)) throw new error_1.RuntimeError(`a non-object value ${JSON.stringify(target)} cannot be contained in an object`);
			return Object.entries(target).every(([key, value]) => key in input && contains(input[key], value));
		}
		return utility_1.valueCompare(input, target) === 0;
	}
	exports.contains = contains;
	function indicesFromString(_input, _target, maxIndices = 0, reverse2 = false) {
		const input = reverse2 ? _input.split("").reverse().join("") : _input;
		const target = reverse2 ? _target.split("").reverse().join("") : _target;
		const indices2 = [];
		let start = 0;
		while (start < input.length && (maxIndices == 0 || indices2.length < maxIndices)) {
			const idx = input.indexOf(target, start);
			if (idx < 0) break;
			indices2.push(idx);
			start = idx + target.length;
		}
		return reverse2 ? indices2.reverse().map((i) => input.length - i - target.length) : indices2;
	}
	function indicesFromArray(_input, _target, maxIndices = 0, reverse2 = false) {
		const input = reverse2 ? _input.reverse() : _input;
		const target = reverse2 ? _target.reverse() : _target;
		if (target.length == 0) return [];
		const indices2 = [];
		let start = 0;
		while (start < input.length && (maxIndices == 0 || indices2.length < maxIndices)) {
			const [head] = target;
			const idx = input.slice(start).findIndex((v) => utility_1.valueCompare(v, head) === 0);
			if (idx < 0) break;
			start += idx;
			if (target.length > 1) {
				const rest = input.slice(start, start + target.length);
				if (!target.every((v, i) => utility_1.valueCompare(v, rest[i]) === 0)) {
					start += 1;
					continue;
				}
			}
			indices2.push(start);
			start += target.length;
		}
		return reverse2 ? indices2.reverse().map((i) => input.length - i - target.length) : indices2;
	}
	function _indices(input, target, maxIndices = 0, reverse2 = false) {
		if (isString(input)) {
			if (!isString(target)) throw new error_1.RuntimeError(`a non-string value ${JSON.stringify(target)} cannot be contained in a string`);
			return indicesFromString(input, target, maxIndices, reverse2);
		}
		if (isArray(input)) return indicesFromArray(input, isArray(target) ? target : [target], maxIndices, reverse2);
		throw new error_1.RuntimeError(`cannot get indices against non-string/non-array value: ${JSON.stringify(input)}`);
	}
	function indices(input, target) {
		return _indices(input, target);
	}
	exports.indices = indices;
	function index(input, target) {
		var _a;
		return (_a = _indices(input, target, 1).shift()) !== null && _a !== void 0 ? _a : null;
	}
	exports.index = index;
	function rindex(input, target) {
		var _a;
		return (_a = _indices(input, target, 1, true).shift()) !== null && _a !== void 0 ? _a : null;
	}
	exports.rindex = rindex;
	function startswith(input, target) {
		if (!isString(input)) throw new error_1.RuntimeError(`cannot apply startswith against non-string value ${JSON.stringify(input)}`);
		if (!isString(target)) throw new error_1.RuntimeError(`cannot apply startswith with non-string value ${JSON.stringify(target)}`);
		return input.startsWith(target);
	}
	exports.startswith = startswith;
	function endswith(input, target) {
		if (!isString(input)) throw new error_1.RuntimeError(`cannot apply startswith against non-string value ${JSON.stringify(input)}`);
		if (!isString(target)) throw new error_1.RuntimeError(`cannot apply startswith with non-string value ${JSON.stringify(target)}`);
		return input.endsWith(target);
	}
	exports.endswith = endswith;
	function _combinations(...input) {
		return utility_1.expandCombination(input, [], (prev, xs) => xs.map((x) => [...prev, x]));
	}
	function isArrayOfArray(value) {
		return value.every((v) => isArray(v));
	}
	function combinations(input, n) {
		if (n === void 0) {
			if (!isArrayOfArray(input)) throw new error_1.RuntimeError(`cannot get combinations from array of non-arrays: ${JSON.stringify(input)}`);
			return _combinations(...input);
		} else {
			if (!isNumber(n)) throw new error_1.RuntimeError(`unexpected non-number: ${JSON.stringify(n)}`);
			return _combinations(...[...Array(n)].map(() => input));
		}
	}
	exports.combinations = combinations;
});
var require_functions = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.functions = exports.standardFunction = void 0;
	var context_1 = require_context();
	var __1 = require_eval();
	var ensure_1 = require_ensure();
	var error_1 = require_error();
	var utility_1 = require_utility();
	var predefined_1 = require_predefined();
	function invokeFunction(input, args, fn) {
		try {
			const value = fn(ensure_1.ensureValue(input), ...args.map(ensure_1.ensureValue));
			if (value === void 0) return;
			return { value };
		} catch (error) {
			return { error };
		}
	}
	function forEachArgs(args, fn) {
		const combinations = utility_1.expandCombination(args.map((arg) => arg.values), [], (prev, xs) => xs.map((x) => [...prev, x]));
		return (combinations.length === 0 ? [[]] : combinations).map((args2) => fn(args2)).reduce((acc, x) => [...acc, ...x], []);
	}
	function forEachInvocation(ctx, args, fn) {
		return new context_1.Context(...utility_1.flatten(ctx.values.map((input) => forEachArgs(args.map((arg) => arg.evaluate(new context_1.Context(input))), (args2) => fn(input, args2)))));
	}
	function standardFunction(fn) {
		return (ctx, args) => {
			return forEachInvocation(ctx, args, (input, args2) => {
				const result = invokeFunction(input, args2, fn);
				return result === void 0 ? [] : [result];
			});
		};
	}
	exports.standardFunction = standardFunction;
	function standardNumericFunction(name, fn) {
		return standardFunction((input, ...args) => {
			if (!predefined_1.isNumber(input)) throw new error_1.RuntimeError(`cannot apply function ${name} against non-number: ${JSON.stringify(input)}`);
			return fn(input, ...args);
		});
	}
	class StandardFunctionEvaluator {
		constructor(fun, args = []) {
			this.fun = fun;
			this.args = args;
		}
		evaluate(ctx) {
			return forEachInvocation(ctx, this.args, (input, args) => {
				const result = invokeFunction(input, args, this.fun);
				return result === void 0 ? [] : [result];
			});
		}
		dump() {
			return { stdfunc: this.fun };
		}
	}
	function selectFunction(fn) {
		return (ctx, args) => {
			return forEachInvocation(ctx, args, (input, args2) => {
				const result = invokeFunction(input, args2, fn);
				if (result === void 0) return [];
				if ("value" in result) return utility_1.isFalsy(result.value) ? [] : [input];
				else return [result];
			});
		};
	}
	function standardArrayFunction(fn) {
		return standardFunction((input, ...args) => {
			if (!Array.isArray(input)) throw new error_1.RuntimeError(`unexpected non-array input: ${JSON.stringify(input)}`);
			return fn(input, ...args);
		});
	}
	function arrayFunctionWithKeyEvaluation(fn) {
		return (ctx, args) => {
			const compareBy = args[0];
			const values = ctx.values.map((input) => {
				const values2 = ensure_1.ensureArray(input);
				return { value: fn(values2, values2.map((value2) => {
					return ensure_1.ensureValue(compareBy.evaluate(new context_1.Context({ value: value2 })).values[0]);
				})) };
			});
			return new context_1.Context(...values);
		};
	}
	exports.functions = new Map([
		["length", standardFunction(predefined_1.length)],
		["utf8bytelength", standardFunction(predefined_1.utf8bytelength)],
		["keys", standardFunction(predefined_1.keys)],
		["keys_unsorted", standardFunction(predefined_1.keysUnsorted)],
		["has", standardFunction(predefined_1.has)],
		["in", standardFunction(predefined_1._in)],
		["map", (ctx, [arg]) => {
			if (!arg) return new context_1.Context({ error: new error_1.RuntimeError(`missing argment for map`) });
			return new __1.ArrayEvaluator([new __1.PipedEvaluator([new __1.IndexedEvaluator(new __1.IdentityEvaluator(), new __1.SpreadEvaluator()), arg])]).evaluate(ctx);
		}],
		["to_entries", standardFunction(predefined_1.toEntries)],
		["from_entries", standardFunction(predefined_1.fromEntries)],
		["with_entries", (ctx, args) => new __1.PipedEvaluator([
			new StandardFunctionEvaluator(predefined_1.toEntries),
			new __1.IndexedEvaluator(new __1.IdentityEvaluator(), new __1.SpreadEvaluator()),
			...args,
			new StandardFunctionEvaluator(predefined_1.fromEntries)
		]).evaluate(ctx)],
		["select", selectFunction((_, pred) => !utility_1.isFalsy(pred))],
		["arrays", selectFunction(predefined_1.isArray)],
		["objects", selectFunction(predefined_1.isObject)],
		["iterables", selectFunction(predefined_1.isIterable)],
		["booleans", selectFunction(predefined_1.isBoolean)],
		["numbers", selectFunction(predefined_1.isNumber)],
		["normals", selectFunction(predefined_1.isNormal)],
		["finites", selectFunction((input) => predefined_1.isNumber(input) && isFinite(input))],
		["strings", selectFunction(predefined_1.isString)],
		["nulls", selectFunction((input) => input === null)],
		["values", selectFunction((input) => input !== null)],
		["scalars", selectFunction((input) => !predefined_1.isIterable(input))],
		["empty", selectFunction(() => false)],
		["error", standardFunction((_, message) => {
			if (message === void 0) throw new error_1.RuntimeError(`missing argment for map`);
			if (typeof message !== "string") throw new error_1.RuntimeError(`error message is not a string: ${message}`);
			throw new error_1.RuntimeError(message);
		})],
		["add", standardFunction(predefined_1.join)],
		["any", standardFunction(predefined_1.anyOf)],
		["all", standardFunction(predefined_1.allOf)],
		["flatten", standardFunction(predefined_1.flattenArray)],
		["range", (input, args) => forEachInvocation(input, args, (_, args2) => {
			const [fromOrUpto, uptoOrUndef, byOrUndef] = args2.map(ensure_1.ensureNumberValue);
			const [from, upto] = uptoOrUndef === void 0 ? [0, fromOrUpto] : [fromOrUpto, uptoOrUndef];
			const by = byOrUndef !== null && byOrUndef !== void 0 ? byOrUndef : 1;
			return predefined_1.range(from, upto, by).map((value) => ({ value }));
		})],
		["floor", standardNumericFunction("floor", Math.floor)],
		["sqrt", standardNumericFunction("sqrt", Math.sqrt)],
		["tonumber", standardFunction(predefined_1.toNumber)],
		["tostring", standardFunction(predefined_1.toString)],
		["type", standardFunction(predefined_1._type)],
		["infinite", standardFunction(() => Infinity)],
		["nan", standardFunction(() => NaN)],
		["isinfinite", standardFunction(predefined_1.isInfinite)],
		["isnan", standardFunction((input) => predefined_1.isNumber(input) && isNaN(input))],
		["isfinite", standardFunction((input) => predefined_1.isNumber(input) && isFinite(input))],
		["isnormal", standardFunction(predefined_1.isNormal)],
		["sort", standardArrayFunction(predefined_1.sort)],
		["sort_by", arrayFunctionWithKeyEvaluation(predefined_1.sortBy)],
		["group_by", arrayFunctionWithKeyEvaluation(predefined_1.groupBy)],
		["min", standardArrayFunction((input) => input[predefined_1.minIndex(input)])],
		["min_by", arrayFunctionWithKeyEvaluation((values, keys) => values[predefined_1.minIndex(keys)])],
		["max", standardArrayFunction((input) => input[predefined_1.maxIndex(input)])],
		["max_by", arrayFunctionWithKeyEvaluation((values, keys) => values[predefined_1.maxIndex(keys)])],
		["unique", standardArrayFunction(predefined_1.unique)],
		["unique_by", arrayFunctionWithKeyEvaluation(predefined_1.uniqueBy)],
		["reverse", standardArrayFunction(predefined_1.reverse)],
		["contains", standardFunction(predefined_1.contains)],
		["indices", standardFunction(predefined_1.indices)],
		["index", standardFunction(predefined_1.index)],
		["rindex", standardFunction(predefined_1.rindex)],
		["inside", standardFunction((input, target) => predefined_1.contains(target, input))],
		["startswith", standardFunction(predefined_1.startswith)],
		["endswith", standardFunction(predefined_1.endswith)],
		["combinations", (ctx, args) => forEachInvocation(ctx, args, (input, args2) => {
			predefined_1.combinations;
			const [nOrUndef] = args2.map(ensure_1.ensureNumberValue);
			return predefined_1.combinations(ensure_1.ensureArray(input), nOrUndef).map((value) => ({ value }));
		})]
	]);
});
var require_eval = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.evaluate = exports.TryCatchEvaluator = exports.PipedEvaluator = exports.ParallelEvaluator = exports.BinaryOperatorEvaluator = exports.FunctionCallEvaluator = exports.IndexedEvaluator = exports.SpreadEvaluator = exports.SliceEvaluator = exports.KeyEvaluator = exports.ObjectEvaluator = exports.ObjectFieldEvaluator = exports.ArrayEvaluator = exports.IdentityEvaluator = exports.IdEvaluator = exports.PrimitiveEvaluator = void 0;
	var context_1 = require_context();
	var functions_1 = require_functions();
	var ensure_1 = require_ensure();
	var error_1 = require_error();
	var utility_1 = require_utility();
	var operators_1 = require_operators();
	class PrimitiveEvaluator {
		constructor(value) {
			this.value = value;
		}
		evaluate(ctx) {
			return new context_1.Context({ value: this.value });
		}
		dump() {
			return this.value;
		}
	}
	exports.PrimitiveEvaluator = PrimitiveEvaluator;
	class IdEvaluator {
		constructor(name) {
			this.name = name;
		}
		evaluate(ctx) {
			return new context_1.Context({ id: this.name });
		}
		dump() {
			return { id: this.name };
		}
	}
	exports.IdEvaluator = IdEvaluator;
	class IdentityEvaluator {
		evaluate(ctx) {
			return ctx;
		}
		dump() {
			return { identity: 0 };
		}
	}
	exports.IdentityEvaluator = IdentityEvaluator;
	class ArrayEvaluator {
		constructor(elements) {
			this.elements = elements;
		}
		evaluate(ctx) {
			try {
				const xs = ctx.values.map((v) => {
					const ctx0 = new context_1.Context(v);
					return utility_1.flatten(this.elements.map((x) => x.evaluate(ctx0)).filter((r) => r.values.length > 0).map((r) => r.values));
				});
				return new context_1.Context(...xs.map((x) => ({ value: x.map(ensure_1.ensureValue) })));
			} catch (error) {
				return new context_1.Context({ error });
			}
		}
		dump() {
			return { array: this.elements.map((x) => x.dump()) };
		}
	}
	exports.ArrayEvaluator = ArrayEvaluator;
	class ObjectFieldEvaluator {
		constructor(key, value) {
			this.key = key;
			this.value = value;
		}
		evaluate(ctx) {
			const keys = this.key.evaluate(ctx).values.map(ensure_1.ensureObjectKey);
			const values = utility_1.flatten(ctx.values.map((v) => this.value.evaluate(new context_1.Context(v).withTarget(v)).values)).map((v) => {
				try {
					return ensure_1.ensureValue(v);
				} catch (_a) {
					return ensure_1.ensureObjectKey(v);
				}
			});
			return utility_1.expandCombination([keys, values], [], (prev, xs) => {
				return xs.map((x) => [...prev, x]);
			}).map(([key, value]) => ({ [key]: value }));
		}
		dump() {
			var _a;
			return {
				key: this.key.dump(),
				value: (_a = this.value) === null || _a === void 0 ? void 0 : _a.dump()
			};
		}
	}
	exports.ObjectFieldEvaluator = ObjectFieldEvaluator;
	class ObjectEvaluator {
		constructor(fields) {
			this.fields = fields;
		}
		evaluate(ctx) {
			try {
				const xs = utility_1.flatten(ctx.values.map((v) => {
					const ctx0 = new context_1.Context(v);
					return utility_1.expandCombination(this.fields.map((f) => f.evaluate(ctx0)), {}, (prev, vs) => {
						return vs.map((v2) => {
							return Object.assign(Object.assign({}, prev), v2);
						});
					});
				}));
				return new context_1.Context(...xs.map((value) => ({ value })));
			} catch (error) {
				return new context_1.Context({ error });
			}
		}
		dump() {
			return { object: this.fields.map((x) => x.dump()) };
		}
	}
	exports.ObjectEvaluator = ObjectEvaluator;
	function indexedByKey(key, value) {
		var _a, _b;
		if (context_1.isJsonMap(value)) {
			if (typeof key === "string") return (_a = value[key]) !== null && _a !== void 0 ? _a : null;
			throw new error_1.RuntimeError(`cannot index non-object value with string: ${typeof value}`);
		}
		if (Array.isArray(value)) {
			if (typeof key === "number") return (_b = value[key >= 0 ? key : value.length + key]) !== null && _b !== void 0 ? _b : null;
			throw new error_1.RuntimeError(`cannot index non-array value with number: ${typeof value}`);
		}
		throw new error_1.RuntimeError(`cannot index non-object/non-array value: ${JSON.stringify(value)}`);
	}
	class KeyEvaluator {
		constructor(key) {
			this.key = key;
		}
		evaluate(ctx) {
			try {
				const indexedValues = this.key.evaluate(ctx).values.map((key) => indexedByKey(ensure_1.ensureObjectKeyOrArrayIndexable(key), ensure_1.ensureValue(ctx.target)));
				return new context_1.Context(...indexedValues.map((value) => ({ value })));
			} catch (error) {
				return new context_1.Context({ error });
			}
		}
		dump() {
			return { key: this.key };
		}
	}
	exports.KeyEvaluator = KeyEvaluator;
	class SliceEvaluator {
		constructor(first, last) {
			this.first = first;
			this.last = last;
		}
		evaluate(ctx) {
			var _a, _b, _c, _d;
			const sliceable = ensure_1.ensureSlicable(ctx.target);
			const start = (_b = (_a = this.first) === null || _a === void 0 ? void 0 : _a.evaluate(ctx).values.map((v) => ensure_1.ensureArrayIndexable(v, sliceable.length))) !== null && _b !== void 0 ? _b : [0];
			const end = (_d = (_c = this.last) === null || _c === void 0 ? void 0 : _c.evaluate(ctx).values.map((v) => ensure_1.ensureArrayIndexable(v, sliceable.length))) !== null && _d !== void 0 ? _d : [sliceable.length];
			const pairs = utility_1.expandCombination([start, end], [], (prev, xs) => {
				return xs.map((x) => [...prev, x]);
			});
			return new context_1.Context(...pairs.map(([first, last]) => sliceable.slice(first, last)).map((value) => ({ value })));
		}
		dump() {
			if (this.first) if (this.last) return [this.first.dump(), this.last.dump()];
			else return [this.first.dump(), "last"];
			else if (this.last) return ["start", this.last.dump()];
		}
	}
	exports.SliceEvaluator = SliceEvaluator;
	class SpreadEvaluator {
		evaluate(ctx) {
			const target = ensure_1.ensureValue(ctx.target);
			if (context_1.isJsonMap(target)) return new context_1.Context(...Object.keys(target).map((k) => target[k]).map((v) => ({ value: v })));
			else if (Array.isArray(target)) return new context_1.Context(...target.map((v) => ({ value: v })));
			else throw new error_1.RuntimeError(`cannot iterate over non-object/non-array value: ${target}`);
		}
		dump() {
			return { spread: 0 };
		}
	}
	exports.SpreadEvaluator = SpreadEvaluator;
	class IndexedEvaluator {
		constructor(target, indexer) {
			this.target = target;
			this.indexer = indexer;
		}
		evaluate(ctx) {
			try {
				const results = this.target.evaluate(ctx).values.map((target) => {
					return this.indexer.evaluate(ctx.withTarget(target));
				});
				return new context_1.Context(...utility_1.flatten(results.map((c) => c.values)));
			} catch (error) {
				return new context_1.Context({ error });
			}
		}
		dump() {
			return {
				indexing: this.target.dump(),
				indexer: this.indexer.dump()
			};
		}
	}
	exports.IndexedEvaluator = IndexedEvaluator;
	class FunctionCallEvaluator {
		constructor(funcname, args) {
			this.funcname = funcname;
			this.args = args;
		}
		evaluate(ctx) {
			const func = functions_1.functions.get(this.funcname);
			if (func === void 0) return new context_1.Context({ error: new error_1.RuntimeError(`unknown function '${this.funcname}'`) });
			return func(ctx, this.args);
		}
		dump() {
			return { call: { [this.funcname]: this.args.map((e) => e.dump()) } };
		}
	}
	exports.FunctionCallEvaluator = FunctionCallEvaluator;
	var knownOperators = {
		"*": operators_1.multiplyOperator,
		"/": operators_1.divideOperator,
		"%": operators_1.moduloOperator,
		"+": operators_1.addOperator,
		"-": operators_1.minusOperator,
		and: operators_1.andOperator,
		or: operators_1.orOperator,
		"//": operators_1.alternativeOperator,
		">": operators_1.greaterThanOperator,
		">=": operators_1.greaterThanOrEqualToOperator,
		"<": operators_1.lessThanOperator,
		"<=": operators_1.lessThanOrEqualToOperator,
		"!=": operators_1.notEqualOperator,
		"==": operators_1.equalOperator
	};
	class BinaryOperatorEvaluator {
		constructor(op, lhs, rhs) {
			this.op = op;
			this.lhs = lhs;
			this.rhs = rhs;
			if (op in knownOperators) this.func = knownOperators[op];
			else throw new error_1.RuntimeError(`cannot apply binary operator '${op}' with ${typeof lhs} and ${typeof rhs}`);
		}
		evaluate(ctx) {
			return functions_1.standardFunction((_, lhs, rhs) => this.func(lhs, rhs))(ctx, [this.lhs, this.rhs]);
		}
		dump() {
			var _a, _b;
			return { [this.op]: [(_a = this.lhs) === null || _a === void 0 ? void 0 : _a.dump(), (_b = this.rhs) === null || _b === void 0 ? void 0 : _b.dump()] };
		}
	}
	exports.BinaryOperatorEvaluator = BinaryOperatorEvaluator;
	class ParallelEvaluator {
		constructor(evaluators) {
			this.evaluators = evaluators;
		}
		evaluate(ctx) {
			return new context_1.Context(...this.evaluators.reduce((acc, x) => {
				return [...acc, ...x.evaluate(ctx).values];
			}, []));
		}
		dump() {
			return { parallel: this.evaluators.map((e) => e.dump()) };
		}
	}
	exports.ParallelEvaluator = ParallelEvaluator;
	class PipedEvaluator {
		constructor(evaluators) {
			this.evaluators = evaluators;
		}
		evaluate(ctx) {
			return this.evaluators.reduce((ctx2, x) => x.evaluate(ctx2), ctx);
		}
		dump() {
			return { piped: this.evaluators.map((e) => e.dump()) };
		}
	}
	exports.PipedEvaluator = PipedEvaluator;
	class TryCatchEvaluator {
		constructor(evaluator) {
			this.evaluator = evaluator;
		}
		evaluate(ctx) {
			return new context_1.Context(...this.evaluator.evaluate(ctx).values.filter((v) => !("error" in v)));
		}
		dump() {
			return { trycatch: this.evaluator };
		}
	}
	exports.TryCatchEvaluator = TryCatchEvaluator;
	function evaluate(evaluator, json) {
		return evaluator.evaluate(new context_1.Context({ value: json })).values.map((v) => {
			if ("id" in v) return v;
			else if ("error" in v) throw v.error;
			else return v.value;
		});
	}
	exports.evaluate = evaluate;
});
var require_optimize = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.optimize = void 0;
	var stmt_1 = require_stmt();
	var eval_1 = require_eval();
	var expr_1 = require_expr();
	var error_1 = require_error();
	function optimizePrimitiveExpr(expr) {
		return new eval_1.PrimitiveEvaluator(expr.value);
	}
	function optimizeIdExpr(expr) {
		return new eval_1.IdEvaluator(expr.value);
	}
	function optimizeIdentityExpr(_expr) {
		return new eval_1.IdentityEvaluator();
	}
	function optimizeArrayExpr(expr) {
		return new eval_1.ArrayEvaluator(expr.elements.map((x) => optimizeExpr(x)));
	}
	function optimizeObjectExpr(expr) {
		return new eval_1.ObjectEvaluator(expr.fields.map((f) => {
			const keyEval = optimizeExpr(f.key);
			if (!f.value) return new eval_1.ObjectFieldEvaluator(keyEval, new eval_1.KeyEvaluator(keyEval));
			else return new eval_1.ObjectFieldEvaluator(keyEval, optimizeExpr(f.value));
		}));
	}
	function optimizeIndexedExpr(expr) {
		if (expr.indexer instanceof expr_1.SpreadIndexer) return new eval_1.IndexedEvaluator(optimizeExpr(expr.expr), new eval_1.SpreadEvaluator());
		if (expr.indexer instanceof expr_1.RangeIndexer) {
			const first = expr.indexer.first ? optimizeExpr(expr.indexer.first) : null;
			const last = expr.indexer.last ? optimizeExpr(expr.indexer.last) : null;
			return new eval_1.IndexedEvaluator(optimizeExpr(expr.expr), new eval_1.SliceEvaluator(first, last));
		}
		if (expr.indexer instanceof expr_1.KeyIndexer) return new eval_1.IndexedEvaluator(optimizeExpr(expr.expr), new eval_1.KeyEvaluator(optimizeExpr(expr.indexer.key)));
		throw new error_1.RuntimeError(`unimplemented indexer: ${expr}`);
	}
	function optimizeFunctaionCallExpr(expr) {
		return new eval_1.FunctionCallEvaluator(expr.funcname, expr.args.map(optimizeExpr));
	}
	function optimizeBinaryOperatorExpr(expr) {
		return new eval_1.BinaryOperatorEvaluator(expr.op, optimizeExpr(expr.lhs), optimizeExpr(expr.rhs));
	}
	function optimizeParallelExpr(expr) {
		if (expr.exprs.length === 1) return optimizeExpr(expr.exprs[0]);
		return new eval_1.ParallelEvaluator(expr.exprs.map(optimizeExpr));
	}
	function optimizeFilteredExpr(expr) {
		if (expr.exprs.length === 1) return optimizeExpr(expr.exprs[0]);
		return new eval_1.PipedEvaluator(expr.exprs.map(optimizeExpr));
	}
	function optimizeOptionalExpr(expr) {
		return new eval_1.TryCatchEvaluator(optimizeExpr(expr.expr));
	}
	function optimizeExpr(expr) {
		if (expr instanceof expr_1.FilteredExpr) return optimizeFilteredExpr(expr);
		if (expr instanceof expr_1.ParallelExpr) return optimizeParallelExpr(expr);
		if (expr instanceof expr_1.BinaryOperatorExpr) return optimizeBinaryOperatorExpr(expr);
		if (expr instanceof expr_1.IndexedExpr) return optimizeIndexedExpr(expr);
		if (expr instanceof expr_1.FunctionCallExpr) return optimizeFunctaionCallExpr(expr);
		if (expr instanceof expr_1.ObjectExpr) return optimizeObjectExpr(expr);
		if (expr instanceof expr_1.ArrayExpr) return optimizeArrayExpr(expr);
		if (expr instanceof expr_1.IdentityExpr) return optimizeIdentityExpr(expr);
		if (expr instanceof expr_1.IdExpr) return optimizeIdExpr(expr);
		if (expr instanceof expr_1.LiteralExpr || expr instanceof expr_1.StringLiteralExpr) return optimizePrimitiveExpr(expr);
		if (expr instanceof expr_1.OptionalExpr) return optimizeOptionalExpr(expr);
		throw new error_1.RuntimeError(`unsupported expression: ${expr.dump()}`);
	}
	function optimize(stmts) {
		const exprs = stmts.stmts.filter((s) => stmt_1.isExprStatement(s));
		if (exprs.length > 1) throw new error_1.RuntimeError(`too munknown expressions`);
		const [root] = exprs;
		if (!root) throw new error_1.RuntimeError(`no valid expression`);
		return optimizeExpr(root.expr);
	}
	exports.optimize = optimize;
});
var JQ = __commonJS((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.JQ = void 0;
	var scanner_1 = require_scanner();
	var parser_1 = require_parser();
	var optimize_1 = require_optimize();
	var eval_1 = require_eval();
	class JQ {
		constructor(evaluator) {
			this.evaluator = evaluator;
		}
		static compile(pattern) {
			const scanner = new scanner_1.Scanner(pattern);
			return new JQ(optimize_1.optimize(parser_1.parse(scanner)));
		}
		evaluate(value) {
			return eval_1.evaluate(this.evaluator, value);
		}
		dump() {
			return this.evaluator.dump();
		}
	}
	exports.JQ = JQ;
	exports.default = JQ;
})().default, ZEngine = class {
	cache = {};
	entries = /* @__PURE__ */ new Map();
	jq_entries = /* @__PURE__ */ new Map();
	constructor(url, filterOptions = []) {
		const ws = new WebSocket(url);
		ws.addEventListener("open", () => {
			console.log("WebSocket connected!");
			console.log(`Applied filters: ${JSON.stringify(filterOptions)}`);
			ws.send(`applyFilters:${JSON.stringify(filterOptions)}`);
		});
		ws.addEventListener("close", () => console.log("WebSocket disconnected!"));
		ws.addEventListener("error", (error) => {
			ws.close();
			console.error(error);
		});
		ws.addEventListener("message", (event) => {
			const data = JSON.parse(event.data);
			this.update(data);
		});
	}
	register(key, callback) {
		if (!this.entries.get(key)) this.entries.set(key, /* @__PURE__ */ new Set());
		this.entries.get(key)?.add(callback);
		return callback;
	}
	unregister(key, callback) {
		this.entries.get(key)?.delete(callback);
		if (this.entries.get(key)?.size === 0) this.entries.delete(key);
	}
	update(newData) {
		for (const key of this.entries.keys()) {
			const oldValue = this.search(key, this.cache);
			const newValue = this.search(key, newData);
			const callbacks = this.entries.get(key);
			if (!callbacks) continue;
			for (const callback of callbacks) if (oldValue !== newValue) callback(oldValue, newValue, newData);
		}
		for (const { pattern, callbacks } of this.jq_entries.values()) {
			const oldValue = pattern.evaluate(this.cache)[0];
			const newValue = pattern.evaluate(newData)[0];
			if (!callbacks || oldValue === newValue) continue;
			for (const callback of callbacks) callback(oldValue, newValue, newData);
		}
		this.cache = newData;
	}
	search(key, obj) {
		const attrs = key.split(".");
		let curr = obj;
		for (const attr of attrs) {
			if (!(curr instanceof Object)) return curr;
			curr = curr[attr];
		}
		return curr;
	}
	register_jq(query, callback) {
		const pattern = JQ.compile(query);
		if (!this.jq_entries.get(query)) this.jq_entries.set(query, {
			pattern,
			callbacks: /* @__PURE__ */ new Set()
		});
		this.jq_entries.get(query)?.callbacks.add(callback);
		return callback;
	}
	unregister_jq(query, callback) {
		this.jq_entries.get(query)?.callbacks.delete(callback);
		if (this.jq_entries.get(query)?.callbacks.size === 0) this.jq_entries.delete(query);
	}
};
String.raw;
var m = String.raw, v$1 = (() => {
	try {
		document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
	} catch {
		return !1;
	}
	return !0;
})(), k$1 = typeof CSS < "u" && CSS.supports && CSS.supports("line-height", "mod(1,1)"), S = typeof matchMedia < "u" ? matchMedia("(prefers-reduced-motion: reduce)") : null, d = "--_number-flow-d-opacity", g = "--_number-flow-d-width", c = "--_number-flow-dx", u = "--_number-flow-d", _ = (() => {
	try {
		return CSS.registerProperty({
			name: d,
			syntax: "<number>",
			inherits: !1,
			initialValue: "0"
		}), CSS.registerProperty({
			name: c,
			syntax: "<length>",
			inherits: !0,
			initialValue: "0px"
		}), CSS.registerProperty({
			name: g,
			syntax: "<number>",
			inherits: !1,
			initialValue: "0"
		}), CSS.registerProperty({
			name: u,
			syntax: "<number>",
			inherits: !0,
			initialValue: "0"
		}), !0;
	} catch {
		return !1;
	}
})(), s = "round(nearest, calc(var(--number-flow-mask-height, 0.25em) / 2), 1px)", e = `calc(${s} * 2)`, p$1 = "var(--number-flow-mask-width, 0.5em)", n = `calc(${p$1} / var(--scale-x))`, r$1 = "#000 0, transparent 71%", x$1 = m`:host{display:inline-block;direction:ltr;white-space:nowrap;isolation:isolate;line-height:1}.number,.number__inner{display:inline-block;transform-origin:left top}:host([data-will-change]) :is(.number,.number__inner,.section,.digit,.digit__num,.symbol){will-change:transform}.number{--scale-x:calc(1 + var(${g}) / var(--width));transform:translateX(var(${c})) scaleX(var(--scale-x));margin:0 calc(-1 * ${p$1});position:relative;-webkit-mask-image:linear-gradient(to right,transparent 0,#000 ${n},#000 calc(100% - ${n}),transparent ),linear-gradient(to bottom,transparent 0,#000 ${e},#000 calc(100% - ${e}),transparent 100% ),radial-gradient(at bottom right,${r$1}),radial-gradient(at bottom left,${r$1}),radial-gradient(at top left,${r$1}),radial-gradient(at top right,${r$1});-webkit-mask-size:100% calc(100% - ${e} * 2),calc(100% - ${n} * 2) 100%,${n} ${e},${n} ${e},${n} ${e},${n} ${e};-webkit-mask-position:center,center,top left,top right,bottom right,bottom left;-webkit-mask-repeat:no-repeat}.number__inner{padding:${s} ${p$1};transform:scaleX(calc(1 / var(--scale-x))) translateX(calc(-1 * var(${c})))}:host > :not(.number){z-index:5}.section,.symbol{display:inline-block;position:relative;isolation:isolate}.section::after{content:'\200b';display:inline-block}.section--justify-left{transform-origin:center left}.section--justify-right{transform-origin:center right}.section > [inert],.symbol > [inert]{margin:0 !important;position:absolute !important;z-index:-1}.digit{display:inline-block;position:relative;--c:var(--current) + var(${u})}.digit__num,.number .section::after{padding:${s} 0}.digit__num{display:inline-block;--offset-raw:mod(var(--length) + var(--n) - mod(var(--c),var(--length)),var(--length));--offset:calc( var(--offset-raw) - var(--length) * round(down,var(--offset-raw) / (var(--length) / 2),1) );--y:clamp(-100%,var(--offset) * 100%,100%);transform:translateY(var(--y))}.digit__num[inert]{position:absolute;top:0;left:50%;transform:translateX(-50%) translateY(var(--y))}.digit:not(.is-spinning) .digit__num[inert]{display:none}.symbol__value{display:inline-block;mix-blend-mode:plus-lighter;white-space:pre}.section--justify-left .symbol > [inert]{left:0}.section--justify-right .symbol > [inert]{right:0}.animate-presence{opacity:calc(1 + var(${d}))}`, M = HTMLElement, b$2 = m`:host{display:inline-block;direction:ltr;white-space:nowrap;line-height:1}span{display:inline-block}:host([data-will-change]) span{will-change:transform}.number,.digit{padding:${s} 0}.symbol{white-space:pre}`, $ = (t = "") => m`:where(number-flow${t}){line-height:1}number-flow${t} > span{font-kerning:none;display:inline-block;padding:${e} 0}`;
//#endregion
//#region node_modules/number-flow/dist/plugins.mjs
var f$1 = (e, n) => e == null ? n : n == null ? e : Math.max(e, n), i$1 = /* @__PURE__ */ new WeakMap(), l = {
	onUpdate(e, n, o) {
		if (i$1.set(o, void 0), !o.computedTrend) return;
		const s = n.integer.concat(n.fraction).filter((t) => t.type === "integer" || t.type === "fraction"), r = e.integer.concat(e.fraction).filter((t) => t.type === "integer" || t.type === "fraction"), u = s.find((t) => !r.find((c) => c.pos === t.pos && c.value === t.value)), a = r.find((t) => !s.find((c) => t.pos === c.pos && t.value === c.value));
		i$1.set(o, f$1(u == null ? void 0 : u.pos, a == null ? void 0 : a.pos));
	},
	getDelta(e, n, o) {
		const s = e - n, r = i$1.get(o.flow);
		if (!s && r != null && r >= o.pos) return o.length * o.flow.computedTrend;
	}
};
//#endregion
//#region node_modules/number-flow/dist/lite.mjs
var p = (n, t, e) => {
	const i = document.createElement(n), [s, o] = Array.isArray(t) ? [void 0, t] : [t, e];
	return s && Object.assign(i, s), o?.forEach((a) => i.appendChild(a)), i;
}, V = (n, t) => {
	var e;
	return t === "left" ? n.offsetLeft : (((e = n.offsetParent instanceof HTMLElement ? n.offsetParent : null) == null ? void 0 : e.offsetWidth) ?? 0) - n.offsetWidth - n.offsetLeft;
}, W = (n) => n.offsetWidth > 0 && n.offsetHeight > 0, X = (n, t) => {
	!customElements.get(n) && customElements.define(n, t);
};
function k(n, t, { reverse: e = !1 } = {}) {
	const i = n.length;
	for (let s = e ? i - 1 : 0; e ? s >= 0 : s < i; e ? s-- : s++) t(n[s], s);
}
function z(n, t, e, i) {
	const s = t.formatToParts(n);
	e && s.unshift({
		type: "prefix",
		value: e
	}), i && s.push({
		type: "suffix",
		value: i
	});
	const o = [], a = [], r = [], d = [], c = {}, f = (l) => `${l}:${c[l] = (c[l] ?? -1) + 1}`;
	let u = "", m = !1, g = !1;
	for (const l of s) {
		u += l.value;
		const h = l.type === "minusSign" || l.type === "plusSign" ? "sign" : l.type;
		h === "integer" ? (m = !0, a.push(...l.value.split("").map((_) => ({
			type: h,
			value: parseInt(_)
		})))) : h === "group" ? a.push({
			type: h,
			value: l.value
		}) : h === "decimal" ? (g = !0, r.push({
			type: h,
			value: l.value,
			key: f(h)
		})) : h === "fraction" ? r.push(...l.value.split("").map((_) => ({
			type: h,
			value: parseInt(_),
			key: f(h),
			pos: -1 - c[h]
		}))) : (m || g ? d : o).push({
			type: h,
			value: l.value,
			key: f(h)
		});
	}
	const v = [];
	for (let l = a.length - 1; l >= 0; l--) {
		const h = a[l];
		v.unshift(h.type === "integer" ? {
			...h,
			key: f(h.type),
			pos: c[h.type]
		} : {
			...h,
			key: f(h.type)
		});
	}
	return {
		pre: o,
		integer: v,
		fraction: r,
		post: d,
		valueAsString: u,
		value: typeof n == "string" ? parseFloat(n) : n
	};
}
var B = k$1 && v$1 && _;
var D = class extends M {
	constructor() {
		super(), this.created = !1, this.batched = !1;
		const { animated: t, ...e } = this.constructor.defaultProps;
		this._animated = this.computedAnimated = t, Object.assign(this, e);
	}
	get animated() {
		return this._animated;
	}
	set animated(t) {
		var e;
		this.animated !== t && (this._animated = t, (e = this.shadowRoot) == null || e.getAnimations().forEach((i) => i.finish()));
	}
	/**
	* @internal
	*/
	set data(t) {
		var r, d;
		if (t == null) return;
		const { pre: e, integer: i, fraction: s, post: o, value: a } = t;
		if (this.created) {
			const c = this._data;
			this._data = t, this.computedTrend = typeof this.trend == "function" ? this.trend(c.value, a) : this.trend, this.computedAnimated = B && this._animated && (!this.respectMotionPreference || !((r = S) != null && r.matches)) && W(this) && this.ownerDocument.visibilityState === "visible", (d = this.plugins) == null || d.forEach((f) => {
				var u;
				return (u = f.onUpdate) == null ? void 0 : u.call(f, t, c, this);
			}), this.batched || this.willUpdate(), this._pre.update(e), this._num.update({
				integer: i,
				fraction: s
			}), this._post.update(o), this.batched || this.didUpdate();
		} else {
			this._data = t, this.attachShadow({ mode: "open" });
			try {
				this._internals ?? (this._internals = this.attachInternals()), this._internals.role = "img";
			} catch {}
			const c = document.createElement("style");
			this.nonce && (c.nonce = this.nonce), c.textContent = x$1, this.shadowRoot.appendChild(c), this._pre = new A(this, e, {
				justify: "right",
				part: "left"
			}), this.shadowRoot.appendChild(this._pre.el), this._num = new F(this, i, s), this.shadowRoot.appendChild(this._num.el), this._post = new A(this, o, {
				justify: "left",
				part: "right"
			}), this.shadowRoot.appendChild(this._post.el), this.created = !0;
		}
		try {
			this._internals.ariaLabel = t.valueAsString;
		} catch {}
	}
	/**
	* @internal
	*/
	willUpdate() {
		this._pre.willUpdate(), this._num.willUpdate(), this._post.willUpdate();
	}
	/**
	* @internal
	*/
	didUpdate() {
		if (!this.computedAnimated) return;
		this._abortAnimationsFinish ? this._abortAnimationsFinish.abort() : this.dispatchEvent(new Event("animationsstart")), this._pre.didUpdate(), this._num.didUpdate(), this._post.didUpdate();
		const t = new AbortController();
		Promise.all(this.shadowRoot.getAnimations().map((e) => e.finished)).then(() => {
			t.signal.aborted || (this.dispatchEvent(new Event("animationsfinish")), this._abortAnimationsFinish = void 0);
		}), this._abortAnimationsFinish = t;
	}
};
D.defaultProps = {
	transformTiming: {
		duration: 900,
		easing: "linear(0,.005,.019,.039,.066,.096,.129,.165,.202,.24,.278,.316,.354,.39,.426,.461,.494,.526,.557,.586,.614,.64,.665,.689,.711,.731,.751,.769,.786,.802,.817,.831,.844,.856,.867,.877,.887,.896,.904,.912,.919,.925,.931,.937,.942,.947,.951,.955,.959,.962,.965,.968,.971,.973,.976,.978,.98,.981,.983,.984,.986,.987,.988,.989,.99,.991,.992,.992,.993,.994,.994,.995,.995,.996,.996,.9963,.9967,.9969,.9972,.9975,.9977,.9979,.9981,.9982,.9984,.9985,.9987,.9988,.9989,1)"
	},
	spinTiming: void 0,
	opacityTiming: {
		duration: 450,
		easing: "ease-out"
	},
	animated: !0,
	trend: (n, t) => Math.sign(t - n),
	respectMotionPreference: !0,
	plugins: void 0,
	digits: void 0
};
var F = class {
	constructor(t, e, i, { className: s, ...o } = {}) {
		this.flow = t, this._integer = new b$1(t, e, {
			justify: "right",
			part: "integer"
		}), this._fraction = new b$1(t, i, {
			justify: "left",
			part: "fraction"
		}), this._inner = p("span", { className: "number__inner" }, [this._integer.el, this._fraction.el]), this.el = p("span", {
			...o,
			part: "number",
			className: `number ${s ?? ""}`
		}, [this._inner]);
	}
	willUpdate() {
		this._prevWidth = this.el.offsetWidth, this._prevLeft = this.el.getBoundingClientRect().left, this._integer.willUpdate(), this._fraction.willUpdate();
	}
	update({ integer: t, fraction: e }) {
		this._integer.update(t), this._fraction.update(e);
	}
	didUpdate() {
		const t = this.el.getBoundingClientRect();
		this._integer.didUpdate(), this._fraction.didUpdate();
		const e = this._prevLeft - t.left, i = this.el.offsetWidth, s = this._prevWidth - i;
		this.el.style.setProperty("--width", String(i)), this.el.animate({
			[c]: [`${e}px`, "0px"],
			[g]: [s, 0]
		}, {
			...this.flow.transformTiming,
			composite: "accumulate"
		});
	}
};
var E$1 = class {
	constructor(t, e, { justify: i, className: s, ...o }, a) {
		this.flow = t, this.children = /* @__PURE__ */ new Map(), this.onCharRemove = (d) => () => {
			this.children.delete(d);
		}, this.justify = i;
		const r = e.map((d) => this.addChar(d).el);
		this.el = p("span", {
			...o,
			className: `section section--justify-${i} ${s ?? ""}`
		}, a ? a(r) : r);
	}
	addChar(t, { startDigitsAtZero: e = !1, ...i } = {}) {
		const s = t.type === "integer" || t.type === "fraction" ? new x(this, t.type, e ? 0 : t.value, t.pos, {
			...i,
			onRemove: this.onCharRemove(t.key)
		}) : new I(this, t.type, t.value, {
			...i,
			onRemove: this.onCharRemove(t.key)
		});
		return this.children.set(t.key, s), s;
	}
	unpop(t) {
		t.el.removeAttribute("inert"), t.el.style.top = "", t.el.style[this.justify] = "";
	}
	pop(t) {
		t.forEach((e) => {
			e.el.style.top = `${e.el.offsetTop}px`, e.el.style[this.justify] = `${V(e.el, this.justify)}px`;
		}), t.forEach((e) => {
			e.el.setAttribute("inert", ""), e.present = !1;
		});
	}
	addNewAndUpdateExisting(t) {
		const e = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), s = this.justify === "left", o = s ? "prepend" : "append";
		if (k(t, (a) => {
			let r;
			this.children.has(a.key) ? (r = this.children.get(a.key), i.set(a, r), this.unpop(r), r.present = !0) : (r = this.addChar(a, {
				startDigitsAtZero: !0,
				animateIn: !0
			}), e.set(a, r)), this.el[o](r.el);
		}, { reverse: s }), this.flow.computedAnimated) {
			const a = this.el.getBoundingClientRect();
			e.forEach((r) => {
				r.willUpdate(a);
			});
		}
		e.forEach((a, r) => {
			a.update(r.value);
		}), i.forEach((a, r) => {
			a.update(r.value);
		});
	}
	willUpdate() {
		const t = this.el.getBoundingClientRect();
		this._prevOffset = t[this.justify], this.children.forEach((e) => e.willUpdate(t));
	}
	didUpdate() {
		const t = this.el.getBoundingClientRect();
		this.children.forEach((s) => s.didUpdate(t));
		const e = t[this.justify], i = this._prevOffset - e;
		i && this.children.size && this.el.animate({ transform: [`translateX(${i}px)`, "none"] }, {
			...this.flow.transformTiming,
			composite: "accumulate"
		});
	}
};
var b$1 = class extends E$1 {
	update(t) {
		const e = /* @__PURE__ */ new Map();
		this.children.forEach((i, s) => {
			t.find((o) => o.key === s) || e.set(s, i), this.unpop(i);
		}), this.addNewAndUpdateExisting(t), e.forEach((i) => {
			i instanceof x && i.update(0);
		}), this.pop(e);
	}
};
var A = class extends E$1 {
	update(t) {
		const e = /* @__PURE__ */ new Map();
		this.children.forEach((i, s) => {
			t.find((o) => o.key === s) || e.set(s, i);
		}), this.pop(e), this.addNewAndUpdateExisting(t);
	}
};
var y = class {
	constructor(t, e, { onRemove: i, animateIn: s = !1 } = {}) {
		this.flow = t, this.el = e, this._present = !0, this._remove = () => {
			var o;
			this.el.remove(), (o = this._onRemove) == null || o.call(this);
		}, this.el.classList.add("animate-presence"), this.flow.computedAnimated && s && this.el.animate({ ["--_number-flow-d-opacity"]: [-.9999, 0] }, {
			...this.flow.opacityTiming,
			composite: "accumulate"
		}), this._onRemove = i;
	}
	get present() {
		return this._present;
	}
	set present(t) {
		if (this._present !== t) {
			if (this._present = t, t ? this.el.removeAttribute("inert") : this.el.setAttribute("inert", ""), !this.flow.computedAnimated) {
				t || this._remove();
				return;
			}
			this.el.style.setProperty("--_number-flow-d-opacity", t ? "0" : "-.999"), this.el.animate({ [d]: t ? [-.9999, 0] : [.999, 0] }, {
				...this.flow.opacityTiming,
				composite: "accumulate"
			}), t ? this.flow.removeEventListener("animationsfinish", this._remove) : this.flow.addEventListener("animationsfinish", this._remove, { once: !0 });
		}
	}
};
var R = class extends y {
	constructor(t, e, i, s) {
		super(t.flow, i, s), this.section = t, this.value = e, this.el = i;
	}
};
var x = class extends R {
	constructor(t, e, i, s, o) {
		var c, f;
		const a = (((f = (c = t.flow.digits) == null ? void 0 : c[s]) == null ? void 0 : f.max) ?? 9) + 1, r = Array.from({ length: a }).map((u, m) => {
			const g = p("span", { className: "digit__num" }, [document.createTextNode(String(m))]);
			return m !== i && g.setAttribute("inert", ""), g.style.setProperty("--n", String(m)), g;
		}), d = p("span", {
			part: `digit ${e}-digit`,
			className: "digit"
		}, r);
		d.style.setProperty("--current", String(i)), d.style.setProperty("--length", String(a)), super(t, i, d, o), this.pos = s, this._onAnimationsFinish = () => {
			this.el.classList.remove("is-spinning");
		}, this._numbers = r, this.length = a;
	}
	willUpdate(t) {
		const e = this.el.getBoundingClientRect();
		this._prevValue = this.value;
		const i = e[this.section.justify] - t[this.section.justify], s = e.width / 2;
		this._prevCenter = this.section.justify === "left" ? i + s : i - s;
	}
	update(t) {
		this.el.style.setProperty("--current", String(t)), this._numbers.forEach((e, i) => i === t ? e.removeAttribute("inert") : e.setAttribute("inert", "")), this.value = t;
	}
	didUpdate(t) {
		const e = this.el.getBoundingClientRect(), i = e[this.section.justify] - t[this.section.justify], s = e.width / 2, o = this.section.justify === "left" ? i + s : i - s, a = this._prevCenter - o;
		a && this.el.animate({ transform: [`translateX(${a}px)`, "none"] }, {
			...this.flow.transformTiming,
			composite: "accumulate"
		});
		const r = this.getDelta();
		r && (this.el.classList.add("is-spinning"), this.el.animate({ ["--_number-flow-d"]: [-r, 0] }, {
			...this.flow.spinTiming ?? this.flow.transformTiming,
			composite: "accumulate"
		}), this.flow.addEventListener("animationsfinish", this._onAnimationsFinish, { once: !0 }));
	}
	getDelta() {
		var i;
		if (this.flow.plugins) for (const s of this.flow.plugins) {
			const o = (i = s.getDelta) == null ? void 0 : i.call(s, this.value, this._prevValue, this);
			if (o != null) return o;
		}
		const t = this.value - this._prevValue, e = this.flow.computedTrend || Math.sign(t);
		return e < 0 && this.value > this._prevValue ? this.value - this.length - this._prevValue : e > 0 && this.value < this._prevValue ? this.length - this._prevValue + this.value : t;
	}
};
var I = class extends R {
	constructor(t, e, i, s) {
		const o = p("span", {
			className: "symbol__value",
			textContent: i
		});
		super(t, i, p("span", {
			part: `symbol ${e}`,
			className: "symbol"
		}, [o]), s), this.type = e, this._children = /* @__PURE__ */ new Map(), this._onChildRemove = (a) => () => {
			this._children.delete(a);
		}, this._children.set(i, new y(this.flow, o, { onRemove: this._onChildRemove(i) }));
	}
	willUpdate(t) {
		if (this.type === "decimal") return;
		const e = this.el.getBoundingClientRect();
		this._prevOffset = e[this.section.justify] - t[this.section.justify];
	}
	update(t) {
		if (this.value !== t) {
			const e = this._children.get(this.value);
			e && (e.present = !1);
			const i = this._children.get(t);
			if (i) i.present = !0;
			else {
				const s = p("span", {
					className: "symbol__value",
					textContent: t
				});
				this.el.appendChild(s), this._children.set(t, new y(this.flow, s, {
					animateIn: !0,
					onRemove: this._onChildRemove(t)
				}));
			}
		}
		this.value = t;
	}
	didUpdate(t) {
		if (this.type === "decimal") return;
		const i = this.el.getBoundingClientRect()[this.section.justify] - t[this.section.justify], s = this._prevOffset - i;
		s && this.el.animate({ transform: [`translateX(${s}px)`, "none"] }, {
			...this.flow.transformTiming,
			composite: "accumulate"
		});
	}
};
//#endregion
//#region node_modules/number-flow/dist/csp.mjs
var r = (s) => [
	b$2,
	$(s),
	x$1
];
r();
//#endregion
//#region node_modules/number-flow/dist/index.mjs
var f = "number-flow-connect", h = "number-flow-update";
var b = class extends D {
	constructor() {
		super(...arguments), this.connected = !1;
	}
	connectedCallback() {
		this.connected = !0, this.dispatchEvent(new Event(f, { bubbles: !0 }));
	}
	disconnectedCallback() {
		this.connected = !1;
	}
	get value() {
		return this._value;
	}
	update(t) {
		(!this._formatter || this._prevFormat !== this.format || this._prevLocales !== this.locales) && (this._formatter = new Intl.NumberFormat(this.locales, this.format), this._prevFormat = this.format, this._prevLocales = this.locales), t != null && (this._value = t), this.dispatchEvent(new Event(h, { bubbles: !0 })), this.data = z(this._value, this._formatter, this.numberPrefix, this.numberSuffix);
	}
};
X("number-flow", b);
//#endregion
//#region node_modules/@vibrant/image/dist/esm/histogram.js
var Histogram = class {
	constructor(pixels, opts) {
		this.pixels = pixels;
		this.opts = opts;
		const { sigBits } = opts;
		const getColorIndex = (r2, g2, b2) => (r2 << 2 * sigBits) + (g2 << sigBits) + b2;
		this.getColorIndex = getColorIndex;
		const rshift = 8 - sigBits;
		const hn = 1 << 3 * sigBits;
		const hist = new Uint32Array(hn);
		let rmax;
		let rmin;
		let gmax;
		let gmin;
		let bmax;
		let bmin;
		let r;
		let g;
		let b;
		let a;
		rmax = gmax = bmax = 0;
		rmin = gmin = bmin = Number.MAX_VALUE;
		const n = pixels.length / 4;
		let i = 0;
		while (i < n) {
			const offset = i * 4;
			i++;
			r = pixels[offset + 0];
			g = pixels[offset + 1];
			b = pixels[offset + 2];
			a = pixels[offset + 3];
			if (a === 0) continue;
			r = r >> rshift;
			g = g >> rshift;
			b = b >> rshift;
			const index = getColorIndex(r, g, b);
			if (hist[index] === void 0) hist[index] = 0;
			hist[index] += 1;
			if (r > rmax) rmax = r;
			if (r < rmin) rmin = r;
			if (g > gmax) gmax = g;
			if (g < gmin) gmin = g;
			if (b > bmax) bmax = b;
			if (b < bmin) bmin = b;
		}
		this._colorCount = hist.reduce((total, c) => c > 0 ? total + 1 : total, 0);
		this.hist = hist;
		this.rmax = rmax;
		this.rmin = rmin;
		this.gmax = gmax;
		this.gmin = gmin;
		this.bmax = bmax;
		this.bmin = bmin;
	}
	get colorCount() {
		return this._colorCount;
	}
};
//#endregion
//#region node_modules/@vibrant/image/dist/esm/index.js
var ImageBase = class {
	scaleDown(opts) {
		const width = this.getWidth();
		const height = this.getHeight();
		let ratio = 1;
		if (opts.maxDimension > 0) {
			const maxSide = Math.max(width, height);
			if (maxSide > opts.maxDimension) ratio = opts.maxDimension / maxSide;
		} else ratio = 1 / opts.quality;
		if (ratio < 1) this.resize(width * ratio, height * ratio, ratio);
	}
};
function applyFilters(imageData, filters) {
	if (filters.length > 0) {
		const pixels = imageData.data;
		const n = pixels.length / 4;
		let offset;
		let r;
		let g;
		let b;
		let a;
		for (let i = 0; i < n; i++) {
			offset = i * 4;
			r = pixels[offset + 0];
			g = pixels[offset + 1];
			b = pixels[offset + 2];
			a = pixels[offset + 3];
			for (let j = 0; j < filters.length; j++) if (!filters[j]?.(r, g, b, a)) {
				pixels[offset + 3] = 0;
				break;
			}
		}
	}
	return imageData;
}
//#endregion
//#region node_modules/@vibrant/image-browser/dist/esm/index.js
function isRelativeUrl(url) {
	const u = new URL(url, location.href);
	return u.protocol === location.protocol && u.host === location.host && u.port === location.port;
}
function isSameOrigin(a, b) {
	const ua = new URL(a);
	const ub = new URL(b);
	return ua.protocol === ub.protocol && ua.hostname === ub.hostname && ua.port === ub.port;
}
var BrowserImage = class extends ImageBase {
	_getCanvas() {
		if (!this._canvas) throw new Error("Canvas is not initialized");
		return this._canvas;
	}
	_getContext() {
		if (!this._context) throw new Error("Context is not initialized");
		return this._context;
	}
	_getWidth() {
		if (!this._width) throw new Error("Width is not initialized");
		return this._width;
	}
	_getHeight() {
		if (!this._height) throw new Error("Height is not initialized");
		return this._height;
	}
	_initCanvas() {
		const img = this.image;
		if (!img) throw new Error("Image is not initialized");
		const canvas = this._canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		if (!context) throw new ReferenceError("Failed to create canvas context");
		this._context = context;
		canvas.className = "@vibrant/canvas";
		canvas.style.display = "none";
		this._width = canvas.width = img.width;
		this._height = canvas.height = img.height;
		context.drawImage(img, 0, 0);
		document.body.appendChild(canvas);
	}
	load(image) {
		let img;
		let src;
		if (typeof image === "string") {
			img = document.createElement("img");
			src = image;
			if (!isRelativeUrl(src) && !isSameOrigin(window.location.href, src)) img.crossOrigin = "anonymous";
			img.src = src;
		} else if (image instanceof HTMLImageElement) {
			img = image;
			src = image.src;
		} else return Promise.reject(/* @__PURE__ */ new Error(`Cannot load buffer as an image in browser`));
		this.image = img;
		return new Promise((resolve, reject) => {
			const onImageLoad = () => {
				this._initCanvas();
				resolve(this);
			};
			if (img.complete) onImageLoad();
			else {
				img.onload = onImageLoad;
				img.onerror = (_e) => reject(/* @__PURE__ */ new Error(`Fail to load image: ${src}`));
			}
		});
	}
	clear() {
		this._getContext().clearRect(0, 0, this._getWidth(), this._getHeight());
	}
	update(imageData) {
		this._getContext().putImageData(imageData, 0, 0);
	}
	getWidth() {
		return this._getWidth();
	}
	getHeight() {
		return this._getHeight();
	}
	resize(targetWidth, targetHeight, ratio) {
		if (!this.image) throw new Error("Image is not initialized");
		this._width = this._getCanvas().width = targetWidth;
		this._height = this._getCanvas().height = targetHeight;
		this._getContext().scale(ratio, ratio);
		this._getContext().drawImage(this.image, 0, 0);
	}
	getPixelCount() {
		return this._getWidth() * this._getHeight();
	}
	getImageData() {
		return this._getContext().getImageData(0, 0, this._getWidth(), this._getHeight());
	}
	remove() {
		if (this._canvas && this._canvas.parentNode) this._canvas.parentNode.removeChild(this._canvas);
	}
};
//#endregion
//#region node_modules/@vibrant/core/dist/esm/utils.js
function assignDeep(target, ...sources) {
	sources.forEach((s) => {
		if (!s) return;
		for (const key in s) if (s.hasOwnProperty(key)) {
			const v = s[key];
			if (Array.isArray(v)) target[key] = v.slice(0);
			else if (typeof v === "object") {
				if (!target[key]) target[key] = {};
				assignDeep(target[key], v);
			} else target[key] = v;
		}
	});
	return target;
}
//#endregion
//#region node_modules/@vibrant/core/dist/esm/options.js
function buildProcessOptions(opts, override) {
	const { colorCount, quantizer, generators, filters } = opts;
	const commonQuantizerOpts = { colorCount };
	const q = typeof quantizer === "string" ? {
		name: quantizer,
		options: {}
	} : quantizer;
	q.options = assignDeep({}, commonQuantizerOpts, q.options);
	return assignDeep({}, {
		quantizer: q,
		generators,
		filters
	}, override);
}
//#endregion
//#region node_modules/@vibrant/core/dist/esm/builder.js
var Builder = class {
	/**
	* Arguments are the same as `Vibrant.constructor`.
	*/
	constructor(src, opts = {}) {
		this._src = src;
		this._opts = assignDeep({}, Vibrant.DefaultOpts, opts);
	}
	/**
	* Sets `opts.colorCount` to `n`.
	* @returns this `Builder` instance.
	*/
	maxColorCount(n) {
		this._opts.colorCount = n;
		return this;
	}
	/**
	* Sets `opts.maxDimension` to `d`.
	* @returns this `Builder` instance.
	*/
	maxDimension(d) {
		this._opts.maxDimension = d;
		return this;
	}
	/**
	* Adds a filter function
	* @returns this `Builder` instance.
	*/
	addFilter(name) {
		if (!this._opts.filters) this._opts.filters = [name];
		else this._opts.filters.push(name);
		return this;
	}
	/**
	* Removes a filter function.
	* @returns this `Builder` instance.
	*/
	removeFilter(name) {
		if (this._opts.filters) {
			const i = this._opts.filters.indexOf(name);
			if (i > 0) this._opts.filters.splice(i);
		}
		return this;
	}
	/**
	* Clear all filters.
	* @returns this `Builder` instance.
	*/
	clearFilters() {
		this._opts.filters = [];
		return this;
	}
	/**
	* Sets `opts.quality` to `q`.
	* @returns this `Builder` instance.
	*/
	quality(q) {
		this._opts.quality = q;
		return this;
	}
	/**
	* Specifies which `Image` implementation class to use.
	* @returns this `Builder` instance.
	*/
	useImageClass(imageClass) {
		this._opts.ImageClass = imageClass;
		return this;
	}
	/**
	* Sets `opts.generator` to `generator`
	* @returns this `Builder` instance.
	*/
	useGenerator(generator, options) {
		if (!this._opts.generators) this._opts.generators = [];
		this._opts.generators.push(options ? {
			name: generator,
			options
		} : generator);
		return this;
	}
	/**
	* Specifies which `Quantizer` implementation class to use
	* @returns this `Builder` instance.
	*/
	useQuantizer(quantizer, options) {
		this._opts.quantizer = options ? {
			name: quantizer,
			options
		} : quantizer;
		return this;
	}
	/**
	* Builds and returns a `Vibrant` instance as configured.
	*/
	build() {
		return new Vibrant(this._src, this._opts);
	}
	/**
	* Builds a `Vibrant` instance as configured and calls its `getPalette` method.
	*/
	getPalette() {
		return this.build().getPalette();
	}
};
//#endregion
//#region node_modules/@vibrant/core/dist/esm/pipeline/index.js
var Stage = class {
	constructor(pipeline) {
		this.pipeline = pipeline;
		this._map = {};
	}
	names() {
		return Object.keys(this._map);
	}
	has(name) {
		return !!this._map[name];
	}
	get(name) {
		return this._map[name];
	}
	register(name, stageFn) {
		this._map[name] = stageFn;
		return this.pipeline;
	}
};
var BasicPipeline = class {
	constructor() {
		this.filter = new Stage(this);
		this.quantizer = new Stage(this);
		this.generator = new Stage(this);
	}
	_buildProcessTasks({ filters, quantizer, generators }) {
		if (generators.length === 1 && generators[0] === "*") generators = this.generator.names();
		return {
			filters: filters.map((f) => createTask(this.filter, f)),
			quantizer: createTask(this.quantizer, quantizer),
			generators: generators.map((g) => createTask(this.generator, g))
		};
		function createTask(stage, o) {
			let name;
			let options;
			if (typeof o === "string") name = o;
			else {
				name = o.name;
				options = o.options;
			}
			return {
				name,
				fn: stage.get(name),
				options
			};
		}
	}
	async process(imageData, opts) {
		const { filters, quantizer, generators } = this._buildProcessTasks(opts);
		const imageFilterData = await this._filterColors(filters, imageData);
		const colors = await this._generateColors(quantizer, imageFilterData);
		return {
			colors,
			palettes: await this._generatePalettes(generators, colors)
		};
	}
	_filterColors(filters, imageData) {
		return Promise.resolve(applyFilters(imageData, filters.map(({ fn }) => fn)));
	}
	_generateColors(quantizer, imageData) {
		return Promise.resolve(quantizer.fn(imageData.data, quantizer.options));
	}
	async _generatePalettes(generators, colors) {
		const promiseArr = await Promise.all(generators.map(({ fn, options }) => Promise.resolve(fn(colors, options))));
		return Promise.resolve(promiseArr.reduce((promises, promiseVal, i) => {
			promises[generators[i].name] = promiseVal;
			return promises;
		}, {}));
	}
};
//#endregion
//#region node_modules/@vibrant/color/dist/esm/converter.js
function rgbToHex(r, g, b) {
	return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1, 7);
}
function rgbToHsl(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h = 0;
	let s = 0;
	const l = (max + min) / 2;
	if (max !== min) {
		const d = max - min;
		s = l > .5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return [
		h,
		s,
		l
	];
}
function hslToRgb(h, s, l) {
	let r;
	let g;
	let b;
	function hue2rgb(p, q, t) {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}
	if (s === 0) r = g = b = l;
	else {
		const q = l < .5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	return [
		r * 255,
		g * 255,
		b * 255
	];
}
//#endregion
//#region node_modules/@vibrant/color/dist/esm/index.js
var Swatch = class Swatch {
	static applyFilters(colors, filters) {
		return filters.length > 0 ? colors.filter(({ r, g, b }) => {
			for (let j = 0; j < filters.length; j++) if (!filters[j]?.(r, g, b, 255)) return false;
			return true;
		}) : colors;
	}
	/**
	* Make a value copy of a swatch based on a previous one. Returns a new Swatch instance
	* @param {Swatch} swatch
	*/
	static clone(swatch) {
		return new Swatch(swatch._rgb, swatch._population);
	}
	/**
	* The red value in the RGB value
	*/
	get r() {
		return this._rgb[0];
	}
	/**
	* The green value in the RGB value
	*/
	get g() {
		return this._rgb[1];
	}
	/**
	* The blue value in the RGB value
	*/
	get b() {
		return this._rgb[2];
	}
	/**
	* The color value as a rgb value
	*/
	get rgb() {
		return this._rgb;
	}
	/**
	* The color value as a hsl value
	*/
	get hsl() {
		if (!this._hsl) {
			const [r, g, b] = this._rgb;
			this._hsl = rgbToHsl(r, g, b);
		}
		return this._hsl;
	}
	/**
	* The color value as a hex string
	*/
	get hex() {
		if (!this._hex) {
			const [r, g, b] = this._rgb;
			this._hex = rgbToHex(r, g, b);
		}
		return this._hex;
	}
	get population() {
		return this._population;
	}
	/**
	* Get the JSON object for the swatch
	*/
	toJSON() {
		return {
			rgb: this.rgb,
			population: this.population
		};
	}
	getYiq() {
		if (!this._yiq) {
			const rgb = this._rgb;
			this._yiq = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1e3;
		}
		return this._yiq;
	}
	/**
	* Returns an appropriate color to use for any 'title' text which is displayed over this Swatch's color.
	*/
	get titleTextColor() {
		if (!this._titleTextColor) this._titleTextColor = this.getYiq() < 200 ? "#fff" : "#000";
		return this._titleTextColor;
	}
	/**
	* Returns an appropriate color to use for any 'body' text which is displayed over this Swatch's color.
	*/
	get bodyTextColor() {
		if (!this._bodyTextColor) this._bodyTextColor = this.getYiq() < 150 ? "#fff" : "#000";
		return this._bodyTextColor;
	}
	/**
	* Internal use.
	* @param rgb `[r, g, b]`
	* @param population Population of the color in an image
	*/
	constructor(rgb, population) {
		this._rgb = rgb;
		this._population = population;
	}
};
//#endregion
//#region node_modules/@vibrant/core/dist/esm/index.js
var _Vibrant = class _Vibrant {
	/**
	*
	* @param _src Path to image file (supports HTTP/HTTPs)
	* @param opts Options (optional)
	*/
	constructor(_src, opts) {
		this._src = _src;
		this.opts = assignDeep({}, _Vibrant.DefaultOpts, opts);
	}
	static use(pipeline) {
		this._pipeline = pipeline;
	}
	static from(src) {
		return new Builder(src);
	}
	get result() {
		return this._result;
	}
	_process(image, opts) {
		image.scaleDown(this.opts);
		const processOpts = buildProcessOptions(this.opts, opts);
		return _Vibrant._pipeline.process(image.getImageData(), processOpts);
	}
	async getPalette() {
		const image = new this.opts.ImageClass();
		try {
			const image1 = await image.load(this._src);
			const result1 = await this._process(image1, { generators: ["default"] });
			this._result = result1;
			const res = result1.palettes["default"];
			if (!res) throw new Error(`Something went wrong and a palette was not found, please file a bug against our GitHub repo: https://github.com/vibrant-Colors/node-vibrant/`);
			image.remove();
			return res;
		} catch (err) {
			image.remove();
			return Promise.reject(err);
		}
	}
	async getPalettes() {
		const image = new this.opts.ImageClass();
		try {
			const image1 = await image.load(this._src);
			const result1 = await this._process(image1, { generators: ["*"] });
			this._result = result1;
			const res = result1.palettes;
			image.remove();
			return res;
		} catch (err) {
			image.remove();
			return Promise.reject(err);
		}
	}
};
_Vibrant.DefaultOpts = {
	colorCount: 64,
	quality: 5,
	filters: []
};
var Vibrant = _Vibrant;
//#endregion
//#region node_modules/node-vibrant/dist/esm/configs/config.js
Vibrant.DefaultOpts.quantizer = "mmcq";
Vibrant.DefaultOpts.generators = ["default"];
Vibrant.DefaultOpts.filters = ["default"];
//#endregion
//#region node_modules/node-vibrant/dist/esm/configs/browser.js
Vibrant.DefaultOpts.ImageClass = BrowserImage;
//#endregion
//#region node_modules/@vibrant/quantizer-mmcq/dist/esm/vbox.js
var SIGBITS = 5;
var RSHIFT = 8 - SIGBITS;
var VBox = class VBox {
	constructor(r1, r2, g1, g2, b1, b2, histogram) {
		this.histogram = histogram;
		this._volume = -1;
		this._avg = null;
		this._count = -1;
		this.dimension = {
			r1,
			r2,
			g1,
			g2,
			b1,
			b2
		};
	}
	static build(pixels) {
		const h = new Histogram(pixels, { sigBits: SIGBITS });
		const { rmin, rmax, gmin, gmax, bmin, bmax } = h;
		return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, h);
	}
	invalidate() {
		this._volume = this._count = -1;
		this._avg = null;
	}
	volume() {
		if (this._volume < 0) {
			const { r1, r2, g1, g2, b1, b2 } = this.dimension;
			this._volume = (r2 - r1 + 1) * (g2 - g1 + 1) * (b2 - b1 + 1);
		}
		return this._volume;
	}
	count() {
		if (this._count < 0) {
			const { hist, getColorIndex } = this.histogram;
			const { r1, r2, g1, g2, b1, b2 } = this.dimension;
			let c = 0;
			for (let r = r1; r <= r2; r++) for (let g = g1; g <= g2; g++) for (let b = b1; b <= b2; b++) {
				const index = getColorIndex(r, g, b);
				if (!hist[index]) continue;
				c += hist[index];
			}
			this._count = c;
		}
		return this._count;
	}
	clone() {
		const { histogram } = this;
		const { r1, r2, g1, g2, b1, b2 } = this.dimension;
		return new VBox(r1, r2, g1, g2, b1, b2, histogram);
	}
	avg() {
		if (!this._avg) {
			const { hist, getColorIndex } = this.histogram;
			const { r1, r2, g1, g2, b1, b2 } = this.dimension;
			let ntot = 0;
			const mult = 1 << 8 - SIGBITS;
			let rsum;
			let gsum;
			let bsum;
			rsum = gsum = bsum = 0;
			for (let r = r1; r <= r2; r++) for (let g = g1; g <= g2; g++) for (let b = b1; b <= b2; b++) {
				const h = hist[getColorIndex(r, g, b)];
				if (!h) continue;
				ntot += h;
				rsum += h * (r + .5) * mult;
				gsum += h * (g + .5) * mult;
				bsum += h * (b + .5) * mult;
			}
			if (ntot) this._avg = [
				~~(rsum / ntot),
				~~(gsum / ntot),
				~~(bsum / ntot)
			];
			else this._avg = [
				~~(mult * (r1 + r2 + 1) / 2),
				~~(mult * (g1 + g2 + 1) / 2),
				~~(mult * (b1 + b2 + 1) / 2)
			];
		}
		return this._avg;
	}
	contains(rgb) {
		let [r, g, b] = rgb;
		const { r1, r2, g1, g2, b1, b2 } = this.dimension;
		r >>= RSHIFT;
		g >>= RSHIFT;
		b >>= RSHIFT;
		return r >= r1 && r <= r2 && g >= g1 && g <= g2 && b >= b1 && b <= b2;
	}
	split() {
		const { hist, getColorIndex } = this.histogram;
		const { r1, r2, g1, g2, b1, b2 } = this.dimension;
		const count = this.count();
		if (!count) return [];
		if (count === 1) return [this.clone()];
		const rw = r2 - r1 + 1;
		const gw = g2 - g1 + 1;
		const bw = b2 - b1 + 1;
		const maxw = Math.max(rw, gw, bw);
		let accSum = null;
		let sum;
		let total;
		sum = total = 0;
		let maxd = null;
		if (maxw === rw) {
			maxd = "r";
			accSum = new Uint32Array(r2 + 1);
			for (let r = r1; r <= r2; r++) {
				sum = 0;
				for (let g = g1; g <= g2; g++) for (let b = b1; b <= b2; b++) {
					const index = getColorIndex(r, g, b);
					if (!hist[index]) continue;
					sum += hist[index];
				}
				total += sum;
				accSum[r] = total;
			}
		} else if (maxw === gw) {
			maxd = "g";
			accSum = new Uint32Array(g2 + 1);
			for (let g = g1; g <= g2; g++) {
				sum = 0;
				for (let r = r1; r <= r2; r++) for (let b = b1; b <= b2; b++) {
					const index = getColorIndex(r, g, b);
					if (!hist[index]) continue;
					sum += hist[index];
				}
				total += sum;
				accSum[g] = total;
			}
		} else {
			maxd = "b";
			accSum = new Uint32Array(b2 + 1);
			for (let b = b1; b <= b2; b++) {
				sum = 0;
				for (let r = r1; r <= r2; r++) for (let g = g1; g <= g2; g++) {
					const index = getColorIndex(r, g, b);
					if (!hist[index]) continue;
					sum += hist[index];
				}
				total += sum;
				accSum[b] = total;
			}
		}
		let splitPoint = -1;
		const reverseSum = new Uint32Array(accSum.length);
		for (let i = 0; i < accSum.length; i++) {
			const d = accSum[i];
			if (!d) continue;
			if (splitPoint < 0 && d > total / 2) splitPoint = i;
			reverseSum[i] = total - d;
		}
		const vbox = this;
		function doCut(d) {
			const dim1 = d + "1";
			const dim2 = d + "2";
			const d1 = vbox.dimension[dim1];
			let d2 = vbox.dimension[dim2];
			const vbox1 = vbox.clone();
			const vbox2 = vbox.clone();
			const left = splitPoint - d1;
			const right = d2 - splitPoint;
			if (left <= right) {
				d2 = Math.min(d2 - 1, ~~(splitPoint + right / 2));
				d2 = Math.max(0, d2);
			} else {
				d2 = Math.max(d1, ~~(splitPoint - 1 - left / 2));
				d2 = Math.min(vbox.dimension[dim2], d2);
			}
			while (!accSum[d2]) d2++;
			let c2 = reverseSum[d2];
			while (!c2 && accSum[d2 - 1]) c2 = reverseSum[--d2];
			vbox1.dimension[dim2] = d2;
			vbox2.dimension[dim1] = d2 + 1;
			return [vbox1, vbox2];
		}
		return doCut(maxd);
	}
};
//#endregion
//#region node_modules/@vibrant/quantizer-mmcq/dist/esm/pqueue.js
var PQueue = class {
	_sort() {
		if (!this._sorted) {
			this.contents.sort(this._comparator);
			this._sorted = true;
		}
	}
	constructor(comparator) {
		this._comparator = comparator;
		this.contents = [];
		this._sorted = false;
	}
	push(item) {
		this.contents.push(item);
		this._sorted = false;
	}
	peek(index) {
		this._sort();
		index = typeof index === "number" ? index : this.contents.length - 1;
		return this.contents[index];
	}
	pop() {
		this._sort();
		return this.contents.pop();
	}
	size() {
		return this.contents.length;
	}
	map(mapper) {
		this._sort();
		return this.contents.map(mapper);
	}
};
//#endregion
//#region node_modules/@vibrant/quantizer-mmcq/dist/esm/index.js
var fractByPopulations = .75;
function _splitBoxes(pq, target) {
	let lastSize = pq.size();
	while (pq.size() < target) {
		const vbox = pq.pop();
		if (vbox && vbox.count() > 0) {
			const [vbox1, vbox2] = vbox.split();
			if (!vbox1) break;
			pq.push(vbox1);
			if (vbox2 && vbox2.count() > 0) pq.push(vbox2);
			if (pq.size() === lastSize) break;
			else lastSize = pq.size();
		} else break;
	}
}
var MMCQ = (pixels, opts) => {
	if (pixels.length === 0 || opts.colorCount < 2 || opts.colorCount > 256) throw new Error("Wrong MMCQ parameters");
	const vbox = VBox.build(pixels);
	vbox.histogram.colorCount;
	const pq = new PQueue((a, b) => a.count() - b.count());
	pq.push(vbox);
	_splitBoxes(pq, fractByPopulations * opts.colorCount);
	const pq2 = new PQueue((a, b) => a.count() * a.volume() - b.count() * b.volume());
	pq2.contents = pq.contents;
	_splitBoxes(pq2, opts.colorCount - pq2.size());
	return generateSwatches(pq2);
};
function generateSwatches(pq) {
	const swatches = [];
	while (pq.size()) {
		const v = pq.pop();
		const color = v.avg();
		const [r, g, b] = color;
		swatches.push(new Swatch(color, v.count()));
	}
	return swatches;
}
//#endregion
//#region node_modules/@vibrant/generator-default/dist/esm/index.js
var DefaultOpts = {
	targetDarkLuma: .26,
	maxDarkLuma: .45,
	minLightLuma: .55,
	targetLightLuma: .74,
	minNormalLuma: .3,
	targetNormalLuma: .5,
	maxNormalLuma: .7,
	targetMutesSaturation: .3,
	maxMutesSaturation: .4,
	targetVibrantSaturation: 1,
	minVibrantSaturation: .35,
	weightSaturation: 3,
	weightLuma: 6.5,
	weightPopulation: .5
};
function _findMaxPopulation(swatches) {
	let p = 0;
	swatches.forEach((s) => {
		p = Math.max(p, s.population);
	});
	return p;
}
function _isAlreadySelected(palette, s) {
	return palette.Vibrant === s || palette.DarkVibrant === s || palette.LightVibrant === s || palette.Muted === s || palette.DarkMuted === s || palette.LightMuted === s;
}
function _createComparisonValue(saturation, targetSaturation, luma, targetLuma, population, maxPopulation, opts) {
	function weightedMean(...values) {
		let sum = 0;
		let weightSum = 0;
		for (let i = 0; i < values.length; i += 2) {
			const value = values[i];
			const weight = values[i + 1];
			if (!value || !weight) continue;
			sum += value * weight;
			weightSum += weight;
		}
		return sum / weightSum;
	}
	function invertDiff(value, targetValue) {
		return 1 - Math.abs(value - targetValue);
	}
	return weightedMean(invertDiff(saturation, targetSaturation), opts.weightSaturation, invertDiff(luma, targetLuma), opts.weightLuma, population / maxPopulation, opts.weightPopulation);
}
function _findColorVariation(palette, swatches, maxPopulation, targetLuma, minLuma, maxLuma, targetSaturation, minSaturation, maxSaturation, opts) {
	let max = null;
	let maxValue = 0;
	swatches.forEach((swatch) => {
		const [, s, l] = swatch.hsl;
		if (s >= minSaturation && s <= maxSaturation && l >= minLuma && l <= maxLuma && !_isAlreadySelected(palette, swatch)) {
			const value = _createComparisonValue(s, targetSaturation, l, targetLuma, swatch.population, maxPopulation, opts);
			if (max === null || value > maxValue) {
				max = swatch;
				maxValue = value;
			}
		}
	});
	return max;
}
function _generateVariationColors(swatches, maxPopulation, opts) {
	const palette = {
		Vibrant: null,
		DarkVibrant: null,
		LightVibrant: null,
		Muted: null,
		DarkMuted: null,
		LightMuted: null
	};
	palette.Vibrant = _findColorVariation(palette, swatches, maxPopulation, opts.targetNormalLuma, opts.minNormalLuma, opts.maxNormalLuma, opts.targetVibrantSaturation, opts.minVibrantSaturation, 1, opts);
	palette.LightVibrant = _findColorVariation(palette, swatches, maxPopulation, opts.targetLightLuma, opts.minLightLuma, 1, opts.targetVibrantSaturation, opts.minVibrantSaturation, 1, opts);
	palette.DarkVibrant = _findColorVariation(palette, swatches, maxPopulation, opts.targetDarkLuma, 0, opts.maxDarkLuma, opts.targetVibrantSaturation, opts.minVibrantSaturation, 1, opts);
	palette.Muted = _findColorVariation(palette, swatches, maxPopulation, opts.targetNormalLuma, opts.minNormalLuma, opts.maxNormalLuma, opts.targetMutesSaturation, 0, opts.maxMutesSaturation, opts);
	palette.LightMuted = _findColorVariation(palette, swatches, maxPopulation, opts.targetLightLuma, opts.minLightLuma, 1, opts.targetMutesSaturation, 0, opts.maxMutesSaturation, opts);
	palette.DarkMuted = _findColorVariation(palette, swatches, maxPopulation, opts.targetDarkLuma, 0, opts.maxDarkLuma, opts.targetMutesSaturation, 0, opts.maxMutesSaturation, opts);
	return palette;
}
function _generateEmptySwatches(palette, _maxPopulation, opts) {
	if (!palette.Vibrant && !palette.DarkVibrant && !palette.LightVibrant) {
		if (!palette.DarkVibrant && palette.DarkMuted) {
			let [h, s, l] = palette.DarkMuted.hsl;
			l = opts.targetDarkLuma;
			palette.DarkVibrant = new Swatch(hslToRgb(h, s, l), 0);
		}
		if (!palette.LightVibrant && palette.LightMuted) {
			let [h, s, l] = palette.LightMuted.hsl;
			l = opts.targetDarkLuma;
			palette.DarkVibrant = new Swatch(hslToRgb(h, s, l), 0);
		}
	}
	if (!palette.Vibrant && palette.DarkVibrant) {
		let [h, s, l] = palette.DarkVibrant.hsl;
		l = opts.targetNormalLuma;
		palette.Vibrant = new Swatch(hslToRgb(h, s, l), 0);
	} else if (!palette.Vibrant && palette.LightVibrant) {
		let [h, s, l] = palette.LightVibrant.hsl;
		l = opts.targetNormalLuma;
		palette.Vibrant = new Swatch(hslToRgb(h, s, l), 0);
	}
	if (!palette.DarkVibrant && palette.Vibrant) {
		let [h, s, l] = palette.Vibrant.hsl;
		l = opts.targetDarkLuma;
		palette.DarkVibrant = new Swatch(hslToRgb(h, s, l), 0);
	}
	if (!palette.LightVibrant && palette.Vibrant) {
		let [h, s, l] = palette.Vibrant.hsl;
		l = opts.targetLightLuma;
		palette.LightVibrant = new Swatch(hslToRgb(h, s, l), 0);
	}
	if (!palette.Muted && palette.Vibrant) {
		let [h, s, l] = palette.Vibrant.hsl;
		l = opts.targetMutesSaturation;
		palette.Muted = new Swatch(hslToRgb(h, s, l), 0);
	}
	if (!palette.DarkMuted && palette.DarkVibrant) {
		let [h, s, l] = palette.DarkVibrant.hsl;
		l = opts.targetMutesSaturation;
		palette.DarkMuted = new Swatch(hslToRgb(h, s, l), 0);
	}
	if (!palette.LightMuted && palette.LightVibrant) {
		let [h, s, l] = palette.LightVibrant.hsl;
		l = opts.targetMutesSaturation;
		palette.LightMuted = new Swatch(hslToRgb(h, s, l), 0);
	}
}
var DefaultGenerator = ((swatches, opts) => {
	opts = Object.assign({}, DefaultOpts, opts);
	const maxPopulation = _findMaxPopulation(swatches);
	const palette = _generateVariationColors(swatches, maxPopulation, opts);
	_generateEmptySwatches(palette, maxPopulation, opts);
	return palette;
});
//#endregion
//#region node_modules/node-vibrant/dist/esm/pipeline/index.js
var pipeline = new BasicPipeline().filter.register("default", (r, g, b, a) => a >= 125 && !(r > 250 && g > 250 && b > 250)).quantizer.register("mmcq", MMCQ).generator.register("default", DefaultGenerator);
//#endregion
//#region node_modules/node-vibrant/dist/esm/browser.js
Vibrant.use(pipeline);
//#endregion
//#region node_modules/linked-list/index.js
/**
* Creates an iterator that iterates over a list (through an item).
*
* @template {Item} [T=Item]
*/
var ItemIterator = class {
	/**
	* Create a new iterator.
	*
	* @param {T|null} item
	*/
	constructor(item) {
		/** @type {T|null} */
		this.item = item;
	}
	/**
	* Move to the next item.
	*
	* @returns {IteratorResult<T, null>}
	*/
	next() {
		const value = this.item;
		if (value) {
			this.item = value.next;
			return {
				value,
				done: false
			};
		}
		return {
			value: null,
			done: true
		};
	}
};
/**
* Double linked list item.
*/
var Item = class {
	/**
	* Create a new linked list item.
	*/
	constructor() {
		/**
		* The following item or `null` otherwise.
		*
		* @type {this|null}
		*/
		this.next;
		/**
		* The preceding item or `null` otherwise.
		*
		* @type {this|null}
		*/
		this.prev;
		/**
		* The list this item belongs to or `null` otherwise.
		*
		* @type {List<this>|null}
		*/
		this.list;
	}
	/**
	* Add the given item **after** the operated on item in a list.
	*
	* Throws an error when the given item has no `detach`, `append`, or
	* `prepend` methods.
	* Returns `false` when the operated on item is not attached to a list,
	* otherwise the given item.
	*
	* @param {this} item
	* @returns {this|false}
	*/
	append(item) {
		const list = this.list;
		if (!item || !item.append || !item.prepend || !item.detach) throw new Error("An argument without append, prepend, or detach methods was given to `Item#append`.");
		if (!list || this === item) return false;
		item.detach();
		if (this.next) {
			item.next = this.next;
			this.next.prev = item;
		}
		item.prev = this;
		item.list = list;
		this.next = item;
		if (this === list.tail || !list.tail) list.tail = item;
		list.size++;
		return item;
	}
	/**
	* Add the given item **before** the operated on item in a list.
	*
	* Throws an error when the given item has no `detach`, `append`, or `prepend`
	* methods.
	* Returns `false` when the operated on item is not attached to a list,
	* otherwise the given item.
	*
	* @param {this} item
	* @returns {this|false}
	*/
	prepend(item) {
		const list = this.list;
		if (!item || !item.append || !item.prepend || !item.detach) throw new Error("An argument without append, prepend, or detach methods was given to `Item#prepend`.");
		if (!list || this === item) return false;
		item.detach();
		if (this.prev) {
			item.prev = this.prev;
			this.prev.next = item;
		}
		item.next = this;
		item.list = list;
		this.prev = item;
		if (this === list.head) list.head = item;
		if (!list.tail) list.tail = this;
		list.size++;
		return item;
	}
	/**
	* Remove the operated on item from its parent list.
	*
	* Removes references to it on its parent `list`, and `prev` and `next`
	* items.
	* Relinks all references.
	* Returns the operated on item.
	* Even when it was already detached.
	*
	* @returns {this}
	*/
	detach() {
		const list = this.list;
		if (!list) return this;
		if (list.tail === this) list.tail = this.prev;
		if (list.head === this) list.head = this.next;
		if (list.tail === list.head) list.tail = null;
		if (this.prev) this.prev.next = this.next;
		if (this.next) this.next.prev = this.prev;
		this.prev = null;
		this.next = null;
		this.list = null;
		list.size--;
		return this;
	}
};
Item.prototype.next = null;
Item.prototype.prev = null;
Item.prototype.list = null;
/**
* Double linked list.
*
* @template {Item} [T=Item]
* @implements {Iterable<T>}
*/
var List = class {
	/**
	* Create a new `this` from the given array of items.
	*
	* Ignores `null` or `undefined` values.
	* Throws an error when a given item has no `detach`, `append`, or `prepend`
	* methods.
	*
	* @template {Item} [T=Item]
	* @param {Array<T|null|undefined>} [items]
	*/
	static from(items) {
		return appendAll(new this(), items);
	}
	/**
	* Create a new `this` from the given arguments.
	*
	* Ignores `null` or `undefined` values.
	* Throws an error when a given item has no `detach`, `append`, or `prepend`
	* methods.
	*
	* @template {Item} [T=Item]
	* @param {Array<T|null|undefined>} items
	* @returns {List<T>}
	*/
	static of(...items) {
		return appendAll(new this(), items);
	}
	/**
	* Create a new list from the given items.
	*
	* Ignores `null` or `undefined` values.
	* Throws an error when a given item has no `detach`, `append`, or `prepend`
	* methods.
	*
	* @param {Array<T|null|undefined>} items
	*/
	constructor(...items) {
		/**
		* The number of items in the list.
		*
		* @type {number}
		*/
		this.size;
		/**
		* The first item in a list or `null` otherwise.
		*
		* @type {T|null}
		*/
		this.head;
		/**
		* The last item in a list and `null` otherwise.
		*
		* > 👉 **Note**: a list with only one item has **no tail**, only a head.
		*
		* @type {T|null}
		*/
		this.tail;
		appendAll(this, items);
	}
	/**
	* Append an item to a list.
	*
	* Throws an error when the given item has no `detach`, `append`, or `prepend`
	* methods.
	* Returns the given item.
	*
	* @param {T|null|undefined} [item]
	* @returns {T|false}
	*/
	append(item) {
		if (!item) return false;
		if (!item.append || !item.prepend || !item.detach) throw new Error("An argument without append, prepend, or detach methods was given to `List#append`.");
		if (this.tail) return this.tail.append(item);
		if (this.head) return this.head.append(item);
		item.detach();
		item.list = this;
		this.head = item;
		this.size++;
		return item;
	}
	/**
	* Prepend an item to a list.
	*
	* Throws an error when the given item has no `detach`, `append`, or `prepend`
	* methods.
	* Returns the given item.
	*
	* @param {T|null|undefined} [item]
	* @returns {T|false}
	*/
	prepend(item) {
		if (!item) return false;
		if (!item.append || !item.prepend || !item.detach) throw new Error("An argument without append, prepend, or detach methods was given to `List#prepend`.");
		if (this.head) return this.head.prepend(item);
		item.detach();
		item.list = this;
		this.head = item;
		this.size++;
		return item;
	}
	/**
	* Returns the items of the list as an array.
	*
	* This does *not* detach the items.
	*
	* > **Note**: `List` also implements an iterator.
	* > That means you can also do `[...list]` to get an array.
	*/
	toArray() {
		let item = this.head;
		/** @type {Array<T>} */
		const result = [];
		while (item) {
			result.push(item);
			item = item.next;
		}
		return result;
	}
	/**
	* Creates an iterator from the list.
	*
	* @returns {ItemIterator<T>}
	*/
	[Symbol.iterator]() {
		return new ItemIterator(this.head);
	}
};
List.prototype.size = 0;
List.prototype.tail = null;
List.prototype.head = null;
/**
* Creates a new list from the items passed in.
*
* @template {List<T>} TheList
* @template {Item} [T=Item]
* @param {TheList} list
* @param {Array<T|null|undefined>|undefined} [items]
* @returns {TheList}
*/
function appendAll(list, items) {
	if (!items) return list;
	if (items[Symbol.iterator]) {
		const iterator = items[Symbol.iterator]();
		/** @type {IteratorResult<T|null|undefined, null>} */
		let result;
		while ((result = iterator.next()) && !result.done) list.append(result.value);
	} else {
		let index = -1;
		while (++index < items.length) {
			const item = items[index];
			list.append(item);
		}
	}
	return list;
}
//#endregion
//#region node_modules/countup.js/dist/countUp.min.js
var t = function() {
	return t = Object.assign || function(t) {
		for (var i, e = 1, s = arguments.length; e < s; e++) for (var n in i = arguments[e]) Object.prototype.hasOwnProperty.call(i, n) && (t[n] = i[n]);
		return t;
	}, t.apply(this, arguments);
}, i = function() {
	function i(i, e, s) {
		var n = this;
		this.endVal = e, this.options = s, this.version = "2.10.0", this.defaults = {
			startVal: 0,
			decimalPlaces: 0,
			duration: 2,
			useEasing: !0,
			useGrouping: !0,
			useIndianSeparators: !1,
			smartEasingThreshold: 999,
			smartEasingAmount: 333,
			separator: ",",
			decimal: ".",
			prefix: "",
			suffix: "",
			autoAnimate: !1,
			autoAnimateDelay: 200,
			autoAnimateOnce: !1
		}, this.finalEndVal = null, this.useEasing = !0, this.countDown = !1, this.error = "", this.startVal = 0, this.paused = !0, this.once = !1, this.count = function(t) {
			n.startTime || (n.startTime = t);
			var i = t - n.startTime;
			n.remaining = n.duration - i, n.useEasing ? n.countDown ? n.frameVal = n.startVal - n.easingFn(i, 0, n.startVal - n.endVal, n.duration) : n.frameVal = n.easingFn(i, n.startVal, n.endVal - n.startVal, n.duration) : n.frameVal = n.startVal + (n.endVal - n.startVal) * (i / n.duration);
			n.frameVal = (n.countDown ? n.frameVal < n.endVal : n.frameVal > n.endVal) ? n.endVal : n.frameVal, n.frameVal = Number(n.frameVal.toFixed(n.options.decimalPlaces)), n.printValue(n.frameVal), i < n.duration ? n.rAF = requestAnimationFrame(n.count) : null !== n.finalEndVal ? n.update(n.finalEndVal) : n.options.onCompleteCallback && n.options.onCompleteCallback();
		}, this.formatNumber = function(t) {
			var i, e, s, a, o = t < 0 ? "-" : "";
			i = Math.abs(t).toFixed(n.options.decimalPlaces);
			var r = (i += "").split(".");
			if (e = r[0], s = r.length > 1 ? n.options.decimal + r[1] : "", n.options.useGrouping) {
				a = "";
				for (var l = 3, u = 0, h = 0, p = e.length; h < p; ++h) n.options.useIndianSeparators && 4 === h && (l = 2, u = 1), 0 !== h && u % l == 0 && (a = n.options.separator + a), u++, a = e[p - h - 1] + a;
				e = a;
			}
			return n.options.numerals && n.options.numerals.length && (e = e.replace(/[0-9]/g, (function(t) {
				return n.options.numerals[+t];
			})), s = s.replace(/[0-9]/g, (function(t) {
				return n.options.numerals[+t];
			}))), o + n.options.prefix + e + s + n.options.suffix;
		}, this.easeOutExpo = function(t, i, e, s) {
			return e * (1 - Math.pow(2, -10 * t / s)) * 1024 / 1023 + i;
		}, this.options = t(t({}, this.defaults), s), this.options.enableScrollSpy && (this.options.autoAnimate = !0), void 0 !== this.options.scrollSpyDelay && (this.options.autoAnimateDelay = this.options.scrollSpyDelay), this.options.scrollSpyOnce && (this.options.autoAnimateOnce = !0), this.formattingFn = this.options.formattingFn ? this.options.formattingFn : this.formatNumber, this.easingFn = this.options.easingFn ? this.options.easingFn : this.easeOutExpo, this.el = "string" == typeof i ? document.getElementById(i) : i, e = null == e ? this.parse(this.el.innerHTML) : e, this.startVal = this.validateValue(this.options.startVal), this.frameVal = this.startVal, this.endVal = this.validateValue(e), this.options.decimalPlaces = Math.max(this.options.decimalPlaces), this.resetDuration(), this.options.separator = String(this.options.separator), this.useEasing = this.options.useEasing, "" === this.options.separator && (this.options.useGrouping = !1), this.el ? this.printValue(this.startVal) : this.error = "[CountUp] target is null or undefined", "undefined" != typeof window && this.options.autoAnimate && (this.error || "undefined" == typeof IntersectionObserver ? this.error ? console.error(this.error, i) : console.error("IntersectionObserver is not supported by this browser") : this.setupObserver());
	}
	return i.prototype.setupObserver = function() {
		var t = this, e = i.observedElements.get(this.el);
		e && e.unobserve(), i.observedElements.set(this.el, this), this.observer = new IntersectionObserver((function(i) {
			for (var e = 0, s = i; e < s.length; e++) {
				var n = s[e];
				n.isIntersecting && t.paused && !t.once ? (t.paused = !1, t.autoAnimateTimeout = setTimeout((function() {
					return t.start();
				}), t.options.autoAnimateDelay), t.options.autoAnimateOnce && (t.once = !0, t.observer.disconnect())) : n.isIntersecting || t.paused || (clearTimeout(t.autoAnimateTimeout), t.reset());
			}
		}), { threshold: 0 }), this.observer.observe(this.el);
	}, i.prototype.unobserve = function() {
		var t;
		clearTimeout(this.autoAnimateTimeout), null === (t = this.observer) || void 0 === t || t.disconnect(), i.observedElements.delete(this.el);
	}, i.prototype.onDestroy = function() {
		clearTimeout(this.autoAnimateTimeout), cancelAnimationFrame(this.rAF), this.paused = !0, this.unobserve(), this.options.onCompleteCallback = null, this.options.onStartCallback = null;
	}, i.prototype.determineDirectionAndSmartEasing = function() {
		var t = this.finalEndVal ? this.finalEndVal : this.endVal;
		this.countDown = this.startVal > t;
		var i = t - this.startVal;
		if (Math.abs(i) > this.options.smartEasingThreshold && this.options.useEasing) {
			this.finalEndVal = t;
			var e = this.countDown ? 1 : -1;
			this.endVal = t + e * this.options.smartEasingAmount, this.duration = this.duration / 2;
		} else this.endVal = t, this.finalEndVal = null;
		null !== this.finalEndVal ? this.useEasing = !1 : this.useEasing = this.options.useEasing;
	}, i.prototype.start = function(t) {
		this.error || (this.options.onStartCallback && this.options.onStartCallback(), t && (this.options.onCompleteCallback = t), this.duration > 0 ? (this.determineDirectionAndSmartEasing(), this.paused = !1, this.rAF = requestAnimationFrame(this.count)) : this.printValue(this.endVal));
	}, i.prototype.pauseResume = function() {
		this.paused ? (this.startTime = null, this.duration = this.remaining, this.startVal = this.frameVal, this.determineDirectionAndSmartEasing(), this.rAF = requestAnimationFrame(this.count)) : cancelAnimationFrame(this.rAF), this.paused = !this.paused;
	}, i.prototype.reset = function() {
		clearTimeout(this.autoAnimateTimeout), cancelAnimationFrame(this.rAF), this.paused = !0, this.once = !1, this.resetDuration(), this.startVal = this.validateValue(this.options.startVal), this.frameVal = this.startVal, this.printValue(this.startVal);
	}, i.prototype.update = function(t) {
		cancelAnimationFrame(this.rAF), this.startTime = null, this.endVal = this.validateValue(t), this.endVal !== this.frameVal && (this.startVal = this.frameVal, this.finalEndVal ?? this.resetDuration(), this.finalEndVal = null, this.determineDirectionAndSmartEasing(), this.rAF = requestAnimationFrame(this.count));
	}, i.prototype.printValue = function(t) {
		var i;
		if (this.el) {
			var e = this.formattingFn(t);
			if (null === (i = this.options.plugin) || void 0 === i ? void 0 : i.render) this.options.plugin.render(this.el, e);
			else if ("INPUT" === this.el.tagName) this.el.value = e;
			else "text" === this.el.tagName || "tspan" === this.el.tagName ? this.el.textContent = e : this.el.innerHTML = e;
		}
	}, i.prototype.ensureNumber = function(t) {
		return "number" == typeof t && !isNaN(t);
	}, i.prototype.validateValue = function(t) {
		var i = Number(t);
		return this.ensureNumber(i) ? i : (this.error = "[CountUp] invalid start or end value: ".concat(t), null);
	}, i.prototype.resetDuration = function() {
		this.startTime = null, this.duration = 1e3 * Number(this.options.duration), this.remaining = this.duration;
	}, i.prototype.parse = function(t) {
		var i = function(t) {
			return t.replace(/([.,'  ])/g, "\\$1");
		}, e = i(this.options.separator), s = i(this.options.decimal), n = t.replace(new RegExp(e, "g"), "").replace(new RegExp(s, "g"), ".");
		return parseFloat(n);
	}, i.observedElements = /* @__PURE__ */ new WeakMap(), i;
}();
//#endregion
export { Item, List, Vibrant, ZEngine, i, l };
