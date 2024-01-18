const LS_RO_KEY = 'dd-request-options';

function addMainEventListeners() {
  document
    .getElementById('submit-request')
    .addEventListener('click', function () {
      makeApiCall();
      saveRequestOptions();
    });
}

function saveRequestOptions() {
  const requestType = document.querySelector(
    'input[name="requestType"]:checked'
  ).value;
  const largeResponseBody =
    document.getElementById('largeResponseBody').checked;
  const responseType = document.querySelector(
    'input[name="responseType"]:checked'
  ).value;

  const requestOptions = {
    requestType,
    largeResponseBody,
    responseType,
  };

  localStorage.setItem(LS_RO_KEY, JSON.stringify(requestOptions));
}

function updateRequestOptionsOnLoad() {
  const requestOptions = JSON.parse(localStorage.getItem(LS_RO_KEY));

  if (requestOptions) {
    if (requestOptions.requestType) {
      const id = `use${
        requestOptions.requestType.charAt(0).toUpperCase() +
        requestOptions.requestType.slice(1)
      }`;
      document.getElementById(id).checked = true;
    }

    if (requestOptions.largeResponseBody !== undefined) {
      document.getElementById('largeResponseBody').checked =
        requestOptions.largeResponseBody;
    }

    if (requestOptions.responseType) {
      document.getElementById(
        `${requestOptions.responseType}Response`
      ).checked = true;
    }
  }
}

function makeApiCall() {
  const useFetch = document.getElementById('useFetch').checked;
  const isLargeResponseBody =
    document.getElementById('largeResponseBody').checked;
  const isBlocked = document.getElementById('blockResponse').checked;
  const action = isBlocked ? 'block' : 'allow';

  const args = { action, isLargeResponseBody };
  if (useFetch) {
    sendFetch(args);
  } else {
    sendXHR(args);
  }
}

function sendFetch(params) {
  const { action } = params;
  fetch(document.location.origin + '/api/' + action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .catch((error) => {
      console.log('🚀 [DD] => file: main.js:44 => sendFetch => error:', error);
    });
}

function sendXHR(params) {
  const { action } = params;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', document.location.origin + '/api/' + action, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      console.log('API call successful');
    }
  };
  xhr.send(JSON.stringify(params));
}

document.addEventListener('DOMContentLoaded', function () {
  addMainEventListeners();
  updateRequestOptionsOnLoad();
});
