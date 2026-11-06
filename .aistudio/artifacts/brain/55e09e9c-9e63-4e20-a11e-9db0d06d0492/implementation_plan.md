# Rencana Implementasi: Koreksi Koordinat Denah Bangunan Awal Terkunci (Griya 9×11)

Berdasarkan koreksi matematis dan jawaban klarifikasi pengguna, denah eksisting dan zona batas awal akan disesuaikan secara presisi dengan pembagian lahan 9.0m × 11.0m (total 99 m²).

---

## 1. Rincian Koordinat & Dimensi Sumbu (Source of Truth)

### Sisi Kiri ($X: 0.0 - 3.0\text{ m}$)
- **Carport Mobil Depan**: $X: 0.0 - 3.0\text{ m}, Y: 0.0 - 2.5\text{ m}$ (lebar 3.0m, kedalaman 2.5m, luas 7.5 m²).
- **Kamar Tidur 2 (KT 2 - Depan)**: $X: 0.0 - 3.0\text{ m}, Y: 2.5 - 6.0\text{ m}$ (lebar 3.0m, kedalaman 3.5m, luas 10.5 m²).
- **Kamar Tidur 1 (KT 1 - Utama)**: $X: 0.0 - 3.0\text{ m}, Y: 6.0 - 9.0\text{ m}$ (lebar 3.0m, kedalaman 3.0m, luas 9.0 m²).
- **Total Panjang KT 1 + KT 2**: $3.5\text{ m} + 3.0\text{ m} = 6.5\text{ m}$ (membentang dari $Y: 2.5\text{ m}$ sampai $Y: 9.0\text{ m}$).
- **Taman Void Terbuka Belakang**: $X: 0.0 - 3.0\text{ m}, Y: 9.0 - 11.0\text{ m}$ (lebar 3.0m, kedalaman 2.0m, luas 6.0 m²).
- **Total Panjang Sumbu Y Kiri**: $2.5\text{ m} + 6.5\text{ m} + 2.0\text{ m} = 11.0\text{ m}$ (Presisi 100%).

### Sisi Tengah ($X: 3.0 - 6.0\text{ m}$)
- **Teras Santai Depan Kanopi**: $X: 3.0 - 6.0\text{ m}, Y: 0.0 - 3.0\text{ m}$ (lebar 3.0m, kedalaman 3.0m, luas 9.0 m²).
- **Ruang Keluarga (RK)**: $X: 3.0 - 6.0\text{ m}, Y: 3.0 - 9.0\text{ m}$ (lebar 3.0m, kedalaman 6.0m, luas 18.0 m²).
- **Ruang Makan Belakang RK**: $X: 3.0 - 6.0\text{ m}, Y: 9.0 - 11.0\text{ m}$ (lebar 3.0m, kedalaman 2.0m, luas 6.0 m²).
- **Total Panjang Sumbu Y Tengah**: $3.0\text{ m} + 6.0\text{ m} + 2.0\text{ m} = 11.0\text{ m}$ (Presisi 100%).

### Sisi Kanan Ekstensi Mandiri ($X: 6.0 - 9.0\text{ m}$)
- Lahan mandiri 2 lantai (jalur tangga, kamar mandi, dapur, dan kamar tidur atas) dari $Y: 0.0 - 11.0\text{ m}$.

---

## 2. Perubahan Berkas & Logika

### A. `src/utils/architectureData.ts`
1. **Memperbarui `EXISTING_ROOMS`**:
   - `kt2`: `y: 2.5`, `depth: 3.5`, `area: 10.5`
   - `kt1`: `y: 6.0`, `depth: 3.0`, `area: 9.0`
   - `rk`: `y: 3.0`, `depth: 6.0`, `area: 18.0`
   - Teras & Carport Depan, serta Void & Ruang Makan Belakang disesuaikan dengan koordinat di atas.
2. **Memperbarui `GROUND_FLOOR_ALT_A` & `GROUND_FLOOR_ALT_B`**:
   - Memastikan alternatif A dan B mewarisi posisi kamar eksisting yang identik dan terkunci.
3. **Memperbarui Zona Terlarang Dak Atas (`PROHIBITED_UPPER_ZONE` & `DEFAULT_PROHIBITED_ZONE`)**:
   - Menetapkan batas struktur eksisting bertingkat:
     - Sisi kamar ($X: 0 - 3\text{ m}$): $Y: 2.5 - 9.0\text{ m}$
     - Sisi ruang keluarga ($X: 3 - 6\text{ m}$): $Y: 3.0 - 9.0\text{ m}$
4. **Memperbarui Kamar 6 di Lantai 2 (`kt6`)**:
   - Diposisikan di atas carport depan ($X: 0 - 3\text{ m}, Y: 0 - 2.5\text{ m}$) dengan kolom baja/beton mandiri tanpa membebani atap KT 2 eksisting.

### B. `src/utils/houseDesignStore.ts`
1. Memperbarui `ORIGINAL_DESIGN`, `ALTERNATIVE_A_DESIGN`, dan `ALTERNATIVE_SWAPPED_STAIR_BATH`:
   - Menyesuaikan posisi perabotan interior:
     - Kasur, lemari wardrobe CAD, dan meja kerja di KT 2 ($Y: 2.5 - 6.0\text{ m}$).
     - Kasur queen size dan lemari wardrobe CAD di KT 1 ($Y: 6.0 - 9.0\text{ m}$).
     - Sofa sudut L dan credenza TV di Ruang Keluarga ($Y: 3.0 - 9.0\text{ m}$).
     - Meja makan 6 kursi di Ruang Makan ($Y: 9.0 - 11.0\text{ m}$).
     - Kursi santai teras di Teras Depan ($Y: 0.0 - 3.0\text{ m}$).
2. Menyinkronkan pintu dan bukaan jendela pada dinding pemisah yang baru.

### C. Pembersihan Cache Browser (`localStorage`)
- Mengupdate key migrasi `localStorage` agar aplikasi otomatis memuat baseline koordinat yang baru dan terverifikasi tanpa terhalang cache koordinat lama di browser.

---

## 3. Rencana Pengujian & Verifikasi
1. **Verifikasi Kompilasi & Lint**:
   - Menjalankan `compile_applet` dan `lint_applet` untuk memastikan 0 error TypeScript.
2. **Verifikasi Perhitungan Geometri**:
   - Memastikan luas total ruangan eksisting dan luas sisa tanah tetap genap 99 m² ($9\text{ m} \times 11\text{ m}$).
3. **Verifikasi Visual 2D & 3D**:
   - Memastikan rendering CAD denah menampilkan tangga, jendela, pintu geser kaca, kanopi skylight void, dan perabot wardrobe pada posisi koordinat baru secara sempurna.
