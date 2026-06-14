const prisma = require('../db/client');

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });
  return cart;
}

async function getCartWithItems(userId) {
  const cart = await getOrCreateCart(userId);
  return prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true } } },
  });
}

async function addItem(userId, productId, qty = 1) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) throw new Error('Product unavailable');
  if (product.stock <= 0) throw new Error('Out of stock');

  const cart = await getOrCreateCart(userId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  const newQty = (existing?.quantity || 0) + qty;
  if (newQty > product.stock) throw new Error(`Insufficient stock (${product.stock} available)`);

  return prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity: qty },
    update: { quantity: newQty },
  });
}

async function decrementItem(userId, productId) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (!item) return null;
  if (item.quantity <= 1) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return null;
  }
  return prisma.cartItem.update({
    where: { id: item.id },
    data: { quantity: item.quantity - 1 },
  });
}

async function clear(userId) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return cart;
}

function computeTotal(cart) {
  return cart.items.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
}

module.exports = {
  getOrCreateCart,
  getCartWithItems,
  addItem,
  decrementItem,
  clear,
  computeTotal,
};
