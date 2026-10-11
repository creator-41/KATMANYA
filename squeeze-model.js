(() => {
 'use strict';
 const palette={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c',Mor:'#b49af0',Turuncu:'#ffb05a'},symbols={heart:'Kalp',star:'Yıldız',bolt:'Şimşek',circle:'Daire',flower:'Çiçek'},L=50,RIM=56,YAW=.48,CS=Math.cos(YAW),SN=Math.sin(YAW),CP=.91,SP=.414;
 const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,Number(n)||0));
 function build({message='',mode='both',symbol='heart',body='Yeşil',pads='Mor',plate='Beyaz'}={}){if(!['both','message','symbol'].includes(mode)||!symbols[symbol]||![body,pads,plate].every(c=>palette[c]))throw Error('squeeze-settings');return {message:Array.from(String(message).normalize('NFC').replace(/\s+/g,' ').trim()).slice(0,24).join(''),mode,symbol,body,pads,plate,width:170,depth:60,height:85};}
 function geometry(t=0){t=clamp(t);const a=47-22*t,y=10+Math.sqrt(L*L-a*a),center={x:0,y,z:0};return {t,a,center,bottom:y+4,top:y+26,pads:[-1,1].map(side=>({side,x:side*(a+29),y:10,z:0})),arms:[-1,1].flatMap(side=>[-6,6].map(z=>({from:{x:side*a,y:10,z},to:{x:0,y,z},side}))),visible:Math.max(0,y+26-RIM)};}
 function camera(p){const z=p.x*SN+p.z*CS;return {x:p.x*CS-p.z*SN,y:z*SP-p.y*CP,depth:z*CP+p.y*SP};}
 function layout(w,h){const ps=[];for(const x of [-86,86])for(const y of [-4,84])for(const z of [-29,29])ps.push(camera({x,y,z}));const xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),s=Math.min((w-50)/(maxX-minX),(h-70)/(maxY-minY));return {s,x:w/2-(minX+maxX)*s/2,y:h/2-(minY+maxY)*s/2};}
 function point(w,h,p){const l=layout(w,h),q=camera(p);return {x:l.x+q.x*l.s,y:l.y+q.y*l.s,depth:q.depth};}
 function hitPad(w,h,t,x,y){const l=layout(w,h);let best=0,d=Infinity;for(const p of geometry(t).pads){const q=point(w,h,{...p,z:7}),distance=Math.hypot(q.x-x,q.y-y);if(distance<Math.max(24,12*l.s)&&distance<d){d=distance;best=p.side;}}return best;}
 function dragValue(w,h,startT,side,dx,dy){const s=layout(w,h).s,ux=CS,uy=SN*SP;return clamp(startT-side*(dx*ux+dy*uy)/(22*s*(ux*ux+uy*uy)));}
 function shade(hex,k){const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,n>>8&255,n&255].map(v=>Math.round(clamp(v*k,0,255))).join(',')+')';}
 function lines(text,max){const out=[];let line='';for(const word of text.split(' ')){if(Array.from(word).length>max){if(line){out.push(line);line='';}const chars=Array.from(word);while(chars.length>max)out.push(chars.splice(0,max).join(''));line=chars.join('');}else if(Array.from(line+(line?' ':'')+word).length>max){out.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)out.push(line);return out;}
 function render(c,w,h,m,{opening=0,clear=true}={}){if(clear)c.clearRect(0,0,w,h);if(!m||w<90||h<180)return;const l=layout(w,h),s=l.s,P=p=>point(w,h,p),g=geometry(opening),items=[],body=palette[m.body];
  function polygon(ps,color,layer=false){const pts=ps.map(P);items.push({kind:'face',pts,color,layer,depth:pts.reduce((n,p)=>n+p.depth/pts.length,0)});}
  function box(center,size,color){const [dx,dy,dz]=size.map(v=>v/2);for(const [n,u,v,a,b,k] of [[{x:0,y:0,z:1},{x:1,y:0,z:0},{x:0,y:1,z:0},dx,dy,.92],[{x:1,y:0,z:0},{x:0,y:0,z:-1},{x:0,y:1,z:0},dz,dy,.62],[{x:0,y:1,z:0},{x:1,y:0,z:0},{x:0,y:0,z:-1},dx,dz,1.08]]){const fc={x:center.x+n.x*dx,y:center.y+n.y*dy,z:center.z+n.z*dz};polygon([[-1,-1],[1,-1],[1,1],[-1,1]].map(([f,j])=>({x:fc.x+u.x*a*f+v.x*b*j,y:fc.y+u.y*a*f+v.y*b*j,z:fc.z+u.z*a*f+v.z*b*j})),shade(color,k));}}
  function line(a,b,color,width){items.push({kind:'line',a:P(a),b:P(b),color,width:width*s,depth:(camera(a).depth+camera(b).depth)/2});}
  function drawItems(){items.sort((a,b)=>a.depth-b.depth);for(const it of items){c.beginPath();if(it.kind==='line'){c.strokeStyle=it.color;c.lineWidth=Math.max(.8,it.width);c.moveTo(it.a.x,it.a.y);c.lineTo(it.b.x,it.b.y);c.stroke();}else{it.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=it.color;c.fill();c.strokeStyle='#101a1190';c.lineWidth=.7;c.stroke();}}items.length=0;}
  c.save();c.lineJoin='round';c.lineCap='round';const sh=P({x:0,y:-4,z:0});c.fillStyle='#0005';c.beginPath();c.ellipse(sh.x,sh.y+4*s,81*s,20*s,0,0,Math.PI*2);c.fill();
  // Side slots leave a real passage for the pad rods at y=10, z=0.
  box({x:0,y:2,z:0},[90,4,54],body);box({x:0,y:30,z:-25},[90,52,4],body);
  for(const x of [-43,43]){box({x,y:35,z:0},[4,42,50],body);box({x,y:5,z:0},[4,2,50],body);for(const z of [-16,16])box({x,y:10,z},[4,8,18],body);}
  for(const p of g.pads){line({x:p.side*g.a,y:10,z:0},{x:p.x,y:10,z:0},'#a4b39a',4);box(p,[14,20,16],palette[m.pads]);}
  for(const arm of g.arms)line(arm.from,arm.to,'#a3b69b',3);
  box({x:0,y:g.center.y-6,z:0},[3,20,3],'#c4cbbd');for(const x of [-4,4])box({x,y:37,z:0},[3,32,5],body);box({x:0,y:37,z:-3},[11,32,1],body);box({x:0,y:g.center.y+2,z:0},[48,4,16],palette[m.plate]);
  // The opaque front wall covers the hidden plate and links.
  box({x:0,y:30,z:25},[90,52,4],body);for(const z of [-25,25])box({x:0,y:55,z},[90,2,4],body);drawItems();
  // Only the part above the rim is exposed, even when the canvas painter sorts large walls.
  if(g.top>RIM){const bottom=Math.max(RIM,g.bottom),height=g.top-bottom;box({x:0,y:bottom+height/2,z:0},[46,height,2],palette[m.plate]);drawItems();const center=P({x:0,y:g.bottom+11,z:1.02}),u=camera({x:1,y:0,z:0}),v=camera({x:0,y:1,z:0});c.save();c.transform(u.x*s,u.y*s,-v.x*s,-v.y*s,center.x,center.y);c.beginPath();c.rect(-23,-11,46,height);c.clip();c.strokeStyle='#111b1120';c.lineWidth=.2;for(let y=-10;y<=10;y+=1.4){c.beginPath();c.moveTo(-22,y);c.lineTo(22,y);c.stroke();}c.fillStyle=m.plate==='Siyah'?'#f3f1ec':'#13261b';
   if(m.mode!=='message'){c.save();c.translate(m.mode==='both'?-15:0,0);const r=m.mode==='symbol'?7:5;c.beginPath();if(m.symbol==='heart'){c.moveTo(0,r*.85);c.bezierCurveTo(-r*1.5,-r*.1,-r,-r*1.2,0,-r*.35);c.bezierCurveTo(r,-r*1.2,r*1.5,-r*.1,0,r*.85);}else if(m.symbol==='star'){for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.45:r;i?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}}else if(m.symbol==='bolt'){[[-.1,-1],[-.7,.15],[-.08,.15],[-.3,1],[.75,-.2],[.15,-.2]].forEach(([x,y],i)=>i?c.lineTo(x*r,y*r):c.moveTo(x*r,y*r));}else if(m.symbol==='circle'){c.arc(0,0,r,0,Math.PI*2);}else{for(let i=0;i<5;i++){const a=i*Math.PI*2/5;c.moveTo(Math.cos(a)*r*.6+r*.48,Math.sin(a)*r*.6);c.arc(Math.cos(a)*r*.6,Math.sin(a)*r*.6,r*.48,0,Math.PI*2);}c.moveTo(r*.35,0);c.arc(0,0,r*.35,0,Math.PI*2);}c.closePath();c.fill();c.restore();}
   if(m.mode!=='symbol'&&m.message){const text=lines(m.message,m.mode==='both'?9:13);c.font='600 3.6px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';for(let i=0;i<text.length;i++)c.fillText(text[i],m.mode==='both'?5:0,(i-(text.length-1)/2)*4.5,m.mode==='both'?29:40);}c.restore();
  }
  // Shallow marks on the pad faces show their squeeze direction.
  for(const p of g.pads){const q=P({...p,z:8.1}),u=camera({x:1,y:0,z:0}),v=camera({x:0,y:1,z:0});c.save();c.transform(u.x*s,u.y*s,-v.x*s,-v.y*s,q.x,q.y);c.strokeStyle=m.pads==='Siyah'?'#f3f1ec':'#13261b';c.lineWidth=1;c.beginPath();c.moveTo(p.side*2,-3);c.lineTo(-p.side*2,0);c.lineTo(p.side*2,3);c.stroke();c.restore();}
  c.restore();
 }
 window.KatmanyaSqueeze={build,geometry,camera,layout,point,hitPad,dragValue,render,palette,symbols,clamp,L,RIM};
})();
