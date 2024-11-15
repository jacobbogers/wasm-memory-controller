// nr of regions 32-bit
// region1  [16 bit id, offset: 32-bit, length: 32-bit], 2 + 4 +4
// region2  [16 bit id, offset: 32-bit, length: 32-bit],
// region3  [16 bit id, offset: 32-bit, length: 32-bit],
// region4  [16 bit id, offset: 32-bit, length: 32-bit],
// region5  [16 bit id, offset: 32-bit, length: 32-bit],

export default class Region {
	constructor(
		private readonly _id: number,
		private readonly _meta: DataView,
		private readonly _offset: number,
		private readonly _length: number,
	) {}

	public compareTo(target: Region): number {
		return this._offset - target._offset;
	}
	public clearEntry() {
		this._meta.setUint16(0, 0);
		this._meta.setUint32(2, 0);
		this._meta.setUint32(6, 0);
	}

	public get id() {
		return this._id;
	}

	public get length() {
		return this._length;
	}

	public get offset() {
		return this._offset;
	}
}
