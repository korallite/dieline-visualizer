# MASTER PROMPT — Dieline 3D → Folder (Box Fold Simulator)

> Reverse-engineered dari file HTML dieline 3D folder (±4.160 baris, single-file HTML).
> Tujuan dokumen ini: kalau di-paste ke AI coding assistant (Claude/GPT/dll) dari nol, hasilnya
> harus jadi aplikasi yang setara secara fungsi, arsitektur, dan detail perilaku dengan file asli.
> Tulis SEMUA dalam **1 file HTML standalone**, Bahasa Indonesia untuk semua UI/label/pesan.

---

## 1. RINGKASAN PRODUK

Aplikasi web single-file (`index.html`, no build step, no backend) untuk **mengimpor dieline SVG
kemasan karton (kotak lipat / corrugated box)**, otomatis mendeteksi panel & engsel dari warna
garis, lalu merender **simulasi lipatan 3D interaktif** (flat → terlipat penuh) memakai Three.js.
User bisa mengatur sudut tiap engsel, menempelkan mockup desain (outside/inside) sebagai tekstur,
mengukur jarak, mengekspor model (GLB/OBJ), dan mengekspor **1 file HTML viewer standalone**
yang bisa dikirim ke customer tanpa perlu install apa-apa.

Target user: desainer layout packaging / operator mesin cutting yang gak punya background coding
— jadi semua istilah teknis 3D disederhanakan ke bahasa awam Indonesia (mis. "Front/Depan",
"Ground/Bawah", "Engsel", "Sudut Lipatan").

---

## 2. TECH STACK & CONSTRAINT

- Murni HTML + CSS + Vanilla JS, **tanpa framework** (no React/Vue), tanpa bundler.
- Tailwind via CDN (`cdn.tailwindcss.com`) untuk utility class dasar, dikombinasi dengan CSS custom
  (CSS variables untuk theming) di dalam `<style>`.
- Three.js **r128** via cdnjs, plus addon terpisah dari jsdelivr:
  - `OrbitControls.js`
  - `CSS2DRenderer.js` (buat label panel P1/P2/... yang selalu menghadap kamera)
  - `GLTFExporter.js`
  - `OBJExporter.js`
- Tidak ada dependency backend/server — semua parsing SVG, geometry, fold-solving jalan di browser.
- Bahasa UI: **Bahasa Indonesia informal-teknis** (contoh istilah: "Belum ada file dimuat.",
  "Klik 2 titik point object untuk ukur jarak.").
- Struktur file: 1 file HTML, section JS dipisah dengan comment block besar bertanda:
  ```
  /* =========================================================================
     NAMA SECTION
     ========================================================================= */
  ```

---

## 3. LAYOUT UI (App Shell)

CSS variable global di `:root` untuk theming (lihat §10):
`--rail-w`, `--menu-h: 32px`, `--tool-h: 42px`, `--top-h` (=menu-h+tool-h), `--panel-w: 320px`,
warna: `--accent`, `--ink`, `--line`, `--page-bg`, `--surface`, dst.

### 3.1 Menu Bar (atas, fixed, height=menu-h)
Logo 📦 + judul "Dieline 3D", lalu menu dropdown ala aplikasi desktop:
- **File**: Import SVG…, Buka Contoh, (sep), Import Mockup Outside…, Import Mockup Inside…, (sep),
  Export .GLB, Export .OBJ, Export Viewer HTML (buat customer)
- **Edit**: Connector Tool, Set Front Tool, Set Ground Tool, Join Point Tool (3D) — semua toggle
- **View**: checkbox "Tampilkan Ground (lantai)", "Tampilkan Label Panel (P1, P2, ...)",
  "Tampilkan Input Sudut Engsel", "Ruler (Penggaris Point-to-Point)"; toggle tema gelap/terang;
  tombol performa Low/Medium/High; "Camera Setting…"; "Debug…"
- **Help**: instruksi kontrol kamera (geser = middle-mouse drag, zoom = scroll wheel) + legenda
  warna dieline (bebas=panel, kuning=engsel)

### 3.2 Toolbar (di bawah menu bar, height=tool-h)
- Tab mode: **3D | 2D | Mockup** (`mode-tab`, active state biru)
- Badge status (mis. "Tampilan 3D")
- Tombol icon: toggle tema (🌙), buka View Settings (⚙)

### 3.3 Panel Kanan (fixed, width=panel-w=320px) — berganti isi sesuai tab aktif
1. **Import Dieline** (selalu terlihat di tab 3D): tombol Import SVG / Contoh, legenda warna,
   status text, lalu blok **Corrugated Board Standard** (lihat §7).
