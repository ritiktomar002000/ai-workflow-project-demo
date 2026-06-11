# snip

[![CI](https://github.com/YOUR_USERNAME/snip/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/snip/actions/workflows/ci.yml)

A minimal URL shortener with click analytics. TypeScript end-to-end: an Express API, a dependency-light persistence layer, a no-framework dashboard, and a full test suite.

## Features

- **Shorten** any `http(s)` URL to a 7-character, hand-typeable code (ambiguous characters like `0/O/I/l` excluded).
- **Redirect** via `GET /:code` with a 302, counting each click.
- **Analytics**: per-link click counts and last-clicked timestamp.
- **Dashboard**: single-page UI listing all links, newest first.
- **Validation**: rejects non-`http(s)` schemes (e.g. `javascript:`, `ftp:`) and malformed URLs.

## Architecture

```
src/store.ts    Core logic + persistence, fully decoupled from HTTP (unit-testable in memory)
src/server.ts   Express: REST API, redirect route, static hosting
public/          Zero-dependency frontend (vanilla JS + CSS)
test/            Unit tests (store) + HTTP integration tests (server)
```

The `Store` class exposes a narrow interface (`create`, `resolve`, `stats`, `all`). It is backed by a JSON file here, but swapping in SQLite/Postgres is a single-file change — nothing in the HTTP layer or frontend depends on the storage mechanism.

## API

| Method | Path              | Description                          |
|--------|-------------------|--------------------------------------|
| POST   | `/api/links`      | Body `{ "url": "..." }` → new link   |
| GET    | `/api/links`      | List all links (newest first)        |
| GET    | `/api/links/:code`| Stats for one link                   |
| GET    | `/:code`          | 302 redirect + record click          |

## Running

```bash
npm install
npm run dev      # http://localhost:3000  (hot reload via tsx)
npm test         # 10 tests: 6 unit + 4 integration
npm run build    # type-checked compile to dist/
```

## Notes & tradeoffs

- **Persistence**: started with `better-sqlite3`, but its native prebuild couldn't be fetched in the build environment. Swapped to a JSON-file store behind the same `Store` interface. For production this would be a real database; the interface boundary makes that swap trivial.
- **Click analytics** are intentionally simple (count + timestamp). Per-click event rows (referrer, UA, time series) would be the natural next iteration.
