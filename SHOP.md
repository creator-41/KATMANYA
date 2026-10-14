# Katmanya mağaza — 14 Ekim 2026

## Kapsam

`/magaza.html`: mevcut ana sayfadaki 4 ürün/hizmet ve atölyedeki 20 tasarımın tamamı. Katalog `shop-catalogue.js` içinde; atölye kartlarının özgün başlıkları arama eşleşmesi için korunur.

- Türkçe/ASCII arama, çok kelimeli eşleşme, kategori filtreleri, alfabetik sıralama, sonuç sayısı ve boş sonuç durumu.
- Arama/filtre/sıralama URL'de paylaşılabilir; `?urun=phone` gibi ürün detay bağlantıları açılır.
- Ürün detayında renk, adet, kişiselleştirme notu. Atölye ürünlerinin tasarım aracına `/?urun=phone-studio` gibi bağlantı.
- Aynı ürün/renk/not bir satırda birleşir; farklı tercihler ayrı kalır. Adet 1–999, 50 farklı seçim sınırı.
- Sepet düzenleme, ürün kaldırma, onaylı temizleme, 7 günlük cihazda saklama, farklı sekmeler arası eşitleme. Depolama kapalıysa sayfa belleğiyle çalışma.
- WhatsApp teklif mesajında tüm seçimler ve toplam adet; hiçbir mesaj otomatik gönderilmez.
- Ana sayfada masaüstü/mobil Mağaza menüsü, footer bağlantısı, sitemap, PWA önbelleği ve teknik gizlilik/depolama açıklamaları.

## Açık işler — gerçek e-ticaret

Bu sürüm katalog, arama ve teklif sepetidir. Ürün fiyatları `null`; sıfır fiyat veya stok bilgisi uydurulmaz. Kartla ödeme, sipariş veritabanı, stok rezervasyonu, sipariş yönetim paneli ve ödeme onayı uygulanmamıştır.

Gerçek satış için işletmenin ürün/renk bazlı fiyat ve stokları, kargo/teslimat bilgileri, ödeme hizmeti hesabı ve ayrı sipariş altyapısı gerekir. Hesap sırları tarayıcıya ya da açık repoya eklenmemeli; ödeme ve sipariş tutarı sunucuda doğrulanmalıdır. Yasal metinler de gerçek satış işleyişine göre ayrıca tamamlanmalıdır. Başka projelerin veritabanı veya ödeme hesapları kullanılmamıştır.

## Doğrulama

Chromium ile 24 ürün kapsamı, İSİMLİ/isimli/ISIMLI ve anahtarlik aramaları, kategori/sıralama, boş sonuç, paylaşılabilir filtre durumu, ürün detayları, ondalıklı adet hatası, farklı renkler, aynı seçimin birleşmesi, adet değiştirme, WhatsApp içeriği, yeniden yükleme/temizleme/süre dolumu, kullanıcı notlarının HTML olarak çalışmaması, kapalı depolama ve tasarım aracı bağlantısı test edildi. 320/390/768/844/1024/1440 piksel ekranlarda taşma kontrolü ve mobil/masaüstü ekran görüntüsü incelemesi yapıldı. JavaScript hata kontrolü uygulandı.
