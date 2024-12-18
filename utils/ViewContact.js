const { fetchOffer, saveInteraction } = require("../services/productServices");
const { checkUser } = require("../services/userServices");

async function viewContact(bot, ctx) {
  const offerId = ctx.session.offerId;
  try {
    const offers = await fetchOffer(offerId);
    let message = `I Want To: ${offers.offer_type}\nProduct Name: ${offers.product_name}`;

    if (offers.grade) {
      message += `\nGrade: ${offers.grade}`;
    }
    if (offers.brand_name) {
      message += `\nBrand Name: ${offers.brand_name}`;
    }
    if (offers.type) {
      message += `\nType: ${offers.type}`;
    }
    if (offers.size) {
      message += `\nSize: ${offers.size}`;
    }

    if (offers.class) {
      message += `\nClass: ${offers.class}`;
    }
    if (offers.region) {
      message += `\nRegion: ${offers.region}`;
    }
    if (offers.process) {
      message += `\nProcess: ${offers.process}`;
    }
    if (offers.quantity) {
      message += `\nQuantity: ${offers.quantity} ${offers.measurement}`;
    }
    if (offers.description) {
      message += `\nDescription: ${offers.description}`;
    }

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
      "Sorry, an error occurred while fetching the offer details. / ችግር ስለተፈጠረ በድጋሚ ይሞክሩ"
    );
  }
}

async function viewFullContact(bot, ctx) {
  const callbackData = ctx.update.callback_query.data;
  const offerId = ctx.session.offerId;

  try {
    const offers = await fetchOffer(offerId);
    const user = await checkUser(ctx.chat.id);

    const replaceNull = (value) =>
      value == null || value === "" ? "N/A" : value;

    const quantity = replaceNull(offers.quantity);
    const measurement = replaceNull(offers.measurement);
    const quantityMessage =
      quantity === "N/A" && measurement === "N/A"
        ? "N/A"
        : `${quantity} ${measurement}`;

    let message = `I Want To: ${replaceNull(
      offers.offer_type
    )}\nProduct Name: ${replaceNull(offers.product_name)}\nGrade: ${replaceNull(
      offers.grade
    )}`;

    if (offers.class) {
      message += `\nClass: ${replaceNull(offers.class)}`;
    }
    if (offers.region) {
      message += `\nRegion: ${replaceNull(offers.region)}`;
    }
    if (offers.description) {
      message += `\nDescription: ${replaceNull(offers.description)}`;
    }

    message += `\nQuantity: ${quantityMessage}\nPhone number: ${replaceNull(
      offers.phone_number
    )}\nUsername: ${replaceNull(
      offers.user_name
    )}\nBusiness type: ${replaceNull(offers.business_type)}`;

    await ctx.reply(message);

    try {
      const interactionData = {
        poster_name: replaceNull(offers.user_name),
        poster_phone_number: replaceNull(offers.phone_number),
        poster_business_type: replaceNull(offers.business_type),
        poster_chat_id: replaceNull(offers.chat_id),
        viewer_name: replaceNull(user.name),
        viewer_phone_number: replaceNull(user.contact_information),
        viewer_business_type: replaceNull(user.business_type),
        viewer_chat_id: replaceNull(user.chat_id),
        offerId: replaceNull(offers.id),
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
  } catch (error) {
    console.error("Error fetching offer:", error);
    await ctx.reply(
      "Sorry, an error occurred while fetching the offer details. / ይቅርታ፣ ጥያቄዎ አልተሳካም። እባክዎ ትንሽ ቆይተው ይሞክሩ"
    );
  }
}

module.exports = { viewContact, viewFullContact };
