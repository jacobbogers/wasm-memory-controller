export default class Region {
	#id: number;
	#meta: DataView;
	#offset: number;
	#len: number;
	constructor(id: number, meta: DataView, offset: number, len: number) {
		this.#id = id;
		this.#meta = meta;
		this.#offset = offset;
		this.#len = len;
	}
	public compareTo(target: Region): number {
		return this.#offset - target.#offset;
	}
	public clearEntry() {
		this.#meta.setUint16(0, 0);
		this.#meta.setUint32(2, 0);
		this.#meta.setUint32(6, 0);
	}

	public get id() {
		return this.#id;
	}

	public get len() {
		return this.#len;
	}

	public get offset() {
		return this.#offset;
	}
}
