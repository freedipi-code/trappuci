const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Reset (dev only)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // Root category
  const riz = await prisma.category.create({ data: { name: 'Riz' } });

  // Sub-categories
  const basmati = await prisma.category.create({ data: { name: 'Riz Basmati', parentId: riz.id } });
  const jasmin = await prisma.category.create({ data: { name: 'Riz Jasmin', parentId: riz.id } });
  const parfume = await prisma.category.create({ data: { name: 'Riz Parfumé', parentId: riz.id } });
  const complet = await prisma.category.create({ data: { name: 'Riz Complet', parentId: riz.id } });
  const etuve = await prisma.category.create({ data: { name: 'Riz Étuvé', parentId: riz.id } });
  const brise = await prisma.category.create({ data: { name: 'Riz Brisé', parentId: riz.id } });
  const local = await prisma.category.create({ data: { name: 'Riz Local', parentId: riz.id } });

  // Products
  await prisma.product.createMany({
    data: [
      // --- Basmati ---
      {
        name: 'Riz Basmati Premium 5kg',
        price: 18,
        description: 'Riz basmati long grain, parfumé, récolte 2025. Sac de 5kg.',
        stock: 40,
        categoryId: basmati.id,
        image: 'https://picsum.photos/seed/basmati5/600/400',
      },
      {
        name: 'Riz Basmati Premium 1kg',
        price: 4.5,
        description: 'Format familial 1kg, idéal pour découvrir.',
        stock: 120,
        categoryId: basmati.id,
        image: 'https://picsum.photos/seed/basmati1/600/400',
      },
      {
        name: 'Riz Basmati Gold 10kg',
        price: 32,
        description: 'Sélection gold, grain extra-long, 10kg.',
        stock: 25,
        categoryId: basmati.id,
        image: 'https://picsum.photos/seed/basmati10/600/400',
      },

      // --- Jasmin ---
      {
        name: 'Riz Jasmin Thaï 5kg',
        price: 16,
        description: 'Riz jasmin de Thaïlande, doux et parfumé, 5kg.',
        stock: 50,
        categoryId: jasmin.id,
        image: 'https://picsum.photos/seed/jasmin5/600/400',
      },
      {
        name: 'Riz Jasmin Thaï 1kg',
        price: 4,
        description: 'Petit format 1kg pour usage quotidien.',
        stock: 100,
        categoryId: jasmin.id,
        image: 'https://picsum.photos/seed/jasmin1/600/400',
      },

      // --- Parfumé ---
      {
        name: 'Riz Parfumé Tropical 5kg',
        price: 14,
        description: 'Riz parfumé sélection tropicale, parfait pour plats épicés.',
        stock: 60,
        categoryId: parfume.id,
        image: 'https://picsum.photos/seed/parfume5/600/400',
      },
      {
        name: 'Riz Parfumé 25kg',
        price: 55,
        description: 'Grand sac 25kg — idéal restaurants et familles nombreuses.',
        stock: 12,
        categoryId: parfume.id,
        image: 'https://picsum.photos/seed/parfume25/600/400',
      },

      // --- Complet ---
      {
        name: 'Riz Complet Bio 1kg',
        price: 5,
        description: 'Riz complet bio, riche en fibres. Sachet 1kg.',
        stock: 80,
        categoryId: complet.id,
        image: 'https://picsum.photos/seed/complet1/600/400',
      },
      {
        name: 'Riz Rouge Complet 1kg',
        price: 6,
        description: 'Riz rouge complet, saveur de noisette, riche en antioxydants.',
        stock: 45,
        categoryId: complet.id,
        image: 'https://picsum.photos/seed/rouge1/600/400',
      },

      // --- Étuvé ---
      {
        name: 'Riz Étuvé 5kg',
        price: 13,
        description: 'Riz étuvé, grains détachés à la cuisson, 5kg.',
        stock: 70,
        categoryId: etuve.id,
        image: 'https://picsum.photos/seed/etuve5/600/400',
      },
      {
        name: 'Riz Étuvé 1kg',
        price: 3.5,
        description: 'Format découverte 1kg.',
        stock: 150,
        categoryId: etuve.id,
        image: 'https://picsum.photos/seed/etuve1/600/400',
      },

      // --- Brisé ---
      {
        name: 'Riz Brisé Thaï 25kg',
        price: 38,
        description: 'Riz brisé thaïlandais, sac 25kg. Excellent rapport qualité/prix.',
        stock: 20,
        categoryId: brise.id,
        image: 'https://picsum.photos/seed/brise25/600/400',
      },
      {
        name: 'Riz Brisé 50kg',
        price: 70,
        description: 'Grand sac 50kg — usage professionnel ou stock familial.',
        stock: 8,
        categoryId: brise.id,
        image: 'https://picsum.photos/seed/brise50/600/400',
      },

      // --- Local ---
      {
        name: 'Riz Local 5kg',
        price: 12,
        description: 'Riz cultivé localement, récolte récente.',
        stock: 60,
        categoryId: local.id,
        image: 'https://picsum.photos/seed/local5/600/400',
      },
      {
        name: 'Riz Local 25kg',
        price: 48,
        description: 'Grand sac 25kg, riz local, parfait pour familles ou commerces.',
        stock: 15,
        categoryId: local.id,
        image: 'https://picsum.photos/seed/local25/600/400',
      },
      {
        name: 'Riz Local 50kg',
        price: 90,
        description: 'Sac 50kg, économique, livraison incluse en option.',
        stock: 6,
        categoryId: local.id,
        image: 'https://picsum.photos/seed/local50/600/400',
      },
    ],
  });

  const total = await prisma.product.count();
  const cats = await prisma.category.count();
  console.log(`✅ Seed terminé — ${cats} catégories, ${total} produits.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
