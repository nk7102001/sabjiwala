// Sabjiwala — Global JS utilities

// ── Cart helpers ──────────────────────────────────────────
window.SabjiCart = {
  get() {
    try { const c = JSON.parse(localStorage.getItem('cart') || '[]'); return Array.isArray(c) ? c : []; }
    catch { return []; }
  },
  save(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  },
  count() { return this.get().reduce((s, i) => s + (parseInt(i.qty, 10) || 0), 0); }
};

// ── Toast notification ────────────────────────────────────
window.showToast = function(msg, type = 'success') {
  const colors = { success: '#15803d', error: '#dc2626', info: '#2563eb' };
  const t = document.createElement('div');
  t.className = 'sw-toast';
  t.style.background = colors[type] || colors.success;
  t.innerHTML = msg;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2800);
};

// ── Animate elements on scroll ────────────────────────────
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.anim-fade-up').forEach(el => {
    const delay = el.style.animationDelay || '0s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity .55s cubic-bezier(.22,1,.36,1) ${delay}, transform .55s cubic-bezier(.22,1,.36,1) ${delay}`;
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
});
