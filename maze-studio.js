(() => {
  'use strict';
  const dialog=document.querySelector('.maze-dialog'),trigger=document.querySelector('.maze-trigger'),core=window.KatmanyaMaze;
  if(!dialog||!trigger||!core||typeof dialog.showModal!=='function')return;
  const q=s=>dialog.querySelector(s),qa=s=>dialog.querySelectorAll(s),canvas=q('.maze-preview'),ctx=canvas.getContext('2d');if(!ctx)return;
  const initials=q('.maze-initials'),status=q('.maze-status'),play=q('.maze-play'),download=q('.maze-download'),quote=q('.maze-quote'),hintButton=q('.maze-hint'),guide=q('.maze-guide');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),labels={up:'Yukarı',right:'Sağa',down:'Aşağı',left:'Sola'},levelNames={easy:'Kolay',medium:'Dengeli',hard:'Zor'},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let shape='circle',level='easy',color='Yeşil',seed=0,model=null,phase='preview',ball=0,moves=0,hint=false,usedHint=false,animation=null,progress=1,yaw=-.13,pitch=1.27,frame=0,revision=0,exporting=false,saved=null,drag=null,size={w:800,h:650,dpr:1};
  function randomSeed(){const values=new Uint32Array(1);window.crypto.getRandomValues(values);return values[0]||1;}
  function text(){return initials.value.trim().normalize('NFC').slice(0,3).toLocaleUpperCase('tr-TR');}
  function textMask(){const c=document.createElement('canvas');c.width=core.COLS;c.height=core.ROWS;const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#fff';g.font='700 14px Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text(),core.COLS*.5,core.ROWS*.9,36);const data=g.getImageData(0,0,c.width,c.height).data;return Uint8Array.from({length:c.width*c.height},(_,i)=>data[i*4+3]>90?1:0);}
  function rebuild(newLayout=false){if(newLayout||!seed)seed=randomSeed();animation=null;progress=1;phase='preview';moves=0;hint=false;usedHint=false;revision++;model=core.build({shape,level,color,seed,text:textMask()});ball=model.start;status.textContent='Labirentin hazır · Dene';actions();requestPaint();}
  function actions(){
    const busy=phase==='print',moving=animation?.type==='move';dialog.dataset.mazePhase=phase;q('.maze-build').disabled=busy;play.disabled=busy;play.textContent=phase==='play'?'YENİDEN DENE 🎯':phase==='won'?'TEKRAR DENE 🎯':'DENE 🎯';
    q('.maze-reset').disabled=busy||phase==='preview';download.disabled=busy||exporting;hintButton.disabled=busy;hintButton.setAttribute('aria-pressed',String(hint));hintButton.textContent=hint?'İPUCUNU GİZLE':'İPUCU';
    qa('[data-maze-shape]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mazeShape===shape)));qa('[data-maze-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mazeLevel===level)));qa('[data-maze-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mazeColor===color)));
    qa('[data-maze-move]').forEach(b=>b.disabled=phase!=='play'||moving||core.step(model,ball,b.dataset.mazeMove)===ball);
    q('.maze-moves').textContent=moves+' hamle';q('.maze-code').textContent='TASARIM · '+seed.toString(36).toUpperCase();
    const route=core.path(model,ball),next=route[1],direction=next===undefined?null:core.dirs.find(d=>core.step(model,ball,d.key)===next);
    if(phase==='won')guide.textContent='Hedefe ulaştın! '+moves+' hamle'+(usedHint?' · İpucuyla':' · İpucusuz');
    else if(phase==='play')guide.textContent=hint&&direction?'Sıradaki adım: '+labels[direction.key]:'Topu yıldızlı hedefe götür. Açık yön tuşlarını kullan.';
    else guide.textContent='S: başlangıç · ★: hedef. Dene’ye bas, yön tuşlarıyla ilerle.';
    const open=core.dirs.filter(d=>core.step(model,ball,d.key)!==ball).map(d=>labels[d.key]).join(', ');canvas.setAttribute('aria-label','3B labirent anahtarlık. Top '+(Math.floor(ball/model.n)+1)+'. satır, '+(ball%model.n+1)+'. sütunda. Açık yönler: '+open+'.');
    quote.setAttribute('aria-disabled',String(busy));quote.setAttribute('tabindex',busy?'-1':'0');
    if(!busy){const message=['Merhaba KATMANYA, labirent anahtarlık için fiyat almak istiyorum.','Şekil: '+(shape==='circle'?'Yuvarlak':'Kare'),'Renk: '+color,'Zorluk: '+levelNames[level],...(text()?['Baş harfler: '+text()]:[]),'Tasarım kodu: '+seed.toString(36).toUpperCase(),'PNG taslağını sohbete ekleyeceğim.','Adet, ölçü, top ve kapak detaylarını birlikte netleştirelim.'].join('\n');quote.href='https://wa.me/905304815341?text='+encodeURIComponent(message);}else quote.removeAttribute('href');
  }
  function view(tab){dialog.dataset.mazeTab=tab;qa('[data-maze-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mazeTab===tab)));measure();}
  function measure(){const r=canvas.getBoundingClientRect();if(r.width>0&&r.height>0){const dpr=Math.min(window.devicePixelRatio||1,2);size={w:r.width,h:r.height,dpr};canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}requestPaint();}
  function startGame(){if(phase==='print')return;animation=null;progress=1;phase='play';ball=model.start;moves=0;usedHint=hint;status.textContent='Oyun başladı · top sende';yaw=-.13;pitch=1.27;view('preview');actions();canvas.focus({preventScroll:true});requestPaint();}
  function move(key){if(phase!=='play'||animation)return;const next=core.step(model,ball,key);if(next===ball){status.textContent='Bu yönde duvar var · açık bir yön seç';return;}animation={type:'move',start:performance.now(),to:next};status.textContent='Top ilerliyor…';actions();requestPaint();}
  function print(){animation={type:'print',start:performance.now()};phase='print';progress=0;ball=model.start;moves=0;hint=false;usedHint=false;status.textContent='Katmanlar yükseliyor…';view('preview');actions();requestPaint();}
  function paint(time){
    frame=0;if(!dialog.open||document.hidden)return;let to=null,mix=0;
    if(animation){const type=animation.type,t=motion.matches?1:clamp((time-animation.start)/(type==='print'?2600:160),0,1);
      if(type==='print')progress=t;else{to=animation.to;mix=t*t*(3-2*t);}
      if(t===1){if(type==='print'){phase='preview';status.textContent='Baskı tamamlandı · şimdi Dene 🎯';}else{ball=animation.to;moves++;if(ball===model.goal){phase='won';status.textContent='Hedefe ulaştın! 🎉';}else status.textContent=moves+' hamle · devam et';}animation=null;to=null;mix=0;actions();}
    }
    ctx.setTransform(size.dpr,0,0,size.dpr,0,0);core.render(ctx,size.w,size.h,model,{yaw,pitch,progress,ball,ballTo:to,mix,hint});if(animation)requestPaint();
  }
  function requestPaint(){if(!frame&&dialog.open&&!document.hidden)frame=requestAnimationFrame(paint);}
  async function exportPNG(){
    if(phase==='print'||exporting)return;const current=revision,snapshot=model,initial=text();exporting=true;actions();
    try{const c=document.createElement('canvas');c.width=1400;c.height=1400;const g=c.getContext('2d');g.fillStyle='#111a14';g.fillRect(0,0,c.width,c.height);g.fillStyle='#c7fa5f';g.font='700 40px Arial, sans-serif';g.fillText('KATMANYA',60,78);g.fillStyle='#f3f1ec';g.font='600 28px Arial, sans-serif';g.fillText('Labirentin cebinde.',60,124);g.save();g.translate(0,130);core.render(g,1400,1040,snapshot,{ball:snapshot.start,clear:false});g.restore();g.fillStyle='#f3f1ec';g.font='600 24px Arial, sans-serif';g.fillText((snapshot.shape==='circle'?'Yuvarlak':'Kare')+' · '+levelNames[snapshot.level]+' · '+snapshot.color+(initial?' · '+initial:''),60,1190);g.fillStyle='#a9b69e';g.font='18px Arial, sans-serif';g.fillText('Tasarım: '+snapshot.seed.toString(36).toUpperCase()+' · Top, kapak ve ölçü detayları teklif sırasında netleşir.',60,1240);g.fillStyle='#c7fa5f';g.font='700 23px Arial, sans-serif';g.fillText('katmanya.com  /  @katmanya_3d',60,1340);
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('png');if(current!==revision||!dialog.open)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='katmanya-labirent-'+snapshot.seed.toString(36)+'.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Labirent taslağın indirildi ✓';
    }catch{if(current===revision)status.textContent='İndirme tamamlanamadı. Tekrar deneyebilirsin.';}finally{exporting=false;actions();}
  }
  function open(){if(dialog.open)return;saved={y:window.scrollY,style:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};document.body.style.position='fixed';document.body.style.top=-saved.y+'px';document.body.style.width='100%';dialog.showModal();if(!model)rebuild();view('preview');actions();q('.maze-close').focus({preventScroll:true});}
  function close(){revision++;if(frame)cancelAnimationFrame(frame);frame=0;if(phase==='print'){phase='preview';progress=1;}animation=null;drag=null;if(saved){Object.assign(document.body.style,saved.style);window.scrollTo({top:saved.y,left:0,behavior:'instant'});saved=null;}actions();trigger.focus({preventScroll:true});}
  trigger.disabled=false;trigger.addEventListener('click',open);q('.maze-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',close);
  initials.addEventListener('input',()=>rebuild());qa('[data-maze-shape]').forEach(b=>b.addEventListener('click',()=>{shape=b.dataset.mazeShape;rebuild(true);}));qa('[data-maze-level]').forEach(b=>b.addEventListener('click',()=>{level=b.dataset.mazeLevel;rebuild(true);}));qa('[data-maze-color]').forEach(b=>b.addEventListener('click',()=>{color=b.dataset.mazeColor;rebuild();}));
  qa('[data-maze-tab]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.mazeTab)));qa('[data-maze-move]').forEach(b=>b.addEventListener('click',()=>move(b.dataset.mazeMove)));
  q('.maze-shuffle').addEventListener('click',()=>rebuild(true));q('.maze-build').addEventListener('click',print);play.addEventListener('click',startGame);q('.maze-reset').addEventListener('click',startGame);hintButton.addEventListener('click',()=>{hint=!hint;if(hint&&phase==='play')usedHint=true;actions();requestPaint();});download.addEventListener('click',exportPNG);
  dialog.addEventListener('keydown',e=>{const key={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'}[e.key];if(!key||phase!=='play'||['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;e.preventDefault();move(key);});
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||drag||phase==='play'||phase==='print')return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;yaw=clamp(yaw+(e.clientX-drag.x)*.006,-.6,.6);pitch=clamp(pitch+(e.clientY-drag.y)*.005,1.05,1.52);drag.x=e.clientX;drag.y=e.clientY;requestPaint();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,e=>{if(drag?.id!==e.pointerId)return;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}));
  window.addEventListener('resize',()=>{if(dialog.open)measure();});window.visualViewport?.addEventListener('resize',()=>{if(dialog.open)measure();});if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(dialog.open)measure();}).observe(q('.maze-model'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else requestPaint();});
})();
