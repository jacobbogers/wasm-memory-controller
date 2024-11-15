import Region from "./Region";
import WasmMemoryError from "./WasmMemoryError";
import { REGION_ENTRY_SIZE } from "./constants";
import { sortRegions, formatError } from "./helpers";

export default class Manager {
	#heap: WebAssembly.Memory;
	#regions: Region[];
	#regionCount: DataView;
	#lastError: WasmMemoryError | null;

	constructor(heap: WebAssembly.Memory) {
		this.#lastError = null;
		this.#heap = heap;
		this.#regions = [];
		this.#regionCount = new DataView(
			this.#heap.buffer,
			this.#heap.buffer.byteLength - 4,
			4,
		);
		// if #heap has entry for regions then we need to
		const regionCount = this.#regionCount.getUint32(0, true);
		this.#regions = new Array(regionCount);

		for (let i = 0; i < regionCount; i++) {
			const offsetEntry =
				this.#heap.buffer.byteLength - 4 - REGION_ENTRY_SIZE * (i + 1);
			const dv = new DataView(heap.buffer, offsetEntry, REGION_ENTRY_SIZE);
			// [16 bit id, offset: 32-bit, length: 32-bit]
			const id = dv.getUint16(0, true);
			const offset = dv.getUint32(2, true);
			const length = dv.getUint32(6, true);
			this.#regions[i] = new Region(id, dv, offset, length);
		}
		this.#regions.sort(sortRegions);
	}

	private setLatestError(error: WasmMemoryError | null) {
		this.#lastError = error;
	}

	getLatestError() {
		return this.#lastError;
	}

	claim(id16Bit: number, octetSize: number): Region | null {
		// assume the this.#regions is sorted by offset property
		let start = 0; // start mem chuck
		const regionCount = this.#regionCount.getUint32(0, true);
		const offsetEntry =
			this.#heap.buffer.byteLength - 4 - REGION_ENTRY_SIZE * (regionCount + 1);
		// at this point we have determined the lowest point in the metadata array
		// but do we have a large enough chunk somewhere equal to requesteed "octetSize"
		for (const region of this.#regions) {
			const avail = region.offset - start;
			if (avail >= octetSize) {
				// claim the region
				const dv = new DataView(
					this.#heap.buffer,
					offsetEntry,
					REGION_ENTRY_SIZE,
				);
				dv.setUint16(0, id16Bit, true);
				dv.setUint32(2, start, true);
				dv.setUint32(6, octetSize, true);
				const rg = new Region(id16Bit, dv, start, octetSize);
				this.#regions.push(rg);
				this.#regions.sort(sortRegions);
				this.setLatestError(null);
				return rg;
			}
			start = region.offset + region.length;
		}
		// so there is no whole between regions large enough for octetSize, so we need to add new
		if (offsetEntry - start >= octetSize) {
			// claim the region
			const dv = new DataView(
				this.#heap.buffer,
				offsetEntry,
				REGION_ENTRY_SIZE,
			);
			dv.setUint16(0, id16Bit, true);
			dv.setUint32(2, start, true);
			dv.setUint32(6, octetSize, true);
			const rg = new Region(id16Bit, dv, start, octetSize);
			this.#regions.push(rg);
			this.#regions.sort(sortRegions);
			this.setLatestError(null);
			return rg;
		}
		this.setLatestError(new WasmMemoryError(1, formatError(1)));
		return null;
	}
}
