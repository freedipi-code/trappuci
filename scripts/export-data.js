/**
 * Script pour exporter les données SQLite avant migration PostgreSQL.
 * Usage : node scripts/export-data.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function exportData() {
  const prisma = new PrismaClient();

  try {
    console.log('📦 Export des données SQLite...\n');

    const users = await prisma.user.findMany();
    const categories = await prisma.category.findMany();
    const products = await prisma.product.findMany();
    const carts = await prisma.cart.findMany();
    const cartItems = await prisma.cartItem.findMany();
    const orders = await prisma.order.findMany();
    const orderItems = await prisma.orderItem.findMany();

    const data = {
      exportedAt: new Date().toISOString(),
      users,
      categories,
      products,
      carts,
      cartItems,
      orders,
      orderItems,
    };

    const outPath = path.join(__dirname, '..', 'data-export.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

    console.log(`✅ Export terminé !`);
    console.log(`   Users:      ${users.length}`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Products:   ${products.length}`);
    console.log(`   Carts:      ${carts.length}`);
    console.log(`   CartItems:  ${cartItems.length}`);
    console.log(`   Orders:     ${orders.length}`);
    console.log(`   OrderItems: ${orderItems.length}`);
    console.log(`\n📁 Fichier : ${outPath}`);
  } catch (e) {
    console.error('❌ Erreur export :', e);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
