# Cybersecurity Dossier Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-theme the resume site as a "Recon Terminal × Classified Dossier" cybersecurity experience and convert it to a Node/Express app with a working contact form and defensive security middleware.

**Architecture:** Single Express app serves the static front-end from `public/` plus a JSON API (`POST /api/contact`). Security middleware (helmet, rate limits, tarpit, UA guard) wraps everything. Contact route is a factory taking an injected `sendMail` function so tests use a spy and dev runs without SMTP creds. Front-end stays vanilla HTML/CSS/JS — no build step.

**Tech Stack:** Node ≥18, Express 4, helmet, express-rate-limit, express-slow-down, nodemailer, dotenv. Tests: built-in `node:test` + global `fetch`.

**Spec:** `docs/superpowers/specs/2026-06-11-cybersecurity-dossier-redesign-design.md`

---

## File Structure

```
server.js              — Express app: middleware stack, static, 404/error. Exports app; listens when run directly.
routes/contact.js      — createContactRouter(sendMail) factory: validation, honeypot, time gate, send.
public/index.html      — re-themed page (moved from repo root)
public/styles.css      — re-themed styles (moved from repo root)
public/script.js       — nav + typing engine + redactions + form submit (moved from repo root, rewritten)
public/404.html        — themed 404
public/img/            — moved from repo root
test/server.test.js    — smoke: static, headers, UA guard, contact rate limit
test/contact.test.js   — contact router unit tests with sendMail spy
package.json, .env.example, README.md, .gitignore (updated)
```

Environment knobs (all optional, defaults in code): `PORT`, `RATE_GLOBAL_MAX`, `RATE_CONTACT_MAX`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_INBOX`, `NODE_ENV`.

---

### Task 1: Snapshot WIP + restructure into `public/`

The working tree has uncommitted half-finished work (modified `index.html`, `styles.css`, untracked `script.js`). Snapshot it so nothing is lost, then move front-end files into `public/`.

**Files:**
- Modify: `.gitignore`
- Move: `index.html`, `styles.css`, `script.js`, `img/` → `public/`

- [ ] **Step 1: Commit current working tree as WIP snapshot**

```bash
git add -A
git commit -m "wip: snapshot before dossier redesign"
```

- [ ] **Step 2: Move front-end files into public/**

```bash
mkdir -p public
git mv index.html styles.css script.js img public/
```

- [ ] **Step 3: Append Node entries to `.gitignore`**

Append these lines (keep existing content):

```
node_modules/
.env
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: move front-end into public/, ignore node artifacts"
```

---

### Task 2: package.json + dependencies

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "tai-bradley-resume",
  "version": "1.0.0",
  "private": true,
  "description": "Tai Bradley resume site — cybersecurity dossier theme, Express backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "node --test test/"
  },
  "engines": { "node": ">=18" },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.2.0",
    "express-slow-down": "^2.0.3",
    "helmet": "^7.1.0",
    "nodemailer": "^6.9.13"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: lockfile created, no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add express backend dependencies"
```

---

### Task 3: Express server — static serving, 404, error handler (TDD)

**Files:**
- Create: `server.js`
- Create: `test/server.test.js`
- Create: `public/404.html`

- [ ] **Step 1: Write failing tests**

`test/server.test.js`:

```js
const { test, before, after } = require('node:test');
const assert = require('node:assert');

process.env.NODE_ENV = 'test';
process.env.RATE_GLOBAL_MAX = '100';
process.env.RATE_CONTACT_MAX = '3';

const app = require('../server');

let server;
let base;
const UA = { 'user-agent': 'test-browser' };

before(() => new Promise((resolve) => {
  server = app.listen(0, () => {
    base = `http://127.0.0.1:${server.address().port}`;
    resolve();
  });
}));

after(() => server.close());

test('GET / serves the resume page', async () => {
  const res = await fetch(`${base}/`, { headers: UA });
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /Tai Bradley/);
});