2. **Mockup Import** (tab Mockup): upload Outside/Inside, toggle sisi aktif, daftar layer per sisi.
3. **Hinge Panel** (tab 3D): "Daftar Engsel" (list slider sudut per engsel), Join Point Tool (3D),
   tombol Export (.GLB / .OBJ / Viewer HTML).
4. **Connector Panel** (tab 2D): tombol Set Front (F), Set Ground (G), Connector Tool, daftar
   connector manual.
5. **Mockup Edit Panel** (tab Mockup, saat sedang atur posisi gambar): Flip H/V, Reset ke Skala
   Asli, Stretch Isi Penuh Dieline.

### 3.4 Overlay Floating (pointer-events terkontrol supaya gak nutup viewport)
- **Box Orientation widget** (kiri-bawah): grid 3x3 tombol panah (⬆⬅➡⬇ + reset ⟲) untuk memutar
  seluruh box (roll/pitch/yaw), plus 2 tombol Roll (↺ Depan / ↻ Belakang).
- **Fold Progress bar** (bawah-tengah, lebar): label "Progres Lipatan" + keterangan "0 = Dieline
  datar, 1 = Sudut target tercapai", tombol "▶ Animasi" (autoplay), slider range 0–1 step 0.01.
- **Ruler HUD** (kiri-atas viewport, muncul saat ruler aktif): status teks, box "Jarak Terukur"
  (mm besar), tombol Reset Titik.
- **Point context menu** (klik-kanan / klik titik): Snap Sudut, Batal Pilih.
- **Camera Settings modal**: pilih Perspektif/Orthographic, slider FOV (5–75, default 45), reset.
- **Debug modal**: 2 panel pre/JSON (Debug 3D UV+Origin, Debug Raw Coords Mockup) + tombol
  "Simpan JSON" per panel dan "Simpan JSON Gabungan".
- **Marquee selection** rect (buat multi-select titik di 3D, dashed blue box mengikuti drag mouse).

### 3.5 Viewport
- `#canvas-container`: fixed, area WebGL Three.js (top=top-h, left=rail-w, right=panel-w).
- `#editor2d-container`: overlay SVG 2D crease editor (pan/zoom, cursor grab/grabbing saat drag).

---

## 4. ALUR UTAMA (Main Pipeline)

1. User klik **Import SVG** → file dibaca sebagai teks → `parseDielineSVG()`.
2. Parser cari semua elemen `<rect|line|polyline|polygon|path>`, ambil warna **stroke**-nya
   (support: inline `style="stroke:..."`, atribut `stroke`, atau CSS class lewat `<style>` di SVG).
3. **Aturan warna** (fixed rule, WAJIB persis ini):
   - **Kuning murni** (`rgb(255,255,0)` setelah dinormalisasi lewat `getComputedStyle`) →
     dianggap **engsel** (garis lipat). Jika elemen multi-titik, dipecah jadi banyak segmen
     berurutan.
   - **Warna lain apa pun** → kandidat **panel** (lembar karton), TAPI hanya diterima kalau:
     - shape punya ≥3 titik sudut asli, DAN
     - untuk elemen `<path>` harus **closed loop** (titik akhir kembali ≈ titik awal, toleransi
       3% dari diagonal bounding box) — ini untuk menolak garis referensi/dimensi/fillet yang
       digambar CAD (CorelDRAW dll) sebagai open curve.
     - Untuk `<path>`, jumlah titik sudut dihitung dari **anchor count asli** (sebelum path
       di-sample jadi polyline halus), bukan dari jumlah titik hasil sampling — supaya 1 kurva
       fillet tunggal tidak salah kebaca jadi panel sendiri.
4. Path parser custom (bukan library) yang mendukung command SVG: `M/L/H/V/C/S/Q/T/A/Z`
   (termasuk arc `A` dengan konversi endpoint→center parameterization sesuai spec SVG), curve
   di-sample jadi `PATH_CURVE_SEGMENTS = 16` segmen lurus.
5. Dari kumpulan panel + engsel mentah → **build graph**: cari edge yang saling bersinggungan
   antar-panel (`edgeOverlapSegment`, `findSharedEdge`, toleransi jarak), gabungkan dengan
   engsel eksplisit (garis kuning) dan **connector manual** (dibuat user di tab 2D) → bentuk
   **priority tree / spanning tree** dari root (panel Front, default = panel terbesar / bisa
   di-override manual).
