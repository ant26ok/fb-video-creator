# Facebook IT Video & Content Generator

Generator otomatis konten Facebook siap posting seputar arsitektur teknologi IT, database, sistem analisis, dan rekayasa perangkat lunak lengkap dengan render video animasi MP4 (1080x1080 30 FPS).

---

## 1. Konsep & Alur Kerja
Sesuai arahan, sistem **tidak memposting otomatis ke Facebook**.  
Sistem bertugas memproduksi draft materi dan mengirimkannya langsung ke Telegram pengguna pada jadwal yang ditentukan:
1. **Jadwal Pengiriman (WIB):** Jam 10:00, 13:00, 15:00, 17:00, dan 20:00 WIB via cron (`Asia/Jakarta`).
2. **Output per Jadwal:**
   - **Video Animasi MP4:** Resolusi 1080x1080 (Square), 30 FPS, H.264 dengan visual hook, diagram pilar solusi, dan takeaway.
   - **Teks Narasi Facebook:** Format storytelling profesional, hook masalah nyata, pemecahan masalah teknis, pertanyaan diskusi, dan hashtag relevan.
3. **Eksekusi Pengguna:** Pengguna cukup menyimpan video ke galeri HP/PC, menyalin teks draft dengan sekali ketuk di Telegram, lalu memposting secara mandiri ke feed Facebook.

---

## 2. Struktur Modul
- `topics.js`: Katalog materi arsitektur IT (Deadlock & Concurrency, Transactional Outbox Pattern, Cache-Aside Redis, Zero-Downtime Deployment, Circuit Breaker).
- `video_renderer.js`: Mesin render video otomatis berbasis browser Chromium (Playwright) + transkoder `ffmpeg`.
- `sender.js`: Modul pengirim file video dan pesan teks berformat `<pre><code>` ke Telegram bot.
- `run.js`: Skrip runner utama siklus konten & pengelolaan status giliran topik (`state.json`).

---

## 3. Eksekusi Manual
```bash
NODE_PATH=/home/antok/fb-poster/node_modules node /home/antok/fb-video-creator/run.js
```
