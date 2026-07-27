const { logBlock } = require('../lib/log');

const BOT_UA = /curl|wget|python|scrapy|httpclient|headless|bot|spider/i;

/**
 * Rejects obviously-automated clients on /api routes.
 *
 * This is a speed bump, not a security control: any script that sets a browser
 * User-Agent walks straight through it. The real limits on this endpoint are
 * the rate limiter and the honeypot/time-gate in routes/contact.js. Kept
 * because it cheaply drops the background noise of drive-by scanners.
 */
module.exports = function botGuard(req, res, next) {
  const ua = req.get('user-agent') || '';
  if (!ua || BOT_UA.test(ua)) {
    logBlock(req, 'ua-guard');
    return res.status(403).json({ error: 'AUTOMATED CLIENT REJECTED' });
  }
  next();
};
