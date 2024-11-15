export default class WasmMemoryError extends Error {
	constructor(
		private readonly code: number,
		message: string,
	) {
		super(`${code}: ${message}`);
	}
}
