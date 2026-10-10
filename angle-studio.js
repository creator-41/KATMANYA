(() => {
  'use strict';
  const dialog=document.querySelector('.angle-dialog'),trigger=document.querySelector('.angle-trigger'),core=window.KatmanyaAngle;
  if(!dialog||!trigger||!core||typeof dialog.showModal!=='function')return;
  const q=s=>dialog.querySelector(s),qa=s=>dialog.querySelectorAll(s),canvas=q('.angle-preview'),ctx=canvas.getContext('2d');if(!ctx)return;
  const inputs=[q('.angle-name-a'),q('.angle-name-b')],status=q('.angle-status'),slider=q('.angle-view-range'),build=q('.angle-build'),download=q('.angle-download'),quote=q('.angle-quote'),badge=q('.angle-view-label');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),colors={'Yeşil':'#779b36','Mavi':'#376b9c','Beyaz':'#c9d2c0','Siyah':'#343e36'};
  let selected=['Yeşil','Mavi'],model=null,yaw=core.ANGLE,pitch=.12,progress=1,animation=null,frame=0,size={w:800,h:600,dpr:1},drag=null,saved=null,revision=0,exporting=false;
  function names(){return inputs.map(i=>i.value.trim().normalize('NFC').slice(0,18));}
  function texture(name,color,fallback){
    const c=document.createElement('canvas');c.width=1400;c.height=440;const g=c.getContext('2d');g.fillStyle=colors[color];g.fillRect(0,0,c.width,c.height);
    g.fillStyle='#ffffff10';for(let y=0;y<c.height;y+=5)g.fillRect(0,y,c.width,1);
    const text=name||fallback;g.font='800 230px Arial, sans-serif';const font=Math.min(230,230*1180/Math.max(1,g.measureText(text).width));g.font='800 '+font+'px Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle=color==='Beyaz'?'#243020':'#f6f6ec';g.fillText(text,700,225,1180);return c;
  }
  function rebuild(){stop();revision++;const n=names();model=core.build(n.map((s,i)=>texture(s,selected[i],i?'PARTNERİNİZ':'SİZ')));status.textContent=n.every(Boolean)?'İki isim · tek plaka':'İki ismi de yaz';actions();requestPaint();}
  function actions(){
    const n=names(),valid=n.every(Boolean),busy=!!animation;build.disabled=!valid;download.disabled=!valid||busy||exporting;
    quote.setAttribute('aria-disabled',String(!valid||busy));quote.setAttribute('tabindex',valid&&!busy?'0':'-1');
    qa('[data-angle-color-a]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.angleColorA===selected[0])));qa('[data-angle-color-b]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.angleColorB===selected[1])));
    if(valid&&!busy){const text=['Merhaba KATMANYA, açı değişince yazısı değişen masa plakası için fiyat almak istiyorum.','Soldan görünen isim: '+n[0]+' · Renk: '+selected[0],'Sağdan görünen isim: '+n[1]+' · Renk: '+selected[1],'İki farklı yöne bakan yüzeylerle, masa ayaklı tasarım.','İndirdiğim iki açılı PNG taslağını sohbete ekleyeceğim.','Adet, ölçü, malzeme ve okunma açısını birlikte netleştirelim.'].join('\n');quote.href='https://wa.me/905304815341?text='+encodeURIComponent(text);}else quote.removeAttribute('href');
    syncAngle();
  }
  function syncAngle(){
    slider.value=String(Math.round((core.ANGLE-yaw)/(2*core.ANGLE)*100));
    const side=yaw>.65?'left':yaw<-.65?'right':'front',n=names();badge.textContent=side==='left'?'SOLDAN · '+(n[0]||'SİZ'):side==='right'?'SAĞDAN · '+(n[1]||'PARTNERİNİZ'):'ORTADAN · İKİ YÜZ';
    qa('[data-angle-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.angleView===side)));
    canvas.setAttribute('aria-label','İki yüzlü plaka. '+badge.textContent+'. Çevirmek için sürükle veya sol ve sağ ok tuşlarını kullan.');
  }
  function view(tab){dialog.dataset.angleTab=tab;qa('[data-angle-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.angleTab===tab)));measure();}
  function measure(){const r=canvas.getBoundingClientRect();if(r.width>0&&r.height>0){const dpr=Math.min(window.devicePixelRatio||1,2);size={w:r.width,h:r.height,dpr};canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}requestPaint();}
  function stop(){animation=null;progress=1;}
  function print(){if(!names().every(Boolean))return;drag=null;pitch=.12;view('preview');animation={type:'print',start:performance.now()};yaw=.12;progress=0;status.textContent='Katmanlar yükseliyor…';actions();requestPaint();}
  function tour(){stop();pitch=.12;view('preview');animation={type:'tour',start:performance.now()};yaw=core.ANGLE;status.textContent='Çevir, diğer ismi keşfet';actions();requestPaint();}
  function paint(time){
    frame=0;if(!dialog.open||document.hidden)return;
    if(animation){let t=(time-animation.start)/(animation.type==='print'?2800:3400);if(motion.matches)t=1;t=clamp(t,0,1);
      if(animation.type==='print'){progress=t;if(t===1){animation=motion.matches?null:{type:'tour',start:time};yaw=core.ANGLE;status.textContent='Baskı tamamlandı · diğer açıya geçiyoruz';}}
      else{const eased=t*t*(3-2*t);yaw=core.ANGLE*(1-2*eased);if(t===1)animation=null;}
      if(!animation){progress=1;status.textContent='Çevirince diğer isim ortaya çıkar ✓';}syncAngle();actions();
    }
    ctx.setTransform(size.dpr,0,0,size.dpr,0,0);core.render(ctx,size.w,size.h,model,{yaw,pitch,progress});if(animation)requestPaint();
  }
  function requestPaint(){if(!frame&&dialog.open&&!document.hidden)frame=requestAnimationFrame(paint);}
  function setAngle(value){stop();yaw=clamp(value,-core.ANGLE,core.ANGLE);status.textContent='İki isim · tek plaka';actions();requestPaint();}
  async function exportPNG(){
    if(!names().every(Boolean)||animation||exporting)return;
    const version=revision,snapshot=model,n=names(),colorSnapshot=selected.slice();exporting=true;actions();
    try{const c=document.createElement('canvas');c.width=1600;c.height=1200;const g=c.getContext('2d');g.fillStyle='#111a14';g.fillRect(0,0,1600,1200);g.fillStyle='#c7fa5f';g.font='700 40px Arial, sans-serif';g.fillText('KATMANYA',64,82);g.fillStyle='#f3f1ec';g.font='600 29px Arial, sans-serif';g.fillText('Bir plaka, iki bakış.',64,130);
      for(let i=0;i<2;i++){g.save();g.translate(55+i*770,190);core.render(g,720,650,snapshot,{yaw:i?-core.ANGLE:core.ANGLE,pitch:.10,clear:false});g.restore();g.fillStyle='#c7fa5f';g.font='600 20px Arial, sans-serif';g.fillText(i?'SAĞDAN BAKINCA':'SOLDAN BAKINCA',80+i*770,888);g.fillStyle='#f3f1ec';g.font='700 32px Arial, sans-serif';g.fillText(n[i],80+i*770,945,690);g.fillStyle='#a9b69e';g.font='18px Arial, sans-serif';g.fillText('Yüzey rengi: '+colorSnapshot[i],80+i*770,990);}
      g.fillStyle='#a9b69e';g.font='18px Arial, sans-serif';g.fillText('Tasarım önizlemesi · Ölçü, malzeme ve okunma açısı teklif sırasında netleşir.',64,1100);g.fillStyle='#c7fa5f';g.font='700 23px Arial, sans-serif';g.fillText('katmanya.com  /  @katmanya_3d',64,1150);
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('png');if(version!==revision||!dialog.open)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='katmanya-iki-bakis.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='İki açılı taslağın indirildi ✓';
    }catch{if(version===revision)status.textContent='İndirme tamamlanamadı. Tekrar deneyebilirsin.';}finally{exporting=false;actions();}
  }
  function open(){if(dialog.open)return;saved={y:window.scrollY,style:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};document.body.style.position='fixed';document.body.style.top=-saved.y+'px';document.body.style.width='100%';dialog.showModal();if(!model)rebuild();view('preview');actions();q('.angle-close').focus({preventScroll:true});}
  function close(){revision++;if(frame)cancelAnimationFrame(frame);frame=0;stop();drag=null;if(saved){Object.assign(document.body.style,saved.style);window.scrollTo({top:saved.y,left:0,behavior:'instant'});saved=null;}actions();trigger.focus({preventScroll:true});}
  trigger.disabled=false;trigger.addEventListener('click',open);q('.angle-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',close);
  inputs.forEach(i=>i.addEventListener('input',rebuild));
  ['a','b'].forEach((key,i)=>qa('[data-angle-color-'+key+']').forEach(b=>b.addEventListener('click',()=>{selected[i]=b.dataset[i?'angleColorB':'angleColorA'];rebuild();})));
  qa('[data-angle-view]').forEach(b=>b.addEventListener('click',()=>setAngle(b.dataset.angleView==='left'?core.ANGLE:b.dataset.angleView==='right'?-core.ANGLE:0)));
  qa('[data-angle-tab]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.angleTab)));
  slider.addEventListener('input',()=>setAngle(core.ANGLE*(1-Number(slider.value)/50)));build.addEventListener('click',print);q('.angle-tour').addEventListener('click',tour);download.addEventListener('click',exportPNG);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;stop();actions();drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault();requestPaint();});
  canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;yaw=clamp(yaw+(e.clientX-drag.x)*.008,-core.ANGLE,core.ANGLE);pitch=clamp(pitch+(e.clientY-drag.y)*.004,0,.3);drag.x=e.clientX;drag.y=e.clientY;syncAngle();requestPaint();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,e=>{if(drag?.id!==e.pointerId)return;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}));
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){pitch=.12;setAngle(core.ANGLE);}else if(e.key==='ArrowLeft'||e.key==='ArrowRight')setAngle(yaw+(e.key==='ArrowLeft'?.15:-.15));else{stop();pitch=clamp(pitch+(e.key==='ArrowUp'?.05:-.05),0,.3);actions();requestPaint();}});
  window.addEventListener('resize',()=>{if(dialog.open)measure();});window.visualViewport?.addEventListener('resize',()=>{if(dialog.open)measure();});
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(dialog.open)measure();}).observe(q('.angle-model'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else requestPaint();});
})();
