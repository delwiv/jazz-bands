import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = join(__dirname, "app");

export default defineConfig({
  plugins: [reactRouter()],
  resolve: {
    alias: {
      "~": appDir,
    },
  },
  build: {
    target: "esnext",
  },
});
