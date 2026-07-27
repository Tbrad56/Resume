const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const config = require('../config');
const { logBlock } = require('../lib/log');

const limitHandler = (reason) => (req, res) => {
  logBlock(req, reason);
  res.status(429).json({ error: 'RATE LIMIT — intrusion attempt logged' });
};

// Broad ceiling across the whole app.
const globalLimiter = rateLimit({
  windowMs: config.rate.windowMs,
  max: config.rate.globalMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler('global-rate'),
});

// Tight ceiling on the one endpoint that costs money to abuse (outbound mail).
const contactLimiter = rateLimit({
  windowMs: config.rate.contactWindowMs,
  max: config.rate.contactMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler('contact-rate'),
});

// Progressive latency for hot clients. Disabled under test so the suite
// does not spend real seconds sleeping.
const tarpit = slowDown({
  windowMs: config.rate.windowMs,
  delayAfter: config.rate.tarpitAfter,
  delayMs: (hits) => Math.min(hits * 100, config.rate.tarpitMaxDelayMs),
});

module.exports = { globalLimiter, contactLimiter, tarpit };
