/// <reference types="vitest" />
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";

export default defineConfig(
	mergeConfig(configDefaults, {
		test: {
			globals: true,
			coverage: {
				provider: "v8",
				exclude: ["scripts","dist","coverage","node_modules", "vitest.config.ts", "**/__tests__/*"]
			},
		},
	}),
);
