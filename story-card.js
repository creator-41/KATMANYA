(() => {
  'use strict';
  let logoPromise;
  function logo(){
    if(!logoPromise)logoPromise=new Promise((resolve,reject)=>{
      const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{logoPromise=null;reject(Error('logo'));};
      image.src=new URL('assets/katmanya-logo.svg',document.baseURI).href;
    });
    return logoPromise;
  }
  function qrFor(link){
    if(!link||typeof qrcodegen==='undefined')return null;
    try{return qrcodegen.QrCode.encodeText(link,qrcodegen.QrCode.Ecc.MEDIUM);}catch{return null;}
  }
  function paintQR(c,qr,x,y,box){
    const cell=Math.floor(box/(qr.size+8)),size=cell*(qr.size+8),left=x+Math.floor((box-size)/2),top=y+Math.floor((box-size)/2);
    c.fillStyle='#ffffff';c.fillRect(x,y,box,box);c.fillStyle='#000000';
    for(let row=0;row<qr.size;row++)for(let col=0;col<qr.size;col++)if(qr.getModule(col,row))c.fillRect(left+(col+4)*cell,top+(row+4)*cell,cell,cell);
  }
  async function create({model,link,product,side,finish}){
    const [brand]=await Promise.all([logo(),document.fonts?.load('800 96px Manrope'),document.fonts?.load('500 24px "DM Mono"')]);
    const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=1920;const c=sheet.getContext('2d');
    const glow=c.createRadialGradient(590,920,20,590,920,1000);glow.addColorStop(0,'#263d27');glow.addColorStop(.6,'#121e17');glow.addColorStop(1,'#0b110e');
    c.fillStyle=glow;c.fillRect(0,0,1080,1920);
    c.strokeStyle='#c7fa5f12';c.lineWidth=1;
    for(let y=580;y<1180;y+=44){c.beginPath();c.moveTo(64,y);c.lineTo(1016,y);c.stroke();}
    c.drawImage(brand,72,150,430,430*128/631);
    c.fillStyle='#acbaa6';c.font='500 22px "DM Mono", monospace';c.fillText('SENİN ÇİZGİN. SENİN KATMANIN.',76,285);
    c.font='800 104px Manrope, sans-serif';c.fillStyle='#f3f1ec';c.fillText('Bunu ben',72,417);c.fillStyle='#c7fa5f';c.fillText('tasarladım.',72,538);
    c.font='500 22px "DM Mono", monospace';c.fillStyle='#b2c6a8';c.fillText(product+' / '+finish+(side?' / '+side:''),76,602);
    c.drawImage(model,50,590,980,700);
    c.strokeStyle='#c7fa5f50';c.beginPath();c.moveTo(72,1274);c.lineTo(1008,1274);c.stroke();
    const qr=qrFor(link);
    if(qr){
      paintQR(c,qr,72,1320,432);
      c.fillStyle='#a9b9a1';c.font='500 20px "DM Mono", monospace';c.fillText('TASARIMIMI AÇ ↗',72,1794);
    }else{
      c.strokeStyle='#c7fa5f35';c.strokeRect(72,1320,432,432);
      c.fillStyle='#c7fa5f';c.font='800 38px Manrope, sans-serif';c.fillText('Fikrini çiz.',112,1508);c.fillText('Katmana dönüşsün.',112,1565,350);
      c.fillStyle='#a9b9a1';c.font='500 20px "DM Mono", monospace';c.fillText('KATMANYA’DA TASARLA',72,1794);
    }
    c.fillStyle='#f3f1ec';c.font='800 56px Manrope, sans-serif';
    ['Sen de','kendi','versiyonunu','çiz.'].forEach((line,i)=>c.fillText(line,562,1394+i*76));
    c.fillStyle='#c7fa5f';c.font='800 31px Manrope, sans-serif';c.fillText('katmanya.com',562,1778);
    const blob=await new Promise(resolve=>sheet.toBlob(resolve,'image/png'));if(!blob)throw Error('image');
    return {blob,qr:!!qr};
  }
  window.KatmanyaStory={create};
})();
