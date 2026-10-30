const fs = require('fs');
const path = require('path');
const config = require('./config');
const topicsFallback = require('./topics');

const AI_TOPIC_ANGLES = [
  'Artificial Intelligence & Machine Learning Architecture in Production',
  'Autonomous AI Agents & Multi-Agent Orchestration',
  'Large Language Models (LLM) Inference Optimization & Local Deployment',
  'High-Concurrency Database Locking, Deadlocks & Indexing',
  'Transactional Outbox, Event-Driven Architecture & Message Queues',
  'Cache-Aside Pattern, Redis Invalidation & Stampede Prevention',
  'API Gateway, Rate Limiting & Circuit Breaker Cascading Failure Protection',
  'Zero-Downtime Blue-Green & Canary Deployment in 24/7 Mission-Critical Systems',
  'Healthcare IT Integration: FHIR, HL7, Interoperability & Medical Telemetry Security'
];

function getRecentVideoTopics() {
  try {
    if (fs.existsSync(config.STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(config.STATE_FILE, 'utf8'));
      if (Array.isArray(state.history)) {
        return state.history.map(h => h.title).filter(Boolean).slice(-10);
      }
    }
  } catch (e) {}
  return [];
}

async function generateAiTopicWithFallback() {
  if (!config.ROUTER_API_KEY) {
    console.log('[AI VIDEO] ROUTER_API_KEY tidak ditemukan, memakai fallback topics.');
    return getRandomFallbackTopic();
  }

  const selectedAngle = AI_TOPIC_ANGLES[Math.floor(Math.random() * AI_TOPIC_ANGLES.length)];
  const recentTopics = getRecentVideoTopics();
  const recentListStr = recentTopics.length > 0
    ? `\nDAFTAR TOPIK YANG SUDAH PERNAH DIBIKIN (DILARANG MENGULANG TOPIK, ANALOGI, ATAU JUDUL YANG SERUPA):\n${recentTopics.map(t => '- ' + t).join('\n')}\n`
    : '';

  console.log(`[AI VIDEO GENERATOR] Meminta Gemini 3.8 Flash membuat topik video baru seputar: "${selectedAngle}"...`);

  const systemPrompt = `You are a legendary Principal Software Architect and engaging tech storyteller (like Jordan in tech).
You create high-engagement, insightful IT architecture video scripts and Facebook posts for software engineers, tech leads, and IT professionals.

Output strictly valid JSON with no markdown wrapping (do not use \`\`\`json). The output must start with { and end with }.`;

  const userPrompt = `Create one fresh, high-impact video script & Facebook post about: "${selectedAngle}".

Author context: Ardyanto (Antok), Full-stack Programmer & System Analyst in hospital/healthcare IT. Practical, authoritative, humble, insightful engineering tone. Dilarang menyebut nama RSK Ngesti Waluyo (gunakan 'rumah sakit tempat saya bekerja' atau 'faskes'). Dilarang menyertakan link repo GitHub.
${recentListStr}
Strict requirements:
1. id: unique short alphanumeric slug (e.g. "ai_agent_orchestration_loop")
2. category: uppercase topic category (e.g. "AI ARCHITECTURE", "DATABASE CONCURRENCY", "DISTRIBUTED SYSTEMS")
3. title: punchy, provocative title in Indonesian max 65 chars (WAJIB BARU dan TIDAK BOLEH MIRIP dengan topik sebelumnya!)
4. color: Tailwind gradient classes for badge (e.g. "from-cyan-500 to-blue-600" or "from-amber-500 to-rose-600")
5. accentColor: hex code (e.g. "#06b6d4", "#f43f5e", "#10b981", "#8b5cf6")
6. hook: 1-2 sentence real-world dilemma or critical bottleneck in Indonesian (max 160 chars)
7. keyPoints: array of exactly 3 objects:
   - num: "01", "02", "03"
   - title: concise technical solution title in Indonesian (max 35 chars)
   - desc: actionable explanation in Indonesian (max 80 chars)
8. takeaway: memorable punchline or rule of thumb in Indonesian (max 100 chars)
9. postText: complete, engaging Facebook post in Indonesian (900-1400 characters):
   - Strong relatable hook in the first 2 lines.
   - Clear technical breakdown and real experience.
   - WAJIB CALL TO ACTION (CTA) sebelum hashtag: ajak pembaca untuk Like, Komen pengalaman jika pernah mengalami hal serupa, dan Share ke rekan-rekan IT lainnya.
   - 5-7 relevant hashtags.
10. imagePrompt: ultra-detailed English prompt for an AI-generated 1080x1080 cinematic background:
    - Dramatic high-contrast chiaroscuro, dark obsidian/slate background, neon cyan or warm amber rim lighting.
    - Intriguing focal object matching this new topic: macro shot of glowing neural microchips, optic fiber server racks, or holographic telemetry.
    - Absolutely NO text, NO typography, NO watermark, NO logo, NO cartoon.

Return ONLY the raw JSON object.`;

  try {
    const res = await fetch(`${config.ROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'ag/gemini-3.8-flash',
        stream: false,
        temperature: 0.75,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`9Router HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON safely
    let parsed = null;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!parsed || !parsed.title || !parsed.keyPoints || parsed.keyPoints.length < 3) {
      throw new Error('Format JSON dari 9Router tidak lengkap.');
    }

    console.log(`[AI TOPIC SUCCESS] Berhasil membuat topik: "${parsed.title}" (${parsed.category})`);

    // Generate AI Background Image
    let aiImagePath = null;
    if (parsed.imagePrompt) {
      aiImagePath = await generateAiBackgroundImage(parsed.id, parsed.imagePrompt);
    }
    parsed.bgImagePath = aiImagePath;

    return parsed;
  } catch (err) {
    console.error('[AI TOPIC ERROR] Gagal generate via 9Router:', err.message);
    console.log('[AI TOPIC FALLBACK] Beralih ke topik cadangan.');
    return getRandomFallbackTopic();
  }
}

async function generateAiBackgroundImage(topicId, prompt) {
  const fileName = `ai_bg_${topicId}_${Date.now()}.jpg`;
  const filePath = path.join(config.VIDEOS_DIR, fileName);

  try {
    console.log(`[AI IMAGE GENERATOR] Meminta gambar latar belakang dari 9Router untuk topik "${topicId}"...`);
    const res = await fetch(`${config.ROUTER_URL}/images/generations?response_format=binary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.ROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: 'ag/gemini-3.1-flash-image',
        prompt
      })
    });

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
      console.log(`[AI IMAGE SUCCESS] Latar visual AI tersimpan: ${filePath} (${buffer.length} bytes)`);
      return filePath;
    } else {
      console.warn(`[AI IMAGE WARN] HTTP ${res.status}: ${await res.text().catch(() => '')}`);
    }
  } catch (e) {
    console.warn('[AI IMAGE ERROR]:', e.message);
  }
  return null;
}

function getRandomFallbackTopic() {
  const randomIndex = Math.floor(Math.random() * topicsFallback.length);
  return topicsFallback[randomIndex];
}

module.exports = {
  generateAiTopicWithFallback
};
