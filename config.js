const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  const fallbackEnv = '/home/antok/fb-poster/.env';
  const targetPath = fs.existsSync(envPath) ? envPath : fallbackEnv;
  
  const env = {};
  if (fs.existsSync(targetPath)) {
    const lines = fs.readFileSync(targetPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        env[key] = val;
      }
    }
  }
  return env;
}

const fileEnv = loadEnv();

module.exports = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || fileEnv.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || fileEnv.TELEGRAM_CHAT_ID || '5371930289',
  ROUTER_URL: process.env.ROUTER_URL || fileEnv.ROUTER_URL || 'http://208.76.40.125:20128/v1',
  ROUTER_API_KEY: process.env.ROUTER_API_KEY || fileEnv.ROUTER_API_KEY || '',
  VIDEOS_DIR: path.join(__dirname, 'videos'),
  DRAFTS_DIR: path.join(__dirname, 'drafts'),
  STATE_FILE: path.join(__dirname, 'state.json')
};
