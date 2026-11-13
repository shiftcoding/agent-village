import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// The village never writes to any project folder.
// Phase 2: `npm run sync -- --watch` rewrites public/village.json (atomically, via public/village.json.tmp-*)
// on every docs change and at least every 60 s. The browser polls that file itself, so the dev server must
// NOT react to it: a full-page reload would close open panels and drop keyboard focus. Ignoring both the
// file and its temp files keeps the watcher quiet. Fixtures and docs/ markdown still hot-reload as before.
// public/village.json embeds docs text from the user's projects: never copy it (or its temp files) into dist/.
function skipVillageJsonInBuild(): Plugin {
  let outDir = path.resolve(process.cwd(), 'dist');
  return {
    name: 'skip-village-json-in-build',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const dist = outDir;
      try {
        for (const f of fs.readdirSync(dist)) if (f === 'village.json' || f.startsWith('village.json.tmp-')) fs.rmSync(path.join(dist, f), { force: true });
      } catch {
        // no dist yet
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), skipVillageJsonInBuild()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    watch: { ignored: ['**/public/village.json', '**/public/village.json.tmp-*'] },
  },
});
