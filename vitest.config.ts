import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/testing/setupTests.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules/",
      "tests/**",
      "src/**/*.spec.ts", // Exclude Playwright E2E tests
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/testing/setupTests.ts",
        "**/*.d.ts",
        "tests/**",
        "src/**/*.spec.ts",
      ],
    },
  },
  esbuild: {
    target: "es2020",
  },
});