test('unknown path returns themed 404', async () => {
  const res = await fetch(`${base}/nope`, { headers: UA });
  assert.equal(res.status, 404);
  const body = await res.text();
  assert.match(body, /FILE NOT FOUND/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../server'`

- [ ] **Step 3: Create `public/404.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 — Tai Bradley</title>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main class="section" style="text-align:center; padding-top:120px;">
    <p class="section__label">// error 404</p>
    <h1 style="font-size:28px; margin-bottom:12px;">FILE NOT FOUND</h1>
    <p style="color:var(--muted); margin-bottom:28px;">Record sealed or destroyed.</p>
    <div class="btn-row"><a class="btn btn--primary" href="/">Return to dossier</a></div>
  </main>
</body>
</html>
```

- [ ] **Step 4: Create minimal `server.js`**

```js
require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
app.set('trust proxy', 1); // Render runs behind a proxy

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// 404 — anything not matched above
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Catch-all error handler
app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'TRANSMISSION FAILED — internal error' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`[up] http://localhost:${port}`));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: 2 pass.

- [ ] **Step 6: Commit**

```bash
git add server.js test/server.test.js public/404.html
git commit -m "feat: express server with static serving and themed 404"
```

---

### Task 4: Security middleware — helmet, rate limits, tarpit, UA guard (TDD)

**Files:**
- Modify: `server.js`
- Modify: `test/server.test.js`

- [ ] **Step 1: Add failing tests to `test/server.test.js`**

```js
test('helmet security headers present', async () => {
  const res = await fetch(`${base}/`, { headers: UA });
  assert.ok(res.headers.get('content-security-policy'), 'CSP missing');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(res.headers.get('strict-transport-security'), 'HSTS missing');
});

test('API rejects bot-like user agents', async () => {
  const res = await fetch(`${base}/api/contact`, {
    method: 'POST',
    headers: { 'user-agent': 'curl/8.0', 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(res.status, 403);
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm test`
Expected: header test FAILS (no CSP); UA test FAILS (404 instead of 403).

- [ ] **Step 3: Add middleware to `server.js`**

Replace the section between `app.set('trust proxy', 1);` and `app.use(express.json(...))` so the top of the file becomes:

```js
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const app = express();
app.set('trust proxy', 1); // Render runs behind a proxy

const logBlock = (req, reason) =>
  console.warn(`[blocked] ${reason} ip=${req.ip} ua="${req.get('user-agent') || ''}" path=${req.path}`);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_GLOBAL_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logBlock(req, 'global-rate');
    res.status(429).json({ error: 'RATE LIMIT — intrusion attempt logged' });
  },
}));

// Tarpit: progressive delays for hot clients (off in tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 100,
    delayMs: (hits) => Math.min(hits * 100, 3000),
  }));
}

// Bot UA guard on API routes only
app.use('/api', (req, res, next) => {
  const ua = req.get('user-agent') || '';
  if (!ua || /curl|wget|python|scrapy|httpclient|headless|bot|spider/i.test(ua)) {
    logBlock(req, 'ua-guard');
    return res.status(403).json({ error: 'AUTOMATED CLIENT REJECTED' });
  }
  next();
});
```

Note: the UA guard runs for any `/api/*` path. Without an `/api` route registered yet it still fires before the 404 — the curl test expects 403, which this provides.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 4 pass.

- [ ] **Step 5: Commit**

```bash
git add server.js test/server.test.js
git commit -m "feat: helmet, rate limiting, tarpit, and bot UA guard"
```

---

### Task 5: Contact router factory (TDD)

**Files:**
- Create: `routes/contact.js`
- Create: `test/contact.test.js`

- [ ] **Step 1: Write failing tests**

`test/contact.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const createContactRouter = require('../routes/contact');

function makeApp(spy) {
  const app = express();
  app.use(express.json());
  app.use('/api/contact', createContactRouter(spy));
  return app;
}

function makeSpy() {
  const calls = [];
  const fn = async (msg) => { calls.push(msg); };
  fn.calls = calls;
  return fn;
}

async function post(app, body) {
  const server = app.listen(0);
  const port = server.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, json: await res.json() };
  } finally {
    server.close();
  }
}

const valid = () => ({
  name: 'Recruiter Jane',
  email: 'jane@example.com',
  message: 'Interested in your work.',
  ts: Date.now() - 5000,
});

test('valid submission sends mail and confirms on-theme', async () => {
  const spy = makeSpy();
  const { status, json } = await post(makeApp(spy), valid());
  assert.equal(status, 200);
  assert.match(json.message, /TRANSMISSION RECEIVED/);
  assert.equal(spy.calls.length, 1);
  assert.match(spy.calls[0].subject, /Recruiter Jane/);
  assert.equal(spy.calls[0].replyTo, 'jane@example.com');
});

test('honeypot filled: fake success, no mail', async () => {
  const spy = makeSpy();
  const { status } = await post(makeApp(spy), { ...valid(), website: 'http://spam' });
  assert.equal(status, 200);
  assert.equal(spy.calls.length, 0);
});

test('submitted too fast: fake success, no mail', async () => {
  const spy = makeSpy();
  const { status } = await post(makeApp(spy), { ...valid(), ts: Date.now() - 500 });
  assert.equal(status, 200);
  assert.equal(spy.calls.length, 0);
});

test('missing ts: fake success, no mail', async () => {
  const spy = makeSpy();
  const { ts, ...rest } = valid();
  const { status } = await post(makeApp(spy), rest);
  assert.equal(status, 200);
  assert.equal(spy.calls.length, 0);
});

test('invalid email rejected with 400', async () => {
  const spy = makeSpy();
  const { status } = await post(makeApp(spy), { ...valid(), email: 'not-an-email' });
  assert.equal(status, 400);
  assert.equal(spy.calls.length, 0);
});

test('newlines stripped from name (header injection)', async () => {
  const spy = makeSpy();
  await post(makeApp(spy), { ...valid(), name: 'Jane\r\nBcc: victim@x.com' });
  assert.equal(spy.calls.length, 1);
  assert.ok(!spy.calls[0].subject.includes('\n'), 'newline leaked into subject');
});

test('mailer failure returns 502 with fallback message', async () => {
  const failing = async () => { throw new Error('smtp down'); };
  const { status, json } = await post(makeApp(failing), valid());
  assert.equal(status, 502);
  assert.match(json.error, /TRANSMISSION FAILED/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '../routes/contact'`

- [ ] **Step 3: Implement `routes/contact.js`**

```js
const express = require('express');

const MAX = { name: 100, email: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_FORM_MS = 3000;
const stripCRLF = (s) => String(s || '').replace(/[\r\n]+/g, ' ').trim();

module.exports = function createContactRouter(sendMail) {
  const router = express.Router();

  // Bot drops answer with the same body as success so automation learns nothing.
  const drop = (req, res, reason) => {
    console.warn(`[blocked] contact-${reason} ip=${req.ip}`);
    res.json({ ok: true, message: 'TRANSMISSION RECEIVED — channel secured' });
  };

  router.post('/', async (req, res) => {
    const { name, email, message, website, ts } = req.body || {};

    if (website) return drop(req, res, 'honeypot');
    const age = Date.now() - Number(ts);
    if (!ts || Number.isNaN(age) || age < MIN_FORM_MS) return drop(req, res, 'time-gate');

    const clean = {
      name: stripCRLF(name),
      email: stripCRLF(email),
      message: String(message || '').trim(),
    };
    if (!clean.name || clean.name.length > MAX.name)
      return res.status(400).json({ error: 'NAME FIELD INVALID' });
    if (!EMAIL_RE.test(clean.email) || clean.email.length > MAX.email)
      return res.status(400).json({ error: 'RETURN CHANNEL (EMAIL) INVALID' });
    if (!clean.message || clean.message.length > MAX.message)
      return res.status(400).json({ error: 'MESSAGE EMPTY OR TOO LONG' });

    try {
      await sendMail({
        to: process.env.CONTACT_INBOX || process.env.SMTP_USER,
        from: process.env.SMTP_USER,
        replyTo: clean.email,
        subject: `[SECURE CHANNEL] ${clean.name}`,
        text: `From: ${clean.name} <${clean.email}>\n\n${clean.message}`,
      });
      res.json({ ok: true, message: 'TRANSMISSION RECEIVED — channel secured' });
    } catch (err) {
      console.error('[contact] send failed:', err.message);
      res.status(502).json({ error: 'TRANSMISSION FAILED — use direct channel' });
    }
  });

  return router;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all contact tests pass (7) plus previous 4.

- [ ] **Step 5: Commit**

```bash
git add routes/contact.js test/contact.test.js
git commit -m "feat: contact endpoint with honeypot, time gate, validation"
```

---

### Task 6: Wire contact route + mailer into server (TDD)

**Files:**
- Modify: `server.js`
- Modify: `test/server.test.js`

- [ ] **Step 1: Add failing test for the contact rate limit (place LAST in `test/server.test.js` — it exhausts the limiter)**

```js
test('contact endpoint rate limits after RATE_CONTACT_MAX requests', async () => {
  let lastStatus = 0;
  for (let i = 0; i < 4; i++) { // limit is 3 in tests
    const res = await fetch(`${base}/api/contact`, {
      method: 'POST',
      headers: { ...UA, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'x', email: 'bad', message: 'x', ts: Date.now() - 5000 }),
    });
    lastStatus = res.status;
  }
  assert.equal(lastStatus, 429);
});
```

- [ ] **Step 2: Run tests to verify it fails**

Run: `npm test`
Expected: FAIL — last status 404 (route not mounted), not 429.

- [ ] **Step 3: Mount route in `server.js`**

Add `nodemailer` and the router require at the top, below the existing requires:

```js
const nodemailer = require('nodemailer');
const createContactRouter = require('./routes/contact');
```

Add between the UA guard block and `app.use(express.json(...))` — note `express.json` must come BEFORE the contact router, so move/keep order as shown:

```js
app.use(express.json({ limit: '10kb' }));

// Real Gmail transport when creds exist; logging stub otherwise (dev/test)
function buildSendMail() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return async (msg) => console.log('[mail-stub]', msg.subject);
  }
  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return (msg) => transport.sendMail(msg);
}

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_CONTACT_MAX || 5),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logBlock(req, 'contact-rate');
    res.status(429).json({ error: 'RATE LIMIT — intrusion attempt logged' });
  },
});

