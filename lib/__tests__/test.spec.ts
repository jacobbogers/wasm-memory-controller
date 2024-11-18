// needed for some vscode environments
/// <reference types="vitest/globals" />
import Manager from "../Manager";
import WasmMemoryError from "../WasmMemoryError";

const KB = 1024;

const fixtureSerializedMemory = new Uint8Array([
	5, 0, 0, 176, 0, 0, 0, 16, 0, 0,
	//
	4, 0, 0, 160, 0, 0, 0, 16, 0, 0,
	//
	3, 0, 0, 64, 1, 0, 0, 160, 0, 0,
	//
	1, 0, 0, 0, 0, 0, 0, 160, 0, 0,
	//
	4, 0, 0, 0,
]);

describe("manager", () => {
	it.concurrent("claim more memory then exist in heap", () => {
		const heap = new WebAssembly.Memory({ initial: 2, maximum: 3 }); // 128k
		const mm = new Manager(heap);
		const region50k = mm.claim(1, 50 * KB); // 50k
		expect(mm.getLatestError()).toBeNull();
		const region100k = mm.claim(2, 100 * KB); // 100k
		expect(mm.getLatestError()).toEqual(
			new WasmMemoryError(
				1,
				"no continues chunk of request size [102400 bytes] available",
			),
		);
		expect(region100k).toBeNull();
	});
	it.concurrent("space re-use", () => {
		const heap = new WebAssembly.Memory({ initial: 2, maximum: 3 }); // 128k
		const mm = new Manager(heap);
		const regionA = mm.claim(1, 40 * KB); // 50k
		expect(mm.getLatestError()).toBeNull();
		const regionB = mm.claim(2, 40 * KB); // 80k
		expect(mm.getLatestError()).toBeNull();
		const regionC = mm.claim(3, 40 * KB); // 120k
		expect(mm.getLatestError()).toBeNull();
		const regionD = mm.claim(2, 5 * KB); // 120k
		//
		//
		{
			// weird I have to do this trick, maybe its a vitest issue
			const regions = mm.regions;
			expect(regions).toEqual([
				{
					id: 1,
					offset: 0,
					len: 40960,
				},
				{
					id: 2,

					offset: 40960,
					len: 40960,
				},
				{
					id: 3,

					offset: 81920,
					len: 40960,
				},
				{
					id: 2,

					offset: 122880,
					len: 5120,
				},
			]);
		}
		mm.freeViaRegionId(2);
		{
			const regions = mm.regions;
			expect(regions).toEqual([
				{
					id: 1,
					offset: 0,
					len: 40960,
				},
				{
					id: 3,

					offset: 81920,
					len: 40960,
				},
			]);
		}

		const region = mm.claim(4, 4096);
		{
			const regions = mm.regions;
			expect(regions).toEqual([
				{
					id: 1,
					offset: 0,
					len: 40960,
				},
				{
					id: 4,

					offset: 40960,
					len: 4096,
				},
				{
					id: 3,

					offset: 81920,
					len: 40960,
				},
			]);
		}
	});
	it.concurrent("remove non-existing region id", () => {
		const heap = new WebAssembly.Memory({ initial: 2, maximum: 3 }); // 128k
		const mm = new Manager(heap);
		const regionA = mm.claim(1, 40 * KB); // 50k
		expect(mm.getLatestError()).toBeNull();
		const regionB = mm.claim(2, 40 * KB); // 80k
		expect(mm.getLatestError()).toBeNull();
		const regionC = mm.claim(3, 40 * KB); // 120k
		expect(mm.getLatestError()).toBeNull();

		const regionRemoved = mm.freeViaRegionId(1234);
		expect(regionRemoved).toBeNull();
	});
	it.concurrent("remove the last entry", () => {
		const heap = new WebAssembly.Memory({ initial: 2, maximum: 3 }); // 128k
		const mm = new Manager(heap);
		const regionA = mm.claim(1, 40 * KB); // 50k
		expect(mm.getLatestError()).toBeNull();
		const regionB = mm.claim(2, 40 * KB); // 80k
		expect(mm.getLatestError()).toBeNull();
		const regionC = mm.claim(3, 40 * KB); // 120k
		expect(mm.getLatestError()).toBeNull();

		const regionRemoved = mm.freeViaRegionId(3);
		{
			// weird I have to do this trick, maybe its a vitest issue
			const regions = mm.regions;
			expect(regions).toEqual([
				{
					id: 1,
					offset: 0,
					len: 40960,
				},
				{
					id: 2,

					offset: 40960,
					len: 40960,
				},
			]);
		}
	});
	it.concurrent("serialize the metainfo of a datablock", () => {
		const heap = new WebAssembly.Memory({ initial: 2, maximum: 3 }); // 128k
		const mm = new Manager(heap);
		mm.claim(1, 40 * KB); // 50k
		mm.claim(2, 40 * KB); // 80k
		mm.claim(3, 40 * KB); // 120k
		mm.freeViaRegionId(2);
		mm.claim(4, 4 * KB); // 120k
		mm.claim(5, 4 * KB); // 120k
		const regions = mm.regions;
		expect(regions).toEqual([
			{ id: 1, offset: 0, len: 40960 },
			{ id: 4, offset: 40960, len: 4096 },
			{ id: 5, offset: 45056, len: 4096 },
			{ id: 3, offset: 81920, len: 40960 },
		]);
		expect(mm.getMeta()).toEqual(fixtureSerializedMemory);
	});
	it.concurrent("resurrect the metainfo of a datablock", () => {
		const heap = new WebAssembly.Memory({ initial: 2, maximum: 3 }); // 128k
		const octets = new Uint8Array(heap.buffer);
		octets.set(
			fixtureSerializedMemory,
			octets.byteLength - fixtureSerializedMemory.byteLength,
		);
		const mm = new Manager(heap);
		const regions = mm.regions;
		expect(regions).toEqual([
			{ id: 1, offset: 0, len: 40960 },
			{ id: 4, offset: 40960, len: 4096 },
			{ id: 5, offset: 45056, len: 4096 },
			{ id: 3, offset: 81920, len: 40960 },
		]);
	});
});
