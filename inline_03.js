
// 回到顶部按钮显隐
(function() {
  var btn = document.getElementById('backToTop');
  if (!btn) return;
  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        btn.classList.toggle('visible', window.scrollY > 400);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
