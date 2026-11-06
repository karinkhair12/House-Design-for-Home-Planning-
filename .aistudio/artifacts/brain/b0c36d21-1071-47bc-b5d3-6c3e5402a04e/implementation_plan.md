# Penghapusan Jendela Kamar Sisi Kiri (KT 1 & KT 2) & Daftar Bukaan di Panel Ruang

Menghapus seluruh jendela bawaan pada kamar tidur eksisting di sisi kiri (**KT 2 Depan** dan **KT 1 Utama**) sehingga seluruh dindingnya menjadi dinding masif penuh sesuai kondisi riil, serta menambahkan daftar interaktif jendela dan pintu yang menempel pada ruangan di dalam Panel Inspektur Ruang Editor 2D agar setiap bukaan langsung terlihat dan mudah dikelola.

## User Review & Critical Decisions

> [!IMPORTANT]
> Berikut adalah keputusan yang telah dikonfirmasi dari jawaban Anda dan siap diterapkan setelah rencana ini disetujui:

- **Keputusan Terkonfirmasi 1 (Penghapusan Jendela KT 1 & KT 2)**: Seluruh jendela bawaan pada **KT 2 Depan** (`Jendela Kamar Tidur 2 Depan`) dan **KT 1 Utama** (`Jendela Kamar Utama Belakang`) dihapus sepenuhnya dari data rancangan awal, varian alternatif, serta migrasi otomatis penyimpanan browser (`localStorage`), sehingga visualisasi 2D maupun 3D menampilkan dinding kamar sisi kiri sebagai dinding bata masif utuh tanpa bukaan kaca.
- **Keputusan Terkonfirmasi 2 (Daftar Jendela & Pintu di Panel Inspektur Ruang)**: Saat Anda mengeklik ruangan mana pun di kanvas Editor 2D, panel inspektur di sebelah kanan akan menampilkan seksi khusus **"Daftar Jendela & Pintu di Ruang Ini"** yang mencantumkan setiap jendela/ventilasi dan pintu yang menempel pada ruangan tersebut, lengkap dengan info sisi dinding (`Utara/Depan`, `Selatan/Belakang`, `Barat/Kiri`, `Timur/Kanan`), dimensi, tombol **Edit Detail**, dan tombol **Hapus (🗑️)** sekali klik.

---

## 1. Overview & Core Concept

- **Apa yang Dilakukan Perubahan Ini**:
  1. **Koreksi Bukaan Kamar Sisi Kiri (KT 1 & KT 2)**: Sebelumnya terdapat objek jendela bawaan tersembunyi (`w-kt2-front` di dinding utara KT 2 dan `w-kt1-rear` di dinding selatan KT 1) yang tetap memotong dinding pada mode 3D meskipun status dinding kamar diatur `Masif` dan `Dinding Kaca Geser` tidak dicentang. Kini kedua jendela tersebut dihapus secara permanen dari definisi bawaan dan dibersihkan otomatis dari cache browser yang tersimpan.
  2. **Transparansi & Kendali Bukaan di Panel Ruang**: Sebelumnya, ketika pengguna mengeklik sebuah ruangan di Editor 2D, panel kanan hanya menampilkan tombol tambah (`+ Pasang Pintu`, `+ Jendela Kaca`, `+ Roster`, `+ Bouvenlight`) tanpa menampilkan daftar jendela atau pintu yang sedang terpasang di ruangan tersebut. Kini daftar seluruh jendela dan pintu milik ruangan akan langsung tampil di dalam panel ruang yang dipilih.
- **Nilai Utama bagi Pengguna**: Tidak ada lagi jendela "siluman" yang muncul di 3D tanpa terlihat jelas di pengaturan ruang, serta memudahkan pengecekan dan penghapusan pintu/jendela langsung dari ruangan yang sedang diklik.

---

## 2. User Experience & Visual Design

- **Alur Penggunaan di Editor 2D & 3D**:
  1. Saat membuka tab **Editor Denah 2D** maupun **3D Aksonometri**, kamar tidur sisi kiri (**KT 2** dan **KT 1**) langsung tampil dengan dinding bata masif penuh tanpa potongan kaca jendela.
  2. Ketika pengguna mengeklik sebuah ruangan di kanvas 2D, pada Panel Inspektur Ruang di sebelah kanan (tepat di atas tombol `+ Pasang Pintu` / `+ Jendela Kaca`) akan tampil daftar ringkas:
     - **Jendela & Ventilasi Terpasang**: Menampilkan nama/tipe jendela (`Jendela Kaca`, `Roster Tropis`, atau `Bouvenlight`), posisi dinding (`Depan`, `Belakang`, `Kiri`, `Kanan`), ukuran (`Lebar × Tinggi`), tombol **Pilih/Edit** untuk mengatur detail ukuran jendela, serta tombol **Hapus** merah untuk langsung menghapus jendela tersebut.
     - **Pintu Terpasang**: Menampilkan nama pintu, sisi dinding, lebar bukaan, tombol **Pilih/Edit**, dan tombol **Hapus**.
     - Jika ruangan tidak memiliki jendela sama sekali (seperti KT 1 dan KT 2), akan tampil keterangan jelas: *"Tidak ada jendela/ventilasi pada ruangan ini (Dinding Masif)"*.
