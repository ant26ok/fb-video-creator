// One-off: render the 3 Dual-Writes follow-up posts (video, photo, short personal video).
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { renderVideo, renderStill } = require('./video_renderer');

const POSTS = [
  {
    kind: 'video',
    id: 'outbox_polling_vs_cdc',
    category: 'DISTRIBUTED SYSTEMS',
    title: 'Outbox Is Done. Now Who Ships It?',
    hook: 'A 1-minute cron on the outbox table adds 60s of claim lag. Multiply by 400 claims/hour.',
    coverBadge: 'PART 2 · OUTBOX RELAY',
    accentColor: '#22c55e',
    bgColor: '#04140c',
    queueTheme: true,
    durationMs: 24000,
    coverMs: 3000,
    ctaAtMs: 18000,
    keyPoints: [{ num: '01', title: 'Polling relay: 4 lines, 60s lag', desc: 'SELECT ... FOR UPDATE SKIP LOCKED every minute. Simple, but a claim waits up to 60s.' }],
    oneNumber: '60s → 300ms',
    oneNumberLabel: 'publish lag after switching to CDC',
    takeaway: 'Polling is a fine first step. It stops being fine the moment a 60s delay can cost a claim.',
    ctaText: 'Polling relay or Debezium CDC? Which one is in YOUR stack? 👇',
    caption: 'Outbox is done. Now who ships it? A 1-minute cron adds 60s of claim lag. CDC cut ours to 300ms. Polling relay or Debezium CDC — which one is in your stack?',
    hashtags: '#SystemArchitecture #EventDriven #HealthTech',
    transcription: [
      'Outbox table is in place. Nothing is lost yet.',
      'But who reads it and pushes it downstream?',
      'Polling relay: SELECT ... FOR UPDATE SKIP LOCKED once a minute.',
      'Simple, four lines, and up to 60 seconds of lag.',
      'Debezium CDC tails the WAL instead: 300ms, but you need Kafka Connect.',
      'Polling or CDC — pick per claim volume, not per taste.'
    ].join('\n')
  },
  {
    kind: 'photo',
    id: 'dual_writes_claim_lost',
    category: 'DISTRIBUTED SYSTEMS',
    title: 'Dual Writes: Why One Claim Vanished With No Error',
    hook: 'Commit succeeded. Publish failed. Nothing in the logs. That is how a claim disappears.',
    coverBadge: '3-POINT BREAKDOWN',
    accentColor: '#22c55e',
    bgColor: '#04140c',
    queueTheme: true,
    photoMode: true,
    oneNumber: '3 steps',
    oneNumberLabel: 'problem, fix, consumer rule',
    keyPoints: [
      { num: '01', title: 'Two systems, no shared transaction', desc: 'Commit lands in billing, publish to the queue times out. Event gone, zero errors.' },
      { num: '02', title: 'One outbox row in the same commit', desc: 'Commit succeeds, event exists. Rollback, event never existed. No third outcome.' },
      { num: '03', title: 'Dedupe by event ID, at-least-once', desc: 'Relay may deliver twice after a crash. Consumers must be idempotent.' }
    ],
    captionText: [
      'Dual Writes: why one hospital claim can vanish with zero errors.',
      '',
      '1) The problem: two systems, no shared transaction.',
      'Write to the billing DB, then publish to the queue. The commit lands, the publish times out, and the event is gone. No exception, no dead letter, no alert — just a claim that never reaches reconciliation.',
      '',
      '2) The fix: one outbox table inside the same commit.',
      'INSERT the event row in the same transaction as the business write. If the transaction commits, the event exists. If it rolls back, the event never existed. There is no third outcome.',
      '',
      '3) The consumer rule: dedupe by event ID, assume at-least-once.',
      'The relay may deliver twice after a crash. Store the event ID, reject duplicates on the consumer side. At-least-once delivery plus idempotent consumers is the whole contract.',
      '',
      'Dual writes are not a performance problem. They are a correctness problem that hides until month-end reconciliation.',
      '',
      'Save this for your next backend design review, and share it with the teammate who still writes to two systems in one handler.',
      '',
      '@pengikut',
      '',
      '#SystemArchitecture #EventDriven #HealthTech'
    ].join('\n')
  },
  {
    kind: 'video',
    id: 'lost_billing_event_3am',
    category: 'PRODUCTION STORY',
    title: '40 Claims Missing. Database Was Fine.',
    hook: '3 AM call from the cashier: 40 claims never arrived. DB healthy, queue empty, zero errors.',
    coverBadge: '3 AM INCIDENT',
    accentColor: '#f59e0b',
    bgColor: '#140d04',
    queueTheme: true,
    durationMs: 15000,
    coverMs: 2500,
    ctaAtMs: 11000,
    keyPoints: [{ num: '01', title: 'DB healthy, queue empty, 40 claims gone', desc: 'Commit succeeded. Publish failed silently. No retry, no dead letter, no alert.' }],
    oneNumber: '0 lost events',
    oneNumberLabel: 'since the outbox pattern went live',
    takeaway: 'The database was never lying. The event just never left the building.',
    ctaText: 'Ever been paged at 3 AM for a silent data loss? Tell me how you found it 👇',
    caption: '3 AM: cashier says 40 claims never arrived. DB healthy. Queue empty. Zero errors. Commit succeeded, publish failed silently. 0 lost events since we moved to an outbox.',
    hashtags: '#ProductionEngineering #DistributedSystems #HealthTech',
    transcription: [
      '3 AM. Cashier calls: 40 claims are missing.',
      'Database is healthy. Queue is empty. No errors anywhere.',
      'Commit succeeded. The publish call timed out.',
      'No retry. No dead letter. The event just never left.',
      'We moved the publish into an outbox row in the same commit.',
      'Zero lost events since.'
    ].join('\n')
  }
];