6. **Loop detection**: kalau ada connector yang bikin panel tersambung 2 jalur berbeda (loop),
   engsel yang menyebabkan loop ditandai **nonaktif** (visual: opacity turun + warning ⚠ dengan
   penjelasan) dan tidak dipakai di pohon lipatan.
7. `build3D()`: untuk tiap panel, generate `THREE.ShapeGeometry` dari polygon 2D-nya + **side wall
   geometry** (dinding tebal karton yang terlihat di tepi saat dilipat, texture flute berulang
   proporsional ke panjang sisi) → jadi mesh dengan material luar (`material`) dan dalam
   (`insideMaterial`, sedikit lebih gelap, dengan geometry face di-flip normal & winding).
8. Tiap panel jadi child dari panel induknya di scene graph Three.js mengikuti tree (posisi/rotasi
   relatif terhadap engsel), sehingga memutar sudut engsel otomatis memutar semua descendant-nya
   (parent-child transform, bukan flat world transform).
9. `updateFold(t)` — `t` dari 0..1 — interpolasi tiap sudut engsel dari 0° (flat) ke sudut target
   yang di-set user (default 90°, range slider -180..180 per engsel, ada opsi "Balik arah lipat"
   / flip). Animasi "▶ Animasi" pakai `buildFoldAnimationClip()` + easing (lihat kode
   `goldenSectionMin` dipakai untuk solve sesuatu — masukkan smoothing/easing yang masuk akal,
   mis. easeInOutCubic, saat autoplay).

---

## 5. SISTEM ENGSEL (HINGE) & CONNECTOR

- **Engsel otomatis**: dari garis kuning di SVG yang persis menempel di sisi 2 panel.
- **Connector manual**: dibuat lewat tab **2D** (crease editor). Alur: aktifkan "Connector Tool",
  klik panel A, klik panel B yang bersinggungan langsung (harus ada shared edge, kalau tidak
  tampil alert Bahasa Indonesia menjelaskan kenapa gagal) → connector tersimpan dengan id
  `M1, M2, ...`, digambar sebagai garis hijau tebal + label di 2D editor.
- Tiap connector/engsel bisa dihapus manual (tombol ✕ merah) → `rebuildAll()`.
- **Hinge card** di panel kanan (tab 3D): tiap engsel punya id (contoh `EG1`), info `P{a} ↔ P{b}`,
  slider sudut -180..180 + input angka tersinkron, checkbox "Balik arah lipat" (flip direction).
- **Front/Depan** (kuning saat ditandai di editor 2D, label "F") dan **Ground/Bawah** (ungu,
  label "G", bisa gabung "F/G") ditentukan lewat tool khusus di tab 2D; default otomatis pilih
  panel dengan area terbesar sebagai root/front.
- Warna panel di editor 2D: default abu (`#fde9c8`/abu netral), pending selection biru,
  front kuning `#fde68a`, ground ungu `#ddd6fe`, front+ground ungu-muda `#e9d5ff`, terhubung
  connector hijau `#bbf7d0`.

---

## 6. FITUR TIAP TAB

### Tab 3D
- Render box 3D full (bukan flat), slider fold progress, tombol animasi, hinge sliders,
  box orientation controls, join-point tool (klik 2+ titik sudut 3D untuk "snap sudut" — dipakai
  supaya sudut lipatan presisi menempel), export GLB/OBJ/Viewer HTML.
- **Ruler 3D**: aktifkan dari menu View → klik 2 titik pada object 3D → hitung jarak dalam mm
  pakai skala SVG→mm yang konsisten dengan ketebalan flute (`getSvgToMM()`, `getThicknessScene()`).
- Label CSS2D "P1, P2, ..." mengambang di atas tiap panel (toggle-able).
- Ground plane + grid helper Three.js, bisa disembunyikan.

### Tab 2D (Crease Editor)
- SVG viewport pan (middle-mouse drag) & zoom (scroll wheel), auto-fit saat load
  (`fitEditor2DView`).
- Klik panel untuk pilih Front/Ground/Connector tergantung tool aktif.
- Visualisasi connector (garis hijau) dan status F/G di atas polygon panel.

### Tab Mockup
- Upload gambar desain **Outside** dan **Inside** terpisah (multi-file / paste clipboard
  Ctrl/Cmd+V didukung).
- Tiap sisi punya **layer list** (bisa banyak layer, tiap layer: nama, visible toggle, delete).
- Overlay editor: drag untuk pindah, titik biru = resize (handle di sudut), titik hijau = rotate.
- Reset ke skala asli, Flip H/V, "Stretch Isi Penuh Dieline" (fit ke bounding box dieline).
- **Mockup sisi Inside otomatis di-mirror** (transform scale(-1,1) di viewport) karena posisi
  cermin terhadap outside saat box terlipat.
