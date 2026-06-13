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
