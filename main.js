(() => {
  'use strict';
  const canvas = document.querySelector('#printer');
  const story = document.querySelector('.print-story');
  const chapters = [...document.querySelectorAll('.chapter')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const bar = document.querySelector('#print-bar');
  const percent = document.querySelector('#print-percent');
  const layer = document.querySelector('#layer-value');
  const status = document.querySelector('#print-status');
  document.querySelector('#year').textContent = new Date().getFullYear();
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, powerPreference: 'low-power' });
  function fallback() {
    document.querySelector('.scene-fallback').hidden = false;
    canvas.hidden = true;
    story.style.height = '110svh';
  }
  const ctx = gl ? null : canvas.getContext('2d');
  if (!gl && !ctx) { fallback(); return; }
  const vertex = `
    attribute vec3 aPosition; attribute vec3 aNormal;
    uniform mat4 uModel; uniform mat4 uVP;
    varying vec3 vNormal; varying vec3 vWorld; varying float vY;
    void main(){ vec4 world=uModel*vec4(aPosition,1.0); vWorld=world.xyz;
      vNormal=normalize(mat3(uModel)*aNormal); vY=aPosition.y;
      gl_Position=uVP*world; }
  `;
  const fragment = `
    precision mediump float;
    uniform vec3 uColor; uniform float uClip; uniform float uRibs; uniform float uGlow; uniform vec3 uEye;
    varying vec3 vNormal; varying vec3 vWorld; varying float vY;
    void main(){ if(vY>uClip) discard;
      vec3 n=normalize(vNormal); vec3 l=normalize(vec3(-3.0,5.0,4.0));
      vec3 view=normalize(uEye-vWorld);
      float key=max(dot(n,l),0.0); float rim=pow(1.0-max(dot(n,view),0.0),3.0);
      float fill=max(dot(n,normalize(vec3(3.0,2.0,-3.0))),0.0);
      float spec=pow(max(dot(n,normalize(l+view)),0.0),40.0);
      vec3 col=uColor*(0.30+0.67*key+0.22*fill)+vec3(0.18,0.24,0.10)*rim+spec*0.15;
      if(uRibs>0.5) col*=0.82+0.18*smoothstep(0.08,0.5,fract(vY*89.0));
      col=mix(col,uColor,uGlow); gl_FragColor=vec4(col,1.0); }
  `;
  function shader(type, src) {
    const s=gl.createShader(type); gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s;
  }
  let program;
  if(gl) try { program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error('3D program could not link');
  } catch(err){ console.error(err); fallback(); return; }
  if(gl){gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);}
  const loc={}; if(gl){ ['uModel','uVP','uColor','uClip','uRibs','uGlow','uEye'].forEach(n=>loc[n]=gl.getUniformLocation(program,n));
  loc.pos=gl.getAttribLocation(program,'aPosition');loc.normal=gl.getAttribLocation(program,'aNormal');
  gl.enableVertexAttribArray(loc.pos);gl.enableVertexAttribArray(loc.normal);}
  const TAU=Math.PI*2, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  function mult(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
  function transform(p,s,rot=[0,0,0]){
    const [x,y,z]=rot, cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
    const rx=[1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1],ry=[cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1],rz=[cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1];
    const m=mult(mult(rz,ry),rx);for(let c=0;c<3;c++)for(let r=0;r<3;r++)m[c*4+r]*=s[c];m[12]=p[0];m[13]=p[1];m[14]=p[2];return m;
  }
  function camera(eye,target,aspect){
    const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);
    const view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];
    const f=1/Math.tan(36*Math.PI/360),near=.1,far=40;
    const proj=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];return mult(proj,view);
  }
  const TRIANGLES=4,LINES=1,LINE_STRIP=3;
  function mesh(data,mode=TRIANGLES,dynamic=false){if(!gl)return {data,mode,count:data.length/6};const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);return{buffer,count:data.length/6,mode};}
  function tri(data,a,b,c,na,nb,nc){const n=na||norm(cross(sub(b,a),sub(c,a)));[a,b,c].forEach((v,i)=>data.push(...v,...([na,nb,nc][i]||n)));}
  function quad(d,a,b,c,e){tri(d,a,b,c);tri(d,a,c,e);}
  const cubeData=[];
  [ [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]], [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]], [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]], [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]], [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]], [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]] ].forEach(q=>quad(cubeData,...q.map(v=>v.map(x=>x*.5))));
  const cube=mesh(cubeData);
  function cylinder(rt=1,rb=1,segments=gl?40:16){const d=[];for(let i=0;i<segments;i++){let a=i/segments*TAU,b=(i+1)/segments*TAU;const p=[Math.cos(a)*rb,-.5,Math.sin(a)*rb],q=[Math.cos(b)*rb,-.5,Math.sin(b)*rb],r=[Math.cos(b)*rt,.5,Math.sin(b)*rt],s=[Math.cos(a)*rt,.5,Math.sin(a)*rt];quad(d,p,s,r,q);tri(d,[0,.5,0],r,s,[0,1,0],[0,1,0],[0,1,0]);tri(d,[0,-.5,0],p,q,[0,-1,0],[0,-1,0],[0,-1,0]);}return mesh(d);}
  const cyl=cylinder(),cone=cylinder(1,.22,24);
  const H=1.3,bedY=.29;
  function radius(t,a){return .355+.09*Math.sin(t*TAU)+.035*Math.sin(t*Math.PI)+.026*Math.cos(12*a-t*6);}
  function point(t,a,inner=false){const r=radius(t,a)-(inner?.025:0);return [r*Math.cos(a),t*H,r*Math.sin(a)];}
  function normal(t,a){const p=point(t,a),pa=point(t,a+.002),py=point(t+.002,a);return norm(cross(sub(py,p),sub(pa,p)));}
  const vaseData=[];
  const rows=gl?130:36,cols=gl?96:48;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const t=j/rows,u=(j+1)/rows,a=i/cols*TAU,b=(i+1)/cols*TAU;
    const pa=point(t,a),pb=point(t,b),pc=point(u,b),pd=point(u,a),na=normal(t,a),nb=normal(t,b),nc=normal(u,b),nd=normal(u,a);
    tri(vaseData,pa,pb,pc,na,nb,nc);tri(vaseData,pa,pc,pd,na,nc,nd);
    const ia=point(t,a,true),ib=point(t,b,true),ic=point(u,b,true),id=point(u,a,true);
    tri(vaseData,ia,ic,ib,na.map(x=>-x),nc.map(x=>-x),nb.map(x=>-x));tri(vaseData,ia,id,ic,na.map(x=>-x),nd.map(x=>-x),nc.map(x=>-x));
  }
  const vase=mesh(vaseData),ring=mesh([],TRIANGLES,true),filament=mesh([],LINE_STRIP,true);
  const gridData=[];for(let i=-8;i<=8;i++){const n=i*.12;gridData.push(-.96,0,n,0,1,0,.96,0,n,0,1,0,n,0,-.96,0,1,0,n,0,.96,0,1,0);}const grid=mesh(gridData,LINES);
  function updateMesh(m,data){if(!gl){m.data=data;m.count=data.length/6;return;}gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);m.count=data.length/6;}
  const colors={frame:[.14,.17,.15],dark:[.055,.068,.06],edge:[.29,.33,.28],silver:[.51,.57,.49],acid:[.69,.94,.29],brass:[.66,.42,.15]};
  function draw(m,p,s,color,rot=[0,0,0],clip=99,ribs=0,glow=0,matrix=null){
    if(!gl){softDraw(m,matrix||transform(p,s,rot),color,clip,glow);return;}
    gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.vertexAttribPointer(loc.pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,24,12);
    gl.uniformMatrix4fv(loc.uModel,false,matrix||transform(p,s,rot));gl.uniform3fv(loc.uColor,color);gl.uniform1f(loc.uClip,clip);gl.uniform1f(loc.uRibs,ribs);gl.uniform1f(loc.uGlow,glow);gl.drawArrays(m.mode,0,m.count);
  }

  // Perspective Canvas renderer keeps the same live geometry on devices without WebGL.
  let softVP,faces=[];
  function softDraw(mesh,model,color,clip,glow){
    const data=mesh.data, combined=mult(softVP,model);
    const project=p=>{const v=[...p,1],q=[0,0,0,0];for(let r=0;r<4;r++)for(let c=0;c<4;c++)q[r]+=combined[c*4+r]*v[c];return [(q[0]/q[3]+1)*canvas.width/2,(1-q[1]/q[3])*canvas.height/2,q[2]/q[3]];};
    const vertex=i=>data.slice(i*6,i*6+3);
    if(mesh.mode!==TRIANGLES){
      const step=mesh.mode===LINES?2:1;
      for(let i=0;i<mesh.count-1;i+=step){const points=[project(vertex(i)),project(vertex(i+1))];faces.push({points,z:(points[0][2]+points[1][2])/2,color:'rgb('+color.map(x=>Math.round(x*200)).join(',')+')',line:true});}return;
    }
    for(let i=0;i<mesh.count;i+=3){
      let poly=[vertex(i),vertex(i+1),vertex(i+2)];
      if(poly.every(v=>v[1]>clip))continue;
      if(poly.some(v=>v[1]>clip)){
        const out=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length];if(a[1]<=clip)out.push(a);if((a[1]<=clip)!==(b[1]<=clip)){const t=(clip-a[1])/(b[1]-a[1]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}poly=out;
      }
      const n=data.slice(i*6+3,i*6+6),worldN=norm([model[0]*n[0]+model[4]*n[1]+model[8]*n[2],model[1]*n[0]+model[5]*n[1]+model[9]*n[2],model[2]*n[0]+model[6]*n[1]+model[10]*n[2]]);
      let light=.36+.62*Math.max(0,dot(worldN,[-.424,.707,.566]))+.18*Math.max(0,dot(worldN,[.64,.43,-.64]));light=light*(1-glow)+glow;
      const points=poly.map(project);faces.push({points,z:points.reduce((a,p)=>a+p[2],0)/points.length,color:'rgb('+color.map(x=>Math.round(Math.min(1,x*light)*255)).join(',')+')'});
    }
  }
  function softFlush(){
    faces.sort((a,b)=>b.z-a.z);ctx.lineJoin='round';
    for(const face of faces){ctx.beginPath();face.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=face.color;ctx.lineWidth=face.line?1:.45;if(face.line){ctx.stroke();}else{ctx.closePath();ctx.fillStyle=face.color;ctx.fill();ctx.stroke();}}
  }
  const box=(p,s,c=colors.frame)=>draw(cube,p,s,c);
  function rod(a,b,r,c){const d=sub(b,a),length=Math.hypot(...d),direction=norm(d);let u=norm(cross(Math.abs(direction[1])>.99?[1,0,0]:[0,1,0],direction)),v=cross(u,direction);
    const m=new Float32Array([u[0]*r,u[1]*r,u[2]*r,0,direction[0]*length,direction[1]*length,direction[2]*length,0,v[0]*r,v[1]*r,v[2]*r,0,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,1]);
    draw(cyl,[0,0,0],[1,1,1],c,[0,0,0],99,0,0,m);
  }
  let w=0,h=0,target=0,current=0,raf=0,last=0,visible=true,dirty=true;
  const chaptersAt=[0,.22,.52,.9];
  function measure(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=Math.min(devicePixelRatio||1,1.65);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);if(gl)gl.viewport(0,0,canvas.width,canvas.height);dirty=true;scroll();}
  function scroll(){const rect=story.getBoundingClientRect();target=clamp(-rect.top/Math.max(1,story.offsetHeight-window.innerHeight));dirty=true;start();}
  function setCopy(p){
    chapters.forEach((el,i)=>{let opacity=1;if(i>0)opacity*=smooth(chaptersAt[i]-.055,chaptersAt[i]+.025,p);if(i<3)opacity*=1-smooth(chaptersAt[i+1]-.07,chaptersAt[i+1]-.015,p);if(reduced.matches)opacity=i===0?1:0;
      el.style.opacity=opacity;el.style.visibility=opacity>.002?'visible':'hidden';el.style.pointerEvents=opacity>.6?'auto':'none';el.setAttribute('aria-hidden',opacity>.5?'false':'true');el.style.transform=window.innerWidth>800?'translateY(calc(-50% + '+((1-opacity)*18)+'px))':'translateY('+((1-opacity)*12)+'px)';});
  }
  function render(p){
    if(gl)gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);else{ctx.clearRect(0,0,canvas.width,canvas.height);faces=[];}
    const progress=reduced.matches?1:clamp((p-.10)/.77),finished=smooth(.88,1,p);
    const yaw=.48+Math.sin(p*Math.PI)*.16+finished*.62;
    const mobile=window.innerWidth<=800;
    const dist=mobile?7.1:6.8;
    const eye=[Math.sin(yaw)*dist,3.3+finished*.15,Math.cos(yaw)*dist];
    softVP=camera(eye,[.12,1.35+finished*.08,0],w/h);
    if(gl){gl.uniform3fv(loc.uEye,eye);gl.uniformMatrix4fv(loc.uVP,false,softVP);}
    // Low plinth, inset feet and a brushed build plate.
    box([0,.03,0],[2.5,.15,2.02],colors.dark);
    for(const x of [-1.03,1.03])for(const z of [-.79,.79])box([x,-.085,z],[.22,.12,.24],colors.dark);
    box([0,.14,0],[2.36,.11,1.96],colors.frame);
    box([0,.225,0],[2.04,.07,1.86],[.21,.235,.195]);
    box([0,.268,0],[1.98,.014,1.80],[.12,.15,.12]);
    draw(grid,[0,.277,0],[.95,1,.87],[.22,.28,.16],[0,0,0],99,0,.25);
    box([0,.17,.984],[1.92,.012,.015],colors.acid);
    // Aluminium uprights and top brace, with visible guide rails.
    for(const x of [-1.1,1.1]){
      box([x,1.43,-.63],[.16,2.5,.19],colors.frame);
      box([x-.041,1.43,-.525],[.022,2.4,.012],colors.silver);
      box([x+.036,1.43,-.526],[.022,2.4,.012],colors.dark);
      draw(cyl,[x,1.4,-.43],[.018,2.27,.018],colors.silver);
      box([x,2.7,-.62],[.23,.1,.23],colors.dark);
    }
    box([0,2.63,-.63],[2.4,.19,.2],colors.frame);
    box([0,2.64,-.515],[1.94,.027,.012],colors.dark);
    box([-.63,2.64,-.50],[.31,.02,.015],colors.acid);
    // Filament spool mounted on the right. Its spokes turn with the print.
    const spool=[1.47,2.1,-.61],spin=progress*TAU*2.5;
    rod([1.1,2.1,-.61],[1.75,2.1,-.61],.038,colors.silver);
    draw(cyl,spool,[.30,.23,.30],colors.acid,[0,0,Math.PI/2],99,1);
    for(const x of [1.32,1.62]){
      draw(cyl,[x,2.1,-.61],[.37,.045,.37],colors.dark,[0,0,Math.PI/2]);
      draw(cyl,[x+.026,2.1,-.61],[.087,.009,.087],colors.edge,[0,0,Math.PI/2]);
      for(let i=0;i<6;i++){const a=spin+i*TAU/6;rod([x+.025,2.1+Math.cos(a)*.13,-.61+Math.sin(a)*.13],[x+.025,2.1+Math.cos(a)*.29,-.61+Math.sin(a)*.29],.012,colors.edge);}
    }
    const height=progress*H,angle=progress*TAU*28,rr=radius(progress,angle);
    const intro=1-smooth(0,.10,p),park=finished;
    const nx=(rr*Math.cos(angle))*(1-intro)*(1-park)-.81*(intro+park);
    const nz=rr*Math.sin(angle)*(1-intro)*(1-park)-.25*(intro+park);
    const tipY=bedY+height+.012+intro*.25+park*.36;
    // Moving X carriage and short depth rail form one continuous mechanism.
    box([0,tipY+.27,-.47],[2.19,.10,.10],colors.silver);
    box([0,tipY+.35,-.56],[2.18,.025,.025],colors.dark);
    for(const x of [-1.1,1.1])box([x,tipY+.27,-.54],[.22,.26,.22],colors.dark);
    box([nx,tipY+.26,-.46],[.22,.23,.2],colors.frame);
    box([nx,tipY+.29,.07],[.06,.055,1.28],colors.silver);
    box([nx+.06,tipY+.3,.07],[.018,.025,1.26],colors.dark);
    if(progress>.0002){
      draw(vase,[0,bedY,0],[1,1,1],colors.acid,[0,0,0],height,1);
      draw(cyl,[0,bedY+.003,0],[.325,.006,.325],colors.acid);
      const ringData=[];for(let i=0;i<96;i++){let a=i/96*TAU,b=(i+1)/96*TAU;quad(ringData,point(progress,a),point(progress,b),point(progress,b,true),point(progress,a,true));}
      updateMesh(ring,ringData);draw(ring,[0,bedY+.001,0],[1,1,1],[.82,1,.46],[0,0,0],99,0,.15);
    }
    // Hot end, heatsink, fan housing and brass nozzle follow the deposition path.
    box([nx,tipY+.20,nz],[.22,.25,.2],colors.dark);
    box([nx,tipY+.20,nz+.106],[.18,.18,.013],colors.frame);
    draw(cyl,[nx,tipY+.2,nz+.12],[.063,.022,.063],colors.dark,[Math.PI/2,0,0]);
    for(let i=0;i<5;i++){const a=angle*2+i*TAU/5;rod([nx+Math.cos(a)*.022,tipY+.2+Math.sin(a)*.022,nz+.14],[nx+Math.cos(a+.4)*.048,tipY+.2+Math.sin(a+.4)*.048,nz+.14],.007,colors.edge);}
    box([nx+.067,tipY+.30,nz+.116],[.016,.028,.006],colors.acid);
    for(let i=0;i<4;i++)draw(cyl,[nx,tipY+.083+i*.013,nz],[.046,.008,.046],colors.silver);
    box([nx,tipY+.055,nz],[.067,.027,.058],colors.silver);
    draw(cone,[nx,tipY+.023,nz],[.028,.042,.028],colors.brass);
    if(progress>.001&&progress<.999)draw(cyl,[nx,tipY-.004,nz],[.016,.003,.016],[.91,1,.64],[0,0,0],99,0,1);
    // Flexible feed line arches from the spool to the print head.
    const curve=[];for(let i=0;i<=48;i++){const t=i/48,u=1-t;const a=[1.45,2.40,-.61],b=[.9,3.20,-.4],c=[nx,2.85,nz],d=[nx,tipY+.34,nz];const v=a.map((_,k)=>u*u*u*a[k]+3*u*u*t*b[k]+3*u*t*t*c[k]+t*t*t*d[k]);curve.push(...v,0,1,0);}
    updateMesh(filament,curve);draw(filament,[0,0,0],[1,1,1],colors.acid,[0,0,0],99,0,.65);
    // Front control panel and two indicator buttons.
    box([.79,.09,1.027],[.39,.12,.025],colors.dark);box([.76,.105,1.045],[.18,.04,.006],[.26,.4,.10]);
    draw(cyl,[.91,.1,1.058],[.034,.012,.034],colors.silver,[Math.PI/2,0,0]);
    if(!gl)softFlush();
    const pct=Math.round(progress*100);bar.style.width=pct+'%';percent.innerHTML=pct+'<span>%</span>';layer.textContent='KATMAN '+String(Math.round(progress*120)).padStart(3,'0')+' / 120';
    status.textContent=progress===0?'ÜRETİME HAZIR':progress>=1?'BASKI TAMAMLANDI':'KATMANLAR ŞEKİL ALIYOR';setCopy(p);
  }
  function frame(time){raf=0;if(!visible||document.hidden)return;const dt=Math.min((time-last)||16,60);last=time;const diff=target-current;current+=diff*(1-Math.exp(-dt/65));if(Math.abs(diff)<.00003)current=target;
    if(dirty||Math.abs(diff)>.00003){render(current);dirty=false;}
    if(Math.abs(target-current)>.00003)raf=requestAnimationFrame(frame);
  }
  function start(){if(!raf&&visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}}
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',measure,{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(measure).observe(canvas);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){dirty=true;start();}},{rootMargin:'100px'}).observe(story);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){dirty=true;start();}});
  reduced.addEventListener('change',()=>{measure();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);fallback();});
  measure();render(0);
})();
