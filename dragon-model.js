(() => {
  'use strict';
  const TAU=Math.PI*2,STEP=8.4,MAX_TURN=.9,palette={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c',Turuncu:'#ffb05a'};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),shortest=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function build({tail='short',body='Yeşil',spines='Beyaz',eyes='Turuncu',caption=''}={}){
    if(!['short','long'].includes(tail)||!palette[body]||!palette[spines]||!palette[eyes])throw Error('dragon-settings');
    return {tail,body,spines,eyes,caption:Array.from(String(caption).normalize('NFC').trim()).slice(0,10).join(''),joints:tail==='long'?20:14,length:tail==='long'?180:130,width:25,height:18};
  }
  function straight(m){return Array.from({length:m.joints+1},(_,i)=>({x:m.joints*STEP/2-i*STEP,y:0}));}
  function coil(m){const delta=TAU/(m.joints+4),r=STEP/(2*Math.sin(delta/2));return Array.from({length:m.joints+1},(_,i)=>({x:-r*Math.sin(i*delta),y:-r*Math.cos(i*delta)}));}
  function angles(points){const out=[];for(let i=1;i<points.length;i++){let a=Math.atan2(points[i].y-points[i-1].y,points[i].x-points[i-1].x);if(out.length)a=out[out.length-1]+shortest(a-out[out.length-1]);out.push(a);}return out;}
  function fromAngles(head,list){const points=[{...head}];list.forEach(a=>{const p=points[points.length-1];points.push({x:p.x+Math.cos(a)*STEP,y:p.y+Math.sin(a)*STEP});});return points;}
  function fit(points){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),dx=clamp(0,-94-Math.min(...xs),94-Math.max(...xs)),dy=clamp(0,-62-Math.min(...ys),62-Math.max(...ys));return points.map(p=>({x:p.x+dx,y:p.y+dy}));}
  function blend(from,to,t){const a=angles(from),b=angles(to);const shift=Math.round((a[0]-b[0])/TAU)*TAU;return fit(fromAngles({x:from[0].x+(to[0].x-from[0].x)*t,y:from[0].y+(to[0].y-from[0].y)*t},a.map((v,i)=>v+(b[i]+shift-v)*t)));}
  function radius(m,index){return index===0?10:index>m.joints-3?Math.max(1.5,4.6-(index-(m.joints-3))*1.1):4.6;}
  function safe(m,points){
    if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>96||Math.abs(p.y)>64))return false;
    for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++)if(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<radius(m,i)+radius(m,j)+.3)return false;return true;
  }
  function canBlend(m,from,to){for(let i=0;i<=64;i++)if(!safe(m,blend(from,to,i/64)))return false;return true;}
  function follow(m,points,target){
    let current=points.map(p=>({...p})),dx=clamp(target.x,-94,94)-current[0].x,dy=clamp(target.y,-62,62)-current[0].y,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2)),blocked=false;
    // Small steps keep followers stable even when a pointer jumps a long distance.
    for(let k=0;k<n;k++){
      const next=[{x:current[0].x+dx/n,y:current[0].y+dy/n}];let previous;
      for(let i=1;i<current.length;i++){const p=next[i-1];let a=Math.atan2(current[i].y-p.y,current[i].x-p.x);if(i>1)a=previous+clamp(shortest(a-previous),-MAX_TURN,MAX_TURN);next.push({x:p.x+Math.cos(a)*STEP,y:p.y+Math.sin(a)*STEP});previous=a;}
      if(!safe(m,next)){blocked=true;break;}current=next;
    }
    return {points:current,blocked};
  }
  function layout(w,h){return{x:w/2,y:h*.5,s:Math.min((w-38)/218,(h-50)/132)};}
  function point(w,h,p){const l=layout(w,h);return{x:l.x+p.x*l.s,y:l.y+p.y*l.s*.78};}
  function local(w,h,x,y){const l=layout(w,h);return{x:(x-l.x)/l.s,y:(y-l.y)/l.s/.78};}
  function hitHead(m,points,p){const a=Math.atan2(points[0].y-points[1].y,points[0].x-points[1].x),dx=p.x-points[0].x,dy=p.y-points[0].y,x=dx*Math.cos(a)+dy*Math.sin(a),y=-dx*Math.sin(a)+dy*Math.cos(a);return x>=-10&&x<=15&&Math.abs(y)<=10;}
  function shade(hex,k){const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,n>>8&255,n&255].map(v=>Math.round(clamp(v*k,0,255))).join(',')+')';}
  function path(c,pts){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();}
  function bodyPath(c,r=1){path(c,[[-4.2*r,-3.2*r],[-1.8*r,-4.7*r],[2.2*r,-4.5*r],[4.4*r,-2.4*r],[4.8*r,0],[4.4*r,2.4*r],[2.2*r,4.5*r],[-1.8*r,4.7*r],[-4.2*r,3.2*r]]);}
  function headPath(c){c.beginPath();c.moveTo(-5,-5);c.bezierCurveTo(-1,-8,4,-6,5,-4);c.bezierCurveTo(13,-5,16,-2,14,1);c.bezierCurveTo(14,5,8,5,4,4);c.bezierCurveTo(0,7,-6,6,-6,1);c.closePath();}
  function render(c,w,h,m,{points=null,highlight=true,fitView=false,clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!m||w<50||h<90)return;points=points||straight(m);if(points.length!==m.joints+1)return;
    let l=layout(w,h);if(fitView){const xs=points.map(p=>p.x),ys=points.map(p=>p.y),minX=Math.min(...xs)-18,maxX=Math.max(...xs)+20,minY=Math.min(...ys)-16,maxY=Math.max(...ys)+16,s=Math.min((w-32)/(maxX-minX),(h-32)/((maxY-minY)*.78));l={x:w/2-(minX+maxX)*s/2,y:h/2-(minY+maxY)*s*.78/2,s};}
    const direction=angles(points).map(a=>a+Math.PI),letters=Array.from(m.caption),color=palette[m.body],spine=palette[m.spines],eye=palette[m.eyes];
    c.save();c.translate(l.x,l.y);c.scale(l.s,l.s*.78);c.lineCap='round';c.lineJoin='round';
    c.strokeStyle='#0005';c.lineWidth=12;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x+1,p.y+5):c.moveTo(p.x+1,p.y+5));c.stroke();
    c.strokeStyle=shade(color,.42);c.lineWidth=3.2;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y+1):c.moveTo(p.x,p.y+1));c.stroke();
    for(let i=points.length-1;i>=1;i--){const p=points[i],a=direction[i-1],r=radius(m,i)/4.6;
      if(i===3){c.save();c.translate(p.x,p.y+1);c.rotate(a);for(const sign of [-1,1]){c.fillStyle=shade(color,.7);path(c,[[2,sign*3],[-1,sign*12],[-4,sign*8],[-7,sign*11],[-8,sign*5],[-3,sign*2]]);c.fill();c.strokeStyle=spine;c.lineWidth=.5;c.beginPath();c.moveTo(2,sign*3);c.lineTo(-1,sign*12);c.moveTo(2,sign*3);c.lineTo(-7,sign*11);c.stroke();}c.restore();}
      if(i===2||i===5){c.save();c.translate(p.x,p.y+2);c.rotate(a);for(const sign of [-1,1]){c.fillStyle=shade(color,.65);path(c,[[-2,sign*2],[-5,sign*7],[0,sign*8],[2,sign*6],[2,sign*3]]);c.fill();c.strokeStyle=spine;c.lineWidth=.5;for(const x of [-2,0,2]){c.beginPath();c.moveTo(x,sign*6);c.lineTo(x,sign*7.5);c.stroke();}}c.restore();}
      for(const depth of [2.5,0]){c.save();c.translate(p.x,p.y+depth);c.rotate(a);bodyPath(c,r);const g=c.createLinearGradient(0,-5,0,5);g.addColorStop(0,shade(color,depth? .6:1.18));g.addColorStop(1,shade(color,depth?.35:.74));c.fillStyle=g;c.fill();c.strokeStyle=depth?'#0004':'#ffffff3b';c.lineWidth=.3;c.stroke();
        if(!depth){c.strokeStyle=shade(color,.53);c.lineWidth=.55;c.beginPath();c.moveTo(-2.8*r,-2.7*r);c.lineTo(.3*r,-1.4*r);c.lineTo(2.8*r,-2.8*r);c.moveTo(-2.8*r,2.7*r);c.lineTo(.3*r,1.4*r);c.lineTo(2.8*r,2.8*r);c.stroke();
          // The back spine and the letter tile occupy separate regions of each segment.
          c.fillStyle=shade(spine,.65);path(c,[[-3.7*r,-2.8*r],[-1.2*r,-7.8*r],[1.4*r,-3.8*r]]);c.fill();c.fillStyle=spine;path(c,[[-3.7*r,-2.8*r],[-1.2*r,-7.8*r],[-.8*r,-3.4*r]]);c.fill();
          if(letters[letters.length-i]&&i<=m.joints-3){c.fillStyle=m.body==='Siyah'?'#f3f1ec':'#14271b';c.font='700 4px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(letters[letters.length-i],.5,-.1,5.5);}
        }c.restore();}
    }
    const head=points[0],a=direction[0];
    c.save();c.translate(head.x,head.y+2.5);c.rotate(a);headPath(c);c.fillStyle=shade(color,.4);c.fill();c.restore();
    c.save();c.translate(head.x,head.y);c.rotate(a);
    for(const sign of [-1,1]){c.fillStyle=shade(spine,.7);path(c,[[-2,sign*4],[-8,sign*13],[-6,sign*2]]);c.fill();c.fillStyle=spine;path(c,[[-2,sign*4],[-8,sign*13],[-4.5,sign*5]]);c.fill();}
    const hg=c.createLinearGradient(0,-7,0,7);hg.addColorStop(0,shade(color,1.23));hg.addColorStop(1,shade(color,.79));headPath(c);c.fillStyle=hg;c.fill();c.strokeStyle='#ffffff50';c.lineWidth=.4;c.stroke();
    for(const sign of [-1,1]){c.fillStyle='#15231c';c.beginPath();c.ellipse(2,sign*3.4,2.3,2,0,0,TAU);c.fill();c.fillStyle=eye;c.beginPath();c.ellipse(2.3,sign*3.4,1.65,1.5,0,0,TAU);c.fill();c.fillStyle='#112117';c.beginPath();c.ellipse(2.7,sign*3.4,.45,1.15,0,0,TAU);c.fill();c.fillStyle='#ffffff';c.beginPath();c.arc(1.7,sign*3.4-.55,.45,0,TAU);c.fill();c.fillStyle=shade(color,.4);c.beginPath();c.ellipse(10.5,sign*1.9,.9,.65,0,0,TAU);c.fill();}
    c.strokeStyle=shade(color,.45);c.lineWidth=.6;c.beginPath();c.moveTo(5.5,3.1);c.quadraticCurveTo(10,4.5,13,2);c.stroke();c.strokeStyle='#ffffff55';c.lineWidth=.35;c.beginPath();c.moveTo(6,-2.3);c.lineTo(10,-2.7);c.stroke();c.restore();
    if(highlight){c.strokeStyle='#c7fa5f80';c.lineWidth=.55;c.setLineDash([2,2]);c.beginPath();c.ellipse(head.x+Math.cos(a)*3,head.y+Math.sin(a)*3,17,13,a,0,TAU);c.stroke();c.setLineDash([]);}
    c.restore();
  }
  window.KatmanyaDragon={build,straight,coil,angles,fromAngles,blend,canBlend,follow,safe,radius,render,layout,local,point,hitHead,palette,STEP,MAX_TURN};
})();
