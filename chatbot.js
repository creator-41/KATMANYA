(() => {
  const shell=document.querySelector('#quote-chat');
  if(!shell)return;
  const toggle=shell.querySelector('.quote-chat-toggle');
  const panel=shell.querySelector('.quote-chat-panel');
  const close=shell.querySelector('.quote-chat-close');
  const log=shell.querySelector('.quote-chat-log');
  const controls=shell.querySelector('.quote-chat-controls');
  const status=shell.querySelector('.quote-chat-status');
  const badge=shell.querySelector('.quote-chat-badge');
  function syncChatViewport(){
    const viewport=window.visualViewport;
    if(!viewport)return;
    const editing=!panel.hidden&&panel.contains(document.activeElement);
    const keyboardOpen=editing&&window.innerHeight-viewport.height>120;
    const keyboardOffset=keyboardOpen?Math.max(0,window.innerHeight-viewport.height-viewport.offsetTop):0;
    shell.style.setProperty('--chat-keyboard-offset',keyboardOffset+'px');
    shell.style.setProperty('--chat-visible-height',viewport.height+'px');
  }
  window.visualViewport?.addEventListener('resize',syncChatViewport);
  window.visualViewport?.addEventListener('scroll',syncChatViewport);
  window.addEventListener('resize',syncChatViewport);
  shell.addEventListener('focusin',()=>requestAnimationFrame(syncChatViewport));
  shell.addEventListener('focusout',()=>window.setTimeout(syncChatViewport,250));
  const phone='905304815341';
  let product=null,questions=[],answers={},step=0,notified=false,soundPlayed=false,audioContext=null;
  const products=[
    {id:'desk',label:'Masaüstü seti'},
    {id:'plate',label:'İsimli plakalık'},
    {id:'bulk',label:'Toptan üretim'},
    {id:'custom',label:'İhtiyacıma özel parça'}
  ];
  const colors=['Siyah','Beyaz','Mavi','Yeşil','Diğer renk','Henüz karar vermedim'];
  function scrollLogToBottom(){const move=()=>{log.scrollTop=log.scrollHeight;};requestAnimationFrame(()=>{move();requestAnimationFrame(move);});window.setTimeout(move,100);}
  function bubble(text,kind){const el=document.createElement('div');el.className='chat-bubble '+kind;el.textContent=text;log.append(el);scrollLogToBottom();return el;}
  function button(label,handler,kind){const b=document.createElement('button');b.type='button';b.className='chat-choice'+(kind?' '+kind:'');b.textContent=label;b.addEventListener('click',handler);return b;}
  function showChoices(items){controls.replaceChildren();items.forEach(item=>controls.append(button(item.label,item.action)));scrollLogToBottom();}
  function intro(){
    product=null;questions=[];answers={};step=0;log.replaceChildren();controls.replaceChildren();
    bubble('Selam! Sana doğru teklifi hazırlayabilmem için ne aradığını seç.','bot');
    showChoices(products.map(item=>({label:item.label,action:()=>selectProduct(item)})).concat([{label:'Fiyat nasıl belirleniyor?',action:()=>{bubble('Fiyat; ürünün ölçüsüne, tasarımına, malzemesine ve baskı süresine göre netleşiyor. İstersen ürününü seçip teklif bilgilerini hazırlayalım.','bot');showChoices([{label:'Teklif oluşturmaya başla',action:intro}]);}}]));
  }
  function selectProduct(item){product=item;bubble(item.label,'user');
    if(item.id==='desk')questions=[{key:'color',label:'Hangi rengi tercih edersin?',type:'choice',options:colors},{key:'quantity',label:'Kaç adet düşünüyorsun?',type:'number'}];
    if(item.id==='plate')questions=[{key:'name',label:'Plakada hangi isim yazsın?',type:'text',placeholder:'İsmi yaz'},{key:'color',label:'Hangi rengi tercih edersin?',type:'choice',options:colors},{key:'quantity',label:'Kaç adet düşünüyorsun?',type:'number'}];
    if(item.id==='custom')questions=[{key:'purpose',label:'Parça ne işe yarayacak? Kısaca anlat.',type:'text',placeholder:'Kullanım amacı veya ürün fikri'},{key:'size',label:'Yaklaşık ölçülerini biliyor musun?',type:'text',placeholder:'Örn. 10 x 5 x 2 cm veya bilmiyorum'},{key:'color',label:'Hangi rengi tercih edersin?',type:'choice',options:colors},{key:'quantity',label:'Kaç adet düşünüyorsun?',type:'number'}];
    if(item.id==='bulk')questions=[{key:'item',label:'Hangi üründen üretim düşünüyorsun?',type:'text',placeholder:'Ürün veya fikir'},{key:'quantity',label:'Yaklaşık kaç adet?',type:'number'}];
    askNext();
  }
  function askNext(){
    controls.replaceChildren();
    if(step>=questions.length){finish();return;}
    const q=questions[step];bubble(q.label,'bot');
    if(q.type==='choice'){showChoices(q.options.map(value=>({label:value,action:()=>answer(value)})));return;}
    const form=document.createElement('form');form.className='chat-answer-form';
    const input=document.createElement('input');input.type=q.type==='number'?'number':'text';input.name='answer';input.required=true;input.autocomplete='off';input.maxLength=100;input.placeholder=q.placeholder||'';input.setAttribute('aria-label',q.label);
    if(q.type==='number'){input.min='1';input.max='9999';input.inputMode='numeric';}
    const submit=document.createElement('button');submit.type='submit';submit.className='chat-send';submit.textContent='Devam';
    form.append(input,submit);form.addEventListener('submit',event=>{event.preventDefault();const value=input.value.trim();if(!value)return;if(q.type==='number'&&(+value<1||+value>9999)){status.textContent='Adedi 1 ile 9999 arasında gir.';return;}status.textContent='';answer(value);});
    controls.append(form);input.focus({preventScroll:true});scrollLogToBottom();
  }
  function answer(value){const q=questions[step];answers[q.key]=value;bubble(value,'user');step++;askNext();}
  function finish(){
    controls.replaceChildren();
    const lines=['Merhaba SARP, teklif almak istiyorum.','Ürün: '+product.label];
    if(answers.name)lines.push('Plakada yazacak isim: '+answers.name);
    if(answers.purpose)lines.push('Kullanım amacı / fikir: '+answers.purpose);
    if(answers.size)lines.push('Yaklaşık ölçü: '+answers.size);
    if(answers.item)lines.push('Üretilecek ürün: '+answers.item);
    if(answers.color)lines.push('Renk tercihi: '+answers.color);
    if(answers.quantity)lines.push('Adet: '+answers.quantity);
    if(product.id==='custom')lines.push('Çizim/fotoğraf/3B dosyamı WhatsApp sohbetine ayrıca ekleyeceğim.');
    const message=lines.join('\n');
    bubble(product.id==='custom'
      ?'Bilgiler tamam! Numaramıza WhatsApp sohbeti açılacak; çizim, fotoğraf veya 3B dosyanı sohbet içinde ayrıca ekleyebilirsin.'
      :'Tamamdır! Bilgileri WhatsApp mesajına ekledim. Göndermeden önce kontrol edebilirsin.'
    ,'bot');
    const a=document.createElement('a');
    a.className='chat-whatsapp';
    a.href='https://wa.me/'+phone+'?text='+encodeURIComponent(message);
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.textContent='WhatsApp’ta sohbet başlat';
    controls.append(a);
    const restart=button('Baştan başla',intro,'chat-restart');
    controls.append(restart);
    scrollLogToBottom();
  }
  function clearNotification(){notified=false;shell.classList.remove('has-notification');badge.hidden=true;toggle.setAttribute('aria-label','Teklif asistanını aç');}
  function soundNow(){
    try{
      if(!audioContext||audioContext.state!=='running'||soundPlayed)return false;
      const start=audioContext.currentTime+.03;
      [[880,start],[1320,start+.16]].forEach(([frequency,time])=>{
        const oscillator=audioContext.createOscillator();
        const gain=audioContext.createGain();
        oscillator.type='triangle';oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(.0001,time);
        gain.gain.exponentialRampToValueAtTime(.28,time+.018);
        gain.gain.exponentialRampToValueAtTime(.0001,time+.15);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(time);oscillator.stop(time+.16);
      });
      soundPlayed=true;
      return true;
    }catch{}
    return false;
  }
  function playNotification(){
    if(soundPlayed)return;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext)return;
    try{audioContext=audioContext||new AudioContext();}catch{return;}
    const play=()=>{if(notified&&!soundPlayed&&audioContext?.state==='running')soundNow();};
    if(audioContext.state==='running'){play();return;}
    audioContext.resume().then(play).catch(()=>{});
  }
  function notify(){
    if(!panel.hidden)return;
    if(!log.childElementCount)intro();
    notified=true;shell.classList.add('has-notification');badge.hidden=false;
    toggle.setAttribute('aria-label','Teklif asistanından yeni mesaj');
    playNotification();
    if('vibrate'in navigator)navigator.vibrate(80);
  }
  function primeSound(){
    if(!audioContext){const AudioContext=window.AudioContext||window.webkitAudioContext;if(AudioContext){try{audioContext=new AudioContext();}catch{}}}
    if(audioContext?.state!=='running')audioContext?.resume().then(()=>{if(notified&&!soundPlayed)soundNow();}).catch(()=>{});
    else if(notified&&!soundPlayed)soundNow();
  }
  function setOpen(open){panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));if(open){clearNotification();if(!log.childElementCount)intro();close.focus();}else toggle.focus();}
  toggle.addEventListener('click',()=>setOpen(panel.hidden));close.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false);});
  document.addEventListener('pointerdown',primeSound,{once:true,capture:true});
  document.addEventListener('keydown',primeSound,{once:true});
  setOpen(false);
  window.setTimeout(notify,15000);
})();
