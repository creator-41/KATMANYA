# KATMANYA

KATMANYA 3D baskı atölyesinin mobil uyumlu web sitesi.

Yayın: https://katmanya.com/

Statik HTML, CSS ve JavaScript ile çalışır; GitHub Pages üzerinden yayımlanır.
İsimli plakalıkta isim, renk ve logo önizlemesi; büyük logo yerleştirme ekranı;
baskı simülasyonu ve PNG indirme bulunur. Teklif asistanı bilgileri hazırlayıp
işletmenin WhatsApp sohbetine yönlendirir. Seçilen dosyalar cihazda kalır.

## Fotoğraftan kabartma

Ana sayfadaki “Fotoğraftan kabartma” aracı fotoğrafı cihazda işler. Kontrast,
detay, yükseklik, renk ve açık/koyu alan ayarlarıyla ışık-gölge kabartması
oluşturur; hatıra plakası veya gerçek halka delikli anahtarlık önizlemesi
sunar. Model sürüklenerek döndürülür ve katman katman baskı animasyonu
izlenir. PNG taslağı indirilebilir; WhatsApp teklifi ayarları metin olarak
hazırlar. Fotoğraf ve taslak sohbete kullanıcı tarafından eklenir. Fotoğraf
yüklemesi bir sunucuya aktarılmaz. `photo-relief.js` dönüşüm ve yüzey
çizimini, `photo-studio.js` arayüz ve dosya yaşam döngüsünü yönetir.

## Marka

Katmanlı küp amblemi `assets/katmanya-mark.svg`, yatay logo
`assets/katmanya-logo.svg` dosyasındadır. SVG logosundaki yazı konturlara
dönüştürülmüştür; ayrı bir yazı tipi dosyası yüklemez. PWA simgeleri ve
sosyal bağlantı görseli aynı amblemden hazırlanmıştır.

## Alan adı

`CNAME` dosyası `katmanya.com` alan adını tanımlar. Kök alan adı için A
kayıtları GitHub Pages IP adreslerine; `www` CNAME kaydı
`creator-41.github.io` adresine yönelir. Site içi dosya yolları görecelidir.
