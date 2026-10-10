(() => {
  'use strict';
  const dialog=document.querySelector('.photo-dialog'),trigger=document.querySelector('.photo-trigger'),core=window.KatmanyaPhotoRelief;
  if(!dialog||!trigger||!core||typeof dialog.showModal!=='function')return;
  const q=s=>dialog.querySelector(s),qa=s=>dialog.querySelectorAll(s),canvas=q('.photo-preview'),ctx=canvas.getContext('2d');
  const sample=document.createElement('canvas'),sampleCtx=sample.getContext('2d',{willReadFrequently:true});
  if(!ctx||!sampleCtx)return;
  const fileInput=q('.photo-file'),original=q('.photo-original'),status=q('.photo-status'),settings=q('.photo-settings');
  const contrast=q('.photo-contrast'),detail=q('.photo-detail'),height=q('.photo-height'),invert=q('.photo-invert');
  const buildButton=q('.photo-build'),download=q('.photo-download'),quote=q('.photo-quote'),replay=q('.photo-replay');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let source=null,sourceUrl='',revision=0,model=null,product='plaque',color='Yeşil',saved=null,opener=trigger;
  let yaw=-.22,pitch=1.12,drag=null,frame=0,start=0,progress=1,building=false,dirty=false,size={w:800,h:650,dpr:1};
  let loadError='',exporting=false;
  function view(value){dialog.dataset.photoTab=value;qa('[data-photo-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.photoTab===value)));measure();}
  function measure(){const rect=canvas.getBoundingClientRect();if(rect.width>0&&rect.height>0){const dpr=Math.min(window.devicePixelRatio||1,2);size={w:rect.width,h:rect.height,dpr};canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}requestPaint();}
  function actions(){
    buildButton.disabled=!source||building;settings.disabled=!source;
    const ready=!!model&&!dirty&&!building;
    download.disabled=!ready||exporting;replay.disabled=!ready;quote.setAttribute('aria-disabled',String(!ready));quote.setAttribute('tabindex',ready?'0':'-1');
    q('.photo-model-empty').hidden=!!model;
    if(ready){
      const text=['Merhaba KATMANYA, fotoğrafımdan kabartmalı '+(product==='keychain'?'bir anahtarlık':'bir hatıra plakası')+' için fiyat almak istiyorum.','Renk tercihi: '+color,'Kontrast: %'+contrast.value+' · Detay: '+['Sade','Dengeli','İnce'][Number(detail.value)],'Kabartma: '+['Hafif','Dengeli','Belirgin'][Number(height.value)-1]+' · '+(invert.checked?'Açık alanlar yükselsin':'Koyu alanlar yükselsin'),'Orijinal fotoğrafı ve indirdiğim taslağı sohbete ekleyeceğim.','Ölçü ve adedi birlikte netleştirelim.'].join('\n');
      quote.href='https://wa.me/905304815341?text='+encodeURIComponent(text);
    }else quote.removeAttribute('href');
    qa('[data-photo-product]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.photoProduct===product)));
    qa('[data-photo-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.photoColor===color)));
    q('.photo-model-label').textContent=product==='keychain'?'FOTOĞRAF ANAHTARLIĞI':'HATIRA PLAKASI';
  }
  function updateLabels(){q('.photo-contrast-value').textContent=contrast.value+'%';q('.photo-detail-value').textContent=['Sade','Dengeli','İnce'][Number(detail.value)];q('.photo-height-value').textContent=['Hafif','Dengeli','Belirgin'][Number(height.value)-1];}
  function makeModel(){
    if(!source)return null;
    const edge=[40,64,90][Number(detail.value)],aspect=source.width/source.height;
    sample.width=aspect>=1?edge:Math.max(4,Math.round(edge*aspect));sample.height=aspect>=1?Math.max(4,Math.round(edge/aspect)):edge;
    sampleCtx.clearRect(0,0,sample.width,sample.height);sampleCtx.imageSmoothingEnabled=true;sampleCtx.imageSmoothingQuality='high';sampleCtx.drawImage(source,0,0,sample.width,sample.height);
    return core.build({pixels:sampleCtx.getImageData(0,0,sample.width,sample.height).data,cols:sample.width,rows:sample.height,aspect,contrast:Number(contrast.value),detail:Number(detail.value),height:Number(height.value),invert:invert.checked,product,color});
  }
  function changed(){
    if(!source)return;updateLabels();building=false;progress=1;model=makeModel();dirty=true;status.textContent='Ayar değişti · baskıyı oluştur';actions();requestPaint();
  }
  function build(){
    if(!source||building)return;model=makeModel();dirty=false;building=true;progress=0;start=performance.now();status.textContent='Katmanlar yükseliyor · %0';actions();view('preview');requestPaint();
  }
  function paint(time){
    frame=0;if(!dialog.open||document.hidden)return;
    if(building){progress=reduce.matches?1:clamp((time-start)/3200,0,1);status.textContent=progress<1?'Katmanlar yükseliyor · %'+Math.round(progress*100):'Kabartman hazır ✓';if(progress===1){building=false;actions();}}
    ctx.setTransform(size.dpr,0,0,size.dpr,0,0);core.render(ctx,size.w,size.h,model,progress,{yaw,pitch});if(building)requestPaint();
  }
  function requestPaint(){if(!frame&&dialog.open&&!document.hidden)frame=requestAnimationFrame(paint);}
  async function loadFile(file){
    if(!file)return;
    const current=++revision;loadError='';
    if(file.size>20*1024*1024){loadError='Fotoğraf 20 MB’tan büyük. Daha küçük bir fotoğraf seç.';showError();fileInput.value='';return;}
    if(file.type&&!file.type.startsWith('image/')){loadError='Bir JPG, PNG veya WebP fotoğraf seç.';showError();fileInput.value='';return;}
    const url=URL.createObjectURL(file);status.textContent='Fotoğraf açılıyor…';
    try{
      const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('decode'));img.src=url;});
      if(current!==revision)return;
      if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40000000)throw Error('dimensions');
      const scaled=document.createElement('canvas'),ratio=Math.min(1,1280/Math.max(image.naturalWidth,image.naturalHeight));
      scaled.width=Math.max(1,Math.round(image.naturalWidth*ratio));scaled.height=Math.max(1,Math.round(image.naturalHeight*ratio));scaled.getContext('2d').drawImage(image,0,0,scaled.width,scaled.height);
      const previous=sourceUrl;source=scaled;sourceUrl=url;original.src=url;original.hidden=false;q('.photo-empty').hidden=true;
      if(previous)URL.revokeObjectURL(previous);contrast.value='100';detail.value='1';height.value='2';invert.checked=false;yaw=-.22;pitch=1.12;
      dirty=true;model=null;building=false;q('.photo-file-note').textContent='JPG, PNG veya WebP · En fazla 20 MB';updateLabels();actions();view('edit');status.textContent='Fotoğraf hazır · kabartmayı oluştur';
    }catch(error){if(current===revision){loadError=error.message==='dimensions'?'Fotoğrafın çözünürlüğü çok büyük. Daha küçük bir kopyasını seç.':'Fotoğraf açılamadı. JPG, PNG veya WebP olarak yeniden dene.';showError();}}
    finally{if(sourceUrl!==url)URL.revokeObjectURL(url);fileInput.value='';}
  }
  function showError(){status.textContent=loadError;q('.photo-file-note').textContent=loadError;}
  async function demo(){
    const current=++revision;status.textContent='Örnek açılıyor…';
    try{
      const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=new URL('assets/desk-set.webp',document.baseURI).href;});
      if(current!==revision)return;
      const c=document.createElement('canvas');const ratio=Math.min(1,1280/Math.max(image.naturalWidth,image.naturalHeight));c.width=Math.round(image.naturalWidth*ratio);c.height=Math.round(image.naturalHeight*ratio);c.getContext('2d').drawImage(image,0,0,c.width,c.height);
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(current===revision&&blob)await loadFile(new File([blob],'katmanya-ornek.png',{type:'image/png'}));
    }catch{if(current===revision){loadError='Örnek açılamadı. Kendi fotoğrafını yükleyebilirsin.';showError();}}
  }
  async function exportPNG(){
    if(!model||dirty||building||exporting)return;
    exporting=true;actions();const snapshot=model,camera={yaw,pitch},rev=revision;
    try{
      const c=document.createElement('canvas');c.width=1400;c.height=1100;const g=c.getContext('2d');g.fillStyle='#101913';g.fillRect(0,0,c.width,c.height);
      g.fillStyle='#c7fa5f';g.font='700 40px Arial, sans-serif';g.fillText('KATMANYA',64,75);g.fillStyle='#f3f1ec';g.font='600 25px Arial, sans-serif';g.fillText('Fotoğrafım katmana dönüştü.',64,124);
      g.save();g.translate(10,180);core.render(g,1380,730,snapshot,1,camera,false);g.restore();
      const scale=Math.min(225/source.width,132/source.height),sw=source.width*scale,sh=source.height*scale;g.drawImage(source,1110+(225-sw)/2,26+(132-sh)/2,sw,sh);g.strokeStyle='#c7fa5f55';g.strokeRect(1110,26,225,132);
      g.fillStyle='#c7fa5f';g.font='700 18px Arial, sans-serif';g.fillText((snapshot.product==='keychain'?'FOTOĞRAF ANAHTARLIĞI':'HATIRA PLAKASI')+' / '+snapshot.color.toLocaleUpperCase('tr-TR'),64,967);
      g.fillStyle='#b4c2aa';g.font='18px Arial, sans-serif';g.fillText('Kabartma önizlemesi · Ölçü ve üretim detayları teklif sırasında netleşir.',64,1007);g.fillText('katmanya.com  /  @katmanya_3d',64,1052);
      const blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!blob)throw Error('export');if(rev!==revision||!dialog.open)return;
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='katmanya-fotograf-kabartma.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
      status.textContent='Taslak indirildi · WhatsApp sohbetine ekleyebilirsin';
    }catch{status.textContent='Taslak indirilemedi. Tekrar dene.';}finally{exporting=false;actions();}
  }
  function open(event){
    if(dialog.open)return;opener=event?.currentTarget||trigger;saved={y:window.scrollY,style:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};
    document.body.style.position='fixed';document.body.style.top=-saved.y+'px';document.body.style.width='100%';dialog.showModal();view('edit');actions();q('.photo-close').focus({preventScroll:true});
  }
  function close(){
    revision++;if(frame)cancelAnimationFrame(frame);frame=0;drag=null;building=false;progress=1;
    if(model&&!dirty)status.textContent='Kabartman hazır ✓';
    if(saved){Object.assign(document.body.style,saved.style);window.scrollTo({top:saved.y,left:0,behavior:'instant'});saved=null;}actions();opener.focus({preventScroll:true});
  }
  trigger.disabled=false;trigger.addEventListener('click',open);q('.photo-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',close);
  q('.photo-upload').addEventListener('click',()=>fileInput.click());q('.photo-demo').addEventListener('click',demo);fileInput.addEventListener('change',()=>loadFile(fileInput.files[0]));
  buildButton.addEventListener('click',build);replay.addEventListener('click',build);download.addEventListener('click',exportPNG);
  [contrast,detail,height,invert].forEach(el=>el.addEventListener('input',changed));
  qa('[data-photo-tab]').forEach(b=>b.addEventListener('click',()=>view(b.dataset.photoTab)));
  qa('[data-photo-product]').forEach(b=>b.addEventListener('click',()=>{product=b.dataset.photoProduct;changed();}));
  qa('[data-photo-color]').forEach(b=>b.addEventListener('click',()=>{color=b.dataset.photoColor;if(model)model.color=color;actions();requestPaint();}));
  qa('[data-photo-rotate]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.photoRotate;if(v==='reset'){yaw=-.22;pitch=1.12;}else yaw+=v==='left'?-.22:.22;requestPaint();}));
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.009;pitch=clamp(pitch+(e.clientY-drag.y)*.007,.38,1.49);drag.x=e.clientX;drag.y=e.clientY;requestPaint();});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,e=>{if(drag?.id!==e.pointerId)return;drag=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);}));
  canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home'){yaw=-.22;pitch=1.12;}else if(e.key==='ArrowLeft')yaw-=.15;else if(e.key==='ArrowRight')yaw+=.15;else pitch=clamp(pitch+(e.key==='ArrowUp'?-.10:.10),.38,1.49);requestPaint();});
  window.addEventListener('resize',()=>{if(dialog.open)measure();});
  if(typeof ResizeObserver==='function')new ResizeObserver(()=>{if(dialog.open)measure();}).observe(q('.photo-model'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;}else requestPaint();});
})();