app.use('/api/contact', contactLimiter, createContactRouter(buildSendMail()));
```

Delete the now-duplicate `app.use(express.json({ limit: '10kb' }));` line that previously sat above `express.static`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all pass (12).

- [ ] **Step 5: Manual sanity run**

Run: `npm start` then visit `http://localhost:3000` — old site renders, styles/images load (now from `public/`). Stop server.

- [ ] **Step 6: Commit**

```bash
git add server.js test/server.test.js
git commit -m "feat: mount contact route with mailer and per-route rate limit"
```

---

### Task 7: HTML re-theme — hero, case files, redactions, form

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Replace the hero section**

Replace the entire `<section class="hero" id="about">…</section>` block with:

```html
<section class="hero" id="about">
  <div class="term" id="term">
    <div class="term__bar"><span></span><span></span><span></span></div>

    <p class="term__line"><span class="term__prompt">tai@osu:~$</span> <span class="term__cmd" data-type>scan --target tai_bradley</span></p>
    <p class="term__out">[+] recon complete — subject identified</p>

    <p class="term__line"><span class="term__prompt">tai@osu:~$</span> <span class="term__cmd" data-type>decrypt dossier_bradley.enc</span></p>
    <p class="term__out term__grant">[ACCESS GRANTED — CLEARANCE: PUBLIC]</p>

    <div class="dossier term__out">
      <span class="dossier__stamp" aria-hidden="true">DECLASSIFIED</span>
      <p class="dossier__label">// PERSONNEL FILE — OSU 2027</p>
      <h1 class="dossier__name">Tai Bradley</h1>
      <p class="dossier__row">FOCUS: cybersecurity <span class="dot">·</span> embedded systems <span class="dot">·</span> software</p>
      <p class="dossier__row">STATUS: <span class="dossier__active">● ACTIVE</span> — B.S. CS, Information &amp; Computer Assurance</p>
      <div class="btn-row dossier__btns">
        <a class="btn btn--primary" href="mailto:Bradley.809@osu.edu">Email</a>
        <a class="btn" href="https://www.linkedin.com/in/tai-bradley/" target="_blank" rel="noopener">LinkedIn</a>
        <a class="btn" href="https://github.com/Tbrad56" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>

    <p class="term__line" id="termFinal"><span class="term__prompt">tai@osu:~$</span> <span class="term__cursor" id="cursor"></span></p>
  </div>
  <p class="hero__phone">(470) 265-3853</p>
</section>
```

