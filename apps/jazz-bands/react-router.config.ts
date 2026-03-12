import type { Config } from "@react-router/dev/config";

export default {
  buildDirectory: "build",
  
  future: {
    v3_relativeSplatPath: true,
    v3_normalizeFormMethod: true,
  },
} satisfies Config;
