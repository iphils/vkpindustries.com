// Kairali – small site interactions (no dependencies)

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', false);
}));

// Image placeholders: each .ph has data-src. If that file exists in assets/img/,
// it is loaded automatically – just drop the photo in with the matching filename.
// (Images that already exist are written as plain <img> tags in index.html.)
// The <img> is attached straight away (hidden) so lazy-loading works in every browser.
document.querySelectorAll('.ph[data-src]').forEach(ph => {
  const img = document.createElement('img');
  img.alt = ph.dataset.label || '';
  img.loading = 'lazy';
  img.hidden = true;
  img.onload = () => { img.hidden = false; ph.classList.add('is-loaded'); };
  img.onerror = () => img.remove();
  img.src = ph.dataset.src;
  ph.appendChild(img);
});

// Reveal-on-scroll
const revealEls = document.querySelectorAll('.section__head, .product, .step, .benefit, .ritual, .order-steps li, .split__text, .split__media');
revealEls.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// Analytics: WhatsApp chat links (order-builder sends its own event)
document.querySelectorAll('a[href*="wa.me"]').forEach(a => a.addEventListener('click', () => {
  if (typeof window.track !== 'function') return;
  const where = a.closest('section[id], header, footer, .wa-float');
  window.track('whatsapp_click', { location: where ? (where.id || where.className.split(' ')[0] || where.tagName.toLowerCase()) : 'page' });
}));

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
