// service-worker.js
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'INIT_PORT') {
    dataDomeOptions = JSON.parse(event.data.ddOptions);
    getVersionPort = event.ports[0];

    processAsyncRequests(dataDomeOptions.ajaxListenerPath, true);
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
function processAsyncRequests(ajaxListenerPaths, enableDisplayResponsePage) {
  // Store a reference to the original fetch function
  var nativeFetch = fetch;

  // Override original fetch function to hook 403 responses returned by Datadome
  fetch = function () {
    if (
      dataDomeOptions.overrideAbortFetch &&
      arguments.length > 1 &&
      arguments[1] && // arguments[1] could exist but be null/undefined
      typeof arguments[1].signal !== 'undefined' &&
      filterAsyncResponse(arguments[0], ajaxListenerPaths)
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
        .then(function (textResponse) {
          try {
            var jsonResp = JSON.parse(textResponse);

            if (filterAsyncResponse(response.url, ajaxListenerPaths)) {
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

function filterAsyncResponse(responseUrl, ajaxListenerPaths) {
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

  // For IE11
  if (typeof responseUrl === 'undefined' || responseUrl === null) {
    return true;
  }

  // only allows to handle defined path
  // Not effective on IE => needs a rework
  var foundMatchingURL = false;
  var i = 0;
  while (!foundMatchingURL && i < ajaxListenerPaths.length) {
    var ajaxListenerPath = ajaxListenerPaths[i];
    console.log(
      '🚀 2 ~ filterAsyncResponse ~ ajaxListenerPath:',
      ajaxListenerPath
    );
    console.log('🚀 8 ~ filterAsyncResponse ~ responseUrl:', responseUrl);
    console.log(
      '🚀 5 ~ filterAsyncResponse ~ responseUrl.indexOf(ajaxListenerPath):',
      responseUrl.indexOf(ajaxListenerPath.url)
    );
    if (
      ajaxListenerPath.url !== '' &&
      responseUrl.indexOf(ajaxListenerPath.url) > -1
    ) {
      foundMatchingURL = true;
    }
    i++;
  }

  return foundMatchingURL;
}

function processResponse(url, urlInclusions, urlExclusions) {
  if (url == null) {
    return false;
  }

  if (Array.isArray(urlExclusions)) {
    for (var i = 0; i < urlExclusions.length; ++i) {
      var exclusion = urlExclusions[i];

      if (this.matchURLParts(exclusion, url)) {
        return false;
      }
    }
  }

  if (Array.isArray(urlInclusions)) {
    for (var j = 0; j < urlInclusions.length; ++j) {
      var inclusion = urlInclusions[j];

      if (this.matchURLParts(inclusion, url)) {
        return true;
      }
    }
  }

  return false;
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
