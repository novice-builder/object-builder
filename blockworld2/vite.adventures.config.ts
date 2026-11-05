import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    target: ["chrome90", "safari15"],
    outDir: "adventures-dist",
    rollupOptions: { input: "adventures.html" },
  },
  server: { host: "0.0.0.0", port: 5174, strictPort: true },
});
