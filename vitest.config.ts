import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}", "server/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
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
