const nodemailer = require('nodemailer');
const config = require('../config');

/**
 * Returns a sendMail(msg) function.
 *
 * Without SMTP credentials it returns a logging stub, so `npm start` works on a
 * fresh clone and the test suite never needs network access. The contact router
 * takes this as an injected dependency rather than importing it, which is what
 * lets the tests pass a spy.
 */
function buildSendMail() {
  if (!config.mail.user || !config.mail.pass) {
    return async (msg) => console.log('[mail-stub]', msg.subject);
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.mail.user, pass: config.mail.pass },
  });

  return (msg) => transport.sendMail(msg);
}

module.exports = { buildSendMail };
