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
  const year=document.querySelector('#year'); if(year)year.textContent=new Date().getFullYear();
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
  const H=1.65;
  // Each armor piece has actual depth and shares the same build-plane clipping.
  const helmetParts=[];
  function armor(points,color,depth=.045){
    const d=[],back=points.map(v=>[v[0],v[1],v[2]-depth]);
    const center=points.reduce((a,v)=>a.map((x,k)=>x+v[k]/points.length),[0,0,0]);
    for(let i=0;i<points.length;i++){
      const j=(i+1)%points.length;
      tri(d,center,points[i],points[j]);
      quad(d,points[i],back[i],back[j],points[j]);
    }
    helmetParts.push({mesh:mesh(d),color});
  }
  function mirrored(points,color,depth){
    armor(points,color,depth);
    armor(points.map(v=>[-v[0],v[1],v[2]]).reverse(),color,depth);
  }
  const porcelain=[.94,.95,.94],recess=[.57,.62,.63],blue=[.16,.22,.85],blueEdge=[.28,.36,.98],green=[.08,.63,.26],black=[.025,.033,.045];
  const shellData=[],sections=[[0,.14,.12],[.10,.25,.24],[.32,.40,.34],[.62,.49,.40],[.96,.53,.40],[1.22,.48,.36],[1.43,.36,.28],[1.58,.21,.17],[1.65,.02,.02]],steps=32;
  for(let j=0;j<sections.length-1;j++)for(let i=0;i<steps;i++){
    const [y0,x0,z0]=sections[j],[y1,x1,z1]=sections[j+1],a=i/steps*TAU,b=(i+1)/steps*TAU;
    const v=(x,y,z,t)=>[x*Math.sin(t),y,z*Math.cos(t)-.045];
    quad(shellData,v(x0,y0,z0,a),v(x0,y0,z0,b),v(x1,y1,z1,b),v(x1,y1,z1,a));
  }
  helmetParts.push({mesh:mesh(shellData),color:recess});
  // Deep continuous V visor, wrapped around the cheeks rather than a flat slit.
  mirrored([[0,.32,.435],[.24,.47,.455],[.44,.78,.385],[.49,1.09,.27],[.27,1.10,.455],[0,.92,.515]],black,.065);
  mirrored([[.08,.48,.444],[.20,.58,.465],[.39,.87,.395],[.27,.72,.455]],[.085,.10,.12],.006);
  // White brow and tapered central face shield.
  mirrored([[0,.72,.555],[.16,.80,.55],[.28,1.04,.49],[.26,1.34,.365],[.12,1.49,.29],[0,1.51,.33]],porcelain,.075);
  mirrored([[.16,.80,.55],[.33,.93,.43],[.40,1.18,.33],[.26,1.34,.365],[.28,1.04,.49]],[.83,.87,.87],.055);
  // Pointed chin ring follows the visor, leaving its full black V exposed.
  mirrored([[0,.025,.30],[.17,.09,.355],[.34,.29,.40],[.47,.55,.335],[.43,.68,.37],[.24,.38,.47],[0,.22,.485]],porcelain,.075);
  mirrored([[0,.025,.30],[.17,.09,.355],[.24,.22,.425],[0,.16,.45]],[.80,.84,.84],.03);
  // Layered temple armor and swept-back fins.
  mirrored([[.32,.51,.40],[.52,.65,.21],[.61,1.04,.02],[.49,1.23,.18],[.43,.99,.34]],porcelain,.10);
  mirrored([[.46,.66,.23],[.62,.85,-.08],[.61,1.14,-.17],[.52,1.26,.02]],[.78,.82,.82],.09);
  mirrored([[.49,1.17,.12],[.61,1.29,-.07],[.69,1.22,-.27],[.56,1.08,-.14]],porcelain,.055);
  mirrored([[.51,.86,-.06],[.67,.94,-.26],[.66,.77,-.39],[.50,.67,-.20]],[.64,.69,.70],.06);
  // Blue crown is a raised, tapered plate, with an inset top panel.
  armor([[-.19,1.25,.40],[.19,1.25,.40],[.22,1.46,.30],[.15,1.62,.16],[-.15,1.62,.16],[-.22,1.46,.30]],blue,.065);
  armor([[-.14,1.31,.421],[.14,1.31,.421],[.155,1.46,.329],[.10,1.54,.246],[-.10,1.54,.246],[-.155,1.46,.329]],blueEdge,.012);
  // Cobalt jaw modules and green temple clasps from the reference.
  mirrored([[.32,.27,.402],[.46,.34,.358],[.52,.58,.31],[.41,.63,.371],[.30,.48,.439]],blue,.09);
  mirrored([[.36,.32,.421],[.425,.37,.399],[.45,.52,.362],[.39,.55,.390],[.34,.46,.444]],blueEdge,.014);
  mirrored([[.48,.48,.29],[.66,.62,.10],[.65,.70,.07],[.49,.60,.29]],blue,.045);
  mirrored([[.46,1.08,.27],[.59,1.12,.15],[.61,1.29,.08],[.51,1.36,.16],[.44,1.25,.28]],green,.08);
  mirrored([[.49,1.12,.29],[.535,1.15,.25],[.55,1.27,.20],[.51,1.29,.23]],[.045,.25,.10],.012);
  mirrored([[.38,1.06,.36],[.43,1.10,.30],[.45,1.18,.28],[.40,1.16,.34]],black,.015);
  const filament=mesh([],LINE_STRIP,true);
  const gridData=[];for(let i=-8;i<=8;i++){const n=i*.12;gridData.push(-.96,0,n,0,1,0,.96,0,n,0,1,0,n,0,-.96,0,1,0,n,0,.96,0,1,0);}const grid=mesh(gridData,LINES);
  function updateMesh(m,data){if(!gl){m.data=data;m.count=data.length/6;return;}gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);m.count=data.length/6;}
  const colors={frame:[.14,.17,.15],dark:[.055,.068,.06],edge:[.29,.33,.28],silver:[.51,.57,.49],acid:[.69,.94,.29],brass:[.66,.42,.15],helmet:[.78,.82,.84],visor:[.018,.035,.052],blue:[.10,.20,.92],green:[.08,.65,.26]};
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
    const stride=mesh===cube?6:3;
    for(let i=0;i<mesh.count;i+=stride){
      let poly=stride===6?[vertex(i),vertex(i+1),vertex(i+2),vertex(i+5)]:[vertex(i),vertex(i+1),vertex(i+2)];
      if(poly.every(v=>v[1]>clip))continue;
      if(poly.some(v=>v[1]>clip)){
        const out=[];for(let j=0;j<poly.length;j++){const a=poly[j],b=poly[(j+1)%poly.length];if(a[1]<=clip)out.push(a);if((a[1]<=clip)!==(b[1]<=clip)){const t=(clip-a[1])/(b[1]-a[1]);out.push(a.map((v,k)=>v+(b[k]-v)*t));}}poly=out;
      }
      const n=data.slice(i*6+3,i*6+6),worldN=norm([model[0]*n[0]+model[4]*n[1]+model[8]*n[2],model[1]*n[0]+model[5]*n[1]+model[9]*n[2],model[2]*n[0]+model[6]*n[1]+model[10]*n[2]]);
      let light=.36+.62*Math.max(0,dot(worldN,[-.424,.707,.566]))+.18*Math.max(0,dot(worldN,[.64,.43,-.64]));light=light*(1-glow)+glow;
      const points=poly.map(project);
      if(points.length<3||(points[1][0]-points[0][0])*(points[2][1]-points[0][1])-(points[1][1]-points[0][1])*(points[2][0]-points[0][0])>=0)continue;
      faces.push({points,z:points.reduce((a,p)=>a+p[2],0)/points.length,color:'rgb('+color.map(x=>Math.round(Math.min(1,x*light)*255)).join(',')+')'});
    }
  }
  let softImage,depthBuffer;
  function softFlush(){
    const W=canvas.width,H=canvas.height;
    if(!softImage||softImage.width!==W||softImage.height!==H){softImage=ctx.createImageData(W,H);depthBuffer=new Float32Array(W*H);}
    const pixels=softImage.data;pixels.fill(0);depthBuffer.fill(Infinity);
    for(const face of faces){
      const rgb=face.color.match(/\d+/g).map(Number),pts=face.points;
      if(face.line){
        const [a,b]=pts,n=Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1])));
        for(let i=0;i<=n;i++){const t=n?i/n:0,x=Math.round(a[0]+(b[0]-a[0])*t),y=Math.round(a[1]+(b[1]-a[1])*t),z=a[2]+(b[2]-a[2])*t;
          if(x<0||x>=W||y<0||y>=H)continue;const k=y*W+x;
          if(z>depthBuffer[k]+.000018)continue;depthBuffer[k]=z;pixels[k*4]=rgb[0];pixels[k*4+1]=rgb[1];pixels[k*4+2]=rgb[2];pixels[k*4+3]=255;
        }continue;
      }
      for(let j=1;j<pts.length-1;j++){
        const a=pts[0],b=pts[j],c=pts[j+1];
        const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<.00001)continue;
        const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(W-1,Math.ceil(Math.max(a[0],b[0],c[0])));
        const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(H-1,Math.ceil(Math.max(a[1],b[1],c[1])));
        const ux=(b[1]-c[1])/den,uy=(c[0]-b[0])/den,vx=(c[1]-a[1])/den,vy=(a[0]-c[0])/den;
        for(let y=y0;y<=y1;y++){
          let u=ux*(x0+.5-c[0])+uy*(y+.5-c[1]),v=vx*(x0+.5-c[0])+vy*(y+.5-c[1]);
          for(let x=x0;x<=x1;x++,u+=ux,v+=vx){
            if(u<-.00001||v<-.00001||u+v>1.00001)continue;
            const z=c[2]+u*(a[2]-c[2])+v*(b[2]-c[2]),k=y*W+x;if(z>=depthBuffer[k])continue;
            depthBuffer[k]=z;pixels[k*4]=rgb[0];pixels[k*4+1]=rgb[1];pixels[k*4+2]=rgb[2];pixels[k*4+3]=255;
          }
        }
      }
    }
    ctx.putImageData(softImage,0,0);
  }
  const badge=document.querySelector('.printer-badge');
  function placeBadge(){
    const project=v=>{const q=[0,0,0,0],a=[...v,1];for(let r=0;r<4;r++)for(let c=0;c<4;c++)q[r]+=softVP[c*4+r]*a[c];return [(q[0]/q[3]+1)*w/2,(1-q[1]/q[3])*h/2];};
    const a=project([-.85,2.85,1.143]),b=project([.24,2.85,1.143]),d=project([-.85,2.66,1.143]);
    badge.style.transform='matrix('+[(b[0]-a[0])/200,(b[1]-a[1])/200,(d[0]-a[0])/40,(d[1]-a[1])/40,a[0],a[1]].join(',')+')';
    badge.style.visibility='visible';
  }
  const box=(p,s,c=colors.frame)=>draw(cube,p,s,c);
  function rod(a,b,r,c){const d=sub(b,a),length=Math.hypot(...d),direction=norm(d);let u=norm(cross(Math.abs(direction[1])>.99?[1,0,0]:[0,1,0],direction)),v=cross(u,direction);
    const m=new Float32Array([u[0]*r,u[1]*r,u[2]*r,0,direction[0]*length,direction[1]*length,direction[2]*length,0,v[0]*r,v[1]*r,v[2]*r,0,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,1]);
    draw(cyl,[0,0,0],[1,1,1],c,[0,0,0],99,0,0,m);
  }
  let w=0,h=0,target=0,current=0,raf=0,last=0,visible=true,dirty=true;
  const chaptersAt=[0,.16,.30,.44,.58,.74,.89];
  function measure(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=gl?Math.min(devicePixelRatio||1,1.65):Math.min(devicePixelRatio||1,800/Math.max(w,h));canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);if(gl)gl.viewport(0,0,canvas.width,canvas.height);dirty=true;scroll();}
  function scroll(){const rect=story.getBoundingClientRect();target=clamp(-rect.top/Math.max(1,story.offsetHeight-window.innerHeight));dirty=true;start();}
  function setCopy(p){
    chapters.forEach((el,i)=>{let opacity=1;if(i>0)opacity*=smooth(chaptersAt[i]-.025,chaptersAt[i]+.020,p);if(i<chapters.length-1)opacity*=1-smooth(chaptersAt[i+1]-.07,chaptersAt[i+1]-.025,p);
      el.style.opacity=opacity;el.style.visibility=opacity>.002?'visible':'hidden';el.style.pointerEvents=opacity>.6?'auto':'none';el.setAttribute('aria-hidden',opacity>.5?'false':'true');el.style.transform=window.innerWidth>800?'translateY(calc(-50% + '+((1-opacity)*18)+'px))':'translateY('+((1-opacity)*12)+'px)';});
  }
  function render(p){
    if(gl)gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);else{ctx.clearRect(0,0,canvas.width,canvas.height);faces=[];}
    const progress=reduced.matches?1:clamp(p),finished=smooth(.92,1,p);
    const yaw=.36+Math.sin(p*Math.PI)*.12+finished*.06;
    const mobile=window.innerWidth<=800;
    const dist=mobile?7.5:7.1;
    const eye=[Math.sin(yaw)*dist,3.3+finished*.15,Math.cos(yaw)*dist];
    softVP=camera(eye,[.25,1.43+finished*.08,0],w/h);
    if(gl){gl.uniform3fv(loc.uEye,eye);gl.uniformMatrix4fv(loc.uVP,false,softVP);}
    // Ender-5 Max inspired square frame, front badge, moving Z bed and top CoreXY gantry.
    const homeY=1.98,bedY=homeY-progress*H;
    box([0,.05,0],[2.64,.17,2.28],colors.dark);
    for(const x of [-1.08,1.08])for(const z of [-.91,.91])box([x,-.07,z],[.25,.12,.24],colors.dark);
    box([0,.17,0],[2.48,.12,2.12],colors.frame);
    box([0,.24,0],[2.30,.08,1.98],[.21,.235,.195]);
    // Four tall corner extrusions make the distinctive open cube chassis.
    for(const x of [-1.12,1.12])for(const z of [-.94,.94]){
      box([x,1.53,z],[.16,2.78,.17],colors.frame);
      box([x-.04,1.53,z+.09],[.022,2.66,.014],colors.silver);
      box([x+.04,1.53,z+.09],[.022,2.66,.014],colors.dark);
    }
    // Upper rectangular frame; the front rail carries Veysel's custom badge.
    box([0,2.91,-.94],[2.4,.18,.18],colors.frame);
    box([0,2.91,.94],[2.4,.18,.18],colors.frame);
    for(const x of [-1.12,1.12])box([x,2.91,0],[.18,.18,1.9],colors.frame);
    box([0,2.77,1.035],[2.40,.36,.16],colors.frame);
    box([-.25,2.77,1.121],[1.62,.27,.014],colors.dark);
    box([-.99,2.77,1.135],[.045,.12,.013],colors.acid);
    placeBadge();
    // Twin Z lead screws and guide rods under the bed.
    for(const x of [-.91,.91])for(const z of [-.73,.73]){
      draw(cyl,[x,1.02,z],[.024,1.68,.024],colors.silver);
      draw(cyl,[x+.095,1.02,z],[.018,1.68,.018],colors.edge);
    }
    // The broad plate descends as each layer is added, like the real Ender-5 Max.
    box([0,bedY-.12,0],[2.17,.16,1.92],colors.dark);
    box([0,bedY-.025,0],[2.07,.06,1.82],[.21,.235,.195]);
    box([0,bedY+.012,0],[1.99,.014,1.74],[.12,.15,.12]);
    draw(grid,[0,bedY+.02,0],[.96,1,.86],[.22,.28,.16],[0,0,0],99,0,.25);
    box([0,bedY-.09,.969],[1.92,.012,.014],colors.acid);
    // Four individual reels in an external two-level material rack.
    const reelColors=[porcelain,black,blue,green],spin=progress*TAU*2.5;
    const reels=[[1.57,2.24,.48],[1.57,2.24,-.46],[1.57,1.32,.48],[1.57,1.32,-.46]];
    box([1.38,1.79,-.02],[.06,1.86,1.68],colors.dark);
    for(let ri=0;ri<reels.length;ri++){
      const [rx,ry,rz]=reels[ri],rc=reelColors[ri];
      rod([1.30,ry,rz],[1.86,ry,rz],.035,colors.silver);
      draw(cyl,[rx,ry,rz],[.305,.26,.305],rc,[0,0,Math.PI/2],99,1);
      // Fine exposed rings leave the filament colors visible between the rims.
      for(const x of [rx-.15,rx+.15]){
        draw(cyl,[x,ry,rz],[.34,.027,.34],[.30,.32,.32],[0,0,Math.PI/2]);
        draw(cyl,[x+.018,ry,rz],[.285,.012,.285],rc,[0,0,Math.PI/2]);
        draw(cyl,[x+.028,ry,rz],[.082,.032,.082],colors.dark,[0,0,Math.PI/2]);
        for(let i=0;i<5;i++){const a=spin+i*TAU/5;rod([x+.03,ry+Math.cos(a)*.09,rz+Math.sin(a)*.09],[x+.03,ry+Math.cos(a)*.31,rz+Math.sin(a)*.31],.013,colors.edge);}
      }
      const feed=[];
      for(let i=0;i<=24;i++){const t=i/24,u=1-t;feed.push(rx*u+1.18*t,ry+.30+(3.10-ry-.30)*Math.sin(t*Math.PI/2),rz*u+(-.67+ri*.10)*t,0,1,0);}
      updateMesh(filament,feed);draw(filament,[0,0,0],[1,1,1],rc,[0,0,0],99,0,.4);
    }
    box([1.16,3.12,-.51],[.15,.12,.51],colors.dark);
    const height=progress*H,angle=progress*TAU*28;
    const intro=1-smooth(0,.10,p),park=finished;
    const nx=(.58*Math.cos(angle))*(1-intro)*(1-park)-.81*(intro+park);
    const nz=(.42*Math.sin(angle))*(1-intro)*(1-park)-.25*(intro+park);
    const tipY=homeY+.012+intro*.25+park*.36;
    // Top-mounted XY carriage moves the nozzle while the build plate lowers.
    box([0,2.54,nz],[2.07,.085,.10],colors.silver);
    box([0,2.59,nz],[2.08,.024,.024],colors.dark);
    box([nx,2.45,nz],[.23,.23,.22],colors.frame);
    box([nx,2.35,nz+.13],[.18,.18,.018],colors.dark);
    // All detailed armor surfaces grow continuously through the same horizontal layer.
    if(height>.001)for(const part of helmetParts)
      draw(part.mesh,[0,bedY+.027,0],[1,1,1],part.color,[0,0,0],height,1);
    // Hot end, heatsink, fan housing and brass nozzle follow the deposition path.
    box([nx,tipY+.22,nz],[.22,.25,.2],colors.dark);
    box([nx,tipY+.22,nz+.106],[.18,.18,.013],colors.frame);
    draw(cyl,[nx,tipY+.22,nz+.12],[.063,.022,.063],colors.dark,[Math.PI/2,0,0]);
    for(let i=0;i<5;i++){const a=angle*2+i*TAU/5;rod([nx+Math.cos(a)*.022,tipY+.22+Math.sin(a)*.022,nz+.14],[nx+Math.cos(a+.4)*.048,tipY+.15+Math.sin(a+.4)*.048,nz+.14],.007,colors.edge);}
    box([nx+.067,tipY+.32,nz+.116],[.016,.028,.006],colors.acid);
    for(let i=0;i<4;i++)draw(cyl,[nx,tipY+.10+i*.013,nz],[.046,.008,.046],colors.silver);
    box([nx,tipY+.075,nz],[.067,.027,.058],colors.silver);
    draw(cone,[nx,tipY+.023,nz],[.028,.042,.028],colors.brass);
    if(progress>.001&&progress<.999)draw(cyl,[nx,tipY+.047,nz],[.016,.003,.016],[.91,1,.64],[0,0,0],99,0,1);
    // Flexible feed line arches from the spool to the print head.
    const curve=[];for(let i=0;i<=48;i++){const t=i/48,u=1-t;const a=[1.16,3.18,-.51],b=[.65,3.40,-.4],c=[nx,2.95,nz],d=[nx,tipY+.45,nz];const v=a.map((_,k)=>u*u*u*a[k]+3*u*u*t*b[k]+3*u*t*t*c[k]+t*t*t*d[k]);curve.push(...v,0,1,0);}
    updateMesh(filament,curve);draw(filament,[0,0,0],[1,1,1],colors.acid,[0,0,0],99,0,.65);
    // Front control panel and two indicator buttons.
    box([.72,2.77,1.13],[.34,.32,.07],colors.dark);box([.72,2.77,1.17],[.27,.23,.012],[.12,.16,.12]);
    box([.72,2.60,1.178],[.24,.018,.008],colors.acid);
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
  window.addEventListener('pageshow',()=>{current=0;target=0;window.scrollTo({top:0,left:0,behavior:'instant'});measure();render(0);});
  window.scrollTo({top:0,left:0,behavior:'instant'});
  measure();render(0);
  const briefCopy=document.querySelector("#brief-copy");
  briefCopy?.addEventListener("click",async()=>{const text="Veysel 3D teklif talebi\n\nÜrün/fikir: \nÖlçüler: \nAdet: \nKullanım amacı: \nRenk tercihi: \nFotoğraf veya 3B dosya: ";const status=document.querySelector("#copy-status");try{await navigator.clipboard.writeText(text);status.textContent="Mesaj taslağı kopyalandı; bilgilerini doldurup bize gönderebilirsin.";}catch{status.textContent="Kopyalama desteklenmiyor. Bilgi listesini kullanarak mesajını hazırlayabilirsin.";} });
})();
