// constants.js
const { Telegraf, Markup, session } = require("telegraf");

async function measurement(ctx) {
  const sentMessage = await ctx.reply(
    "Please choose the measurement / መለኪያ ይምረጡ:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("Piece", "piece"),
        Markup.button.callback("Metre cube", "m3"),
      ],

      [Markup.button.callback("QUINTAL / ኩንታል", "quintal")],
    ])
  );

  if (sentMessage) {
    ctx.session.lastMessageId = sentMessage.message_id;
  }
}

async function measurementForEdit(ctx) {
  console.log("Entering measurementForEdit function");
  console.log("#$@$2342432%#@");
  console.log("Exiting measurementForEdit function");

  const sentMessage = await ctx.reply(
    "Please choose the measurement / መለኪያ ይምረጡ:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("Piece", "Edit_piece"),
        Markup.button.callback("Metre cube", "Edit_m3"),
      ],
      [Markup.button.callback("QUINTAL / ኩንታል", "Edit_quintal")],
    ])
  );

  if (sentMessage) {
    ctx.session.lastMessageId = sentMessage.message_id;
  }
}

async function BusinessTypeMenu(ctx) {
  sentMessage = await ctx.reply(
    "Please choose the Business Type/ የንግድ አይነቶን ይምረጡ:",
    Markup.inlineKeyboard([
      [
        Markup.button.callback("SMALLHOLDER / አነስተኛ አምራች ", "Smallholder"),
        Markup.button.callback("COMMERCIAL ", "Commercial"),
      ],
      [
        Markup.button.callback("AKRABI/ አቅራቢ ", "Akrabi"),
        Markup.button.callback("COOP / ዩኒየን", "Coop"),
      ],
      [
        Markup.button.callback("EXPORTER / ላኪ", "Exporter"),
        Markup.button.callback("BUYING AGENT / የውጭ ገዢ", "Buying Agent"),
      ],
    ])
  );

  if (sentMessage) {
    ctx.session.lastMessageId = sentMessage.message_id;
  }
}

function resetSession(session) {
  session.productName = null;
  session.productId = null;
  session.propertiesQueue = [];
  session.selectedValues = [];
  session.currentPropertyIndex = 0;
  session.step = null;
  session.expired = false; // Mark the session as active
}

async function confirmEditDiscardOnlyUser(ctx, session) {
  sentMessage = await ctx.reply(
    `To complete posting offer verify your choices:\n` +
      `Full Name: ${session.name}\n` +
      `Business Type: ${session.businessType}\n` +
      `Phone number: ${session.phone}\n`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Confirm",
              callback_data: "confirmUserToViewContact",
            },
            {
              text: "Edit",
              callback_data: "editUserToViewContact",
            },
            { text: "Discard", callback_data: "discardWithoutUser" },
          ],
        ],
      },
    }
  );

  if (sentMessage) {
    ctx.session.lastMessageId = sentMessage.message_id;
  }
}

async function confirmEditDiscardWithoutUser(ctx, session) {
  console.log("WWWW", session.selectedValues);

  sentMessage = await ctx.reply(
    `Please confirm the following information provided:\nProduct Name: ${session.productName}\n` +
      session.selectedValues
        .map((item) => `${item.property}: ${item.value}`)
        .join("\n") +
      `\nQuantity: ${session.quantity}  ${session.metrics} \n`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Confirm", callback_data: "confirmWithoutUser" },
            { text: "Edit", callback_data: "editWithoutUser" },
            { text: "Discard", callback_data: "discardWithoutUser" },
          ],
        ],
      },
    }
  );

  if (sentMessage) {
    ctx.session.lastMessageId = sentMessage.message_id;
  }
}

async function confirmEditDiscardWithUser(ctx, session) {
  sentMessage = await ctx.reply(
    `To complete posting offer verify your choices:\nProduct Name: ${session.productName}\n` +
      `Full Name: ${session.name}\n` +
      `Business Type: ${session.businessType}\n` +
      `Phone number: ${session.phone}\n` +
      session.selectedValues
        .map((item) => `${item.property}: ${item.value}`)
        .join("\n") +
      `\nQuantity: ${session.quantity} ${session.metrics}\n`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Confirm", callback_data: "confirmWithUser" },
            { text: "Edit", callback_data: "editWithUser" },
            { text: "Discard", callback_data: "discardWithoutUser" },
          ],
        ],
      },
    }
  );

  if (sentMessage) {
    ctx.session.lastMessageId = sentMessage.message_id;
  }
}

module.exports = {
  measurement,
  BusinessTypeMenu,
  measurementForEdit,
  resetSession,
  confirmEditDiscardOnlyUser,
  confirmEditDiscardWithoutUser,
  confirmEditDiscardWithUser,
};