- [ ] **Step 2: Re-label sections as case files**

Exact replacements of the `<p class="section__label">` lines:

| Old | New |
|---|---|
| `// education` | `// FILE 01 — EDUCATION RECORDS` |
| `// technical skills` | `// FILE 02 — CAPABILITIES` |
| `// projects` | `// FILE 03 — OPERATIONS` |
| `// experience` | `// FILE 04 — FIELD ASSIGNMENTS` |
| `// leadership` | `// FILE 05 — LEADERSHIP` |
| `// contact` | `// FILE 06 — SECURE CHANNEL` |

- [ ] **Step 3: Restyle date pill text to stamp voice**

In every `<span class="card__date">`, replace `– Current` with `— ACTIVE` (e.g. `May 2026 — ACTIVE`). Leave date ranges with end dates unchanged.

- [ ] **Step 4: Add redaction spans (exactly these five)**

In the ICS/SCADA project bullets:
- `Stuxnet-style` → `<span class="redact" tabindex="0">Stuxnet-style</span>`
- `OpenSSL SHA-256 hashing` → `<span class="redact" tabindex="0">OpenSSL SHA-256 hashing</span>`

In the Sentinel IR bullets:
- `state-machine architecture` → `<span class="redact" tabindex="0">state-machine architecture</span>`

