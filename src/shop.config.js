// ───────────────────────────────────────────────────────────────────
// SHOP BRANDING CONFIG
// Edit this file to customize your shop's identity (name, shipping policy,
// channel link, owner username, footer signature, etc.).
// No need to touch any other file in the project.
// ───────────────────────────────────────────────────────────────────

module.exports = {
  // Display name shown in welcome message header
  name: "LocalExoticz Shop",

  // Emoji prepended/appended to the shop name in welcome
  emoji: "",

  // Shipping policy line (1-2 short lines max)
  shippingLine: "🌍 Worldwide Shipping",
  dispatchLine: "⏰ All orders placed before 1pm are dispatched the same day for fast and reliable delivery.",

  // Bulk enquiries line
  bulkLine: "🎫 For bulk enquiries, please open a ticket via the Support button.",

  // Channel / community
  channelUrl: "",            // e.g. "https://t.me/your_channel" — empty hides the button
  channelLabel: "Join our Channel",

  // Owner / support contact (Telegram username without @)
  ownerUsername: "",         // e.g. "yourhandle" — empty hides the line
  ownerStatusLine: "🟢 Online",  // overridden if you want dynamic status later

  // Footer
  footerLink: "https://t.me/LocalExoticz_bot",
  footerText: "Powered by LocalExoticz Shop",

  // Welcome cover image (path to local file OR public URL OR empty for text-only)
  // Examples:
  //   "assets/welcome.jpg"
  //   "https://yourcdn.com/cover.jpg"
  welcomeImage: "",

  // Information page content (shown when user clicks ℹ️ Information)
  information: [
    "📦 *Shipping*",
    "All orders placed before 1pm are dispatched the same day.",
    "Worldwide shipping available.",
    "",
    "💳 *Payment*",
    "We accept BTC and LTC.",
    "Payment instructions are shown after checkout.",
    "",
    "↩️ *Returns*",
    "14-day return policy on unopened items.",
    "Contact support for return instructions.",
    "",
    "🔒 *Privacy*",
    "Your shipping address is used only for delivery and is never shared.",
  ].join("\n"),
};
