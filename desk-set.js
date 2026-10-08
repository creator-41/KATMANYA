(() => {
  'use strict';
  const slide=document.querySelector('[data-desk-set]');
  const dialog=document.querySelector('.desk-dialog');
  if(!slide||!dialog)return;
  const trigger=slide.querySelector('.desk-configure');
  const quote=slide.querySelector('.product-cta');
  const color=slide.querySelector('.quote-color');
  const quantity=slide.querySelector('.quote-quantity');
  const modalColor=dialog.querySelector('.desk-color');
  const modalQuantity=dialog.querySelector('.desk-quantity');
  const modalQuote=dialog.querySelector('.desk-whatsapp');
  const count=dialog.querySelector('.desk-count');
  const chosen=dialog.querySelector('.desk-chosen');
  const summary=slide.querySelector('.desk-selection-summary');
  const partButtons=[...dialog.querySelectorAll('.desk-part-button')];
  const pieces=[
    {id:'phone',name:'Telefon standı',path:'M43 48 L127 48 L134 106 L139 162 L147 194 L160 209 L212 219 L221 247 L153 275 L36 235 L37 200 L63 194 L50 87 Z'},
    {id:'headphones',name:'Kulaklık askısı',path:'M131 90 L140 43 L170 9 L189 0 L241 0 L252 10 L255 38 L263 76 L254 105 L241 114 L237 160 L221 178 L208 181 L212 204 L178 209 L178 182 L156 178 L142 162 L133 124 Z'},
    {id:'controller',name:'Oyun kolu standı',path:'M261 83 L337 83 L357 109 L379 155 L379 189 L359 198 L342 190 L336 174 L320 162 L311 176 L313 218 L284 220 L281 189 L268 198 L247 196 L237 181 L242 132 L246 100 Z'}
  ];
  const selected=new Set(pieces.map(piece=>piece.id));
  let savedScroll=0,savedBodyStyle=null;

  // Clip the existing photograph; keep every product in its original position.
  function makeModel(prefix,interactive){
    const defs=pieces.map(piece=>`<clipPath id="${prefix}-${piece.id}"><path d="${piece.path}"/></clipPath>`).join('');
    const layers=pieces.map(piece=>`<g class="desk-piece is-selected" data-piece="${piece.id}"><g clip-path="url(#${prefix}-${piece.id})"><image href="assets/desk-set.webp" width="420" height="283"/></g></g>`).join('');
    const hits=interactive?pieces.map(piece=>`<path class="desk-hit" data-desk-part="${piece.id}" d="${piece.path}"><title>${piece.name}</title></path>`).join(''):'';
    return `<svg viewBox="0 0 420 283" aria-hidden="true" focusable="false"><defs>${defs}</defs><image class="desk-model-base" href="assets/desk-set.webp" width="420" height="283"/>${layers}${hits}</svg>`;
  }
  const model=dialog.querySelector('.desk-model');
  model.innerHTML=makeModel('desk-large',true);
  const smallModel=document.createElement('span');
  smallModel.className='desk-mini-model';
  smallModel.setAttribute('aria-hidden','true');
  smallModel.innerHTML=makeModel('desk-small',false);
  trigger.querySelector('img').hidden=true;
  trigger.prepend(smallModel);

  function getAmount(){
    const value=Number.parseInt(quantity.value,10);
    return Number.isFinite(value)?Math.min(999,Math.max(1,value)):1;
  }
  function updateQuote(){
    const parts=pieces.filter(piece=>selected.has(piece.id));
    const amount=getAmount();
    const message=`Merhaba KATMANYA, modüler masaüstü seti için fiyat almak istiyorum.\nSeçilen parçalar: ${parts.map(piece=>piece.name).join(' + ')}\nRenk tercihi: ${color.value||'Henüz karar vermedim'}\nSet adedi: ${amount}`;
    const href='https://wa.me/905304815341?text='+encodeURIComponent(message);
    [quote,modalQuote].forEach(link=>{
      if(parts.length)link.href=href;
      else link.removeAttribute('href');
      link.setAttribute('aria-disabled',String(!parts.length));
    });
    slide.dataset.deskSetParts=parts.map(piece=>piece.name).join('|');
    modalColor.value=color.value;
    if(document.activeElement!==modalQuantity)modalQuantity.value=quantity.value;
  }
  function renderSelection(){
    const parts=pieces.filter(piece=>selected.has(piece.id));
    partButtons.forEach(button=>button.setAttribute('aria-pressed',String(selected.has(button.dataset.deskPart))));
    [dialog,trigger].forEach(root=>root.querySelectorAll('.desk-piece').forEach(layer=>layer.classList.toggle('is-selected',selected.has(layer.dataset.piece))));
    count.replaceChildren();
    if(parts.length){
      const number=document.createElement('strong');
      number.textContent=String(parts.length);
      count.append(number,' parça seçili');
    }else count.textContent='En az bir parça seç.';
    chosen.replaceChildren(...parts.map(piece=>{
      const item=document.createElement('li');item.textContent=piece.name;return item;
    }));
    summary.textContent=parts.length?`${parts.length} PARÇA SEÇİLİ`:'PARÇALARINI SEÇ';
    updateQuote();
  }
  function togglePiece(id){
    if(!pieces.some(piece=>piece.id===id))return;
    if(selected.has(id))selected.delete(id);else selected.add(id);
    renderSelection();
  }
  function openBuilder(){
    if(dialog.open)return;
    savedScroll=window.scrollY;
    savedBodyStyle={position:document.body.style.position,top:document.body.style.top,width:document.body.style.width};
    document.body.style.position='fixed';document.body.style.top=-savedScroll+'px';document.body.style.width='100%';
    quantity.value=String(getAmount());modalQuantity.value=quantity.value;
    updateQuote();
    dialog.showModal();
    dialog.querySelector('.desk-close').focus({preventScroll:true});
  }
  function finishBuilder(){
    if(!savedBodyStyle)return;
    Object.assign(document.body.style,savedBodyStyle);savedBodyStyle=null;
    window.scrollTo({top:savedScroll,left:0,behavior:'instant'});
    requestAnimationFrame(()=>trigger.focus({preventScroll:true}));
  }
  function quoteClick(event){
    quantity.value=String(getAmount());modalQuantity.value=quantity.value;
    updateQuote();
    if(!selected.size){
      event.preventDefault();openBuilder();
      partButtons[0].focus({preventScroll:true});
    }
  }
  function syncQuantity(source,target,commit){
    target.value=source.value;
    if(source.value!==''||commit){
      quantity.value=String(getAmount());source.value=quantity.value;target.value=quantity.value;
    }
    updateQuote();
  }
  partButtons.forEach(button=>button.addEventListener('click',()=>togglePiece(button.dataset.deskPart)));
  model.querySelectorAll('.desk-hit').forEach(hit=>hit.addEventListener('click',()=>togglePiece(hit.dataset.deskPart)));
  color.addEventListener('change',updateQuote);
  modalColor.addEventListener('change',()=>{color.value=modalColor.value;updateQuote();});
  quantity.addEventListener('input',()=>syncQuantity(quantity,modalQuantity,false));
  quantity.addEventListener('change',()=>syncQuantity(quantity,modalQuantity,true));
  modalQuantity.addEventListener('input',()=>syncQuantity(modalQuantity,quantity,false));
  modalQuantity.addEventListener('change',()=>syncQuantity(modalQuantity,quantity,true));
  [quote,modalQuote].forEach(link=>link.addEventListener('click',quoteClick));
  trigger.addEventListener('click',openBuilder);
  dialog.querySelector('.desk-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('.desk-done').addEventListener('click',()=>{quantity.value=String(getAmount());modalQuantity.value=quantity.value;dialog.close();});
  dialog.addEventListener('close',finishBuilder);
  renderSelection();
  if(typeof dialog.showModal==='function')trigger.disabled=false;
})();