In the Email Automation Tool bullets:
- `<code>cryptography.Fernet</code>` → `<span class="redact" tabindex="0"><code>cryptography.Fernet</code></span>`
- `Gmail SMTP` → `<span class="redact" tabindex="0">Gmail SMTP</span>`

- [ ] **Step 5: Replace the contact section content**

Inside `<section class="section section--contact" id="contact">`, after the `section__title`, replace the existing content (keep the title and label) with:

```html
<p class="contact__line">Open to internships and research in cybersecurity &amp; software. Transmissions encrypted in transit.</p>
<form class="contact-form" id="contactForm" novalidate>
  <label>NAME
    <input name="name" required maxlength="100" autocomplete="name" />
  </label>
  <label>RETURN CHANNEL (EMAIL)
    <input type="email" name="email" required maxlength="200" autocomplete="email" />
  </label>
  <label>MESSAGE
    <textarea name="message" required maxlength="5000" rows="6"></textarea>
  </label>
  <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
  <button class="btn btn--primary" type="submit">TRANSMIT</button>
  <p class="contact-form__status" id="formStatus" role="status"></p>
</form>
<div class="btn-row">
  <a class="btn" href="mailto:Bradley.809@osu.edu">Direct channel: Bradley.809@osu.edu</a>
</div>
<p class="hero__phone">(470) 265-3853</p>
```

