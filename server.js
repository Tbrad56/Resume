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
