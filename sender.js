const fs = require('fs');
const path = require('path');
const config = require('./config');

async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      console.warn(`[TELEGRAM RETRY ${i + 1}/${maxRetries}] Network error: ${err.message}`);
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function sendContentToTelegram(topic, videoPath, postText, thumbnailPath = null) {
  const token = config.TELEGRAM_BOT_TOKEN;
  const chatId = config.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    throw new Error('Telegram bot token or chat ID is missing in configuration.');
  }

  console.log(`[TELEGRAM] Mengunggah file video ${path.basename(videoPath)} ke Telegram...`);
  
  // 1. Kirim Video terlebih dahulu (dengan Thumbnail jika tersedia)
  const videoFormData = new FormData();
  videoFormData.append('chat_id', chatId);
  videoFormData.append('caption', `🎬 <b>VIDEO KONTEN IT:</b> ${topic.title}\n🏷️ <i>${topic.category}</i>\n\n👇 Salin teks draft postingan di pesan bawah ini:`);
  videoFormData.append('parse_mode', 'HTML');
  
  const videoBuffer = fs.readFileSync(videoPath);
  videoFormData.append('video', new Blob([videoBuffer], { type: 'video/mp4' }), path.basename(videoPath));

  if (thumbnailPath && fs.existsSync(thumbnailPath)) {
    const thumbBuffer = fs.readFileSync(thumbnailPath);
    videoFormData.append('thumbnail', new Blob([thumbBuffer], { type: 'image/jpeg' }), path.basename(thumbnailPath));
  }

  const videoRes = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendVideo`, {
    method: 'POST',
    body: videoFormData
  });
  const videoData = await videoRes.json();
  if (!videoData.ok) {
    throw new Error(`Gagal mengirim video Telegram: ${videoData.description}`);
  }
  console.log('[TELEGRAM SUCCESS] Video berhasil terkirim ke Telegram.');

  // 2. Kirim Pesan Teks Draft Lengkap (Siap Salin)
  function attachCta(text) {
    const cta = "How does your engineering team approach this architectural challenge in production? Drop your thoughts or real-world battle scars in the comments below, Like if this resonated, and Share with your fellow engineers!\n\n";
    if (text.includes("Share with your fellow") || text.includes("in the comments below") || text.includes("Like, Comment") || text.includes("Like, Komen")) return text;
    const hashtagIndex = text.search(/#[A-Za-z0-9_]/);
    if (hashtagIndex !== -1) {
      return text.slice(0, hashtagIndex).trimEnd() + "\n\n" + cta + text.slice(hashtagIndex);
    }
    return text.trimEnd() + "\n\n" + cta;
  }

  const finalPostText = attachCta(postText);
  const escapedText = finalPostText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const messagePayload = {
    chat_id: chatId,
    text: `📘 <b>FACEBOOK VIDEO CONTENT (READY TO POST)</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 <b>Topic:</b> ${topic.title}\n` +
          `🏷️ <b>Category:</b> ${topic.category}\n` +
          `🕒 <b>Slot:</b> ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB\n\n` +
          `📋 <b>Tap the text block below to copy:</b>\n\n` +
          `<pre><code>${escapedText}</code></pre>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 <i>Save the video and thumbnail cover above to your gallery, tap the text block to copy, and paste directly to your Facebook feed.</i>`,
    parse_mode: 'HTML'
  };

  const textRes = await fetchWithRetry(`https://api.telegram.org/bot${token}/sendMessage`, {
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