- Mockup di-render ke `<canvas>` per sisi lalu jadi `THREE.CanvasTexture`, di-map ke UV tiap panel
  berdasarkan posisi asli panel di ruang SVG (bounding-box relative UV mapping,
  `computeMockupUV`/`buildMockupUVAttribute`).

---

## 7. CORRUGATED BOARD STANDARD (ISO/TAPPI/FEFCO)

Panel "📦 Corrugated Board Standard" berisi **flute selector** berbentuk kartu grid dengan ikon
gelombang visual (bar chart mini), memilih salah satu dari tabel berikut (WAJIB pakai angka
persis ini):

| id | Nama    | Tebal (mm) | Liner (mm) | relT  | Layers                | Deskripsi                                  |
|----|---------|-----------:|-----------:|------:|------------------------|---------------------------------------------|
| F  | F-Flute | 0.8        | 0.28       | 0.010 | 2 liners + 1 medium   | Micro-flute · Cosmetics & retail packaging |
| E  | E-Flute | 1.5        | 0.35       | 0.018 | 2 liners + 1 medium   | Thin wall · Retail & consumer boxes        |
| B  | B-Flute | 3.0        | 0.50       | 0.032 | 2 liners + 1 medium   | Single wall · Die-cutting & folding boxes  |
| C  | C-Flute | 4.0        | 0.50       | 0.042 | 2 liners + 1 medium   | Single wall · Shipping & transport boxes   |
| EB | EB-Flute| 4.5        | 0.65       | 0.050 | 3 liners + 2 mediums  | Double wall (E+B) · Retail & display       |
| BC | BC-Flute| 7.0        | 0.70       | 0.075 | 3 liners + 2 mediums  | Double wall (B+C) · Heavy-duty shipping    |

- Default terpilih: **B-Flute**.
- Info box menampilkan nama, pill tebal (mm), deskripsi, dan rincian layer.
- **Custom Thickness override**: checkbox "Custom Thickness (mm)" → aktifkan slider (0.5–12mm,
  step 0.1) + input angka; kalau aktif, ketebalan panel 3D pakai nilai custom, bukan dari flute
  standar.
- Ketebalan mm dikonversi ke unit scene Three.js lewat `getThicknessScene()` yang
  memperhitungkan skala global model dan faktor SVG→mm (`getSvgToMM`, deteksi otomatis: kalau
  bounding box dieline sisi terpanjang >1000 unit, asumsikan file dalam satuan 0.01mm/unit,
  kalau tidak = 1:1 mm).

---

## 8. EXPORT

1. **Export .GLB** — `THREE.GLTFExporter`, binary glTF dari scene box (state fold saat ini).
2. **Export .OBJ** — `THREE.OBJExporter`.
3. **Export Viewer HTML** — fitur andalan: `buildViewerHtmlTemplate()` menghasilkan **1 file HTML
   standalone** berisi model + animasi lipatan otomatis (autoplay dari flat ke fold target),
   didesain untuk dikirim ke customer non-teknis: tinggal dibuka di browser apa saja, tanpa
   install, tanpa server. Sertakan copy Three.js + kontrol orbit minimal + tombol play/replay.
4. **Export Debug JSON** — dari Debug modal: dump data UV & origin tiap panel 3D, dump raw
   koordinat mockup, atau gabungan keduanya — untuk keperluan troubleshooting mapping.

---

## 9. RULER (PENGGARIS POINT-TO-POINT)

- Toggle dari menu View → checkbox "Ruler (Penggaris Point-to-Point)".
- Bekerja di 2 mode: 2D editor (klik titik di SVG) dan 3D viewport (klik titik/point marker di
  mesh, termasuk join-point marker).
- HUD: instruksi, hasil jarak dalam **mm** (bukan unit scene mentah — dikonversi pakai skala yang
  sama persis dengan yang dipakai untuk generate ketebalan flute, supaya konsisten), tombol Reset
  Titik.

## 10. THEME (LIGHT / DARK)

- Toggle dari toolbar (🌙) atau View menu (switch component `.theme-switch`).
- Implementasi: tambah/hapus class `dark-theme` di `<html>`, semua warna didefinisikan ulang
  lewat CSS custom properties (`--rail-bg`, `--accent`, `--ink`, `--line`, `--page-bg`,
  `--surface`, `--surface-alt`, `--text-muted`, dst) plus override eksplisit untuk beberapa
  utility class Tailwind yang tidak otomatis ikut variable (text-gray-*, border-gray-*, dst)
  supaya tetap kontras di dark mode.
