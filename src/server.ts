import express, { type Request, type Response } from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Store } from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const store = new Store(join(__dirname, "..", "data", "links.json"));

const app = express();
app.use(express.json());
app.use(express.static(join(__dirname, "..", "public")));

// Create a short link.
app.post("/api/links", (req: Request, res: Response) => {
  const url = (req.body?.url ?? "") as string;
  if (!url) return res.status(400).json({ error: "url is required" });
  try {
    const rec = store.create(url);
    res.status(201).json(rec);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// List all links (for the dashboard).
app.get("/api/links", (_req: Request, res: Response) => {
  res.json(store.all());
});

// Stats for one code.
app.get("/api/links/:code", (req: Request, res: Response) => {
  const rec = store.stats(String(req.params.code));
  if (!rec) return res.status(404).json({ error: "not found" });
  res.json(rec);
});

// Redirect + count the click. Reserve /api so it never shadows the API.
app.get("/:code", (req: Request, res: Response) => {
  const rec = store.resolve(String(req.params.code));
  if (!rec) return res.status(404).send("Short link not found");
  res.redirect(302, rec.url);
});

const PORT = Number(process.env.PORT) || 3000;
// Only listen when run directly, so tests can import without binding a port.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => console.log(`snip listening on http://localhost:${PORT}`));
}

export { app, store };
