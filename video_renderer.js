const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const config = require('./config');

function buildP5Html(topic) {
  const p5Script = fs.readFileSync(path.join(__dirname, 'p5.min.js'), 'utf8');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${topic.title}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 1080px;
      height: 1080px;
      overflow: hidden;
      background: #020617;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #canvas-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 1080px;
      height: 1080px;
      z-index: 1;
    }
    #overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 1080px;
      height: 1080px;
      z-index: 10;
      pointer-events: none;
      padding: 48px;
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
      background: rgba(15, 23, 42, 0.78);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 20px;
      padding: 24px 32px;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
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
  <div id="canvas-container"></div>

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
      <!-- Scene 1: Problem Hook (0 - 5.5s) -->
      <div id="scene1" class="scene-box">
        <div style="font-size: 12px; font-weight: 800; color: #f43f5e; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;">
          CRITICAL PROBLEM IDENTIFIED
        </div>
        <div style="font-size: 20px; color: #e2e8f0; line-height: 1.5; font-weight: 600;">
          ${topic.hook}
        </div>
      </div>

      <!-- Scene 2: 3 Pillars (5.5 - 15.5s) -->
      <div id="scene2" class="scene-box" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 12px; font-weight: 800; color: #38bdf8; letter-spacing: 0.1em; text-transform: uppercase;">
            ARCHITECTURAL SOLUTION PATTERN
          </span>
          <span style="font-size: 11px; font-family: monospace; color: #94a3b8;">ACTIVE PIPELINE</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          ${topic.keyPoints.map((pt, i) => `
            <div id="pillar-${i+1}" style="display: flex; align-items: flex-start; gap: 14px; padding: 12px 16px; border-radius: 12px; background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); opacity: 0.35; transform: translateY(8px); transition: all 0.5s ease;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-weight: 900; font-family: monospace; font-size: 13px; flex-shrink: 0;">
                ${pt.num}
              </div>
              <div>
                <div style="font-size: 15px; font-weight: 700; color: #ffffff;">${pt.title}</div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">${pt.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Scene 3: Conclusion / Takeaway (15.5 - 20s) -->
      <div id="scene3" class="scene-box" style="display: none; text-align: center; padding: 36px 32px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: ${topic.accentColor}22; border: 1px solid ${topic.accentColor}; color: ${topic.accentColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px; font-weight: 900;">
          ✓
        </div>
        <div style="font-size: 26px; font-weight: 800; color: #ffffff; line-height: 1.4; max-width: 720px; margin: 0 auto;">
          "${topic.takeaway}"
        </div>
        <div style="margin-top: 16px; font-size: 13px; font-family: monospace; color: #38bdf8; font-weight: 700;">
          Diskusi teknis & studi kasus di kolom komentar Facebook 👇
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
    const s1 = document.getElementById('scene1');
    const s2 = document.getElementById('scene2');
    const s3 = document.getElementById('scene3');
    const p1 = document.getElementById('pillar-1');
    const p2 = document.getElementById('pillar-2');
    const p3 = document.getElementById('pillar-3');

    setTimeout(() => {
      s1.style.display = 'none';
      s2.style.display = 'block';
      setTimeout(() => { p1.style.opacity = '1'; p1.style.transform = 'translateY(0)'; p1.style.borderColor = '${topic.accentColor}'; }, 400);
      setTimeout(() => { p2.style.opacity = '1'; p2.style.transform = 'translateY(0)'; p2.style.borderColor = '${topic.accentColor}'; }, 3200);
      setTimeout(() => { p3.style.opacity = '1'; p3.style.transform = 'translateY(0)'; p3.style.borderColor = '${topic.accentColor}'; }, 6200);
    }, 5500);

    setTimeout(() => {
      s2.style.display = 'none';
      s3.style.display = 'block';
    }, 15500);

    // === P5.JS GENERATIVE BACKGROUND ART ===
    const sketch = (p) => {
      const W = 1080;
      const H = 1080;
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

      p.draw = () => {
        p.background(2, 6, 23);

        const t = p.frameCount * 0.015;
        
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
    viewport: { width: 1080, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: tempDir,
      size: { width: 1080, height: 1080 }
    }
  });

  const page = await context.newPage();
  await page.goto(`file://${htmlPath}`);

  // Rekam selama 20.5 detik
  await page.waitForTimeout(20500);

  await page.close();
  await context.close();
  await browser.close();

  const webmFiles = fs.readdirSync(tempDir).filter(f => f.endsWith('.webm'));
  if (webmFiles.length === 0) {
    throw new Error('Gagal merekam video webm dari canvas p5.js.');
  }

  const rawWebmPath = path.join(tempDir, webmFiles[0]);
  console.log(`[RENDER P5 VIDEO] Mengonversi ke MP4 H.264 (30 FPS, YUV420p)...`);

  const ffmpegCmd = `ffmpeg -y -i "${rawWebmPath}" -c:v libx264 -pix_fmt yuv420p -r 30 -movflags +faststart "${finalVideoPath}"`;
  execSync(ffmpegCmd, { stdio: 'pipe' });

  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}

  console.log(`[RENDER P5 SUCCESS] Video selesai: ${finalVideoPath} (${fs.statSync(finalVideoPath).size} bytes)`);
  return finalVideoPath;
}

module.exports = {
  renderVideo
};
