import path from "node:path";
import { defineConfig } from "vitest/config";

/** Integration tests run against a dedicated local database that is rebuilt and reseeded for every run. */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.int.test.ts"],
    globalSetup: ["src/test/global-setup.ts"],
    env: { DATABASE_URL: "postgres://localhost:5432/marketing_os_test", NODE_ENV: "test" },
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
