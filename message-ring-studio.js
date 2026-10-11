(() => {
  'use strict';
  const dialog=document.querySelector('#message-ring-studio'),trigger=document.querySelector('.ring-trigger'),core=window.KatmanyaMessageRing;
  if(!dialog||!trigger||!core||typeof dialog.showModal!=='function')return;
  const q=s=>dialog.querySelector(s),qa=s=>dialog.querySelectorAll(s),canvas=q('.ring-preview'),ctx=canvas.getContext('2d');if(!ctx)return;
  const fields=Array.from(qa('.ring-message')),status=q('.ring-status'),quote=q('.ring-quote'),download=q('.ring-download'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let count=4,diameter=60,body='Siyah',wheel='Yeşil',model=null,angle=0,animation=null,drag=null,frame=0,saved=null,revision=0,exporting=false,size={w:600,h:480,dpr:1};
  const messages=()=>fields.map(f=>f.value.normalize('NFC').trim().slice(0,18));
  const ready=()=>!!model&&model.messages.every(Boolean);
  function actions(announce=false){
    const chosen=core.selected(angle,count),valid=ready(),busy=!!animation||!!drag;
    qa('[data-ring-count]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.ringCount)===count)));
    qa('[data-ring-size]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.ringSize)===diameter)));
    qa('[data-ring-body]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ringBody===body)));
    qa('[data-ring-wheel]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ringWheel===wheel)));
    fields[3].closest('.ring-message-row').hidden=count===3;
    fields.forEach((f,i)=>{q('[data-ring-length="'+i+'"]').textContent=Array.from(f.value).length+' / 18';});
    qa('[data-ring-select]').forEach((b,i)=>{b.hidden=i>=count;b.setAttribute('aria-pressed',String(i===chosen));b.disabled=exporting;});
    q('.ring-current-number').textContent=String(chosen+1).padStart(2,'0')+' / '+String(count).padStart(2,'0');
    q('.ring-current-message').textContent=model?.messages[chosen]||'MESAJ '+String(chosen+1).padStart(2,'0');
    q('.ring-dimensions').textContent='Ø '+diameter+' mm · 8 mm KALINLIK · '+count+' MESAJ';
    q('.ring-settings').disabled=exporting;qa('.ring-turn').forEach(b=>b.disabled=exporting);download.disabled=!valid||busy||exporting;
    quote.setAttribute('aria-disabled',String(!valid||busy||exporting));quote.setAttribute('tabindex',valid&&!busy&&!exporting?'0':'-1');
    canvas.setAttribute('aria-label','Dönen mesaj anahtarlığı. '+count+' mesaj. Pencerede: '+(model?.messages[chosen]||'Mesaj '+(chosen+1))+'. Halkayı çevirmek için sürükle; ok tuşlarıyla mesaj değiştir.');
    if(valid&&!busy&&!exporting){quote.href='https://wa.me/905304815341?text='+encodeURIComponent(['Merhaba KATMANYA, dönen mesaj anahtarlığı için fiyat almak istiyorum.','Çap: '+diameter+' mm · Kalınlık: 8 mm','Gövde: '+body+' · Dönen halka: '+wheel,...model.messages.map((m,i)=>(i+1)+'. mesaj: '+m),'PNG taslağımı sohbete ekleyeceğim.','Adet, hareketli parça uyumu ve malzemeyi birlikte netleştirelim.'].join('\n'));}else quote.removeAttribute('href');
    q('.ring-export-help').textContent=valid?'Taslak bütün mesajlarını içerir.':'İndirmek ve fiyat istemek için '+count+' mesajın tamamını yaz.';
    if(announce)status.textContent='Mesaj '+(chosen+1)+' / '+count+' · '+(model?.messages[chosen]||'Kendi mesajını yaz');
  }
  function rebuild(){revision++;animation=null;endCapture();model=core.build({count,diameter,body,wheel,messages:messages()});angle=core.snap(angle,count);actions(true);paintSoon();}
  function view(tab){dialog.dataset.ringTab=tab;qa('[data-ring-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ringTab===tab)));measure();}
  function measure(){const r=canvas.getBoundingClientRect();if(r.width>0&&r.height>0){size={w:r.width,h:r.height,dpr:Math.min(window.devicePixelRatio||1,2)};canvas.width=Math.round(r.width*size.dpr);canvas.height=Math.round(r.height*size.dpr);}paintSoon();}
  function paintSoon(){if(!frame&&dialog.open&&!document.hidden)frame=requestAnimationFrame(paint);}
  function paint(time){frame=0;if(!dialog.open||document.hidden)return;if(animation){const a=animation,t=reduce.matches?1:Math.max(0,Math.min(1,(time-a.start)/320));angle=a.from+(a.to-a.from)*(1-Math.pow(1-t,3));if(t===1){angle=a.to;animation=null;actions(true);}else actions();}
    ctx.setTransform(size.dpr,0,0,size.dpr,0,0);core.render(ctx,size.w,size.h,model,{angle});if(animation)paintSoon();}
  function animate(to){if(exporting)return;endCapture();animation={from:angle,to,start:performance.now()};view('preview');actions();paintSoon();}
  function turn(delta){animate(core.snap(animation?.to??angle,count)-delta*model.step);}
  function select(index){const base=core.snap(animation?.to??angle,count),current=core.selected(base,count),delta=((index-current+count+count/2)%count)-count/2;animate(base-delta*model.step);}
  function endCapture(){if(!drag)return;const id=drag.id;drag=null;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
  function cursor(e){const r=canvas.getBoundingClientRect();return core.local(size.w,size.h,e.clientX-r.left,e.clientY-r.top);}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||drag||exporting)return;const p=cursor(e),r=Math.hypot(p.x,p.y);if(r<7||r>40)return;animation=null;drag={id:e.pointerId,theta:Math.atan2(p.y,p.x)};canvas.setPointerCapture(e.pointerId);e.preventDefault();actions();});
  canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const p=cursor(e);if(Math.hypot(p.x,p.y)<6)return;const theta=Math.atan2(p.y,p.x),diff=Math.atan2(Math.sin(theta-drag.theta),Math.cos(theta-drag.theta));angle+=diff;drag.theta=theta;actions();paintSoon();});
  function finish(e){if(drag?.id!==e.pointerId)return;endCapture();animate(core.snap(angle,count));}
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,finish));
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key)||exporting)return;e.preventDefault();if(e.key==='Home')select(0);else turn(e.key==='ArrowRight'||e.key==='ArrowDown'?1:-1);});
  async function exportPNG(){if(!ready()||animation||drag||exporting)return;exporting=true;const current=revision,snapshot=model;actions();
    try{const c=document.createElement('canvas');c.width=1600;c.height=1400;const g=c.getContext('2d');g.fillStyle='#101711';g.fillRect(0,0,c.width,c.height);g.fillStyle='#c7fa5f';g.font='700 38px Arial, sans-serif';g.fillText('KATMANYA',60,75);g.fillStyle='#f3f1ec';g.font='600 30px Arial, sans-serif';g.fillText('Döndür, mesaj değişsin.',60,128);
      for(let i=0;i<snapshot.count;i++){const x=i%2*770+30,y=Math.floor(i/2)*505+175;g.save();g.translate(x,y);core.render(g,770,455,snapshot,{angle:-i*snapshot.step,clear:false,ghosts:false});g.restore();g.fillStyle='#c7fa5f';g.font='700 20px Arial, sans-serif';g.fillText(String(i+1).padStart(2,'0')+' / '+snapshot.messages[i],x+80,y+470);}
      g.fillStyle='#f3f1ec';g.font='22px Arial, sans-serif';g.fillText('Ø '+snapshot.diameter+' mm · 8 mm · '+snapshot.count+' mesaj · '+snapshot.body+' / '+snapshot.wheel,60,1250);g.fillStyle='#9cb18d';g.font='18px Arial, sans-serif';g.fillText('Tasarım önizlemesi · Hareketli parçaların uyumu ve malzeme teklifte netleşir.',60,1305);g.fillStyle='#c7fa5f';g.font='700 22px Arial, sans-serif';g.fillText('katmanya.com / @katmanya_3d',60,1360);
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('png');if(current!==revision||!dialog.open)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='katmanya-donen-mesajlar.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Bütün mesajlarını içeren taslak indirildi ✓';
    }catch{if(current===revision&&dialog.open)status.textContent='Taslak indirilemedi. Tekrar deneyebilirsin.';}finally{exporting=false;actions();}}
  trigger.disabled=false;trigger.addEventListener('click',()=>{if(dialog.open)return;saved={y:window.scrollY,style:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};Object.assign(document.body.style,{position:'fixed',top:-saved.y+'px',width:'100%'});dialog.showModal();if(!model)rebuild();view('preview');q('.ring-close').focus({preventScroll:true});});
  q('.ring-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{revision++;animation=null;endCapture();angle=core.snap(angle,count);if(frame)cancelAnimationFrame(frame);frame=0;if(saved){Object.assign(document.body.style,saved.style);window.scrollTo({top:saved.y,left:0,behavior:'instant'});saved=null;}actions();trigger.focus({preventScroll:true});});
  fields.forEach(f=>f.addEventListener('input',rebuild));
  for(const [selector,key,set] of [['[data-ring-count]','ringCount',v=>{count=Number(v);angle=0;}],['[data-ring-size]','ringSize',v=>diameter=Number(v)],['[data-ring-body]','ringBody',v=>body=v],['[data-ring-wheel]','ringWheel',v=>wheel=v]])qa(selector).forEach(b=>b.addEventListener('click',()=>{set(b.dataset[key]);rebuild();}));
  qa('[data-ring-tab]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.ringTab)));qa('[data-ring-select]').forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.ringSelect))));q('.ring-prev').addEventListener('click',()=>turn(-1));q('.ring-next').addEventListener('click',()=>turn(1));download.addEventListener('click',exportPNG);
  window.addEventListener('resize',()=>{if(dialog.open)measure();});window.visualViewport?.addEventListener('resize',()=>{if(dialog.open)measure();});if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(dialog.open)measure();}).observe(q('.ring-model'));document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;if(drag){endCapture();angle=core.snap(angle,count);actions(true);}}else paintSoon();});
})();
