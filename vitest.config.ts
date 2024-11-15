import { defineConfig, mergeConfig, configDefaults } from "vitest/config";

export default defineConfig(
	mergeConfig(configDefaults, {
		test: {
			globals: true,
			coverage: {
				provider: "v8",
			},
		},
	}),
);
