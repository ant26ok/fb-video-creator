const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const config = require('./config');

function buildP5Html(topic) {
  const COVER_MS = topic.coverMs || 3000;
  const CTA_MS = topic.ctaAtMs || 18000;
  const p5Script = fs.readFileSync(path.join(__dirname, 'p5.min.js'), 'utf8');
  let bgBase64 = '';
  if (topic.bgImagePath && fs.existsSync(topic.bgImagePath)) {
    try {
      bgBase64 = fs.readFileSync(topic.bgImagePath).toString('base64');
    } catch (e) {}
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${topic.title}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1920px;
      overflow: hidden;
      background: ${topic.bgColor || '#020617'};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    @keyframes kenBurns {
      0% { transform: scale(1) translate(0, 0); }
      100% { transform: scale(1.14) translate(-25px, -35px); }
    }
    #ai-backdrop {
      position: absolute;
      top: -40px;
      left: -40px;
      width: 1160px;
      height: 2040px;
      background-size: cover;
      background-position: center;
      filter: brightness(0.68) contrast(1.15) saturate(1.2);
      animation: kenBurns 26s ease-out forwards;
      z-index: 0;
    }
    #canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 1080px;
      height: 1920px;
      z-index: 2;
    }
    #overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 1080px;
      height: 1920px;
      z-index: 10;
      pointer-events: none;
      padding: 80px 56px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #38bdf8;
      backdrop-filter: blur(8px);
    }
    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 24px;
    }
    .title-h1 {
      font-size: 34px;
      font-weight: 900;
      color: #ffffff;
      margin: 12px 0 0 0;
      line-height: 1.25;
      max-width: 820px;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
    }
    .scene-box {
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      padding: 24px 32px;
      backdrop-filter: blur(8px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .footer-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 20px;
    }
    .author-name {
      font-size: 15px;
      font-weight: 800;
      color: #ffffff;
    }
    .author-title {
      font-size: 12px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  ${bgBase64 ? `<div id="ai-backdrop" style="background-image: url('data:image/jpeg;base64,${bgBase64}');"></div>` : ''}
  <div id="canvas-container"></div>

  <!-- Attention-Grabbing Video Thumbnail Cover (0s - 2.8s) -->
  <div id="cover-thumbnail" style="position: absolute; inset: 0; background-color: ${topic.bgColor || '#020617'}; ${bgBase64 ? `background-image: linear-gradient(180deg, rgba(2, 6, 23, 0.72) 0%, rgba(2, 6, 23, 0.92) 100%), url('data:image/jpeg;base64,${bgBase64}'); background-size: cover; background-position: center;` : `background-image: radial-gradient(circle at 50% 38%, ${topic.accentColor}33 0%, transparent 62%);`} z-index: 100; display: flex; flex-direction: column; justify-content: space-between; padding: 60px; box-sizing: border-box; transition: all 0.75s cubic-bezier(0.16, 1, 0.3, 1);">
    ${topic.queueTheme && !bgBase64 ? `<div style="position:absolute; inset:0; z-index:-1; opacity:0.5; background-image: repeating-linear-gradient(0deg, ${topic.accentColor}26 0 3px, transparent 3px 26px), repeating-linear-gradient(90deg, ${topic.accentColor}1f 0 3px, transparent 3px 26px); mask-image: radial-gradient(circle at 50% 42%, #000 0%, transparent 72%); -webkit-mask-image: radial-gradient(circle at 50% 42%, #000 0%, transparent 72%);"></div>` : ''}
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="display: inline-flex; align-items: center; gap: 10px; padding: 8px 22px; border-radius: 9999px; background: ${topic.accentColor}2e; border: 1.5px solid ${topic.accentColor}; color: ${topic.accentColor}; font-weight: 900; font-size: 15px; letter-spacing: 0.12em; text-transform: uppercase;">
        <span style="width: 10px; height: 10px; border-radius: 50%; background: ${topic.accentColor}; box-shadow: 0 0 12px ${topic.accentColor};"></span>
        ${topic.coverBadge || 'CRITICAL IT WARNING'}
      </div>
      <div style="font-family: monospace; font-size: 15px; font-weight: 800; color: #38bdf8; background: rgba(14, 165, 233, 0.15); padding: 8px 18px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.4);">
        ⚡ SYSTEM ARCHITECTURE
      </div>
    </div>

    <div style="margin: auto 0; text-align: left;">
      <div style="font-size: 16px; font-weight: 800; color: #38bdf8; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 14px; font-family: monospace;">
        ${topic.category}
      </div>
      <h1 style="font-size: 48px; font-weight: 950; color: #ffffff; line-height: 1.22; margin: 0 0 24px 0; text-shadow: 0 4px 30px rgba(0, 0, 0, 0.95);">
        ${topic.title}
      </h1>
      <div style="background: rgba(15, 23, 42, 0.92); border-left: 5px solid ${topic.accentColor}; padding: 20px 24px; border-radius: 0 18px 18px 0; border: 1px solid rgba(255, 255, 255, 0.12); border-left-width: 5px; box-shadow: 0 15px 35px rgba(0,0,0,0.5);">
        <p style="margin: 0; font-size: 21px; color: #cbd5e1; line-height: 1.5; font-weight: 600;">
          ${topic.hook}
        </p>
      </div>
    </div>

    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.12); padding-top: 24px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #0ea5e9, #6366f1); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; font-size: 16px; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);">
          AP
        </div>
        <div>
          <div style="font-size: 16px; font-weight: 800; color: #ffffff;">Ardyanto Tresno Prabowo</div>
          <div style="font-size: 12px; color: #94a3b8;">Full-Stack Dev &amp; System Analyst</div>
        </div>
      </div>
      <div style="display: inline-flex; align-items: center; gap: 10px; padding: 10px 22px; border-radius: 9999px; background: #38bdf820; border: 1.5px solid #38bdf8; color: #38bdf8; font-weight: 800; font-size: 14px; font-family: monospace; box-shadow: 0 0 20px rgba(56, 189, 248, 0.25);">
        ▶ TAP TO PLAY VIDEO
      </div>
    </div>
  </div>

  <div id="overlay">
    <!-- Top Header -->
    <div class="header-box">
      <div>
        <div class="badge">
          <span style="width:8px; height:8px; border-radius:50%; background:${topic.accentColor}; box-shadow:0 0 10px ${topic.accentColor}"></span>
          ${topic.category}
        </div>
        <h1 class="title-h1">${topic.title}</h1>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8; font-family: monospace;">VISUAL SIMULATION</div>
        <div style="font-size: 11px; color: #64748b; font-family: monospace;">GENERATIVE ARCHITECTURE</div>
      </div>
    </div>

    <!-- Center Stage -->
    <div id="center-stage" style="margin: 20px 0;">
      <!-- Scene 1: ONE solution + ONE number (3 - 18s) -->
      <div id="scene1" class="scene-box">
        <div style="font-size: 14px; font-weight: 800; color: #38bdf8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px;">
          THE ONE FIX THAT WORKED
        </div>
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 18px;">
          <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(14, 165, 233, 0.2); border: 1.5px solid rgba(56, 189, 248, 0.5); display: flex; align-items: center; justify-content: center; font-size: 30px; flex-shrink: 0; box-shadow: 0 0 20px rgba(56, 189, 248, 0.35);">
            ⚡
          </div>
          <div>
            <div style="font-size: 30px; font-weight: 900; color: #ffffff; line-height: 1.2;">${(topic.keyPoints && topic.keyPoints[0] ? topic.keyPoints[0].title : topic.title)}</div>
          </div>
        </div>
        <div style="font-size: 22px; color: #cbd5e1; line-height: 1.45; font-weight: 600;">
          ${(topic.keyPoints && topic.keyPoints[0] ? topic.keyPoints[0].desc : topic.hook)}
        </div>
        <div style="margin-top: 26px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; align-items: baseline; gap: 16px;">
          <div style="font-size: 68px; font-weight: 950; color: ${topic.accentColor}; line-height: 1; text-shadow: 0 0 30px ${topic.accentColor}66;">${topic.oneNumber || '−40%'}</div>
          <div style="font-size: 17px; color: #94a3b8; font-weight: 700; line-height: 1.35; max-width: 520px;">${topic.oneNumberLabel || 'measured after the fix'}</div>
        </div>
      </div>

      <!-- Scene 3: 3-point breakdown for photo posts -->
      ${topic.photoMode && topic.keyPoints ? `<div id="scene3" class="scene-box" style="display:none;">
        <div style="font-size: 14px; font-weight: 800; color: #38bdf8; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 20px;">THE 3-POINT BREAKDOWN</div>
        ${topic.keyPoints.map(k => `<div style="display:flex; gap:16px; align-items:flex-start; margin-bottom:20px;">
          <div style="flex:0 0 auto; width:48px; height:48px; border-radius:14px; background:${topic.accentColor}22; border:1.5px solid ${topic.accentColor}88; color:${topic.accentColor}; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:17px;">${k.num}</div>
          <div>
            <div style="font-size:26px; font-weight:900; color:#ffffff; line-height:1.25;">${k.title}</div>
            <div style="font-size:19px; color:#cbd5e1; font-weight:600; line-height:1.45; margin-top:4px;">${k.desc}</div>
          </div>
        </div>`).join('')}
      </div>` : ''}

      <!-- Scene 2: Comment CTA close (18 - 24s) -->
      <div id="scene2" class="scene-box" style="display: none; text-align: center; padding: 48px 36px;">
        <div style="width: 56px; height: 56px; border-radius: 50%; background: ${topic.accentColor}22; border: 1px solid ${topic.accentColor}; color: ${topic.accentColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 26px; font-weight: 900;">
          💬
        </div>
        <div style="font-size: 34px; font-weight: 900; color: #ffffff; line-height: 1.3; max-width: 780px; margin: 0 auto;">
          ${topic.takeaway}
        </div>
        <div style="margin-top: 22px; font-size: 22px; font-weight: 800; color: #38bdf8; line-height: 1.4;">
          ${topic.ctaText || 'What broke first in YOUR stack? Drop it in the comments 👇'}
        </div>
      </div>
    </div>

    <!-- Bottom Footer -->
    <div class="footer-box">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #0ea5e9, #6366f1); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #fff; font-size: 14px;">
          AP
        </div>
        <div>
          <div class="author-name">Ardyanto Tresno Prabowo</div>
          <div class="author-title">Full-Stack Dev &amp; System Analyst</div>
        </div>
      </div>
      <div style="font-size: 12px; font-family: monospace; color: #64748b; font-weight: 600;">
        PRODUCTION-GRADE ARCHITECTURE
      </div>
    </div>
  </div>

  <script>${p5Script}</script>
  <script>
    p5.disableFriendlyErrors = true;

    // Timeline driver
    const cover = document.getElementById('cover-thumbnail');
    const s1 = document.getElementById('scene1');
    const s2 = document.getElementById('scene2');

    // 1. Hide Cover/Thumbnail at 3.0s
    setTimeout(() => {
      if (cover) {
        cover.style.opacity = '0';
        cover.style.transform = 'translateY(-100%)';
      }
    }, ${COVER_MS});

    // 2. ONE solution + ONE number, then close with comment CTA
    setTimeout(() => {
      s1.style.display = 'none';
      s2.style.display = 'block';
    }, ${CTA_MS});

    // === P5.JS GENERATIVE BACKGROUND ART ===
    const QUEUE_THEME = ${topic.queueTheme ? 'true' : 'false'};
    const sketch = (p) => {
      const W = 1080;
      const H = 1920;
      const PARTICLE_COUNT = 90;
      let particles = [];
      let nodes = [];

      p.setup = () => {
        const c = p.createCanvas(W, H);
        c.parent('canvas-container');
        p.frameRate(30);

        for (let x = 120; x < W; x += 140) {
          for (let y = 140; y < H; y += 140) {
            nodes.push({ x, y, basePulse: p.random(100), active: p.random() > 0.4 });
          }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
          particles.push({
            x: p.random(W),
            y: p.random(H),
            vx: p.random(-1.2, 1.2),
            vy: p.random(-1.2, 1.2),
            size: p.random(2, 5),
            color: p.random() > 0.5 ? '${topic.accentColor}' : '#38bdf8'
          });
        }
      };

      // Draw an architectural server/cloud icon badge in the center background
      function drawArchitectureGlyphs(t) {
        p.push();
        p.translate(W / 2, 450);
        
        // Rotating tech rings
        p.noFill();
        p.stroke(56, 189, 248, 60);
        p.strokeWeight(1.5);
        p.circle(0, 0, 360 + Math.sin(t * 2) * 15);
        
        p.stroke(244, 63, 94, 45);
        p.strokeWeight(1);
        p.circle(0, 0, 420 + Math.cos(t * 1.5) * 20);

        // Radial hub nodes
        for (let a = 0; a < 6; a++) {
          const angle = a * (p.TWO_PI / 6) + t * 0.4;
          const rx = Math.cos(angle) * 180;
          const ry = Math.sin(angle) * 180;
          
          p.stroke(56, 189, 248, 80);
          p.strokeWeight(1);
          p.line(0, 0, rx, ry);
          
          p.fill(15, 23, 42, 220);
          p.stroke(56, 189, 248, 160);
          p.strokeWeight(1.5);
          p.rectMode(p.CENTER);
          p.rect(rx, ry, 36, 26, 6);
          
          p.fill(56, 189, 248, 220);
          p.noStroke();
          p.circle(rx - 8, ry, 4);
          p.fill(34, 197, 94, 220);
          p.circle(rx + 8, ry, 4);
        }

        p.pop();
      }

      // Green message-queue stack: rows of enqueued events draining to the right
      function drawQueueStack(t) {
        p.push();
        p.translate(120, 260);
        const rows = 7;
        const rowH = 74;
        const boxW = 210;
        const gap = 26;
        for (let r = 0; r < rows; r++) {
          const y = r * (rowH + gap);
          const drained = ((t * 0.6 + r * 0.35) % 3) > 2.2;
          for (let c = 0; c < 4; c++) {
            const x = c * (boxW + gap);
            const appear = Math.min(1, Math.max(0, t * 0.8 - r * 0.12 - c * 0.08));
            if (appear <= 0) continue;
            p.push();
            p.translate(x + boxW / 2, y + rowH / 2);
            p.scale(appear);
            p.rectMode(p.CENTER);
            if (drained && c === 3) {
              p.noFill();
              p.stroke(34, 197, 94, 70);
              p.strokeWeight(2);
              p.drawingContext.setLineDash([8, 8]);
              p.rect(0, 0, boxW, rowH, 10);
              p.drawingContext.setLineDash([]);
            } else {
              p.fill(6, 78, 59, 150);
              p.stroke(34, 197, 94, 160);
              p.strokeWeight(2);
              p.rect(0, 0, boxW, rowH, 10);
              p.noStroke();
              p.fill(34, 197, 94, 220);
              p.rect(-boxW / 2 + 16, -8, 6, rowH - 28, 3);
              p.fill(16, 185, 129, 180);
              p.rect(-boxW / 2 + 34, -6, boxW * 0.46, 8, 4);
              p.fill(34, 197, 94, 110);
              p.rect(-boxW / 2 + 34, 10, boxW * 0.30, 8, 4);
            }
            p.pop();
          }
          p.noStroke();
          p.fill(34, 197, 94, 90);
          p.rect(boxW * 4 + gap * 4 + 12, y + rowH / 2 - 1, 6, 6, 3);
        }
        p.pop();
      }

      p.draw = () => {
        ${bgBase64 ? 'p.clear(); p.background(2, 6, 23, 70);' : 'p.background(2, 6, 23);'}

        const t = p.frameCount * 0.015;
        
        drawArchitectureGlyphs(t);
        if (QUEUE_THEME) drawQueueStack(t);
        
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const pulse = (Math.sin(t * 3 + n.basePulse) + 1) * 0.5;
          
          if (i + 1 < nodes.length && nodes[i+1].x > n.x) {
            p.stroke(30, 41, 59, 100);
            p.line(n.x, n.y, nodes[i+1].x, nodes[i+1].y);
          }
          if (i + 7 < nodes.length) {
            p.stroke(30, 41, 59, 100);
            p.line(n.x, n.y, nodes[i+7].x, nodes[i+7].y);
          }

          if (n.active) {
            p.noStroke();
            p.fill(56, 189, 248, 40 * pulse);
            p.circle(n.x, n.y, 16 * pulse);
            p.fill(255, 255, 255, 120 * pulse);
            p.circle(n.x, n.y, 3);
          }
        }

        for (let k = 0; k < 6; k++) {
          const streamY = 240 + k * 120;
          const streamX = ((p.frameCount * 4 + k * 200) % (W + 200)) - 100;
          
          p.stroke(56, 189, 248, 140);
          p.strokeWeight(2);
          p.line(streamX - 60, streamY, streamX, streamY);
          
          p.fill(255, 255, 255, 220);
          p.noStroke();
          p.circle(streamX, streamY, 5);
        }

        for (let i = 0; i < particles.length; i++) {
          const pt = particles[i];
          pt.x += pt.vx;
          pt.y += pt.vy;

          if (pt.x < 0) pt.x = W;
          if (pt.x > W) pt.x = 0;
          if (pt.y < 0) pt.y = H;
          if (pt.y > H) pt.y = 0;

          p.noStroke();
          p.fill(pt.color);
          p.circle(pt.x, pt.y, pt.size);

          for (let j = i + 1; j < particles.length; j++) {
            const other = particles[j];
            const d = p.dist(pt.x, pt.y, other.x, other.y);
            if (d < 75) {
              p.stroke(56, 189, 248, p.map(d, 0, 75, 70, 0));
              p.strokeWeight(0.8);
              p.line(pt.x, pt.y, other.x, other.y);
            }
          }
        }

        p.noStroke();
        p.fill(56, 189, 248, 8);
        p.circle(W / 2, H / 2, 600 + Math.sin(t) * 40);
      };
    };

    new p5(sketch);
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
  fs.writeFileSync(htmlPath, buildP5Html(topic));

  console.log(`[RENDER P5 VIDEO] Membuka Playwright untuk merekam canvas p5.js "${topic.title}"...`);
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: tempDir,
      size: { width: 1080, height: 1920 }
    }
  });

  const durationMs = topic.durationMs || 24000;
  const ctaAtMs = topic.ctaAtMs || 18000;
  const durationSec = Math.round(durationMs / 1000);

  const page = await context.newPage();
  await page.goto(`file://${htmlPath}`);

  await page.waitForTimeout(durationMs);

  await page.close();
  await context.close();
  await browser.close();

  const webmFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
  if (webmFiles.length === 0) {
    throw new Error('Gagal merekam video webm dari canvas p5.js.');
  }

  const rawWebmPath = path.join(tempDir, webmFiles[0]);
  console.log(`[RENDER P5 VIDEO] Mengonversi ke MP4 H.264 (30 FPS, YUV420p)...`);

  const ffmpegCmd = `ffmpeg -y -i "${rawWebmPath}" -t ${durationSec} -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${finalVideoPath}"`;
  execSync(ffmpegCmd, { stdio: 'pipe' });

  // Ekstrak cover thumbnail gambar JPG beresolusi tinggi di detik pertama
  const thumbFileName = `fb_thumb_${topic.id}_${Date.now()}.jpg`;
  const finalThumbPath = path.join(config.VIDEOS_DIR, thumbFileName);
  try {
    const thumbCmd = `ffmpeg -y -ss 00:00:01 -i "${finalVideoPath}" -vframes 1 -q:v 2 "${finalThumbPath}"`;
    execSync(thumbCmd, { stdio: 'pipe' });
    console.log(`[RENDER THUMBNAIL SUCCESS] Thumbnail cover dibuat: ${finalThumbPath}`);
  } catch (e) {
    console.warn('[RENDER THUMBNAIL WARN]:', e.message);
  }

  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log(`[RENDER P5 SUCCESS] Video selesai: ${finalVideoPath} (${fs.statSync(finalVideoPath).size} bytes)`);
  return {
    videoPath: finalVideoPath,
    thumbnailPath: fs.existsSync(finalThumbPath) ? finalThumbPath : null
  };
}

