# ASCII Knight — Tersine Mühendislik ve Yeniden İnşa (Reverse Engineered)

[ascii-knight.vercel.app](https://ascii-knight.vercel.app/) projesinin tersine mühendislik (reverse engineering) ile kaynak kodları, veri modelleri, matematiksel algoritmaları ve görsel fiziği çözümlenmiş ve sıfırdan modernize edilerek yeniden oluşturulmuştur.

---

## 🔍 Tersine Mühendislik Analizi (Reverse Engineering Breakdown)

Orijinal site incelendiğinde harici bir oyun motoru (Three.js, Pixi.js vb.) veya TailwindCSS yerine, doğrudan **HTML5 Canvas** üzerinde çalışan saf, optimize edilmiş bir ASCII rasterizer ve matematiksel fizik simülasyonu kullandığı tespit edilmiştir.

### 1. Şövalye Karakter Matrisi (152 × 119 Piksel / Karakter)
- Şövalyenin görsel verisi, **152 sütun × 119 satır** uzunluğunda 16'lık tabanda (hexadecimal `0-f`) kodlanmış bir parlaklık matrisidir (`knight-data.js`).
- Her bir karakter `0` (tamamen şeffaf) ile `f` (en parlak / 1.0) arasında normalize edilmiş parlaklık değerine dönüştürülür.
- **Mask Dilation (Genişletme Filtresi):** Çimlerin şövalyenin zırhındaki küçük boşluklardan taşmasını engellemek için 3x5 komşuluk çekirdeği ile bir maske filtresi oluşturulur.

### 2. Pelerin ve Atkı Fiziği (Cloth & Ribbon Mechanics)
- Pelerin, 4 ana şerit (`STRANDS`) ve boyun sarmalı (`WRAP`) olarak modellenmiştir.
- **Bézier Eğrileri:** Kök (root), kontrol (ctrl) ve uç (tip) noktaları arasında kuadratik eğriler hesaplanır.
- **Dalga Propagasyonu:** $w_1 = \sin(2\pi(1.3s - t/T) + \phi)$ ve harmonik $w_2$ fonksiyonları ile rüzgar dalgası kökten uca doğru şiddetlenerek iletilir.
- **Yırtık Uçlar (Tattered Edges):** Deterministik `hash3` fonksiyonu ile kumaşın uçlarında rüzgarda aşınmış lif delikleri ve kumaş dokusu karakterleri (`+`, `x`, `X`, `%`, `&`) üretilir.
- **Uçuşan Kumaş Parçacıkları:** Pelerinin ucundan kopup rüzgarda savrulan 22 adet iplik parçacığı simüle edilir.

### 3. Çok Katmanlı 3B Derinlikli Çayır (Multi-Depth Grass Field)
- Ekrana yaklaşık `COLS * 5.5` adet çim bıçağı derinlik fonksiyonuna göre ($depth = rnd^{0.75}$) perspektifli olarak dağıtılır.
- **Eğim ve Karakter Seçimi:** Rüzgarın kuvvetine göre çimin eğim açısı (slope) anlık hesaplanır:
  - Dik: `|`
  - Sağa yatık: `/`
  - Sola yatık: `\`
  - Uçlar: `'` veya `,`
  - Uzak/ufuk noktaları: `.`
- **Güneş Işıltısı (Specular Sheen):** Rüzgar dalgası geçtikçe eğilen çim uçları ışığı yansıtarak parlar.
- **Karahindiba Tohumları (Fluff):** Ufuk çizgisinde süzülen polen ve tohumlar periyodik olarak ekranı boydan boya geçer.

### 4. Yüksek Performanslı ASCII Rasterizasyonu ve Doğrudan 32-bit Bellek Yazımı
- Karakterler canvas metin çizimi ile tek tek basılmak yerine, başlangıçta `Uint8Array` alfa maskeleri olarak hafızada önbelleğe alınır.
- Çerçeve oluşturulurken `ImageData.data.buffer` üzerinden bir `Uint32Array` (`px32`) dizisine doğrudan piksel renk değerleri yazılarak `putImageData` ile tek seferde ekrana aktarılır. Bu sayede 60 FPS akıcı performans elde edilir.
- **3 Aşamalı Bloom / Glow:** Görüntü sırasıyla 1/2, 1/4 ve 1/8 boyutlarına küçültülüp bulanıklaştırılarak `lighter` kompozisyon moduyla ekranın üzerine bindirilir ve neon/sinematik bir parlaklık efekti oluşturulur.

---

## ✨ Eklenen Modern Özellikler ve Geliştirmeler

Orijinal projenin estetiği %100 korunurken kullanıcı deneyimini zenginleştiren ek özellikler geliştirilmiştir:

1. **Cam Efektli (Glassmorphism) Kontrol Paneli (HUD):**
   - Anlık FPS sayacı ve ASCII ızgara çözünürlüğü göstergesi (`COLS × ROWS`).
   - Ekranı sadeleştirmek için `H` tuşu veya kontrol butonu ile tamamen gizlenebilir/küçültülebilir.

2. **Dinamik Renk Paletleri (Presets):**
   - **Classic Twilight:** Orijinal çelik zırh, kan kırmızısı pelerin ve zümrüt çayır.
   - **Blood Moon:** Koyu kızıl gökyüzü, kor kırmızısı zırh ve alevli pelerin.
   - **Emerald Aurora:** Mistik kuzey ışıkları, turkuaz pelerin ve zümrüt tonları.
   - **Neon Synth (Cyberpunk):** Neon macenta pelerin, siber mavi çayır ve mor zırh.
   - **Golden Hour (Sunset):** Sıcak altın sarısı gün batımı, turuncu pelerin.

3. **Etkileşimli Simülasyon Sürgüleri (Fizik Ayarları):**
   - Rüzgar şiddeti (Wind Force)
   - Pelerin dalgalanma genliği (Cape Wave)
   - Çim yüksekliği (Grass Height)
   - Parlama / Parıltı seviyesi (Bloom Glow)

4. **Web Audio API ile Gerçek Zamanlı Rüzgar Sentezleyicisi (Procedural Audio):**
   - Hiçbir harici ses dosyası indirmeden, tarayıcının Web Audio API motorunda pembe gürültü (pink noise), rezonans filtreleri ve LFO kullanılarak rüzgar uğultusu ve çim hışırtısı üretilir.
   - Rüzgar dalgası şiddetlendikçe sesin frekansı ve volümü simülasyonla tam senkronize olarak yükselir (`M` tuşu ile açılıp kapatılabilir).

5. **Ekran Görüntüsü ve ASCII Metin Dışa Aktarma:**
   - `S` tuşu ile yüksek çözünürlüklü PNG formatında duvar kağıdı kaydetme.
   - `C` tuşu ile o anki kareyi saf ASCII metni olarak panoya kopyalama.
   - `F` tuşu ile tam ekran deneyimi.
   - `Space` tuşu ile simülasyonu duraklatma / devam ettirme.

---

## 🚀 Kurulum ve Çalıştırma

Proje sıfır harici bağımlılığa (zero-dependency) sahiptir.

### Yöntem 1: Doğrudan Tarayıcıda Açma
Doğrudan `index.html` dosyasını Google Chrome, Edge veya Firefox tarayıcınızda açabilirsiniz.

### Yöntem 2: Node.js Sunucusu ile (Önerilen)
```bash
# Proje dizinine gidin
cd C:\Users\ardau_o60fdxn\.gemini\antigravity-ide\scratch\ascii-knight

# Dahili sunucuyu başlatın
node server.js
```
Tarayıcınızda `http://localhost:3000` adresine gidin.

---

## ⌨️ Kısayol Tuşları (Keyboard Shortcuts)

| Tuş | İşlev |
| :--- | :--- |
| **SPACE** | Simülasyonu Duraklat / Devam Ettir |
| **H** | HUD Kontrol Panelini Gizle / Göster |
| **M** | Rüzgar Sesini Aç / Kapat |
| **S** | Duvar Kağıdı Ekran Görüntüsü İndir (PNG) |
| **C** | Güncel ASCII Karesini Panoya Kopyala |
| **F** | Tam Ekran Moduna Geç / Çık |
| **R** | Tüm Ayarları Varsayılana Sıfırla |

---

## 📂 Dosya Yapısı

```
ascii-knight/
├── index.html       # Ana sayfa ve HUD bileşenleri
├── style.css        # Glassmorphic modern koyu tema ve animasyonlar
├── knight-data.js   # 152x119 Şövalye parlaklık matrisi (Hex 0-f)
├── ascii-knight.js  # Çekirdek ASCII çizim, fizik ve bloom motoru
├── audio.js         # Web Audio API rüzgar simülasyonu
├── ui.js            # HUD kontrolleri, kısayollar ve bildirimler
├── server.js        # Hafif yerel Node.js geliştirme sunucusu
└── README.md        # Dokümantasyon
```