- **Identitas Visual & Tema**:
  - Mengikuti estetika teknis studio arsitektur (`Plus Jakarta Sans` untuk label UI dan `JetBrains Mono` dengan `tabular-nums` untuk angka koordinat serta ukuran meter).
  - Kontainer daftar bukaan menggunakan latar netral bersih (`slate-50` dengan garis batas halus `slate-200`), kontras warna terukur untuk membedakan pintu (`teal`) dan jendela (`sky`), serta tombol aksi satu baris (`whitespace-nowrap shrink-0`).

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Pembersihan Otomatis Cache Desain Tersimpan (`localStorage`)**
  - *Pendekatan yang Dipilih*: Selain menghapus definisi jendela `w-kt2-front` dan `w-kt1-rear` dari katalog desain standar, sistem pemuat data awal akan otomatis memfilter keluar ID `w-kt2-front` dan `w-kt1-rear` dari desain kerja yang sudah tersimpan di browser pengguna.
  - *Alasan*: Memastikan pengguna langsung melihat dinding KT 1 dan KT 2 bebas jendela begitu halaman dimuat tanpa perlu menekan tombol reset desain atau kehilangan kustomisasi ruangan lainnya yang sudah dibuat.
- **Keputusan 2: Integrasi Daftar Bukaan Langsung di Panel Inspektur Ruang**
  - *Pendekatan yang Dipilih*: Menyediakan kartu daftar jendela dan pintu yang terhubung dengan ruangan aktif (`roomId === selectedRoom.id`) langsung di dalam tab Inspektur Ruang, dilengkapi aksi hapus instan dan aksi inspeksi detail.
  - *Alasan*: Di kanvas 2D, garis simbol jendela berukuran tipis sehingga terkadang sulit diklik satu per satu. Dengan menampilkannya di panel ruang, pengguna memiliki visibilitas 100% atas semua bukaan yang memotong dinding ruangan di 3D.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Diagram Arsitektur & Alur Sinkronisasi Bukaan Ruang**:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     STATE RANCANGAN RUMAH (HouseDesignState)             │
│  • groundFloorRooms / secondFloorRooms (Geometri & Dinding Masif/Bukaan) │
│  • windows: WindowData[] (Tanpa w-kt2-front & w-kt1-rear pada KT1 & KT2) │
│  • doors: DoorData[]                                                     │
└───────────────────┬──────────────────────────────────┬───────────────────┘
                    │                                  │
                    ▼                                  ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────┐
│       EDITOR DENAH 2D & INSPEKTUR    │  │     VIEWPORT 3D AKSONOMETRI    │
│  ┌────────────────────────────────┐  │  │  • Membaca daftar windows[]    │
│  │ Panel Inspektur Ruang Aktif    │  │  │  • KT 1 & KT 2 tidak memiliki  │
│  │ • Filter windows by roomId     │  │  │    cutout jendela -> dirender  │
│  │ • Filter doors by roomId       │  │  │    sebagai dinding bata masif  │
│  │ • Tombol Edit & Hapus 1-Klik   │  │  │    utuh tanpa kaca             │
│  └────────────────────────────────┘  │  └────────────────────────────────┘
└──────────────────────────────────────┘
```

- **Pemetaan Komponen Interaktif & State**:
  - **Katalog Jendela Bawaan & Migrasi State**: Menghapus entri jendela bawaan untuk `kt2` dan `kt1`, serta memperbarui deskripsi tekstual ruangan `kt1` dan `kt2` agar selaras bahwa kedua kamar eksisting di sisi kiri menggunakan dinding masif tanpa jendela luar.
  - **Daftar Bukaan Ruang di Panel Inspektur**: Memfilter `currentWindows` dan `currentDesign.doors` berdasarkan `selectedRoom.id`, merender daftar item bukaan dengan handler `handleDeleteWindow(win.id)` dan `handleDeleteDoor(door.id)` yang langsung memperbarui state desain beserta riwayat `Undo/Redo`.
