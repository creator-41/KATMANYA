(() => {
  'use strict';
  const WIDTH=720,HEIGHT=1280,DURATION=8000,FPS=24;
  const TYPES=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  let brandPromise;
  function supported(){return typeof MediaRecorder==='function'&&typeof HTMLCanvasElement!=='undefined'&&typeof HTMLCanvasElement.prototype.captureStream==='function';}
  function brand(){
    if(!brandPromise)brandPromise=new Promise((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{brandPromise=null;reject(Error('logo'));};
      image.src=new URL('assets/katmanya-logo.svg',document.baseURI).href;
    });
    return brandPromise;
  }
  async function create({render,product,side,finish,signal,onProgress=()=>{}}){
    if(!supported())throw Error('unsupported');
    const [logo]=await Promise.all([brand(),document.fonts?.load('800 68px Manrope'),document.fonts?.load('500 18px "DM Mono"')]);
    if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
    const canvas=document.createElement('canvas');canvas.width=WIDTH;canvas.height=HEIGHT;
    const c=canvas.getContext('2d');if(!c)throw Error('canvas');
    const glow=c.createRadialGradient(380,620,10,380,620,720);glow.addColorStop(0,'#293e27');glow.addColorStop(.6,'#142019');glow.addColorStop(1,'#0b110e');
    const ease=t=>t*t*(3-2*t),clamp=t=>Math.max(0,Math.min(1,t));
    function paint(elapsed){
      const build=clamp((elapsed-350)/4050),spin=ease(clamp((elapsed-4500)/2700));
      c.fillStyle=glow;c.fillRect(0,0,WIDTH,HEIGHT);
      c.strokeStyle='#c7fa5f12';c.lineWidth=1;
      for(let y=360;y<945;y+=32){c.beginPath();c.moveTo(40,y);c.lineTo(680,y);c.stroke();}
      c.drawImage(logo,48,90,310,310*128/631);
      c.fillStyle='#a9b9a1';c.font='500 14px "DM Mono", monospace';c.fillText('SENİN ÇİZGİN. SENİN KATMANIN.',50,193);
      c.font='800 68px Manrope, sans-serif';c.fillStyle='#f3f1ec';c.fillText('Bunu ben',48,284);c.fillStyle='#c7fa5f';c.fillText('tasarladım.',48,363);
      c.fillStyle='#b2c6a8';c.font='500 14px "DM Mono", monospace';c.fillText(product+' / '+finish+(side?' / '+side:''),50,409);
      if(elapsed>=350){c.save();c.translate(0,420);render(c,WIDTH,530,build,spin);c.restore();}
      c.fillStyle='#c7fa5f';c.font='500 16px "DM Mono", monospace';c.fillText(build<1?'KATMANLAR OLUŞUYOR':'TASARIMIN HAYAT BULDU',48,987);
      c.fillStyle='#c7fa5f22';c.fillRect(48,1018,624,4);c.fillStyle='#c7fa5f';c.fillRect(48,1018,624*build,4);
      c.fillStyle='#f3f1ec';c.font='600 22px Manrope, sans-serif';c.fillText(build<1?'Fikirden ürüne.':'Sen de kendi versiyonunu çiz.',48,1080);
      c.fillStyle='#c7fa5f';c.font='800 30px Manrope, sans-serif';c.fillText('katmanya.com',48,1164);
      c.fillStyle='#a9b9a1';c.font='500 15px "DM Mono", monospace';c.fillText('@katmanya_3d',48,1202);
    }
    paint(0);
    const stream=canvas.captureStream(FPS);let recorder;
    try{
      for(const mimeType of TYPES){
        if(typeof MediaRecorder.isTypeSupported==='function'&&!MediaRecorder.isTypeSupported(mimeType))continue;
        try{recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:3500000});break;}catch{}
      }
      if(!recorder)recorder=new MediaRecorder(stream,{videoBitsPerSecond:3500000});
    }catch(error){stream.getTracks().forEach(track=>track.stop());throw error;}
    return new Promise((resolve,reject)=>{
      let frame=0,watchdog=0,done=false,last=-Infinity,lastPercent=-1;const chunks=[];
      function settle(error,result){
        if(done)return;done=true;cancelAnimationFrame(frame);clearTimeout(watchdog);
        signal?.removeEventListener('abort',abort);document.removeEventListener('visibilitychange',visibility);
        recorder.ondataavailable=recorder.onstop=recorder.onerror=null;
        if(recorder.state!=='inactive')try{recorder.stop();}catch{}
        stream.getTracks().forEach(track=>track.stop());
        if(error)reject(error);else resolve(result);
      }
      function abort(){settle(new DOMException('Cancelled','AbortError'));}
      function visibility(){if(document.hidden)settle(Error('visibility'));}
      recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
      recorder.onerror=()=>settle(Error('recording'));
      recorder.onstop=()=>{
        if(!chunks.length){settle(Error('empty'));return;}
        const type=(recorder.mimeType||chunks[0].type).split(';')[0];
        if(!['video/mp4','video/webm'].includes(type)){settle(Error('format'));return;}
        settle(null,{blob:new Blob(chunks,{type}),extension:type==='video/mp4'?'mp4':'webm',width:WIDTH,height:HEIGHT,duration:DURATION/1000});
      };
      signal?.addEventListener('abort',abort,{once:true});document.addEventListener('visibilitychange',visibility);
      if(signal?.aborted){abort();return;}if(document.hidden){visibility();return;}
      try{recorder.start();}catch(error){settle(error);return;}
      const started=performance.now();
      function tick(time){
        if(done)return;const elapsed=Math.min(DURATION,time-started);
        try{
          if(time-last>=1000/FPS||elapsed===DURATION){paint(elapsed);last=time;}
          const percent=Math.min(99,Math.floor(elapsed/DURATION*100));if(percent!==lastPercent){onProgress(percent);lastPercent=percent;}
          if(elapsed>=DURATION){recorder.stop();return;}
          frame=requestAnimationFrame(tick);
        }catch(error){settle(error);}
      }
      watchdog=setTimeout(()=>settle(Error('timeout')),25000);frame=requestAnimationFrame(tick);
    });
  }
  window.KatmanyaVideo={supported,create};
})();
