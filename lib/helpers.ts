import { dictionary } from "./errors";
import type Region from "./Region";

export function sortRegions(a: Region, b: Region): number {
	return a.compareTo(b);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function formatError(code: keyof typeof dictionary, ...args: any[]) {
	let msg = dictionary[code];
	for (let i = 0; i < args.length; i++) {
		msg = msg.replace(`$${i}`, String(args[i]));
	}
	return msg;
}
