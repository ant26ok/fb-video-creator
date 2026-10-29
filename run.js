const fs = require('fs');
const path = require('path');
const config = require('./config');
const topics = require('./topics');
const { renderVideo } = require('./video_renderer');
const { sendContentToTelegram } = require('./sender');

function loadState() {
  if (fs.existsSync(config.STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(config.STATE_FILE, 'utf8'));
    } catch (e) {}
  }
  return { lastTopicIndex: -1, history: [] };
}

function saveState(state) {
  fs.writeFileSync(config.STATE_FILE, JSON.stringify(state, null, 2));
}

async function run() {
  console.log('====================================================');
  console.log(`[FB CONTENT RUN] ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log('====================================================');

  const state = loadState();
  const nextIndex = (state.lastTopicIndex + 1) % topics.length;
  const currentTopic = topics[nextIndex];

  console.log(`[TOPIC SELECTED] (${nextIndex + 1}/${topics.length}) ${currentTopic.title}`);

  // 1. Render Video 1080x1080 30FPS MP4
  const videoPath = await renderVideo(currentTopic);

  // 2. Simpan draft ke disk
  const draftRecord = {
    id: `fb_draft_${Date.now()}`,
    topicId: currentTopic.id,
    topic: currentTopic.title,
    category: currentTopic.category,
    createdAt: new Date().toISOString(),
    videoPath,
    postText: currentTopic.postText
  };
  fs.writeFileSync(
    path.join(config.DRAFTS_DIR, `${draftRecord.id}.json`),
    JSON.stringify(draftRecord, null, 2)
  );

  // 3. Kirim Video dan Teks Siap Salin ke Telegram Antok
  await sendContentToTelegram(currentTopic, videoPath, currentTopic.postText);

  // 4. Update State
  state.lastTopicIndex = nextIndex;
  state.history.push({
    id: draftRecord.id,
    topicId: currentTopic.id,
    title: currentTopic.title,
    timestamp: new Date().toISOString(),
    videoPath
  });
  if (state.history.length > 50) state.history.shift();
  saveState(state);

  console.log('====================================================');
  console.log('[SUCCESS] Konten Facebook siap posting berhasil dikirim ke Telegram!');
  console.log('====================================================');
}

run().catch(err => {
  console.error('[ERROR RUNNING FB CONTENT GENERATOR]:', err);
  process.exit(1);
});
