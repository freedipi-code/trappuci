const prisma = require('../db/client');
const cartService = require('./cart.service');

function generateOrderNumber() {
  // CMD-{timestamp36}-{random}
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0');
  return `CMD-${ts}${rand}`;
}

// Crée la commande à partir du panier actuel et le vide.
// Décrémente le stock dans la même transaction.
async function createOrderFromCart(userId, { fullName, address, notes, paymentMethod }) {
  const cart = await cartService.getCartWithItems(userId);
  if (!cart.items.length) throw new Error('Cart empty');

  // Re-vérifie stock
  for (const it of cart.items) {
    if (it.quantity > it.product.stock) {
      throw new Error(`Insufficient stock for ${it.product.name}`);
    }
  }

  const total = cartService.computeTotal(cart);
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId,
        total,
        paymentMethod,
        fullName,
        address,
        notes: notes || null,
        items: {
          create: cart.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            price: it.product.price,
          })),
        },
      },
      include: { items: { include: { product: true } }, user: true },
    });

    // Décrémente le stock
    for (const it of cart.items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { stock: { decrement: it.quantity } },
      });
    }

    // Vide le panier
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  return order;
}

async function getOrder(orderId) {
  return prisma.order.findUnique({
    where: { id: Number(orderId) },
    include: { items: { include: { product: true } }, user: true },
  });
}

async function markProofReceived(orderId, proofMessage) {
  return prisma.order.update({
    where: { id: Number(orderId) },
    data: { proofMessage },
  });
}

module.exports = { createOrderFromCart, getOrder, markProofReceived };
