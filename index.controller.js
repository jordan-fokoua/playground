const path = require('path');
const fs = require('fs');
const { injectNonce } = require('./utils/nonce');
const { injectTagURL } = require('./utils/tags');

const defaultController = (req, res) => {
  const { tag } = req.query;
  const filePath = path.join(__dirname, 'public', 'home.html');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('An error occurred');
    }
    let html = injectTagURL(data, tag);

    if (res.locals.nonce) {
      const nonce = res.locals.nonce;
      html = injectNonce(nonce, html);
      return res.send(html);
    }

    return res.send(html);
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
