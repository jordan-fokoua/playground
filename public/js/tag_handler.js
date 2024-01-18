const LS_TAG_OPT_KEY = 'dd-tag-options';
const LS_SRC_KEY = 'dd-src';

const scriptTagId = 'ddTag';
const defaultUrl = 'https://js.datadome.co/tags.js';
const defaultOptions = {
  ajaxListenerPath: true,
  withCredentials: true,
  allowHtmlContentTypeOnCaptcha: true,
};
const key = 'C1EDA83B84FD6C15787D04CA5166FB';

function addTagEventListeners() {
  const updateOptsBtn = document.getElementById('options-update-btn');
  updateOptsBtn.addEventListener('click', function () {
    updateTagOptions();
  });
}

function getTagData() {
  let options = localStorage.getItem(LS_TAG_OPT_KEY);
  const src = localStorage.getItem(LS_SRC_KEY);
  if (options) {
    options = JSON.parse(options);
  }
  return {
    key,
    options: options || defaultOptions,
    src: src || defaultUrl,
  };
}

function displayTagOptions() {
  setTimeout(() => {
    document.getElementById('tagOptions').value = JSON.stringify(
      window.ddoptions,
      null,
      2
    );
  }, 500);
}

function updateTagOptions() {
  try {
    document.getElementById('options-error').innerText = '';
    const isJSTag = !!window.ddoptions;
    const newOptions = JSON.parse(document.getElementById('tagOptions').value);
    localStorage.setItem(LS_TAG_OPT_KEY, JSON.stringify(newOptions));
    if (isJSTag) {
      window.ddoptions = newOptions;
    } else {
      window.ddCaptchaOptions = newOptions;
    }
    location.reload();
  } catch (error) {
    document.getElementById('options-error').innerText = error;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  displayTagOptions();
  addTagEventListeners();
});

const tagData = getTagData();
window.ddjskey = tagData.key;
window.ddoptions = tagData.options;
