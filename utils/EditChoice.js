async function processEditChoices(ctx) {
  const { session } = ctx;

  if (!session.isNewUser) {
    if (!session.propertiesQueue || session.propertiesQueue.length === 0) {
      const formattedButtons = session.propertiesQueue.map((property) => ({
        text: property.name,
        callback_data: `edit_property_${property.id}_${property.name}`,
      }));

      formattedButtons.push(
        { text: "Measurement ", callback_data: "edit_metrics" },
        { text: "Quantity", callback_data: "edit_quantity" }
      );

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: chunkArray(formattedButtons, 2), // Split into two columns
        },
      };

      sentMessage = await ctx.reply(
        `Choose a property to edit / የሚታደስ ይምረጡ:`,
        inlineKeyboard
      );
      if (sentMessage) {
        ctx.session.lastMessageId = sentMessage.message_id;
      }
      return;
    }

    const formattedButtons = session.propertiesQueue.map((property) => ({
      text: property.name,
      callback_data: `edit_property_${property.id}_${property.name}`,
    }));

    formattedButtons.push(
      { text: "Measurement ", callback_data: "edit_metrics" },
      { text: "Quantity", callback_data: "edit_quantity" }
    );

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: chunkArray(formattedButtons, 2), // Split into two columns
      },
    };

    sentMessage = await ctx.reply(
      `Choose a property to edit / የሚታደስ ይምረጡ:`,
      inlineKeyboard
    );
    if (sentMessage) {
      ctx.session.lastMessageId = sentMessage.message_id;
    }
  } else {
    if (!session.propertiesQueue || session.propertiesQueue.length === 0) {
      const formattedButtons = [
        ...session.propertiesQueue.map((property) => ({
          text: property.name,
          callback_data: `edit_propertyWithuser_${property.id}_${property.name}`,
        })),
        { text: "Measurement ", callback_data: "edit_metricsWithUser" },
        { text: "Quantity", callback_data: "edit_quantityWithUser" },
        { text: "Full Name", callback_data: "edit_username" },
        { text: "Phone Number", callback_data: "edit_phoneNumber" },
        { text: "Business Type", callback_data: "edit_businessType" },
      ];

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: chunkArray(formattedButtons, 2), // Split into two columns
        },
      };

      sentMessage = await ctx.reply(
        `Choose a Property to edit / የሚታደስ ይምረጡ:`,
        inlineKeyboard
      );

      if (sentMessage) {
        ctx.session.lastMessageId = sentMessage.message_id;
      }
      return;
    }

    const formattedButtons = [
      ...session.propertiesQueue.map((property) => ({
        text: property.name,
        callback_data: `edit_propertyWithuser_${property.id}_${property.name}`,
      })),
      { text: "Measurement ", callback_data: "edit_metricsWithUser" },
      { text: "Quantity", callback_data: "edit_quantityWithUser" },
      { text: "Full Name", callback_data: "edit_username" },
      { text: "Phone Number", callback_data: "edit_phoneNumber" },
      { text: "Business Type", callback_data: "edit_businessType" },
    ];

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: chunkArray(formattedButtons, 2), // Split into two columns
      },
    };

    sentMessage = await ctx.reply(
      `Choose a Property to edit / የሚታደስ ይምረጡ:`,
      inlineKeyboard
    );

    if (sentMessage) {
      ctx.session.lastMessageId = sentMessage.message_id;
    }
  }
}

// Function to chunk array into two-dimensional arrays for two columns
function chunkArray(array, size) {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
}

async function EditUser(ctx) {
  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Edit Username",
            callback_data: "edit_username_to_viewContact",
          },
        ],
        [
          {
            text: "Edit Phone Number",
            callback_data: "edit_phoneNumber_to_viewContact",
          },
        ],
        [
          {
            text: "Edit Business Type",
            callback_data: "edit_businessType_to_viewContact",
          },
        ],
      ],
    },
  };

  sentMessage = await ctx.reply(
    "Choose what you want to edit / እባኮ መቀየር የሚፈልጉትን ይምረጡ:",
    inlineKeyboard
  );

  if (sentMessage) {
    ctx.session.lastMessageId = sentMessage.message_id;
  }
}

module.exports = { processEditChoices, EditUser };
