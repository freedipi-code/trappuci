const { Markup } = require('telegraf');
const shop = require('../shop.config');

// Callback data conventions (separator ":")
//   home                          → welcome screen
//   shop                          → browse categories (root)
//   cat:<id>                      → show category/subcategory by id
//   cat:root:<Name>               → show root category by name
//   prod:<id>                     → product page
//   add:<productId>               → add to cart
//   cart                          → cart view
//   cart:inc:<productId>          → +1
//   cart:dec:<productId>          → -1
//   cart:clear                    → empty cart
//   checkout                      → enter checkout scene
//   checkout:pay:BTC|LTC          → pay
//   proof:<orderId>               → flag "I paid"
//   orders                        → list user's orders
//   order:<id>                    → order detail
//   wishlist                      → wishlist (stub for now)
//   reviews                       → reviews (stub for now)
//   info                          → information page
//   support                       → open support ticket

const homeMenu = () => {
  const rows = [
    [
      Markup.button.callback('🛍️ Browse Shop', 'shop'),
      Markup.button.callback('🛒 View Cart', 'cart'),
    ],
    [
      Markup.button.callback('📜 Orders', 'orders'),
      Markup.button.callback('⭐ Wishlist', 'wishlist'),
    ],
    [
      Markup.button.callback('🎉 Reviews', 'reviews'),
      Markup.button.callback('ℹ️ Information', 'info'),
    ],
    [Markup.button.callback('🎫 Support', 'support')],
  ];

  // Optional channel button if configured
  if (shop.channelUrl) {
    rows.push([Markup.button.url('📢 ' + shop.channelLabel, shop.channelUrl)]);
  }

  return Markup.inlineKeyboard(rows);
};

const backHome = () =>
  Markup.inlineKeyboard([[Markup.button.callback('⬅️ Home', 'home')]]);

module.exports = { homeMenu, backHome };
