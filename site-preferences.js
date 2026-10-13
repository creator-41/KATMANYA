(() => {
  'use strict';
  const key = 'katmanya-consent-v1';
  const ttl = 180 * 24 * 60 * 60 * 1000;
  const banner = document.querySelector('#consent-banner');
  const dialog = document.querySelector('#consent-dialog');
  const checkbox = document.querySelector('#consent-functional');
  const status = document.querySelector('#consent-status');
  let choice = null;
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (stored && typeof stored.functional === 'boolean' && Number.isFinite(stored.at) && Date.now() - stored.at >= 0 && Date.now() - stored.at < ttl) choice = stored;
    else localStorage.removeItem(key);
  } catch {}
  const clearFunctional = () => { try { localStorage.removeItem('katmanya-install-prompt-until'); } catch {} };
  if (!choice?.functional) clearFunctional();
  window.katmanyaPreferences = {functionalAllowed: () => choice?.functional === true};
  if (banner) banner.hidden = choice !== null;
  const save = functional => {
    choice = {functional, at: Date.now()};
    let persisted = true;
    try {localStorage.setItem(key, JSON.stringify(choice));} catch {persisted = false;}
    if (!functional) clearFunctional();
    banner.hidden = true;
    status.textContent = persisted ? 'Tercihin kaydedildi.' : 'Tercihin bu sayfada geçerli; cihazında saklanamadı.';
    window.dispatchEvent(new CustomEvent('katmanya:preferences', {detail: {functional}}));
  };
  const open = () => {checkbox.checked = choice?.functional === true; status.textContent = ''; if (!dialog.open) dialog.showModal();};
  document.querySelectorAll('[data-consent-open]').forEach(button => button.addEventListener('click', open));
  document.querySelector('[data-consent-reject]')?.addEventListener('click', () => save(false));
  document.querySelector('[data-consent-accept]')?.addEventListener('click', () => save(true));
  dialog?.querySelector('.info-close').addEventListener('click', () => dialog.close());
  dialog?.querySelector('.consent-save').addEventListener('click', () => {save(checkbox.checked); dialog.close();});
})();
