(() => {
  'use strict';
  const palette={Yeşil:'#c7fa5f',Beyaz:'#f3f1ec',Mavi:'#5795ef',Siyah:'#39443c'},TAU=Math.PI*2;
  const mod=n=>((n%10)+10)%10;
  function build({format='mini',body='Siyah',rings='Yeşil',message=''}={}){
    if(!['mini','wide'].includes(format)||!palette[body]||!palette[rings])throw Error('capsule-settings');
    return {format,body,rings,message:String(message).normalize('NFC').trim().slice(0,80),diameter:format==='mini'?35:45,height:format==='mini'?85:105};
  }
  const digit=n=>mod(Math.round(n));
  const matches=(code,values)=>/^\d{3}$/.test(code)&&values.length===3&&values.every((v,i)=>Number.isFinite(v)&&digit(v)===Number(code[i]));
  const geometry=m=>({r:m.diameter/2,h:m.height,centers:[-m.height*.21,-m.height*.21+16,-m.height*.21+32]});
  function layout(w,h,m){return{x:w/2,y:h*.57,s:Math.min(w/90,h/(m.height+75))};}
  function local(w,h,m,x,y){const l=layout(w,h,m);return{x:(x-l.x)/l.s,y:(y-l.y)/l.s};}
  function point(w,h,m,x,y){const l=layout(w,h,m);return{x:l.x+l.s*x,y:l.y+l.s*y};}
  function shade(hex,amount){const n=parseInt(hex.slice(1),16),f=x=>Math.round(Math.max(0,Math.min(255,x*amount)));return 'rgb('+[f(n>>16),f(n>>8&255),f(n&255)].join(',')+')';}
  function cylinder(c,r,y,height,color){const e=r*.26,g=c.createLinearGradient(-r,0,r,0);g.addColorStop(0,shade(color,.42));g.addColorStop(.23,shade(color,.88));g.addColorStop(.55,shade(color,1.12));g.addColorStop(1,shade(color,.52));c.fillStyle=g;c.beginPath();c.moveTo(-r,y);c.lineTo(-r,y+height);c.ellipse(0,y+height,r,e,0,Math.PI,0,true);c.lineTo(r,y);c.closePath();c.fill();c.fillStyle=shade(color,1.05);c.beginPath();c.ellipse(0,y,r,e,0,0,TAU);c.fill();c.strokeStyle='#ffffff25';c.lineWidth=.35;c.stroke();c.strokeStyle='#00000035';c.beginPath();c.ellipse(0,y+height,r,e,0,0,Math.PI);c.stroke();}
  function wrap(c,text,max){const words=text.split(/\s+/),lines=[];let line='';for(const word of words){const candidate=line?line+' '+word:word;if(c.measureText(candidate).width<=max){line=candidate;continue;}if(line){lines.push(line);line='';}let chunk='';for(const ch of word){if(c.measureText(chunk+ch).width>max&&chunk){lines.push(chunk);chunk='';}chunk+=ch;}line=chunk;}if(line)lines.push(line);return lines;}
  function render(c,w,h,m,{values=[0,0,0],open=0,active=0,shake=0,clear=true,hideDigits=false}={}){
    if(!m||!(w>0&&h>0)||!Number.isFinite(open)||values.length!==3||values.some(v=>!Number.isFinite(v)))return;
    if(clear)c.clearRect(0,0,w,h);open=Math.max(0,Math.min(1,open));const l=layout(w,h,m),{r,h:height,centers}=geometry(m),top=-height/2+12,bottom=height/2;
    c.save();c.translate(l.x+shake*l.s,l.y);c.scale(l.s,l.s);c.fillStyle='#00000045';c.beginPath();c.ellipse(2,bottom+10,r*1.5,5,0,0,TAU);c.fill();
    // The cap and its inner carrier rise together; the message is occluded by the shell while shut.
    if(open>0){c.fillStyle='#b9c9ab';c.fillRect(-1.2,top-36*open,2.4,40*open+5);}
    if(open>.05){c.save();const cy=top-24*open;c.translate(0,cy);c.fillStyle='#efe9d7';c.strokeStyle='#c2bda8';c.lineWidth=.4;c.beginPath();c.roundRect(-r*.79,0,r*1.58,20,1.2);c.fill();c.stroke();c.fillStyle='#26382b';c.font='600 2.5px Arial, sans-serif';c.textAlign='center';c.textBaseline='top';const lines=wrap(c,m.message||'MESAJIN BURADA',r*1.4);const dy=Math.min(3.1,16/Math.max(lines.length,1));lines.slice(0,7).forEach((text,i)=>c.fillText(text,0,2+i*dy));c.restore();}
    cylinder(c,r,top,bottom-top,palette[m.body]);
    // Hollow opening of the fixed shell becomes visible as the lid lifts.
    if(open>.05){c.fillStyle='#07100a';c.beginPath();c.ellipse(0,top,r*.77,r*.19,0,0,TAU);c.fill();c.strokeStyle='#d2e3c450';c.lineWidth=.6;c.stroke();}
    for(let band=0;band<3;band++){
      const cy=centers[band],bh=11.5;cylinder(c,r+1,cy-bh/2,bh,palette[m.rings]);
      c.fillStyle=shade(palette[m.body],.8);c.beginPath();c.ellipse(0,cy-bh/2,r-.7,(r-.7)*.26,0,0,TAU);c.fill();
      c.save();c.beginPath();c.rect(-r-1,cy-bh/2+.5,(r+1)*2,bh-1);c.clip();
      for(let n=0;n<10;n++){const a=(n-values[band])*TAU/10,cos=Math.cos(a);if(cos<=.1)continue;const x=Math.sin(a)*(r+.6);c.save();c.translate(x,cy+1.8);c.scale(cos,1);c.globalAlpha=.25+.75*cos;c.fillStyle=m.rings==='Siyah'?'#f3f1ec':'#14221a';c.font='700 5px Arial, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(hideDigits?'•':String(n),0,0);c.restore();}
      c.restore();
      for(let n=0;n<20;n++){const a=(n/2-values[band])*TAU/10,co=Math.cos(a);if(co<.1)continue;const x=Math.sin(a)*(r+.9);c.strokeStyle='#15231b40';c.lineWidth=.3;c.beginPath();c.moveTo(x,cy+bh/2-2.2);c.lineTo(x,cy+bh/2-.6);c.stroke();}
      c.strokeStyle=band===active?'#c7fa5f':'#ffffff30';c.lineWidth=band===active?.65:.35;c.strokeRect(-4.5,cy-2,9,7);
      c.fillStyle=band===active?'#c7fa5f':'#9ab18b';c.beginPath();c.moveTo(-r-6,cy);c.lineTo(-r-3,cy+1.5);c.lineTo(-r-6,cy+3);c.fill();
    }
    c.fillStyle=m.body==='Beyaz'?'#25392a':'#d2e3c4';c.textAlign='center';c.textBaseline='middle';c.font='700 2.8px Arial, sans-serif';c.fillText('KATMANYA',0,bottom-10);c.font='500 1.8px Arial, sans-serif';c.fillText('SÜRPRİZ İÇERİDE',0,bottom-5);
    cylinder(c,r+1.4,-height/2-36*open,12,palette[m.body]);
    c.strokeStyle=open>.9?'#c7fa5f':m.body==='Beyaz'?'#25392a':'#d2e3c4';c.lineWidth=.65;const lockY=-height/2+5-36*open;c.beginPath();c.roundRect(-2.4,lockY,4.8,3.4,.5);c.stroke();c.beginPath();c.arc(open>.9?1.2:0,lockY,1.6,Math.PI,0);c.stroke();
    if(open>.9){c.strokeStyle='#c7fa5f80';c.lineWidth=.5;for(let i=0;i<6;i++){const a=i*TAU/6;c.beginPath();c.moveTo(Math.cos(a)*(r+7),-height/2-24+Math.sin(a)*12);c.lineTo(Math.cos(a)*(r+9),-height/2-24+Math.sin(a)*15);c.stroke();}}
    c.restore();
  }
  window.KatmanyaCapsule={build,render,digit,matches,geometry,local,point,wrap,palette};
})();
