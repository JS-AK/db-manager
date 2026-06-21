import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["src/**/*.integration.spec.ts"],
		setupFiles: ["./vitest.setup.js"],
	},
});
