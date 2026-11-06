/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GitCompare, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Layers,
  Droplets,
  Wind
} from 'lucide-react';

export const DesignAlternativesView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'staircase' | 'gf-layout' | '2f-layout' | 'plumbing'>('staircase');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Introduction */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-xs tracking-wider uppercase mb-1">
              <GitCompare className="w-4 h-4" />
              <span>Section 10.B • Komparasi Desain Alternatif &amp; Justifikasi Solusi Terbaik</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Analisis Perbandingan Alternatif Desain
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-3xl leading-relaxed">
              Membandingkan alternatif tata ruang lantai 1, lantai 2, konfigurasi tangga (Opsi A vs Opsi B), 
              dan efisiensi pemipaan kamar mandi berdasarkan keamanan struktural, biaya, dan kenyamanan iklim tropis.
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold shrink-0">
            <button
              onClick={() => setActiveCategory('staircase')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'staircase' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tangga (Opsi A vs B)
            </button>
            <button
              onClick={() => setActiveCategory('gf-layout')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'gf-layout' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Denah Lantai 1
            </button>
            <button
              onClick={() => setActiveCategory('2f-layout')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === '2f-layout' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Denah Lantai 2
            </button>
            <button
              onClick={() => setActiveCategory('plumbing')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeCategory === 'plumbing' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shaft Plumbing KM
            </button>
          </div>
        </div>

        {/* ==============================================================
            CATEGORY 1: STAIRCASE OPTION A vs OPTION B (SECTION 5 & 10.B)
            ============================================================== */}
        {activeCategory === 'staircase' && (
          <div className="mt-8 space-y-6">
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-indigo-950">Rekomendasi Arsitek: OPSI A (Tangga Mandiri di Ekstensi Baru)</h3>
                  <p className="text-xs text-indigo-700">Skor Kelayakan: 9.6 / 10 • Nol risiko bocor pada atap lama &amp; struktur 100% independen.</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                Terpilih
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Option A Card */}
              <div className="bg-white rounded-xl border-2 border-emerald-500 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      Opsi A (Direkomendasikan)
                    </span>
                    <span className="text-xs font-semibold text-emerald-600">Keamanan Tertinggi</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mt-3">
                    Tangga Berada Sepenuhnya di Zona Ekstensi Baru
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Tangga beton bertulang dibangun di lajur kanan (X: 7.5–9.0m, Y: 3.7–6.5m) di atas pondasi cakar ayam baru.
                    Bordes menghubungkan langsung ke koridor lantai 2 dan balkon merokok tanpa menyentuh atap eksisting.
                  </p>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Ketahanan Bocor:</strong> Tidak ada pemotongan atap eksisting, bebas resiko rembes saat hujan deras tropis.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Penyaluran Beban:</strong> 100% beban gravitasi disalurkan langsung ke pondasi cakar ayam baru.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Privasi Sirkulasi:</strong> Tamu perokok dapat naik langsung dari Ruang Tamu tanpa melintasi ruang tidur atau dapur.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Pemanfaatan Ruang:</strong> Bawah tangga dapat difungsikan optimal sebagai gudang koper/alat kebersihan.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estimasi Biaya: <strong className="text-slate-900">Rp 8,5jt - 12,5jt</strong></span>
                  <span className="text-emerald-700 font-bold">Resiko Renovasi: SANGAT RENDAH</span>
                </div>
              </div>

              {/* Option B Card */}
              <div className="bg-slate-50 rounded-xl border border-slate-300 p-6 flex flex-col justify-between opacity-90">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                      Opsi B (Ditolak)
                    </span>
                    <span className="text-xs font-semibold text-red-600">Resiko Struktural Tinggi</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mt-3">
                    Tangga Menembus Bukaan Atap Bangunan Lama
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Tangga dimulai dari dalam Ruang Keluarga (RK) eksisting dan memotong kuda-kuda serta penutup atap eksisting
                    untuk mencapai bordes di lantai 2.
                  </p>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Resiko Kebocoran:</strong> Flashing pada sambungan atap lama dan dak tangga rawan bocor saat musim hujan tropis.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Kompromi Dinding Lama:</strong> Dinding bata merah lama tidak mampu memikul beban reaksi tangga tanpa perkuatan baja mahal.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Gangguan Penghuni:</strong> Puing bongkaran dan debu langsung jatuh ke Ruang Keluarga saat keluarga tinggal di dalam rumah.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700"><strong>Pelanggaran Privasi:</strong> Tamu perokok harus masuk ke dalam Ruang Keluarga untuk menuju lantai atas.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Estimasi Biaya: <strong className="text-slate-900">Rp 15jt - 22jt (Bongkar + Waterproofing)</strong></span>
                  <span className="text-red-700 font-bold">Resiko Renovasi: SANGAT TINGGI</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            CATEGORY 2: GROUND FLOOR LAYOUT COMPARISON (ALTERNATIF B vs ALTERNATIF A)
            ============================================================== */}
        {activeCategory === 'gf-layout' && (
          <div className="mt-8 space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Rekomendasi Arsitek: ALTERNATIF B (Dapur Idaman Ibu &amp; Ruang Makan Kaca Terbuka ke Taman)</h3>
                  <p className="text-xs text-amber-800">Menjawab keluhan pencahayaan taman belakang, memuliakan preferensi Ibu, dan menjamin 100% privasi akustik saat ada tamu.</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg uppercase tracking-wider">
                Direkomendasikan
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alternatif B */}
              <div className="bg-white rounded-xl border-2 border-emerald-500 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      Alternatif B (Pilihan Terbaik &amp; Idaman Ibu)
                    </span>
                    <span className="text-xs font-bold text-emerald-600">Skor: 9.7 / 10</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">Dapur Idaman Ibu + KM 1.5m (Kanan-Kiri) × 1.25m (Atas-Bawah) + Area Servis Bawah KM</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    KM keluarga presisi: lebar kanan-ke-kiri 1.5m, kedalaman atas-ke-bawah 1.25m dengan akses pintu dari arah kiri. Di bagian bawah KM: mesin cuci di kiri bawah (depan menghadap ke kiri), pintu belakang buka mengarah ke luar, dan sink cuci mepet sudut kanan bawah rumah.
                  </p>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Taman Belakang Berfungsi Maksimal:</strong> Di belakang RK dijadikan Ruang Makan Kaca luas (bukan kamar mandi!), sehingga cahaya matahari dan udara segar taman leluasa membanjiri Ruang Keluarga eksisting.</span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Ibu Sangat Suka:</strong> Dapur dan area servis terpisah rapi dengan kompor aman, lemari gantung bumbu/peralatan, sink cuci di sudut kanan bawah, dan pintu belakang langsung ke area luar.</span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Sirkulasi Bebas Tabrakan (Zero-Conflict Ergonomics):</strong> Orang yang memasukkan baju ke mesin cuci berdiri menghadap ke kanan di koridor servis, menyisakan koridor akses selebar 85–100 cm menuju pintu belakang tanpa terhalang sama sekali!</span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Pintu Belakang Buka ke Luar:</strong> Daun pintu membuka mengarah ke luar sehingga nol centimeter ruang dalam yang termakan ayunan pintu.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Kalkulasi Sirkulasi: <strong className="text-emerald-700 font-bold">Lolos Uji Ergonomi (Clearance &gt; 85cm)</strong></span>
                  <span className="text-emerald-700 font-bold">Kenyamanan Huni: SANGAT TINGGI</span>
                </div>
              </div>

              {/* Alternatif A */}
              <div className="bg-slate-50 rounded-xl border border-slate-300 p-6 flex flex-col justify-between opacity-95">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                      Alternatif A (Sentralisasi Plumbing)
                    </span>
                    <span className="text-xs font-bold text-slate-500">Skor: 6.8 / 10</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-2">KM Tamu Bawah Tangga &amp; KM Keluarga Bersebelahan</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    KM tamu di bawah tangga diakses dari ruang tamu, KM keluarga di sampingnya diakses dari ruang keluarga. Tangga dan bordes lantai 2 digeser ke atas kamar mandi, KM lantai 2 disejajarkan langsung di atasnya.
                  </p>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Efisiensi Pipa Vertikal:</strong> Jalur pipa air kotor dan bersih tegak lurus lurus ke bawah, jika KM 2F rembes mengenai KM bawah.</span>
                    </div>
                    <div className="flex items-start gap-2 text-red-600">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Ibu Pasti Tidak Suka:</strong> Sangat tidak nyaman jika ada tamu duduk di ruang tamu saat penghuni sedang mandi atau buang air besar (suara air/flushing terdengar jelas).</span>
                    </div>
                    <div className="flex items-start gap-2 text-red-600">
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Nol Ventilasi Luar:</strong> KM keluarga terjepit di tengah bangunan tanpa dinding luar, isolasi bau buruk dan hanya mengandalkan exhaust mekanis.</span>
                    </div>
                    <div className="flex items-start gap-2 text-amber-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span><strong>Tinggi Bebas Tangga Kritis:</strong> Menaruh KM di bawah tangga membutuhkan clearance head minimal 2.1m yang mempersempit ruang gerak.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Dapur: <strong className="text-slate-700">Modul 3x2.35m di Belakang Kanan</strong></span>
                  <span className="text-amber-700 font-bold">Privasi Akustik: RENDAH</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            CATEGORY 3: SECOND FLOOR LAYOUT COMPARISON
            ============================================================== */}
        {activeCategory === '2f-layout' && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 2F Alt 1 */}
              <div className="bg-white rounded-xl border-2 border-emerald-500 p-6 shadow-sm">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  Alternatif 1 (Terpilih)
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">Balkon Merokok Menghadap Depan (Sisi Kanan) + 3 KT</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Balkon di lantai 2 ditaruh di depan kanan (X: 6-9m, Y: 0-2m), jauh dari jendela KT 1 di kiri bawah.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Jarak asap ke jendela KT 1 lebih dari 6.0 meter
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Semua 3 kamar tidur atas (KT4, KT5, KT6) luasnya &gt;= 9.0 m²
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Akses langsung ke KM 2F tanpa lewat kamar anak
                  </div>
                </div>
              </div>

              {/* 2F Alt 2 */}
              <div className="bg-slate-50 rounded-xl border border-slate-300 p-6 opacity-90">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                  Alternatif 2 (Komparasi)
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">Balkon di Belakang Menghadap Taman</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Balkon merokok ditaruh di sisi belakang atas dekat KT5.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="w-4 h-4" /> Tamu harus berjalan sepanjang lorong 2F melewati pintu kamar anak
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" /> Asap rokok terperangkap di void taman belakang dan masuk ke KT 2
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" /> Mengurangi privasi anak-anak perempuan di kamar tidur belakang
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================
            CATEGORY 4: PLUMBING SHAFT EFFICIENCY
            ============================================================== */}
        {activeCategory === 'plumbing' && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border-2 border-emerald-500 p-6 shadow-sm">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                  Shaft Plumbing Vertikal Terintegrasi (Terpilih)
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">Pipa KM 2F Tegak Lurus Menuju Shaft Servis Samping</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Pipa air buangan dan kotoran (PVC AW 3" &amp; 4") turun langsung dalam shaft dinding beton menuju saluran pembuangan utama.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Kemiringan gravitasi optimal (&gt; 2%), bebas resiko mampet
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Pipa tidak menggantung di atas plafon kamar tidur siapapun
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Pintu inspeksi (clean-out) mudah diakses dari koridor servis
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl border border-slate-300 p-6 opacity-90">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
                  Pipa Horizontal Jarak Jauh (Dihindari)
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-2">KM 2F Ditaruh Terpisah Jauh dari Jalur Pembuangan</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Menuntut pipa horizontal melintas di atas plafon ruang keluarga atau kamar lantai 1.
                </p>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" /> Suara gemericik air buangan toilet terdengar di ruang keluarga
                  </div>
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" /> Resiko bocor plafon mengenai perabot dan instalasi listrik
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Criteria Decision Matrix Table */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            Matriks Pembobotan Keputusan Desain (Weighted Decision Matrix)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Kriteria Evaluasi</th>
                  <th className="px-4 py-2.5">Bobot</th>
                  <th className="px-4 py-2.5 text-center text-emerald-700">Desain Terpilih (Rekomendasi)</th>
                  <th className="px-4 py-2.5 text-center text-slate-500">Alternatif B</th>
                  <th className="px-4 py-2.5">Alasan Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Keamanan &amp; Integritas Struktur</td>
                  <td className="px-4 py-3 font-mono text-slate-600">30%</td>
                  <td className="px-4 py-3 text-center text-emerald-700 font-bold bg-emerald-50/50">9.8 / 10</td>
                  <td className="px-4 py-3 text-center text-red-600 font-bold">5.2 / 10</td>
                  <td className="px-4 py-3 text-slate-600">Nol beban di atap lama; pondasi cakar ayam mandiri 8 titik.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Efisiensi Biaya &amp; Minim Rework</td>
                  <td className="px-4 py-3 font-mono text-slate-600">20%</td>
                  <td className="px-4 py-3 text-center text-emerald-700 font-bold bg-emerald-50/50">9.2 / 10</td>
                  <td className="px-4 py-3 text-center text-slate-600 font-bold">6.0 / 10</td>
                  <td className="px-4 py-3 text-slate-600">Tanpa pembongkaran atap lama yang rawan bocor dan mahal.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Pemisahan Privasi Tamu vs Keluarga</td>
                  <td className="px-4 py-3 font-mono text-slate-600">20%</td>
                  <td className="px-4 py-3 text-center text-emerald-700 font-bold bg-emerald-50/50">9.5 / 10</td>
                  <td className="px-4 py-3 text-center text-slate-600 font-bold">6.5 / 10</td>
                  <td className="px-4 py-3 text-slate-600">Tamu &amp; perokok langsung ke balkon tanpa masuk ruang privat.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Bebas Asap Rokok di Kamar Tidur</td>
                  <td className="px-4 py-3 font-mono text-slate-600">15%</td>
                  <td className="px-4 py-3 text-center text-emerald-700 font-bold bg-emerald-50/50">9.7 / 10</td>
                  <td className="px-4 py-3 text-center text-red-600 font-bold">4.8 / 10</td>
                  <td className="px-4 py-3 text-slate-600">Balkon depan kanan terisolasi &gt; 6m dari jendela KT 1.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-900">Kelayakan Huni Selama Renovasi</td>
                  <td className="px-4 py-3 font-mono text-slate-600">15%</td>
                  <td className="px-4 py-3 text-center text-emerald-700 font-bold bg-emerald-50/50">9.4 / 10</td>
                  <td className="px-4 py-3 text-center text-slate-600 font-bold">4.5 / 10</td>
                  <td className="px-4 py-3 text-slate-600">Keluarga dapat tetap tinggal di KT 1 &amp; KT 2 dengan sekat debu.</td>
                </tr>
                <tr className="bg-indigo-50/60 font-bold">
                  <td className="px-4 py-3 text-indigo-950">SKOR KESELURUHAN (TERBOBOT)</td>
                  <td className="px-4 py-3 font-mono text-indigo-900">100%</td>
                  <td className="px-4 py-3 text-center text-emerald-700 text-sm">9.54 / 10</td>
                  <td className="px-4 py-3 text-center text-red-700 text-sm">5.48 / 10</td>
                  <td className="px-4 py-3 text-indigo-900">Desain Terpilih Sangat Unggul di Seluruh Parameter</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
