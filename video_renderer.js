const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const config = require('./config');

function buildHtml(topic) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${topic.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      background: radial-gradient(circle at 50% 15%, #0f172a 0%, #020617 100%);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      color: #f8fafc;
      box-sizing: border-box;
    }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    
    @keyframes pulseGlow {
      0%, 100% { opacity: 0.35; transform: scale(1); }
      50% { opacity: 0.75; transform: scale(1.04); }
    }
    .glow-accent {
      filter: drop-shadow(0 0 20px ${topic.accentColor}55);
    }
  </style>
</head>
<body class="flex flex-col justify-between p-14 select-none relative">
  <!-- Subtle Grid Background -->
  <div class="absolute inset-0 bg-[linear-gradient(to_right,#1e293b18_1px,transparent_1px),linear-gradient(to_bottom,#1e293b18_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none"></div>
  <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[460px] h-[460px] bg-gradient-to-tr ${topic.color} opacity-15 rounded-full blur-3xl pointer-events-none" style="animation: pulseGlow 4s ease-in-out infinite;"></div>

  <!-- Header -->
  <div class="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-5">
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr ${topic.color} flex items-center justify-center font-black text-2xl shadow-xl text-white">
        IT
      </div>
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-bold font-mono tracking-wider text-cyan-400 mb-1">
          <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          ${topic.category}
        </div>
        <h2 class="text-xl font-black tracking-tight text-white">TECH ARCHITECTURE SPOTLIGHT</h2>
      </div>
    </div>
    <div class="text-right">
      <div class="text-[11px] font-mono text-slate-400">ENGINEERING CASE STUDY</div>
      <div class="text-xs font-bold text-slate-300 font-mono">SYSTEM ANALYST INSIGHT</div>
    </div>
  </div>

  <!-- Dynamic Content Stage -->
  <div class="relative z-10 flex-1 flex flex-col justify-center my-6">
    <!-- Scene 1: Hook & Core Question (0 - 4s) -->
    <div id="scene1" class="transition-all duration-700 space-y-6">
      <div class="inline-block px-4 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-bold font-mono">
        CRITICAL ARCHITECTURAL BOTTLENECK
      </div>
      <h1 class="text-4xl font-extrabold tracking-tight text-white leading-tight">
        "${topic.title}"
      </h1>
      <p class="text-lg text-slate-300 leading-relaxed font-medium bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
        ${topic.hook}
      </p>
    </div>

    <!-- Scene 2: 3 Pillars Architecture (4 - 15s) -->
    <div id="scene2" class="hidden transition-all duration-700 space-y-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-bold font-mono text-cyan-400 tracking-wider">CORE PILLARS & SOLUTIONS</span>
        <span class="text-xs font-mono text-slate-400">PRACTICAL ARCHITECTURE</span>
      </div>

      <div class="grid grid-cols-1 gap-3.5">
        ${topic.keyPoints.map((pt, i) => `
          <div id="pillar${i+1}" class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-start gap-4 transition-all duration-500 opacity-30 translate-y-3">
            <div class="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-cyan-400 text-base shrink-0 shadow-inner">
              ${pt.num}
            </div>
            <div>
              <h3 class="text-base font-bold text-white tracking-tight">${pt.title}</h3>
              <p class="text-xs text-slate-400 mt-1 leading-relaxed">${pt.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Scene 3: Key Takeaway (15 - 20s) -->
    <div id="scene3" class="hidden transition-all duration-700 text-center space-y-6 py-6">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr ${topic.color} flex items-center justify-center text-white text-2xl font-bold shadow-xl">
        ✓
      </div>
      <h2 class="text-3xl font-black text-white tracking-tight max-w-xl mx-auto leading-snug">
        "${topic.takeaway}"
      </h2>
      <p class="text-sm font-mono text-cyan-400 font-semibold tracking-wide">
        Diskusi lengkap di kolom komentar Facebook 👇
      </p>
    </div>
  </div>

  <!-- Bottom Bar / Footer -->
  <div class="relative z-10 border-t border-slate-800/80 pt-5 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-400">
        AP
      </div>
      <div>
        <div class="text-sm font-bold text-white">Ardyanto Tresno Prabowo</div>
        <div class="text-xs text-slate-400">Full-Stack Dev & System Analyst</div>
      </div>
    </div>
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
      <span>HIGH-PERFORMANCE ARCHITECTURE</span>
    </div>
  </div>

  <script>
    const s1 = document.getElementById('scene1');
    const s2 = document.getElementById('scene2');
    const s3 = document.getElementById('scene3');

    const p1 = document.getElementById('pillar1');
    const p2 = document.getElementById('pillar2');
    const p3 = document.getElementById('pillar3');

    // Timeline execution for 20-second loop
    setTimeout(() => {
      s1.classList.add('hidden');
      s2.classList.remove('hidden');
      
      setTimeout(() => {
        if (p1) { p1.classList.remove('opacity-30', 'translate-y-3'); p1.classList.add('opacity-100', 'border-cyan-500/40'); }
      }, 500);

      setTimeout(() => {
        if (p2) { p2.classList.remove('opacity-30', 'translate-y-3'); p2.classList.add('opacity-100', 'border-cyan-500/40'); }
      }, 3500);

      setTimeout(() => {
        if (p3) { p3.classList.remove('opacity-30', 'translate-y-3'); p3.classList.add('opacity-100', 'border-cyan-500/40'); }
      }, 6500);
    }, 4500);

    setTimeout(() => {
      s2.classList.add('hidden');
      s3.classList.remove('hidden');
    }, 14500);
  </script>
</body>
</html>`;
}

async function renderVideo(topic) {
  const videoFileName = `fb_video_${topic.id}_${Date.now()}.mp4`;
  const finalVideoPath = path.join(config.VIDEOS_DIR, videoFileName);
  const tempDir = path.join(config.VIDEOS_DIR, `temp_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const htmlPath = path.join(tempDir, 'index.html');
  fs.writeFileSync(htmlPath, buildHtml(topic));

  console.log(`[RENDER VIDEO] Meluncurkan browser untuk merekam video "${topic.title}"...`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: tempDir,
      size: { width: 1080, height: 1080 }
    }
  });

  const page = await context.newPage();
  await page.goto(`file://${htmlPath}`);

  // Rekam selama 20 detik sesuai timeline animasi
  await page.waitForTimeout(20500);

  await page.close();
  await context.close();
  await browser.close();

  // Cari file .webm yang dihasilkan
  const webmFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
  if (webmFiles.length === 0) {
    throw new Error('Tidak ada file webm yang terekam oleh Playwright.');
  }

  const rawWebmPath = path.join(tempDir, webmFiles[0]);
  console.log(`[RENDER VIDEO] Mengonversi ${webmFiles[0]} ke MP4 H.264...`);

  // Konversi ke MP4 H.264 kompatibel Facebook & Telegram
  const ffmpegCmd = `ffmpeg -y -i "${rawWebmPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${finalVideoPath}"`;
  execSync(ffmpegCmd, { stdio: 'pipe' });

  // Bersihkan folder temp
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log(`[RENDER SUCCESS] Video selesai dibuat: ${finalVideoPath} (${fs.statSync(finalVideoPath).size} bytes)`);
  return finalVideoPath;
}

module.exports = {
  renderVideo
};
