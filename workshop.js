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

  // Filtering only changes the catalog; it never alters a tool's draft.
  let revealCard = () => {};
  const filters = dialog.querySelector('.workshop-filters');
  if (filters) {
    const cards = Array.from(dialog.querySelectorAll('.workshop-card'));
    const buttons = Array.from(filters.querySelectorAll('[data-workshop-filter]'));
    const summary = dialog.querySelector('.workshop-filter-status');
    const labels = {all:'Tümü',gift:'Hediye',desk:'Masaüstü',play:'Oyun'};
    const belongs = (card,category) => category==='all' || (card.dataset.workshopCategories||'').split(/\s+/).includes(category);
    function select(category) {
      if (!Object.hasOwn(labels,category)) return;
      cards.forEach(card => {card.hidden=!belongs(card,category);});
      buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.workshopFilter===category)));
      if (summary) summary.textContent=labels[category]+' · '+cards.filter(card=>!card.hidden).length+' tasarım';
    }
    buttons.forEach(button => {
      const category=button.dataset.workshopFilter;
      if (!Object.hasOwn(labels,category)) return;
      const count=button.querySelector('[data-workshop-count]');
      if (count) count.textContent=String(cards.filter(card=>belongs(card,category)).length);
      button.disabled=false;
      button.addEventListener('click',()=>select(category));
    });
    revealCard = id => {
      const card=cards.find(card=>card.getAttribute('aria-controls')===id);
      if (card?.hidden) select('all');
    };
    select('all');
  }

  const random = dialog.querySelector('.workshop-random');
  const notice = dialog.querySelector('.workshop-random-status');
  const confirmation = document.querySelector('#starter-confirm');
  if (!random || !confirmation) return;
  const catalog = [
    {id:'bolt-key', tool:'sketch', name:'Şimşek anahtarlık', shape:'bolt', color:'Yeşil', keychain:true},
    {id:'triangle-key', tool:'sketch', name:'Geometrik üçgen anahtarlık', shape:'triangle', color:'Mavi', keychain:true},
    {id:'circle-key', tool:'sketch', name:'Minimal daire anahtarlık', shape:'circle', color:'Beyaz', keychain:true},
    {id:'star-plate', tool:'sketch', name:'Yıldızlı plaka', shape:'star', color:'Mavi'},
    {id:'heart-plate', tool:'sketch', name:'Kalp oymalı plaka', shape:'heart', color:'Yeşil', finish:'engrave'},
    {id:'rectangle-plate', tool:'sketch', name:'Geometrik oyma plaka', shape:'rectangle', color:'Beyaz', finish:'engrave'},
    {id:'heart-pair', tool:'puzzle', name:'İki parça, bir kalp', shape:'heart', colorA:'Yeşil', colorB:'Beyaz'},
    {id:'puzzle-pair', tool:'puzzle', name:'Birbirini tamamlayan puzzle seti', shape:'puzzle', colorA:'Mavi', colorB:'Beyaz'}
  ];
  const tools = {
    sketch: document.querySelector('#sketch-studio'),
    puzzle: document.querySelector('#puzzle-studio')
  };
  const generated = new Map();
  let bag = [], last = '', pending = null, switching = false;
  const api = name => window.KatmanyaStarters?.[name];
  const available = () => catalog.filter(item => tools[item.tool] && api(item.tool));
  function next(){
    if (!bag.length) {
      bag = available();
      for (let i=bag.length-1;i>0;i--) {
        const j=Math.floor(Math.random()*(i+1));
        [bag[i],bag[j]]=[bag[j],bag[i]];
      }
      if (bag.length>1 && bag[bag.length-1].id===last) [bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
    }
    const item=bag.pop();
    if (item) last=item.id;
    return item;
  }
  function launch(item){
    const controller=api(item.tool), tool=tools[item.tool];
    if (tool) revealCard(tool.id);
    if (!controller || !controller.apply(item)) {
      notice.hidden=false;notice.textContent='Bu tasarım açılamadı. Başka bir seçenek deneyebilirsin.';return;
    }
    generated.set(item.tool,controller.signature());
    const strip=tool.querySelector('.starter-strip');
    strip.hidden=false;strip.querySelector('.starter-name').textContent=item.name;
    strip.querySelector('.starter-reroll').disabled=false;
  }
  function pick(){
    switching=false;
    const item=next();
    if (!item) {notice.hidden=false;notice.textContent='Hazır tasarımlar bu tarayıcıda açılamıyor. Atölye kartlarından bir araç seçebilirsin.';return;}
    notice.hidden=true;
    const controller=api(item.tool);
    if (controller.hasDraft() && generated.get(item.tool)!==controller.signature()) {
      pending=item;confirmation.returnValue='';
      confirmation.querySelector('.starter-pending-name').textContent='Sana çıkan: '+item.name;
      confirmation.showModal();confirmation.querySelector('.starter-confirm-close').focus({preventScroll:true});
    } else launch(item);
  }
  random.disabled=!available().length;
  random.addEventListener('click',pick);
  for (const [name,tool] of Object.entries(tools)) {
    const reroll=tool?.querySelector('.starter-reroll');
    if (!reroll) continue;
    reroll.addEventListener('click',()=>{
      if (switching) return;
      switching=true;reroll.disabled=true;
      // Existing tool close handlers restore the workshop before the next tool opens.
      tool.addEventListener('close',()=>pick(),{once:true});tool.close();
    });
    const card=dialog.querySelector('[aria-controls="'+tool.id+'"]');
    card?.addEventListener('click',()=>{tool.querySelector('.starter-strip').hidden=true;});
  }
  confirmation.querySelector('.starter-confirm-close').addEventListener('click',()=>confirmation.close('cancel'));
  confirmation.querySelector('.starter-confirm-apply').addEventListener('click',()=>confirmation.close('apply'));
  confirmation.querySelector('.starter-confirm-shuffle').addEventListener('click',()=>confirmation.close('shuffle'));
  confirmation.addEventListener('close',()=>{
    const item=pending;pending=null;
    if (confirmation.returnValue==='apply' && item) launch(item);
    else if (confirmation.returnValue==='shuffle') pick();
    else random.focus({preventScroll:true});
  });
})();
