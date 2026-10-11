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

## Işıkta bir hatıra

Yerel fotoğraftan beyaz ışık geçiren panel ve masa tabanı önizlemesi üretir.
Fotoğrafın alfa kanalı beyazla birleşir; luminans ve kontrast kalınlığa
dönüşür. Koyu bölgeler daha kalındır. LED açık görünümü kalınlıktan hesaplanan
ışık geçirgenliğini kullanır; kapalı görünüm beyaz yüzey ve rölyef gölgesidir.
Işık aç/kapat, sıcak/beyaz ton, parlaklık, açı, kısa taban notu ve alttan
yükselen baskı animasyonu vardır. PNG açık/kapalı görünümü birlikte içerir.

Dosya 20 MB, çözünürlük 40 megapiksel sınırında; tarayıcıda en fazla 1280 px'e
küçültülür. Doku en uzun kenarı 128 örnekle oluşturulur. Çok dar/uzun kadrajlar
uyarı alır. Fotoğraf hiçbir sunucuya aktarılmaz. WhatsApp yalnızca ayarları
hazırlar; orijinal fotoğraf ve PNG kullanıcı tarafından eklenir. Önizleme
üretim garantisi değildir; malzeme, ölçü, taban ve LED teklifte netleşir.

### Tasarım atölyesi
Ana ekran tek bir atölye butonu sunar. Çizim, fotoğraf kabartma, iki parça,
açıya göre mesaj, labirent, ses ve fotoğraf lambası araçları erişilebilir
kartlarla aynı modalda toplanır. Araç kapatılınca atölyeye dönülür; atölye
kapatılınca sayfanın önceki kaydırma konumu geri yüklenir.

Atölyedeki “Bana bir tasarım bul” sekiz başlangıç seçeneğini karıştırır:
üç anahtarlık, üç plaka ve iki tamamlayıcı set. Aynı seçenek art arda gelmez;
her turdaki seçenekler tükenmeden tekrar seçilmez. Açılan tasarım düzenlenebilir;
“Bir daha karıştır” mevcut araçtan güvenle çıkıp yeni bir başlangıç açar.
İsim alanları boş kalır. Önceden düzenlenmiş bir tasarım değiştirilecekse
ziyaretçiye değiştirme, başka seçenek bulma ve iptal seçenekleri gösterilir.

### Telefonun park yeri
Atölyedeki telefon standı 3B modelle dik/yatay kullanım, 55–75° eğim,
kılıf dahil telefon ölçüleri (en 60–90, boy 125–180, kalınlık 7–18 mm),
gövde/ön bölüm renkleri, boş başlangıç yazısı ve beş simge sunar.
Şarj seçimi tabanı ve tutucuyu gerçekten böler; ön yazı köprüsünün altında
kablo geçişi kalır. İki destek nervürü arka paneli ayağa bağlar. Önizlemedeki
telefon ölçülere göre değişir; koy/çıkar animasyonu, sürükleme/klavye ile 360°
açı, alttan yükselen baskı ve telefonlu/boş iki görünüm içeren PNG vardır.
WhatsApp doğrudan işletme numarasına ayarlarla açılır. Son uyum ve malzeme
teklif sırasında netleşir; telefon bir ölçü önizlemesidir.

### Döndür, mesaj değişsin
Atölyedeki hareketli anahtarlıkta 3/4 mesaj, 60/72 mm çap ve bağımsız
sabit gövde/dönen halka renkleri seçilir. Alanlar başlangıçta boştur;
önizlemedeki MESAJ 01–04 yer tutucuları teklife aktarılmaz. Dış tırtıklı
halka ile mesaj çarkı birlikte döner; sabit kapaktaki gerçek açık pencere
arkasından dönen yazılar kesilerek görünür. Sürükleme açısı, 3/4 durak
aralığına oturma animasyonu, önceki/sonraki ve klavye kontrolü vardır.
Hareket azaltma seçeneğinde durak anında seçilir. Boş aktif mesaj varsa
indirme ve teklif kapalıdır. Dördüncü mesaj 3 mesaja geçilince saklanır.
1600×1400 PNG bütün aktif mesajları ayrı pencereler halinde gösterir.
WhatsApp doğrudan işletme sohbetine mesajları ve ayarları hazırlar.
Bu bir tasarım önizlemesidir; döner parça baskı payı ve malzeme teklif
aşamasında netleştirilir. `message-ring-model.js` çizimi,
`message-ring-studio.js` girişleri ve etkileşim yaşam döngüsünü yönetir.

