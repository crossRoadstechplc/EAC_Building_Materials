const { fetchOffer, saveInteraction } = require("../services/productServices");
const { checkUser } = require("../services/userServices");

async function viewContact(bot, ctx) {
  const offerId = ctx.session.offerId;
  try {
    const offers = await fetchOffer(offerId);

    let message = `Product Name: ${offers.product_name}\nGrade: ${offers.grade}`;

    if (offers.class) {
      message += `\nClass: ${offers.class}`;
    }
    if (offers.region) {
      message += `\nRegion: ${offers.region}`;
    }
    if (offers.process) {
      message += `\nProcess: ${offers.process}`;
    }

    message += `\nQuantity: ${offers.quantity} ${offers.measurement}\nOffer Type: ${offers.offer_type}`;

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "View details", callback_data: `viewDetails_${offerId}` }],
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching offer:", error);
    await ctx.reply(
      "Sorry, an error occurred while fetching the offer details."
    );
  }
}

async function viewFullContact(bot, ctx) {
  const callbackData = ctx.update.callback_query.data;
  const offerId = ctx.session.offerId;

  try {
    const user = await checkUser(ctx.chat.id);
    const offers = await fetchOffer(offerId);
    if (offers.product_name) {
      let message = `Product Name: ${offers.product_name}\nGrade: ${offers.grade}`;

      if (offers.class) {
        message += `\nClass: ${offers.class}`;
      }
      if (offers.region) {
        message += `\nRegion: ${offers.region}`;
      }
      if (offers.process) {
        message += `\nProcess: ${offers.process}`;
      }

      message += `\nQuantity: ${offers.quantity} ${offers.measurement}\nOffer Type: ${offers.offer_type}\nPhone number: ${offers.phone_number}\nUsername: ${offers.user_name}\nBusiness type: ${offers.business_type}`;

      await ctx.reply(message);
      try {
        const interactionData = {
          poster_name: offers.user_name,
          poster_phone_number: offers.phone_number,
          poster_business_type: offers.business_type,
          poster_chat_id: offers.chat_id,
          viewer_name: user.name,
          viewer_phone_number: user.contact_information,
          viewer_business_type: user.business_type,
          viewer_chat_id: user.chat_id,
          offerId: offers.id,
        };

        await saveInteraction(
          interactionData.poster_name,
          interactionData.poster_phone_number,
          interactionData.poster_business_type,
          interactionData.poster_chat_id,
          interactionData.viewer_name,
          interactionData.viewer_phone_number,
          interactionData.viewer_business_type,
          interactionData.viewer_chat_id,
          interactionData.offerId
        );
      } catch (error) {
        console.error("Error saving interaction:", error);
      }
    } else {
      ctx.reply("No contact found");
    }
  } catch (error) {
    console.error("Error fetching offer:", error);
    await ctx.reply(
      "Sorry, an error occurred while fetching the offer details."
    );
  }
}

module.exports = { viewContact, viewFullContact };
