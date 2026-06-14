const { Markup } = require('telegraf');
const shop = require('../../shop.config');

async function showInfo(ctx) {
  const text = `ℹ️ *Information*\n\n${shop.information}`;
  const opts = {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([[Markup.button.callback('🏠 Home', 'home')]]),
  };
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    try { await ctx.editMessageText(text, opts); return; } catch (_) {}
  }
  return ctx.reply(text, opts);
}

function register(bot) {
  bot.action('info', showInfo);
  bot.command('info', showInfo);
}

module.exports = { register };
