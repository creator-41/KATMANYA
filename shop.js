import {products} from './shop-catalogue.js?v=1';
const $ = selector => document.querySelector(selector);
const categories = [{id:'all',label:'Tüm ürünler'},{id:'desk',label:'Masaüstü'},{id:'gift',label:'Hediyelik'},{id:'play',label:'Oyun & hareket'},{id:'custom',label:'Özel parça'},{id:'bulk',label:'Toptan üretim'}];
const colours = Array.from($('#detail-color').options, option => option.value);
const productById = new Map(products.map(product => [product.id, product]));
const storageKey = 'katmanya-cart-v1';
const maxAge = 7 * 24 * 60 * 60 * 1000;
let cart = [], storageAvailable = true, selectedProduct = null, toastTimer;
const normalise = value => String(value).toLocaleLowerCase('tr-TR').replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const el = (tag, className, text) => {const node = document.createElement(tag); if(className) node.className = className; if(text !== undefined) node.textContent = text; return node;};
const announce = message => {clearTimeout(toastTimer); $('#shop-toast').textContent = message; $('#shop-toast').hidden = false; toastTimer = setTimeout(() => {$('#shop-toast').hidden = true;}, 4000);};
function error(selector, message) {const node = $(selector); node.textContent = message; node.hidden = !message;}
function updateStorageNote() {$('#cart-storage-note').textContent = storageAvailable ? 'Sepetin ve tasarım notların bu cihazda 7 gün saklanır. Sepeti temizleyerek silebilirsin.' : 'Tarayıcın sepeti kalıcı saklayamıyor. Seçimlerin yalnızca bu sayfa açıkken korunur.';}
function readCart() {
  let raw;
  try {raw = localStorage.getItem(storageKey);} catch {storageAvailable = false; return;}
  if(!raw) {cart = []; return;}
  try {
    const stored = JSON.parse(raw);
    if(!stored || !Number.isFinite(stored.at) || Date.now()-stored.at<0 || Date.now()-stored.at>maxAge || !Array.isArray(stored.items) || stored.items.length>50) throw new Error('Expired or invalid cart');
    const merged = new Map();
    for(const item of stored.items) {
      if(!item || !productById.has(item.id) || !colours.includes(item.color) || typeof item.note!=='string' || item.note.length>200 || !Number.isInteger(item.quantity) || item.quantity<1 || item.quantity>999) continue;
      const row = {id:item.id,color:item.color,note:item.note,quantity:item.quantity};
      const key = rowKey(row); const existing = merged.get(key);
      if(existing) existing.quantity = Math.min(999,existing.quantity+row.quantity); else merged.set(key,row);
    }
    cart = [...merged.values()];
  } catch {cart = []; try {localStorage.removeItem(storageKey);} catch {storageAvailable = false;}}
}
function rowKey(row) {return JSON.stringify([row.id,row.color,row.note]);}
function persist() {
  try {if(cart.length) localStorage.setItem(storageKey,JSON.stringify({at:Date.now(),items:cart})); else localStorage.removeItem(storageKey); storageAvailable = true;} catch {storageAvailable = false;}
  updateStorageNote();
}
const initial = new URL(location.href);
let query = (initial.searchParams.get('q') || '').slice(0,100);
let category = categories.some(c => c.id===initial.searchParams.get('cat')) ? initial.searchParams.get('cat') : 'all';
let sort = ['az','za'].includes(initial.searchParams.get('sort')) ? initial.searchParams.get('sort') : 'featured';
$('#product-search').value = query; $('#product-sort').value = sort;
function syncUrl() {
  const url = new URL(location.href);
  for(const [key,value] of [['q',query.trim()],['cat',category==='all'?'':category],['sort',sort==='featured'?'':sort]]) {if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
  history.replaceState(null,'',url.pathname+url.search+url.hash);
}
function showProduct(product, updateUrl=true) {
  selectedProduct = product; $('#detail-name').textContent = product.name; $('#detail-description').textContent = product.description;
  $('#detail-category').textContent = product.categories.map(id=>categories.find(c=>c.id===id)?.label).filter(Boolean).join(' / ');
  const image = $('#detail-image'); image.src = '/'+product.image; image.alt = product.alt;
  $('#detail-note-label').textContent = product.detailLabel; $('#detail-note').value = ''; $('#detail-color').selectedIndex = 0; $('#detail-quantity').value = '1'; $('#detail-quantity').removeAttribute('aria-invalid'); error('#detail-error','');
  const design = $('#detail-design'); design.hidden = !product.tool; if(product.tool)design.href = '/?urun='+encodeURIComponent(product.tool);
  if(!$('#product-dialog').open)$('#product-dialog').showModal();
  if(updateUrl) {const url = new URL(location.href);url.searchParams.set('urun',product.id);history.replaceState(null,'',url.pathname+url.search+url.hash);}
}
$('#product-dialog .dialog-close').addEventListener('click',()=>$('#product-dialog').close());
$('#product-dialog').addEventListener('close',()=>{const url = new URL(location.href);url.searchParams.delete('urun');history.replaceState(null,'',url.pathname+url.search+url.hash);});
function renderProducts() {
  const tokens = normalise(query.trim()).split(/\s+/).filter(Boolean);
  let result = products.filter(product => (category==='all'||product.categories.includes(category)) && tokens.every(token=>normalise([product.name,product.originalTitle,product.description,product.alt,...product.categories.map(id=>categories.find(c=>c.id===id)?.label)].join(' ')).includes(token)));
  if(sort!=='featured') result = [...result].sort((a,b)=>a.name.localeCompare(b.name,'tr')*(sort==='az'?1:-1));
  const fragment = document.createDocumentFragment();
  for(const product of result) {
    const card = el('article','product-card');
    const imageButton = el('button','product-art'); imageButton.type = 'button'; imageButton.setAttribute('aria-label',product.name+' ürününü incele');
    const image = document.createElement('img'); image.src = '/'+product.image; image.alt = product.alt; image.width = 480; image.height = 300; image.loading = 'lazy'; image.decoding = 'async'; imageButton.append(image,el('span','art-label','TASARIM ÖRNEĞİ')); imageButton.addEventListener('click',()=>showProduct(product));
    const body = el('div','product-body'); body.append(el('p','product-category',categories.find(c=>c.id===product.categories[0])?.label));
    const heading = el('h3'); const title = el('button','product-title',product.name); title.type = 'button'; title.addEventListener('click',()=>showProduct(product));heading.append(title);body.append(heading,el('p','product-description',product.description));
    const bottom = el('div','product-bottom'); const price = el('span','product-price','Teklifle fiyatlandırılır'); const choose = el('button','choose-product','Ürünü seç ↗'); choose.type = 'button'; choose.setAttribute('aria-label',product.name+' seçeneklerini aç'); choose.addEventListener('click',()=>showProduct(product));bottom.append(price,choose);body.append(bottom);card.append(imageButton,body);fragment.append(card);
  }
  $('#product-grid').replaceChildren(fragment); $('#empty-results').hidden = result.length!==0;
  $('#result-count').textContent = result.length+' / '+products.length+' ürün'; $('#clear-search').hidden = !query; $('#reset-filters').hidden = !query && category==='all' && sort==='featured';
  document.querySelectorAll('[data-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.category===category)));
}
for(const c of categories) {
  const button = el('button','filter-chip',c.label); button.type = 'button';button.dataset.category = c.id;button.setAttribute('aria-pressed',String(category===c.id));button.setAttribute('aria-controls','product-grid');
  button.addEventListener('click',()=>{category=c.id;syncUrl();renderProducts();});$('#category-filters').append(button);
}
$('.search-form').addEventListener('submit',event=>{event.preventDefault();renderProducts();});
$('#product-search').addEventListener('input',event=>{query=event.target.value;syncUrl();renderProducts();});
$('#product-sort').addEventListener('change',event=>{sort=event.target.value;syncUrl();renderProducts();});
$('#clear-search').addEventListener('click',()=>{query='';$('#product-search').value='';syncUrl();renderProducts();$('#product-search').focus();});
function resetFilters() {query='';category='all';sort='featured';$('#product-search').value='';$('#product-sort').value='featured';syncUrl();renderProducts();}
$('#reset-filters').addEventListener('click',resetFilters);$('#show-all').addEventListener('click',resetFilters);
function quoteUrl() {
  const lines = ['Merhaba KATMANYA, mağaza sepetim için fiyat ve teslim süresi bilgisi almak istiyorum.'];
  cart.forEach((row,index)=>{lines.push('',(index+1)+'. '+productById.get(row.id).name,'Renk tercihi: '+row.color,'Adet: '+row.quantity);if(row.note)lines.push('Tasarım notu: '+row.note);});
  lines.push('','Toplam adet: '+cart.reduce((n,row)=>n+row.quantity,0),'Fotoğraf veya tasarım dosyalarımı bu sohbete ayrıca ekleyeceğim.');
  return 'https://wa.me/905304815341?text='+encodeURIComponent(lines.join('\n'));
}
function renderCart() {
  const count = cart.reduce((n,row)=>n+row.quantity,0);$('#cart-count').textContent = count;$('.cart-toggle').setAttribute('aria-label','Sepetim, '+count+' adet ürün');
  $('#cart-empty').hidden = !!cart.length;$('#cart-summary').hidden = !cart.length;$('#clear-confirm').hidden = true;
  const fragment = document.createDocumentFragment();
  cart.forEach((row,index)=>{
    const product = productById.get(row.id), item = el('article','cart-row');item.dataset.cartIndex = index;
    const image = document.createElement('img');image.src = '/'+product.image;image.alt = '';image.width = 90;image.height = 72;
    const info = el('div','cart-row-copy');info.append(el('h3',null,product.name),el('p',null,row.color));if(row.note)info.append(el('p','cart-row-note',row.note));
    const controls = el('div','quantity-controls');
    const decrease = el('button',null,'−');decrease.type='button';decrease.setAttribute('aria-label',product.name+' adedini azalt');decrease.disabled=row.quantity<=1;
    const increase = el('button',null,'＋');increase.type='button';increase.setAttribute('aria-label',product.name+' adedini artır');increase.disabled=row.quantity>=999;
    const amount = el('span',null,String(row.quantity));amount.setAttribute('aria-label',row.quantity+' adet');
    const change = delta=>{row.quantity+=delta;persist();renderCart();const current=$('#cart-items').children[index];const next=current?.querySelector(delta<0?'.quantity-controls button:first-child':'.quantity-controls button:last-child');(next?.disabled?current?.querySelector('.remove-item'):next)?.focus();};
    decrease.addEventListener('click',()=>change(-1));increase.addEventListener('click',()=>change(1));controls.append(decrease,amount,increase);
    const remove = el('button','remove-item','Kaldır');remove.type='button';remove.setAttribute('aria-label',product.name+' ürününü sepetten kaldır');remove.addEventListener('click',()=>{cart.splice(index,1);persist();renderCart();announce(product.name+' sepetten çıkarıldı.');($('#cart-items .remove-item')||$('#cart-explore')).focus();});
    info.append(controls);item.append(image,info,remove);fragment.append(item);
  });
  $('#cart-items').replaceChildren(fragment);$('#cart-summary-count').textContent=cart.length+' seçim · '+count+' adet';$('#cart-quote').href=cart.length?quoteUrl():'https://wa.me/905304815341';updateStorageNote();
}
$('#product-options').noValidate = true;
$('#product-options').addEventListener('submit',event=>{
  event.preventDefault();if(!selectedProduct)return;
  const input=$('#detail-quantity'),quantity=Number(input.value),note=$('#detail-note').value.trim(),color=$('#detail-color').value;
  if(!input.checkValidity()||!Number.isInteger(quantity)||quantity<1||quantity>999) {error('#detail-error','Adedi 1 ile 999 arasında tam sayı olarak gir.');input.setAttribute('aria-invalid','true');input.focus();return;}
  const row={id:selectedProduct.id,color,note,quantity},existing=cart.find(item=>rowKey(item)===rowKey(row));
  if(existing&&existing.quantity+quantity>999) {error('#detail-error','Bu seçimden sepette en fazla 999 adet olabilir.');return;}
  if(!existing&&cart.length>=50) {error('#detail-error','Sepette en fazla 50 farklı seçim olabilir. Mevcut seçimlerden birini düzenleyebilirsin.');return;}
  if(existing)existing.quantity+=quantity;else cart.push(row);
  persist();renderCart();$('#product-dialog').close();announce(selectedProduct.name+' sepete eklendi.');
});
$('#detail-quantity').addEventListener('input',()=>{$('#detail-quantity').removeAttribute('aria-invalid');error('#detail-error','');});
$('.cart-toggle').addEventListener('click',()=>{renderCart();$('#cart-dialog').showModal();});
$('#cart-dialog .dialog-close').addEventListener('click',()=>$('#cart-dialog').close());
$('#cart-explore').addEventListener('click',()=>{$('#cart-dialog').close();$('#catalogue').scrollIntoView({behavior:'smooth'});});
$('#clear-cart').addEventListener('click',()=>{$('#clear-confirm').hidden=false;$('#confirm-clear').focus();});
$('#cancel-clear').addEventListener('click',()=>{$('#clear-confirm').hidden=true;$('#clear-cart').focus();});
$('#confirm-clear').addEventListener('click',()=>{cart=[];persist();renderCart();announce('Sepet temizlendi.');$('#cart-explore').focus();});
window.addEventListener('storage',event=>{if(event.key===storageKey){readCart();renderCart();}});
readCart();renderProducts();renderCart();
const deepLink=productById.get(initial.searchParams.get('urun'));if(deepLink)showProduct(deepLink,false);
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
