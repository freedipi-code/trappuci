/**
 * Script pour importer les données exportées de SQLite dans PostgreSQL.
 * Usage : node scripts/import-data.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function importData() {
  const prisma = new PrismaClient();

  try {
    const dataPath = path.join(__dirname, '..', 'data-export.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Fichier data-export.json introuvable. Lancez d\'abord export-data.js');
      return;
    }

    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log('📥 Import des données dans PostgreSQL...\n');

    // Import Users
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { telegramId: u.telegramId },
        update: { username: u.username, fullName: u.fullName },
        create: {
          telegramId: u.telegramId,
          username: u.username,
          fullName: u.fullName,
          createdAt: new Date(u.createdAt),
        },
      });
    }
    console.log(`   ✅ Users: ${data.users.length}`);

    // Import Categories (respect parent-child order)
    const catMap = {};
    // First pass: categories without parent
    for (const c of data.categories.filter(c => !c.parentId)) {
      const created = await prisma.category.create({
        data: { name: c.name },
      });
      catMap[c.id] = created.id;
    }
    // Second pass: categories with parent
    for (const c of data.categories.filter(c => c.parentId)) {
      const created = await prisma.category.create({
        data: {
          name: c.name,
          parentId: catMap[c.parentId] || null,
        },
      });
      catMap[c.id] = created.id;
    }
    console.log(`   ✅ Categories: ${data.categories.length}`);

    // Import Products
    const prodMap = {};
    for (const p of data.products) {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          price: p.price,
          image: p.image,
          description: p.description,
          stock: p.stock,
          active: p.active,
          categoryId: catMap[p.categoryId],
        },
      });
      prodMap[p.id] = created.id;
    }
    console.log(`   ✅ Products: ${data.products.length}`);

    // Import Orders
    const userMap = {};
    const dbUsers = await prisma.user.findMany();
    for (const u of dbUsers) {
      const orig = data.users.find(ou => ou.telegramId === u.telegramId);
      if (orig) userMap[orig.id] = u.id;
    }

    for (const o of data.orders) {
      const items = data.orderItems.filter(oi => oi.orderId === o.id);
      await prisma.order.create({
        data: {
          orderNumber: o.orderNumber,
          userId: userMap[o.userId],
          total: o.total,
          paymentMethod: o.paymentMethod === 'USDT' ? 'LTC' : o.paymentMethod,
          status: o.status,
          fullName: o.fullName,
          address: o.address,
          notes: o.notes,
          proofMessage: o.proofMessage,
          createdAt: new Date(o.createdAt),
          items: {
            create: items.map(it => ({
              productId: prodMap[it.productId],
              quantity: it.quantity,
              price: it.price,
            })),
          },
        },
      });
    }
    console.log(`   ✅ Orders: ${data.orders.length}`);
    console.log(`   ✅ OrderItems: ${data.orderItems.length}`);

    console.log('\n🎉 Import terminé avec succès !');
  } catch (e) {
    console.error('❌ Erreur import :', e);
  } finally {
    await prisma.$disconnect();
  }
}

importData();
