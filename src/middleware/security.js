const helmet = require('helmet');

/**
 * CSP notes:
 * - No 'unsafe-inline' in styleSrc. Every rule lives in assets/css/styles.css;
 *   the 404 page used to carry three inline style attributes and no longer does.
 *   Keep it that way — inline styles in markup will silently stop applying.
 * - script.js assigns el.style.* during the terminal animation. Those are CSSOM
 *   property writes, which style-src does not govern, so they are unaffected.
 * - fonts.googleapis.com serves the stylesheet, fonts.gstatic.com the font files.
 */
module.exports = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
});
