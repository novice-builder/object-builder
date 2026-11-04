import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: {
    target: ["chrome90", "safari15"],
    outDir: "dist",
    emptyOutDir: true,
  },
  server: { port: 5173 },
  preview: { port: 4173, strictPort: true },
});
