import Manager from "../Manager";
import WasmMemoryError from "../WasmMemoryError";

describe("manager", () => {
	it.concurrent(
		"claim 3 buffers sequentially and release the middle one",
		() => {
			const heap = new WebAssembly.Memory({ initial: 2, maximum: 3 }); // 128k
			const mm = new Manager(heap);
			const region50k = mm.claim(1, 50 * 1024); // 50k
			expect(mm.getLatestError()).toBeNull();
			const region100k = mm.claim(2, 100 * 1024); // 100k
			expect(mm.getLatestError()).toEqual(
				new WasmMemoryError(
					1,
					"no continues chunk of request size [102400 bytes] available",
				),
			);
		},
	);
});