### Şifreni çevir, sürprizi aç
Üç döner halkalı kapsül 000–999 şifre, 80 karaktere kadar iç mesaj,
35×85 / 45×105 mm taslak ölçüleri ve bağımsız gövde/halka renkleri sunar.
Başlangıç alanları boştur. Sürükleme, halka seçimi ve rakam düğmeleri;
klavyede sol/sağ halka, yukarı/aşağı rakam ve Enter deneme kontrolü vardır.
Yanlış kombinasyon kapağı açmaz; doğru kombinasyonda kapak/taşıyıcı yükselir
ve mesaj görünür. Açık kapsül yeniden karıştırılmadan halkaları dönmez.
Karıştırma doğru şifreyi üretmez. Şifre veya mesaj düzenlenince kapak kapanır.
Hareket azaltma tercihi bütün geçişleri anında tamamlar; kapatınca animasyon
ve pointer yakalama temizlenir. PNG kapalı/açık görünüm ve mesaj içerir;
halka rakamları maskelenir, şifre görsele yazılmaz. WhatsApp teklifi için
kapsüle seçilen şifre, mesaj ve ayarlar gönderilecek taslağa eklenir.
Veri bu araçtan hiçbir sunucuya kaydedilmez. Bu bir hediye bulmacası ve tasarım
önizlemesidir; gerçek baskının mekanik payları ve malzemesi teklifte netleşir.
`capsule-model.js` çizimi, `capsule-studio.js` arayüz ve yaşam döngüsünü yönetir.

### Birini çevir, hepsi hareket etsin
Üç dişlili stres oyuncağında 16–24–16 dişli zinciri, 96×48×12 / 115×58×14 mm
ölçüleri, bağımsız taban ve üç çark rengi, boş başlayan isteğe bağlı 12 karakterlik
orta yazı ve şimşek/kalp/yıldız/daire simgesi vardır. Diş yüzeyleri 20° basınç açılı
involüt örneğiyle çizilir; bitişik çarklar ters döner, küçükler büyükten 1,5 kat hızlıdır.
Üç çarktan herhangi biri sürüklenebilir; seçme, bir diş adımı, başa alma ve 8 saniyelik
oynat/durdur denemesi de vardır. Klavyede sol/sağ seçme, yukarı/aşağı çevirme, Home
başa alma, boşluk oynatma kullanılır. Hareket azaltmada adımlar anında uygulanır
ve otomatik oynatma kapanır. Gizlenen sekme, düzenlemeye geçme ve modal kapanışı
animasyonu ve pointer yakalamayı temizler. Boş yazı tasarımı engellemez; örnek kişi
adı kullanılmaz. 1600×1200 PNG seçilen yazı, simge, renk ve ölçüleri içerir; WhatsApp
linki doğrudan işletme numarasına gerçek satır sonlarıyla hazırlanır. Tasarım araçtan
sunucuya kaydedilmez. Fiziksel baskının mekanik payları ve malzemesi teklifte netleşir.
`gear-model.js` geometri/bağlı dönüş/çizimi, `gear-studio.js` etkileşimleri yönetir.

