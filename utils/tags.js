const scriptURLS = {
  jstag: 'https://js.datadome.co/tags.js',
  xhrtag: 'https://js.captcha-display.com/xhr_tag.js',
};

function injectTagURL(HTML, tag) {
  let URL = scriptURLS.jstag;
  if (tag === 'xhr') {
    URL = scriptURLS.xhrtag;
  }
  return HTML.replace(/{TAG_URL}/g, `${URL} `);
}

module.exports = { injectTagURL };
