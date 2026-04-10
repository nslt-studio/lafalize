import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.js",
      name: "lafalize",
      fileName: "main",
      formats: ["iife"],
    },
    outDir: "dist",
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
      },
    },
  },
});
