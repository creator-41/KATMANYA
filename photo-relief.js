(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const colors={Yeşil:[199,250,95],Beyaz:[243,241,236],Mavi:[87,149,239],Siyah:[69,78,72]};
  // A photo is a luminance relief, not a reconstruction of the object's depth.
  // Integer height levels allow neighboring cells to share continuous surfaces.
  function build({pixels,cols,rows,aspect,contrast=100,detail=1,height=2,invert=false,product='plaque',color='Yeşil'}){
    if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<1||rows<1||cols>160||rows>160||pixels.length!==cols*rows*4||!Number.isFinite(aspect)||aspect<=0)throw Error('photo-data');
    const steps=[5,9,14][clamp(Math.round(detail),0,2)],relief=[.16,.29,.43][clamp(Math.round(height)-1,0,2)];
    const padding=product==='keychain'?Math.max(7,Math.ceil(rows*.19)):0,totalRows=rows+padding;
    const width=aspect>=1?3.25:3.25*aspect,imageDepth=aspect>=1?3.25/aspect:3.25,depth=imageDepth*totalRows/rows;
    const levels=new Int16Array(cols*totalRows).fill(0),present=new Uint8Array(levels.length).fill(1),base=.12;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const i=(y*cols+x)*4,a=pixels[i+3]/255;
      const lum=(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2])*a+255*(1-a);
      const adjusted=clamp((lum/255-.5)*contrast/100+.5,0,1);
      levels[(y+padding)*cols+x]=Math.round((invert?adjusted:1-adjusted)*steps);
    }
    if(padding){
      // A through-hole occupies only the added top margin, never the photograph.
      const cx=cols/2,cy=padding/2,r=Math.max(1.4,Math.min(cols*.085,padding*.31)),ratio=depth/totalRows/(width/cols);
      for(let y=0;y<padding;y++)for(let x=0;x<cols;x++)if((x+.5-cx)**2+((y+.5-cy)*ratio)**2<r*r)present[y*cols+x]=0;
    }
    const cellHeight=i=>present[i]?base+levels[i]/steps*relief:0,tops=[],walls=[];
    let active=new Map();
    for(let y=0;y<totalRows;y++){
      const next=new Map();
      for(let x=0;x<cols;){
        const i=y*cols+x;if(!present[i]){x++;continue;}const first=x,level=levels[i];
        while(x<cols&&present[y*cols+x]&&levels[y*cols+x]===level)x++;
        const key=first+':'+x+':'+level,rect=active.get(key)||[first,y,x,y+1,base+level/steps*relief,level/steps];rect[3]=y+1;next.set(key,rect);
      }
      for(const [key,rect] of active)if(!next.has(key))tops.push(rect);active=next;
    }
    tops.push(...active.values());
    for(let y=0;y<totalRows;y++)for(let x=0;x<cols;x++){
      const i=y*cols+x;if(!present[i])continue;const h=cellHeight(i),neighbors=[x?i-1:-1,x<cols-1?i+1:-1,y?i-cols:-1,y<totalRows-1?i+cols:-1];
      neighbors.forEach((n,side)=>{const low=n>=0?cellHeight(n):0;if(h>low+.000001)walls.push([x,y,side,low,h,levels[i]/steps]);});
    }
    return {cols,rows:totalRows,imageRows:rows,padding,width,depth,base,relief,maxHeight:base+relief,levels,present,tops,walls,color:colors[color]?color:'Yeşil',product};
  }
  function render(c,w,h,model,progress=1,camera={yaw:-.22,pitch:1.12},clear=true){
    if(clear)c.clearRect(0,0,w,h);if(!model||progress<=0)return;
    const {width,depth,cols,rows}=model,cap=model.maxHeight*clamp(progress,0,1),unit=Math.min(w/(Math.hypot(width,depth)*1.16),h/(Math.hypot(width,depth)*.90));
    const cy=Math.cos(camera.yaw),sy=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch),faces=[];
    const x=v=>(v/cols-.5)*width,z=v=>(v/rows-.5)*depth;
    const project=v=>{const vx=v[0]*cy+v[2]*sy,vz=-v[0]*sy+v[2]*cy,vy=v[1]-.14,d=vz*cp+vy*sp,f=8/(8-d);return {x:w/2+vx*f*unit,y:h/2+(-vy*cp+vz*sp)*f*unit,depth:d};};
    const material=colors[model.color];
    function polygon(vertices,normal,tone,wall=false){
      if((-normal[0]*sy+normal[2]*cy)*cp+normal[1]*sp<=.0001)return;
      const pts=vertices.map(project),light=wall?.48+.25*Math.max(0,-normal[0]*sy+normal[2]*cy):.97;
      // Keep dark photo tones dark as well as raised, so the image stays legible.
      const tint=wall?1:.95-.48*tone,color='rgb('+material.map(v=>Math.round(clamp(v*light*tint,0,255))).join(',')+')';
      faces.push({vertices,pts,color,wall,depth:pts.reduce((s,p)=>s+p.depth,0)/pts.length});
    }
    c.save();c.fillStyle='#00000040';c.translate(w/2,h/2+unit*depth*.38);c.scale(1,.3);c.beginPath();c.ellipse(0,0,unit*width*.52,unit*depth*.4,0,0,Math.PI*2);c.fill();c.restore();
    for(const [x0,z0,x1,z1,top,tone] of model.tops){const y=Math.min(top,cap);polygon([[x(x0),y,z(z0)],[x(x1),y,z(z0)],[x(x1),y,z(z1)],[x(x0),y,z(z1)]],[0,1,0],cap>=top?tone:0);}
    for(const [cx,cz,side,low,top,tone] of model.walls){
      const high=Math.min(top,cap);if(high<=low)continue;let a,b,n;
      if(side<2){const line=cx+(side===1?1:0);a=[x(line),low,z(cz)];b=[x(line),low,z(cz+1)];n=[side===0?-1:1,0,0];}
      else{const line=cz+(side===3?1:0);a=[x(cx),low,z(line)];b=[x(cx+1),low,z(line)];n=[0,0,side===2?-1:1];}
      polygon([a,[a[0],high,a[2]],[b[0],high,b[2]],b],n,tone,true);
    }
    faces.sort((a,b)=>a.depth-b.depth);
    for(const face of faces){
      c.beginPath();face.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=face.color;c.fill();
      c.strokeStyle=face.color;c.lineWidth=.45;c.stroke();
      if(face.wall&&face.vertices[1][1]-face.vertices[0][1]>.06){
        c.strokeStyle='#0b140d25';c.lineWidth=.5;
        for(let y=face.vertices[0][1]+.035;y<face.vertices[1][1];y+=.035){const a=project([face.vertices[0][0],y,face.vertices[0][2]]),b=project([face.vertices[3][0],y,face.vertices[3][2]]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}
      }
    }
  }
  window.KatmanyaPhotoRelief={build,render};
})();
