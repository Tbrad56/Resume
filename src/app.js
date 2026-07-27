// quiet: dotenv 17 prints a promotional banner on load otherwise, which is
// noise in deploy logs.
require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');

const config = require('./config');
const security = require('./middleware/security');
const botGuard = require('./middleware/bot-guard');
const { globalLimiter, contactLimiter, tarpit } = require('./middleware/rate-limit');
const { buildSendMail } = require('./services/mailer');
const createContactRouter = require('./routes/contact');

const app = express();

// Render (and Cloudflare in front of it) terminates TLS and forwards one hop.
// This is what makes req.ip the real client address instead of the proxy's.
// See docs/SECURITY.md — running this app with no proxy in front makes
// X-Forwarded-For spoofable and defeats every per-IP limit below.
app.set('trust proxy', 1);

app.use(security);
app.use(globalLimiter);
if (!config.isTest) app.use(tarpit);

app.use('/api', botGuard);
app.use(express.json({ limit: '10kb' }));

app.use('/api/contact', contactLimiter, createContactRouter(buildSendMail()));

app.use(express.static(config.publicDir, {
  dotfiles: 'ignore',
  index: 'index.html',
  maxAge: '1h',
}));

// 404 — anything not matched above
app.use((req, res) => {
  res.status(404).sendFile(path.join(config.publicDir, '404.html'));
});

// Catch-all error handler. Logs detail, returns none.
//
// Body-parser rejections (oversized payload, malformed JSON) carry their own
// 4xx status. Reporting those as 500 blamed the server for a client mistake and
// made real faults harder to spot in the logs, so honor err.status and only
// treat 5xx as an actual error.
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error('[error]', err);
  } else {
    console.warn(`[client-error] ${status} ${err.type || err.name} path=${req.path}`);
  }

  const message = status === 413
    ? 'PAYLOAD TOO LARGE — transmission rejected'
    : status >= 500
      ? 'TRANSMISSION FAILED — internal error'
      : 'MALFORMED TRANSMISSION — check your payload';

  res.status(status).json({ error: message });
});

module.exports = app;
