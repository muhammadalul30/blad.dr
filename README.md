# Genitourinaria

Catatan berkemih (BAK), hidrasi, dan IPSS, dengan ringkasan yang bisa dicetak
atau disalin untuk dokter. Banyak pengguna, satu jenis akun, tanpa admin.

## Fitur

- **Akun.** Siapa pun bisa mendaftar dan masuk. Semua akun setara: tidak ada
  peran, tidak ada admin, tidak ada halaman yang menampilkan pengguna lain.
  Setiap pengguna hanya bisa membaca dan mengubah datanya sendiri.
- **Catatan BAK.** Waktu, volume, skala urgensi 0–4, bocor, nokturia, warna urin,
  gejala (nyeri, hematuria, pancaran lemah, mengejan, terputus, tidak tuntas).
- **Hidrasi.** Volume dan jenis minuman, tombol cepat, target harian.
- **Dashboard.** Angka hari ini, rata-rata 7/14/30 hari, grafik frekuensi dan
  asupan–keluaran.
- **IPSS.** 7 pertanyaan + kualitas hidup, kategori, subskor penyimpanan dan
  pengosongan, riwayat dan grafik.
- **Ringkasan pemantauan genitourinaria.** Periode bebas, cetak/PDF, salin teks.
- **Ekspor.** JSON seluruh data, CSV per jenis catatan.

## Teknologi

Next.js 16 (App Router, Cache Components) · React 19 · Tailwind CSS 4 ·
Drizzle ORM · libSQL/Turso · jose (sesi JWT di cookie httpOnly) · bcryptjs · Zod.

## Menjalankan di lokal

Butuh Node.js 20.12 atau lebih baru.

```bash
npm install
cp .env.example .env.local   # lalu isi SESSION_SECRET
npm run db:migrate
npm run dev
```

Buka http://localhost:3000 lalu daftar. Database lokal berupa berkas `local.db`.

## Deploy: GitHub + Vercel

Sistem berkas Vercel tidak persisten, jadi database produksi memakai Turso
(libSQL terkelola; paket gratisnya memadai untuk ratusan pengguna).

1. Push repositori ini ke GitHub.
2. Di Vercel: **Add New → Project**, pilih repositorinya.
3. Tambah database: tab **Storage → Create Database → Turso**. Integrasi ini
   mengisi `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` otomatis. (Atau buat
   database sendiri di turso.tech dan isi kedua variabel itu secara manual.)
4. Di **Settings → Environment Variables** tambahkan:
   - `SESSION_SECRET`: string acak minimal 32 karakter.
   - `REGISTRATION_CODE`: opsional. Bila diisi, hanya orang yang tahu kode ini
     yang bisa mendaftar. Bila kosong, pendaftaran terbuka untuk umum.
5. Deploy. Migrasi database berjalan otomatis pada setiap build
   (`scripts/migrate.mjs`).
6. Buka `/register`, buat akun.

Setelah itu setiap push ke branch utama men-deploy ulang.

## Variabel lingkungan

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `SESSION_SECRET` | ya | Kunci penanda tangan sesi, ≥ 32 karakter. |
| `TURSO_DATABASE_URL` | produksi | URL `libsql://…`. |
| `TURSO_AUTH_TOKEN` | produksi | Token database Turso. |
| `DATABASE_URL` | lokal | Default `file:local.db`. |
| `REGISTRATION_CODE` | tidak | Bila diisi, register meminta kode ini. |

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan. |
| `npm run build` | Migrasi lalu build produksi. |
| `npm run lint` / `npm run typecheck` | Pemeriksaan kode. |
| `npm run db:generate` | Buat berkas migrasi setelah mengubah `src/db/schema.ts`. |
| `npm run db:migrate` | Terapkan migrasi. |

## Struktur

```
src/
  app/(auth)/        login, register
  app/(app)/         dashboard, bak, hidrasi, ipss, ringkasan, pengaturan
  app/api/export/    unduhan JSON/CSV
  actions/           Server Actions (validasi Zod, cek sesi di setiap aksi)
  db/                skema Drizzle dan klien libSQL
  lib/dal.ts         Data Access Layer: cek sesi dan saring per pemilik data
  lib/stats.ts       perhitungan statistik harian dan periode
  lib/report.ts      isi ringkasan dokter (HTML dan teks)
  proxy.ts           pengalihan ke /login bila cookie sesi tidak sah
drizzle/             migrasi SQL
```

## Catatan keamanan dan data

- Password di-hash bcrypt (12 putaran). Lima kali gagal login mengunci 15 menit.
- Setiap baris catatan menyimpan `user_id`; semua query, ubah, dan hapus
  menyaring dengan id pengguna dari sesi, bukan dari input klien.
- Ganti password mengeluarkan perangkat lain milik akun itu.
- Tidak ada admin, jadi tidak ada yang bisa mereset password atau menghapus akun
  orang lain dari dalam aplikasi. Itu hanya bisa lewat akses langsung ke database.
- Waktu catatan disimpan sebagai jam lokal pengguna, bukan UTC. Zona waktu
  diatur di Pengaturan.
- Lupa password tidak punya alur pemulihan (tidak ada layanan email). Simpan
  password di pengelola password.
- Aplikasi ini alat pencatat, bukan alat diagnosis.
