import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default. Set to `false` for SPA mode.
  ssr: true,
  // Enable middleware.
  future: {
    v8_middleware: true,
  },
} satisfies Config;
