# Cybersecurity Dossier Redesign + Node Backend — Design

**Date:** 2026-06-11
**Project:** Tai Bradley resume site (`resumeProject`)
**Goal:** Re-theme the site from general web-dev/CS toward cybersecurity — classy and professional, but fun enough to hold attention — and convert it from a static site into a Node.js/Express application with a working contact form and real defensive security features. Keep the existing paper-white / ink-black / green color scheme.

## Theme Concept: "Recon Terminal × Classified Dossier"

The page presents itself as a declassified personnel file, opened by a terminal session. The hero terminal "runs recon," gets access, and decrypts the dossier; the rest of the page is the declassified file. Validated with mockups during brainstorming (see `.superpowers/brainstorm/`).

## Scope

In scope:
- Full visual re-theme of `index.html` / `styles.css` (structure, labels, hero).
- New hero animation and redaction interactions in `script.js`.
- New Node/Express backend: static serving, contact API, security middleware.
- Deployment setup for Render free tier.

Out of scope:
- No change to resume content (jobs, projects, dates, contact info).
- No change to color tokens, fonts, or overall single-page layout.
- No database, no front-end framework, no build step.
- Network-scale DDoS absorption (handled by infrastructure layer — see Security).

## 1. Front-End Design

### Hero (terminal → dossier)

Terminal window types a recon sequence character-by-character:

```
tai@osu:~$ scan --target tai_bradley
[+] recon complete — subject identified
tai@osu:~$ decrypt dossier_bradley.enc
[ACCESS GRANTED — CLEARANCE: PUBLIC]
```

Then a dossier card animates in beneath the final command:
- Rotated "DECLASSIFIED" stamp (green outline, top-right).
- `// PERSONNEL FILE — OSU 2027` label.
- Name as the visual headline (largest text on page).
- Focus line: cybersecurity · embedded systems · software.
- `STATUS: ● ACTIVE — B.S. CS, Information & Computer Assurance`.
- Real Email / LinkedIn / GitHub buttons (existing links).
- Blinking green cursor rests at a fresh prompt after the sequence.

Interaction and accessibility rules (carried over from the 2026-06-04 terminal-hero spec):
- Whole sequence ~3–4 seconds; click/tap or scroll skips to the finished state.
- No layout shift: hero reserves final height.
- All real content exists as semantic HTML; JS only animates it. JS off → full hero renders instantly.
- `prefers-reduced-motion: reduce` → no typing, final state immediately (existing `js-motion` class gating pattern).
- Typed presentation is decorative; screen readers get the real final text.

Note: the current working tree has a half-finished prior attempt — `script.js` targets `#term`/`#cursor` elements that no longer exist in `index.html`. The new hero replaces that code entirely.

### Sections as case files

Each section keeps its content but is re-labeled as a numbered file:

| Section | Label |
|---|---|
| Education | `// FILE 01 — EDUCATION RECORDS` |
| Skills | `// FILE 02 — CAPABILITIES` |
| Projects | `// FILE 03 — OPERATIONS` |
| Experience | `// FILE 04 — FIELD ASSIGNMENTS` |
| Leadership | `// FILE 05 — LEADERSHIP` |
| Contact | `// FILE 06 — SECURE CHANNEL` |

- Caveat handwritten section titles stay (reads as case-officer notes).
- Cards gain a thin green left file-edge (`border-left: 3px solid var(--green)`).
- Date pills restyled in stamp voice, e.g. `MAY 2026 — ACTIVE`.
- Scroll-reveal motion for sections/cards kept (IntersectionObserver, motion-gated).

### Redactions (the fun)

- ~5 phrases site-wide rendered as black redaction bars that reveal on hover (desktop) or tap (mobile).
- Real text always present in the DOM; redaction is purely visual (CSS background/color swap), so screen readers and find-in-page are unaffected.
- Used sparingly to stay classy: candidates are project detail phrases (e.g. "Stuxnet-style", "C + OpenSSL"), never load-bearing facts like contact info.

### Unchanged

