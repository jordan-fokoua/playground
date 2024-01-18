// service-worker.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_PORT') {
    dataDomeOptions = JSON.parse(event.data.ddOptions);
    getVersionPort = event.ports[0];

    processAsyncRequests(
      dataDomeOptions.ajaxListenerPath,
      dataDomeOptions.ajaxListenerPathsExclusion,
      dataDomeOptions.sfcc,
      true
    );
  }

  const { type, action, url } = event.data;
  if (type === 'request') {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: action }),
    })
      .then((response) => response.json())
      .then((data) => {
        event.source.postMessage({
          success: true,
          data: data,
        });
      })
      .catch((error) => {
        event.source.postMessage({
          success: false,
          error: error.toString(),
        });
      });
  }
});

/**
 * Processes response of all requests made on a specific path.
 * In "filtering" mode, if the hit is made by a bot to block, the catpcha is displayed over the page.
 *
 * @var ajaxListenerPaths           array of strings
 * @var enableDisplayResponsePage    boolean
 */
function processAsyncRequests(
  ajaxListenerPaths,
  ajaxListenerPathsExclusion,
  isSalesforce,
  enableDisplayResponsePage
) {
  // Store a reference to the original fetch function
  var nativeFetch = fetch;

  // Override original fetch function to hook 403 responses returned by Datadome
  fetch = function () {
    if (
      dataDomeOptions.overrideAbortFetch &&
      arguments.length > 1 &&
      arguments[1] && // arguments[1] could exist but be null/undefined
      typeof arguments[1].signal !== 'undefined' &&
      filterAsyncResponse(
        arguments[0],
        ajaxListenerPaths,
        ajaxListenerPathsExclusion
      )
    ) {
      try {
        delete arguments[1].signal;
      } catch (e) {}
    }

    var promise = nativeFetch.apply(this, arguments);

    // Catch is a reserved keyword in IE8/9
    promise['catch'](function (error) {});
    promise.then(function (response) {
      response
        .clone()
        .text()
        .then(function (response) {
          console.log('🚀 ~ file: service-worker.js:83 ~ response:', response);
          try {
            var isHTML = response.indexOf('<style') > -1 || response.indexOf('<script') > -1
            var jsonResp = null;
            jsonResp = JSON.parse(response);
            console.log(
              '🚀 ~ file: service-worker.js:72 ~ filterAsyncResponse(response.url, ajaxListenerPaths):',
              filterAsyncResponse(
                response.url,
                ajaxListenerPaths,
                ajaxListenerPathsExclusion,
                isSalesforce
              )
            );
            console.log(
              '🚀 ~ file: service-worker.js:73 ~ response.url:',
              response.url
            );
            console.log(
              '🚀 ~ file: service-worker.js:74 ~ ajaxListenerPaths:',
              ajaxListenerPaths
            );
            if (
              filterAsyncResponse(
                response.url,
                ajaxListenerPaths,
                ajaxListenerPathsExclusion,
                isSalesforce
              )
            ) {
              processResponse(
                jsonResp,
                response.headers,
                enableDisplayResponsePage
              );
            }
          } catch (error) {
            console.log('DD Error', error);
          }
        });
    });
    return promise;
  };
}

function filterAsyncResponse(
  responseUrl,
  ajaxListenerPaths,
  ajaxListenerPathsExclusion,
  isSalesforce
) {
  // excludes DataDome API endpoint for the JS call
  if (responseUrl === dataDomeOptions.endpoint) {
    return false;
  }

  // If ajaxListenerPaths is null/not defined, this function is never called
  // Nevertheless, if the user defines an empty array it will be called.
  // Thus, we ensure that in this situation, API calls are blocked.
  if (ajaxListenerPaths.length === 0) {
    return true;
  }

  if (isSalesforce) {
    var sfccPrefix = 'DDUser-Challenge';
    var responsePath = responseUrl.replace(/\?.*/, '');

    return (
      responsePath.slice(responsePath.length - sfccPrefix.length) === sfccPrefix
    );
  }

  // For IE11
  if (typeof responseUrl === 'undefined' || responseUrl === null) {
    return true;
  }

  // only allows to handle defined path
  // Not effective on IE => needs a rework
  // var foundMatchingURL = false;
  // var i = 0;
  // while (!foundMatchingURL && i < ajaxListenerPaths.length) {
  //   var ajaxListenerPath = ajaxListenerPaths[i];
  //   if (ajaxListenerPath !== '' && responseUrl.indexOf(ajaxListenerPath) > -1) {
  //     foundMatchingURL = true;
  //   }
  //   i++;
  // }

  return matchURLConfig(
    responseUrl,
    ajaxListenerPaths,
    ajaxListenerPathsExclusion
  );
}

function matchURLConfig(url, urlInclusions, urlExclusions) {
  if (url == null) {
    return false;
  }

  if (Array.isArray(urlExclusions)) {
    for (var i = 0; i < urlExclusions.length; ++i) {
      var exclusion = urlExclusions[i];

      if (matchURLParts(exclusion, url)) {
        return false;
      }
    }
  }

  if (Array.isArray(urlInclusions)) {
    for (var j = 0; j < urlInclusions.length; ++j) {
      var inclusion = urlInclusions[j];

      if (matchURLParts(inclusion, url)) {
        return true;
      }
    }
  }

  return false;
}

