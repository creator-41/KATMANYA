(() => {
  'use strict';
  const dialog=document.querySelector('.sketch-dialog');
  const trigger=document.querySelector('.sketch-trigger');
  if(!dialog||!trigger||typeof dialog.showModal!=='function')return;
  const ink=dialog.querySelector('.sketch-ink'),preview=dialog.querySelector('.sketch-preview');
  const inkCtx=ink.getContext('2d'),previewCtx=preview.getContext('2d');
  const strokeBuffer=document.createElement('canvas'),mask=document.createElement('canvas');
  const strokeCtx=strokeBuffer.getContext('2d'),maskCtx=mask.getContext('2d',{willReadFrequently:true});
  const cutLayer=document.createElement('canvas'),cutCtx=cutLayer.getContext('2d');
  if(!inkCtx||!previewCtx||!strokeCtx||!maskCtx||!cutCtx)return;
  const buildButton=dialog.querySelector('.sketch-build'),undo=dialog.querySelector('.sketch-undo'),clear=dialog.querySelector('.sketch-clear');
  const download=dialog.querySelector('.sketch-download'),quote=dialog.querySelector('.sketch-quote');
  const share=dialog.querySelector('.sketch-share'),shareStatus=dialog.querySelector('.sketch-share-status'),shareInput=dialog.querySelector('.sketch-share-link');
  const brush=dialog.querySelector('.sketch-brush input'),empty=dialog.querySelector('.sketch-empty'),status=dialog.querySelector('.sketch-build-status');
  const shapeSelect=dialog.querySelector('.sketch-shape-select'),shapeSize=dialog.querySelector('.sketch-shape-size'),shapePercent=dialog.querySelector('.sketch-shape-percent');
  const shapeAngle=dialog.querySelector('.sketch-shape-angle'),angleValue=dialog.querySelector('.sketch-angle-value');
  const textInput=dialog.querySelector('.sketch-text-input'),textAdd=dialog.querySelector('.sketch-text-add');
  const deleteSelected=dialog.querySelector('.sketch-delete');
  const keyToggle=dialog.querySelector('.sketch-key-toggle'),keyControls=dialog.querySelector('.sketch-key-controls');
  const holeMove=dialog.querySelector('.sketch-hole-move'),holeX=dialog.querySelector('.sketch-hole-x'),holeY=dialog.querySelector('.sketch-hole-y');
  const productLabel=dialog.querySelector('.sketch-model-label');
  const finishHelp=dialog.querySelector('.sketch-finish-help');
  const faceControls=dialog.querySelector('.sketch-face-controls'),modelFaces=dialog.querySelector('.sketch-model-faces');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),COLS=160,ROWS=100,DURATION=2400;
  const colors={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#454e48'};
  const paletteNames=Object.keys(colors),paletteRGB=Object.values(colors).map(rgb);
  const limit=(v,a,b)=>Math.max(a,Math.min(b,v));
  let paths=[],activeStroke=null,tool='pen',color='Yeşil',mesh=null,changed=true,building=false,progress=1;
  let selected=null,transform=null,sizeGesture=false;const history=[];
  let keychain={enabled:false,hole:[.5,.1]},holeGesture=false;
  let finish='raised';
  let otherPaths=[],otherFinish='raised',face='front',modelFace='front';
  let shareUrl='',shareSnapshot='',shareRevision=0;
  const shapeNames={bolt:'Şimşek',heart:'Kalp',star:'Yıldız',triangle:'Üçgen',circle:'Daire',rectangle:'Dikdörtgen',text:'Metin'};
  let yaw=-.48,pitch=.72,rotation=null,frameId=0,started=0,saved=null,inkDirty=true,inkSize={w:800,h:500},modelSize={w:800,h:600};
  // Merge occupied raster cells into flat top rectangles and exposed boundary runs.
  // Empty cells remain holes; interior edges never generate side walls.
  function reliefGeometry(bits,cols,rows,tones=null){
    const tops=[],walls=[],edges=new Map();let active=new Map(),cells=0;
    for(let z=0;z<rows;z++){
      const next=new Map();
      for(let x=0;x<cols;){
        if(!bits[z*cols+x]){x++;continue;}
        const first=x,tone=tones?.[z*cols+x];while(x<cols&&bits[z*cols+x]&&(!tones||tones[z*cols+x]===tone)){cells++;x++;}
        const key=first+':'+x+':'+tone,rect=active.get(key)||(tones?[first,z,x,z+1,tone]:[first,z,x,z+1]);rect[3]=z+1;next.set(key,rect);
      }
      for(const [key,rect] of active)if(!next.has(key))tops.push(rect);
      active=next;
    }
    for(const rect of active.values())tops.push(rect);
    function edge(side,line,at,tone){const key=side+':'+line+(tones?':'+tone:'');if(!edges.has(key))edges.set(key,[]);edges.get(key).push(at);}
    for(let z=0;z<rows;z++)for(let x=0;x<cols;x++)if(bits[z*cols+x]){
      const tone=tones?.[z*cols+x];
      if(x===0||!bits[z*cols+x-1])edge(0,x,z,tone);
      if(x===cols-1||!bits[z*cols+x+1])edge(1,x+1,z,tone);
      if(z===0||!bits[(z-1)*cols+x])edge(2,z,x,tone);
      if(z===rows-1||!bits[(z+1)*cols+x])edge(3,z+1,x,tone);
    }
    for(const [key,values] of edges){
      const [side,line,tone]=key.split(':').map(Number);let start=values[0],end=start+1;
      for(let i=1;i<=values.length;i++){
        if(i<values.length&&values[i]===end){end++;continue;}
        walls.push(tones?[side,line,start,end,tone]:[side,line,start,end]);if(i<values.length){start=values[i];end=start+1;}
      }
    }
    return {tops,walls,cells,cols,rows};
  }
  // A padded silhouette becomes one continuous backing, with a real through-hole.
  function keychainBacking(source,cols,rows,hole){
    const bits=new Uint8Array(source.length),outside=new Uint8Array(source.length),queue=[];
    const disk=(cx,cy,r,value=1)=>{
      for(let y=Math.max(0,Math.floor(cy-r));y<Math.min(rows,Math.ceil(cy+r));y++)
        for(let x=Math.max(0,Math.floor(cx-r));x<Math.min(cols,Math.ceil(cx+r));x++)
          if((x+.5-cx)**2+(y+.5-cy)**2<=r*r)bits[y*cols+x]=value;
    };
    const bridge=(a,b)=>{const steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(let i=0;i<=steps;i++){const t=steps?i/steps:0;disk(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,5);}};
    for(let i=0;i<source.length;i++)if(source[i])disk(i%cols+.5,Math.floor(i/cols)+.5,5);
    if(!bits.some(Boolean))return bits;
    const visit=(x,y)=>{if(x<0||y<0||x>=cols||y>=rows)return;const i=y*cols+x;if(!bits[i]&&!outside[i]){outside[i]=1;queue.push(i);}};
    for(let x=0;x<cols;x++){visit(x,0);visit(x,rows-1);}for(let y=0;y<rows;y++){visit(0,y);visit(cols-1,y);}
    for(let q=0;q<queue.length;q++){const i=queue[q],x=i%cols,y=Math.floor(i/cols);visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
    for(let i=0;i<bits.length;i++)if(!outside[i])bits[i]=1;
    const seen=new Uint8Array(bits.length),groups=[];
    for(let i=0;i<bits.length;i++)if(bits[i]&&!seen[i]){
      const group=[i];seen[i]=1;
      for(let q=0;q<group.length;q++){
        const at=group[q],x=at%cols,y=Math.floor(at/cols);
        for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]])if(nx>=0&&ny>=0&&nx<cols&&ny<rows){const n=ny*cols+nx;if(bits[n]&&!seen[n]){seen[n]=1;group.push(n);}}
      }
      groups.push(group);
    }
    groups.sort((a,b)=>b.length-a.length);const root=groups[0];
    const nearest=(group,p)=>group.reduce((best,i)=>{const d=(i%cols+.5-p[0])**2+(Math.floor(i/cols)+.5-p[1])**2;return d<best.d?{i,d}:best;},{i:group[0],d:Infinity}).i;
    for(const group of groups.slice(1)){
      const center=group.reduce((a,i)=>[a[0]+i%cols+.5,a[1]+Math.floor(i/cols)+.5],[0,0]).map(v=>v/group.length);
      const at=nearest(group,center),p=[at%cols+.5,Math.floor(at/cols)+.5],to=nearest(root,p);
      bridge(p,[to%cols+.5,Math.floor(to/cols)+.5]);root.push(...group);
    }
    const p=[hole[0]*cols,hole[1]*rows],occupied=[];for(let i=0;i<bits.length;i++)if(bits[i])occupied.push(i);
    const to=nearest(occupied,p);bridge(p,[to%cols+.5,Math.floor(to/cols)+.5]);disk(p[0],p[1],9);disk(p[0],p[1],5,0);
    return bits;
  }
  // The drawing becomes a recessed floor. The surrounding material supplies
  // inward-facing cavity walls; the keyring aperture remains a through-hole.
  function engravingGeometry(drawing,base,cols,rows,drawCols=cols,drawRows=rows,offsetX=0,offsetZ=0){
    const shell=new Uint8Array(base.length);
    const isDrawing=(x,y)=>{x+=offsetX;y+=offsetZ;return x>=0&&x<drawCols&&y>=0&&y<drawRows&&!!drawing[y*drawCols+x];};
    for(let i=0;i<base.length;i++)shell[i]=base[i]&&!isDrawing(i%cols,Math.floor(i/cols))?1:0;
    const body=reliefGeometry(base,cols,rows),surface=reliefGeometry(shell,cols,rows),walls=[];
    for(const [side,line,start,end] of surface.walls){
      let from=null;
      for(let at=start;at<=end;at++){
        const drawn=at<end&&isDrawing(side<2?(side===0?line-1:line):at,side<2?at:(side===2?line-1:line));
        if(drawn&&from===null)from=at;
        if(!drawn&&from!==null){walls.push([side,line,from,at]);from=null;}
      }
    }
    const cavity={tops:[],walls,cols,rows};
    for(const geometry of [body,surface,cavity]){geometry.offsetX=offsetX;geometry.offsetZ=offsetZ;}
    return {body,surface,cavity};
  }
  function facePaths(side){return side===face?paths:otherPaths;}
  function faceFinish(side){return side===face?finish:otherFinish;}
  function drawingRaster(items=paths,mirror=false){
    mask.width=COLS;mask.height=ROWS;paintPaths(maskCtx,COLS,ROWS,items);
    const data=maskCtx.getImageData(0,0,COLS,ROWS).data,bits=new Uint8Array(COLS*ROWS),tones=new Uint8Array(COLS*ROWS);
    for(let i=0;i<bits.length;i++){
      if(data[i*4+3]<128)continue;const at=mirror?Math.floor(i/COLS)*COLS+COLS-1-i%COLS:i;bits[at]=1;let distance=Infinity;
      paletteRGB.forEach((rgb,index)=>{const d=rgb.reduce((sum,v,j)=>sum+(v-data[i*4+j])**2,0);if(d<distance){distance=d;tones[at]=index;}});
    }
    return {bits,tones};
  }
  function keyringRaster(){
    const front=drawingRaster(facePaths('front')),back=drawingRaster(facePaths('back'),true);
    const union=front.bits.map((v,i)=>v||back.bits[i]?1:0);
    return {front,back,backingBits:keychainBacking(union,COLS,ROWS,keychain.hole)};
  }
  function mirrorBits(bits){return bits.map((v,i)=>bits[Math.floor(i/COLS)*COLS+COLS-1-i%COLS]);}
  function editingHole(){return [face==='back'?1-keychain.hole[0]:keychain.hole[0],keychain.hole[1]];}
  function paintBacking(context,w,h,bits){
    context.fillStyle='#3b443c';
    for(const [x0,y0,x1,y1] of reliefGeometry(bits,COLS,ROWS).tops)context.fillRect(x0/COLS*w,y0/ROWS*h,(x1-x0)/COLS*w+.3,(y1-y0)/ROWS*h+.3);
  }
  function paintStroke(context,points,width,w,h){
    const first=points[0];if(!first)return;
    context.lineCap='round';context.lineJoin='round';context.lineWidth=width*w;
    context.beginPath();
    if(points.length===1){context.arc(first[0]*w,first[1]*h,width*w/2,0,Math.PI*2);context.fill();return;}
    context.moveTo(first[0]*w,first[1]*h);for(let i=1;i<points.length;i++)context.lineTo(points[i][0]*w,points[i][1]*h);context.stroke();
  }
  function paintItem(context,path,w,h){
    context.strokeStyle=colors[path.color]||colors.Yeşil;context.fillStyle=colors[path.color]||colors.Yeşil;
    if(path.shape==='text'){
      context.save();context.translate(path.center[0]*w,path.center[1]*h);context.scale(w/800,h/500);
      context.rotate((path.angle||0)*Math.PI/180);context.scale(path.scale,path.scale);
      context.font='700 '+path.fontPx+'px Arial, sans-serif';context.textAlign='center';context.textBaseline='middle';context.fillText(path.text,0,0);context.restore();return;
    }
    paintStroke(context,path.points,path.width,w,h);
  }
  function cutPoint(path,p,inverse=false){
    if(!path.shape)return [...p];
    const scale=path.scale||1,angle=(path.angle||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
    if(inverse){const x=(p[0]-path.center[0])/scale,y=(p[1]-path.center[1])/scale;return [x*c+y*s/1.6,-x*s*1.6+y*c];}
    return [path.center[0]+(p[0]*c-p[1]*s/1.6)*scale,path.center[1]+(p[0]*s*1.6+p[1]*c)*scale];
  }
  function paintPaths(context,w,h,items=paths){
    context.clearRect(0,0,w,h);context.globalCompositeOperation='source-over';
    for(const path of items){
      if(path.tool==='eraser')continue;
      if(!path.cuts?.length){paintItem(context,path,w,h);continue;}
      if(cutLayer.width!==w)cutLayer.width=w;if(cutLayer.height!==h)cutLayer.height=h;
      cutCtx.clearRect(0,0,w,h);cutCtx.globalCompositeOperation='source-over';paintItem(cutCtx,path,w,h);
      cutCtx.globalCompositeOperation='destination-out';cutCtx.strokeStyle='#000';cutCtx.fillStyle='#000';
      for(const cut of path.cuts)paintStroke(cutCtx,cut.points.map(p=>cutPoint(path,p)),cut.width*(path.shape?path.scale:1),w,h);
      cutCtx.globalCompositeOperation='source-over';context.drawImage(cutLayer,0,0);
    }
  }
  function drawGrid(context,w,h){
    context.fillStyle='#0d130f';context.fillRect(0,0,w,h);context.fillStyle='#c7fa5f1b';
    for(let x=15;x<w;x+=22)for(let y=15;y<h;y+=22)context.fillRect(x,y,1,1);
  }
  function paintInk(){
    const {w,h,dpr}=inkSize;inkCtx.setTransform(dpr,0,0,dpr,0,0);drawGrid(inkCtx,w,h);
    if(keychain.enabled){const {backingBits}=keyringRaster();paintBacking(inkCtx,w,h,face==='back'?mirrorBits(backingBits):backingBits);}
    paintPaths(strokeCtx,strokeBuffer.width,strokeBuffer.height);
    inkCtx.drawImage(strokeBuffer,0,0,w,h);
    if(keychain.enabled){
      const hole=editingHole();inkCtx.save();inkCtx.fillStyle='#0d130f';inkCtx.beginPath();inkCtx.arc(hole[0]*w,hole[1]*h,5/COLS*w,0,Math.PI*2);inkCtx.fill();
      inkCtx.strokeStyle=tool==='hole'?'#f3f1ec':'#c7fa5f';inkCtx.lineWidth=1.5;inkCtx.setLineDash([3,3]);inkCtx.beginPath();inkCtx.arc(hole[0]*w,hole[1]*h,9/COLS*w,0,Math.PI*2);inkCtx.stroke();inkCtx.restore();
    }
    if(selected&&tool==='move'){
      const b=bounds(selected);inkCtx.save();inkCtx.strokeStyle='#efffd7';inkCtx.lineWidth=1;inkCtx.setLineDash([5,4]);
      inkCtx.strokeRect(b.x*w-5,b.y*h-5,b.w*w+10,b.h*h+10);inkCtx.restore();
    }
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
  function renderModel(context,w,h,value=progress,clearCanvas=true,side=modelFace){
    if(clearCanvas)context.clearRect(0,0,w,h);
    const engraved=mesh?.finish==='engrave',frame=mesh?.backing?.frame,viewPitch=frame?limit(pitch+.4,.32,1.35):engraved?limit(pitch+.22,.32,1.35):pitch;
    const underside=!!mesh?.backing&&side==='back',angle=yaw+(underside?Math.PI:0);
    const unit=Math.min(w/4.9,h/3.65)*(frame?limit(3/Math.hypot(frame.w,frame.h),.85,1.7):1),cy=Math.cos(angle),sy=Math.sin(angle),cp=Math.cos(viewPitch),sp=Math.sin(viewPitch)*(underside?-1:1);
    const relief=mesh?.reliefHeight??.38;
    const baseH=Math.min(.15,(.15+relief)*value),raised=Math.max(0,(.15+relief)*value-.15);
    const project=v=>{
      const vx=v[0]-(frame?.x||0),vz=v[2]-(frame?.z||0),x=vx*cy+vz*sy,z=-vx*sy+vz*cy,y=v[1]-.18,depth=z*cp+y*sp,f=7/(7-depth);
      return {x:w/2+x*f*unit,y:h/2+(-y*cp+z*sp)*f*unit,depth};
    };
    const facing=n=>(-n[0]*sy+n[2]*cy)*cp+n[1]*sp;
    const light=n=>.55+.50*Math.max(0,(n[0]*cy+n[2]*sy)*-.35+n[1]*(underside?-.8:.8)+(-n[0]*sy+n[2]*cy)*.6);
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
    const bx=1.85,bz=1.16,base=[59,68,60],baseFaces=mesh?.backing||engraved?[]:[
      polygon([[-bx,baseH,-bz],[bx,baseH,-bz],[bx,baseH,bz],[-bx,baseH,bz]],[0,1,0],base),
      polygon([[-bx,0,-bz],[-bx,baseH,-bz],[-bx,baseH,bz],[-bx,0,bz]],[-1,0,0],base,true),
      polygon([[bx,0,bz],[bx,baseH,bz],[bx,baseH,-bz],[bx,0,-bz]],[1,0,0],base,true),
      polygon([[bx,0,-bz],[bx,baseH,-bz],[-bx,baseH,-bz],[-bx,0,-bz]],[0,0,-1],base,true),
      polygon([[-bx,0,bz],[-bx,baseH,bz],[bx,baseH,bz],[bx,0,bz]],[0,0,1],base,true)
    ].filter(Boolean);
    baseFaces.sort((a,b)=>a.depth-b.depth).forEach(paint);
    if(!mesh)return;
    const x=v=>(v/mesh.cols-.5)*3.2,z=v=>(v/mesh.rows-.5)*2,top=.15+raised,material=rgb(colors[color]),faces=[];
    function layer(geometry,bottom,height,baseColor,{tops=true,walls=true,tint=1,flip=false,origin=0}={}){
      const gx=v=>x(v+(geometry.offsetX||0)),gz=v=>z(v+(geometry.offsetZ||0));
      const toneColor=tone=>(baseColor||paletteRGB[tone]||material).map(v=>v*tint);
      const fy=v=>flip?origin-v:v;
      if(tops)for(const [x0,z0,x1,z1,tone] of geometry.tops)faces.push(polygon([[gx(x0),fy(height),gz(z0)],[gx(x1),fy(height),gz(z0)],[gx(x1),fy(height),gz(z1)],[gx(x0),fy(height),gz(z1)]],[0,flip?-1:1,0],toneColor(tone)));
      if(walls)for(const [side,line,start,end,tone] of geometry.walls){
        let a,b,normal;
        if(side<2){a=[gx(line),bottom,gz(start)];b=[gx(line),bottom,gz(end)];normal=[side===0?-1:1,0,0];}
        else{a=[gx(start),bottom,gz(line)];b=[gx(end),bottom,gz(line)];normal=[0,0,side===2?-1:1];}
        const vertices=[a,[a[0],height,a[2]],[b[0],height,b[2]],b].map(v=>[v[0],fy(v[1]),v[2]]);
        const face=polygon(vertices,normal,toneColor(tone),true);if(face)faces.push(face);
      }
    }
    function flushLayer(){faces.filter(Boolean).sort((a,b)=>a.depth-b.depth).forEach(paint);faces.length=0;}
    if(mesh.backing){
      // Each visible face has parallel surface planes. Paint by physical layer,
      // so merged long walls cannot incorrectly stripe across lettering.
      const bodyHeight=engraved?.27*value:baseH;
      layer(engraved?mesh.engraving.body:mesh.backing,0,bodyHeight,base,{tops:false});flushLayer();
      if(!underside){
        if(engraved){
          layer(mesh,.10*value,.10*value,null,{walls:false,tint:.72});flushLayer();
          layer(mesh.engraving.cavity,.10*value,bodyHeight,base,{tint:.72});flushLayer();
          layer(mesh.engraving.surface,bodyHeight,bodyHeight,base,{walls:false});flushLayer();
        }else{
          layer(mesh.backing,baseH,baseH,base,{walls:false});flushLayer();
          if(raised>0){layer(mesh,.15,top,null,{tops:false});flushLayer();layer(mesh,top,top,null,{walls:false});flushLayer();}
        }
      }
    }else if(engraved){
      const floor=.10*value,surface=.27*value;
      layer(mesh.engraving.body,0,surface,base,{tops:false});
      if(!underside){
        layer(mesh.engraving.surface,surface,surface,base,{walls:false});
        layer(mesh.engraving.cavity,floor,surface,base,{tint:.72});
        layer(mesh,floor,floor,null,{walls:false,tint:.72});
      }
    }else{
      if(mesh.backing)layer(mesh.backing,0,baseH,base,{tops:!underside});
      if(raised>0&&!underside)layer(mesh,.15,top,null);
    }
    if(mesh.backing&&underside){
      const rear=mesh.back,bodyHeight=engraved?.27*value:baseH;
      if(rear?.finish==='engrave'){
        const floor=Math.min(.10,bodyHeight*.38),surface=bodyHeight;
        layer(rear,floor,floor,null,{walls:false,tint:.72,flip:true,origin:bodyHeight});flushLayer();
        layer(rear.engraving.cavity,floor,surface,base,{tint:.72,flip:true,origin:bodyHeight});flushLayer();
        layer(rear.engraving.surface,surface,surface,base,{walls:false,flip:true,origin:bodyHeight});flushLayer();
      }else{
        layer(mesh.backing,0,0,base,{walls:false,flip:true});flushLayer();
        if(rear?.cells&&value>0){layer(rear,0,.12*value,null,{flip:true,tops:false});flushLayer();layer(rear,.12*value,.12*value,null,{flip:true,walls:false});flushLayer();}
      }
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
    const allPaths=keychain.enabled?[...paths,...otherPaths]:paths;
    undo.disabled=!history.length;clear.disabled=!paths.length&&!otherPaths.length;empty.hidden=!!paths.length||keychain.enabled;
    buildButton.disabled=!allPaths.some(p=>p.tool==='pen')||!!activeStroke||!!transform||building;
    syncSelection();
    dialog.querySelectorAll('[data-sketch-finish]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.sketchFinish===finish));b.disabled=!!activeStroke||!!transform||building;});
    if(finishHelp)finishHelp.textContent=finish==='engrave'?'Tasarımın tabanın içine işlensin.':'Tasarımın tabanın üzerinde yükselsin.';
    if(keyToggle){keyToggle.disabled=(!keychain.enabled&&!paths.some(p=>p.tool==='pen'))||!!activeStroke||!!transform;keyToggle.setAttribute('aria-pressed',String(keychain.enabled));keyToggle.textContent=keychain.enabled?'PLAKAYA DÖN':'ANAHTARLIĞA ÇEVİR';}
    if(faceControls)faceControls.hidden=!keychain.enabled;if(modelFaces)modelFaces.hidden=!keychain.enabled;
    dialog.querySelectorAll('[data-sketch-face]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.sketchFace===face));b.disabled=!!activeStroke||!!transform||building;});
    dialog.querySelectorAll('[data-sketch-model-face]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sketchModelFace===modelFace)));
    ink.setAttribute('aria-label',(keychain.enabled?(face==='back'?'Arka':'Ön')+' yüz çizim alanı. ':'Çizim alanı. ')+'Taşı modunda şekli sürükle veya ok tuşlarıyla taşı.');
    if(keyControls)keyControls.hidden=!keychain.enabled;
    if(holeMove)holeMove.setAttribute('aria-pressed',String(tool==='hole'));
    const hole=editingHole();if(holeX)holeX.value=Math.round(hole[0]*100);if(holeY)holeY.value=Math.round(hole[1]*100);
    const visibleFinish=keychain.enabled?faceFinish(modelFace):finish;
    if(productLabel)productLabel.textContent=(visibleFinish==='engrave'?'OYMA · ':'')+(keychain.enabled?'ANAHTARLIK · '+(modelFace==='back'?'ARKA YÜZ':'ÖN YÜZ'):'3B TASLAK');
    const ready=!!mesh&&!changed&&!building;
    download.disabled=!ready;quote.setAttribute('aria-disabled',String(!ready));quote.setAttribute('tabindex',ready?'0':'-1');
    if(ready){
      const snapshot=JSON.stringify({v:1,p:facePaths('front'),b:keychain.enabled?facePaths('back'):[],f:faceFinish('front'),r:keychain.enabled?faceFinish('back'):'raised',k:keychain.enabled?keychain.hole:false,c:color,s:keychain.enabled?modelFace:'front'});
      if(snapshot!==shareSnapshot){
        shareSnapshot=snapshot;shareUrl='';
        try{const url=new URL('./',window.location.href);url.search='';url.hash='tasarim='+packDraft(snapshot);shareUrl=url.href;}
        catch{if(shareStatus)shareStatus.textContent='Çizimin link için çok ayrıntılı. Taslağı PNG olarak indirebilirsin.';}
      }
    }else{shareUrl='';shareSnapshot='';}
    if(share)share.disabled=!ready||!shareUrl;
    if(ready){
      const styles=keychain.enabled?'Ön yüz: '+finishName(faceFinish('front'))+' · Arka yüz: '+(facePaths('back').length?finishName(faceFinish('back')):'Boş'):finishName(finish);
      const text=['Merhaba KATMANYA, kendi çizimimden '+(keychain.enabled?(facePaths('back').length?'çift taraflı ':'')+'bir anahtarlık':finish==='engrave'?'oymalı bir plaka':'kabartmalı bir plaka')+' için teklif almak istiyorum.','Renk tercihi: '+usedColors(),'Baskı tarzı: '+styles,shareUrl?'Tasarım bağlantısı: '+shareUrl:'Taslağımı sohbete ekleyeceğim.','Ölçü ve adet bilgisini birlikte netleştirelim.'].join('\n');
      quote.href='https://wa.me/905304815341?text='+encodeURIComponent(text);
    }else quote.removeAttribute('href');
  }
  function markChanged(){
    changed=true;building=false;progress=1;inkDirty=true;
    shareRevision++;if(shareStatus)shareStatus.textContent='';if(shareInput){shareInput.hidden=true;shareInput.value='';}
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
  function remember(){history.push({paths:JSON.parse(JSON.stringify(paths)),otherPaths:JSON.parse(JSON.stringify(otherPaths)),otherFinish,face,index:paths.indexOf(selected),keychain:JSON.parse(JSON.stringify(keychain)),finish});if(history.length>100)history.shift();}
  function bounds(path){const xs=path.points.map(p=>p[0]),ys=path.points.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
  function syncSelection(){
    if(selected&&!paths.includes(selected))selected=null;
    if(deleteSelected)deleteSelected.disabled=!selected||!!activeStroke||!!transform;
    if(selected&&tool==='move')color=selected.color||'Yeşil';
    dialog.querySelectorAll('[data-sketch-color]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sketchColor===color)));
    if(shapeSelect){
      shapeSelect.innerHTML='<option value="">Şekil seç</option>'+paths.map((p,i)=>p.shape?'<option value="'+i+'">'+shapeNames[p.shape]+' · '+(i+1)+'</option>':'').join('');
      shapeSelect.value=selected?String(paths.indexOf(selected)):'';shapeSelect.disabled=!paths.some(p=>p.shape);
    }
    if(shapeSize){shapeSize.disabled=!selected;shapeSize.value=selected?Math.round(selected.scale*100):100;}
    if(shapePercent)shapePercent.textContent=selected?Math.round(selected.scale*100)+'%':'—';
    if(shapeAngle){shapeAngle.disabled=!selected;shapeAngle.value=selected?(selected.angle||0):0;}
    if(angleValue)angleValue.textContent=selected?(selected.angle||0)+'°':'—';
  }
  function chooseTool(value){
    tool=value;ink.classList.toggle('is-eraser',tool==='eraser');ink.classList.toggle('is-moving',tool==='move'||tool==='hole');
    dialog.querySelectorAll('[data-sketch-tool]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sketchTool===tool)));
    if(holeMove)holeMove.setAttribute('aria-pressed',String(tool==='hole'));syncSelection();inkDirty=true;requestPaint();
  }
  function moveHole(p){keychain.hole=[limit(face==='back'?1-p[0]:p[0],.07,.93),limit(p[1],.1,.9)];markChanged();}
  function swapFace(next){
    if(next===face)return;[paths,otherPaths]=[otherPaths,paths];[finish,otherFinish]=[otherFinish,finish];face=next;
    selected=null;sizeGesture=false;holeGesture=false;if(tool==='hole')chooseTool('move');inkDirty=true;
  }
  function switchFace(next){
    if(!keychain.enabled||activeStroke||transform||building||!['front','back'].includes(next))return;
    swapFace(next);modelFace=next;updateActions();setView('draw');requestPaint();
  }
  function toggleKeychain(){
    if(activeStroke||transform||(!keychain.enabled&&!paths.some(p=>p.tool==='pen')))return;remember();swapFace('front');modelFace='front';keychain.enabled=!keychain.enabled;
    if(keychain.enabled){
      const {bits}=drawingRaster();let top=ROWS,x=0,count=0;
      for(let i=0;i<bits.length;i++)if(bits[i]){const y=Math.floor(i/COLS);if(y<top){top=y;x=0;count=0;}if(y===top){x+=i%COLS+.5;count++;}}
      if(count)keychain.hole=[limit(x/count/COLS,.07,.93),limit((top-8)/ROWS,.1,.9)];chooseTool('hole');
    }else if(tool==='hole')chooseTool('move');
    markChanged();setView('draw');
  }
  function finishName(value){return value==='engrave'?'Oyma':'Kabartma';}
  function usedColors(){return [...new Set((keychain.enabled?[...paths,...otherPaths]:paths).filter(p=>p.tool!=='eraser').map(p=>p.color||'Yeşil'))].join(' / ')||color;}
  function removeSelected(){
    if(!selected||activeStroke||transform)return;const index=paths.indexOf(selected);if(index<0)return;
    remember();paths.splice(index,1);selected=null;sizeGesture=false;markChanged();
  }
  function fitShape(path,scale=path.scale){
    const radians=(path.angle||0)*Math.PI/180,c=Math.cos(radians),s=Math.sin(radians);
    const base=path.base.map(p=>[p[0]*c-p[1]*s/1.6,p[0]*s*1.6+p[1]*c]);
    const xs=base.map(p=>p[0]),ys=base.map(p=>p[1]),bw=Math.max(...xs)-Math.min(...xs),bh=Math.max(...ys)-Math.min(...ys);
    path.scale=limit(scale,.25,Math.min(1.5,.96/(bw+.024),.96/(bh+.0384)));
    const rx=(bw+.024)*path.scale/2,ry=(bh+.0384)*path.scale/2;
    path.center=[limit(path.center[0],.02+rx,.98-rx),limit(path.center[1],.02+ry,.98-ry)];
    path.points=base.map(p=>[path.center[0]+p[0]*path.scale,path.center[1]+p[1]*path.scale]);path.width=.024*path.scale;
  }
  function beginStroke(event){
    if(activeStroke||transform||event.button!==0)return;
    if(tool==='hole'&&keychain.enabled){
      remember();transform={id:event.pointerId,kind:'hole',saved:true};ink.setPointerCapture(event.pointerId);ink.focus({preventScroll:true});moveHole(point(event));event.preventDefault();return;
    }
    if(tool==='move'){
      const p=point(event),r=ink.getBoundingClientRect(),pad=14/r.width;
      selected=[...paths].reverse().find(path=>{if(!path.shape)return false;const b=bounds(path);return p[0]>=b.x-pad&&p[0]<=b.x+b.w+pad&&p[1]>=b.y-pad*1.6&&p[1]<=b.y+b.h+pad*1.6;})||null;
      if(selected){transform={id:event.pointerId,start:p,center:[...selected.center],saved:false};ink.setPointerCapture(event.pointerId);ink.focus({preventScroll:true});}
      syncSelection();updateActions();inkDirty=true;requestPaint();event.preventDefault();return;
    }
    if(tool==='eraser'&&!paths.some(p=>p.tool==='pen'))return;
    remember();
    const width=limit(Number(brush.value)||4,2,9)*.006*(tool==='eraser'?2:1);
    const first=point(event);activeStroke={id:event.pointerId,path:{tool,width,color,points:[first]},targets:[]};
    if(tool==='eraser'){
      for(const path of paths.filter(p=>p.tool==='pen')){
        const cut={width:width/(path.shape?path.scale:1),points:[cutPoint(path,first,true)]};
        (path.cuts??=[]).push(cut);activeStroke.targets.push({path,cut});
      }
    }else paths.push(activeStroke.path);
    ink.setPointerCapture(event.pointerId);markChanged();event.preventDefault();
  }
  function moveStroke(event){
    if(transform?.id===event.pointerId){
      if(transform.kind==='hole'){moveHole(point(event));event.preventDefault();return;}
      const p=point(event),dx=p[0]-transform.start[0],dy=p[1]-transform.start[1];
      if(Math.hypot(dx,dy)>.001){if(!transform.saved){remember();transform.saved=true;}selected.center=[transform.center[0]+dx,transform.center[1]+dy];fitShape(selected);markChanged();}
      event.preventDefault();return;
    }
    if(activeStroke?.id!==event.pointerId)return;
    const samples=typeof event.getCoalescedEvents==='function'?event.getCoalescedEvents():[event];
    for(const sample of samples.length?samples:[event]){
      const p=point(sample),last=activeStroke.path.points.at(-1);
      if(Math.hypot(p[0]-last[0],p[1]-last[1])>.001){
        activeStroke.path.points.push(p);for(const target of activeStroke.targets)target.cut.points.push(cutPoint(target.path,p,true));
      }
    }
    inkDirty=true;requestPaint();event.preventDefault();
  }
  function endStroke(event){
    if(transform?.id===event.pointerId){
      if(event.type==='pointerup')moveStroke(event);transform=null;
      if(ink.hasPointerCapture(event.pointerId))ink.releasePointerCapture(event.pointerId);updateActions();return;
    }
    if(activeStroke?.id!==event.pointerId)return;
    if(event.type==='pointerup')moveStroke(event);
    activeStroke=null;if(ink.hasPointerCapture(event.pointerId))ink.releasePointerCapture(event.pointerId);
    updateActions();inkDirty=true;requestPaint();
  }
  function preset(name){
    let pts=[];
    if(name==='bolt')pts=[[.56,.16],[.29,.53],[.48,.53],[.43,.86],[.72,.42],[.53,.42],[.56,.16]];
    if(name==='heart')for(let i=0;i<=100;i++){const t=i/100*Math.PI*2;pts.push([.5+Math.pow(Math.sin(t),3)*.30,.47-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.023]);}
    if(name==='star')for(let i=0;i<=10;i++){const t=-Math.PI/2+i*Math.PI/5,r=i%2?.10:.225;pts.push([.5+Math.cos(t)*r,.5+Math.sin(t)*r*1.6]);}
    if(name==='triangle')pts=[[.5,.12],[.75,.813],[.25,.813],[.5,.12]];
    if(name==='circle')for(let i=0;i<=100;i++){const t=i/100*Math.PI*2;pts.push([.5+Math.cos(t)*.20,.5+Math.sin(t)*.32]);}
    if(name==='rectangle')pts=[[.22,.23],[.78,.23],[.78,.77],[.22,.77],[.22,.23]];
    if(!pts.length)return;
    remember();const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
    selected={tool:'pen',width:.024,color,points:pts,shape:name,base:pts.map(p=>[p[0]-cx,p[1]-cy]),center:[cx,cy],scale:1};
    paths.push(selected);chooseTool('move');markChanged();setView('draw');
  }
  function build(){
    if(activeStroke||transform||building)return;
    let {bits,tones}=drawingRaster();let backing=null,backingBits=null,rear=null;
    if(keychain.enabled){
      const raster=keyringRaster();bits=raster.front.bits;tones=raster.front.tones;backingBits=raster.backingBits;
      for(const side of [raster.front,raster.back])for(let i=0;i<side.bits.length;i++)if(!backingBits[i])side.bits[i]=0;
      backing=reliefGeometry(backingBits,COLS,ROWS);rear=reliefGeometry(raster.back.bits,COLS,ROWS,raster.back.tones);
      rear.finish=faceFinish('back');if(rear.finish==='engrave')rear.engraving=engravingGeometry(raster.back.bits,backingBits,COLS,ROWS);
      if(backing.cells){const xs=backing.tops.flatMap(r=>[r[0],r[2]]),ys=backing.tops.flatMap(r=>[r[1],r[3]]),left=Math.min(...xs),right=Math.max(...xs),front=Math.min(...ys),back=Math.max(...ys);
        backing.frame={x:((left+right)/2/COLS-.5)*3.2,z:((front+back)/2/ROWS-.5)*2,w:(right-left)/COLS*3.2,h:(back-front)/ROWS*2};}
    }
    const result=reliefGeometry(bits,COLS,ROWS,tones);
    if(!result.cells&&!rear?.cells){mesh=null;changed=true;status.textContent='Çizim boş · bir şekil çiz';updateActions();requestPaint();return;}
    result.reliefHeight=keychain.enabled||paths.some(p=>p.shape==='text')?.12:.38;
    if(backing){result.backing=backing;result.backingBits=backingBits;}
    result.finish=keychain.enabled?faceFinish('front'):finish;result.back=rear;
    if(result.finish==='engrave')result.engraving=backingBits?engravingGeometry(bits,backingBits,COLS,ROWS):engravingGeometry(bits,new Uint8Array((COLS+24)*(ROWS+16)).fill(1),COLS+24,ROWS+16,COLS,ROWS,-12,-8);
    mesh=result;changed=false;building=true;progress=0;started=performance.now();updateActions();setView('preview');requestPaint();
    if(window.innerWidth<=800)preview.focus({preventScroll:true});
  }
  function addText(){
    const text=textInput?.value.trim().slice(0,32);if(!text||activeStroke||transform)return;
    strokeCtx.font='700 64px Arial, sans-serif';const measured=strokeCtx.measureText(text).width;
    const fontPx=Math.min(64,560/Math.max(measured,1)*64),bw=measured*fontPx/64/800,bh=fontPx/500;
    remember();selected={tool:'pen',width:.024,color,shape:'text',text,fontPx,center:[.5,.5],scale:1,angle:0,base:[[-bw/2,-bh/2],[bw/2,-bh/2],[bw/2,bh/2],[-bw/2,bh/2]],points:[]};
    fitShape(selected);paths.push(selected);chooseTool('move');markChanged();setView('draw');textInput.blur?.();
  }
  function rotate(direction){
    if(direction==='reset'){yaw=-.48;pitch=.72;}else yaw+=direction==='left'?-.25:.25;
    requestPaint();
  }
  // Self-contained UTF-8 LZSS links. No upload or browser-local ID is needed.
  // Both encoded and expanded sizes are bounded before accepting external data.
  function packDraft(json){
    if(json.length>256000)throw Error('draft-size');validateDraft(JSON.parse(json));
    const bytes=new TextEncoder().encode(json);if(bytes.length>256000)throw Error('draft-size');
    const out=[],positions=new Map();let at=0;
    const key=i=>(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2];
    const rememberAt=i=>{if(i+2>=bytes.length)return;const k=key(i),list=positions.get(k)||[];list.push(i);if(list.length>24)list.shift();positions.set(k,list);};
    while(at<bytes.length){
      const flagAt=out.length;out.push(0);let flags=0;
      for(let token=0;token<8&&at<bytes.length;token++){
        let length=0,distance=0;
        if(at+2<bytes.length)for(const pos of (positions.get(key(at))||[]).slice().reverse()){
          const offset=at-pos;if(offset>4095)break;let n=0;
          while(n<18&&at+n<bytes.length&&bytes[pos+n]===bytes[at+n])n++;
          if(n>length&&n>=3){length=n;distance=offset;if(n===18)break;}
        }
        if(length>=3){flags|=1<<token;out.push(distance>>4,((distance&15)<<4)|(length-3));}
        else{length=1;out.push(bytes[at]);}
        for(let i=0;i<length;i++)rememberAt(at+i);at+=length;
      }
      out[flagAt]=flags;if(out.length>12000)throw Error('link-size');
    }
    let binary='';for(let i=0;i<out.length;i+=8192)binary+=String.fromCharCode(...out.slice(i,i+8192));
    const token='1.'+btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    if(token.length>12000)throw Error('link-size');return token;
  }
  function unpackDraft(token){
    if(typeof token!=='string'||token.length>12000||!/^1\.[A-Za-z0-9_-]+$/.test(token))throw Error('link-format');
    const binary=atob(token.slice(2).replace(/-/g,'+').replace(/_/g,'/')),out=new Uint8Array(256000);let at=0,size=0;
    while(at<binary.length){
      const flags=binary.charCodeAt(at++);
      for(let bit=0;bit<8&&at<binary.length;bit++){
        if(flags&(1<<bit)){
          if(at+1>=binary.length)throw Error('link-truncated');const a=binary.charCodeAt(at++),b=binary.charCodeAt(at++),distance=(a<<4)|(b>>4),length=(b&15)+3;
          if(!distance||distance>size||size+length>out.length)throw Error('link-offset');
          for(let i=0;i<length;i++){out[size]=out[size-distance];size++;}
        }else{if(size>=out.length)throw Error('draft-size');out[size++]=binary.charCodeAt(at++);}
      }
    }
    return validateDraft(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(out.subarray(0,size))));
  }
  function validateDraft(data){
    if(!data||data.v!==1||!Array.isArray(data.p)||!Array.isArray(data.b)||data.p.length+data.b.length>200)throw Error('draft-format');
    let pointCount=0,cutCount=0;
    const number=(v,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)throw Error('draft-number');return v;};
    const point=(v,min=0,max=1)=>{if(!Array.isArray(v)||v.length!==2)throw Error('draft-point');return v.map(n=>number(n,min,max));};
    const points=(v,min=0,max=1)=>{if(!Array.isArray(v)||!v.length||v.length>8000||(pointCount+=v.length)>20000)throw Error('draft-points');return v.map(p=>point(p,min,max));};
    const palette=['Yeşil','Beyaz','Mavi','Siyah'],shapes=['bolt','heart','star','triangle','circle','rectangle','text'];
    const cleanPath=p=>{
      if(!p||p.tool!=='pen'||!palette.includes(p.color))throw Error('draft-path');
      const path={tool:'pen',width:number(p.width,.000001,1),color:p.color,points:points(p.points)};
      if(p.shape!==undefined){
        if(!shapes.includes(p.shape))throw Error('draft-shape');path.shape=p.shape;path.base=points(p.base,-1,1);path.center=point(p.center);path.scale=number(p.scale,.25,1.5);
        if(p.angle!==undefined)path.angle=number(p.angle,-180,180);
        if(p.shape==='text'){if(typeof p.text!=='string'||!p.text.length||p.text.length>32)throw Error('draft-text');path.text=p.text;path.fontPx=number(p.fontPx,.01,64);}
      }
      if(p.cuts!==undefined){
        if(!Array.isArray(p.cuts)||(cutCount+=p.cuts.length)>1000)throw Error('draft-cuts');
        path.cuts=p.cuts.map(c=>({width:number(c?.width,.000001,1),points:points(c?.points,-8,8)}));
      }
      return path;
    };
    if(!['raised','engrave'].includes(data.f)||!['raised','engrave'].includes(data.r)||!palette.includes(data.c)||!['front','back'].includes(data.s))throw Error('draft-style');
    const hole=data.k===false?false:point(data.k);if(hole){number(hole[0],.07,.93);number(hole[1],.1,.9);}
    const front=data.p.map(cleanPath),back=data.b.map(cleanPath);
    if(!(hole?[...front,...back]:front).length)throw Error('draft-empty');
    return {v:1,p:front,b:back,f:data.f,r:data.r,k:hole,c:data.c,s:hole?data.s:'front'};
  }
  async function copyDraftLink(){
    if(!shareUrl||changed||building)return;const link=shareUrl,revision=shareRevision;
    try{if(!navigator.clipboard?.writeText)throw Error('clipboard');await navigator.clipboard.writeText(link);if(revision===shareRevision&&shareStatus)shareStatus.textContent='Link kopyalandı ✓ Açan kişi tasarımını hazır görecek.';}
    catch{if(revision!==shareRevision)return;if(shareInput){shareInput.hidden=false;shareInput.value=link;shareInput.focus();shareInput.select();}if(shareStatus)shareStatus.textContent='Bağlantıyı aşağıdan seçip kopyalayabilirsin.';}
  }
  function loadSharedDraft(){
    if(!window.location.hash.startsWith('#tasarim='))return;
    try{
      const data=unpackDraft(window.location.hash.slice(9));if(paths.length||otherPaths.length)remember();
      paths=data.p;otherPaths=data.b;finish=data.f;otherFinish=data.r;face='front';modelFace=data.s;color=data.c;keychain={enabled:!!data.k,hole:data.k||[.5,.1]};
      selected=null;activeStroke=null;transform=null;sizeGesture=false;holeGesture=false;mesh=null;building=false;changed=true;yaw=-.48;pitch=.72;
      if(data.s==='back')swapFace('back');chooseTool('pen');markChanged();open();build();
      if(mesh){progress=1;building=false;status.textContent='Paylaşılan tasarım hazır';updateActions();requestPaint();}
    }catch{open();if(shareStatus)shareStatus.textContent='Bu tasarım bağlantısı açılamadı. Yeni bir çizim oluşturabilir veya bağlantıyı tekrar isteyebilirsin.';}
  }
  async function exportDraft(){
    if(!mesh||changed||building)return;
    const sheet=document.createElement('canvas');sheet.width=1600;sheet.height=1000;const c=sheet.getContext('2d');
    c.fillStyle='#111713';c.fillRect(0,0,1600,1000);
    c.font='800 37px Manrope, sans-serif';c.fillStyle='#c7fa5f';c.fillText('KATMANYA',64,73);
    c.font='13px monospace';c.fillStyle='#a9b69e';c.fillText('SENİN ÇİZGİN / '+(keychain.enabled?'ANAHTARLIK · ÖN / ARKA':(finish==='engrave'?'OYMA PLAKA':'KABARTMALI PLAKA'))+' TASLAĞI',64,112);
    c.strokeStyle='#c7fa5f35';c.beginPath();c.moveTo(64,143);c.lineTo(1536,143);c.stroke();
    if(keychain.enabled){
      c.font='17px Manrope, sans-serif';c.fillStyle='#a9b69e';c.fillText('Renk tercihi: '+usedColors(),64,184);
      for(const [side,y] of [['front',244],['back',558]]){
        const items=facePaths(side),hole=[side==='back'?1-keychain.hole[0]:keychain.hole[0],keychain.hole[1]];
        c.font='14px monospace';c.fillStyle='#c7fa5f';c.fillText((side==='front'?'01 / ÖN YÜZ':'02 / ARKA YÜZ')+' · '+(items.length?finishName(faceFinish(side)):'Boş'),64,y-22);
        const flat=document.createElement('canvas');flat.width=640;flat.height=400;const fc=flat.getContext('2d');drawGrid(fc,640,400);
        paintBacking(fc,640,400,side==='back'?mirrorBits(mesh.backingBits):mesh.backingBits);
        const art=document.createElement('canvas');art.width=640;art.height=400;paintPaths(art.getContext('2d'),640,400,items);fc.drawImage(art,0,0);
        fc.fillStyle='#0d130f';fc.beginPath();fc.arc(hole[0]*640,hole[1]*400,20,0,Math.PI*2);fc.fill();
        c.drawImage(flat,64,y,384,240);c.strokeStyle='#c7fa5f35';c.strokeRect(64,y,384,240);
        c.save();c.translate(590,y-28);renderModel(c,916,310,1,false,side);c.restore();
      }
    }else{
    c.font='13px monospace';c.fillStyle='#c7fa5f';c.fillText('01 / ÇİZİMİN',64,197);c.fillText('02 / 3B TASLAĞIN',800,197);
    const flat=document.createElement('canvas');flat.width=640;flat.height=400;const flatCtx=flat.getContext('2d');drawGrid(flatCtx,640,400);
    if(mesh.backing){const {bits}=drawingRaster();paintBacking(flatCtx,640,400,keychainBacking(bits,COLS,ROWS,keychain.hole));}
    const lines=document.createElement('canvas');lines.width=640;lines.height=400;paintPaths(lines.getContext('2d'),640,400);flatCtx.drawImage(lines,0,0);
    if(mesh.backing){flatCtx.fillStyle='#0d130f';flatCtx.beginPath();flatCtx.arc(keychain.hole[0]*640,keychain.hole[1]*400,20,0,Math.PI*2);flatCtx.fill();}
    c.drawImage(flat,64,240);c.strokeStyle='#c7fa5f35';c.strokeRect(64,240,640,400);
    c.save();c.translate(780,220);renderModel(c,756,560,1,false);c.restore();
    c.fillStyle='#a9b69e';c.font='17px Manrope, sans-serif';c.fillText('Renk tercihi: '+usedColors(),64,716);
    c.font='14px Manrope, sans-serif';c.fillText('Baskı tarzı: '+(finish==='engrave'?'Oyma':'Kabartma'),64,753);c.fillText('Baskı için ölçü ve adedi birlikte netleştirelim.',64,790);
    }
    c.strokeStyle='#c7fa5f35';c.beginPath();c.moveTo(64,863);c.lineTo(1536,863);c.stroke();
    c.fillStyle='#c7fa5f';c.font='18px monospace';c.fillText('katmanya.com',64,921);
    const blob=await new Promise(resolve=>sheet.toBlob(resolve,'image/png'));if(!blob)return;
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='katmanya-cizim-taslagi.png';
    if(keychain.enabled)link.download=facePaths('back').length?'katmanya-cift-tarafli-anahtarlik-taslagi.png':faceFinish('front')==='engrave'?'katmanya-oyma-anahtarlik-taslagi.png':'katmanya-anahtarlik-taslagi.png';
    else if(finish==='engrave')link.download='katmanya-oyma-plaka-taslagi.png';
    document.body.append(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function open(){
    if(dialog.open)return;
    saved={scrollY:window.scrollY,body:{position:document.body.style.position,top:document.body.style.top,width:document.body.style.width}};
    document.body.style.position='fixed';document.body.style.top=-saved.scrollY+'px';document.body.style.width='100%';
    dialog.showModal();setView('draw');updateActions();inkDirty=true;measure();dialog.querySelector('.sketch-close').focus({preventScroll:true});
  }
  function restore(){
    if(frameId)cancelAnimationFrame(frameId);frameId=0;building=false;progress=1;activeStroke=null;transform=null;sizeGesture=false;holeGesture=false;rotation=null;
    if(saved){Object.assign(document.body.style,saved.body);window.scrollTo({top:saved.scrollY,left:0,behavior:'instant'});saved=null;}
    updateActions();trigger.focus({preventScroll:true});
  }
  ink.addEventListener('pointerdown',beginStroke);ink.addEventListener('pointermove',moveStroke);
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>ink.addEventListener(type,endStroke));
  ink.addEventListener('keydown',event=>{
    if(tool==='hole'&&keychain.enabled&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();remember();const step=event.shiftKey?.04:.01,p=editingHole();p[0]+=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0;p[1]+=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;moveHole(p);return;
    }
    if(tool!=='hole'&&selected&&['Delete','Backspace'].includes(event.key)){event.preventDefault();removeSelected();return;}
    if(tool!=='move'||!selected||transform||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;
    event.preventDefault();remember();const step=event.shiftKey?.04:.01;
    selected.center[0]+=event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0;
    selected.center[1]+=event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0;fitShape(selected);markChanged();
  });
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
  dialog.querySelectorAll('[data-sketch-tool]').forEach(button=>button.addEventListener('click',()=>chooseTool(button.dataset.sketchTool)));
  shapeSelect?.addEventListener('change',()=>{selected=paths[Number(shapeSelect.value)]||null;if(!selected?.shape||shapeSelect.value==='')selected=null;chooseTool('move');syncSelection();});
  shapeSize?.addEventListener('input',()=>{if(!selected||activeStroke||transform)return;if(!sizeGesture){remember();sizeGesture=true;}fitShape(selected,Number(shapeSize.value)/100);markChanged();});
  shapeSize?.addEventListener('change',()=>{sizeGesture=false;});
  shapeAngle?.addEventListener('input',()=>{if(!selected||activeStroke||transform)return;if(!sizeGesture){remember();sizeGesture=true;}selected.angle=limit(Number(shapeAngle.value)||0,-180,180);fitShape(selected);markChanged();});
  shapeAngle?.addEventListener('change',()=>{sizeGesture=false;});
  textInput?.addEventListener('input',()=>{if(textAdd)textAdd.disabled=!textInput.value.trim();});
  textInput?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();addText();}});
  textAdd?.addEventListener('click',addText);
  deleteSelected?.addEventListener('click',removeSelected);
  dialog.querySelectorAll('[data-sketch-finish]').forEach(button=>button.addEventListener('click',()=>{
    const next=button.dataset.sketchFinish;if(!['raised','engrave'].includes(next)||next===finish||activeStroke||transform||building)return;
    const redraw=!!mesh&&!changed;remember();finish=next;markChanged();if(redraw)build();
  }));
  keyToggle?.addEventListener('click',toggleKeychain);
  dialog.querySelectorAll('[data-sketch-face]').forEach(button=>button.addEventListener('click',()=>switchFace(button.dataset.sketchFace)));
  dialog.querySelectorAll('[data-sketch-model-face]').forEach(button=>button.addEventListener('click',()=>{
    const next=button.dataset.sketchModelFace;if(!keychain.enabled||!['front','back'].includes(next))return;modelFace=next;updateActions();requestPaint();
  }));
  holeMove?.addEventListener('click',()=>{if(keychain.enabled)chooseTool('hole');});
  for(const [input,axis] of [[holeX,0],[holeY,1]]){
    input?.addEventListener('input',()=>{if(!keychain.enabled||activeStroke||transform)return;if(!holeGesture){remember();holeGesture=true;}const p=editingHole();p[axis]=Number(input.value)/100;moveHole(p);});
    input?.addEventListener('change',()=>{holeGesture=false;});
  }
  dialog.querySelectorAll('[data-sketch-preset]').forEach(button=>button.addEventListener('click',()=>preset(button.dataset.sketchPreset)));
  dialog.querySelectorAll('[data-sketch-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.sketchView)));
  dialog.querySelectorAll('[data-sketch-rotate]').forEach(button=>button.addEventListener('click',()=>rotate(button.dataset.sketchRotate)));
  dialog.querySelectorAll('[data-sketch-color]').forEach(button=>button.addEventListener('click',()=>{
    if(!colors[button.dataset.sketchColor]||activeStroke||transform)return;
    const next=button.dataset.sketchColor;
    if(selected&&tool==='move'&&(selected.color||'Yeşil')!==next){remember();selected.color=next;color=next;markChanged();}
    else{color=next;updateActions();requestPaint();}
  }));
  undo.addEventListener('click',()=>{if(activeStroke||transform||!history.length)return;const old=history.pop();paths=old.paths;otherPaths=old.otherPaths||[];otherFinish=old.otherFinish||'raised';face=old.face||'front';modelFace=face;keychain=old.keychain;finish=old.finish||'raised';selected=paths[old.index]||null;sizeGesture=false;holeGesture=false;if(tool==='hole'&&!keychain.enabled)chooseTool('move');markChanged();});
  clear.addEventListener('click',()=>{if(activeStroke||transform)return;remember();paths=[];otherPaths=[];selected=null;mesh=null;keychain.enabled=false;finish='raised';otherFinish='raised';face='front';modelFace='front';if(tool==='hole')chooseTool('pen');markChanged();});
  buildButton.addEventListener('click',build);download.addEventListener('click',exportDraft);
  share?.addEventListener('click',copyDraftLink);window.addEventListener('hashchange',loadSharedDraft);
  quote.addEventListener('click',event=>{if(!mesh||changed||building)event.preventDefault();});
  dialog.querySelector('.sketch-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',restore);
  trigger.addEventListener('click',open);window.addEventListener('resize',()=>{if(dialog.open)measure();},{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(()=>{if(dialog.open)measure();}).observe(dialog.querySelector('.sketch-workspace'));
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){if(frameId)cancelAnimationFrame(frameId);frameId=0;}else if(dialog.open){if(building)started=performance.now()-progress*DURATION;requestPaint();}
  });
  window.addEventListener('pageshow',event=>{if(!event.persisted&&window.location.hash.startsWith('#tasarim='))return;if(dialog.open)dialog.close();});
  motion.addEventListener('change',requestPaint);dialog.dataset.sketchView='draw';updateActions();trigger.disabled=false;loadSharedDraft();
})();

