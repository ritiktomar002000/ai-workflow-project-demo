# AI-Assisted Development Workflow

This document records how AI tooling (Claude) was used to build `snip` and, more importantly, where human engineering judgment stayed in the loop. It's written to be honest about the division of labor — AI accelerated the work; it didn't replace the decisions.

## Summary

A full-stack TypeScript URL shortener — API, persistence layer, frontend, and a 10-test suite — was scaffolded, written, debugged, and verified in a single ~30-minute session. AI handled the mechanical volume (boilerplate, test scaffolding, config); the engineering decisions (architecture, the storage-layer pivot, fixing a strict-typecheck failure) were directed and reviewed deliberately.

## Where AI accelerated the work

**1. Scaffolding and boilerplate (largest time saving).**
`package.json`, `tsconfig.json`, the Express setup, and the vanilla-JS frontend are the kind of code that's tedious to type and easy to get subtly wrong (ESM config, module resolution, static hosting paths). Generating these first-pass saved roughly 15–20 minutes versus hand-writing and looking up flags.

**2. Test generation.**
Both test files (6 unit + 4 integration) were generated alongside the implementation rather than as an afterthought. The integration tests bind the Express app to an ephemeral port (`listen(0)`) so the suite runs without a fixed port — a pattern that's quick to get right with AI assistance and easy to forget under time pressure.

**3. Small correctness details.**
The URL-code alphabet deliberately excludes ambiguous characters (`0/O/I/l`), and the `Store` guards against code collisions. These are the kind of "I'll add it later" details that AI surfaces upfront for near-zero cost.

## Where human judgment was required

**1. Architecture decision: decouple storage from HTTP.**
The single most important design choice — making `Store` a self-contained, in-memory-testable class with a narrow interface — was a deliberate instruction, not a default. It's what let the unit tests run with zero I/O and made the storage pivot (below) painless. AI implemented it well once the boundary was specified.

**2. The storage pivot (a real mid-build problem).**
The plan was `better-sqlite3`. Its native prebuild couldn't be fetched in the build environment, and `npm install` failed. Diagnosing that from a noisy npm debug log, deciding *not* to burn time fighting the native build, and pivoting to a JSON-file store behind the same interface was a judgment call. The interface boundary from decision #1 meant the swap touched one file and broke nothing.

**3. A strict-typecheck failure the tests didn't catch.**
The test runner (`tsx`) is permissive and all 10 tests passed — but `tsc --noEmit` flagged that Express 5 types route params as `string | string[]`, which would have failed a real CI build. This is the important one: **green tests are not a green build.** Running the strict compiler separately caught it; the fix (coercing params with `String(...)`) was then trivial. Trusting the passing tests and skipping the typecheck would have shipped a broken build.

**4. End-to-end verification.**
Beyond the unit/integration suite, the running server was smoke-tested with real `curl` calls: create a link, follow the 302, confirm the click counter incremented, confirm a bad URL is rejected with a 400. AI-written code that passes its own tests still gets verified against reality.

## Takeaway

The pattern that worked: let AI handle breadth and boilerplate at high speed, and spend the saved time on the things that actually decide whether software is correct — interface boundaries, failure handling, and verifying the build the way CI will, not just the way the test runner does. The two real defects in this session (the failed native dependency and the strict-type error) were both caught by deliberately not trusting the happy path.
