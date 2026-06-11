import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { customAlphabet } from "nanoid";

// URL-safe, unambiguous alphabet (no 0/O/I/l) for hand-typeable codes.
const makeCode = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 7);

export interface LinkRecord {
  code: string;
  url: string;
  createdAt: string;
  clicks: number;
  lastClickedAt: string | null;
}

interface DbShape {
  links: Record<string, LinkRecord>;
}

/**
 * A tiny JSON-file-backed store. Chosen over SQLite because the native
 * better-sqlite3 prebuild couldn't be fetched in this environment; the
 * Store interface is kept narrow so swapping in a real DB later is a
 * one-file change.
 */
export class Store {
  private data: DbShape;
  constructor(private path: string | null = null) {
    if (path && existsSync(path)) {
      this.data = JSON.parse(readFileSync(path, "utf8"));
    } else {
      this.data = { links: {} };
      if (path) this.persist();
    }
  }

  private persist() {
    if (!this.path) return; // in-memory mode (tests)
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(this.data, null, 2));
  }

  /** Validate + normalize. Throws on anything that isn't http(s). */
  static normalizeUrl(raw: string): string {
    let u: URL;
    try {
      u = new URL(raw.trim());
    } catch {
      throw new Error("Invalid URL");
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("Only http and https URLs are allowed");
    }
    return u.toString();
  }

  create(rawUrl: string): LinkRecord {
    const url = Store.normalizeUrl(rawUrl);
    let code = makeCode();
    while (this.data.links[code]) code = makeCode(); // collision guard
    const rec: LinkRecord = {
      code,
      url,
      createdAt: new Date().toISOString(),
      clicks: 0,
      lastClickedAt: null,
    };
    this.data.links[code] = rec;
    this.persist();
    return rec;
  }

  /** Resolve a code and record the click in one step. */
  resolve(code: string): LinkRecord | null {
    const rec = this.data.links[code];
    if (!rec) return null;
    rec.clicks += 1;
    rec.lastClickedAt = new Date().toISOString();
    this.persist();
    return rec;
  }

  stats(code: string): LinkRecord | null {
    return this.data.links[code] ?? null;
  }

  all(): LinkRecord[] {
    return Object.values(this.data.links).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }
}
