(() => {
  'use strict';
  const loading = document.querySelector('#scene-loading');
  const ready = () => { if (loading) loading.hidden = true; };
  window.addEventListener('katmanya:scene-ready', ready, {once:true});
  window.addEventListener('load', () => {
    if (loading && !loading.hidden) loading.textContent = '3D görünüm açılamadı; ürünlere aşağıdan ulaşabilirsin.';
  }, {once:true});
  document.querySelectorAll('.product-slide').forEach(slide => {
    const input = slide.querySelector('.quote-quantity');
    const link = slide.querySelector('[data-quote-product]');
    if (!input || !link) return;
    const error = document.createElement('p');
    error.className = 'field-error'; error.hidden = true; error.setAttribute('role','alert');
    error.id = 'quantity-error-' + slide.dataset.chapter;
    input.setAttribute('aria-describedby', error.id); input.insertAdjacentElement('afterend', error);
    const validate = () => {
      const valid = input.checkValidity() && Number.isInteger(Number(input.value)) && input.value !== '';
      input.setAttribute('aria-invalid', String(!valid)); error.hidden = valid;
      error.textContent = valid ? '' : 'Adedi 1 ile 999 arasında tam sayı olarak gir.';
      return valid;
    };
    input.addEventListener('input', validate);
    link.addEventListener('click', event => { if (!validate()) {event.preventDefault(); input.focus();} }, true);
  });
  const dialog = document.querySelector('#quote-thanks');
  dialog?.querySelector('.info-close').addEventListener('click', () => dialog.close());
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0 || dialog?.contains(link)) return;
    const url = new URL(link.href, location.href);
    if (url.hostname !== 'wa.me') return;
    if (dialog) {document.querySelector('#thanks-retry').href = link.href; dialog.showModal();}
  });
})();
