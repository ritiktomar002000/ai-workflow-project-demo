import { test } from "node:test";
import assert from "node:assert/strict";
import { Store } from "../src/store.ts";

// Passing no path => in-memory, no disk writes.
test("create returns a 7-char code and stores the url", () => {
  const s = new Store();
  const rec = s.create("https://example.com/a");
  assert.equal(rec.code.length, 7);
  assert.equal(rec.url, "https://example.com/a");
  assert.equal(rec.clicks, 0);
  assert.equal(rec.lastClickedAt, null);
});

test("resolve increments clicks and sets lastClickedAt", () => {
  const s = new Store();
  const { code } = s.create("https://example.com");
  const r1 = s.resolve(code);
  assert.equal(r1?.clicks, 1);
  assert.notEqual(r1?.lastClickedAt, null);
  const r2 = s.resolve(code);
  assert.equal(r2?.clicks, 2);
});

test("resolve returns null for unknown code", () => {
  const s = new Store();
  assert.equal(s.resolve("nope123"), null);
});

test("normalizeUrl rejects non-http(s) and garbage", () => {
  assert.throws(() => Store.normalizeUrl("ftp://x.com"), /http and https/);
  assert.throws(() => Store.normalizeUrl("javascript:alert(1)"), /http and https/);
  assert.throws(() => Store.normalizeUrl("not a url"), /Invalid URL/);
});

test("normalizeUrl accepts and canonicalizes valid urls", () => {
  assert.equal(Store.normalizeUrl("https://a.com"), "https://a.com/");
  assert.equal(Store.normalizeUrl("  http://a.com/x  "), "http://a.com/x");
});

test("all() returns newest first", async () => {
  const s = new Store();
  s.create("https://a.com");
  await new Promise((r) => setTimeout(r, 5));
  const second = s.create("https://b.com");
  assert.equal(s.all()[0].code, second.code);
});
