const LS_TAG_OPT_KEY = 'dd-tag-options';
const LS_TAG_SCRIPT_TYPE_KEY = 'dd-tag-script-type';

const scriptTagId = 'ddTag';
const defaultOptions = {
  ajaxListenerPath: true,
  ajaxListenerPathExclusion: ['/not_monitored']
};
const key = 'C1EDA83B84FD6C15787D04CA5166FB';
let optionsKey = 'ddoptions';
const currentUrl = new URL(window.location);

function getTagOptionsKey() {
  if (currentUrl.searchParams.get('tag') === 'xhr') {
    optionsKey = 'ddCaptchaOptions';
  } else {
    optionsKey = 'ddoptions';
  }
}

function addTagEventListeners() {
  const updateOptsBtn = document.getElementById('options-update-btn');
  updateOptsBtn.addEventListener('click', updateTagOptions);

  var useJSTag = document.getElementById('useJSTag');
  useJSTag.addEventListener('click', switchTag);

  var useXHRTag = document.getElementById('useXHRTag');
  useXHRTag.addEventListener('click', switchTag);
}

function switchTag(event) {
  localStorage.setItem(LS_TAG_SCRIPT_TYPE_KEY, event.target.value);
  const scriptType = document.querySelector('input[name="scriptType"]:checked').value;
  const currentUrl = new URL(window.location);

  if (scriptType === 'xhr') {
    currentUrl.searchParams.set('tag', 'xhr');
  } else {
    currentUrl.searchParams.delete('tag');
  }

  window.location.href = currentUrl.href;
}

function getTagData() {
  let options = localStorage.getItem(LS_TAG_OPT_KEY);
  if (options) {
    options = JSON.parse(options);
  }
  return {
    key,
    options: options || defaultOptions,
  };
}

function displayTagOptions() {
  setTimeout(() => {
    document.getElementById('tagOptions').value = JSON.stringify(window[optionsKey], null, 2);
  }, 500);
}

function updateTagOptions() {
  try {
    document.getElementById('options-error').innerText = '';
    const newOptions = JSON.parse(document.getElementById('tagOptions').value);
    localStorage.setItem(LS_TAG_OPT_KEY, JSON.stringify(newOptions));
    window[optionsKey] = newOptions;
    location.reload();
  } catch (error) {
    document.getElementById('options-error').innerText = error;
  }
}

function updateCheckedStatus() {
  const scriptType = localStorage.getItem(LS_TAG_SCRIPT_TYPE_KEY);
  if (scriptType) {
    if (scriptType === 'js') {
      document.getElementById('useJSTag').checked = true;
    } else if (scriptType === 'xhr') {
      document.getElementById('useXHRTag').checked = true;
    }
  } else {
    document.getElementById('useJSTag').checked = true;
    localStorage.setItem(LS_TAG_SCRIPT_TYPE_KEY, 'js');
  }
}

document.addEventListener('DOMContentLoaded', function () {
  updateCheckedStatus();
  displayTagOptions();
  addTagEventListeners();
});

getTagOptionsKey();
const tagData = getTagData();
window.ddjskey = tagData.key;
window[optionsKey] = tagData.options;
