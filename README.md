# Tai Bradley — Resume Site

Cybersecurity-themed resume site ("Recon Terminal × Classified Dossier").
Node/Express backend with a working contact form and defensive middleware.

## Run locally

    npm install
    cp .env.example .env   # optional — without SMTP creds the mailer logs to console
    npm start              # http://localhost:3000

## Test

    npm test

## Security features

- helmet: CSP, HSTS, nosniff, frame-ancestors none
- Global rate limit (300 req / 15 min / IP) + strict contact limit (5 / hour / IP)
- Tarpit (express-slow-down): progressive delays for hot clients
- Bot UA guard on /api routes
- Contact form: honeypot field, 3-second time gate, input validation,
  CRLF stripping (header injection), 10 kb body cap
- Blocked requests logged with IP + reason

App-level code does not absorb network-scale DDoS — that layer is Cloudflare (below).

## Deploy (Render free tier)

1. Push to GitHub.
2. Render → New → Web Service → connect repo.
   - Build: `npm install`  ·  Start: `npm start`
3. Add env vars in the Render dashboard: `SMTP_USER`, `SMTP_PASS`, `CONTACT_INBOX`.
4. Note: free tier sleeps after ~15 min idle; first visit takes ~30 s to wake.
   Workarounds: a cron ping service, or the paid tier.

## Cloudflare (with a custom domain)

1. Add the domain to Cloudflare (free plan), point DNS at the Render URL (CNAME, proxied/orange cloud).
2. Enable Bot Fight Mode (Security → Bots) and "Under Attack" mode if flooded.
3. SSL/TLS mode: Full (strict).
