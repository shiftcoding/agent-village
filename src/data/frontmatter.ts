/** Tolerant YAML front matter reader for agent files. Pure; never throws. Handles BOM, CRLF, quotes. */
export interface Frontmatter {
  name: string | null;
  description: string | null;
  model: string | null;
}

function unquote(v: string): string {
  const t = v.trim();
  const m = /^(["'])(.*)\1$/.exec(t);
  return (m ? (m[2] ?? '') : t.replace(/\s+#.*$/, '')).trim();
}

export function parseFrontmatter(text: unknown): Frontmatter {
  const out: Frontmatter = { name: null, description: null, model: null };
  try {
    if (typeof text !== 'string') return out;
    const all = text.replace(/^﻿/, '').split(/\r?\n/);
    if ((all[0] ?? '').trim() !== '---') return out;
    for (let i = 1; i < all.length; i++) {
      const l = all[i] ?? '';
      if (l.trim() === '---') break;
      const m = /^(name|description|model)\s*:\s*(.*)$/i.exec(l);
      if (!m) continue;
      const key = (m[1] ?? '').toLowerCase() as keyof Frontmatter;
      let raw = (m[2] ?? '').trim();
      if (/^[|>][+-]?$/.test(raw)) {
        // YAML block scalar: read the indented lines that follow.
        const block: string[] = [];
        while (i + 1 < all.length && /^\s+\S/.test(all[i + 1] ?? '')) block.push((all[++i] ?? '').trim());
        raw = block.join(' ');
      }
      const v = unquote(raw);
      if (v && out[key] === null) out[key] = v;
    }
  } catch {
    /* keep what we have */
  }
  return out;
}
