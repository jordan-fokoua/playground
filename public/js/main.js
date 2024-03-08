const LS_RO_KEY = 'dd-request-options';

function addMainEventListeners() {
  document.getElementById('submit-request').addEventListener('click', function () {
    makeApiCall();
    saveRequestOptions();
  });
}

function saveRequestOptions() {
  const requestType = document.querySelector('input[name="requestType"]:checked').value;
  const largeResponseBody = document.getElementById('largeResponseBody').checked;
  const abortSignal = document.getElementById('abortSignal').checked;
  const responseType = document.querySelector('input[name="responseType"]:checked').value;

  const requestOptions = {
    requestType,
    largeResponseBody,
    responseType,
    abortSignal,
  };

  localStorage.setItem(LS_RO_KEY, JSON.stringify(requestOptions));
}

function updateRequestOptionsOnLoad() {
  const requestOptions = JSON.parse(localStorage.getItem(LS_RO_KEY));

  if (requestOptions) {
    if (requestOptions.requestType) {
      const id = `use${requestOptions.requestType.charAt(0).toUpperCase() + requestOptions.requestType.slice(1)}`;
      document.getElementById(id).checked = true;
    }

    if (requestOptions.largeResponseBody !== undefined) {
      document.getElementById('largeResponseBody').checked = requestOptions.largeResponseBody;
    }

    if (requestOptions.abortSignal !== undefined) {
      document.getElementById('abortSignal').checked = requestOptions.abortSignal;
    }

    if (requestOptions.responseType) {
      document.getElementById(`${requestOptions.responseType}Response`).checked = true;
    }
  }
}

function getSelectedRadioValue(name) {
  const selectedRadioButton = document.querySelector(`input[name="${name}"]:checked`);
  return selectedRadioButton ? selectedRadioButton.value : null;
}

function makeApiCall() {
  const useFetch = document.getElementById('useFetch').checked;
  const isLargeResponseBody = document.getElementById('largeResponseBody').checked;
  const abortSignal = document.getElementById('abortSignal').checked;
  const action = getSelectedRadioValue('responseType');

  const args = { action, isLargeResponseBody, abortSignal };
  if (useFetch) {
    sendFetch(args);
  } else {
    sendXHR(args);
  }
}

const controller = new AbortController();
const signal = controller.signal;

function sendFetch(params) {
  const { action, abortSignal } = params;
  const url = document.location.origin + '/api/' + action;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    signal: abortSignal ? AbortSignal.timeout(1) : null,
  };
  // const fetchPromise = true ? fetch(new Request(url), options) : fetch(url, options);

  fetch(url, options)
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