- [ ] **Step 6: Footer brag + script wiring**

Replace the footer `<p>` content with:

```html
<p>&gt; built &amp; hardened by Tai Bradley <span class="dot">·</span> 2026 <span class="dot">·</span> <span class="footer__dare">audit me: curl -I this site</span></p>
```

Delete the entire inline `<script>…</script>` block at the bottom of `<body>` (CSP forbids inline scripts; logic lives in `script.js`) and replace it with:

```html
<script src="script.js"></script>
```

- [ ] **Step 7: Verify by eye**

Run: `npm start`, open `http://localhost:3000`. Expected at this point: new markup renders unstyled-but-complete (dossier card visible, form visible, redactions look like plain text — CSS comes next task). No console CSP errors.

- [ ] **Step 8: Commit**

```bash
git add public/index.html
git commit -m "feat: dossier hero, case-file labels, redactions, contact form markup"
```

---

### Task 8: CSS re-theme

**Files:**
- Modify: `public/styles.css`

- [ ] **Step 1: Add dossier/redaction/form styles**

Append after the existing `/* ===== Hero (terminal) ===== */` block:

```css
/* ===== Dossier card (inside terminal) ===== */
.dossier {
  border: 1.5px solid var(--ink);
  border-radius: 8px;
  padding: 16px 18px;
  margin: 12px 0 10px;
  position: relative;
  background: #fffefb;
}
.dossier__stamp {
  position: absolute;
  top: 10px;
  right: 12px;
  border: 2px solid var(--green);
  color: var(--green);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 2px;
  padding: 2px 9px;
  transform: rotate(5deg);
  border-radius: 3px;
  user-select: none;
}
.dossier__label {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 2px;
}
.dossier__name {
  font-weight: 700;
  font-size: clamp(34px, 7vw, 60px);
  line-height: 1.05;
  letter-spacing: -1.5px;
  margin: 4px 0 10px;
}
.dossier__row { font-size: 13.5px; margin-top: 4px; }
.dossier__active { color: var(--green); font-weight: 700; }
.dossier__btns { justify-content: flex-start; margin-top: 16px; }

.term__grant { color: var(--green); font-weight: 700; }

/* ===== Redactions — hover/tap/focus to declassify ===== */
.redact {
  background: var(--ink);
  color: transparent;
  border-radius: 2px;
  padding: 0 6px;
  cursor: pointer;
  transition: color 0.22s ease, background 0.22s ease;
}
.redact code { background: transparent; color: inherit; padding: 0; }
.redact:hover, .redact:focus-visible, .redact.is-open {
  background: var(--green-soft);
  color: var(--green-dark);
}

/* ===== Case-file cards ===== */
.card { border-left: 3px solid var(--green); }
.card__date { text-transform: uppercase; letter-spacing: 1px; }

/* ===== Secure-channel form ===== */
.contact-form {
  max-width: 520px;
  margin: 18px auto 22px;
  text-align: left;
  display: grid;
  gap: 14px;
}
.contact-form label {
  display: grid;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--muted);
}
.contact-form input,
.contact-form textarea {
  font-family: var(--mono);
  font-size: 14px;
  color: var(--ink);
  background: #fffefb;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  resize: vertical;
}
.contact-form input:focus,
.contact-form textarea:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 0 3px var(--green-soft);
}
.contact-form .hp { position: absolute; left: -9999px; height: 0; width: 0; opacity: 0; }
.contact-form button { justify-self: start; }
.contact-form__status { font-size: 13px; min-height: 1.4em; }
.contact-form__status.ok { color: var(--green-dark); font-weight: 700; }
.contact-form__status.err { color: #a04040; font-weight: 700; }

.footer__dare { color: var(--green); }
```

- [ ] **Step 2: Update motion gating for the new hero**

In the existing `/* ===== Motion gates ===== */` block, replace every occurrence of `.term__btns` with `.dossier__btns`-free logic — the dossier reveals as one unit. The block becomes:

