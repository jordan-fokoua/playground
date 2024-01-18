const crypto = require('crypto');

function generateNonce() {
  return crypto.randomBytes(16).toString('base64');
}

function injectNonce(nonce, html) {
  const modifiedHtml = html
    .replace(/<script/g, `<script nonce="${nonce}" `)
    .replace(/<style/g, `<style nonce="${nonce}" `);

  return modifiedHtml;
}

module.exports = { generateNonce, injectNonce };
