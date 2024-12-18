const { fetchOffer, saveInteraction } = require("../services/productServices");
const { checkUser } = require("../services/userServices");

async function viewContact(bot, ctx) {
  const offerId = ctx.session.offerId;
  const phoneRegex =
    /(\+?\d{1,3})?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;

  const replaceNull = (value) =>
    value == null || value === "" ? "N/A" : value;

  try {
    const offers = await fetchOffer(offerId);

    // Replace phone numbers in the description if they exist
    const sanitizedDescription = offers.description
      ? offers.description.replace(phoneRegex, " ")
      : "N/A";

    // Define property mappings
    const properties = [
      { name: "Brand Name" },
      { name: "Type" },
      { name: "Size" },
      { name: "Quantity" },
      { name: "Measurement" },
      { name: "Description" },
    ];

    // Map properties to their values in the offer
    let propertyDetails = properties
      .map((prop) => {
        const propName = prop.name.toLowerCase().replace(" ", "_");
        // Use sanitizedDescription if mapping "Description"
        if (propName === "description") {
          return `${prop.name}: ${sanitizedDescription}`;
        }
        return `${prop.name}: ${replaceNull(offers[propName])}`;
      })
      .join("\n");

    // Construct the message
    let message = `I Want To: ${replaceNull(
      offers.offer_type
    )}\nProduct Name: ${replaceNull(offers.product_name)}\n${propertyDetails}`;

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
