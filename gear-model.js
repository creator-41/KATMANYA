(() => {
  'use strict';
  const TAU=Math.PI*2,palette={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c'};
  const teeth=[16,24,16],ratios=[-1.5,1,-1.5],phases=[Math.PI/16,0,Math.PI/16];
  const inv=a=>Math.tan(a)-a;
  function outline(n,module=1.4){
    const pitch=n*module/2,base=pitch*Math.cos(Math.PI/9),root=pitch-1.25*module,tip=pitch+module,half=Math.PI/(2*n)-.08/(2*pitch),ip=inv(Math.PI/9),points=[];
    const put=(r,a)=>points.push({x:r*Math.cos(a),y:r*Math.sin(a)}),halfAt=r=>half+ip-inv(Math.acos(Math.min(1,base/r)));
    for(let i=0;i<n;i++){
      const a=i*TAU/n;put(root,a-Math.PI/n);put(root,a-half-ip);put(base,a-half-ip);
      for(let j=1;j<=8;j++){const r=base+(tip-base)*j/8;put(r,a-halfAt(r));}
      const ht=halfAt(tip);for(let j=1;j<=4;j++)put(tip,a-ht+2*ht*j/4);
      for(let j=7;j>=0;j--){const r=base+(tip-base)*j/8;put(r,a+halfAt(r));}
      put(root,a+half+ip);put(root,a+Math.PI/n);
    }
    return points;
  }
  function build({format='mini',body='Siyah',colors=['Yeşil','Beyaz','Mavi'],caption='',symbol='bolt'}={}){
    if(!['mini','wide'].includes(format)||!palette[body]||colors.length!==3||colors.some(c=>!palette[c])||!['none','bolt','heart','star','circle'].includes(symbol))throw Error('gear-settings');
    return {format,body,colors:colors.slice(),caption:Array.from(String(caption).normalize('NFC').trim()).slice(0,12).join(''),symbol,width:format==='mini'?96:115,height:format==='mini'?48:58,depth:format==='mini'?12:14,scale:format==='mini'?1:1.2,gears:teeth.map((n,i)=>({n,x:(i-1)*28,y:0,r:n*.7,outline:outline(n)}))};
  }
  const angles=t=>ratios.map((r,i)=>phases[i]+r*t);
  const advance=(theta,index,delta)=>theta+delta/ratios[index];
  const shortest=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function layout(w,h){return{x:w/2,y:h*.5,s:Math.min((w-36)/103,(h-86)/49)};}
  function local(w,h,x,y){const l=layout(w,h);return{x:(x-l.x)/l.s,y:(y-l.y)/l.s/.76};}
  function point(w,h,x,y){const l=layout(w,h);return{x:l.x+x*l.s,y:l.y+y*l.s*.76};}
  function hit(m,p){let found=-1;for(let i=0;i<3;i++)if(Math.hypot(p.x-m.gears[i].x,p.y)<m.gears[i].r+1.5)found=i;return found;}
  function shade(hex,k){const n=parseInt(hex.slice(1),16),f=x=>Math.round(Math.min(255,Math.max(0,x*k)));return 'rgb('+[f(n>>16),f(n>>8&255),f(n&255)].join(',')+')';}
  function path(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
  function icon(c,name){c.beginPath();if(name==='bolt'){c.moveTo(1,-4);c.lineTo(-3,1);c.lineTo(0,1);c.lineTo(-1,4);c.lineTo(3,-1);c.lineTo(0,-1);c.closePath();}else if(name==='heart'){c.moveTo(0,3.5);c.bezierCurveTo(-8,-1,-3.5,-6,0,-2.8);c.bezierCurveTo(3.5,-6,8,-1,0,3.5);}else if(name==='star'){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?1.8:4;(i?c.lineTo:c.moveTo).call(c,Math.cos(a)*r,Math.sin(a)*r);}c.closePath();}else if(name==='circle')c.arc(0,0,3.1,0,TAU);else return;c.fill();}
  function render(c,w,h,m,{theta=0,active=1,clear=true}={}){
    if(!m||!Number.isFinite(theta)||w<=36||h<=86)return;
    if(clear)c.clearRect(0,0,w,h);const l=layout(w,h),a=angles(theta);c.save();c.translate(l.x,l.y);c.scale(l.s,l.s*.76);
    c.fillStyle='#00000050';c.beginPath();c.ellipse(2,10,47,23,0,0,TAU);c.fill();
    for(const [dy,k] of [[6,.42],[0,.82]]){c.save();c.translate(0,dy);const g=c.createLinearGradient(0,-24,0,24);g.addColorStop(0,shade(palette[m.body],1.2*k));g.addColorStop(1,shade(palette[m.body],k));c.fillStyle=g;c.beginPath();c.roundRect(-48,-24,96,48,24);c.fill();c.strokeStyle='#ffffff20';c.lineWidth=.35;c.stroke();c.restore();}
    c.strokeStyle='#ffffff13';c.lineWidth=.25;for(let y=-20;y<24;y+=1.3){c.beginPath();const x=Math.sqrt(Math.max(0,24*24-y*y))+24;c.moveTo(-x,y);c.lineTo(x,y);c.stroke();}
    for(let i=0;i<3;i++){
      const gear=m.gears[i],color=palette[m.colors[i]];
      c.save();c.translate(gear.x,gear.y+1.5);c.scale(1,1);c.rotate(a[i]);path(c,gear.outline);c.fillStyle='#00000075';c.fill();c.restore();
      // The fixed axle does not rotate; the wheel, spokes and decoration do.
      for(const dy of [0,-4]){c.save();c.translate(gear.x,gear.y+dy);c.rotate(a[i]);path(c,gear.outline);const g=c.createLinearGradient(-gear.r,-gear.r,gear.r,gear.r);g.addColorStop(0,shade(color,dy===0?.5:1.18));g.addColorStop(1,shade(color,dy===0?.3:.72));c.fillStyle=g;c.fill();c.strokeStyle=dy===0?'#00000050':'#ffffff45';c.lineWidth=.25;c.stroke();
        if(dy===-4){c.strokeStyle=shade(color,.58);c.lineWidth=1.4;for(let spoke=0;spoke<6;spoke++){const s=spoke*TAU/6;c.beginPath();c.moveTo(Math.cos(s)*gear.r*.62,Math.sin(s)*gear.r*.62);c.lineTo(Math.cos(s)*gear.r*.83,Math.sin(s)*gear.r*.83);c.stroke();}c.fillStyle=shade(color,.88);c.beginPath();c.arc(0,0,gear.r*.52,0,TAU);c.fill();c.strokeStyle='#ffffff30';c.lineWidth=.4;c.stroke();c.fillStyle=m.colors[i]==='Siyah'?'#f3f1ec':'#14221a';
          if(i===1){if(m.caption){c.font='700 3.1px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(m.caption,0,-5.2,23);}if(m.symbol!=='none'){c.save();c.translate(0,m.caption?5.4:5);icon(c,m.symbol);c.restore();}}else{c.beginPath();c.arc(0,-gear.r*.3,1,0,TAU);c.fill();}
        }c.restore();}
      c.save();c.translate(gear.x,-4);c.fillStyle='#697865';c.beginPath();c.arc(0,0,2.25,0,TAU);c.fill();c.strokeStyle='#d9e2d1';c.lineWidth=.35;c.stroke();c.strokeStyle='#243328';c.lineWidth=.65;c.beginPath();c.moveTo(-1.1,-.6);c.lineTo(1.1,.6);c.stroke();c.restore();
      if(i===active){c.strokeStyle='#c7fa5f90';c.lineWidth=.35;c.setLineDash([1.5,1.5]);c.beginPath();c.ellipse(gear.x,-4,gear.r+2.4,gear.r+2.4,0,0,TAU);c.stroke();c.setLineDash([]);}
    }
    c.font='700 2px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=m.body==='Beyaz'?'#25392a':'#a8bc99';c.fillText('KATMANYA',0,21);c.restore();
  }
  window.KatmanyaGear={build,render,outline,angles,advance,shortest,hit,local,point,palette,ratios,teeth};
})();
