// main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker-base.js').then((reg) => {
      console.log('Main Service worker registered:', reg);
      const blockBtn = document.getElementById('blockButton');

      blockBtn.addEventListener('click', () => {
        reg.active.postMessage({
          action: 'block',
          url: document.location.origin + '/api/block',
          type: 'request'
        });
      });
    });
  });
}
