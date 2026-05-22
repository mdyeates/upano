import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.{ts,tsx}", "server/**/*.test.{ts,tsx}"],
    passWithNoTests: true,
    alias: [
      {
        find: /^~\/database\/(.*)$/,
        replacement: fileURLToPath(new URL("./database/$1", import.meta.url)),
      },
      {
        find: /^~\/(.*)$/,
        replacement: fileURLToPath(new URL("./app/$1", import.meta.url)),
      },
    ],
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
