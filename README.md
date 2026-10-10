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

## İki parça, bir hikâye

Puzzle anahtarlık stüdyosu iki isim, kalp/puzzle şekli ve her parça için
ayrı renk seçimi sunar. İki parça aynı alanın birbirini tamamlayan
bölümleridir; ayrı gerçek halka delikleri ve kabartma yazıları vardır.
Birleşme animasyonu, mesafe ayarı, ayrı parça inceleme, 3B döndürme ve
PNG taslak indirme cihazda çalışır. WhatsApp set teklifine isim ve renkler
eklenir. Bu bir önizlemedir; üretim ölçüsü ve birleşme toleransı ayrıca
netleştirilir. `puzzle-model.js` geometriyi, `puzzle-studio.js` arayüzü yönetir.

## Bir plaka, iki bakış

`angle-model.js` iki görüntüyü kapalı, üçgen oluklu plakanın karşıt
yüzeylerine yerleştirir. Görünürlük yüzey normalleri ve gerçek 3B açıdan
hesaplanır; yazılar arasında opaklık geçişi kullanılmaz. Yüzey dokuları
±55 derece için önceden çarpıtılır, böylece her isim kendi açısından
okunur. `angle-studio.js` isim/renk ayarlarını, sürükleme ve klavye
kontrollerini, aşağıdan yukarı baskı ve açı turunu yönetir. Hareket
azaltma tercihi desteklenir, boşta çizim yapılmaz. İki açılı 1600×1200
PNG ve doğrudan WhatsApp teklif bağlantısı vardır. Bu bir üretim
dosyası değildir; ölçü, malzeme ve okunma açısı ayrıca netleştirilir.

## Marka

Katmanlı küp amblemi `assets/katmanya-mark.svg`, yatay logo
`assets/katmanya-logo.svg` dosyasındadır. SVG logosundaki yazı konturlara
dönüştürülmüştür; ayrı bir yazı tipi dosyası yüklemez. PWA simgeleri ve
sosyal bağlantı görseli aynı amblemden hazırlanmıştır.

## Alan adı

`CNAME` dosyası `katmanya.com` alan adını tanımlar. Kök alan adı için A
kayıtları GitHub Pages IP adreslerine; `www` CNAME kaydı
`creator-41.github.io` adresine yönelir. Site içi dosya yolları görecelidir.
