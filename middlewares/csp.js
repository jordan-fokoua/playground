const helmet = require('helmet');
const { generateNonce } = require('../utils/nonce');

function cspMiddleware(req, res, next) {
  const cspNonce = generateNonce();

  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'none'"],
      scriptSrc: [
        "'self'",
        `'nonce-${cspNonce}'`,
        'https://js.datadome.co',
        'https://ct.captcha-delivery.com/c.js',
      ],
      connectSrc: [
        "'self'",
        `https://${req.headers.host}`,
        'https://api-js.datadome.co',
      ],
      styleSrc: ["'self'", 'https://fonts.googleapis.com'],
      frameSrc: ['geo.captcha-delivery.com'],
      workerSrc: ['blob:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    },
  })(req, res, next);

  res.locals.nonce = cspNonce;
}

module.exports = { cspMiddleware };
