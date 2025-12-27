# Repository Guidelines

## Project Structure & Module Organization
- `index.js` is the public entry point; `index.d.ts` provides TypeScript typings.
- `lib/` contains the implementation, split by responsibility:
  - `lib/getmacaddress.js`, `lib/getallinterfaces.js`, `lib/networkinterfaces.js` handle core APIs.
  - `lib/platform/` holds OS-specific helpers.
  - `lib/util.js` provides shared utilities (promisify, iteration helpers).
- `test.js` is a lightweight smoke test that exercises callbacks and Promises.

## Build, Test, and Development Commands
- `npm install` installs dependencies (there are no runtime deps, but it ensures npm metadata is up to date).
- `npm test` runs `node test.js` to print detected interfaces and validate MAC formats.
- There is no build step; changes in `lib/` and `index.js` are shipped directly.

## Coding Style & Naming Conventions
- Use CommonJS (`require`, `module.exports`) and `"use strict";` at the top of files.
- Indentation is 4 spaces in core modules; keep the existing style in the file you edit.
- Prefer double quotes in core modules (`index.js`, `lib/`), but respect local conventions.
- File names are lowercase and descriptive (e.g., `getmacaddress.js`).

## Testing Guidelines
- Tests are a single script in `test.js`; run with `npm test`.
- The test is a smoke check: it validates format and prints detected interfaces.
- When adding functionality, extend `test.js` with focused checks (e.g., new API options).

## Commit & Pull Request Guidelines
- Commit messages are short and imperative (e.g., `Remove build status badge`, `Bump patch version`).
- Conventional prefixes like `fix:` appear occasionally; use them if they fit the change.
- PRs should include a concise description, test results (`npm test`), and any OS-specific notes if behavior differs across platforms.

## Platform & Runtime Notes
- This package targets Node.js and runs on Linux, macOS, and Windows.
- Avoid browser-specific APIs; the library reads host network interface data only.
