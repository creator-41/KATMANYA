(() => {
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function build({pixels,cols,rows,aspect,contrast=100}){
    if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<2||rows<2||cols>160||rows>160||pixels.length!==cols*rows*4||!Number.isFinite(aspect)||aspect<=0)throw Error('lamp-data');
    const width=aspect>=1?3.5:3.5*aspect,height=aspect>=1?3.5/aspect:3.5,values=new Float32Array(cols*rows),thickness=new Float32Array(cols*rows);
    for(let i=0;i<values.length;i++){const a=pixels[i*4+3]/255,lum=(.2126*pixels[i*4]+.7152*pixels[i*4+1]+.0722*pixels[i*4+2])/255*a+1-a;values[i]=clamp((lum-.5)*contrast/100+.5,0,1);thickness[i]=.04-Math.log(.08+.92*values[i])*.08;}
    const corners=new Float32Array((cols+1)*(rows+1));
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){let sum=0,count=0;for(const dy of [-1,0])for(const dx of [-1,0]){const cx=x+dx,ry=y+dy;if(cx>=0&&cx<cols&&ry>=0&&ry<rows){sum+=thickness[ry*cols+cx];count++;}}corners[y*(cols+1)+x]=sum/count;}
    return {cols,rows,width,height,values,thickness,corners};
  }
  function render(c,w,h,m,{yaw=-.26,pitch=.08,lit=true,brightness=80,warm=true,progress=1,caption='',captionTexture=null,clear=true}={}){
    if(clear)c.clearRect(0,0,w,h);if(!m)return;
    const unit=Math.min(w/(m.width+2.1),h/(m.height+1.7)),cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),faces=[],center=(m.height+.65)/2;
    const project=(x,y,z)=>{const xx=x*cy+z*sy,zz=-x*sy+z*cy,yy=(y-center)*cp-zz*sp,d=zz*cp+(y-center)*sp,f=8/(8-d);return {x:w/2+xx*unit*f,y:h*.5-yy*unit*f,depth:d};};
    const polygon=(verts,color)=>{const pts=verts.map(v=>project(...v));faces.push({pts,color,depth:pts.reduce((s,p)=>s+p.depth,0)/pts.length});};
    function box(x0,y0,z0,x1,y1,z1,color){const p=[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]];const quads=[[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2]];quads.forEach((q,i)=>polygon(q.map(k=>p[k]),color[i]||color[0]));}
    const frame=['#343d36','#151d18','#202b23','#56654e'],edge=.095,left=-m.width/2,right=m.width/2,bottom=.42,top=bottom+m.height,front=.36;
    c.save();c.fillStyle='#0007';c.beginPath();c.ellipse(w/2,h*.87,unit*(m.width/2+.38),unit*.13,0,0,Math.PI*2);c.fill();c.restore();
    if(lit&&progress>=1){c.save();const glow=warm?'#ffcf7b':'#b8deff';c.shadowColor=glow;c.shadowBlur=35;c.fillStyle=warm?'#ffcb5e20':'#b8deff20';c.beginPath();[[left,bottom,.1],[right,bottom,.1],[right,top,.1],[left,top,.1]].map(v=>project(...v)).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill();c.restore();}
    box(left-.2,.02,-.34,right+.2,.32,.67,['#283429','#18231b','#243126','#526348']);
    const cap=bottom+m.height*clamp(progress,0,1);
    box(left-edge,bottom-edge,-.08,right+edge,bottom,.4,frame);box(left-edge,bottom,-.08,left,Math.min(top+edge,cap+edge),front,frame);box(right,bottom,-.08,right+edge,Math.min(top+edge,cap+edge),front,frame);if(progress>=1)box(left,top,-.08,right,top+edge,front,frame);
    // Constant back plane, variable front surface: dark areas really are thicker.
    const nx=m.cols,ny=m.rows,dx=m.width/nx,dy=m.height/ny,intensity=clamp(brightness/100,.15,1),light=warm?[255,226,186]:[217,236,255];
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
      const i=y*nx+x,y0=top-(y+1)*dy;if(y0>=cap)continue;
      const t=m.thickness[i],stride=nx+1,z0=.08+m.corners[(y+1)*stride+x],z1=.08+m.corners[(y+1)*stride+x+1],z2=.08+m.corners[y*stride+x+1],z3=.08+m.corners[y*stride+x];
      const shade=clamp(.9+((z0+z3)-(z1+z2))/dx*.045+((z2+z3)-(z0+z1))/dy*.045,.74,1);
      const transmission=Math.exp(-(t-.04)/.08),on=lit&&progress>=1,rgb=on?light.map(v=>Math.round(v*(.035+intensity*transmission*.965))):[242,240,232].map(v=>Math.round(v*shade));
      const y1=Math.min(top-y*dy,cap),part=(y1-y0)/dy,zz2=z1+(z2-z1)*part,zz3=z0+(z3-z0)*part,color='rgb('+rgb.join(',')+')';
      const a=[left+x*dx,y0,z0],b=[left+(x+1)*dx,y0,z1],d=[left+(x+1)*dx,y1,zz2],e=[left+x*dx,y1,zz3];
      polygon([a,b,d,e],color);
      if(x===0)polygon([[a[0],y0,.08],a,e,[e[0],y1,.08]],'#b3b6a8');
      if(x===nx-1)polygon([[b[0],y0,.08],b,d,[d[0],y1,.08]],'#b3b6a8');
      if(y===ny-1)polygon([[a[0],y0,.08],[b[0],y0,.08],b,a],'#b3b6a8');
    }
    faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){c.beginPath();f.pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=f.color;c.fill();c.strokeStyle=f.color;c.lineWidth=.4;c.stroke();}
    if(captionTexture&&caption){const a=project(left+.08,.27,.676),b=project(right-.08,.27,.676),d=project(left+.08,.08,.676),tw=captionTexture.width,th=captionTexture.height;c.save();c.transform((b.x-a.x)/tw,(b.y-a.y)/tw,(d.x-a.x)/th,(d.y-a.y)/th,a.x,a.y);c.drawImage(captionTexture,0,0);c.restore();}
    if(progress<1){const a=project(left,cap,front+.03),b=project(right,cap,front+.03);c.save();c.strokeStyle='#c7fa5f';c.lineWidth=2;c.shadowColor='#c7fa5f';c.shadowBlur=10;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.shadowBlur=0;const head=project(Math.sin(progress*38)*m.width*.4,cap,front+.05);c.fillStyle='#202b24';c.fillRect(head.x-12,head.y-22,24,16);c.fillStyle='#c7fa5f';c.beginPath();c.moveTo(head.x-5,head.y-6);c.lineTo(head.x+5,head.y-6);c.lineTo(head.x,head.y);c.fill();c.restore();}
  }
  window.KatmanyaLamp={build,render};
})();
