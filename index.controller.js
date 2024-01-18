const path = require('path');
const fs = require('fs');
const { injectNonce } = require('./utils/nonce');

const defaultController = (req, res) => {
  const filePath = path.join(__dirname, 'public', 'index.html');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('An error occurred');
    }

    if (res.locals.nonce) {
      const nonce = res.locals.nonce;
      const html = injectNonce(nonce, data);
      return res.send(html);
    }

    return res.send(data);
  });
};

const defaultRequest = (req, res) => {
  const { isLargeResponseBody } = req.body;
  if (isLargeResponseBody) {
    const largeData = [];
    for (let i = 0; i < 100000; i++) {
      largeData.push({
        id: i,
      });
    }

    return res.json(largeData);
  }

  res.status(200).json({
    result: 'You have accessed the allowed route!',
  });
};
module.exports = { defaultController, defaultRequest };
