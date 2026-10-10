(() => {
  'use strict';
  const COLS=144,ROWS=172,WIDTH=3.8,DEPTH=4.54,BASE=.13,WALL=.28;
  const palette={Yeşil:[199,250,95],Mavi:[87,149,239],Beyaz:[243,241,236],Siyah:[69,78,72]};
  const dirs=[{key:'up',dx:0,dy:-1,bit:1,opposite:4},{key:'right',dx:1,dy:0,bit:2,opposite:8},{key:'down',dx:0,dy:1,bit:4,opposite:1},{key:'left',dx:-1,dy:0,bit:8,opposite:2}];
  function maze({shape='circle',level='easy',seed=1}={}){
    const n={easy:5,medium:7,hard:9}[level]||5,allowed=new Uint8Array(n*n),links=new Uint8Array(n*n);let random=seed>>>0||1;
    const rand=()=>{random^=random<<13;random^=random>>>17;random^=random<<5;return (random>>>0)/4294967296;};
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(shape==='square'||Math.hypot((x+.5)/n-.5,(y+.5)/n-.5)<=.47)allowed[y*n+x]=1;
    const cells=Array.from({length:n*n},(_,i)=>i).filter(i=>allowed[i]),start=cells.filter(i=>Math.floor(i/n)===Math.floor(cells.at(-1)/n))[0],visited=new Uint8Array(n*n),stack=[start];visited[start]=1;
    function neighbor(i,d){const x=i%n+d.dx,y=Math.floor(i/n)+d.dy;return x>=0&&x<n&&y>=0&&y<n?y*n+x:-1;}
    while(stack.length){const i=stack.at(-1),choices=dirs.filter(d=>{const next=neighbor(i,d);return next>=0&&allowed[next]&&!visited[next];});if(!choices.length){stack.pop();continue;}const d=choices[Math.floor(rand()*choices.length)],next=neighbor(i,d);links[i]|=d.bit;links[next]|=d.opposite;visited[next]=1;stack.push(next);}
    const dist=new Int16Array(n*n);dist.fill(-1);dist[start]=0;const queue=[start];let goal=start;
    for(let i=0;i<queue.length;i++)for(const d of dirs)if(links[queue[i]]&d.bit){const next=neighbor(queue[i],d);if(dist[next]<0){dist[next]=dist[queue[i]]+1;queue.push(next);if(dist[next]>dist[goal])goal=next;}}
    return {shape,level,seed:seed>>>0,n,allowed,links,start,goal,distance:dist[goal]};
  }
  function step(m,cell,key){const d=dirs.find(d=>d.key===key);return d&&(m.links[cell]&d.bit)?cell+d.dy*m.n+d.dx:cell;}
  function path(m,from=m.start){
    const previous=new Int16Array(m.n*m.n);previous.fill(-1);previous[from]=from;const queue=[from];
    for(let k=0;k<queue.length&&previous[m.goal]<0;k++)for(const d of dirs){const next=step(m,queue[k],d.key);if(next!==queue[k]&&previous[next]<0){previous[next]=queue[k];queue.push(next);}}
    if(previous[m.goal]<0)return [];const route=[m.goal];while(route.at(-1)!==from)route.push(previous[route.at(-1)]);return route.reverse();
  }
  function cellPosition(m,cell){const span=2.68,size=span/m.n;return {x:-span/2+(cell%m.n+.5)*size,z:-span/2+(Math.floor(cell/m.n)+.5)*size,size};}
  function build({shape='circle',level='easy',seed=1,color='Yeşil',text=new Uint8Array(COLS*ROWS)}={}){
    const m=maze({shape,level,seed}),heights=new Float32Array(COLS*ROWS),tones=new Uint8Array(COLS*ROWS),segments=[],span=2.68,size=span/m.n,half=.04;
    for(let i=0;i<m.allowed.length;i++)if(m.allowed[i]){const p=cellPosition(m,i),x0=p.x-size/2,x1=p.x+size/2,z0=p.z-size/2,z1=p.z+size/2;
      if(!(m.links[i]&1))segments.push([x0-half,z0-half,x1+half,z0+half]);if(!(m.links[i]&8))segments.push([x0-half,z0-half,x0+half,z1+half]);
      if(!(m.links[i]&2))segments.push([x1-half,z0-half,x1+half,z1+half]);if(!(m.links[i]&4))segments.push([x0-half,z1-half,x1+half,z1+half]);}
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const px=(x+.5)/COLS,pz=(y+.5)/ROWS,wx=(px-.5)*WIDTH,wz=(pz-.56)*DEPTH,i=y*COLS+x;
      const round=Math.hypot(wx,wz)<=1.77,square=Math.abs(wx)<=1.71&&Math.abs(wz)<=1.71;
      const tab=Math.hypot(wx,wz+1.91)<=.32,neck=Math.abs(wx)<=.24&&wz>=-1.99&&wz<=-1.5,hole=Math.hypot(wx,wz+1.98)<.13;
      if(!(shape==='circle'?round:square)&&!tab&&!neck||hole)continue;heights[i]=BASE;
      if(segments.some(s=>wx>=s[0]&&wx<=s[2]&&wz>=s[1]&&wz<=s[3]))heights[i]=WALL;
      if(text[i]&&wz>1.43){heights[i]=.205;tones[i]=1;}
    }
    const tops=[],walls=[];let active=new Map();
    for(let y=0;y<ROWS;y++){const next=new Map();for(let x=0;x<COLS;){const i=y*COLS+x;if(!heights[i]){x++;continue;}const from=x,high=heights[i],tone=tones[i];while(x<COLS&&heights[y*COLS+x]===high&&tones[y*COLS+x]===tone)x++;const key=from+':'+x+':'+high+':'+tone,rect=active.get(key)||[from,y,x,y+1,high,tone];rect[3]=y+1;next.set(key,rect);}for(const [k,r] of active)if(!next.has(k))tops.push(r);active=next;}tops.push(...active.values());
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const i=y*COLS+x,high=heights[i];if(!high)continue;const ns=[x?i-1:-1,x<COLS-1?i+1:-1,y?i-COLS:-1,y<ROWS-1?i+COLS:-1];ns.forEach((j,side)=>{const low=j>=0?heights[j]:0;if(high>low)walls.push([x,y,side,low,high,tones[i]]);});}
    return {...m,color:palette[color]?color:'Yeşil',heights,tones,tops,walls};
  }
  function render(c,w,h,m,{yaw=-.13,pitch=1.27,progress=1,ball=m?.start,ballTo=null,mix=0,hint=false,clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!m)return;
    const unit=Math.min(w/4.8,h/4.9),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cap=Math.max(0,Math.min(1,progress))*WALL,faces=[];
    const project=(x,y,z)=>{const xx=x*cy+z*sy,zz=-x*sy+z*cy;return{x:w/2+xx*unit,y:h*.50+(-y*cp+zz*sp)*unit,depth:zz*cp+y*sp};};
    const x=v=>(v/COLS-.5)*WIDTH,z=v=>(v/ROWS-.56)*DEPTH;
    function polygon(vertices,normal,tone){if((-normal[0]*sy+normal[2]*cy)*cp+normal[1]*sp<=.00001)return;const light=normal[1]?1:.54+.18*Math.max(0,-normal[0]*sy+normal[2]*cy),base=tone?(m.color==='Beyaz'?[47,62,49]:[243,241,236]):palette[m.color],pts=vertices.map(v=>project(...v));faces.push({pts,color:'rgb('+base.map(v=>Math.round(v*light)).join(',')+')',depth:pts.reduce((s,p)=>s+p.depth,0)/pts.length});}
    c.save();c.fillStyle='#0005';c.beginPath();c.ellipse(w/2,h*.78,unit*1.8,unit*.23,0,0,Math.PI*2);c.fill();c.restore();
    for(const [x0,z0,x1,z1,height,tone] of m.tops){const y=Math.min(height,cap);if(y>0)polygon([[x(x0),y,z(z0)],[x(x1),y,z(z0)],[x(x1),y,z(z1)],[x(x0),y,z(z1)]],[0,1,0],tone);}
    for(const [cx,cz,side,low,high,tone] of m.walls){const top=Math.min(high,cap),bottom=Math.min(low,cap);if(top<=bottom)continue;let a,b,n;if(side<2){const line=cx+(side===1?1:0);a=[x(line),bottom,z(cz)];b=[x(line),bottom,z(cz+1)];n=[side===0?-1:1,0,0];}else{const line=cz+(side===3?1:0);a=[x(cx),bottom,z(line)];b=[x(cx+1),bottom,z(line)];n=[0,0,side===2?-1:1];}polygon([a,[a[0],top,a[2]],[b[0],top,b[2]],b],n,tone);}
    faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){c.beginPath();f.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=f.color;c.fill();c.strokeStyle=f.color;c.lineWidth=.35;c.stroke();}
    if(progress>=1){
      const marker=(cell,color,label)=>{const p=cellPosition(m,cell),q=project(p.x,BASE+.006,p.z),radius=p.size*unit*.23;c.save();c.fillStyle=color;c.beginPath();c.ellipse(q.x,q.y,radius,radius*sp,0,0,Math.PI*2);c.fill();c.fillStyle='#101812';if(label==='★'){c.beginPath();for(let i=0;i<10;i++){const angle=-Math.PI/2+i*Math.PI/5,r=radius*(i%2?.32:.72),x=q.x+Math.cos(angle)*r,y=q.y+Math.sin(angle)*r*sp;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();c.fill();}else{c.font='700 '+Math.max(8,radius*1.2)+'px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(label,q.x,q.y);}c.restore();};marker(m.start,'#d9e8d3','S');marker(m.goal,'#ffce69','★');
      if(hint){const route=path(m,ball);c.save();c.strokeStyle='#f7cc77';c.lineWidth=Math.max(2,unit*.025);c.setLineDash([4,5]);c.beginPath();route.forEach((cell,i)=>{const p=cellPosition(m,cell),q=project(p.x,BASE+.01,p.z);i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y);});c.stroke();c.restore();}
      const a=cellPosition(m,ball),b=ballTo===null?a:cellPosition(m,ballTo),radius=a.size*.17,q=project(a.x+(b.x-a.x)*mix,BASE+radius,a.z+(b.z-a.z)*mix),r=radius*unit;
      c.save();c.fillStyle='#0005';c.beginPath();c.ellipse(q.x+r*.2,q.y+r*.35,r,r*.65,0,0,Math.PI*2);c.fill();const gradient=c.createRadialGradient(q.x-r*.35,q.y-r*.4,r*.12,q.x,q.y,r);gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.35,'#e9edf0');gradient.addColorStop(1,'#637275');c.fillStyle=gradient;c.beginPath();c.arc(q.x,q.y,r,0,Math.PI*2);c.fill();c.restore();
    }else{
      const a=project(-1.75,cap+.035,0),b=project(1.75,cap+.035,0);c.save();c.strokeStyle='#c7fa5f';c.lineWidth=2;c.shadowColor='#c7fa5f';c.shadowBlur=10;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.shadowBlur=0;const head=project(Math.sin(progress*38)*1.5,cap+.06,0);c.fillStyle='#202b24';c.fillRect(head.x-11,head.y-20,22,16);c.fillStyle='#c7fa5f';c.beginPath();c.moveTo(head.x-5,head.y-4);c.lineTo(head.x+5,head.y-4);c.lineTo(head.x,head.y+2);c.fill();c.restore();
    }
  }
  window.KatmanyaMaze={COLS,ROWS,BASE,WALL,WIDTH,DEPTH,dirs,maze,step,path,cellPosition,build,render};
})();
