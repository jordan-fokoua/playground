function activateMenu() {
  const menuItems = document.querySelectorAll('.navigation-menu a');
  const currentUrl = window.location.href;

  menuItems.forEach((item) => {
    if (item.href === currentUrl) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  activateMenu();
});
