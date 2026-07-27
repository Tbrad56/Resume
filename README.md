# Tai Bradley — Resume Site

A cybersecurity-themed personal resume site: "Recon Terminal × Classified Dossier."
Node/Express backend, working contact form, and defensive middleware that is meant to
be poked at.

[![CI](https://github.com/Tbrad56/Resume/actions/workflows/ci.yml/badge.svg)](https://github.com/Tbrad56/Resume/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

The page presents itself as a declassified personnel file, opened by a terminal
session. The hero runs recon, gets access, decrypts the dossier; the rest of the page is
the file. Vanilla HTML, CSS, and JavaScript on the front-end — no framework, no build
step.

## Quick start

```bash
npm ci
cp .env.example .env   # optional: without SMTP creds the mailer logs to console
npm start              # http://localhost:3000
```

Node 20 or higher.

## Scripts

| Command | Does |
|---|---|
| `npm start` | Runs the server on `PORT`, default 3000. |
| `npm test` | Full suite, 22 tests, `node:test` with no runner dependency. |
| `npm run audit` | Dependency audit, fails on high or critical. |

## Structure

```
├── .github/workflows/    CI: tests on Node 20 and 22, plus a dependency audit
├── docs/                 Architecture, security posture, deployment
├── public/               Static site
│   ├── index.html
│   ├── 404.html
│   └── assets/{css,js}/
├── src/
│   ├── app.js            Middleware wiring and mount order
│   ├── config.js         Every env read, resolved once
│   ├── lib/log.js        Shared block logging
│   ├── middleware/       security · rate-limit · bot-guard
│   ├── routes/           contact
│   └── services/         mailer
├── test/                 contact · server · security
└── server.js             Entry point: bind the port, nothing else
```

`src/app.js` exports the app without listening; `server.js` does the listening. That
split is what lets tests bind an ephemeral port instead of fighting over 3000.

## Security

The contact endpoint is the only thing here worth attacking, so it carries most of the
weight: honeypot field, 3-second time gate, CRLF stripping against header injection,
length caps, a 10 kb body cap, and 5 submissions per hour per IP. Bot rejections return
the same response body as a success, so automation learns nothing from probing it.

Site-wide: helmet with a CSP carrying **no `'unsafe-inline'` and no `'unsafe-eval'`**,
enforced by tests rather than by discipline. Global rate limiting at 300 requests per
15 minutes per IP, with a progressive tarpit for clients that push past 100.

`npm audit` reports zero vulnerabilities and CI fails on anything high or above.

**[docs/SECURITY.md](docs/SECURITY.md)** covers all of it properly, including the parts
that do not work: why the bot User-Agent guard is a speed bump rather than a control,
why `trust proxy` is load-bearing for every per-IP limit on the list, and why app-level
code cannot absorb network-scale DDoS.

## Docs

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — request path, module layout, and the
  reasoning behind the structure
- **[SECURITY.md](docs/SECURITY.md)** — controls, known limitations, resolved advisories
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Render and Cloudflare, environment
  variables, pre-deploy checklist

## License

MIT. See [LICENSE](LICENSE).
