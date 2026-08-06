# Prompt — Dieline 3D Folder (Simplified Demo)

Buat halaman HTML single-file (Three.js via CDN) yang mendemonstrasikan konsep
"kotak yang bisa dilipat dari bentuk rata (dieline) ke bentuk 3D" dengan kontrol
slider. Ini versi demo/konsep, bukan tool produksi.

## Tujuan
Menunjukkan logika umum: sebuah net/dieline direpresentasikan sebagai
kumpulan panel yang terhubung lewat hinge (engsel), lalu dilipat dengan
menganimasikan sudut rotasi tiap hinge.

## Struktur Layout
- Header kecil di atas (judul + subtitle).
- Area utama terbagi 2:
  - Kiri: viewport 3D (canvas Three.js, full height).
  - Kanan: panel kontrol (sidebar ~280px) berisi slider & tombol.
- Tema gelap (dark), warna netral slate/blue.

## Objek 3D
- Bangun kotak dari 6 panel: 1 panel bawah (root, diam) + 4 panel sisi
  (depan, belakang, kiri, kanan) yang masing-masing dilipat dari posisi rebah
  (rata dengan lantai) ke posisi berdiri tegak lurus.
- Tiap panel sisi: dibungkus dalam sebuah group/pivot yang diletakkan tepat
  di garis lipat (hinge line) terhadap panel bawah, supaya rotasinya benar
  secara visual (bukan berputar dari tengah panel).
- Material sederhana: warna kraft/cokelat muda + garis tepi (edges) biar
  kelihatan seperti kertas karton.

## Kontrol / Interaksi
1. **Slider Fold (0–1 / 0–100%)**
   - Nilai 0 → semua panel rebah di lantai (bentuk dieline flat).
   - Nilai 1 → semua panel berdiri tegak (bentuk box jadi).
   - Sudut rotasi tiap hinge di-interpolasi linear terhadap nilai slider ini.
2. **Tombol Animasikan / Play-Pause**
   - Saat aktif, nilai fold berjalan otomatis naik ke 1 lalu berhenti
     (atau bolak-balik), lalu update tombol jadi "Jeda".
3. **Slider ukuran box** (panjang, lebar, tinggi)
   - Mengubah ukuran, lalu rebuild ulang seluruh geometri panel + hinge.
4. **Orbit controls** (drag untuk rotate kamera, scroll untuk zoom).

## Batasan (sengaja disederhanakan)
Tidak perlu:
- Parsing dieline dari file SVG asli / deteksi crease otomatis.
- Editor 2D, ruler, export ke format lain, preset performa, ganti tema.
- Bentuk dieline arbitrary (selain box sederhana).

Fokus prompt ini murni untuk menunjukkan **prinsip hinge + fold progress**,
bukan reimplementasi tool produksi lengkap.

## Tech Stack
- Three.js (UMD build, versi yang punya `examples/js/controls/OrbitControls.js`
  non-module, misalnya versi lama seperti r128 — versi terbaru Three.js sudah
  tidak menyediakan build non-module untuk file examples).
- HTML + CSS + JS vanilla, satu file, tanpa build tool.
