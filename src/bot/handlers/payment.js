const { Markup } = require('telegraf');
const config = require('../../config');
const orderService = require('../../services/order.service');
const notifyService = require('../../services/notify.service');
const cryptoService = require('../../services/crypto.service');

async function walletInstructions(order) {
  if (order.paymentMethod === 'BTC') {
    let btcAmount = 'calculating...';
    try {
      const amount = await cryptoService.convertGbpToCrypto(order.total, 'BTC');
      btcAmount = amount.toFixed(6);
    } catch (e) {
      btcAmount = 'Error';
    }
    return (
      `*BTC Wallet Address:*\n\`${config.wallets.btc}\`\n\n` +
      `Network: Bitcoin (mainnet)\n` +
      `Amount to send: *${btcAmount} BTC* (equivalent to £${order.total.toFixed(2)})`
    );
  }
  let ltcAmount = 'calculating...';
  try {
    const amount = await cryptoService.convertGbpToCrypto(order.total, 'LTC');
    ltcAmount = amount.toFixed(4);
  } catch (e) {
    ltcAmount = 'Error';
  }
  return (
    `*LTC Wallet Address:*\n\`${config.wallets.ltc}\`\n\n` +
    `Network: Litecoin\n` +
    `Amount to send: *${ltcAmount} LTC* (equivalent to £${order.total.toFixed(2)})`
  );
}

function register(bot) {
  // Lance la scene depuis le panier
  bot.action('checkout', async (ctx) => {
    await ctx.answerCbQuery().catch(() => {});
    return ctx.scene.enter('checkout');
  });
  bot.command('checkout', (ctx) => ctx.scene.enter('checkout'));
  bot.command('commander', (ctx) => ctx.scene.enter('checkout'));

  // Choix méthode de paiement → crée la commande et affiche le wallet
  bot.action(/^checkout:pay:(BTC|LTC)$/, async (ctx) => {
    const method = ctx.match[1];
    const data = ctx.scene?.session?.checkout;
    if (!data || !data.fullName || !data.address) {
      await ctx.answerCbQuery('Session expired, please start over.', { show_alert: true });
      return ctx.scene?.leave();
    }

    let order;
    try {
      order = await orderService.createOrderFromCart(ctx.state.user.id, {
        fullName: data.fullName,
        address: data.address,
        notes: data.notes,
        paymentMethod: method,
      });
    } catch (e) {
      await ctx.answerCbQuery(e.message, { show_alert: true });
      return;
    }

    await ctx.answerCbQuery('Order created ✅').catch(() => {});

    const lines = order.items.map(
      (it) => `• ${it.quantity}× ${it.product.name}`,
    );

    const walletText = await walletInstructions(order);
    const message =
      `✅ *Order ${order.orderNumber}*\n\n` +
      `Customer: ${order.fullName}\n` +
      `Address: ${order.address}\n` +
      (order.notes ? `Notes: ${order.notes}\n` : '') +
      `\n*Products:*\n${lines.join('\n')}\n\n` +
      `*Total: £${order.total.toFixed(2)}*\n` +
      `Payment: ${order.paymentMethod}\n\n` +
      walletText +
      `\n\n📎 After payment, send a *screenshot* or *transaction hash* directly in this chat — it will be forwarded to the admin.`;

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('📎 I paid — send proof', `proof:${order.id}`)],
        [Markup.button.callback('🏠 Home', 'home')],
      ]),
    });

    // Notification admin
    await notifyService.notifyNewOrder(bot, order, ctx);

    // Stocke l'orderId actif pour rattacher la prochaine preuve envoyée
    ctx.session = ctx.session || {};
    ctx.session.awaitingProofFor = order.id;

    return ctx.scene.leave();
  });

  // Bouton "J'ai payé"
  bot.action(/^proof:(\d+)$/, async (ctx) => {
    const orderId = Number(ctx.match[1]);
    ctx.session = ctx.session || {};
    ctx.session.awaitingProofFor = orderId;
    await ctx.answerCbQuery().catch(() => {});
    await ctx.reply(
      '📎 Send your proof of payment now (screenshot, hash, explorer link...). ' +
        'It will be forwarded to the admin for validation.',
    );
  });

  // Capture des messages "preuve" (hors scene)
  // Photo, document, ou texte court non-commande
  bot.on(['photo', 'document'], async (ctx, next) => {
    if (!ctx.session?.awaitingProofFor) return next();
    const orderId = ctx.session.awaitingProofFor;
    const order = await orderService.getOrder(orderId);
    if (!order) return next();
    await orderService.markProofReceived(orderId, 'media');
    await notifyService.forwardProofToAdmin(bot, order, ctx);
    await ctx.reply('✅ Proof received, thank you. The admin will validate your order shortly.');
    ctx.session.awaitingProofFor = null;
  });

  bot.on('text', async (ctx, next) => {
    if (!ctx.session?.awaitingProofFor) return next();
    if (ctx.message.text.startsWith('/')) return next();
    const orderId = ctx.session.awaitingProofFor;
    const order = await orderService.getOrder(orderId);
    if (!order) return next();
    await orderService.markProofReceived(orderId, ctx.message.text.slice(0, 500));
    await notifyService.forwardProofToAdmin(bot, order, ctx);
    await ctx.reply('✅ Proof received, thank you. The admin will validate your order shortly.');
    ctx.session.awaitingProofFor = null;
  });
}

module.exports = { register };
