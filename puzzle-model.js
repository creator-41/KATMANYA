(() => {
  'use strict';
  const COLS=200,ROWS=180,WIDTH=3.6,DEPTH=3.15;
  const palette={Yeşil:[199,250,95],Beyaz:[243,241,236],Mavi:[87,149,239],Siyah:[69,78,72]};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const heart=Array.from({length:180},(_,i)=>{const t=i/180*Math.PI*2;return [.5+Math.sin(t)**3*.46,.46-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.025];});
  function insidePolygon(x,y,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
  function silhouette(x,y,shape){
    if(shape==='heart')return insidePolygon(x,y,heart);
    const dx=Math.max(Math.abs(x-.5)-.33,0),dy=Math.max(Math.abs(y-.5)-.27,0);return dx*dx+dy*dy<=.065**2;
  }
  function leftOfJoint(x,y){return x<.5||(x<=.555&&Math.abs(y-.50)<.026)||((x-.555)**2+((y-.50)*DEPTH/WIDTH)**2<.079**2);}
  function aperture(x,y,side){return ((x-(side===0?.26:.74))*WIDTH)**2+((y-.235)*DEPTH)**2<.112**2;}
  function geometry(bits,text){
    const tops=[],walls=[];let active=new Map();const value=i=>bits[i]?.15+(text[i]?.07:0):0;
    for(let y=0;y<ROWS;y++){
      const next=new Map();
      for(let x=0;x<COLS;){const i=y*COLS+x;if(!bits[i]){x++;continue;}const from=x,tone=text[i]?1:0;while(x<COLS&&bits[y*COLS+x]&&!!text[y*COLS+x]===!!tone)x++;
        const key=from+':'+x+':'+tone,rect=active.get(key)||[from,y,x,y+1,tone];rect[3]=y+1;next.set(key,rect);}
      for(const [key,rect] of active)if(!next.has(key))tops.push(rect);active=next;
    }
    tops.push(...active.values());
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const i=y*COLS+x;if(!bits[i])continue;const high=value(i),neighbors=[x?i-1:-1,x<COLS-1?i+1:-1,y?i-COLS:-1,y<ROWS-1?i+COLS:-1];
      neighbors.forEach((n,side)=>{const low=n>=0?value(n):0;if(high>low)walls.push([x,y,side,low,high,text[i]?1:0]);});
    }
    return {bits,text,tops,walls};
  }
  function build({shape='heart',textA=new Uint8Array(COLS*ROWS),textB=new Uint8Array(COLS*ROWS),colorA='Yeşil',colorB='Mavi'}={}){
    if(!['heart','puzzle'].includes(shape)||textA.length!==COLS*ROWS||textB.length!==COLS*ROWS)throw Error('puzzle-data');
    const outline=new Uint8Array(COLS*ROWS),a=new Uint8Array(outline.length),b=new Uint8Array(outline.length),ta=new Uint8Array(outline.length),tb=new Uint8Array(outline.length);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const px=(x+.5)/COLS,py=(y+.5)/ROWS,i=y*COLS+x;if(!silhouette(px,py,shape))continue;
      const side=leftOfJoint(px,py)?0:1;if(aperture(px,py,side))continue;outline[i]=1;
      if(side===0){a[i]=1;ta[i]=textA[i]?1:0;}else{b[i]=1;tb[i]=textB[i]?1:0;}
    }
    return {shape,outline,parts:[{...geometry(a,ta),color:palette[colorA]?colorA:'Yeşil'},{...geometry(b,tb),color:palette[colorB]?colorB:'Mavi'}]};
  }
  function render(c,w,h,design,{separation=0,yaw=-.2,pitch=1.02,part='both',clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!design)return;
    const visible=part==='a'?[0]:part==='b'?[1]:[0,1],gap=clamp(separation,0,1)*.78;
    const span=part==='both'?4.5+gap*2:3.25,unit=Math.min(w/span,h/3.55),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),faces=[];
    const project=v=>{const x=v[0]*cy+v[2]*sy,z=-v[0]*sy+v[2]*cy,y=v[1]-.09,depth=z*cp+y*sp,f=8/(8-depth);return {x:w/2+x*f*unit,y:h/2+(-y*cp+z*sp)*f*unit,depth};};
    function polygon(vertices,normal,material,tone){
      const facing=(-normal[0]*sy+normal[2]*cy)*cp+normal[1]*sp;if(facing<=.00001)return;
      const light=normal[1]?1:.50+.26*Math.max(0,-normal[0]*sy+normal[2]*cy),base=tone?(design.parts[material].color==='Beyaz'?[50,65,52]:[243,241,236]):palette[design.parts[material].color];
      const pts=vertices.map(project);faces.push({pts,vertices,color:'rgb('+base.map(v=>Math.round(v*light)).join(',')+')',wall:!normal[1],depth:pts.reduce((s,p)=>s+p.depth,0)/pts.length});
    }
    c.save();c.translate(w/2,h/2+unit*.9);c.scale(1,.28);c.beginPath();c.ellipse(0,0,unit*(part==='both'?1.8+gap:1),unit*.75,0,0,Math.PI*2);c.fillStyle='#00000040';c.fill();c.restore();
    for(const index of visible){
      const mesh=design.parts[index],offset=part==='both'?(index===0?-gap:gap):(index===0?.79:-.81),x=v=>(v/COLS-.5)*WIDTH+offset,z=v=>(v/ROWS-.5)*DEPTH;
      for(const [x0,z0,x1,z1,tone] of mesh.tops){const y=.15+(tone?.07:0);polygon([[x(x0),y,z(z0)],[x(x1),y,z(z0)],[x(x1),y,z(z1)],[x(x0),y,z(z1)]],[0,1,0],index,tone);}
      for(const [cx,cz,side,low,high,tone] of mesh.walls){let a,b,n;
        if(side<2){const line=cx+(side===1?1:0);a=[x(line),low,z(cz)];b=[x(line),low,z(cz+1)];n=[side===0?-1:1,0,0];}
        else{const line=cz+(side===3?1:0);a=[x(cx),low,z(line)];b=[x(cx+1),low,z(line)];n=[0,0,side===2?-1:1];}
        polygon([a,[a[0],high,a[2]],[b[0],high,b[2]],b],n,index,tone);
      }
    }
    faces.sort((a,b)=>a.depth-b.depth);
    for(const face of faces){c.beginPath();face.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=face.color;c.fill();c.strokeStyle=face.color;c.lineWidth=.4;c.stroke();
      if(face.wall&&face.vertices[1][1]-face.vertices[0][1]>.1){c.strokeStyle='#0b140d25';c.lineWidth=.5;for(let y=.035;y<.15;y+=.035){const a=project([face.vertices[0][0],y,face.vertices[0][2]]),b=project([face.vertices[3][0],y,face.vertices[3][2]]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();}}
    }
  }
  window.KatmanyaPuzzle={COLS,ROWS,build,render};
})();
