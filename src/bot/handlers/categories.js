const { Markup } = require('telegraf');
const prisma = require('../../db/client');

function chunk(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// "Browse Shop" = list all root categories
async function showShop(ctx) {
  const roots = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { id: 'asc' },
  });
  const buttons = roots.map((c) => Markup.button.callback(`${c.name}`, `cat:${c.id}`));
  const rows = chunk(buttons, 2);
  rows.push([
    Markup.button.callback('🏠 Home', 'home'),
    Markup.button.callback('🛒 Cart', 'cart'),
  ]);
  const text = '🛍️ *Browse the shop*\n\nSelect a category:';
  const opts = { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) };
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    try {
      await ctx.editMessageText(text, opts);
      return;
    } catch (_) {
      // fallback (e.g. previous message was a photo)
    }
  }
  await ctx.reply(text, opts);
}

async function showCategory(ctx, { id, rootName }) {
  let category;
  if (rootName) {
    category = await prisma.category.findFirst({
      where: { name: rootName, parentId: null },
      include: { children: true, products: { where: { active: true } } },
    });
  } else {
    category = await prisma.category.findUnique({
      where: { id: Number(id) },
      include: { children: true, products: { where: { active: true } }, parent: true },
    });
  }
  if (!category) {
    await ctx.answerCbQuery('Category not found').catch(() => {});
    return;
  }

  const buttons = [];

  for (const child of category.children) {
    buttons.push(Markup.button.callback(`${child.name}`, `cat:${child.id}`));
  }
  for (const p of category.products) {
    buttons.push(Markup.button.callback(`🛍️ ${p.name} — £${p.price}`, `prod:${p.id}`));
  }

  const rows = chunk(buttons, 2);

  const backRow = [];
  if (category.parentId) {
    backRow.push(Markup.button.callback('⬅️ Back', `cat:${category.parentId}`));
  } else {
    backRow.push(Markup.button.callback('⬅️ Back', 'shop'));
  }
  backRow.push(Markup.button.callback('🏠 Home', 'home'));
  backRow.push(Markup.button.callback('🛒 Cart', 'cart'));
  rows.push(backRow);

  const text = `📂 *${category.name}*\n\n${
    category.children.length === 0 && category.products.length === 0
      ? '_No products yet._'
      : 'Select:'
  }`;

  const opts = { parse_mode: 'Markdown', ...Markup.inlineKeyboard(rows) };

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery().catch(() => {});
    try {
      await ctx.editMessageText(text, opts);
      return;
    } catch (_) {
      // fallback
    }
  }
  await ctx.reply(text, opts);
}

function register(bot) {
  bot.action('shop', showShop);
  bot.command('shop', showShop);
  bot.action(/^cat:root:(.+)$/, (ctx) => showCategory(ctx, { rootName: ctx.match[1] }));
  bot.action(/^cat:(\d+)$/, (ctx) => showCategory(ctx, { id: ctx.match[1] }));
}

module.exports = { register };
