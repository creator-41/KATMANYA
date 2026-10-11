(() => {
  'use strict';
  const keys={recipient:['self','partner','friend'],mood:['practical','playful','meaningful'],material:['text','photo','voice']};
  function recommend(a={}) {
    if(!a||typeof a!=='object')return [];
    if(Object.keys(keys).some(k=>!keys[k].includes(a[k])))return [];
    const owner={self:'Kendin için',partner:'Partnerin için',friend:'Arkadaşın için'}[a.recipient];
    const item=(target,reason,alternative=false)=>({target,reason,alternative});
    if(a.material==='photo'){
      const lamp=item('lamp-studio',owner+' seçtiğin fotoğrafı, ışık açılınca ortaya çıkan bir hatıraya dönüştürebilirsin.');
      const photo=item('photo-studio',a.mood==='practical'?'Seçtiğin fotoğrafı masa üstünde sergilenebilen dokulu bir kabartmaya dönüştür.':owner+' seçtiğin fotoğrafın çizgileri, dokunulabilen bir kabartmaya dönüşsün.');
      return a.mood==='meaningful'?[lamp,photo]:[photo,lamp];
    }
    if(a.material==='voice'){
      const voice=item('voice-studio',owner+' saklamak istediğin sesin dalga şeklini bir anahtarlığa işle.');
      const second=a.mood==='practical'?item('phone-studio','Yazılı bir alternatif: kısa bir mesajla kişiselleştirdiğin stand her gün kullanılabilir.',true):a.mood==='playful'?item('capsule-studio','Yazılı bir alternatif: sürpriz mesajını, doğru şifreyle açılan kapsülün içine sakla.',true):a.recipient==='partner'?item('puzzle-studio','Yazılı bir alternatif: birbirinizi tamamlayan iki parçaya kendi kelimelerinizi ekleyin.',true):item('message-ring-studio','Yazılı bir alternatif: kısa mesajların, halka çevrildikçe birer birer ortaya çıksın.',true);
      return [voice,second];
    }
    if(a.mood==='practical')return [item('phone-studio',owner+' günlük kullanılan bir telefon standını kısa bir yazıyla kişiselleştir.'),item('angle-studio','Masa üstünde bir plaka, iki farklı açıdan iki ayrı mesaj göstersin.')];
    if(a.mood==='playful')return [item('capsule-studio','Kısa mesajın, üç halkalı şifre çözüldüğünde ortaya çıksın.'),item('gear-studio',owner+' ortasına yazı eklenebilen, çevirdikçe üç dişlisi birlikte hareket eden bir oyuncak tasarla.')];
    if(a.recipient==='partner')return [item('puzzle-studio','Siz ve partneriniz için birbirini tamamlayan iki parçaya kendi kelimelerinizi ekleyin.'),item('angle-studio','İkinize ait iki mesajı aynı plakada, farklı açılardan gösterin.')];
    return [item('message-ring-studio',owner+' seçtiğin kısa mesajlar, halka çevrildikçe ortaya çıksın.'),item('capsule-studio','Anlamlı mesajını küçük bir bulmacayla birleştir; doğru şifre sürprizi açsın.')];
  }
  window.KatmanyaGiftFinder={recommend};
  const dialog=document.querySelector('#gift-finder'),trigger=document.querySelector('.gift-finder-trigger'),workshop=document.querySelector('#design-workshop');
  if(!dialog||!trigger||!workshop||typeof dialog.showModal!=='function')return;
  const q=s=>dialog.querySelector(s),qa=s=>Array.from(dialog.querySelectorAll(s)),steps=qa('[data-gift-step]'),choices=qa('[data-gift-choice]'),slots=qa('[data-gift-result]');
  const labels={self:'Kendime',partner:'Partnerime',friend:'Arkadaşıma',practical:'Kullanışlı',playful:'Eğlenceli',meaningful:'Anlamlı',text:'Yazı',photo:'Fotoğraf',voice:'Ses'};
  const answers={recipient:null,mood:null,material:null},order=['recipient','mood','material'];
  let step=0,saved=null,nextCard=null,results=[];
  const cardFor=target=>workshop.querySelector('.workshop-card[aria-controls="'+target+'"]');
  function render(focus=false){
    const done=step===3;choices.forEach(b=>b.setAttribute('aria-pressed',String(answers[b.dataset.giftKey]===b.dataset.giftChoice)));
    steps.forEach((el,i)=>el.hidden=done||i!==step);q('.gift-results').hidden=!done;
    q('.gift-progress').textContent=done?'3 SEÇİM TAMAM · SANA UYGUN 2 TASARIM':'ADIM '+(step+1)+' / 3';
    qa('[data-gift-marker]').forEach((el,i)=>el.dataset.state=done||i<step?'done':i===step?'current':'next');
    q('.gift-back').disabled=step===0;q('.gift-change').hidden=!done;q('.gift-reset').hidden=!done;q('.gift-error').hidden=true;
    if(done){
      results=recommend(answers);q('.gift-summary').textContent=order.map(k=>labels[answers[k]]).join(' · ');
      slots.forEach((slot,i)=>{
        const result=results[i],card=result&&cardFor(result.target);slot.hidden=!card;if(!card)return;
        const title=card.querySelector('strong').textContent;slot.querySelector('.gift-result-title').textContent=title;slot.querySelector('.gift-reason').textContent=result.reason;
        const img=slot.querySelector('img');img.src=card.querySelector('img').getAttribute('src');slot.querySelector('.gift-alternative').hidden=!result.alternative;
        const button=slot.querySelector('[data-gift-design]');button.disabled=card.disabled;button.setAttribute('aria-controls',result.target);button.setAttribute('aria-label',title+' tasarla');
        slot.querySelector('.gift-unavailable').hidden=!card.disabled;
      });
    }
    if(focus){dialog.scrollTop=0;(done?q('#gift-results-title'):steps[step].querySelector('h3')).focus({preventScroll:true});}
  }
  trigger.disabled=false;trigger.addEventListener('click',()=>{
    if(dialog.open)return;
    saved={y:window.scrollY,style:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};
    Object.assign(document.body.style,{position:'fixed',top:-saved.y+'px',width:'100%'});dialog.returnValue='';dialog.showModal();render();q('.gift-close').focus({preventScroll:true});
  });
  choices.forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.giftKey,value=button.dataset.giftChoice;
    if(key!==order[step]||!keys[key]?.includes(value))return;
    answers[key]=value;step++;render(true);
  }));
  q('.gift-back').addEventListener('click',()=>{if(step>0){step--;render(true);}});
  q('.gift-change').addEventListener('click',()=>{step=0;render(true);});
  q('.gift-reset').addEventListener('click',()=>{order.forEach(k=>answers[k]=null);step=0;results=[];render(true);});
  slots.forEach((slot,i)=>slot.querySelector('[data-gift-design]').addEventListener('click',()=>{
    const result=results[i],card=result&&cardFor(result.target);
    if(!card||card.disabled){q('.gift-error').hidden=false;q('.gift-error').textContent='Bu araç şu anda açılamıyor. Diğer öneriyi deneyebilirsin.';return;}
    nextCard=card;dialog.close('design');
  }));
  q('.gift-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    if(saved){Object.assign(document.body.style,saved.style);window.scrollTo({top:saved.y,left:0,behavior:'instant'});saved=null;}
    const card=nextCard;nextCard=null;
    if(card&&workshop.open&&!card.disabled){
      if(card.hidden)workshop.querySelector('[data-workshop-filter="all"]')?.click();
      card.click();
    }else trigger.focus({preventScroll:true});
  });
})();