- Scene Three.js juga ganti warna background/fog/floor/grid/lighting intensity mengikuti tema
  (lihat objek `THEME_COLORS.light` / `.dark` di kode: bg, fog, floor, gridMain, gridSec,
  ambient, dir, fill, fillColor).

## 11. PERFORMANCE LEVEL

- 3 tingkat: **Low / Medium / High** (tombol di View menu), memengaruhi kualitas render
  (mis. shadow map, pixel ratio, antialiasing, jumlah segmen curve) — implementasi bebas asal
  konsisten: Low = paling ringan/kompatibel, High = kualitas visual maksimal.

## 12. CAMERA SETTINGS

- Modal terpisah: pilih tipe kamera **Perspective** atau **Orthographic** (toggle side-buttons),
  slider **FOV** 5–75 (default 45, hanya relevan untuk perspective) dengan input angka tersinkron
  + tombol Reset.

---

## 13. GEOMETRY & MATH HELPERS YANG WAJIB ADA

Implementasikan util-util berikut (nama boleh disesuaikan, tapi fungsinya harus ada):
- Path SVG → polyline sampler manual (mendukung semua command termasuk arc) — jangan pakai
  library eksternal untuk parsing path.
- Deteksi closed-loop dengan toleransi relatif terhadap bounding box shape (bukan epsilon absolut).
- Polygon area (buat nentuin panel terbesar = default front/root).
- Deteksi shared-edge / overlap segment antar 2 polygon (dengan toleransi numerik) untuk auto-graph
  dan validasi connector manual.
- BFS/tree builder dari kumpulan edge (engsel otomatis + connector manual) → spanning tree +
  deteksi & penonaktifan engsel yang bikin loop.
- Interpolasi sudut engsel (linear terhadap `t` fold-progress, dikombinasi optional flip).
- Snap-angle solver untuk join-point tool (menyamakan 2+ titik terpilih di 3D supaya presisi
  nempel saat sudut tertentu — boleh pakai pendekatan optimasi 1D seperti golden-section search
  bila diperlukan).
- Konversi SVG unit ↔ mm yang **konsisten** dipakai baik oleh generator ketebalan panel maupun
  ruler, supaya angka yang ditampilkan ke user selalu match.

---

## 14. PRINSIP UX YANG HARUS DIPERTAHANKAN

- Semua pesan error/alert harus **jelas dan actionable dalam Bahasa Indonesia**, contoh gaya:
  *"Sheet P2 dan P5 tidak bersinggungan langsung (tidak ada sisi yang menempel), jadi tidak bisa
  dibuat engsel di antara keduanya."*
- Jangan biarkan user bingung kenapa sebuah engsel tidak jalan — selalu tampilkan alasan (mis.
  badge ⚠ + kalimat penjelasan loop-detection) langsung di UI card-nya, bukan cuma disembunyikan.
- Semua kontrol numerik penting (sudut engsel, FOV, custom thickness) selalu **slider + input
  angka yang tersinkron dua arah**.
- Tool-tool mode-toggle (Connector/Front/Ground/Join Point) harus punya **state visual jelas**
  (label tombol berubah jadi "... : ON/OFF", warna tombol berubah) supaya user tahu tool mana
  yang sedang aktif sebelum mereka klik ke viewport/editor.
- Aplikasi harus tetap 100% jalan offline-first setelah CDN script termuat — tidak ada call ke
  backend/API pihak ketiga untuk logika inti (parsing, folding, export).

---

## 15. CARA PAKAI PROMPT INI

Untuk regenerasi ulang dari nol, minta AI:
1. Bangun dulu **App Shell** (§3) + theme system (§10) sebagai kerangka statis.
2. Implementasi **SVG parser & aturan warna** (§4 poin 1-4) — ini fondasi paling kritikal, test
   dengan dieline SVG sederhana (kotak RSC standar) dulu.
3. Bangun **graph/tree builder** (§4 poin 5-6, §13) sebelum sentuh Three.js.
4. Baru render 3D (`build3D`, §4 poin 7-9) + fold system (§5).
5. Tambahkan fitur tab 2D & Mockup (§6), lalu Ruler (§9), Export (§8), Camera/Performance (§11-12)
   paling akhir karena mereka bergantung pada core yang sudah jalan.

Jika ingin regenerasi **persis 1:1**, paste ulang file HTML asli sebagai referensi tambahan
di samping prompt ini — dokumen ini dioptimalkan untuk **rebuild dari deskripsi**, bukan
pengganti kode sumber aslinya.
