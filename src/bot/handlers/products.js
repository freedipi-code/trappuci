const { Markup } = require('telegraf');
const prisma = require('../../db/client');
const cartService = require('../../services/cart.service');
const { resolveImage } = require('../../utils/image');

// Build the buttons used on the product page, parametrized by quantity.
function productKeyboard(product, qty) {
  const safeQty = Math.max(1, Math.min(qty, product.stock));
  const minusQty = Math.max(1, safeQty - 1);
  const plusQty = Math.min(product.stock, safeQty + 1);

  const rows = [];
  if (product.stock > 0) {
    rows.push([
      Markup.button.callback('➖', `qty:${product.id}:${minusQty}`),
      Markup.button.callback(`Qty: ${safeQty}`, 'noop'),
      Markup.button.callback('➕', `qty:${product.id}:${plusQty}`),
    ]);
    rows.push([
      Markup.button.callback(`🛒 Add ${safeQty} to cart`, `add:${product.id}:${safeQty}`),
    ]);
  }
  rows.push([
    Markup.button.callback('⬅️ Back', `cat:${product.categoryId}`),
    Markup.button.callback('🛒 Cart', 'cart'),
  ]);
  return Markup.inlineKeyboard(rows);
}

function captionFor(product, qty = 1) {
  const stockLine = product.stock > 0 ? `📦 Stock: ${product.stock}` : '❌ Out of stock';
  const subtotal = product.stock > 0 ? `\n🧾 Subtotal: *£${(product.price * qty).toFixed(2)}*` : '';
  return (
    `🛍️ *${product.name}*\n\n` +
    (product.description ? `${product.description}\n\n` : '') +
    `💰 Unit price: *£${product.price}*\n${stockLine}${subtotal}`
  );
}

async function showProduct(ctx) {
  const id = Number(ctx.match[1]);
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product || !product.active) {
    await ctx.answerCbQuery('Product unavailable').catch(() => {});
    return;
  }
  const qty = 1;
  await ctx.answerCbQuery().catch(() => {});

  const photoSrc = resolveImage(product.image);
  if (photoSrc) {
    try {
      await ctx.replyWithPhoto(photoSrc, {
        caption: captionFor(product, qty),
        parse_mode: 'Markdown',
        ...productKeyboard(product, qty),
      });
      return;
    } catch (_) {
      // fallback to text-only
    }
  }
  await ctx.reply(captionFor(product, qty), {
    parse_mode: 'Markdown',
    ...productKeyboard(product, qty),
  });
}

// Update quantity on the same message: re-render caption + keyboard.
async function changeQty(ctx) {
  const id = Number(ctx.match[1]);
  const qty = Number(ctx.match[2]);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    await ctx.answerCbQuery('Product unavailable').catch(() => {});
    return;
  }
  const safeQty = Math.max(1, Math.min(qty, product.stock));
  await ctx.answerCbQuery(`Quantity: ${safeQty}`).catch(() => {});
  try {
    // If the message has a photo, edit caption; else edit text.
    if (ctx.callbackQuery?.message?.photo) {
      await ctx.editMessageCaption(captionFor(product, safeQty), {
        parse_mode: 'Markdown',
        ...productKeyboard(product, safeQty),
      });
    } else {
      await ctx.editMessageText(captionFor(product, safeQty), {
        parse_mode: 'Markdown',
        ...productKeyboard(product, safeQty),
      });
    }
  } catch (e) {
    // Telegram throws if the new content is identical to the old (e.g. user spamming ➕ at max stock).
    // Silently ignore that case.
  }
}

async function addToCart(ctx) {
  const productId = Number(ctx.match[1]);
  const qty = ctx.match[2] ? Number(ctx.match[2]) : 1;
  try {
    await cartService.addItem(ctx.state.user.id, productId, qty);
    await ctx.answerCbQuery(`✅ Added ${qty} to cart`);
  } catch (e) {
    await ctx.answerCbQuery(e.message || 'Could not add', { show_alert: true });
  }
}

function register(bot) {
  bot.action(/^prod:(\d+)$/, showProduct);
  bot.action(/^qty:(\d+):(\d+)$/, changeQty);
  // Accept both `add:<id>` (legacy, qty=1) and `add:<id>:<qty>`
  bot.action(/^add:(\d+)(?::(\d+))?$/, addToCart);
  // Tap on the "Qty: X" label — do nothing visible
  bot.action('noop', (ctx) => ctx.answerCbQuery().catch(() => {}));
}

module.exports = { register };
