(() => {
  'use strict';
  const palette={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c'},ideal={x:Math.tan(40*Math.PI/180),z:Math.tan(50*Math.PI/180)};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const sanitize=text=>Array.from(String(text).normalize('NFC').replace(/\s+/g,' ').trim()).slice(0,14).join('');
  function mask(text,createCanvas=()=>document.createElement('canvas')){
    const value=sanitize(text),c=createCanvas();c.width=180;c.height=36;const g=c.getContext('2d');if(!g)throw Error('shadow-canvas');
    g.fillStyle='#fff';g.font='900 27px Arial, sans-serif';g.textBaseline='middle';g.textAlign='center';
    const width=g.measureText(value).width;g.save();g.translate(90,18);g.scale(Math.min(1,164/Math.max(1,width)),1);g.fillText(value,0,0);g.restore();
    const pixels=g.getImageData(0,0,180,36).data,cells=[];
    // Adjacent raster cells are joined into runs, keeping the model small enough for mobile.
    for(let y=0;y<36;y++){let start=-1;for(let x=0;x<=180;x++){const on=x<180&&pixels[(y*180+x)*4+3]>=110;if(on&&start<0)start=x;if(!on&&start>=0){cells.push({x:start,y,width:x-start});start=-1;}}}
    return {text:value,cells,cols:180,rows:36};
  }
  function build({text='',color='Yeşil',format='mini',raster=null}={}){
    if(!palette[color]||!['mini','wide'].includes(format))throw Error('shadow-settings');
    const value=sanitize(text),source=raster||mask(value),scale=format==='wide'?1.25:1,unit=.55*scale,faces=[],blocks=[];
    if(!Array.isArray(source.cells)||source.cols!==180||source.rows!==36)throw Error('shadow-mask');
    source.cells.forEach((cell,i)=>{
      if(![cell.x,cell.y,cell.width].every(Number.isFinite)||cell.x<0||cell.y<0||cell.width<=0||cell.x+cell.width>180||cell.y>=36)throw Error('shadow-cell');
      const x0=(cell.x-90)*unit,x1=x0+cell.width*unit,z0=(cell.y-18)*unit,z1=z0+unit;
      const height=(10+((cell.x*17+cell.y*31+i*7)%19))*scale;
      const lower=[[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1]],upper=lower.map(([x,,z])=>[x-ideal.x*height,height,z-ideal.z*height]),p=lower.concat(upper);
      const f=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].map((indices,n)=>({vertices:indices.map(k=>p[k]),tone:[.45,1.2,.65,.85,.96,.7][n]}));
      blocks.push({vertices:p,height,target:{x0,x1,z0,z1}});faces.push(...f);
    });
    return {text:value,color,format,scale,unit,faces,blocks,width:Math.round(125*scale),depth:Math.round(65*scale),height:Math.round(28*scale)};
  }
  function projectShadow([x,y,z],light){return {x:x+light.x*y,z:z+light.z*y};}
  const accuracy=light=>Math.round(100*clamp(1-Math.hypot(light.x-ideal.x,light.z-ideal.z)/2.4,0,1));
  function layout(w,h){return {piece:{x:w*.25,y:h*.53,s:Math.min(w/280,h/85)},shadow:{x:w*.76,y:h*.52,s:Math.min(w/260,h/72)}};}
  function shade(hex,k){const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,n>>8&255,n&255].map(v=>Math.round(clamp(v*k,0,255))).join(',')+')';}
  function path(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
  function render(c,w,h,m,{light={x:-.8,z:.45},lit=true,clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!m||w<100||h<100)return;
    const l=layout(w,h),s=m.scale,iso=([x,y,z])=>({x:l.piece.x+(x*.9-z*.4+10*s)*l.piece.s/s,y:l.piece.y+(x*.16+z*.4-y*.94+17*s)*l.piece.s/s,depth:z*.9+x*.4+y*.16}),flat=p=>({x:l.shadow.x+p.x*l.shadow.s/s,y:l.shadow.y+p.z*l.shadow.s/s});
    c.save();
    const grad=c.createRadialGradient(l.shadow.x,l.shadow.y,0,l.shadow.x,l.shadow.y,w*.31);grad.addColorStop(0,lit?'#f6f0da':'#364238');grad.addColorStop(1,lit?'#b6baa0':'#1b2820');
    c.fillStyle=grad;c.beginPath();c.roundRect(w*.515,h*.17,w*.465,h*.66,12);c.fill();
    c.strokeStyle='#c7fa5f33';c.lineWidth=1;c.stroke();
    // The shadow is the union of projected mesh faces. No text is drawn in this view.
    if(lit){c.save();c.beginPath();c.rect(w*.515,h*.17,w*.465,h*.66);c.clip();c.fillStyle='#202820';for(const face of m.faces){const pts=face.vertices.map(v=>flat(projectShadow(v,light)));path(c,pts);c.fill();}c.restore();}
    const items=m.faces.map(face=>({face,pts:face.vertices.map(iso)}));items.sort((a,b)=>a.pts.reduce((n,p)=>n+p.depth,0)/4-b.pts.reduce((n,p)=>n+p.depth,0)/4);
    for(const {face,pts} of items){path(c,pts);c.fillStyle=shade(palette[m.color],face.tone*(lit?1:.55));c.fill();c.strokeStyle=c.fillStyle;c.lineWidth=.25;c.stroke();}
    c.font='600 '+Math.max(8,Math.min(12,w/60))+'px Arial, sans-serif';c.textAlign='center';c.fillStyle='#a9bc99';c.fillText('PARÇA',w*.25,h*.12);c.fillStyle=lit?'#dbe5c9':'#9bb18c';c.fillText(lit?'GÖLGE':'IŞIK KAPALI',w*.75,h*.12);
    c.strokeStyle='#c7fa5f55';c.setLineDash([3,5]);c.beginPath();c.moveTo(w*.5,h*.2);c.lineTo(w*.5,h*.8);c.stroke();c.restore();
  }
  window.KatmanyaShadow={build,mask,sanitize,render,projectShadow,accuracy,ideal,palette,layout,clamp};
})();
