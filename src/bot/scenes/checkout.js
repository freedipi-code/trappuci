const { Scenes, Markup } = require('telegraf');
const cartService = require('../../services/cart.service');

// Scene séquentielle : nom → adresse → notes → choix paiement.
// La création de la commande se fait dans le handler "pay:..." (payment.js)
// pour pouvoir réutiliser le flux si l'utilisateur change d'avis.
const checkout = new Scenes.BaseScene('checkout');

checkout.enter(async (ctx) => {
  const cart = await cartService.getCartWithItems(ctx.state.user.id);
  if (!cart.items.length) {
    await ctx.reply('🛒 Your cart is empty.');
    return ctx.scene.leave();
  }
  ctx.scene.session.checkout = {};
  await ctx.reply('📝 *Step 1/3* — Enter your *full name*:', { parse_mode: 'Markdown' });
});

checkout.on('text', async (ctx) => {
  const data = ctx.scene.session.checkout || {};
  const text = ctx.message.text.trim();

  if (text.startsWith('/')) {
    await ctx.reply('Commands are ignored during checkout. Type /cancel to cancel.');
    return;
  }

  if (!data.fullName) {
    if (text.length < 2) {
      return ctx.reply('Name too short, please try again.');
    }
    data.fullName = text;
    ctx.scene.session.checkout = data;
    return ctx.reply('📍 *Step 2/3* — Enter your *shipping address*:', { parse_mode: 'Markdown' });
  }

  if (!data.address) {
    if (text.length < 5) {
      return ctx.reply('Address too short, please try again.');
    }
    data.address = text;
    ctx.scene.session.checkout = data;
    return ctx.reply(
      '🗒️ *Step 3/3* — *Additional information*?\n' +
        '(apartment, delivery notes, etc.)\n\n' +
        'Send "-" if nothing to add.',
      { parse_mode: 'Markdown' },
    );
  }

  if (!data.notes) {
    data.notes = text === '-' ? '' : text;
    ctx.scene.session.checkout = data;

    // Récap + choix paiement
    const cart = await cartService.getCartWithItems(ctx.state.user.id);
    const total = cartService.computeTotal(cart);
    const lines = cart.items.map(
      (it) => `• ${it.quantity}× ${it.product.name} — £${(it.product.price * it.quantity).toFixed(2)}`,
    );

    const recap =
      `*Order Summary*\n\n` +
      `👤 ${data.fullName}\n` +
      `📍 ${data.address}\n` +
      (data.notes ? `📝 ${data.notes}\n` : '') +
      `\n${lines.join('\n')}\n\n*Total: £${total.toFixed(2)}*\n\n` +
      `💳 Choose your payment method:`;

    await ctx.reply(recap, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('₿ BTC', 'checkout:pay:BTC'),
          Markup.button.callback('🪙 LTC', 'checkout:pay:LTC'),
        ],
        [Markup.button.callback('❌ Cancel', 'checkout:cancel')],
      ]),
    });
  }
});

checkout.command('cancel', async (ctx) => {
  await ctx.reply('❌ Order cancelled.');
  return ctx.scene.leave();
});

checkout.action('checkout:cancel', async (ctx) => {
  await ctx.answerCbQuery('Cancelled').catch(() => {});
  await ctx.reply('❌ Order cancelled.');
  return ctx.scene.leave();
});

module.exports = checkout;
