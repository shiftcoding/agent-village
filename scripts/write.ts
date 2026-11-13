/** The ONLY writer in the repo: public/village.json, atomically (temp file in the same folder, then rename). */
import fs from 'node:fs';
import path from 'node:path';
import type { VillageFile } from '../src/data/villageFile';

export const TEMP_MARKER = '.tmp-';

export function writeFileAtomic(target: string, content: string): void {
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${target}${TEMP_MARKER}${process.pid}-${Date.now().toString(36)}`;
  try {
    fs.writeFileSync(tmp, content, 'utf8');
    fs.renameSync(tmp, target);
  } catch (e) {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {
      /* ignore */
    }
    throw e;
  }
}

export function writeVillageFile(outPath: string, file: VillageFile): void {
  writeFileAtomic(outPath, `${JSON.stringify(file, null, 1)}\n`);
}