async function renderStill(topic) {
  // ponytail: screenshot the cover frame instead of a separate photo pipeline; upgrade to image model when quota returns
  const tempDir = path.join(config.VIDEOS_DIR, `still_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const htmlPath = path.join(tempDir, 'index.html');
  fs.writeFileSync(htmlPath, buildP5Html(topic));

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(1500);

  // ponytail: hide the cover layer so the still is the clean solution scene, not two stacked layers
  // ponytail: fit the feed photo in a 1080x1350 viewport instead of cropping a 9:16 frame
  await page.setViewportSize({ width: 1080, height: 1350 });
  await page.evaluate(() => {
    const cover = document.getElementById('cover-thumbnail');
    if (cover) cover.style.display = 'none';
    const s1 = document.getElementById('scene1');
    const s3 = document.getElementById('scene3');
    if (s3) {
      if (s1) s1.style.display = 'none';
      s3.style.display = 'block';
      const header = document.querySelector('.header-box');
      if (header) header.style.display = 'none';
    }
    document.documentElement.style.height = '1350px';
    document.body.style.height = '1350px';
    ['canvas-container', 'overlay'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.height = '1350px';
    });
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.padding = '48px 56px';
  });
  await page.waitForTimeout(600);

  const rawPath = path.join(tempDir, 'raw.jpg');
  await page.screenshot({ path: rawPath, type: 'jpeg', quality: 92 });
  await browser.close();

  const stillPath = path.join(config.VIDEOS_DIR, `fb_still_${topic.id}_${Date.now()}.jpg`);
  execSync(`ffmpeg -y -i "${rawPath}" -q:v 2 "${stillPath}"`, { stdio: 'pipe' });
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
  console.log(`[RENDER STILL SUCCESS] ${stillPath} (${fs.statSync(stillPath).size} bytes)`);
  return stillPath;
}

module.exports = {
  renderVideo,
  renderStill
};
