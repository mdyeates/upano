import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}", "server/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
    alias: {
      "~/": fileURLToPath(new URL("./app/", import.meta.url)),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "build/**",
        ".react-router/**",
        "drizzle/**",
        "**/*.config.{ts,js}",
      ],
    },
  },
});