```css
.term__out { transition: opacity 0.28s ease; }

.js-motion .term__cmd { opacity: 0; }
.js-motion .term__out { opacity: 0; }
.term__out.show { opacity: 1; }
```

(Keep the `.js-motion .reveal` rules and the reduced-motion media query unchanged.)

- [ ] **Step 3: Verify by eye**

Run: `npm start`, open the page. Expected: dossier card with rotated green DECLASSIFIED stamp, black redaction bars revealing on hover, styled form, green file-edge on cards, uppercase date stamps. (Hero may be fully visible without animation — script comes next task.)

- [ ] **Step 4: Commit**

```bash
git add public/styles.css
git commit -m "feat: dossier, redaction, and secure-channel form styles"
```

---

### Task 9: Front-end script — typing, redaction taps, form submit

**Files:**
- Modify: `public/script.js` (full replacement)

- [ ] **Step 1: Replace `public/script.js` entirely with:**

```js
/* ============================================================
   Tai Bradley — dossier resume site
   - Motion gate (js-motion class, reduced-motion aware)
   - Mobile nav toggle
   - Terminal recon/declassify typing animation (motion only)
   - Scroll reveal (motion only)
   - Redaction tap-to-declassify
   - Secure-channel contact form
   ============================================================ */
(function () {
  'use strict';

  var PAGE_LOADED_AT = Date.now();

  /* ---------- Motion gate ---------- */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('js-motion');
  }

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open);
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Redactions: tap/keyboard toggle (all visitors) ---------- */
  document.querySelectorAll('.redact').forEach(function (el) {
    var open = function () { el.classList.toggle('is-open'); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  /* ---------- Secure-channel form (all visitors) ---------- */
  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        name: form.name.value,
        email: form.email.value,
        message: form.message.value,
        website: form.website.value, // honeypot — humans leave empty
        ts: PAGE_LOADED_AT,
      };
      status.className = 'contact-form__status';
      status.textContent = 'TRANSMITTING…';
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
        .then(function (r) {
          if (r.ok) {
            status.className = 'contact-form__status ok';
            status.textContent = r.j.message || 'TRANSMISSION RECEIVED — channel secured';
            form.reset();
          } else {
            status.className = 'contact-form__status err';
            status.textContent = r.j.error || 'TRANSMISSION FAILED — use direct channel';
          }
        })
        .catch(function () {
          status.className = 'contact-form__status err';
          status.textContent = 'TRANSMISSION FAILED — use direct channel below';
        });
    });
  }

  /* Motion-only enhancements below. Without js-motion, content is
     already fully visible — nothing else to do. */
  if (!document.documentElement.classList.contains('js-motion')) return;

  /* ---------- Terminal typing ---------- */
  var term = document.getElementById('term');
  var cursor = document.getElementById('cursor');
  var finalLine = document.getElementById('termFinal');

  if (term && cursor) {
    var cmds = Array.prototype.slice.call(term.querySelectorAll('[data-type]'));
    var outs = Array.prototype.slice.call(term.querySelectorAll('.term__out'));
    var cancelled = false;
    var done = false;

    cmds.forEach(function (el) {
      el.dataset.text = el.textContent;
      el.textContent = '';
    });

    var sleep = function (ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    };

    var finish = function () {
      if (done) return;
      done = true;
      cancelled = true;
      cmds.forEach(function (el) {
        el.textContent = el.dataset.text;
        el.style.opacity = '1';
      });
      outs.forEach(function (el) { el.classList.add('show'); });
      if (finalLine) finalLine.insertBefore(cursor, null);
    };

    var run = function () {
      return (async function () {
        for (var i = 0; i < cmds.length; i++) {
          var cmd = cmds[i];
          cmd.insertAdjacentElement('afterend', cursor);
          cmd.style.opacity = '1';
          var text = cmd.dataset.text;
          for (var c = 0; c < text.length; c++) {
            if (cancelled) return;
            cmd.textContent += text.charAt(c);
            await sleep(38);
          }
          if (cancelled) return;
          await sleep(220); // command "runs"
          // Reveal every consecutive output block after this command line
          var out = cmd.parentElement.nextElementSibling;
          while (out && out.classList.contains('term__out')) {
            out.classList.add('show');
            await sleep(180);
            if (cancelled) return;
            out = out.nextElementSibling;
          }
        }
        finish();
      })();
    };

    term.addEventListener('click', function () { finish(); });
    window.addEventListener('scroll', function () { finish(); }, { once: true, passive: true });

    run();
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    }
  }
})();
```

