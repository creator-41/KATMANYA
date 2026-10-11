(() => {
  'use strict';
  const TAU=Math.PI*2,palette={Pembe:'#ed91b9',Mor:'#b49af0',Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c',Sarı:'#ffce68'};
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  function build({petals='Pembe',center='Sarı',base='Yeşil',message=''}={}){if(!palette[petals]||!palette[center]||!palette[base])throw Error('flower-settings');return {petals,center,base,message:Array.from(String(message).normalize('NFC').replace(/\s+/g,' ').trim()).slice(0,24).join(''),width:140,closedHeight:67,openHeight:28,count:8};}
  function geometry(open=0){open=clamp(open);const tilt=1.95-1.83*open,petals=[];for(let i=0;i<8;i++){const a=i*TAU/8,rows=[];for(let j=0;j<=18;j++){const t=j/18,r=22+46*t*Math.cos(tilt),width=15*Math.pow(Math.sin(Math.PI*t),.8)+1.4*(1-t),y=19+46*t*Math.sin(tilt)+4*Math.sin(Math.PI*t);rows.push([-1,0,1].map(side=>({x:Math.cos(a)*r-Math.sin(a)*width*side,z:Math.sin(a)*r+Math.cos(a)*width*side,y:y+(side===0?3*Math.sin(Math.PI*t):0)})));}petals.push(rows);}return petals;}
  function layout(w,h){return {x:w/2,y:h*.59,s:Math.min((w-44)/158,(h-60)/112)};}
  function project(p,l,rotation=0){const x=p.x*Math.cos(rotation)-p.z*Math.sin(rotation),z=p.x*Math.sin(rotation)+p.z*Math.cos(rotation);return {x:l.x+x*l.s,y:l.y+(z*.56-p.y*.84)*l.s,depth:z+p.y*.22};}
  function shade(hex,k){const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,n>>8&255,n&255].map(v=>Math.round(clamp(v*k,0,255))).join(',')+')';}
  function path(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
  function render(c,w,h,m,{open=0,rotation=.2,clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!m||w<70||h<90)return;open=clamp(open);const l=layout(w,h),s=l.s,pc=palette[m.petals],cc=palette[m.center],bc=palette[m.base];
    c.save();c.fillStyle='#0005';c.beginPath();c.ellipse(l.x,l.y+8*s,(32+open*33)*s,16*s,0,0,TAU);c.fill();
    // The round pedestal, stem and rotating collar remain attached throughout the motion.
    for(const [y,r,color] of [[-1,28,shade(bc,.35)],[3,28,shade(bc,.75)],[5,25,bc],[7,18,shade(bc,.55)],[12,18,bc]]){const p=project({x:0,z:0,y},l);c.fillStyle=color;c.beginPath();c.ellipse(p.x,p.y,r*s,r*s*.56,0,0,TAU);c.fill();c.strokeStyle='#ffffff22';c.lineWidth=.6*s;c.stroke();}
    c.strokeStyle=shade(bc,.55);c.lineWidth=8*s;const a=project({x:0,z:0,y:11},l),b=project({x:0,z:0,y:19},l);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();
    for(let i=0;i<12;i++){const angle=i*TAU/12,p=project({x:17*Math.cos(angle),z:17*Math.sin(angle),y:10},l);c.strokeStyle=shade(bc,.4);c.lineWidth=s;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x,p.y+2*s);c.stroke();}
    const center=project({x:0,z:0,y:19},l);c.fillStyle=shade(cc,.5);c.beginPath();c.ellipse(center.x,center.y+3*s,23*s,23*s*.56,0,0,TAU);c.fill();const g=c.createLinearGradient(center.x-20*s,center.y-15*s,center.x+20*s,center.y+15*s);g.addColorStop(0,shade(cc,1.15));g.addColorStop(1,shade(cc,.8));c.fillStyle=g;c.beginPath();c.ellipse(center.x,center.y,23*s,23*s*.56,0,0,TAU);c.fill();c.strokeStyle='#ffffff55';c.lineWidth=.6*s;c.stroke();
    if(open>.65){c.save();c.globalAlpha=clamp((open-.65)/.25);c.translate(center.x,center.y);c.scale(s,s*.56);c.fillStyle=m.center==='Siyah'?'#f3f1ec':'#19291d';c.textAlign='center';c.textBaseline='middle';c.font='700 5px Arial, sans-serif';const text=m.message||'MESAJIN',chars=Array.from(text),mid=chars.length>12?Math.ceil(chars.length/2):chars.length,lines=chars.length>12?[chars.slice(0,mid).join(''),chars.slice(mid).join('')]:[text];lines.forEach((line,i)=>c.fillText(line,0,(i-(lines.length-1)/2)*7,37));c.restore();}
    const leaves=geometry(open).map((rows,index)=>({rows,index,depth:project(rows[9][1],l,rotation).depth})).sort((a,b)=>a.depth-b.depth);
    for(const leaf of leaves){const faces=[];for(let j=0;j<leaf.rows.length-1;j++)for(let k=0;k<2;k++){const pts=[leaf.rows[j][k],leaf.rows[j+1][k],leaf.rows[j+1][k+1],leaf.rows[j][k+1]].map(p=>project(p,l,rotation));faces.push({pts,depth:pts.reduce((v,p)=>v+p.depth,0)/4,k,j});}faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){path(c,f.pts);c.fillStyle=shade(pc,(f.k?1.05:.82)*(1-.1*f.j/18));c.fill();c.strokeStyle=c.fillStyle;c.lineWidth=.6;c.stroke();}}
    // A raised central vein and thin edge make each leaf read as a curved printed petal.
    if(open>.6)geometry(open).map(rows=>rows.map(r=>project(r[1],l,rotation))).sort((a,b)=>a[9].depth-b[9].depth).forEach(pts=>{c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=shade(pc,1.18);c.lineWidth=.6*s;c.stroke();});
    if(open<.98){const p=project({x:0,z:0,y:8},l);c.strokeStyle='#c7fa5f75';c.lineWidth=.7*s;c.setLineDash([3*s,3*s]);c.beginPath();c.ellipse(p.x,p.y,31*s,18*s,0,0,TAU);c.stroke();c.setLineDash([]);}c.restore();
  }
  window.KatmanyaFlower={build,geometry,layout,project,render,palette,clamp};
})();
