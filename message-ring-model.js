(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const palette = {Yeşil:'#c7fa5f', Beyaz:'#f3f1ec', Mavi:'#5795ef', Siyah:'#39443c'};
  const mod = (n, d) => ((n % d) + d) % d;
  function build({count=4, diameter=60, body='Siyah', wheel='Yeşil', messages=[]}={}) {
    if (![3,4].includes(count) || ![60,72].includes(diameter) || !palette[body] || !palette[wheel]) throw Error('ring-settings');
    return {count, diameter, body, wheel, thickness:8, step:TAU/count,
      messages:Array.from({length:count},(_,i)=>String(messages[i]||'').normalize('NFC').trim().slice(0,18))};
  }
  function selected(angle, count) {return mod(Math.round(-angle/(TAU/count)),count);}
  function snap(angle, count) {return Math.round(angle/(TAU/count))*(TAU/count);}
  function layout(w,h) {return {x:w/2,y:h*.55,s:Math.min(w/94,h/109),sy:.88,shear:.1};}
  function point(w,h,x,y) {const l=layout(w,h);return {x:l.x+l.s*(x+l.shear*y),y:l.y+l.s*l.sy*y};}
  function local(w,h,x,y) {const l=layout(w,h),py=(y-l.y)/(l.s*l.sy);return {x:(x-l.x)/l.s-l.shear*py,y:py};}
  function circle(c,r,x=0,y=0) {c.moveTo(x+r,y);c.arc(x,y,r,0,TAU);}
  function annulus(c,outer,inner,x=0,y=0) {c.beginPath();circle(c,outer,x,y);circle(c,inner,x,y);c.fill('evenodd');}
  function windowPath(c) {c.beginPath();c.roundRect(-15,-23.5,30,9,2);}
  function render(c,w,h,m,{angle=0,clear=true,ghosts=true}={}) {
    if (!m || !(w>0&&h>0) || !Number.isFinite(angle)) return;
    if(clear)c.clearRect(0,0,w,h);
    const l=layout(w,h);c.save();c.translate(l.x,l.y);c.scale(l.s,l.s*l.sy);c.transform(1,0,l.shear,1,0,0);
    // All holes are transparent paths; the message wheel is clipped by the fixed aperture.
    c.save();c.fillStyle='#00000048';c.beginPath();c.ellipse(2,42,31,5,0,0,TAU);c.fill();c.restore();
    for(let z=5;z>=1;z--){c.save();c.translate(0,z);c.fillStyle='#17231b';annulus(c,32,0);c.fillRect(-4,-35,8,6);c.restore();}
    for(let z=2;z>=1;z--){c.save();c.translate(0,z);c.fillStyle='#17231b';annulus(c,7,3.3,0,-40);c.restore();}
    c.fillStyle=palette[m.body];c.fillRect(-4,-35,8,6);annulus(c,7,3.3,0,-40);
    c.strokeStyle='#ffffff36';c.lineWidth=.5;c.beginPath();circle(c,7,0,-40);circle(c,3.3,0,-40);c.stroke();
    const gradient=c.createLinearGradient(-30,-28,30,30);gradient.addColorStop(0,palette[m.wheel]);gradient.addColorStop(1,m.wheel==='Beyaz'?'#b6c0b1':m.wheel==='Siyah'?'#202b24':m.wheel==='Mavi'?'#3064a6':'#85a43d');
    c.fillStyle=gradient;annulus(c,32,28);
    c.save();c.rotate(angle);for(let i=0;i<64;i++){const a=i*TAU/64;c.strokeStyle=i%2?'#ffffff32':'#14221675';c.lineWidth=.55;c.beginPath();c.moveTo(Math.cos(a)*29.4,Math.sin(a)*29.4);c.lineTo(Math.cos(a)*31.8,Math.sin(a)*31.8);c.stroke();}
    for(let i=0;i<m.count;i++){const a=i*m.step-Math.PI/2;c.fillStyle=m.wheel==='Siyah'?'#c7fa5f':'#15231b';c.beginPath();circle(c,.8,Math.cos(a)*30.5,Math.sin(a)*30.5);c.fill();}c.restore();
    c.fillStyle=palette[m.wheel];c.beginPath();circle(c,28);c.fill();
    c.save();windowPath(c);c.clip();c.rotate(angle);c.fillStyle=m.wheel==='Siyah'?'#f3f1ec':'#15231b';c.textAlign='center';c.textBaseline='middle';
    for(let i=0;i<m.count;i++){c.save();c.rotate(i*m.step);c.translate(0,-19);const text=m.messages[i]||(ghosts?'MESAJ '+String(i+1).padStart(2,'0'):'');let font=4.1;c.font='700 '+font+'px Arial, sans-serif';const width=c.measureText(text).width;if(width>26){font*=26/width;c.font='700 '+font+'px Arial, sans-serif';}c.fillText(text,0,0);c.restore();}c.restore();
    // The stationary face has a real opening rather than painting over its text.
    c.fillStyle=palette[m.body];c.beginPath();circle(c,28);c.roundRect(-15,-23.5,30,9,2);c.fill('evenodd');
    const faceShade=c.createLinearGradient(-20,-28,20,28);faceShade.addColorStop(0,'#ffffff12');faceShade.addColorStop(1,'#00000025');c.fillStyle=faceShade;c.beginPath();circle(c,28);c.roundRect(-15,-23.5,30,9,2);c.fill('evenodd');
    c.strokeStyle='#00000066';c.lineWidth=.8;windowPath(c);c.stroke();c.strokeStyle='#ffffff22';c.lineWidth=.45;c.beginPath();circle(c,28);c.stroke();
    const ink=m.body==='Beyaz'?'#283b2c':'#d2e3c4';c.fillStyle=ink;c.beginPath();c.moveTo(-1.6,-26);c.lineTo(1.6,-26);c.lineTo(0,-23.5);c.fill();
    c.textAlign='center';c.textBaseline='middle';c.font='600 2.2px Arial, sans-serif';c.fillText('DÖNDÜR · KEŞFET',0,-5.5);
    c.strokeStyle=ink;c.lineWidth=.6;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-4,2+i*2);c.lineTo(0,4+i*2);c.lineTo(4,2+i*2);c.stroke();}
    c.font='700 3.1px Arial, sans-serif';c.fillText('KATMANYA',0,16);c.font='500 2px Arial, sans-serif';c.fillText('BİR HALKA · '+m.count+' MESAJ',0,21);
    c.restore();
  }
  window.KatmanyaMessageRing={build,render,selected,snap,point,local,palette};
})();
