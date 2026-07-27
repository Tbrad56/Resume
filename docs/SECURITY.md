# Security

What this app defends against, what it does not, and the reasoning behind each control.
Written to be honest about the gaps rather than to list features.

## Controls

### Headers (`src/middleware/security.js`)

helmet, with an explicit CSP:

```
default-src 'self'
script-src  'self'
style-src   'self' https://fonts.googleapis.com
font-src    'self' https://fonts.gstatic.com
img-src     'self' data:
connect-src 'self'
object-src  'none'
base-uri    'self'
form-action 'self'
frame-ancestors 'none'
```

**No `'unsafe-inline'` and no `'unsafe-eval'`.** That is the point of the policy, and
it is enforced by `test/security.test.js` rather than left to discipline. The 404 page
carried three inline `style` attributes until they were moved into `.section--404` in
`styles.css`; adding an inline style or an inline `<script>` to either HTML file will
break the page and fail the suite.

The typing animation assigns `el.style.opacity` at runtime. Those are CSSOM property
writes, which `style-src` does not govern, so the animation works under the strict
policy.

helmet also supplies HSTS, `nosniff`, a `no-referrer` policy, and removes
`X-Powered-By`.

### Rate limiting (`src/middleware/rate-limit.js`)

| Scope | Limit | Rationale |
|---|---|---|
| Global | 300 / 15 min / IP | Broad ceiling on scraping and hammering. |
| `/api/contact` | 5 / hour / IP | The only endpoint with real cost: it sends mail. |
| Tarpit | Progressive delay after 100 requests / 15 min, capped at 3 s | Makes sustained probing tedious without hard-blocking a curious visitor. |

Both limits are overridable via `RATE_GLOBAL_MAX` and `RATE_CONTACT_MAX` so the test
suite can drive them down.

### Contact endpoint (`src/routes/contact.js`)

- **Honeypot** — a visually hidden `website` field. Populated means bot.
- **Time gate** — submissions arriving under 3 s after page load are dropped.
- **CRLF stripping** on name and email, which is what prevents header injection into the
  outbound message.
- **Length caps** — name 100, email 200, message 5000, plus a 10 kb cap on the JSON body
  itself.
- **Silent drops** — honeypot and time-gate rejections return the same `200` and the
  same success body as a real submission. A bot gets no signal about which field
  betrayed it. Genuine validation failures do return `400`, since a human needs to know.

## Known limitations

These are accepted, not overlooked.

**The bot UA guard is a speed bump, not a control.** `src/middleware/bot-guard.js`
rejects requests whose User-Agent looks automated. Any script that sets a browser UA
string walks straight through. It is kept because it cheaply drops drive-by scanner
noise, not because it stops a determined client. The rate limiter and the honeypot are
the actual defenses on that endpoint.

**`trust proxy` is set to 1.** Correct on Render, which forwards exactly one hop, and
correct with Cloudflare in front of it. It is what makes `req.ip` the real client
address instead of the proxy's, so per-IP limits work at all. **Running this app with
no proxy in front makes `X-Forwarded-For` client-controlled, and every per-IP limit
above becomes trivially bypassable.** If you ever host it bare, drop that line.

**The contact endpoint is an unauthenticated relay into a personal inbox.** 5/hour/IP is
the only spam control; there is no CAPTCHA. That is a deliberate trade for a resume
site, where a friction-free contact form is the entire point. If it gets abused, a
CAPTCHA is the next step.

**Redactions are cosmetic.** The `<span class="redact">` blocks on the site are a visual
gag. The text sits in the page source and is readable by anyone who views it. Nothing
sensitive goes in them.

**App-level code does not absorb network-scale DDoS.** Rate limiting runs after the
request has already reached the process. That layer is Cloudflare, covered in
[DEPLOYMENT.md](DEPLOYMENT.md).

## Secrets

`SMTP_USER`, `SMTP_PASS`, and `CONTACT_INBOX` come from the environment and are never
committed. `.env` is gitignored; `.env.example` carries placeholders only. Use a Gmail
App Password, not the account password.

Verified: no credential has ever been committed to this repository.

## Dependencies

`npm audit` is expected to report zero vulnerabilities, and CI fails the build on
anything high or above. Dependabot opens weekly update PRs.

Two advisories were resolved before first deploy:

- **nodemailer ≤9.0.0** ([GHSA-p6gq-j5cr-w38f](https://github.com/advisories/GHSA-p6gq-j5cr-w38f), high) — the message-level
  `raw` option bypassed `disableFileAccess` and `disableUrlAccess`, allowing arbitrary
  file read and SSRF. Resolved by upgrading to 9.0.3. This app never used `raw`, so it
  was not exploitable here, but the upgrade is free.
- **body-parser <1.20.6** ([GHSA-v422-hmwv-36x6](https://github.com/advisories/GHSA-v422-hmwv-36x6), low) — an invalid `limit`
  value silently disabled size enforcement. Transitive via Express; resolved by
  `npm audit fix`.

## Reporting

Found something? Email Bradley.809@osu.edu.