- [ ] **Step 2: Verify animation manually**

Run: `npm start`, open page in browser. Expected:
- Terminal types `scan --target tai_bradley`, shows recon line, types `decrypt dossier_bradley.enc`, shows ACCESS GRANTED, dossier card fades in, cursor rests at final prompt.
- Click during typing → jumps to finished state.
- Form submit with real values → green "TRANSMISSION RECEIVED" (mail-stub logs in server console since no SMTP creds).
- Redaction click toggles reveal.

- [ ] **Step 3: Verify degraded modes**

- DevTools → disable JavaScript → reload: full hero, form visible (submit won't work — mailto button is the fallback). Re-enable.
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → reload: no typing, everything visible instantly.

- [ ] **Step 4: Run automated tests still green**

Run: `npm test`
Expected: 12 pass.

- [ ] **Step 5: Commit**

```bash
git add public/script.js
git commit -m "feat: recon typing sequence, redaction toggles, form transmit"
```

---

### Task 10: README, .env.example

**Files:**
- Create: `.env.example`
- Create: `README.md`

- [ ] **Step 1: Create `.env.example`**

```
# Gmail SMTP — create an App Password: Google Account → Security → 2-Step Verification → App passwords
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
# Where contact-form messages are delivered
CONTACT_INBOX=Bradley.809@osu.edu
# Optional tuning
# PORT=3000
# RATE_GLOBAL_MAX=300
# RATE_CONTACT_MAX=5
```

- [ ] **Step 2: Create `README.md`**

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add .env.example README.md
git commit -m "docs: README with run, security, and deploy instructions"
```

---

### Task 11: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: 12 pass, 0 fail.

- [ ] **Step 2: Header audit**

Run: `curl -sI http://localhost:3000 | grep -iE 'content-security|strict-transport|x-content|x-frame'` (server running)
Expected: CSP, HSTS, nosniff, frame headers present.

- [ ] **Step 3: Bot checks from CLI**

```bash
curl -s -X POST http://localhost:3000/api/contact -H 'content-type: application/json' -d '{}'
```
Expected: `{"error":"AUTOMATED CLIENT REJECTED"}` (curl UA blocked).

- [ ] **Step 4: Manual browser checklist**

- Hero types and skips correctly; no layout shift.
- All 6 sections labeled FILE 01–06; cards have green edge; redactions toggle.
- Form happy path shows green confirmation; server console logs mail-stub (or real email arrives if `.env` configured).
- Mobile width: nav toggle works, redactions tap-toggle.
- JS off: full content + mailto fallback. Reduced motion: no animation.

- [ ] **Step 5: Run the verification-before-completion skill, then report status to the user.**
```

---

## Self-Review (completed)

- **Spec coverage:** hero (T7/T9), case files + redactions (T7/T8), contact form end-to-end (T5/T6/T7/T9), security app layer (T4/T5), infra layer + deploy docs (T10), error handling (T3/T5), testing (T3–T6, T11), WIP-tree cleanup (T1). README covers Render + Cloudflare. ✓
- **Placeholder scan:** none. ✓
- **Type consistency:** `createContactRouter(sendMail)` consistent T5/T6; `term__out`/`dossier` class names consistent T7/T8/T9; env var names consistent T4/T6/T10. ✓
