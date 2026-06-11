import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { app } from "../src/server.ts";

let server: Server;
let base: string;

before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      base = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(() => server.close());

test("POST /api/links creates a link", async () => {
  const res = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/hello" }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.url, "https://example.com/hello");
  assert.equal(body.code.length, 7);
});

test("POST /api/links rejects a bad url", async () => {
  const res = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "ftp://nope" }),
  });
  assert.equal(res.status, 400);
});

test("GET /:code redirects and increments clicks", async () => {
  const created = await (
    await fetch(`${base}/api/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/redirect-target" }),
    })
  ).json();

  const res = await fetch(`${base}/${created.code}`, { redirect: "manual" });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("location"), "https://example.com/redirect-target");

  const stats = await (await fetch(`${base}/api/links/${created.code}`)).json();
  assert.equal(stats.clicks, 1);
});

test("GET /:code returns 404 for unknown code", async () => {
  const res = await fetch(`${base}/zzzzzzz`, { redirect: "manual" });
  assert.equal(res.status, 404);
});
