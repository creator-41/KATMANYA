(() => {
  'use strict';
  const palette={Yeşil:[199,250,95],Mavi:[87,149,239],Beyaz:[243,241,236],Siyah:[69,78,72]};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function symbol(name){
    if(name==='bolt')return [[.58,0],[.1,.57],[.44,.57],[.35,1],[.9,.37],[.56,.37]];
    if(name==='triangle')return [[.5,0],[1,.87],[0,.87]];
    if(name==='star')return Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,r=i%2?.22:.5;return [.5+Math.cos(a)*r,.5+Math.sin(a)*r];});
    if(name==='circle')return Array.from({length:40},(_,i)=>{const a=i/40*Math.PI*2;return [.5+Math.cos(a)*.48,.5+Math.sin(a)*.48];});
    if(name==='heart')return Array.from({length:60},(_,i)=>{const t=i/60*Math.PI*2;return [.5+Math.sin(t)**3*.48,.48-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*.033];});
    return [];
  }
  function build({orientation='portrait',width=72,height=150,thickness=10,angle=65,cable=true,color='Yeşil',accent='Beyaz',icon='none'}={}){
    if(!['portrait','landscape'].includes(orientation)||!palette[color]||!palette[accent]||!['none','bolt','triangle','star','circle','heart'].includes(icon)||![width,height,thickness,angle].every(Number.isFinite)||width<60||width>90||height<125||height>180||thickness<7||thickness>18||angle<55||angle>75)throw Error('phone-settings');
    const pw=orientation==='portrait'?width:height,ph=orientation==='portrait'?height:width,W=orientation==='portrait'?Math.max(80,width+10):Math.max(104,height*.74),L=orientation==='portrait'?96:58;
    const rad=angle*Math.PI/180,up=[0,Math.sin(rad),-Math.cos(rad)],normal=[0,Math.cos(rad),Math.sin(rad)],faces=[];
    const local=(x,s,n)=>[x,12+s*up[1]+n*normal[1],8+s*up[2]+n*normal[2]];
    const add=(vertices,tone='body',shade=1,part='stand',texture=null)=>faces.push({vertices,tone,shade,part,texture});
    function box(x0,y0,z0,x1,y1,z1,tone='body',part='stand',map=(x,y,z)=>[x,y,z]){
      const p=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]].map(v=>map(...v));
      [[4,5,6,7],[0,3,2,1],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]].forEach((q,i)=>add(q.map(k=>p[k]),tone,[.94,.65,.73,.84,1.08,.6][i],part));
    }
    // The base is split around a real 18 mm opening leading in from the front.
    if(cable){box(-W/2,0,-55,W/2,5,2);box(-W/2,0,2,-9,5,36);box(9,0,2,W/2,5,36);}
    else box(-W/2,0,-55,W/2,5,36);
    // Backrest and cradle are expressed in the same tilted coordinate system as the phone.
    if(cable){box(-W/2,0,-2,-9,18,2,'body','stand',local);box(9,0,-2,W/2,18,2,'body','stand',local);box(-W/2,18,-2,W/2,L,2,'body','stand',local);}
    else box(-W/2,0,-2,W/2,L,2,'body','stand',local);
    const arms=cable?[[-W/2,-9],[9,W/2]]:[[-W/2,W/2]];
    for(const [a,b] of arms){box(a,0,2,b,4,thickness+8,'accent','front',local);box(a,0,thickness+5,b,11,thickness+8,'accent','front',local);}
    // Two triangular ribs transfer the backrest to the rear of the foot.
    for(const x of [-W*.34,W*.34]){
      const a=[x,5,-51],b=[x,5,4],c=local(x,L-12,-2),d=[x+4,5,-51],e=[x+4,5,4],f=local(x+4,L-12,-2);
      add([a,b,c],'body',.7);add([d,f,e],'body',.88);add([a,c,f,d],'body',.84);add([b,e,f,c],'body',1.04);
    }
    // The caption bridge leaves a cable passage beneath it, rather than covering the notch.
    box(-W/2,14,32,W/2,25,36,'accent','front');
    for(const [a,b] of arms)box(a,5,32,b,14,36,'accent','front');
    const captionRight=icon==='none'?W/2-5:W/2-23;
    add([[-W/2+5,23,36.3],[captionRight,23,36.3],[captionRight,16,36.3],[-W/2+5,16,36.3]],'label',1,'front','caption');
    const points=symbol(icon);
    if(points.length){
      const shape=points.map(([x,y])=>[W/2-19+x*9,23-y*9,36.8]);add(shape,'ink',1,'front');
      for(let i=0;i<shape.length;i++){const a=shape[i],b=shape[(i+1)%shape.length];add([[a[0],a[1],36.2],[b[0],b[1],36.2],b,a],'ink',.7,'front');}
    }
    box(-pw/2,6,3,pw/2,ph+6,thickness+3,'phone','phone',local);
    add([local(-pw/2+3,ph+3,thickness+3.3),local(pw/2-3,ph+3,thickness+3.3),local(pw/2-3,9,thickness+3.3),local(-pw/2+3,9,thickness+3.3)],'screen',1,'phone','screen');
    const maxY=12+(ph+6)*up[1]+(thickness+4)*normal[1],standHeight=12+L*up[1]+2*normal[1];
    return {faces,width:W,phoneWidth:pw,phoneHeight:ph,maxY,standHeight,orientation,angle,cable,color,accent,icon,device:{width,height,thickness},local};
  }
  function clip(vertices,top){const out=[];for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],inside=a[1]<=top,next=b[1]<=top;if(inside)out.push(a);if(inside!==next){const t=(top-a[1])/(b[1]-a[1]);out.push(a.map((v,j)=>v+(b[j]-v)*t));}}return out;}
  function render(c,w,h,m,{yaw=-.42,pitch=.16,phone=1,progress=1,captionTexture=null,screenTexture=null,clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!m)return;
    const unit=Math.min(w/(Math.max(m.width,m.phoneWidth)+100),h/(m.maxY+75)),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),center=m.maxY*.46,items=[];
    function project(v){const [x,y,z]=v,xx=x*cy+z*sy,zz=-x*sy+z*cy,yy=(y-center)*cp-zz*sp,depth=zz*cp+(y-center)*sp,f=700/(700-depth);return {x:w/2+xx*unit*f,y:h*.54-yy*unit*f,depth};}
    const ink=m.accent==='Beyaz'?[32,43,35]:[243,241,236],tones={body:palette[m.color],accent:palette[m.accent],ink,phone:[28,35,31],screen:[27,62,44],label:palette[m.accent]};
    c.save();c.fillStyle='#0006';c.beginPath();c.ellipse(w/2,h*.87,unit*m.width*.58,unit*12,0,0,Math.PI*2);c.fill();c.restore();
    for(const face of m.faces){
      const isPhone=face.part==='phone';if(isPhone&&(phone<=0||progress<1))continue;
      let vertices=face.vertices;
      if(!isPhone&&progress<1){vertices=clip(vertices,m.standHeight*clamp(progress,0,1));if(vertices.length<3)continue;}
      if(isPhone){const lift=(1-phone)*80;vertices=vertices.map(([x,y,z])=>[x,y+lift,z+(1-phone)*20]);}
      const [a,b,d]=vertices,ab=b.map((v,i)=>v-a[i]),ad=d.map((v,i)=>v-a[i]);
      let nx=ab[1]*ad[2]-ab[2]*ad[1],ny=ab[2]*ad[0]-ab[0]*ad[2],nz=ab[0]*ad[1]-ab[1]*ad[0];
      if(face.texture){nx=-nx;ny=-ny;nz=-nz;}
      if(face.tone==='ink'&&vertices.every(v=>v[2]===vertices[0][2]))nz=Math.abs(nz);
      if((-nx*sy+nz*cy)*cp+ny*sp<=0)continue;
      const pts=vertices.map(project),color=tones[face.tone].map(v=>Math.round(clamp(v*face.shade,0,255)));
      items.push({pts,face,color:'rgb('+color.join(',')+')',alpha:isPhone?clamp(phone*2,0,1):1,depth:pts.reduce((s,p)=>s+p.depth,0)/pts.length});
    }
    // The device sits in front of the backrest and behind the cradle. Keeping those
    // layers ordered prevents long rib polygons from painting over the screen.
    const rank=part=>cy>=0?(part==='phone'?1:part==='front'?2:0):(part==='phone'?0:1);
    items.sort((a,b)=>rank(a.face.part)-rank(b.face.part)||a.depth-b.depth);
    const captions=[];
    function paintTexture(pts,texture){const [a,b,,d]=pts;c.save();c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.clip();c.transform((b.x-a.x)/texture.width,(b.y-a.y)/texture.width,(d.x-a.x)/texture.height,(d.y-a.y)/texture.height,a.x,a.y);c.drawImage(texture,0,0);c.restore();}
    for(const item of items){const {pts,face}=item;c.save();c.globalAlpha=item.alpha;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=item.color;c.fill();c.strokeStyle=item.color;c.lineWidth=.4;c.stroke();
      const texture=progress>=1?(face.texture==='caption'?captionTexture:face.texture==='screen'?screenTexture:null):null;
      if(texture&&pts.length===4){if(face.texture==='caption')captions.push({pts,texture});else paintTexture(pts,texture);}
      c.restore();
    }
    for(const {pts,texture} of captions)paintTexture(pts,texture);
    if(progress<1){const y=m.standHeight*progress,a=project([-m.width/2,y,20]),b=project([m.width/2,y,20]);c.save();c.strokeStyle='#c7fa5f';c.lineWidth=2;c.shadowBlur=10;c.shadowColor='#c7fa5f';c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.shadowBlur=0;const head=project([Math.sin(progress*38)*m.width*.4,y,20]);c.fillStyle='#202b24';c.fillRect(head.x-12,head.y-20,24,14);c.fillStyle='#c7fa5f';c.beginPath();c.moveTo(head.x-5,head.y-6);c.lineTo(head.x+5,head.y-6);c.lineTo(head.x,head.y);c.fill();c.restore();}
  }
  window.KatmanyaPhone={build,render,symbol};
})();
