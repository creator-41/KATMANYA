(() => {
  'use strict';
  const palette={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c'},R=4,G=90,GOAL=160;
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  function build({goal='Beyaz',base='Yeşil',arm='Mavi',caption=''}={}){if(!palette[goal]||!palette[base]||!palette[arm])throw Error('penalty-settings');return {goal,base,arm,caption:Array.from(String(caption).normalize('NFC').trim()).slice(0,10).join(''),width:120,length:190,height:60};}
  function cup(angle=0,power=45){const a=clamp(angle,-25,25)*Math.PI/180,t=.6*(1-clamp(power,0,100)/100),d=18*Math.cos(t);return {x:-Math.sin(a)*d,z:35-Math.cos(a)*d,y:8+18*Math.sin(t)};}
  function shot(angle=0,power=45){angle=clamp(angle,-25,25);power=clamp(power,0,100);const a=angle*Math.PI/180,speed=75+power*2.4,start=cup(angle,power),vx=Math.sin(a)*speed*Math.cos(.384),vz=Math.cos(a)*speed*Math.cos(.384),vy=speed*Math.sin(.384),cross=(GOAL-start.z)/vz,ground=(vy+Math.sqrt(vy*vy+2*G*(start.y-R)))/G,point=t=>({x:start.x+vx*t,y:start.y+vy*t-G*t*t/2,z:start.z+vz*t});
    let result,time;if(ground<cross){result='short';time=ground;}else{time=cross;const p=point(time);result=Math.abs(Math.abs(p.x)-36)<=R+2&&p.y<=54?'post':Math.abs(p.y-48)<=R+2&&Math.abs(p.x)<=42?'bar':Math.abs(p.x)+R<34&&p.y-R>0&&p.y+R<46?'goal':Math.abs(p.x)>30?'wide':'over';}
    return {angle,power,start,vx,vy,vz,result,time,hit:point(time),duration:time+.55};}
  function sample(s,t){t=clamp(t,0,s.duration);if(t<=s.time)return {x:s.start.x+s.vx*t,y:Math.max(R,s.start.y+s.vy*t-G*t*t/2),z:s.start.z+s.vz*t};const p=clamp((t-s.time)/.55),e=1-(1-p)*(1-p),hit=s.hit;
    if(s.result==='goal')return {x:hit.x*(1-.12*e),y:R+(hit.y-R)*(1-e),z:hit.z+12*e};
    if(['post','bar'].includes(s.result))return {x:hit.x*(1-.14*e),y:R+(hit.y-R)*(1-p)+5*Math.sin(Math.PI*p),z:hit.z-20*e};
    if(s.result==='short')return {x:hit.x+Math.sin(s.angle*Math.PI/180)*10*e,y:R+8*Math.sin(Math.PI*p)*(1-p),z:hit.z+10*e};
    return {x:clamp(hit.x+s.vx*.18*e,-78,78),y:Math.max(R,hit.y+(s.vy-G*s.time)*.35*p-G*.35*.35*p*p/2),z:clamp(hit.z+18*e,0,184)};}
  function layout(w,h){return {s:Math.min((w-55)/190,(h-65)/157),x:w/2-8,y:h-35};}
  function point(w,h,p){const l=layout(w,h);return {x:l.x+(p.x+p.z*.1)*l.s,y:l.y-(p.z*.55+p.y*.82)*l.s};}
  function shade(hex,k){const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,n>>8&255,n&255].map(v=>Math.round(clamp(v*k,0,255))).join(',')+')';}
  function path(c,ps){c.beginPath();ps.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
  function render(c,w,h,m,{angle=0,power=45,ball=null,time=0,flight=null,clear=true}={}){if(clear)c.clearRect(0,0,w,h);if(!m||w<90||h<180)return;const l=layout(w,h),s=l.s,P=p=>point(w,h,p),gc=palette[m.goal],bc=palette[m.base],ac=palette[m.arm],a=angle*Math.PI/180;
    c.save();c.lineJoin='round';c.lineCap='round';
    const surface=[{x:-58,z:0,y:0},{x:58,z:0,y:0},{x:58,z:184,y:0},{x:-58,z:184,y:0}];path(c,surface.map(p=>({...P(p),y:P(p).y+5*s})));c.fillStyle='#0006';c.fill();
    path(c,[surface[0],surface[1],{...surface[1],y:-4},{...surface[0],y:-4}].map(P));c.fillStyle=shade(bc,.35);c.fill();path(c,[surface[1],surface[2],{...surface[2],y:-4},{...surface[1],y:-4}].map(P));c.fillStyle=shade(bc,.45);c.fill();path(c,surface.map(P));c.fillStyle=bc;c.fill();
    path(c,[{x:-53,z:5,y:.4},{x:53,z:5,y:.4},{x:53,z:179,y:.4},{x:-53,z:179,y:.4}].map(P));c.fillStyle='#1c4935';c.fill();
    for(let z=10;z<170;z+=20){path(c,[{x:-52,z,y:.5},{x:52,z,y:.5},{x:52,z:z+10,y:.5},{x:-52,z:z+10,y:.5}].map(P));c.fillStyle='#ffffff05';c.fill();}
    function line(ps,color='#f3f1ec88',width=.7){c.beginPath();ps.map(P).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.strokeStyle=color;c.lineWidth=Math.max(.7,width*s);c.stroke();}
    line([{x:-48,z:9,y:.7},{x:48,z:9,y:.7},{x:48,z:169,y:.7},{x:-48,z:169,y:.7},{x:-48,z:9,y:.7}]);line([{x:-48,z:88,y:.7},{x:48,z:88,y:.7}]);line([{x:-40,z:169,y:.7},{x:-40,z:120,y:.7},{x:40,z:120,y:.7},{x:40,z:169,y:.7}]);line([{x:-25,z:169,y:.7},{x:-25,z:145,y:.7},{x:25,z:145,y:.7},{x:25,z:169,y:.7}]);
    const center=P({x:0,z:88,y:.7});c.beginPath();c.ellipse(center.x,center.y,15*s,15*s*.55,0,0,Math.PI*2);c.strokeStyle='#f3f1ec77';c.lineWidth=.7*s;c.stroke();
    // Net stays behind the crossing plane; it never decides the score visually.
    for(let x=-36;x<=36;x+=9)line([{x,z:174,y:0},{x,z:174,y:48}],'#f3f1ec55',.35);for(let y=0;y<=48;y+=8)line([{x:-36,z:174,y},{x:36,z:174,y}],'#f3f1ec55',.35);
    for(const x of [-36,36]){for(let y=0;y<=48;y+=8)line([{x,z:160,y},{x,z:174,y}],'#f3f1ec44',.35);line([{x,z:174,y:0},{x,z:174,y:48},{x,z:160,y:48}],shade(gc,.55),1.4);}line([{x:-36,z:174,y:48},{x:36,z:174,y:48}],shade(gc,.65),1.5);
    function frame(){line([{x:-36,z:160,y:0},{x:-36,z:160,y:48},{x:36,z:160,y:48},{x:36,z:160,y:0}],shade(gc,.5),3.3);line([{x:-36,z:160,y:0},{x:-36,z:160,y:48},{x:36,z:160,y:48},{x:36,z:160,y:0}],gc,2.3);}
    frame();path(c,[{x:-36,z:160,y:52},{x:36,z:160,y:52},{x:36,z:160,y:61},{x:-36,z:160,y:61}].map(P));c.fillStyle=gc;c.fill();const label=P({x:0,z:160,y:56.5});c.fillStyle=m.goal==='Siyah'?'#f3f1ec':'#14261b';c.textAlign='center';c.textBaseline='middle';c.font='700 '+5.5*s+'px Arial, sans-serif';c.fillText(m.caption||'KALE',label.x,label.y,65*s);
    // A short ground guide shows the direction without revealing the ballistic result.
    if(!flight){line([{x:0,z:40,y:.9},{x:Math.sin(a)*43,z:40+Math.cos(a)*43,y:.9}],'#c7fa5fbb',.7);const tip=P({x:Math.sin(a)*43,z:40+Math.cos(a)*43,y:.9});c.fillStyle='#c7fa5f';c.beginPath();c.arc(tip.x,tip.y,1.7*s,0,Math.PI*2);c.fill();}
    const pivot={x:0,z:35,y:4},t=.6*(1-power/100),tilt=flight?t+1.3*Math.sin(Math.PI*clamp(time/.32)):t,armEnd={x:-Math.sin(a)*18*Math.cos(tilt),z:35-Math.cos(a)*18*Math.cos(tilt),y:4+18*Math.sin(tilt)};
    const pl=P(pivot);c.fillStyle=shade(ac,.4);c.beginPath();c.ellipse(pl.x,pl.y+4*s,8*s,5*s,0,0,Math.PI*2);c.fill();line([{x:-7,z:35,y:4},{x:7,z:35,y:4}],ac,4);line([pivot,armEnd],shade(ac,.4),4);line([pivot,armEnd],ac,2.8);const cp=P(armEnd);c.fillStyle=shade(ac,.55);c.beginPath();c.ellipse(cp.x,cp.y,6*s,4*s,0,0,Math.PI*2);c.fill();c.strokeStyle=ac;c.lineWidth=1.6*s;c.stroke();
    const b=ball||(flight?sample(flight,time):cup(angle,power)),ground=P({...b,y:0}),p=P(b);c.fillStyle='#0005';c.beginPath();c.ellipse(ground.x,ground.y,4*s,2.3*s,0,0,Math.PI*2);c.fill();const grad=c.createRadialGradient(p.x-1.5*s,p.y-1.5*s,.1,p.x,p.y,4*s);grad.addColorStop(0,'#fff');grad.addColorStop(1,'#c6d4c6');c.fillStyle=grad;c.beginPath();c.arc(p.x,p.y,R*s,0,Math.PI*2);c.fill();c.fillStyle='#183522';c.beginPath();for(let i=0;i<5;i++){const k=-Math.PI/2+i*Math.PI*2/5;i?c.lineTo(p.x+Math.cos(k)*1.8*s,p.y+Math.sin(k)*1.8*s):c.moveTo(p.x+Math.cos(k)*1.8*s,p.y+Math.sin(k)*1.8*s);}c.closePath();c.fill();for(let i=0;i<3;i++){const k=i*Math.PI*2/3;c.beginPath();c.arc(p.x+Math.cos(k)*3*s,p.y+Math.sin(k)*3*s,.55*s,0,Math.PI*2);c.fill();}
    if(flight&&b.z>GOAL)frame();c.restore();}
  window.KatmanyaPenalty={build,cup,shot,sample,layout,point,render,palette,clamp,R,G,GOAL};
})();
