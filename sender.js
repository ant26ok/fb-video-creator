const fs = require('fs');
const path = require('path');
const config = require('./config');

async function sendContentToTelegram(topic, videoPath, postText) {
  const token = config.TELEGRAM_BOT_TOKEN;
  const chatId = config.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('Telegram bot token or chat ID is missing in configuration.');
  }

  console.log(`[TELEGRAM] Mengunggah file video ${path.basename(videoPath)} ke Telegram...`);
  
  // 1. Kirim Video terlebih dahulu
  const videoFormData = new FormData();
  videoFormData.append('chat_id', chatId);
  videoFormData.append('caption', `🎬 <b>VIDEO KONTEN IT:</b> ${topic.title}\n🏷️ <i>${topic.category}</i>\n\n👇 Salin teks draft postingan di pesan bawah ini:`);
  videoFormData.append('parse_mode', 'HTML');
  
  const videoBuffer = fs.readFileSync(videoPath);
  videoFormData.append('video', new Blob([videoBuffer], { type: 'video/mp4' }), path.basename(videoPath));

  const videoRes = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
    method: 'POST',
    body: videoFormData
  });
  const videoData = await videoRes.json();
  if (!videoData.ok) {
    throw new Error(`Gagal mengirim video Telegram: ${videoData.description}`);
  }
  console.log('[TELEGRAM SUCCESS] Video berhasil terkirim ke Telegram.');

  // 2. Kirim Pesan Teks Draft Lengkap (Siap Salin)
  const escapedText = postText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const messagePayload = {
    chat_id: chatId,
    text: `📘 <b>DRAFT KONTEN FACEBOOK (SIAP POSTING)</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 <b>Topik:</b> ${topic.title}\n` +
          `🏷️ <b>Kategori:</b> ${topic.category}\n` +
          `🕒 <b>Jadwal:</b> ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB\n\n` +
          `📋 <b>Salin Teks di Bawah (Ketuk blok teks untuk salin):</b>\n\n` +
          `<pre><code>${escapedText}</code></pre>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 <i>Simpan video di atas ke galeri, salin teks di atas, lalu posting langsung ke feed Facebook Anda.</i>`,
    parse_mode: 'HTML'
  };

  const textRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messagePayload)
  });
  const textData = await textRes.json();
  if (!textData.ok) {
    throw new Error(`Gagal mengirim pesan teks Telegram: ${textData.description}`);
  }
  console.log('[TELEGRAM SUCCESS] Teks draft berhasil terkirim.');
}

module.exports = {
  sendContentToTelegram
};
