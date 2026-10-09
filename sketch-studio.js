(() => {
  'use strict';
  const dialog=document.querySelector('.sketch-dialog');
  const trigger=document.querySelector('.sketch-trigger');
  if(!dialog||!trigger||typeof dialog.showModal!=='function')return;
  const ink=dialog.querySelector('.sketch-ink'),preview=dialog.querySelector('.sketch-preview');
  const inkCtx=ink.getContext('2d'),previewCtx=preview.getContext('2d');
  const strokeBuffer=document.createElement('canvas'),mask=document.createElement('canvas');
  const strokeCtx=strokeBuffer.getContext('2d'),maskCtx=mask.getContext('2d',{willReadFrequently:true});
  if(!inkCtx||!previewCtx||!strokeCtx||!maskCtx)return;
  const buildButton=dialog.querySelector('.sketch-build'),undo=dialog.querySelector('.sketch-undo'),clear=dialog.querySelector('.sketch-clear');
  const download=dialog.querySelector('.sketch-download'),quote=dialog.querySelector('.sketch-quote');
  const brush=dialog.querySelector('.sketch-brush input'),empty=dialog.querySelector('.sketch-empty'),status=dialog.querySelector('.sketch-build-status');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),COLS=160,ROWS=100,DURATION=2400;
  const colors={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#454e48'};
  const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
  let paths=[],activeStroke=null,tool='pen',color='Yeşil',mesh=null,changed=true,building=false,progress=1;
  let yaw=-.48,pitch=.72,rotation=null,frameId=0,started=0,saved=null,inkDirty=true,inkSize={w:800,h:500},modelSize={w:800,h:600};
  // Merge occupied raster cells into flat top rectangles and exposed boundary runs.
  // Empty cells remain holes; interior edges never generate side walls.
  function reliefGeometry(bits,cols,rows){
    const tops=[],walls=[],edges=new Map();let active=new Map(),cells=0;
    for(let z=0;z<rows;z++){
      const next=new Map();
      for(let x=0;x<cols;){
        if(!bits[z*cols+x]){x++;continue;}
        const first=x;while(x<cols&&bits[z*cols+x]){cells++;x++;}
        const key=first+':'+x,rect=active.get(key)||[first,z,x,z+1];rect[3]=z+1;next.set(key,rect);
      }
      for(const [key,rect] of active)if(!next.has(key))tops.push(rect);
      active=next;
    }
    for(const rect of active.values())tops.push(rect);
    function edge(side,line,at){const key=side+':'+line;if(!edges.has(key))edges.set(key,[]);edges.get(key).push(at);}
    for(let z=0;z<rows;z++)for(let x=0;x<cols;x++)if(bits[z*cols+x]){
      if(x===0||!bits[z*cols+x-1])edge(0,x,z);
      if(x===cols-1||!bits[z*cols+x+1])edge(1,x+1,z);
      if(z===0||!bits[(z-1)*cols+x])edge(2,z,x);
      if(z===rows-1||!bits[(z+1)*cols+x])edge(3,z+1,x);
    }
    for(const [key,values] of edges){
      const [side,line]=key.split(':').map(Number);let start=values[0],end=start+1;
      for(let i=1;i<=values.length;i++){
        if(i<values.length&&values[i]===end){end++;continue;}
        walls.push([side,line,start,end]);if(i<values.length){start=values[i];end=start+1;}
      }
    }
    return {tops,walls,cells,cols,rows};
  }
  function paintPaths(context,w,h){
    context.clearRect(0,0,w,h);context.lineCap='round';context.lineJoin='round';
    for(const path of paths){
      context.globalCompositeOperation=path.tool==='eraser'?'destination-out':'source-over';
      context.strokeStyle='#c7fa5f';context.fillStyle='#c7fa5f';context.lineWidth=path.width*w;
      const first=path.points[0];if(!first)continue;
      if(path.points.length===1){context.beginPath();context.arc(first[0]*w,first[1]*h,path.width*w/2,0,Math.PI*2);context.fill();continue;}
      context.beginPath();context.moveTo(first[0]*w,first[1]*h);
      for(let i=1;i<path.points.length;i++)context.lineTo(path.points[i][0]*w,path.points[i][1]*h);
      context.stroke();
    }
    context.globalCompositeOperation='source-over';
  }
  function drawGrid(context,w,h){
    context.fillStyle='#0d130f';context.fillRect(0,0,w,h);context.fillStyle='#c7fa5f1b';
    for(let x=15;x<w;x+=22)for(let y=15;y<h;y+=22)context.fillRect(x,y,1,1);
  }
  function paintInk(){
    const {w,h,dpr}=inkSize;inkCtx.setTransform(dpr,0,0,dpr,0,0);drawGrid(inkCtx,w,h);
    paintPaths(strokeCtx,strokeBuffer.width,strokeBuffer.height);
    inkCtx.drawImage(strokeBuffer,0,0,w,h);
  }
  function resizeCanvas(canvas){
    const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return null;
    const dpr=Math.min(window.devicePixelRatio||1,2),w=rect.width,h=rect.height;
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);return {w,h,dpr};
  }
  function measure(){
    const a=resizeCanvas(ink),b=resizeCanvas(preview);
    if(a){inkSize=a;strokeBuffer.width=ink.width;strokeBuffer.height=ink.height;inkDirty=true;}
    if(b)modelSize=b;
    requestPaint();
  }
  function rgb(hex){return [1,3,5].map(n=>parseInt(hex.slice(n,n+2),16));}
  function shade(base,amount){return 'rgb('+base.map(v=>Math.round(limit(v*amount,0,255))).join(',')+')';}
  function renderModel(context,w,h,value=progress,clearCanvas=true){
    if(clearCanvas)context.clearRect(0,0,w,h);
    const unit=Math.min(w/4.9,h/3.65),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    const baseH=Math.min(.15,(.15+.38)*value),raised=Math.max(0,(.15+.38)*value-.15);
    const project=v=>{
      const x=v[0]*cy+v[2]*sy,z=-v[0]*sy+v[2]*cy,y=v[1]-.18,depth=z*cp+y*sp,f=7/(7-depth);
      return {x:w/2+x*f*unit,y:h/2+(-y*cp+z*sp)*f*unit,depth};
    };
    const facing=n=>(-n[0]*sy+n[2]*cy)*cp+n[1]*sp;
    const light=n=>.55+.50*Math.max(0,(n[0]*cy+n[2]*sy)*-.35+n[1]*.8+(-n[0]*sy+n[2]*cy)*.6);
    function polygon(vertices,normal,base,strata=false){
      if(facing(normal)<=.001)return null;
      const pts=vertices.map(project);
      return {vertices,pts,normal,color:shade(base,light(normal)),depth:pts.reduce((a,p)=>a+p.depth,0)/pts.length,strata};
    }
    function paint(face){
      context.beginPath();face.pts.forEach((p,i)=>i?context.lineTo(p.x,p.y):context.moveTo(p.x,p.y));context.closePath();context.fillStyle=face.color;context.fill();
      if(face.strata){
        context.strokeStyle='#10171235';context.lineWidth=.55;
        for(let band=1;band<5;band++){
          const t=band/5,a=face.vertices[0].map((v,k)=>v+(face.vertices[1][k]-v)*t),b=face.vertices[3].map((v,k)=>v+(face.vertices[2][k]-v)*t),pa=project(a),pb=project(b);
          context.beginPath();context.moveTo(pa.x,pa.y);context.lineTo(pb.x,pb.y);context.stroke();
        }
      }
    }
    context.save();context.translate(w/2,h/2+unit*.98);context.scale(1,.28);context.beginPath();context.ellipse(0,0,unit*1.8,unit*.8,0,0,Math.PI*2);context.fillStyle='#00000035';context.fill();context.restore();
    const bx=1.85,bz=1.16,base=[59,68,60],baseFaces=[
      polygon([[-bx,baseH,-bz],[bx,baseH,-bz],[bx,baseH,bz],[-bx,baseH,bz]],[0,1,0],base),
      polygon([[-bx,0,-bz],[-bx,baseH,-bz],[-bx,baseH,bz],[-bx,0,bz]],[-1,0,0],base,true),
      polygon([[bx,0,bz],[bx,baseH,bz],[bx,baseH,-bz],[bx,0,-bz]],[1,0,0],base,true),
      polygon([[bx,0,-bz],[bx,baseH,-bz],[-bx,baseH,-bz],[-bx,0,-bz]],[0,0,-1],base,true),
      polygon([[-bx,0,bz],[-bx,baseH,bz],[bx,baseH,bz],[bx,0,bz]],[0,0,1],base,true)
    ].filter(Boolean);
    baseFaces.sort((a,b)=>a.depth-b.depth).forEach(paint);
    if(!mesh||raised<=0)return;
    const x=v=>(v/mesh.cols-.5)*3.2,z=v=>(v/mesh.rows-.5)*2,top=.15+raised,material=rgb(colors[color]),faces=[];
    for(const [x0,z0,x1,z1] of mesh.tops)faces.push(polygon([[x(x0),top,z(z0)],[x(x1),top,z(z0)],[x(x1),top,z(z1)],[x(x0),top,z(z1)]],[0,1,0],material));
    for(const [side,line,start,end] of mesh.walls){
      let a,b,normal;
      if(side<2){a=[x(line),.15,z(start)];b=[x(line),.15,z(end)];normal=[side===0?-1:1,0,0];}
      else{a=[x(start),.15,z(line)];b=[x(end),.15,z(line)];normal=[0,0,side===2?-1:1];}
      const face=polygon([a,[a[0],top,a[2]],[b[0],top,b[2]],b],normal,material,true);if(face)faces.push(face);
    }
    faces.filter(Boolean).sort((a,b)=>a.depth-b.depth).forEach(paint);
  }
  function paintFrame(time){
    frameId=0;if(!dialog.open||document.hidden)return;
    if(building){
      progress=motion.matches?1:limit((time-started)/DURATION,0,1);
      status.textContent=progress<1?'Katmanlar yükseliyor · %'+Math.round(progress*100):'Taslağın hazır';
      if(progress===1){building=false;updateActions();}
    }
    if(inkDirty){paintInk();inkDirty=false;}
    previewCtx.setTransform(modelSize.dpr||1,0,0,modelSize.dpr||1,0,0);renderModel(previewCtx,modelSize.w,modelSize.h,mesh?progress:1);
    if(building)requestPaint();
  }
  function requestPaint(){if(!frameId&&dialog.open&&!document.hidden)frameId=requestAnimationFrame(paintFrame);}
  function updateActions(){
    undo.disabled=!paths.length;clear.disabled=!paths.length;empty.hidden=!!paths.length;
    buildButton.disabled=!paths.some(p=>p.tool==='pen')||!!activeStroke||building;
    const ready=!!mesh&&!changed&&!building;
    download.disabled=!ready;quote.setAttribute('aria-disabled',String(!ready));quote.setAttribute('tabindex',ready?'0':'-1');
    if(ready){
      const text=['Merhaba KATMANYA, kendi çizimimden kabartmalı bir plaka için teklif almak istiyorum.','Renk tercihi: '+color,'Taslağımı sohbete ekleyeceğim.','Ölçü ve adet bilgisini birlikte netleştirelim.'].join('\n');
      quote.href='https://wa.me/905304815341?text='+encodeURIComponent(text);
    }else quote.removeAttribute('href');
  }
  function markChanged(){
    changed=true;building=false;progress=1;inkDirty=true;
    status.textContent=mesh?'Çizim değişti · tekrar çevir':'Çizimini bekliyor';updateActions();requestPaint();
  }
  function setView(view){
    dialog.dataset.sketchView=view;
    dialog.querySelectorAll('[data-sketch-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sketchView===view)));
    measure();
  }
  function point(event){
    const r=ink.getBoundingClientRect();return [limit((event.clientX-r.left)/r.width,0,1),limit((event.clientY-r.top)/r.height,0,1)];
  }
  function beginStroke(event){
    if(activeStroke||event.button!==0)return;
    const width=limit(Number(brush.value)||4,2,9)*.006*(tool==='eraser'?2:1);
    activeStroke={id:event.pointerId,path:{tool,width,points:[point(event)]}};paths.push(activeStroke.path);
    ink.setPointerCapture(event.pointerId);markChanged();event.preventDefault();
  }
  function moveStroke(event){
    if(activeStroke?.id!==event.pointerId)return;
    const samples=typeof event.getCoalescedEvents==='function'?event.getCoalescedEvents():[event];
    for(const sample of samples.length?samples:[event]){
      const p=point(sample),last=activeStroke.path.points.at(-1);
      if(Math.hypot(p[0]-last[0],p[1]-last[1])>.001)activeStroke.path.points.push(p);
    }
    inkDirty=true;requestPaint();event.preventDefault();
  }
  function endStroke(event){
    if(activeStroke?.id!==event.pointerId)return;
    if(event.type==='pointerup')moveStroke(event);
    activeStroke=null;if(ink.hasPointerCapture(event.pointerId))ink.releasePointerCapture(event.pointerId);
    updateActions();inkDirty=true;requestPaint();
  }
  function preset(name){
    let pts=[];
    if(name==='bolt')pts=[[.56,.16],[.29,.53],[.48,.53],[.43,.86],[.72,.42],[.53,.42],[.56,.16]];
    if(name==='heart')for(let i=0;i<=100;i++){const t=i/100*Math.PI*2;pts.push([.5+Math.pow(Math.sin(t),3)*.30,.47-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.023]);}
    if(name==='star')for(let i=0;i<=10;i++){const t=-Math.PI/2+i*Math.PI/5,r=i%2?.15:.34;pts.push([.5+Math.cos(t)*r,.5+Math.sin(t)*r]);}
    if(name==='triangle')pts=[[.5,.12],[.75,.813],[.25,.813],[.5,.12]];
    if(name==='circle')for(let i=0;i<=100;i++){const t=i/100*Math.PI*2;pts.push([.5+Math.cos(t)*.20,.5+Math.sin(t)*.32]);}
    if(name==='rectangle')pts=[[.22,.23],[.78,.23],[.78,.77],[.22,.77],[.22,.23]];
    if(!pts.length)return;
    paths.push({tool:'pen',width:.024,points:pts});markChanged();setView('draw');
  }
  function build(){
    if(activeStroke||building)return;
    mask.width=COLS;mask.height=ROWS;paintPaths(maskCtx,COLS,ROWS);
    const data=maskCtx.getImageData(0,0,COLS,ROWS).data,bits=new Uint8Array(COLS*ROWS);
    for(let i=0;i<bits.length;i++)bits[i]=data[i*4+3]>=128?1:0;
    const result=reliefGeometry(bits,COLS,ROWS);
    if(!result.cells){mesh=null;changed=true;status.textContent='Çizim boş · bir şekil çiz';updateActions();requestPaint();return;}
    mesh=result;changed=false;building=true;progress=0;started=performance.now();updateActions();setView('preview');requestPaint();
    if(window.innerWidth<=800)preview.focus({preventScroll:true});
  }
  function rotate(direction){
    if(direction==='reset'){yaw=-.48;pitch=.72;}else yaw+=direction==='left'?-.25:.25;
    requestPaint();
  }
  async function exportDraft(){
    if(!mesh||changed||building)return;
    const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=1000;const c=sheet.getContext('2d');
    c.fillStyle='#111713';c.fillRect(0,0,1600,1000);
    c.font='800 37px Manrope, sans-serif';c.fillStyle='#c7fa5f';c.fillText('KATMANYA',64,73);
    c.font='13px monospace';c.fillStyle='#a9b69e';c.fillText('SENİN ÇİZGİN / KABARTMALI PLAKA TASLAĞI',64,112);
    c.strokeStyle='#c7fa5f35';c.beginPath();c.moveTo(64,143);c.lineTo(1536,143);c.stroke();
    c.font='13px monospace';c.fillStyle='#c7fa5f';c.fillText('01 / ÇİZİMİN',64,197);c.fillText('02 / 3B TASLAĞIN',800,197);
    const flat=document.createElement('canvas');flat.width=640;flat.height=400;const flatCtx=flat.getContext('2d');drawGrid(flatCtx,640,400);
    const lines=document.createElement('canvas');lines.width=640;lines.height=400;paintPaths(lines.getContext('2d'),640,400);flatCtx.drawImage(lines,0,0);
    c.drawImage(flat,64,240);c.strokeStyle='#c7fa5f35';c.strokeRect(64,240,640,400);
    c.save();c.translate(780,220);renderModel(c,756,560,1,false);c.restore();
    c.fillStyle='#a9b69e';c.font='17px Manrope, sans-serif';c.fillText('Renk tercihi: '+color,64,716);
    c.font='14px Manrope, sans-serif';c.fillText('Baskı için ölçü ve adedi birlikte netleştirelim.',64,753);
    c.strokeStyle='#c7fa5f35';c.beginPath();c.moveTo(64,863);c.lineTo(1536,863);c.stroke();
    c.fillStyle='#c7fa5f';c.font='18px monospace';c.fillText('katmanya.com',64,921);
    const blob=await new Promise(resolve=>sheet.toBlob(resolve,'image/png'));if(!blob)return;
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='katmanya-cizim-taslagi.png';
    document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function open(){
    if(dialog.open)return;
    saved={scrollY:window.scrollY,body:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};
    document.body.style.position='fixed';document.body.style.top=-saved.scrollY+'px';document.body.style.width='100%';
    dialog.showModal();setView('draw');updateActions();inkDirty=true;measure();dialog.querySelector('.sketch-close').focus({preventScroll:true});
  }
  function restore(){
    if(frameId)cancelAnimationFrame(frameId);frameId=0;building=false;progress=1;activeStroke=null;rotation=null;
    if(saved){Object.assign(document.body.style,saved.body);window.scrollTo({top:saved.scrollY,left:0,behavior:'instant'});saved=null;}
    updateActions();trigger.focus({preventScroll:true});
  }
  ink.addEventListener('pointerdown',beginStroke);ink.addEventListener('pointermove',moveStroke);
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>ink.addEventListener(type,endStroke));
  preview.addEventListener('pointerdown',event=>{if(event.button!==0||rotation)return;rotation={id:event.pointerId,x:event.clientX,y:event.clientY};preview.setPointerCapture(event.pointerId);event.preventDefault();});
  preview.addEventListener('pointermove',event=>{
    if(rotation?.id!==event.pointerId)return;yaw+=(event.clientX-rotation.x)*.008;pitch=limit(pitch+(event.clientY-rotation.y)*.006,.32,1.2);
    rotation.x=event.clientX;rotation.y=event.clientY;requestPaint();event.preventDefault();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>preview.addEventListener(type,event=>{if(rotation?.id!==event.pointerId)return;rotation=null;if(preview.hasPointerCapture(event.pointerId))preview.releasePointerCapture(event.pointerId);}));
  preview.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;event.preventDefault();
    if(event.key==='Home')rotate('reset');else if(event.key==='ArrowLeft'||event.key==='ArrowRight')rotate(event.key==='ArrowLeft'?'left':'right');else{pitch=limit(pitch+(event.key==='ArrowUp' ? .1 : -.1),.32,1.2);requestPaint();}
  });
  dialog.querySelectorAll('[data-sketch-tool]').forEach(button=>button.addEventListener('click',()=>{
    tool=button.dataset.sketchTool;ink.classList.toggle('is-eraser',tool==='eraser');
    dialog.querySelectorAll('[data-sketch-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  }));
  dialog.querySelectorAll('[data-sketch-preset]').forEach(button=>button.addEventListener('click',()=>preset(button.dataset.sketchPreset)));
  dialog.querySelectorAll('[data-sketch-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.sketchView)));
  dialog.querySelectorAll('[data-sketch-rotate]').forEach(button=>button.addEventListener('click',()=>rotate(button.dataset.sketchRotate)));
  dialog.querySelectorAll('[data-sketch-color]').forEach(button=>button.addEventListener('click',()=>{
    if(!colors[button.dataset.sketchColor])return;color=button.dataset.sketchColor;
    dialog.querySelectorAll('[data-sketch-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));updateActions();requestPaint();
  }));
  undo.addEventListener('click',()=>{if(activeStroke)return;paths.pop();markChanged();});
  clear.addEventListener('click',()=>{paths=[];activeStroke=null;mesh=null;markChanged();});
  buildButton.addEventListener('click',build);download.addEventListener('click',exportDraft);
  quote.addEventListener('click',event=>{if(!mesh||changed||building)event.preventDefault();});
  dialog.querySelector('.sketch-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',restore);
  trigger.addEventListener('click',open);window.addEventListener('resize',()=>{if(dialog.open)measure();},{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(()=>{if(dialog.open)measure();}).observe(dialog.querySelector('.sketch-workspace'));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(frameId)cancelAnimationFrame(frameId);frameId=0;}else if(dialog.open){if(building)started=performance.now()-progress*DURATION;requestPaint();}
  });
  window.addEventListener('pageshow',()=>{if(dialog.open)dialog.close();});
  motion.addEventListener('change',requestPaint);dialog.dataset.sketchView='draw';updateActions();trigger.disabled=false;
})();

