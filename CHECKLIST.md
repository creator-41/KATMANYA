# Katmanya kontrol listesi — 13 Ekim 2026

Hazır değişikliklerin creator-41/KATMANYA reposunun main dalına gönderilmesi ve canlıya alınması kullanıcı tarafından 13 Ekim 2026 tarihinde onaylandı.

## Grup 1 — kod ve testler hazır

- robots.txt: arama motorlarına açık, sitemap bağlantılı.
- sitemap.xml: ana sayfa ve dört bilgilendirme sayfası; teşekkür ve 404 hariç.
- Loading: 3D hazırlık göstergesi, hazır ve fallback durumlarında kapanır.
- Form hataları: boş/boşluk yanıt ve ondalıklı/geçersiz adet engeli; erişilebilir uyarılar.
- Teşekkür: WhatsApp bağlantısı sonrası dialog ve tesekkurler.html. Mesajın gönderildiği iddia edilmez.

## Grup 2 — hazır değişiklikler ve eksik bilgiler

- Gizlilik: teknik işleyiş sayfası hazır. Resmi işletme/veri sorumlusu kimliği ve adresi, iletişim e-postası, WhatsApp teklif/sipariş süreçlerinin saklama/aktarım bilgileri doğrulanmadan kapsamlı KVKK aydınlatması tamamlanmış sayılmaz.
- Kullanım koşulları: teklif/önizleme/sipariş ayrımı, içerik yetkisi, dış bağlantılar ve tüketici hakları metni hazır.
- Çerez tercihleri: gerekli ve isteğe bağlı işlevsel tercih ayrımı. İzin verme/reddetme/geri alma, 180 günlük tercih süresi. İşlevsel erteleme kaydı izne bağlandı. Analytics ve reklam takibi yok.
- İletişim: mevcut sitedeki doğrulanmış telefon ve Instagram; footer ve iletişim sayfası hazır.
- Analytics: etkinleştirilmedi. Sağlayıcı/hesap/ölçüm kimliği eksik. Seçilen sağlayıcıya uygun onay, politika ve ölçüm testleri ayrıca gerekir.

## Koddan doğrulanan mevcut maddeler

Özel 404, meta title/description, ilk ekran yönlendirmeleri, favicon, Open Graph görsel etiketleri, görsel alt metinleri, mobil CSS, sabit teklif CTA, WebP ürün görselleri ve lazy loading mevcut. Arama motoru indeksleme ve sosyal platform görsel önbelleği bu testlerin kapsamı dışında.

## Doğrulama

- Değişen JavaScript dosyalarının sözdizimi kontrolü ve git diff --check.
- HTML yerel dosya bağlantıları, sitemap XML, service worker önbellek varlıkları.
- DOM davranış testleri: geçersiz miktarlar, sohbet formu, WhatsApp teklif metni, teşekkür dialogu, loading, tercih izin/ret/geri alma/hatırlama/süre dolumu.
- Gerçek Chromium testi: loading kapanması, ondalıklı adet uyarısı, WhatsApp bağlantısı ve teşekkür dialogu; JavaScript hatası yok.
- 320/390/768/1440 piksel genişliklerde yatay taşma yok; yeni sayfalar HTTP 200.
- 390x844 mobil ekran görüntüsü görsel olarak kontrol edildi.
- Canlı yayın doğrulaması GitHub Pages dağıtımının ardından yapılır.

Kaynak: KVKK 2022/1358 karar özeti https://www.kvkk.gov.tr/Icerik/7595/2022-1358
