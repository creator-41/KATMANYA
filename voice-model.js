(() => {
  'use strict';
  const COLS=180,ROWS=64,WIDTH=5.8,DEPTH=2.06,BASE=.13,WALL=.32,BINS=64;
  const palette={Yeşil:[199,250,95],Mavi:[87,149,239],Beyaz:[243,241,236],Siyah:[69,78,72]};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function envelope(channels,sampleRate,limit=8){
    if(!channels.length||!sampleRate)throw Error('audio');
    const length=Math.min(channels[0].length,Math.floor(sampleRate*limit));if(length<sampleRate*.1)throw Error('short');
    const raw=new Float32Array(BINS);let peak=0;
    for(let i=0;i<BINS;i++){const a=Math.floor(i*length/BINS),b=Math.floor((i+1)*length/BINS);let energy=0,count=0;
      for(const channel of channels)for(let j=a;j<b;j++){const v=Number.isFinite(channel[j])?channel[j]:0;energy+=v*v;count++;}
      raw[i]=Math.sqrt(energy/Math.max(1,count));peak=Math.max(peak,raw[i]);}
    if(peak<.0005)throw Error('silent');
    return {wave:Float32Array.from(raw,v=>Math.pow(v/peak,.75)),duration:length/sampleRate};
  }
  function code(wave){return Array.from(wave,v=>Math.round(clamp(v,0,1)*255).toString(16).padStart(2,'0')).join('');}
  function build({wave,color='Yeşil',text=new Uint8Array(COLS*ROWS)}={}){
    if(!wave||wave.length!==BINS)return null;
    const heights=new Float32Array(COLS*ROWS),tones=new Uint8Array(COLS*ROWS);
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
      const wx=((x+.5)/COLS-.5)*WIDTH,wz=((y+.5)/ROWS-.5)*DEPTH,i=y*COLS+x;
      const body=Math.hypot(Math.max(0,Math.abs(wx-.26)-1.9),Math.max(0,Math.abs(wz)-.48))<=.26;
      const tab=Math.hypot(wx+2.2,wz)<=.56,hole=Math.hypot(wx+2.36,wz)<.18;
      if((!body&&!tab)||hole)continue;heights[i]=BASE;
      if(wx>=-1.5&&wx<=2.05){const pos=(wx+1.5)/3.55*BINS,bin=Math.min(BINS-1,Math.floor(pos)),v=clamp(wave[bin],0,1);
        if(pos%1<.68&&Math.abs(wz)<=.03+v*.43){heights[i]=WALL;tones[i]=1;}}
      if(text[i]&&wz>.49){heights[i]=.205;tones[i]=1;}
    }
    const tops=[],walls=[];let active=new Map();
    for(let y=0;y<ROWS;y++){const next=new Map();for(let x=0;x<COLS;){const i=y*COLS+x;if(!heights[i]){x++;continue;}const from=x,high=heights[i],tone=tones[i];while(x<COLS&&heights[y*COLS+x]===high&&tones[y*COLS+x]===tone)x++;const key=from+':'+x+':'+high+':'+tone,rect=active.get(key)||[from,y,x,y+1,high,tone];rect[3]=y+1;next.set(key,rect);}for(const [k,r] of active)if(!next.has(k))tops.push(r);active=next;}tops.push(...active.values());
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){const i=y*COLS+x,high=heights[i];if(!high)continue;const ns=[x?i-1:-1,x<COLS-1?i+1:-1,y?i-COLS:-1,y<ROWS-1?i+COLS:-1];ns.forEach((j,side)=>{const low=j>=0?heights[j]:0;if(high>low)walls.push([x,y,side,low,high,tones[i]]);});}
    return {color:palette[color]?color:'Yeşil',heights,tones,tops,walls,wave};
  }
  function render(c,w,h,m,{yaw=-.14,pitch=1.03,progress=1,clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!m)return;
    const unit=Math.min(w/6.8,h/3.5),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cap=Math.max(0,Math.min(1,progress))*WALL,faces=[];
    const project=(x,y,z)=>{const xx=x*cy+z*sy,zz=-x*sy+z*cy;return{x:w/2+xx*unit,y:h*.52+(-y*cp+zz*sp)*unit,depth:zz*cp+y*sp};};
    const x=v=>(v/COLS-.5)*WIDTH,z=v=>(v/ROWS-.5)*DEPTH;
    function polygon(vertices,normal,tone){if((-normal[0]*sy+normal[2]*cy)*cp+normal[1]*sp<=.00001)return;const light=normal[1]?1:.54+.18*Math.max(0,-normal[0]*sy+normal[2]*cy),base=tone?(m.color==='Beyaz'?[47,62,49]:[243,241,236]):palette[m.color],pts=vertices.map(v=>project(...v));faces.push({pts,color:'rgb('+base.map(v=>Math.round(v*light)).join(',')+')',depth:pts.reduce((s,p)=>s+p.depth,0)/pts.length});}
    c.save();c.fillStyle='#0005';c.beginPath();c.ellipse(w/2,h*.78,unit*2.6,unit*.2,0,0,Math.PI*2);c.fill();c.restore();
    for(const [x0,z0,x1,z1,height,tone] of m.tops){const y=Math.min(height,cap);if(y>0)polygon([[x(x0),y,z(z0)],[x(x1),y,z(z0)],[x(x1),y,z(z1)],[x(x0),y,z(z1)]],[0,1,0],tone);}
    for(const [cx,cz,side,low,high,tone] of m.walls){const top=Math.min(high,cap),bottom=Math.min(low,cap);if(top<=bottom)continue;let a,b,n;if(side<2){const line=cx+(side===1?1:0);a=[x(line),bottom,z(cz)];b=[x(line),bottom,z(cz+1)];n=[side===0?-1:1,0,0];}else{const line=cz+(side===3?1:0);a=[x(cx),bottom,z(line)];b=[x(cx+1),bottom,z(line)];n=[0,0,side===2?-1:1];}polygon([a,[a[0],top,a[2]],[b[0],top,b[2]],b],n,tone);}
    faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){c.beginPath();f.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=f.color;c.fill();c.strokeStyle=f.color;c.lineWidth=.35;c.stroke();}
    if(progress<1){
      const zLine=.75-progress*1.5,a=project(-1.9,cap+.035,zLine),b=project(2.25,cap+.035,zLine);c.save();c.strokeStyle='#c7fa5f';c.lineWidth=2;c.shadowColor='#c7fa5f';c.shadowBlur=10;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.shadowBlur=0;
      const head=project(Math.sin(progress*38)*1.65+.2,cap+.06,zLine);c.fillStyle='#202b24';c.fillRect(head.x-11,head.y-20,22,16);c.fillStyle='#c7fa5f';c.beginPath();c.moveTo(head.x-5,head.y-4);c.lineTo(head.x+5,head.y-4);c.lineTo(head.x,head.y+2);c.fill();c.restore();
    }
  }
  window.KatmanyaVoice={COLS,ROWS,WIDTH,DEPTH,BASE,WALL,BINS,envelope,code,build,render};
})();
