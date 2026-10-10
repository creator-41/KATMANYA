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

## Labirentin cebinde

Yuvarlak/kare anahtarlıkta 5, 7 ve 9 hücre genişliğinde labirentler oluşturulur.
Tohumla tekrarlanabilen DFS ağacı, tüm hücreleri bağlar; hedef başlangıca en
uzak hücredir. Oyun hareketleri, modeldeki gerçek açık koridorlarla aynı
bağlantı tablosunu kullanır. Kapalı duvara hareket edilemez. Yön tuşları,
dokunmatik yön düğmeleri, ipucu yolu, hamle sayısı ve kazanma durumu vardır.
Baş harfler isteğe bağlıdır ve alan boş açılır. Modelde gerçek halka deliği,
baskı animasyonu, renkler ve PNG taslak bulunur. Top/kapak/ölçü için üretim
kararları teklif sırasında netleşir. `maze-model.js` geometri ve yolları,
`maze-studio.js` arayüz ve oyunun yaşam döngüsünü yönetir. Hareket azaltma
tercihi desteklenir ve boşta sürekli çizim yapılmaz.

## Marka

Katmanlı küp amblemi `assets/katmanya-mark.svg`, yatay logo
`assets/katmanya-logo.svg` dosyasındadır. SVG logosundaki yazı konturlara
dönüştürülmüştür; ayrı bir yazı tipi dosyası yüklemez. PWA simgeleri ve
sosyal bağlantı görseli aynı amblemden hazırlanmıştır.

## Alan adı

`CNAME` dosyası `katmanya.com` alan adını tanımlar. Kök alan adı için A
kayıtları GitHub Pages IP adreslerine; `www` CNAME kaydı
`creator-41.github.io` adresine yönelir. Site içi dosya yolları görecelidir.

## Sesin katmanlarda

Ses dalgası anahtarlığı: kullanıcı mikrofonla en fazla 8 saniye kaydeder veya
20 MB'a kadar bir ses dosyası seçer (en fazla 2 dakika, ilk 8 saniye işlenir).
Web Audio kanalların RMS enerjisini 64 aralığa indirger; sessiz kayıtları
reddeder. Örnek dalga gerçek bir yerel WAV sinyalinden üretilir. Mikrofon
yalnızca kullanıcının kayıt düğmesiyle istenir; kapanışta ve sayfa arka plana
geçince durur. Kayıt biçimi tarayıcının desteklediği MIME türünden seçilir.
Ses cihazda çözülür; sunucu, veritabanı veya ses yüklemesi yoktur.

Model yuvarlatılmış bir taban, gerçek halka deliği, kabartmalı dalga ve
isteğe bağlı kısa not içerir. Renk, sürükleyerek açı değiştirme, katman
animasyonu ve 1400×1400 PNG taslağı bulunur. WhatsApp doğrudan işletme
numarasına açılır; dalganın 64 örneğini taşıyan v1 hex koduyla renk, süre ve
not hazırlanır. Sesin kendisi gönderilmez. Bu görsel bir izdir; fiziksel
anahtarlık ses çalmaz. Ölçü ve üretim ayrıntıları teklif aşamasında netleşir.
