# ASCII Knight

> Rüzgarda dalgalanan kırmızı pelerini, derinlikli çayır simülasyonu ve gerçek zamanlı sinematik atmosferiyle geliştirilmiş interaktif bir ASCII Art web deneyimi.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://ardaaau.github.io/ascii-knight/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚔️ Proje Hakkında

**ASCII Knight**, doğrudan HTML5 Canvas üzerinde çalışan yüksek performanslı bir ASCII rasterizasyon motoru ve matematiksel fizik simülasyonudur. Harici ağır oyun motorları veya harici kütüphaneler yerine saf JavaScript ile sıfırdan geliştirilmiştir.

Ekranın merkezinde duran şövalyenin pelerini, Bézier eğrileri ve dalga fonksiyonlarıyla dinamik olarak savrulurken; ayaklarının altındaki çayır rüzgar dalgalarıyla yöne göre karakter değiştirerek parlar ve arka planda saf Web Audio API ile üretilen rüzgar uğultusu eşlik eder.

---

## ✨ Temel Özellikler

### 1. Pelerin ve Kumaş Fiziği (Cloth & Ribbon Mechanics)
- Pelerin, Bézier eğrileri üzerine binen çift frekanslı dalga harmonikleri ($w_1, w_2$) ile modellenmiştir.
- Rüzgarın kuvvetine göre kökten uca doğru şiddetlenen dalgalanma, kıvrılma (twist) ve rüzgarda aşınmış lif dokuları (`+`, `x`, `X`, `%`, `&`) üretilir.
- Pelerinin ucundan kopup rüzgarda savrulan dinamik iplik parçacıkları simülasyona canlılık katar.

### 2. Çok Katmanlı 3B Perspektifli Çayır (Perspective Grass Field)
- Derinlik fonksiyonuna ($depth = rnd^{0.75}$) göre binlerce çim bıçağı perspektifli olarak sahneye yerleştirilir.
- Rüzgarın kuvvetine göre çimin eğim açısı anlık hesaplanarak en uygun ASCII karakteri seçilir (`|`, `/`, `\`, `'`, `,`, `.`).
- Rüzgar dalgaları geçtikçe güneşe yansıyan ışıltı (specular sheen) ve ufukta süzülen karahindiba polenleri sahneyi tamamlar.

### 3. Yüksek Performanslı 32-bit Bellek Rasterizasyonu
- Canvas metin çizimini kare kare yeniden yapmak yerine, tüm ASCII karakterleri bellekte `Uint8Array` alfa maskeleri olarak önbelleğe alınır.
- Kareler doğrudan `Uint32Array` piksel tamponuna yazılarak 60 FPS akıcı performans sağlanır.
- **3 Aşamalı Bloom / Glow:** Görüntü ardışık olarak küçültülüp yumuşatılarak ekranın üzerine bindirilir ve neon/sinematik bir parıltı elde edilir.

### 4. Web Audio API ile Prosedürel Rüzgar Sentezleyicisi
- Hiçbir harici ses dosyası kullanılmadan; pembe gürültü (pink noise), rezonans bant filtreleri ve rüzgar dalgalarıyla senkronize çalışan LFO modülasyonu ile rüzgar uğultusu ve çim hışırtısı üretilir.

### 5. Cam Efektli (Glassmorphism) Kontrol Paneli ve Temalar
- **5 Renk Paleti:**
  - 🌑 **Classic Twilight:** Çelik zırh, kan kırmızısı pelerin ve zümrüt çayır.
  - 🩸 **Blood Moon:** Koyu kızıl gökyüzü, kor kırmızısı zırh ve alevli pelerin.
  - 🌌 **Emerald Aurora:** Mistik kuzey ışıkları ve turkuaz pelerin.
  - ⚡ **Neon Synth:** Siberpunk neon macenta ve mor tonlar.
  - 🌅 **Golden Hour:** Gün batımı altın sarısı ve turuncu tonlar.
- **Canlı Göstergeler:** Gerçek zamanlı FPS sayacı ve ASCII ızgara çözünürlüğü göstergesi (`COLS × ROWS`).
- **Fizik Ayar Sürgüleri:** Rüzgar şiddeti, pelerin dalgalanması, çim yüksekliği ve parıltı seviyesi anlık değiştirilebilir.

---

## ⌨️ Klavye Kısayolları

| Tuş | İşlev |
| :---: | :--- |
| **SPACE** | Simülasyonu Duraklat / Devam Ettir |
| **H** | HUD Kontrol Panelini Gizle / Göster |
| **M** | Rüzgar Sesini Aç / Kapat |
| **S** | Duvar Kağıdı Ekran Görüntüsü İndir (PNG) |
| **C** | O Anki Kareyi Saf ASCII Metni Olarak Kopyala |
| **F** | Tam Ekran Moduna Geç / Çık |
| **R** | Tüm Ayarları Varsayılana Sıfırla |

---

## 🚀 Kurulum ve Çalıştırma

Proje sıfır harici bağımlılığa (zero-dependency) sahiptir.

### Yöntem 1: Doğrudan Tarayıcıda Açma
Doğrudan `index.html` dosyasını Google Chrome, Edge veya Firefox tarayıcınızda açabilirsiniz.

### Yöntem 2: Node.js Sunucusu ile
```bash
# Proje dizinine gidin
cd ascii-knight

# Dahili sunucuyu başlatın
node server.js
```
Tarayıcınızda `http://localhost:3000` adresine gidin.

---

## 📂 Dosya Yapısı

```
ascii-knight/
├── index.html       # Ana sayfa ve HUD bileşenleri
├── style.css        # Glassmorphic modern koyu tema ve animasyonlar
├── knight-data.js   # 152x119 Şövalye parlaklık matrisi
├── ascii-knight.js  # Çekirdek ASCII çizim, fizik ve bloom motoru
├── audio.js         # Web Audio API rüzgar sentezleyicisi
├── ui.js            # HUD kontrolleri, kısayollar ve bildirimler
├── server.js        # Hafif yerel Node.js sunucusu
└── README.md        # Dokümantasyon
```
