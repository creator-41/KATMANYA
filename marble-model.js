(() => {
 'use strict';
 const N=5,L=24,START=10,FINISH=14,D=[{x:0,z:-1},{x:1,z:0},{x:0,z:1},{x:-1,z:0}],palette={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c'},types=['straight','curve','ramp'];
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),center=i=>({x:(i%N-2)*L,z:(Math.floor(i/N)-2)*L}),clone=a=>a.map(t=>t?{...t}:null);
 function empty(){const a=Array(25).fill(null);a[START]={type:'start',q:0,color:'Beyaz'};a[FINISH]={type:'finish',q:0,color:'Yeşil'};return a;}
 function preset(){const a=empty();for(const [i,type,q,color] of [[11,'curve',0,'Yeşil'],[6,'curve',2,'Mavi'],[7,'ramp',0,'Mavi'],[8,'curve',3,'Yeşil'],[13,'curve',1,'Beyaz']])a[i]={type,q,color};return a;}
 function ports(t){return (t.type==='curve'?[3,0]:[3,1]).map(p=>(p+t.q)%4);}
 function trace(tiles){let index=START,entry=3,steps=[],seen=new Set(),reason='gap',missing=null;
  for(let n=0;n<25;n++){const tile=tiles[index];if(!tile){missing=index;break;}if(seen.has(index)){reason='loop';missing=index;break;}const ps=ports(tile);if(!ps.includes(entry)){reason='mismatch';missing=index;break;}seen.add(index);const exit=ps.find(p=>p!==entry);steps.push({index,entry,exit,tile});if(index===FINISH){reason='finish';break;}const col=index%N+D[exit].x,row=Math.floor(index/N)+D[exit].z;if(col<0||col>=N||row<0||row>=N){reason='edge';break;}index=row*N+col;entry=(exit+2)%4;}
  return {steps,reason,missing};}
 function routePoint(step,u,high,low){const p=center(step.index),a={x:p.x+D[step.entry].x*L/2,z:p.z+D[step.entry].z*L/2},b=step.tile.type==='finish'?p:{x:p.x+D[step.exit].x*L/2,z:p.z+D[step.exit].z*L/2};let x,z;
  if(step.tile.type==='curve'){x=(1-u)**2*a.x+2*(1-u)*u*p.x+u*u*b.x;z=(1-u)**2*a.z+2*(1-u)*u*p.z+u*u*b.z;}else{x=a.x+(b.x-a.x)*u;z=a.z+(b.z-a.z)*u;}return {x,z,y:high+(low-high)*u};}
 function build({tiles=preset(),base='Siyah',caption=''}={}){
  if(!palette[base]||!Array.isArray(tiles)||tiles.length!==25)throw Error('marble-settings');tiles=clone(tiles);for(let i=0;i<25;i++){const t=tiles[i];if(!t)continue;if(![...types,'start','finish'].includes(t.type)||!Number.isInteger(t.q)||t.q<0||t.q>3||!palette[t.color]||(['start','finish'].includes(t.type)&&i!==START&&i!==FINISH))throw Error('marble-settings');}
  const fixed=empty();tiles[START]=fixed[START];tiles[FINISH]=fixed[FINISH];const t=trace(tiles),drop=s=>s.tile.type==='ramp'?4:s.tile.type==='finish'?.4:.7,top=t.steps.reduce((sum,s)=>sum+drop(s),0)+18,byIndex={},points=[];let height=top,time=0,speed=20,distance=0;
  for(const s of t.steps){const low=height-drop(s),segment={...s,high:height,low};byIndex[s.index]=segment;for(let j=0;j<=20;j++){if(j===0&&points.length)continue;const p=routePoint(s,j/20,height,low),prev=points.at(-1);if(prev){const d=Math.hypot(p.x-prev.x,p.z-prev.z,p.y-prev.y),v=Math.sqrt(Math.max(64,speed*speed+2*320*(prev.y-p.y)-.6*d));time+=2*d/(speed+v);distance+=d;speed=v;}points.push({...p,time,distance,speed,index:s.index});}height=low;}
  const end=points.at(-1),last=t.steps.at(-1);return {tiles,base,caption:Array.from(String(caption).normalize('NFC').trim()).slice(0,10).join(''),trace:t,byIndex,points,top,length:distance,time,end,exit:D[last.exit],duration:time+(t.reason==='finish'?.4:.75),count:tiles.filter(Boolean).length,width:140,lengthMM:140};
 }
 function sample(m,time){time=clamp(time,0,m.duration);if(time>=m.time){const p=time-m.time;if(m.trace.reason==='finish')return {...m.end,y:m.end.y+3};return {x:m.end.x+m.exit.x*18*p,z:m.end.z+m.exit.z*18*p,y:Math.max(3,m.end.y+3-100*p*p)};}
  let a=m.points[0],b=m.points.at(-1);for(let i=1;i<m.points.length;i++)if(m.points[i].time>=time){a=m.points[i-1];b=m.points[i];break;}const u=(time-a.time)/(b.time-a.time||1);return {x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u,y:a.y+(b.y-a.y)*u+3};}
 const project=p=>({x:(p.x-p.z)*.707,y:(p.x+p.z)*.36-p.y*.82});
 function layout(w,h,m){const ps=[];for(const x of [-72,72])for(const z of [-72,72])for(const y of [-5,m.top+9])ps.push(project({x,z,y}));const loX=Math.min(...ps.map(p=>p.x)),hiX=Math.max(...ps.map(p=>p.x)),loY=Math.min(...ps.map(p=>p.y)),hiY=Math.max(...ps.map(p=>p.y)),s=Math.min((w-55)/(hiX-loX),(h-65)/(hiY-loY));return {s,x:w/2-(loX+hiX)/2*s,y:h/2-(loY+hiY)/2*s};}
 function point(w,h,m,p){const l=layout(w,h,m),q=project(p);return {x:l.x+q.x*l.s,y:l.y+q.y*l.s};}
 function render(c,w,h,m,{selected=-1,time=null,clear=true}={}){if(clear)c.clearRect(0,0,w,h);if(!m||w<90||h<180)return;const l=layout(w,h,m),s=l.s,P=p=>point(w,h,m,p);c.save();c.lineJoin='round';c.lineCap='round';
  function path(ps){c.beginPath();ps.map(P).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
  function line(ps,color,width){c.beginPath();ps.map(P).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=Math.max(.7,width*s);c.stroke();}
  const corners=[{x:-64,z:-64,y:0},{x:64,z:-64,y:0},{x:64,z:64,y:0},{x:-64,z:64,y:0}];path(corners.map(p=>({...p,y:-7})));c.fillStyle='#0007';c.fill();for(let i=1;i<3;i++){const a=corners[i],b=corners[i+1];path([a,b,{...b,y:-4},{...a,y:-4}]);c.fillStyle='#17261b';c.fill();}path(corners);c.fillStyle=palette[m.base];c.fill();path(corners.map(p=>({x:p.x*.96,z:p.z*.96,y:.1})));c.fillStyle='#152b20';c.fill();
  for(let i=0;i<25;i++){const p=center(i),d=10.4;path([{x:p.x-d,z:p.z-d,y:.2},{x:p.x+d,z:p.z-d,y:.2},{x:p.x+d,z:p.z+d,y:.2},{x:p.x-d,z:p.z+d,y:.2}]);c.fillStyle=i===selected?'#c7fa5f20':'#ffffff04';c.fill();c.strokeStyle=i===selected?'#c7fa5f':'#86a77835';c.lineWidth=i===selected?1.5:.6;c.stroke();if(!m.tiles[i]){line([{x:p.x-2,z:p.z,y:.3},{x:p.x+2,z:p.z,y:.3}],'#8ca47e55',.4);line([{x:p.x,z:p.z-2,y:.3},{x:p.x,z:p.z+2,y:.3}],'#8ca47e55',.4);}}
  const order=m.tiles.map((t,i)=>({t,i})).filter(x=>x.t).sort((a,b)=>{const p=center(a.i),q=center(b.i);return p.x+p.z-q.x-q.z;});
  for(const {t,i} of order){const p=center(i),step=m.byIndex[i]||{index:i,tile:t,entry:ports(t)[0],exit:ports(t)[1],high:18,low:18},high=step.high,low=step.low,mid=routePoint(step,.5,high,low);line([{...mid,y:0},{...mid,y:mid.y-2}],'#283f32',5.8);line([{...mid,x:mid.x-1,y:.2},{...mid,x:mid.x-1,y:mid.y-2}],palette[t.color],1.2);
   const ps=Array.from({length:25},(_,k)=>routePoint(step,k/24,high,low));line(ps.map(p=>({...p,y:p.y-2})), '#101b14',10.5);line(ps,palette[t.color],9.4);line(ps,'#183123',5.3);
   for(const side of [-1,1]){const rail=ps.map((p,j)=>{const a=ps[Math.max(0,j-1)],b=ps[Math.min(ps.length-1,j+1)],d=Math.hypot(b.x-a.x,b.z-a.z)||1;return {x:p.x-(b.z-a.z)/d*3.5*side,z:p.z+(b.x-a.x)/d*3.5*side,y:p.y+1.6};});line(rail,palette[t.color],1.3);}
   if(t.type==='ramp'){const a=routePoint(step,.35,high,low),b=routePoint(step,.65,high,low);line([{...a,y:a.y+.2},{...b,y:b.y+.2}],'#ffffff99',.7);}
   if(i===START||i===FINISH){const flag=P({...mid,y:mid.y+12});line([mid,{...mid,y:mid.y+12}],palette[t.color],.9);c.fillStyle=palette[t.color];c.fillRect(flag.x,flag.y,7*s,4*s);if(i===FINISH){c.fillStyle='#14261b';c.fillRect(flag.x,flag.y,3.5*s,2*s);c.fillRect(flag.x+3.5*s,flag.y+2*s,3.5*s,2*s);}}
   if(i===selected){const r=P({...mid,y:mid.y+4});c.strokeStyle='#fff';c.lineWidth=1.3;c.beginPath();c.ellipse(r.x,r.y,10*s,5*s,0,0,Math.PI*2);c.stroke();}
  }
  const pos=sample(m,time===null?0:time),shadow=P({...pos,y:0}),p=P(pos);c.fillStyle='#0005';c.beginPath();c.ellipse(shadow.x,shadow.y,3*s,1.5*s,0,0,Math.PI*2);c.fill();const gradient=c.createRadialGradient(p.x-s,p.y-s,.1,p.x,p.y,3*s);gradient.addColorStop(0,'#fff');gradient.addColorStop(.3,'#b6eaff');gradient.addColorStop(1,'#397da6');c.fillStyle=gradient;c.beginPath();c.arc(p.x,p.y,3*s,0,Math.PI*2);c.fill();
  if(m.caption){const label=P({x:0,z:64,y:-1});c.fillStyle='#c7fa5f';c.textAlign='center';c.textBaseline='top';c.font='700 '+5*s+'px Arial, sans-serif';c.fillText(m.caption,label.x,label.y,70*s);}c.restore();
 }
 window.KatmanyaMarble={N,L,START,FINISH,D,palette,types,clamp,center,clone,empty,preset,ports,trace,routePoint,build,sample,layout,point,render};
})();
