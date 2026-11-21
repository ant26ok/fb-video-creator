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

function deriveCaption(text) {
  // ponytail: fallback when AI omits caption; trim long posts to 2 lines + CTA question
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const body = lines.slice(0, 2).join(' ');
  const cut = body.length > 200 ? body.slice(0, 197).trimEnd() + '...' : body;
  return `${cut}\n\nWhat would you fix first? Comment below 👇`;
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

  // 2. Kirim Caption Reels (150-250 char + 2-3 hashtag + transkripsi)
  const caption = (topic.caption || deriveCaption(topic.postText || '')).trim();
  const hashtags = topic.hashtags || '#SystemArchitecture #LLMOps #HealthTech';
  const transcription = topic.transcription || '';
  const reelText =
    `${caption}\n\n${hashtags}\n\n@pengikut` +
    (transcription ? `\n\n---\n📝 TRANSCRIPT\n${transcription}` : '');

  const escapedText = reelText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const messagePayload = {
    chat_id: chatId,
    text: `📘 <b>FACEBOOK REEL (READY TO POST)</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 <b>Topic:</b> ${topic.title}\n` +
          `🏷️ <b>Category:</b> ${topic.category}\n` +
          `🔢 <b>Key number:</b> ${topic.oneNumber || '—'} ${topic.oneNumberLabel || ''}\n` +
          `📏 <b>Caption length:</b> ${caption.length} chars\n` +
          `🕒 <b>Slot:</b> ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB\n\n` +
          `📋 <b>Caption + hashtags + transcript (tap to copy):</b>\n\n` +
          `<pre><code>${escapedText}</code></pre>\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 <i>Upload the 9:16 video above as a Reel, then paste this caption.</i>`,
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
