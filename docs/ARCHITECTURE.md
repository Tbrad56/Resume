# Architecture

A single Express app serves a static front-end from `public/` alongside one JSON
endpoint, `POST /api/contact`. There is no build step and no database. The front-end is
vanilla HTML, CSS, and ES5-era JavaScript that runs directly from source.

## Request path

```
request
  │
  ├─ helmet ...................... src/middleware/security.js
  ├─ global rate limit ........... src/middleware/rate-limit.js   300 / 15 min / IP
  ├─ tarpit (non-test only) ...... src/middleware/rate-limit.js   delay after 100 hits
  │
  ├─ /api/* → bot UA guard ....... src/middleware/bot-guard.js
  ├─ express.json ................ 10 kb cap
  │
  ├─ /api/contact → contact limit  5 / hour / IP
  │                 └─ router .... src/routes/contact.js
  │
  ├─ express.static .............. public/
  ├─ 404 ......................... public/404.html
  └─ error handler ............... fixed string, no stack traces
```

Order matters. The rate limiters sit ahead of the body parser so a flood of oversized
payloads is rejected before anything parses them, and `express.static` sits behind the
API mount so a file in `public/` can never shadow a route.

## Layout

| Path | Holds |
|---|---|
| `server.js` | Entry point. Requires the app and calls `listen`. Nothing else. |
| `src/app.js` | Middleware wiring and mount order. Exports the app without listening. |
| `src/config.js` | Every `process.env` read in the codebase, resolved once into a frozen object. |
| `src/lib/log.js` | `logBlock`, shared by the rate limiters and the UA guard. |
| `src/middleware/` | One file per concern: `security`, `rate-limit`, `bot-guard`. |
| `src/routes/` | Route handlers. Currently just `contact.js`. |
| `src/services/` | Outbound integrations. Currently just `mailer.js`. |
| `public/` | Static site. `index.html`, `404.html`, and `assets/{css,js}/`. |
| `test/` | `node:test` suites, no runner dependency. |

### Why `app.js` and `server.js` are separate

`src/app.js` builds and exports the app; `server.js` binds the port. The split means the
test suite can `require('../src/app')` and call `app.listen(0)` on an ephemeral port
without the module trying to bind port 3000 as a side effect of being imported.

### Why `config.js` exists

Env vars were previously read at five different points across `server.js` and
`routes/contact.js`. Consolidating them means the full set of deployment inputs is
readable in one file, and the modules that consume them are testable without
`process.env` juggling.

### Why the mailer is injected

`createContactRouter(sendMail)` is a factory that takes its mail function as an argument
rather than importing it. Tests pass a spy and assert on what would have been sent;
local development gets a console stub when SMTP credentials are absent, so `npm start`
works on a fresh clone with no configuration.

## Front-end

`public/assets/js/script.js` is one IIFE with no dependencies. It gates all motion
behind a `prefers-reduced-motion` check: without motion, the page is fully readable and
the script does nothing beyond wiring the nav, the redaction toggles, and the contact
form. The terminal typing animation short-circuits on first click or scroll so it never
holds up someone who wants to read.

All DOM writes use `textContent`. There is no `innerHTML` and no `eval` anywhere in the
front-end, which is what lets the CSP stay strict (see [SECURITY.md](SECURITY.md)).
