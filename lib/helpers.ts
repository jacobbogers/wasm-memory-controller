import type Region from "./Region";
import { dictionary } from "./errors";

export function sortRegions(a: Region, b: Region): number {
	// higher offsets at the start
	return a.compareTo(b);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function formatError(code: keyof typeof dictionary, ...args: any[]) {
	let msg = dictionary[code];
	for (let i = 0; i < args.length; i++) {
		msg = msg.replace(`$${i + 1}`, String(args[i]));
	}
	return msg;
}
