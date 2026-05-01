import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative base works for GitHub project Pages (`/repo/`) without hardcoding the repo name.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
  },
});
