(() => {
  'use strict';
  const dialog=document.querySelector('.puzzle-dialog'),trigger=document.querySelector('.puzzle-trigger'),core=window.KatmanyaPuzzle;
  if(!dialog||!trigger||!core||typeof dialog.showModal!=='function')return;
  const q=s=>dialog.querySelector(s),qa=s=>dialog.querySelectorAll(s),canvas=q('.puzzle-preview'),ctx=canvas.getContext('2d');
  const raster=document.createElement('canvas');raster.width=core.COLS;raster.height=core.ROWS;const rc=raster.getContext('2d',{willReadFrequently:true});if(!ctx||!rc)return;
  const nameA=q('.puzzle-name-a'),nameB=q('.puzzle-name-b'),status=q('.puzzle-status'),build=q('.puzzle-build'),download=q('.puzzle-download'),quote=q('.puzzle-quote'),distance=q('.puzzle-separation input');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let shape='heart',colorA='Yeşil',colorB='Mavi',design=null,part='both',separation=1,yaw=-.2,pitch=1.02,dirty=true,joining=false,start=0,frame=0,drag=null,saved=null,exporting=false,revision=0,size={w:800,h:650,dpr:1};
  function names(){return [nameA.value.trim().normalize('NFC').slice(0,18),nameB.value.trim().normalize('NFC').slice(0,18)];}
  function textMask(text,side){
    rc.clearRect(0,0,core.COLS,core.ROWS);rc.fillStyle='#fff';rc.textAlign='center';rc.textBaseline='middle';rc.font='700 23px Arial, sans-serif';
    const maxWidth=core.COLS*(side===0?.26:.22),font=Math.min(23,23*maxWidth/Math.max(1,rc.measureText(text).width));rc.font='700 '+font+'px Arial, sans-serif';
    rc.fillText(text,(side===0?.29:.76)*core.COLS,.49*core.ROWS,maxWidth);
    const p=rc.getImageData(0,0,core.COLS,core.ROWS).data,bits=new Uint8Array(core.COLS*core.ROWS);for(let i=0;i<bits.length;i++)bits[i]=p[i*4+3]>=90?1:0;return bits;
  }
  function rebuild(){
    const [a,b]=names();design=core.build({shape,colorA,colorB,textA:textMask(a||'SİZ',0),textB:textMask(b||'PARTNERİNİZ',1)});dirty=true;joining=false;revision++;status.textContent=a&&b?'Tasarım değişti · yeniden oluştur':'İsimlerinizi bekliyor';actions();requestPaint();
  }
  function actions(){
    const [a,b]=names(),ready=!!design&&!dirty&&!joining;build.disabled=!a||!b||joining;download.disabled=!ready||exporting;
    quote.setAttribute('aria-disabled',String(!ready));quote.setAttribute('tabindex',ready?'0':'-1');distance.disabled=part!=='both';
    qa('[data-puzzle-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.puzzlePart===part)));
    qa('[data-puzzle-shape]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.puzzleShape===shape)));
    qa('[data-puzzle-color-a]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.puzzleColorA===colorA)));
    qa('[data-puzzle-color-b]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.puzzleColorB===colorB)));
    q('.puzzle-model-label').textContent=(part==='a'?'01 / '+(a||'SİZ'):part==='b'?'02 / '+(b||'PARTNERİNİZ'):'İKİ PARÇA · '+(shape==='heart'?'BİR KALP':'BİR PUZZLE'));
    if(ready){const text=['Merhaba KATMANYA, iki parçalı '+(shape==='heart'?'kalp':'puzzle')+' anahtarlık seti için fiyat almak istiyorum.','1. parça: '+a+' · Renk: '+colorA,'2. parça: '+b+' · Renk: '+colorB,'İki ayrı halka deliği ve kabartma isimlerle.','İndirdiğim taslağı sohbete ekleyeceğim.','Set adedi, ölçü ve birleşme toleransını birlikte netleştirelim.'].join('\n');quote.href='https://wa.me/905304815341?text='+encodeURIComponent(text);}else quote.removeAttribute('href');
  }
  function view(value){dialog.dataset.puzzleTab=value;qa('[data-puzzle-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.puzzleTab===value)));measure();}
  function measure(){const r=canvas.getBoundingClientRect();if(r.width>0&&r.height>0){const dpr=Math.min(window.devicePixelRatio||1,2);size={w:r.width,h:r.height,dpr};canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}requestPaint();}
  function animate(confirm=false){
    if(confirm){const [a,b]=names();if(!a||!b)return;dirty=false;}
    joining=true;part='both';separation=1;distance.value='100';start=performance.now();status.textContent='Parçalar birbirini buluyor…';actions();view('preview');requestPaint();
  }
  function paint(time){
    frame=0;if(!dialog.open||document.hidden)return;
    if(joining){const t=motion.matches?1:clamp((time-start)/2600,0,1);separation=1-t*t*(3-2*t);distance.value=String(Math.round(separation*100));if(t===1){joining=false;status.textContent=dirty?'İsimlerinizi yaz · tasarımı oluştur':'Birlikte tamamlandınız ✓';actions();}}
    ctx.setTransform(size.dpr,0,0,size.dpr,0,0);core.render(ctx,size.w,size.h,design,{separation,yaw,pitch,part});if(joining)requestPaint();
  }
  function requestPaint(){if(!frame&&dialog.open&&!document.hidden)frame=requestAnimationFrame(paint);}
  function separate(){joining=false;separation=Number(distance.value)/100;status.textContent=dirty?'Tasarımı oluştur':separation===0?'Birlikte tamamlandınız ✓':'İki parça · tek hikâye';actions();requestPaint();}
  async function exportPNG(){
    if(dirty||joining||!design||exporting)return;
    const current=revision,snapshot=design,[a,b]=names(),selectedPart=part,colors=[colorA,colorB];exporting=true;actions();
    try{
      const c=document.createElement('canvas');c.width=1600;c.height=1200;const g=c.getContext('2d');g.fillStyle='#101913';g.fillRect(0,0,1600,1200);
      g.fillStyle='#c7fa5f';g.font='700 40px Arial, sans-serif';g.fillText('KATMANYA',64,76);g.fillStyle='#f3f1ec';g.font='600 27px Arial, sans-serif';g.fillText('İki parça, bir hikâye.',64,123);
      g.save();g.translate(0,148);core.render(g,1600,540,snapshot,{separation:.22,yaw:-.12,pitch:1.2,part:selectedPart,clear:false});g.restore();
      const label=(text,x,y,max)=>{g.fillStyle='#f3f1ec';g.font='600 22px Arial, sans-serif';g.fillText(text,x,y,max);};
      g.save();g.translate(70,685);core.render(g,650,340,snapshot,{part:'a',yaw:-.2,pitch:1.05,clear:false});g.restore();
      g.save();g.translate(880,685);core.render(g,650,340,snapshot,{part:'b',yaw:.2,pitch:1.05,clear:false});g.restore();
      label('01 / '+a+' · '+colors[0],90,1040,650);label('02 / '+b+' · '+colors[1],900,1040,620);
      g.fillStyle='#a9b69e';g.font='17px Arial, sans-serif';g.fillText('İki parçalı set önizlemesi · Ölçü ve birleşme toleransı teklif sırasında netleşir.',64,1107);g.fillStyle='#c7fa5f';g.font='700 23px Arial, sans-serif';g.fillText('katmanya.com  /  @katmanya_3d',64,1150);
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('png');if(current!==revision||!dialog.open)return;
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='katmanya-iki-parca-'+snapshot.shape+'.png';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='Taslağınız indirildi · sohbetinize ekleyebilirsiniz';
    }catch{if(current===revision)status.textContent='Taslak indirilemedi. Tekrar deneyebilirsin.';}finally{exporting=false;actions();}
  }
  function open(){if(dialog.open)return;saved={y:window.scrollY,style:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};document.body.style.position='fixed';document.body.style.top=-saved.y+'px';document.body.style.width='100%';dialog.showModal();if(!design)rebuild();view('edit');actions();q('.puzzle-close').focus({preventScroll:true});}
  function close(){revision++;if(frame)cancelAnimationFrame(frame);frame=0;joining=false;drag=null;if(saved){Object.assign(document.body.style,saved.style);window.scrollTo({top:saved.y,left:0,behavior:'instant'});saved=null;}actions();trigger.focus({preventScroll:true});}
  trigger.disabled=false;trigger.addEventListener('click',open);q('.puzzle-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',close);
  [nameA,nameB].forEach(input=>input.addEventListener('input',rebuild));
  qa('[data-puzzle-shape]').forEach(b=>b.addEventListener('click',()=>{shape=b.dataset.puzzleShape;rebuild();}));
  qa('[data-puzzle-color-a]').forEach(b=>b.addEventListener('click',()=>{colorA=b.dataset.puzzleColorA;rebuild();}));
  qa('[data-puzzle-color-b]').forEach(b=>b.addEventListener('click',()=>{colorB=b.dataset.puzzleColorB;rebuild();}));
  qa('[data-puzzle-part]').forEach(b=>b.addEventListener('click',()=>{joining=false;part=b.dataset.puzzlePart;status.textContent=dirty?'Tasarımı oluştur':part==='both'?'İki parça · tek hikâye':(part==='a'?'Birinci':'İkinci')+' parçan hazır';actions();requestPaint();}));
  qa('[data-puzzle-tab]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.puzzleTab)));
  qa('[data-puzzle-rotate]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.puzzleRotate;if(v==='reset'){yaw=-.2;pitch=1.02;}else yaw+=v==='left'?-.22:.22;requestPaint();}));
  distance.addEventListener('input',separate);build.addEventListener('click',()=>animate(true));q('.puzzle-join').addEventListener('click',()=>animate());download.addEventListener('click',exportPNG);
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.009;pitch=clamp(pitch+(e.clientY-drag.y)*.007,.38,1.49);drag.x=e.clientX;drag.y=e.clientY;requestPaint();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,e=>{if(drag?.id!==e.pointerId)return;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}));
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){yaw=-.2;pitch=1.02;}else if(e.key==='ArrowLeft')yaw-=.15;else if(e.key==='ArrowRight')yaw+=.15;else pitch=clamp(pitch+(e.key==='ArrowUp'?-.1:.1),.38,1.49);requestPaint();});
  window.addEventListener('resize',()=>{if(dialog.open)measure();});if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(dialog.open)measure();}).observe(q('.puzzle-model'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else requestPaint();});
})();
