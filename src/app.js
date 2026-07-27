require('dotenv').config();

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
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[error]', err);
  res.status(500).json({ error: 'TRANSMISSION FAILED — internal error' });
});

module.exports = app;
