const urlInput = document.getElementById('urlInput');
const urlFrame = document.getElementById('urlFrame');

function openURL() {
  if (urlInput && urlFrame) {
    urlFrame.src = urlInput.value;
  }
}

function loadPage() {
  urlInput.value = document.location.origin
  openURL();
}

document.addEventListener('DOMContentLoaded', function () {
  loadPage();
});
