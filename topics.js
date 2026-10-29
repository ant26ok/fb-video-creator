module.exports = [
  {
    id: 'db_deadlock_concurrency',
    category: 'DATABASE & CONCURRENCY',
    title: 'Deadlock di Jam Sibuk: Mengapa Tambah RAM Tidak Cukup?',
    color: 'from-amber-500 to-rose-600',
    accentColor: '#f43f5e',
    hook: 'Sistem lancar pas sepi, tapi begitu jam sibuk pagi tiba-tiba freeze total. Padahal CPU baru 20% dan RAM sisa bergiga-giga.',
    keyPoints: [
      { num: '01', title: 'Row-Level Exclusive Lock', desc: 'Dua transaksi berebut urutan update baris data yang saling menyilang.' },
      { num: '02', title: 'Isolation Level Terlalu Ketat', desc: 'Serializable membunuh concurrency; turunkan ke Read Committed dengan audit tepat.' },
      { num: '03', title: 'Idempotency & Optimistic Locking', desc: 'Pakai version column (OCC) daripada pesimistik lock berlarut-larut.' }
    ],
    takeaway: 'Masalah konkurensi tidak bisa diselesaikan dengan upgrade hardware, tapi perbaikan disiplin urutan akses data.',
    postText: `Sistem lancar jaya pas uji coba, tapi begitu jam sibuk pagi langsung freeze total. 😅

Komplain masuk bertubi-tubi: kasir tidak bisa bayar, antrean farmasi tertahan, layar muter-muter tanpa pesan error.

Refleks pertama tim infrastruktur biasanya panik: "Tambah CPU! Tambah RAM server!"
Begitu dicek di server monitoring, CPU baru kepakai 22%, RAM masih sisa belasan giga. 

Lalu apa biang keroknya? 
Jawabannya: DATABASE DEADLOCK.

Dua transaksi berbeda berusaha memperbarui dua tabel yang sama, tapi dengan urutan terbalik:
- Transaksi A: Kunci Tabel Pasien, lalu mau kunci Tabel Antrean.
- Transaksi B: Kunci Tabel Antrean, lalu mau kunci Tabel Pasien.
Hasilnya? Saling tunggu sampai batas timeout database tercapai (freeze berantai).

Tiga solusi arsitektur yang selalu saya terapkan:
1. Standardisasi Urutan Kunci (Strict Access Order): Seluruh modul backend wajib mengakses tabel dengan urutan hierarki yang sama.
2. Optimistic Concurrency Control (OCC): Gunakan kolom 'version' daripada SELECT FOR UPDATE berkepanjangan.
3. Potong Durasi Transaksi: Jangan pernah selipkan panggilan external HTTP API di dalam blok transaksi database database (BEGIN ... COMMIT).

Hardware mahal tidak bisa mengobati logika konkurensi yang berantakan.

Di sistem tempat teman-teman bekerja, momen apa yang paling sering memicu drama lock/deadlock di jam sibuk?

#SoftwareArchitecture #DatabaseOptimization #SystemAnalyst #FullStackDev #BackendEngineering #PostgreSQL #SQLServer`
  },
  {
    id: 'resilient_outbox_pattern',
    category: 'SYSTEM INTEGRATION & RESILIENCE',
    title: 'Transactional Outbox: Rahasia Integrasi API Tanpa Kehilangan Data',
    color: 'from-cyan-500 to-blue-600',
    accentColor: '#06b6d4',
    hook: 'Jangan pernah panggil HTTP API eksternal di tengah transaksi database lokal. Satu timeout, data lokal batal tapi pesan pihak ketiga sudah terkirim.',
    keyPoints: [
      { num: '01', title: 'Local Outbox Table', desc: 'Simpan payload event ke tabel database lokal dalam satu transaksi ACID.' },
      { num: '02', title: 'Asynchronous Dispatcher', desc: 'Worker latar belakang membaca outbox dan mengirim ke API tujuan.' },
      { num: '03', title: 'Guaranteed At-Least-Once', desc: 'Data aman dari jaringan putus, server mati mendadak, atau limit API.' }
    ],
    takeaway: 'Arsitektur resilient memisahkan komitmen data lokal dari ketidakpastian jaringan pihak ketiga.',
    postText: `Pernah ngalamin kasus ini?
Kasir klik simpan pembayaran: transaksi lokal database sukses, tapi pas kirim notifikasi WhatsApp atau kirim data ke server regulator, koneksi internet mendadak putus (504 Gateway Timeout).

User panik klik tombol berulang kali. Akhirnya: saldo kepotong dua kali, data ganda, dan rekonsiliasi malam harinya berantakan. 🤦‍♂️

Pelajaran arsitektur paling mahal yang saya pelajari:
JANGAN PERNAH menyatukan komitmen database lokal dengan panggilan network API pihak ketiga. Jaringan internet itu tidak bisa dipercaya (unreliable by nature).

Solusi standarnya adalah: TRANSACTIONAL OUTBOX PATTERN.

Cara kerjanya sederhana tapi ampuh:
1. Buat tabel 'outbox_events' di database yang sama dengan tabel operasional.
2. Saat simpan data billing, simpan juga event pengiriman ke tabel outbox dalam SATU transaksi atomik lokal.
3. Background worker membaca antrean outbox secara berkala dan mengirimkan request ke API luar.
4. Jika API luar down 2 jam sekalipun, worker akan otomatis retry dengan exponential backoff tanpa membuat kasir freeze.

Data lokal tetap aman, antarmuka pengguna cepat, dan integrasi luar dijamin terkirim (at-least-once delivery).

Bagaimana strategi integrasi API pihak ketiga di aplikasi yang sedang teman-teman bangun saat ini?

#SystemArchitecture #BackendDevelopment #Microservices #SoftwareDesign #IntegrationPatterns #FullstackDeveloper #HealthTech`
  },
  {
    id: 'cache_aside_redis',
    category: 'PERFORMANCE & SCALABILITY',
    title: 'Cache-Aside Pattern: Kapan Sebaiknya Pakai Redis?',
    color: 'from-emerald-500 to-teal-600',
    accentColor: '#10b981',
    hook: 'Banyak yang asal pasang Redis di semua query database. Hasilnya bukan tambah cepat, tapi data basi dan memori server bengkak.',
    keyPoints: [
      { num: '01', title: 'Read-Heavy vs Write-Heavy', desc: 'Cache hanya efektif untuk data frekuensi baca tinggi dan jarang berubah.' },
      { num: '02', title: 'Cache Invalidation Strategy', desc: 'Gunakan TTL dinamis dan purge key terarah saat ada event update.' },
      { num: '03', title: 'Cegah Cache Stampede', desc: 'Terapkan mutex lock atau probabilistic early expiration saat key kedaluwarsa.' }
    ],
    takeaway: 'Dua hal paling sulit di ilmu komputer: penamaan variabel dan cache invalidation.',
    postText: `Ada mitos populer di kalangan developer: "Kalau query lambat, tinggal bungkus pakai Redis!" 😅

Kenyataan di lapangan:
Redis dipasang di semua tabel. Dua minggu kemudian, komplain baru muncul: "Kenapa harga tindakan di struk beda sama di kasir?", "Kenapa status antrean di display dokter tidak berubah?"

Cache bukan obat ajaib untuk query yang tidak punya index.

Aturan praktis saya sebelum pasang Cache-Aside:
1. Pahami Rasio Read vs Write: Kalau datanya diupdate tiap detik, simpan di cache cuma buang-buang siklus CPU dan bandwidth internal.
2. Kuasai Strategi Invalidasi: Siapa yang bertugas menghapus cache saat data master diedit? Selalu pasang TTL (Time-To-Live) realistis sebagai benteng pengaman terakhir.
3. Antisipasi Cache Stampede: Ketika 500 user mengakses halaman yang sama tepat saat cache kedaluwarsa, seluruh request akan menghantam database bersamaan. Pakai locking atau early refresh.

Sistem yang tangguh bukan yang paling banyak lapisannya, tapi yang setiap komponennya punya alasan jelas kenapa harus ada di sana.

Pengalaman teman-teman saat implementasi Redis: apa drama cache invalidation paling berkesan yang pernah dialami?

#SoftwareArchitecture #Redis #PerformanceOptimization #SystemAnalyst #Backend #Database #HighThroughput`
  },
  {
    id: 'zero_downtime_deployment',
    category: 'DEVOPS & SYSTEM RELIABILITY',
    title: 'Blue-Green & Canary Deployment: Rilis Update Tanpa Jam Istirahat',
    color: 'from-violet-500 to-indigo-600',
    accentColor: '#8b5cf6',
    hook: 'Di faskes atau sistem 24/7, tidak ada istilah "maintenance jam 2 pagi". IGD dan rawat inap beroperasi tanpa henti.',
    keyPoints: [
      { num: '01', title: 'Backward Compatible Schema', desc: 'Jangan pernah drop kolom database di rilis yang sama dengan aplikasi baru.' },
      { num: '02', title: 'Reverse Proxy Traffic Switch', desc: 'Caddy / Nginx mengalihkan traffic secara instan setelah health check lulus.' },
      { num: '03', title: 'Instant Rollback Capability', desc: 'Jika ada error tak terduga, rollback cukup dalam 1 detik tanpa redeploy.' }
    ],
    takeaway: 'Rilis fitur baru harus jadi rutinitas santai, bukan ritual senam jantung di tengah malam.',
    postText: `Dulu waktu awal mengelola sistem faskes, rilis versi baru itu horror.
Harus pasang pengumuman: "Sistem offline sementara jam 23.00 - 02.00 untuk pemeliharaan."

Tapi di rumah sakit tempat saya bekerja, jam 12 malam itu pasien IGD tetap masuk, perawat tetap input terapi infus, dan farmasi tetap racik obat darurat. Istilah "downtime terencana" itu tetap mengorbankan kenyamanan pelayanan.

Solusinya: beralih total ke ZERO DOWNTIME DEPLOYMENT (Blue-Green / Rolling Update).

Kuncinya ada di 3 pilar:
1. Database Schema Expand-Contract: Rilis skrip migrasi database yang backward-compatible. Kode lama dan kode baru harus bisa membaca database yang sama secara bersamaan.
2. Health Check Valid Sebelum Switch: Reverse proxy (seperti Caddy/Nginx) hanya akan mengarahkan traffic ke container baru setelah endpoint /health lulus uji koneksi DB.
3. Rollback Satu Detik: Versi lama tetap dibiarkan hidup 15 menit. Jika ada bug fatal terdeteksi, traffic dialihkan kembali dalam hitungan detik.

Ketika arsitektur deployment sudah benar, rilis update aplikasi di jam kerja siang bolong pun bisa dilakukan dengan tenang tanpa perawat sadar sistem baru saja diperbarui.

Bagaimana alur deployment di tim teman-teman sekarang? Masih begadang malam atau sudah otomatis?

#DevOps #ZeroDowntime #CI_CD #SystemArchitecture #Docker #ReverseProxy #HealthTech #SoftwareEngineering`
  },
  {
    id: 'api_rate_limiting_circuit_breaker',
    category: 'API RESILIENCE & SECURITY',
    title: 'Circuit Breaker: Menyelamatkan Server Saat Layanan Mitra Down',
    color: 'from-blue-500 to-cyan-600',
    accentColor: '#0ea5e9',
    hook: 'Saat satu API pihak ketiga lambat, ratusan thread server kita ikut tersangkut sampai akhirnya seluruh sistem lumpuh total.',
    keyPoints: [
      { num: '01', title: 'Cascading Failure Protection', desc: 'Cegah kegagalan satu modul merambat dan menenggelamkan seluruh backend.' },
      { num: '02', title: 'Tiga Status Circuit Breaker', desc: 'Closed (normal), Open (putus seketika), dan Half-Open (uji berkala).' },
      { num: '03', title: 'Graceful Fallback Response', desc: 'Berikan respons cadangan atau antrean lokal daripada loading tanpa batas.' }
    ],
    takeaway: 'Sistem yang cerdas tahu kapan harus berhenti mencoba sebelum merusak dirinya sendiri.',
    postText: `Satu skenario yang paling sering bikin server crash bukan karena serangan hacker, melainkan CASCADING FAILURE.

Contoh nyata:
Aplikasi kasir memanggil API verifikasi asuransi pihak ketiga. Biasanya API itu merespons dalam 200ms.
Tiba-tiba server pihak ketiga mengalami gangguan dan response time melonjak jadi 30 detik.

Apa yang terjadi di server kita?
Semua worker thread tertahan menunggu response. Koneksi database ikut menggantung. Dalam 3 menit, memory habis, request queue penuh, dan seluruh aplikasi kasir lokal ikut mati.

Pola penyelamatnya adalah: CIRCUIT BREAKER PATTERN.

Sama seperti sekring listrik di rumah yang langsung jeglek saat ada korsleting:
1. Status CLOSED: Request diteruskan secara normal.
2. Status OPEN: Jika dalam 1 menit ada 10 kali kegagalan/timeout, sekring otomatis memutus sirkuit. Request berikutnya langsung ditolak seketika (fail fast) tanpa menunggu timeout 30 detik.
3. Status HALF-OPEN: Secara berkala, satu request uji coba dilewatkan. Jika sukses, sekring ditutup kembali.

Dengan Circuit Breaker, kegagalan layanan luar tidak akan pernah bisa menumbangkan sistem inti di tempat kita bekerja.

Apakah di backend teman-teman sudah terpasang circuit breaker dan timeout yang ketat?

#BackendEngineering #SystemResilience #Microservices #CircuitBreaker #SoftwareArchitecture #API #TechLeadership`
  }
];
