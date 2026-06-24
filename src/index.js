const express = require('express');
const path = require('path');
const config = require('./config');
const bot = require('./bot/bot');
const adminRouter = require('./bot/admin.router');

function setupExpressApp(app) {
  // Routes API administrateur
  app.use('/api/admin', adminRouter);

  // Dashboard administrateur
  app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

  // Health check Render
  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });
}

async function startPolling() {
  await bot.telegram.deleteWebhook({ drop_pending_updates: false }).catch(() => {});

  const me = await bot.telegram.getMe();

  console.log(`🤖 Bot lancé en mode POLLING (dev) — @${me.username}`);

  const app = express();

  setupExpressApp(app);

  const port = config.webhook.port || 3000;

  app.listen(port, () => {
    console.log(`📊 Admin Dashboard disponible sur http://localhost:${port}/admin`);
  });

  await bot.launch();
}

async function startWebhook() {
  if (!config.webhook.domain) {
    throw new Error('WEBHOOK_DOMAIN est requis en mode webhook');
  }

  const app = express();

  /*
    Render peut fournir :
    - telegram-shop-bot-4rm0.onrender.com
    - https://telegram-shop-bot-4rm0.onrender.com

    On retire automatiquement https:// et les slash inutiles.
  */
  const webhookDomain = String(config.webhook.domain)
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');

  /*
    Telegram accepte seulement :
    A-Z, a-z, 0-9, _ et -

    Render generateValue peut produire des caractères comme / + =
    qui sont refusés par Telegram.
  */
  const webhookSecret = config.webhook.secret
    ? String(config.webhook.secret)
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .slice(0, 256)
    : undefined;

  const webhookPath = String(config.webhook.path || '/api/telegram/webhook')
    .trim()
    .startsWith('/')
    ? String(config.webhook.path || '/api/telegram/webhook').trim()
    : `/${String(config.webhook.path || '/api/telegram/webhook').trim()}`;

  const url = `https://${webhookDomain}${webhookPath}`;

  setupExpressApp(app);

  app.use(
    await bot.createWebhook({
      domain: webhookDomain,
      path: webhookPath,
      secret_token: webhookSecret,
      drop_pending_updates: false,
    })
  );

  app.listen(config.webhook.port, () => {
    console.log(`🤖 Bot lancé en mode WEBHOOK sur le port ${config.webhook.port}`);
    console.log(`   URL configurée : ${url}`);
    console.log(`📊 Admin Dashboard disponible sur /admin`);
  });
}

(async () => {
  try {
    if (config.mode === 'webhook') {
      await startWebhook();
    } else {
      await startPolling();
    }
  } catch (e) {
    console.error('Échec du démarrage du bot :', e);
    process.exit(1);
  }
})();

// Arrêt propre du bot
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
