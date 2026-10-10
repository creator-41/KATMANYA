/* Two images live on opposite slopes of a closed corrugated plaque.
   UVs are prewarped for +/-55deg: visibility comes from geometry, not a crossfade. */
(() => {
  'use strict';
  const WIDTH=6.8,HEIGHT=2.15,RIDGES=40,RISE=.115,BACK=-.13,ANGLE=55*Math.PI/180;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function build(textures){
    const faces=[],step=WIDTH/RIDGES,overhang=Math.max(0,RISE*Math.tan(ANGLE)-step/2),span=WIDTH+overhang;
    const add=(vertices,normal,fill,extra={})=>faces.push({vertices,normal,fill,...extra});
    function box(x0,x1,y0,y1,z0,z1,fill,plaque=false){
      // The ridge slopes cover the front. A large coplanar front polygon would
      // sort through half the slopes at an oblique view and obscure the names.
      if(!plaque)add([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1],fill,{plaque});
      add([[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0]],[0,0,-1],fill,{plaque});
      add([[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0]],[-1,0,0],fill,{plaque});
      add([[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1]],[1,0,0],fill,{plaque});
      add([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],[0,1,0],fill,{plaque});
      add([[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0],fill,{plaque});
    }
    box(-WIDTH/2,WIDTH/2,-HEIGHT/2,HEIGHT/2,BACK,0,'#253429',true);
    for(const x of [-WIDTH*.34,WIDTH*.34])box(x-.34,x+.34,-HEIGHT/2-.18,-HEIGHT/2,-.58,.42,'#344237');
    const norm=Math.hypot(RISE,step/2),uv=(x,z,side)=>((x+z*Math.tan(side===0?ANGLE:-ANGLE)+WIDTH/2+(side?overhang:0))/span)*textures[side].width;
    for(let i=0;i<RIDGES;i++){
      const x0=-WIDTH/2+i*step,x1=x0+step/2,x2=x0+step;
      for(let side=0;side<2;side++){
        const xa=side?x1:x0,xb=side?x2:x1,za=side?RISE:0,zb=side?0:RISE;
        const u0=uv(xa,za,side),u1=uv(xb,zb,side),h=textures[side].height;
        add([[xa,-HEIGHT/2,za,u0,h],[xb,-HEIGHT/2,zb,u1,h],[xb,HEIGHT/2,zb,u1,0],[xa,HEIGHT/2,za,u0,0]],[(side?1:-1)*RISE/norm,0,(step/2)/norm],'#2b3b2b',{plaque:true,side,texture:textures[side]});
      }
      add([[x0,HEIGHT/2,0],[x1,HEIGHT/2,RISE],[x2,HEIGHT/2,0]],[0,1,0],'#465940',{plaque:true});
      add([[x2,-HEIGHT/2,0],[x1,-HEIGHT/2,RISE],[x0,-HEIGHT/2,0]],[0,-1,0],'#263423',{plaque:true});
    }
    return {faces,textures,span,overhang};
  }
  function clipBelow(vertices,limit){
    const result=[];
    for(let i=0;i<vertices.length;i++){
      const a=vertices[i],b=vertices[(i+1)%vertices.length],inside=a[1]<=limit,next=b[1]<=limit;
      if(inside)result.push(a);
      if(inside!==next){const t=(limit-a[1])/(b[1]-a[1]);result.push(a.map((v,j)=>v+(b[j]-v)*t));}
    }
    return result;
  }
  function project(x,y,z,yaw,pitch){
    const depth=-x*Math.sin(yaw)+z*Math.cos(yaw);
    return [x*Math.cos(yaw)+z*Math.sin(yaw),-y*Math.cos(pitch)+depth*Math.sin(pitch),depth*Math.cos(pitch)+y*Math.sin(pitch)];
  }
  function scene(model,{yaw=ANGLE,pitch=.12,progress=1}={}){
    progress=clamp(progress,0,1);const eye=[-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)],limit=-HEIGHT/2+HEIGHT*progress;
    const faces=model.faces.slice();
    if(progress>0&&progress<1){
      faces.push({vertices:[[-WIDTH/2,limit,BACK],[WIDTH/2,limit,BACK],[WIDTH/2,limit,0],[-WIDTH/2,limit,0]],normal:[0,1,0],fill:'#6e8b4f'});
      for(let i=0;i<RIDGES;i++){const x=-WIDTH/2+i*WIDTH/RIDGES;faces.push({vertices:[[x,limit,0],[x+WIDTH/RIDGES/2,limit,RISE],[x+WIDTH/RIDGES,limit,0]],normal:[0,1,0],fill:'#91b952'});}
    }
    return faces.filter(f=>f.normal.reduce((s,v,i)=>s+v*eye[i],0)>.0001&&(!f.plaque||progress>0)).map(f=>{
      const vertices=f.plaque&&progress<1?clipBelow(f.vertices,limit):f.vertices;
      const points=vertices.map(v=>project(v[0],v[1],v[2],yaw,pitch));
      return {...f,vertices,points,depth:points.reduce((s,p)=>s+p[2],0)/Math.max(points.length,1)};
    }).filter(f=>f.points.length>=3).sort((a,b)=>a.depth-b.depth);
  }
  function render(ctx,w,h,model,opts={}){
    const yaw=opts.yaw??ANGLE,pitch=opts.pitch??.12,progress=opts.progress??1;
    if(opts.clear!==false)ctx.clearRect(0,0,w,h);if(!model)return;
    const full=model.faces.flatMap(f=>f.vertices.map(v=>project(v[0],v[1],v[2],yaw,pitch))),xs=full.map(p=>p[0]),ys=full.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const scale=Math.min(w*.82/(xmax-xmin),h*.66/(ymax-ymin)),cx=w/2-(xmin+xmax)/2*scale,cy=h*.46-(ymin+ymax)/2*scale,toScreen=p=>[cx+p[0]*scale,cy+p[1]*scale];
    ctx.save();ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(cx,h*.80,Math.min(w*.38,WIDTH*scale*.45),h*.035,0,0,Math.PI*2);ctx.fill();ctx.restore();
    for(const f of scene(model,{yaw,pitch,progress})){
      const p=f.points.map(toScreen);ctx.save();ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fillStyle=f.fill;ctx.fill();
      if(f.texture){
        ctx.clip();const vs=f.vertices,p0=p[0],v0=vs[0];let j=1;while(j<vs.length&&Math.abs(vs[j][3]-v0[3])<.001)j++;
        let k=1;while(k<vs.length&&Math.abs(vs[k][4]-v0[4])<.001)k++;
        if(j<vs.length&&k<vs.length){
          // Orthographic projection makes every textured quad affine. Solve its UV basis.
          const du1=vs[j][3]-v0[3],dv1=vs[j][4]-v0[4],du2=vs[k][3]-v0[3],dv2=vs[k][4]-v0[4],det=du1*dv2-du2*dv1;
          if(Math.abs(det)>.001){const dx1=p[j][0]-p0[0],dy1=p[j][1]-p0[1],dx2=p[k][0]-p0[0],dy2=p[k][1]-p0[1],a=(dx1*dv2-dx2*dv1)/det,b=(dy1*dv2-dy2*dv1)/det,c=(dx2*du1-dx1*du2)/det,d=(dy2*du1-dy1*du2)/det;ctx.transform(a,b,c,d,p0[0]-a*v0[3]-c*v0[4],p0[1]-b*v0[3]-d*v0[4]);const left=clamp(Math.floor(Math.min(...vs.map(v=>v[3])))-1,0,f.texture.width),right=clamp(Math.ceil(Math.max(...vs.map(v=>v[3])))+1,0,f.texture.width);if(right>left)ctx.drawImage(f.texture,left,0,right-left,f.texture.height,left,0,right-left,f.texture.height);}
        }
      }
      ctx.restore();
    }
    if(progress<1&&opts.scan!==false){
      const y=-HEIGHT/2+HEIGHT*progress,a=toScreen(project(-WIDTH/2,y,RISE,yaw,pitch)),b=toScreen(project(WIDTH/2,y,RISE,yaw,pitch));
      ctx.save();ctx.strokeStyle='#c7fa5f';ctx.lineWidth=2;ctx.shadowBlur=12;ctx.shadowColor='#c7fa5f';ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();ctx.shadowBlur=0;
      const x=(Math.sin(progress*35)*.5)*WIDTH*.9,p=toScreen(project(x,y,RISE+.08,yaw,pitch));ctx.fillStyle='#1c2420';ctx.fillRect(p[0]-12,p[1]-22,24,18);ctx.fillStyle='#c7fa5f';ctx.beginPath();ctx.moveTo(p[0]-5,p[1]-4);ctx.lineTo(p[0]+5,p[1]-4);ctx.lineTo(p[0],p[1]+2);ctx.fill();ctx.restore();
    }
  }
  window.KatmanyaAngle={WIDTH,HEIGHT,RIDGES,RISE,ANGLE,build,scene,render,project,clipBelow};
})();
