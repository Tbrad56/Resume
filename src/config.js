const path = require('path');

const num = (value, fallback) => Number(value) || fallback;

const MINUTE = 60 * 1000;

/**
 * Every environment read in the app happens here, once, at require time.
 * Nothing else in src/ touches process.env — that keeps the deployable
 * surface visible in a single file.
 */
module.exports = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  isTest: process.env.NODE_ENV === 'test',
  port: num(process.env.PORT, 3000),

  publicDir: path.join(__dirname, '..', 'public'),

  rate: Object.freeze({
    windowMs: 15 * MINUTE,
    globalMax: num(process.env.RATE_GLOBAL_MAX, 300),
    contactWindowMs: 60 * MINUTE,
    contactMax: num(process.env.RATE_CONTACT_MAX, 5),
    // Tarpit: start adding latency once a client passes this many requests.
    tarpitAfter: 100,
    tarpitMaxDelayMs: 3000,
  }),

  mail: Object.freeze({
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    inbox: process.env.CONTACT_INBOX || process.env.SMTP_USER,
  }),
});
