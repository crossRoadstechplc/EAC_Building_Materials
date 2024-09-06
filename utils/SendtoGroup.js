async function sendItemToGroup(ctx, offerData, session) {
  const botUsername = "https://t.me/EAC_Building_Material_bot";
  offerData;

  const botLink = `${botUsername}?start=${offerData.id}`;
  offerData.id;

  try {
    let topicMessageId = 331;

    await ctx.telegram.sendMessage(
      -1002078753064,
      `Offer Type: ${session.offerType}\n` +
        `Product Name: ${session.productName}\n` +
        session.selectedValues
          .map((item) => `${item.property}: ${item.value}`)
          .join("\n") +
        `\nQuantity: ${session.quantity} ${session.metrics}\n`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "VIEW CONTACT", url: botLink }]],
        },
        reply_to_message_id: topicMessageId,
      }
    );
    ("Posted");
  } catch (error) {
    console.error("Error sending item details to group:", error);
    throw error;
  }
}

module.exports = { sendItemToGroup };
