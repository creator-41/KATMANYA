// Fiyatlar işletme tarafından belirlenene kadar null kalır. Gerçek ödeme sunucu doğrulaması gerektirir.
export const products = [
  {
    "id": "desk-set",
    "name": "Modüler masaüstü seti",
    "description": "Telefon standı, kulaklık askısı ve oyun kolu standı. Setini ihtiyacına göre kur.",
    "categories": [
      "desk"
    ],
    "image": "assets/desk-set.webp",
    "alt": "Telefon, kulaklık ve oyun kolu için masaüstü seti",
    "detailLabel": "Set ve kullanım tercihin",
    "tool": null,
    "price": null
  },
  {
    "id": "nameplate",
    "name": "İsimli plakalık",
    "description": "İsmin, renk tercihin ve logonla çalışma alanına özel bir plakalık.",
    "categories": [
      "desk",
      "gift"
    ],
    "image": "assets/desk-nameplate.webp",
    "alt": "İsim eklenebilen masaüstü plakalık",
    "detailLabel": "Plakada yazacak isim / tasarım notu",
    "tool": null,
    "price": null
  },
  {
    "id": "sketch",
    "name": "Çizimden anahtarlık",
    "originalTitle": "Çiz, katmana dönüşsün",
    "description": "Çizim, metin ve simgelerle kendi parçanı tasarla.",
    "categories": [
      "gift",
      "desk"
    ],
    "image": "assets/workshop/sketch.webp",
    "alt": "Çizimden oluşturulan renkli üç boyutlu anahtarlık",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "sketch-studio",
    "price": null
  },
  {
    "id": "photo",
    "name": "Fotoğraftan kabartma",
    "originalTitle": "Fotoğraftan kabartma",
    "description": "Fotoğrafını dokulu bir kabartmaya dönüştür.",
    "categories": [
      "gift",
      "desk"
    ],
    "image": "assets/workshop/photo.webp",
    "alt": "Fotoğrafın kabartma yüzeyli üç boyutlu önizlemesi",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "photo-studio",
    "price": null
  },
  {
    "id": "puzzle",
    "name": "İkili puzzle anahtarlık",
    "originalTitle": "İki parça, bir hikâye",
    "description": "Birleşen iki parçaya birlikte anlam kat.",
    "categories": [
      "gift"
    ],
    "image": "assets/workshop/puzzle.webp",
    "alt": "Birbirine geçen iki parça kalp ve puzzle anahtarlık",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "puzzle-studio",
    "price": null
  },
  {
    "id": "angle",
    "name": "Çift mesajlı plaka",
    "originalTitle": "Bir plaka, iki bakış",
    "description": "İki farklı açıdan iki farklı mesaj göster.",
    "categories": [
      "gift",
      "desk"
    ],
    "image": "assets/workshop/angle.webp",
    "alt": "Farklı açılardan okunan çift isimli masaüstü tasarım",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "angle-studio",
    "price": null
  },
  {
    "id": "maze",
    "name": "Labirent anahtarlık",
    "originalTitle": "Labirentin cebinde",
    "description": "Kendi labirentini oluştur, çıkışı bul.",
    "categories": [
      "play"
    ],
    "image": "assets/workshop/maze.webp",
    "alt": "Bilyenin dolaştığı üç boyutlu labirent",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "maze-studio",
    "price": null
  },
  {
    "id": "voice",
    "name": "Ses dalgası anahtarlık",
    "originalTitle": "Sesin katmanlarda",
    "description": "Sesini bir anahtarlığın üzerine işle.",
    "categories": [
      "gift"
    ],
    "image": "assets/workshop/voice.webp",
    "alt": "Ses dalgası şeklinde kişiye özel anahtarlık",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "voice-studio",
    "price": null
  },
  {
    "id": "lamp",
    "name": "Fotoğraflı litofan lamba",
    "originalTitle": "Işıkta bir hatıra",
    "description": "Fotoğrafının ışıkla ortaya çıkışını izle.",
    "categories": [
      "gift",
      "desk"
    ],
    "image": "assets/workshop/lamp.webp",
    "alt": "Fotoğrafı ışıkla görünür olan litofan lamba",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "lamp-studio",
    "price": null
  },
  {
    "id": "phone",
    "name": "Telefon standı",
    "originalTitle": "Telefonun park yeri",
    "description": "Telefon standını tasarla, telefonu koy ve çıkar.",
    "categories": [
      "desk"
    ],
    "image": "assets/workshop/phone.webp",
    "alt": "Telefonu taşıyan üç boyutlu masaüstü standı",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "phone-studio",
    "price": null
  },
  {
    "id": "message-ring",
    "name": "Mesaj halkası anahtarlık",
    "originalTitle": "Döndür, mesaj değişsin",
    "description": "Bir halkayı çevir, kendi mesajlarını keşfet.",
    "categories": [
      "gift"
    ],
    "image": "assets/workshop/ring.webp",
    "alt": "Döndükçe gizli mesajı gösteren halkalı anahtarlık",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "message-ring-studio",
    "price": null
  },
  {
    "id": "capsule",
    "name": "Şifreli mesaj kapsülü",
    "originalTitle": "Şifreni çevir, sürprizi aç",
    "description": "Üç halkalı kapsülüne bir şifre ve gizli mesaj ekle.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/capsule.webp",
    "alt": "İçinde mesaj saklanan kapsül anahtarlık",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "capsule-studio",
    "price": null
  },
  {
    "id": "gear",
    "name": "Dişli çark seti",
    "originalTitle": "Birini çevir, hepsi hareket etsin",
    "description": "Üç dişlini renklendir, birbirine bağlı hareketi dene.",
    "categories": [
      "play"
    ],
    "image": "assets/workshop/gear.webp",
    "alt": "Birlikte hareket eden renkli dişli çarklar",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "gear-studio",
    "price": null
  },
  {
    "id": "shadow",
    "name": "Gölge mesaj tasarımı",
    "originalTitle": "Işığı tut, gizli mesajı gör",
    "description": "Işığı taşı, gölgede kendi mesajını ortaya çıkar.",
    "categories": [
      "gift",
      "desk"
    ],
    "image": "assets/workshop/shadow.webp",
    "alt": "Gölgesiyle şekil oluşturan masaüstü tasarım",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "shadow-studio",
    "price": null
  },
  {
    "id": "dragon",
    "name": "Eklemli mini ejderha",
    "originalTitle": "Kendi mini ejderhanı tasarla",
    "description": "Kafasını taşı, gövdesi ve kuyruğu peşinden kıvrılsın.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/dragon.webp",
    "alt": "Hareketli eklemleri olan ejderha tasarımı",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "dragon-studio",
    "price": null
  },
  {
    "id": "flower",
    "name": "Açılan mesaj çiçeği",
    "originalTitle": "Dokun, çiçeğin açılsın",
    "description": "Tomurcuğunu çevir, yapraklar açılsın ve mesajın görünsün.",
    "categories": [
      "gift",
      "desk"
    ],
    "image": "assets/workshop/flower.webp",
    "alt": "Hareketle açılan yapraklı çiçek tasarımı",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "flower-studio",
    "price": null
  },
  {
    "id": "cube",
    "name": "Sonsuz küp",
    "originalTitle": "Katla, şekil değişsin",
    "description": "Sekiz parçanı renklendir, açılan yüzlerde simgeni keşfet.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/cube.webp",
    "alt": "Katlanarak biçim değiştiren sonsuz küp",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "cube-studio",
    "price": null
  },
  {
    "id": "penalty",
    "name": "Masaüstü penaltı oyunu",
    "originalTitle": "Çek, bırak, gol olsun",
    "description": "Kaleni tasarla, kolu ger ve beş atışta golünü bul.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/penalty.webp",
    "alt": "Masaüstü penaltı oyunu ve kalesi",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "penalty-studio",
    "price": null
  },
  {
    "id": "marble",
    "name": "Bilye parkuru",
    "originalTitle": "Rotanı kur, topu bırak",
    "description": "Parçaları birleştir, bilyenin finişe varışını izle.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/marble.webp",
    "alt": "Bilyelerin ilerlediği masaüstü parkur",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "marble-studio",
    "price": null
  },
  {
    "id": "wave",
    "name": "Dalga mekanizması",
    "originalTitle": "Döndür, dalga yürüsün",
    "description": "Sekiz parçanı renklendir, kolu çevir ve dalganı yürüt.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/wave.webp",
    "alt": "Eklemli dalga biçiminde hareketli anahtarlık",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "wave-studio",
    "price": null
  },
  {
    "id": "squeeze",
    "name": "Gizli mesaj mekanizması",
    "originalTitle": "Sıkıştır, sürpriz çıksın",
    "description": "İki yanı içeri kaydır, gizlediğin mesaj yukarı çıksın.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/squeeze.webp",
    "alt": "Sıkınca gizli mesajı gösteren mekanizma",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "squeeze-studio",
    "price": null
  },
  {
    "id": "slide",
    "name": "Fotoğraflı kaydırmalı puzzle",
    "originalTitle": "Kaydır, resmi tamamla",
    "description": "Fotoğrafını sekiz parçaya böl, kaydırarak resmi tamamla.",
    "categories": [
      "gift",
      "play"
    ],
    "image": "assets/workshop/slide.webp",
    "alt": "Kaydırılan parçalarla tamamlanan fotoğraf bulmacası",
    "detailLabel": "İsim, mesaj veya tasarım notun",
    "tool": "slide-studio",
    "price": null
  },
  {
    "id": "custom-part",
    "name": "İhtiyacına özel parça",
    "description": "Fotoğrafını ve ölçülerini paylaş; üretilebilirliğini birlikte değerlendirelim.",
    "categories": [
      "custom"
    ],
    "image": "assets/dual-controller-stand.webp",
    "alt": "Özel üretim için örnek oyun kolu tutucu",
    "detailLabel": "Ölçüler ve kullanım amacı",
    "tool": null,
    "price": null
  },
  {
    "id": "bulk-production",
    "name": "Toptan üretim",
    "description": "Aynı üründen adetli üretim için ürün fikrini ve miktarı paylaş.",
    "categories": [
      "bulk"
    ],
    "image": "assets/bulk-production.webp",
    "alt": "Seri halde üretilmiş masaüstü aksesuarları tasarım örneği",
    "detailLabel": "Üretilecek ürün ve ihtiyaçların",
    "tool": null,
    "price": null
  }
];
