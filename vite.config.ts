import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) =>
  mode === "demo"
    ? {
        root: "demo",
        base: "./",
        build: { outDir: "../dist-demo", emptyOutDir: true },
      }
    : {
        build: {
          lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: () => "collapsible-tree.js",
          },
          rollupOptions: { external: [/^d3-/] },
        },
        test: { environment: "jsdom", setupFiles: ["src/test-setup.ts"] },
      },
);
