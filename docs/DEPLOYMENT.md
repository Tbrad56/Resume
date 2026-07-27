# Deployment

Target: Render free tier, optionally behind Cloudflare with a custom domain.

## Environment

| Variable | Required | Default | Notes |
|---|---|---|---|
| `SMTP_USER` | for real mail | — | Gmail address sending the notifications. |
| `SMTP_PASS` | for real mail | — | Gmail **App Password**, not the account password. |
| `CONTACT_INBOX` | no | falls back to `SMTP_USER` | Where form submissions land. |
| `PORT` | no | `3000` | Render sets this automatically. |
| `RATE_GLOBAL_MAX` | no | `300` | Per 15 min per IP. |
| `RATE_CONTACT_MAX` | no | `5` | Per hour per IP. |

Without `SMTP_USER` and `SMTP_PASS` the mailer falls back to a console stub, so the app
still boots and the form still returns success. Useful locally; not what you want in
production.

### Gmail App Password

Google Account → Security → 2-Step Verification (must be on) → App passwords. Generate
one, strip the spaces, use it as `SMTP_PASS`.

## Render

1. Push to GitHub.
2. Render → New → Web Service → connect the repo.
   - Build command: `npm ci`
   - Start command: `npm start`
   - Node version: 20 or higher (`engines` in `package.json` enforces this)
3. Add `SMTP_USER`, `SMTP_PASS`, and `CONTACT_INBOX` under Environment.
4. Deploy.

`npm ci` rather than `npm install` — it installs exactly what `package-lock.json`
pins, so a deploy can't quietly pull a different transitive version than the one CI
tested and `npm audit` cleared.

**Free tier sleeps after ~15 minutes idle**, and the first request after that takes
roughly 30 seconds to wake the service. Options: accept it, point a cron ping service at
the URL every 10 minutes, or move to the paid tier.

## Cloudflare

Only applicable with a custom domain.

1. Add the domain to Cloudflare (free plan is enough).
2. DNS: `CNAME` pointing at the Render URL, proxied (orange cloud). The proxy is what
   puts Cloudflare in the request path at all.
3. SSL/TLS mode: **Full (strict)**.
4. Security → Bots → enable Bot Fight Mode.
5. Under Attack mode is available if you are actively being flooded. Leave it off
   otherwise; it interstitials real visitors.

This is the layer that absorbs volumetric attacks. The app's own rate limiting runs
after a request has already reached the process, so it cannot substitute for this. See
[SECURITY.md](SECURITY.md).

`trust proxy` is set to 1 in `src/app.js`, which is correct for Render alone and for
Cloudflare in front of Render. If you move to a host with a different proxy depth,
revisit it — the value directly determines whether per-IP rate limiting works or is
trivially bypassed.

## Pre-deploy checklist

```bash
npm ci
npm test                  # expect 22 passing
npm audit                 # expect 0 vulnerabilities
npm start                 # smoke test at http://localhost:3000
```

Then confirm in the browser: terminal animation runs, scroll reveals fire, redactions
toggle on tap, mobile nav opens, and the contact form returns
`TRANSMISSION RECEIVED`.