### Atölye ürün vitrini
12 araç Tümü / Hediye / Masaüstü / Oyun filtreleriyle gezilir. Kategoriler çoklu
üyeliğe izin verir (9 hediye, 6 masaüstü, 3 oyun); sonuç ve kategori adetleri
kartların veri alanlarından hesaplanır. Düğmeler basılı durumunu ve sonuç sayısını
bildirir. Kartların 480×300 WebP ürün önizlemeleri mevcut model çizimlerinden
üretilmiş statik örneklerdir; açılan araçların taslağını değiştirmez veya kişisel isim
eklemez. Çizim kartı örnek bir yıldızlı plakadır. Küçük ekranlarda iki sütun,
359 px altında tek sütun kullanılır. Görseller dekoratiftir, kartların erişilebilir
adları başlık ve açıklamadan oluşur. Yerel görseller servis çalışanında önbelleğe
alınır. Filtre seçimi araçtan çıkınca korunur; sürpriz tasarım filtre dışında bir
aracı açarsa, dönüşte kartın görünür olması için Tümü seçilir. Mevcut taslak
koruması, modal dönüşü ve kaydırma/fokus restorasyonu devam eder.

### Üç dokunuşta hediyeni bul
Atölyedeki Hediyeni bul üç adım sunar: Kendime/Partnerime/Arkadaşıma,
Kullanışlı/Eğlenceli/Anlamlı ve Yazı/Fotoğraf/Ses. Her seçim sonraki adıma
geçer; geri dönme, seçimleri değiştirme ve sıfırlama vardır. 27 kombinasyon
iki farklı ürün ve açıklama üretir. Fotoğraf ve ses seçiminde ilk ürün mutlaka
bu girdiyi destekler. Ses için ikinci öneri yazılı bir alternatif olarak açıkça
etiketlenir; ses oynatan veya ses dosyası saklayan ürün vaadi verilmez.
Kişi isimleri kullanılmaz. Öneri kartları mevcut ürünlerin başlık/görselini alır.
Bunu tasarla bulucuyu kapattıktan sonra normal atölye kartını çalıştırır;
mevcut düzenleyici taslağını değiştirmez. Filtre dışında kalan bir kart açılırsa
Tümü seçilir. Kullanılamayan araç pasif kalır. Seçimler yalnızca mevcut sayfa
oturumunun belleğindedir; sunucuya veya kalıcı depolamaya yazılmaz. Native
modal, kapatma/Escape, fokus ve body/kaydırma restorasyonu kullanılır.
`gift-finder.js` eşleştirmeyi ve arayüzü yönetir; sürpriz tasarım düğmesi korunur.


## Gölge mesaj stüdyosu

Tasarım atölyesindeki **Işığı tut, gizli mesajı gör** kartı, 14 karakterlik
kısa bir mesajı ışık yönüne göre değişen bir gölge tasarımına dönüştürür.
Giriş boş başlar; tasarım ve mesaj yalnızca geçerli sekmede tutulur.

- Dört parça rengi ve iki yaklaşık ölçü; mobilde mesaj/önizleme sekmeleri.
- Tuval sürükleme, iki erişilebilir kaydırıcı ve ok tuşlarıyla ışığı taşıma.
- Doğru açı 40° / 50°; Home ve doğru açı düğmesiyle hizalama.
- Işık aç/kapat, farklı açıya geçiş, açı uyumu göstergesi.
- 1600 × 1400 PNG: seçilen ışık ve birleşen gölge, mesaj, renk ve ölçü.
- İşletmenin WhatsApp numarasına gerçek satır sonlarıyla teklif taslağı.

`shadow-model.js`, mesaj maskesinin yatay sıralarından eğik prizmalar oluşturur.
Her prizmanın yüksekliği farklıdır; gölge, mevcut ışık yönünde tüm ağ
yüzlerinin zemine izdüşümünden çizilir. Gölge görünümünde `fillText` ile
mesaj eklenmez. Solda parçanın perspektifi, sağda aynı ağın üstten gölge
görünümü bulunur. 40° / 50° yönünde bütün yükseklikler kaynak maskede birleşir.

Bu geometri bir tasarım önizlemesidir; STL veya üretime hazır bağlantılı
model sunmaz. Taban, bağlantılar, üretim ve gerçek ışık kurulumu teklifte
netleştirilir. `shadow-studio.js` etkileşim, modal, odak, animasyon ve dışa
aktarmayı yönetir; kapatma, sekme gizlenmesi ve azaltılmış hareket tercihi
animasyonu durdurur.
