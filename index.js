const http = require('http');
const express = require('express');
const DataDome = require('@datadome/node-module');
const path = require('path');
const fs = require('fs');
const { cspMiddleware } = require('./middlewares/csp');
const { defaultController, defaultRequest } = require('./index.controller');

const app = express();
const port = 3001;

const datadomeClient = new DataDome('rDFN3kWHveXOLop', 'api.datadome.co');

const datadomeMiddleware = (req, resp, next) => {
  datadomeClient.authCallback(
    req,
    resp,
    function () {
      next();
    },
    function () {},
    { nonce: resp.locals.nonce }
  );
};

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/csp', cspMiddleware, defaultController);

app.get('/', defaultController);

app.get('/service-worker', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'sw.html');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('An error occurred');
    }

    return res.send(data);
  });
});

app.get('/iframe', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'iframe.html');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('An error occurred');
    }

    return res.send(data);
  });
});

app.get('/cookie_injection', (req, res) => {
  const filePath = path.join(__dirname, 'public', 'cookie_injection.html');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('An error occurred');
    }

    return res.send(data);
  });
});

app.post('/api/not_monitored', defaultRequest);

app.post('/api/allow', datadomeMiddleware, defaultRequest);

app.post('/api/block', datadomeMiddleware, defaultRequest);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
