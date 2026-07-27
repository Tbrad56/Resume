/**
 * One line per rejected request, so the reason a client was turned away is
 * greppable in the deploy logs. Shared by the rate limiters and the UA guard.
 */
const logBlock = (req, reason) =>
  console.warn(
    `[blocked] ${reason} ip=${req.ip} ua="${req.get('user-agent') || ''}" path=${req.path}`
  );

module.exports = { logBlock };