async function sendVideo(post, videoPath, thumbPath) {
  const token = config.TELEGRAM_BOT_TOKEN;
  const chatId = config.TELEGRAM_CHAT_ID;

  const fd = new FormData();
  fd.append('chat_id', chatId);
  fd.append('caption', `🎬 <b>REEL ${post.durationMs / 1000}s · READY TO POST</b>\n<b>${post.title}</b>`);
  fd.append('parse_mode', 'HTML');
  fd.append('video', new Blob([fs.readFileSync(videoPath)], { type: 'video/mp4' }), path.basename(videoPath));
  if (thumbPath && fs.existsSync(thumbPath)) {
    fd.append('thumbnail', new Blob([fs.readFileSync(thumbPath)], { type: 'image/jpeg' }), path.basename(thumbPath));
  }
  const r = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, { method: 'POST', body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error('sendVideo: ' + j.description);

  const body = `${post.caption}\n\n${post.hashtags}\n\n@pengikut\n\n---\n📝 TRANSCRIPT\n${post.transcription}`;
  await sendText(`📘 <b>FACEBOOK REEL CAPTION</b>\n━━━━━━━━━━━━━━━━━━━━\n📌 ${post.title}\n🔢 ${post.oneNumber} — ${post.oneNumberLabel}\n\n<pre><code>${esc(body)}</code></pre>`);
}

async function sendPhoto(post, photoPath) {
  const token = config.TELEGRAM_BOT_TOKEN;
  const chatId = config.TELEGRAM_CHAT_ID;

  const fd = new FormData();
  fd.append('chat_id', chatId);
  fd.append('caption', `📸 <b>FACEBOOK PHOTO · READY TO POST</b>\n<b>${post.title}</b>`);
  fd.append('parse_mode', 'HTML');
  fd.append('photo', new Blob([fs.readFileSync(photoPath)], { type: 'image/jpeg' }), path.basename(photoPath));
  const r = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, { method: 'POST', body: fd });
  const j = await r.json();
  if (!j.ok) throw new Error('sendPhoto: ' + j.description);

  await sendText(`📘 <b>FACEBOOK PHOTO CAPTION</b>\n━━━━━━━━━━━━━━━━━━━━\n📌 ${post.title}\n\n<pre><code>${esc(post.captionText)}</code></pre>`);
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendText(html) {
  const r = await fetch(`https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: config.TELEGRAM_CHAT_ID, text: html, parse_mode: 'HTML' })
  });
  const j = await r.json();
  if (!j.ok) throw new Error('sendMessage: ' + j.description);
}

async function main() {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const post of POSTS) {
    if (only && !only.includes(post.id)) continue;
    console.log(`\n=== ${post.kind.toUpperCase()} :: ${post.title} ===`);
    if (post.kind === 'video') {
      const res = await renderVideo(post);
      await sendVideo(post, res.videoPath, res.thumbnailPath);
    } else {
      const stillPath = await renderStill(post);
      await sendPhoto(post, stillPath);
    }
    console.log(`[SENT] ${post.id}`);
  }
  console.log('\n[ALL DONE] 3 posts delivered to Telegram.');
}

main().catch(e => {
  console.error('[FATAL]', e);
  process.exit(1);
});
