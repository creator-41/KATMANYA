(() => {
  'use strict';
  const trigger = document.querySelector('.workshop-trigger');
  const dialog = document.querySelector('#design-workshop');
  if (!trigger || !dialog || typeof dialog.showModal !== 'function') return;
  let saved = null;
  trigger.disabled = false;
  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    saved = {
      scrollY: window.scrollY,
      body: {position: document.body.style.position, top: document.body.style.top, width: document.body.style.width}
    };
    Object.assign(document.body.style, {position: 'fixed', top: -saved.scrollY + 'px', width: '100%'});
    dialog.showModal();
    dialog.querySelector('.workshop-close').focus({preventScroll: true});
  });
  dialog.querySelector('.workshop-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (!saved) return;
    Object.assign(document.body.style, saved.body);
    window.scrollTo({top: saved.scrollY, left: 0, behavior: 'instant'});
    saved = null;
    trigger.focus({preventScroll: true});
  });
})();