function matchURLParts(urlParts, url) {
  if (typeof url !== 'string') {
    return false;
  }

  // No need for parsing if there are no definitions for URL parts.
  if (
    urlParts.host == null &&
    urlParts.path == null &&
    urlParts.query == null &&
    urlParts.fragment == null
  ) {
    return urlParts.url != null && url.indexOf(urlParts.url) > -1;
  }

  var urlPartsObject = {
    host: '',
    path: '',
    query: '',
    fragment: '',
  };

  // If a URL starts with `//`, it's a protocol-relative URL: it will re-use the protocol of the current location.
  var hostDelimiter = '//';
  var pathDelimiter = '/';
  var queryDelimiter = '?';
  var fragmentDelimiter = '#';

  var hostIndex = url.indexOf(hostDelimiter);
  var isAbsolute = url.indexOf('://') > -1 || hostIndex === 0;

  // Rest of the URL to parse.
  var rest;

  if (isAbsolute) {
    rest = url.slice(hostIndex + hostDelimiter.length);

    var hostEndIndex = rest.indexOf(pathDelimiter);
    urlPartsObject.host = rest.slice(
      0,
      hostEndIndex > -1 ? hostEndIndex : undefined
    );
  } else {
    rest = url;
    urlPartsObject.host = document.location.host;
  }

  var pathIndex = rest.indexOf(pathDelimiter);
  var queryIndex = rest.indexOf(queryDelimiter);
  var fragmentIndex = rest.indexOf(fragmentDelimiter);

  // Relative paths could still start without a slash.
  var pathStart = pathIndex > -1 ? pathIndex : 0;

  if (queryIndex > -1) {
    if (!urlPartsObject.path) {
      urlPartsObject.path = rest.slice(pathStart, queryIndex);
    }
    urlPartsObject.query = rest.slice(
      queryIndex,
      fragmentIndex > -1 ? fragmentIndex : undefined
    );
  }

  if (fragmentIndex > -1) {
    if (!urlPartsObject.path) {
      urlPartsObject.path = rest.slice(pathStart, fragmentIndex);
    }
    urlPartsObject.fragment = rest.slice(fragmentIndex);
  }

  if (!urlPartsObject.path) {
    urlPartsObject.path = rest.slice(pathStart);
  }

  if (urlParts.strict) {
    var urlPartKeys = Object.keys(urlParts).filter(function (key) {
      return key != 'strict';
    });
    var strictlyMatches = urlPartKeys.every(function (key) {
      if (key === 'url') {
        return url.indexOf(urlParts[key]) > -1;
      }
      return urlPartsObject[key].indexOf(urlParts[key]) > -1;
    });
    return strictlyMatches;
  }

  return (
    (urlParts.host != null &&
      urlPartsObject.host.indexOf(urlParts.host) > -1) ||
    (urlParts.path != null &&
      urlPartsObject.path.indexOf(urlParts.path) > -1) ||
    (urlParts.query != null &&
      urlPartsObject.query.indexOf(urlParts.query) > -1) ||
    (urlParts.fragment != null &&
      urlPartsObject.fragment.indexOf(urlParts.fragment) > -1) ||
    (urlParts.url != null && url.indexOf(urlParts.url) > -1)
  );
}

function processResponse(responseBody, headers, enableDisplayResponsePage) {
  var dataDomeStatusHeader = 'x-dd-b';
  var foundStatusHeader = !!headers.get(dataDomeStatusHeader);

  if (foundStatusHeader === false) {
    return;
  }

  // Gets the body response
  if (!responseBody) {
    return;
  }

  // Handles the JSON response / validate that it's in JSON format
  try {
    var jsonResponse =
      typeof responseBody === 'string'
        ? JSON.parse(responseBody)
        : responseBody;
  } catch (error) {
    // Response could not be parsed as valid json
    return;
  }

  if (!jsonResponse || !jsonResponse.url) {
    return;
  }

  if (enableDisplayResponsePage) {
    // send url of captcha to jstag
    if (getVersionPort) {
      getVersionPort.postMessage({
        ddCaptchaUrl: jsonResponse.url,
      });
    } else {
      // In case the jstag was not loaded yet, we retry until it loads
      var maxRetries = 20;
      var numRetries = 0;
      var intervalJStagChannel = setInterval(function () {
        if (getVersionPort) {
          getVersionPort.postMessage(jsonResponse.url);
        } else if (numRetries < maxRetries) {
          numRetries++;
        } else if (numRetries >= maxRetries) {
          clearInterval(intervalJStagChannel);
        }
      }, 200);
    }
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async function () {
      console.log('DD SW Fetch');
      // Try to get the response from a cache.
      const cachedResponse = await caches.match(event.request);
      // Return it if we found one.
      if (cachedResponse) return cachedResponse;
      // If we didn't find a match in the cache, use the network.
      var response = await fetch(event.request);

      // in case we have a 403, we don't return the request so that we are sure that the captcha
      // will be displayed thanks to the message sent by the service worker
      if (response.status !== 403) {
        return response;
      }
    })()
  );
});
