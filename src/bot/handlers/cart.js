const { Markup } = require('telegraf');
const cartService = require('../../services/cart.service');

function buildCartView(cart) {
  if (!cart.items.length) {
    return {
      text: '🛒 *Your cart is empty*\n\nGo back to the home page to browse products.',
      keyboard: Markup.inlineKeyboard([[Markup.button.callback('⬅️ Home', 'home')]]),
    };
  }

  const lines = cart.items.map(
    (it) => `• ${it.quantity}× ${it.product.name} — £${(it.product.price * it.quantity).toFixed(2)}`,
  );
  const total = cartService.computeTotal(cart);
  const text =
    `🛒 *Your Cart*\n\n${lines.join('\n')}\n\n` +
    `*Total: £${total.toFixed(2)}*`;

  const rows = cart.items.map((it) => [
    Markup.button.callback(`➖ ${it.product.name}`, `cart:dec:${it.productId}`),
    Markup.button.callback(`➕`, `cart:inc:${it.productId}`),
  ]);
  rows.push([Markup.button.callback('🗑️ Empty', 'cart:clear'), Markup.button.callback('✅ Checkout', 'checkout')]);
  rows.push([Markup.button.callback('⬅️ Home', 'home')]);

  return { text, keyboard: Markup.inlineKeyboard(rows) };
}

async function showCart(ctx) {
  const cart = await cartService.getCartWithItems(ctx.state.user.id);
  const { text, keyboard } = buildCartView(cart);
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    try {
      await ctx.editMessageText(text, { parse_mode: 'Markdown', ...keyboard });
      return;
    } catch (_) {
      // fallback
    }
  }
  await ctx.reply(text, { parse_mode: 'Markdown', ...keyboard });
}

function register(bot) {
  bot.action('cart', showCart);
  bot.command('cart', showCart);
  bot.command('panier', showCart);

  bot.action(/^cart:inc:(\d+)$/, async (ctx) => {
    const productId = Number(ctx.match[1]);
    try {
      await cartService.addItem(ctx.state.user.id, productId, 1);
      await ctx.answerCbQuery('+1');
    } catch (e) {
      await ctx.answerCbQuery(e.message, { show_alert: true });
      return;
    }
    return showCart(ctx);
  });

  bot.action(/^cart:dec:(\d+)$/, async (ctx) => {
    const productId = Number(ctx.match[1]);
    await cartService.decrementItem(ctx.state.user.id, productId);
    await ctx.answerCbQuery('-1');
    return showCart(ctx);
  });

  bot.action('cart:clear', async (ctx) => {
    await cartService.clear(ctx.state.user.id);
    await ctx.answerCbQuery('Cart emptied');
    return showCart(ctx);
  });
}

module.exports = { register, showCart };
