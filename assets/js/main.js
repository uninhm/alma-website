function mobileMenuToggle() {
  const mobileMenu = document.getElementById('mobileMenu');
  const isOpen = mobileMenu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
}
