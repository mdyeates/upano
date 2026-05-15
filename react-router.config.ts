import type { Config } from "@react-router/dev/config";

export default {
  // Server-side render by default. Set to `false` for SPA mode.
  ssr: true,
  // Pre-render the landing page at build time.
  prerender: ["/"],
  // Enable middleware.
  future: {
    v8_middleware: true,
  },
} satisfies Config;
