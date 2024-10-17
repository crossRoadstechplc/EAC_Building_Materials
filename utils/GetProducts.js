const { fetchProduct } = require("../services/productServices");

async function GetProduct(bot, ctx) {
  try {
    const products = await fetchProduct();

    if (products && products.length > 0) {
      const formattedProducts = products.map((product) => {
        const truncatedName =
          product.name.length > 20
            ? product.name.slice(0, 17) + "..."
            : product.name;
        const callbackData = `product_${product.id}_${truncatedName}`;
        return {
          text: product.name,
          callback_data: callbackData,
        };
      });

      const formattedButtons = [];
      for (let i = 0; i < formattedProducts.length; i += 2) {
        formattedButtons.push(formattedProducts.slice(i, i + 2));
      }

      const sentMessage = await ctx.reply(
        "Please select Product / የምርት አይነት ይምረጡ:",
        {
          reply_markup: {
            inline_keyboard: formattedButtons,
          },
        }
      );

      if (sentMessage) {
        ctx.session.lastMessageId = sentMessage.message_id;
      }
    } else {
      await ctx.reply("Item not available / ምንም የለም");
    }
  } catch (error) {
    console.error("Error in GetProduct function:", error);
    await ctx.reply(
      "Sorry, an error occurred while fetching the products. / ችግር ስለተፈጠረ በድጋሚ ይሞክሩ"
    );
  }
}

module.exports = { GetProduct };