Colors (`--paper`, `--ink`, `--green` family), JetBrains Mono + Caveat fonts, paper-grid background, sticky nav structure, mobile nav toggle, footer.

## 2. Backend (Node/Express)

Single Express app serving the static front-end plus a JSON API. No templating, no build step.

### Project layout

```
server.js            — Express app: middleware stack, static serving, error handling
routes/contact.js    — POST /api/contact
public/              — index.html, styles.css, script.js, img/   (moved from repo root)
package.json         — express, helmet, express-rate-limit, express-slow-down, nodemailer, dotenv
.env (gitignored)    — SMTP_USER, SMTP_PASS (Gmail app password), CONTACT_INBOX
README.md            — run, deploy, and Cloudflare setup instructions
```

### Contact form ("SECURE CHANNEL")

- Front-end form in the Contact section: name, email, message + on-theme submit ("TRANSMIT").
- `POST /api/contact` validates and sends the message to `CONTACT_INBOX` via nodemailer with a Gmail app password.
- Success response rendered on-theme: `TRANSMISSION RECEIVED — channel secured`.
- The existing `mailto:` button remains as fallback — JS off or server failure never strands a recruiter.

## 3. Security

### Application layer

- **helmet** — CSP, HSTS, nosniff, frame-deny, and friends. Footer invites visitors to inspect headers (`curl -I` brag).
- **Rate limiting** (`express-rate-limit`) — global ~300 req / 15 min / IP; strict ~5 / hour / IP on `/api/contact`. 429 body is on-theme: `RATE LIMIT — intrusion attempt logged`.
- **Tarpit** (`express-slow-down`) — progressive response delays for repeat offenders before the hard limit, deterring scrapers and automated agents cheaply.
- **Anti-bot on the form:**
  - Honeypot field (visually hidden input; non-empty → request silently dropped).
  - Time gate (submission < ~3 s after page load → dropped).
  - Empty or known-bot user-agents rejected on API routes.
- **Input hygiene** — JSON body limit 10 kb, per-field length caps, email format validation, header-injection characters stripped from form values.
- **Incident logging** — blocked/dropped requests logged server-side with timestamp, IP, and reason.

### Infrastructure layer

Application code cannot absorb network-scale DDoS. That layer is delegated:
- **Cloudflare free tier** in front of Render once a custom domain is attached: origin hiding, flood absorption, bot-fight mode. Setup steps documented in README.
- Render's own platform load balancing provides a baseline.

## 4. Deployment

- GitHub repo → Render free tier web service, auto-deploy on push to `main`.
- Env vars set in the Render dashboard, never committed.
- Free-tier idle sleep (~15 min) means a cold first visit (~30 s). Accepted; README notes the cron-ping workaround and the paid-tier option.

## 5. Error Handling

- Form validation errors → inline on-theme messages.
- Email send failure → `TRANSMISSION FAILED — use direct channel` with mailto link; failure logged server-side.
- Express catch-all error middleware; 404 page styled as `FILE NOT FOUND — record sealed or destroyed`.

## 6. Testing

Manual checklist:
- Contact form happy path (email actually arrives).
- Honeypot submission dropped; sub-3-second submission dropped.
- Burst of requests triggers 429 with themed message.
- `curl -I` shows helmet headers.
- JS disabled: full hero and content render; mailto fallback works.
- `prefers-reduced-motion`: no typing or reveal animation.
- Mobile: nav toggle, tap-to-declassify redactions.

Automated: small Node smoke-test script hitting `/` and `/api/contact` (valid, honeypot, and flood cases) for post-change verification.

## Success Criteria

- Site reads as a cybersecurity dossier while staying classy and recruiter-friendly; palette and content unchanged.
- Hero recon/declassify animation runs, skips on interaction, and degrades cleanly (no-JS, reduced-motion).
- Contact form delivers real email end-to-end on Render.
- Security middleware demonstrably works (429s, dropped bot submissions, hardened headers).
- `npm start` runs the whole site locally with one command.
