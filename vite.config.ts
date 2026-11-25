import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// The service worker caches public/offline.html under a versioned name. A
// browser installs a new worker only when sw.js changes, so the build stamps
// the page's hash into sw.js: editing the page alone then refreshes the cache.
function stampOfflineCache(): Plugin {
  return {
    name: "stamp-offline-cache",
    apply: "build",
    closeBundle() {
      const worker = join("build", "client", "sw.js");
      if (!existsSync(worker)) return;
      const page = readFileSync(join("public", "offline.html"));
      const hash = createHash("sha256").update(page).digest("hex").slice(0, 12);
      const source = readFileSync(worker, "utf8");
      writeFileSync(worker, source.replace("__OFFLINE_HASH__", hash));
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), stampOfflineCache()],
});
