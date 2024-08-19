const { Telegraf, Markup, session } = require("telegraf");
const LocalSession = require("telegraf-session-local");
const { callbackQuery } = require("telegraf/filters");
const { GetProduct } = require("./GetProducts");
const { checkUser } = require("../services/userServices");
const { fetchPropertyByProduct } = require("../services/productServices");
const { processNextProperty, processProperty } = require("./GetProperties");
const {
  measurementForEdit,
  measurement,
  resetSession,
  BusinessTypeMenu,
  confirmEditDiscardOnlyUser,
  confirmEditDiscardWithoutUser,
  confirmEditDiscardWithUser,
} = require("./constants");
const { processEditChoices, EditUser } = require("./EditChoice");

function command(bot) {
  bot.telegram.setMyCommands([{ command: "start", description: "Start" }]);
  const phoneNumRegExp = /((^(\+251|0)(9|7)\d{2})-?\d{6})$/;
  const localSession = new LocalSession({ database: "session_db.json" });
  bot.use(localSession.middleware());

  bot.start(async (ctx) => {
    const startPayload = ctx.startPayload;
    ctx.session.offerId = startPayload;

    if (ctx.session.lastMessageId) {
      try {
        await ctx.telegram.deleteMessage(
          ctx.chat.id,
          ctx.session.lastMessageId
        );
        console.log(
          `Deleted previous message with ID: ${ctx.session.lastMessageId}`
        );
      } catch (error) {
        if (error.response && error.response.error_code === 400) {
          console.error(
            `Failed to delete old message: ${error.response.description}`
          );
        } else {
          console.error("Failed to delete old message:", error);
        }
        ctx.session.lastMessageId = null;
      }
    }

    let sentMessage;
    if (startPayload) {
      await viewContact(bot, ctx);
    } else if (ctx.chat.id != "-1002078753064") {
      sentMessage = await ctx.reply(
        "Welcome to the commodities platform! To post a buy/sell offer, please select the button below:",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Post Offer", callback_data: "post_offer" }],
            ],
          },
        }
      );
    }
    if (sentMessage) {
      ctx.session.lastMessageId = sentMessage.message_id;
    }
  });

  bot.action("post_offer", async (ctx) => {
    try {
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id
      );

      const sentMessage = await ctx.reply("Please choose the offer type:", {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "BUY", callback_data: "buy" },
              { text: "SELL", callback_data: "sell" },
            ],
          ],
        },
      });

      if (sentMessage) {
        ctx.session.lastMessageId = sentMessage.message_id;
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  });

  bot.action(["sell", "buy"], async (ctx) => {
    try {
      await ctx.telegram.deleteMessage(
        ctx.chat.id,
        ctx.callbackQuery.message.message_id
      );
      ctx.session.offerType = ctx.callbackQuery.data;
      await GetProduct(bot, ctx);
    } catch (error) {
      console.error("Failed to delete message:", error);
      await ctx.reply(
        "Sorry, there was an error processing your request. Please try again later."
      );
    }
  });

  bot.on("callback_query", async (ctx) => {
    const { data } = ctx.callbackQuery;
    const { session } = ctx;

    if (data.startsWith("product_")) {
      session.isValue = false;
      const productId = data.split("_")[1];
      const productName = data.split("_")[2];
      session.productName = productName;
      session.productId = productId;

      try {
        console.log(session.productName);
        const properties = await fetchPropertyByProduct(session.productId);
        session.propertiesQueue = properties;
        session.currentPropertyIndex = 0;
        console.log("Properties queue", session.propertiesQueue);
        await processNextProperty(ctx);
      } catch (error) {
        console.error("Failed to fetch property: ", error);
        ctx.reply("Failed to fetch property");
      }
    } else if (
      data.startsWith("select_value_") &&
      session.step === "waitingForPropertyValueEdit"
    ) {
      console.log("object");
      console.log(session.currentPropertyIndex);
      const valueName = data.split("_")[4];
      const property = session.propertiesQueue[session.currentPropertyIndex];
      console.log("Property ", property);
      console.log(property.name);

      const existingPropertyIndex = session.selectedValues.findIndex(
        (item) => item.property === property.name
      );

      if (existingPropertyIndex !== -1) {
        session.selectedValues[existingPropertyIndex].value = valueName;
        console.log("Updated selectedValue:", {
          property: property.name,
          value: valueName,
        });
      } else {
        session.selectedValues.push({
          property: property.name,
          value: valueName,
        });
        console.log("Added selectedValue:", {
          property: property.name,
          value: valueName,
        });
      }

      confirmEditDiscardWithoutUser(ctx, session);
    } else if (
      data.startsWith("select_value_") &&
      session.step === "waitingForPropertyValueEdit2"
    ) {
      console.log(session.currentPropertyIndex);
      const valueName = data.split("_")[4];
      const property = session.propertiesQueue[session.currentPropertyIndex];
      console.log("Property ", property);
      console.log(property.name);

      const existingPropertyIndex = session.selectedValues.findIndex(
        (item) => item.property === property.name
      );

      if (existingPropertyIndex !== -1) {
        session.selectedValues[existingPropertyIndex].value = valueName;
        console.log("Updated selectedValue:", {
          property: property.name,
          value: valueName,
        });
      } else {
        session.selectedValues.push({
          property: property.name,
          value: valueName,
        });
        console.log("Added selectedValue:", {
          property: property.name,
          value: valueName,
        });
      }

      confirmEditDiscardWithUser(ctx, session);
    } else if (data.startsWith("select_value_")) {
      session.isValue = true;
      const valueName = data.split("_")[4];
      const valueId = data.split("_")[3];
      const propertyId = data.split("_")[2];
      const hasDependentValue = data.split("_")[5];
      const propertyName = data.split("_")[6];

      ctx.session.valueId = valueId;
      ctx.session.valueName = valueName;
      ctx.session.propertyId = propertyId;
      session.selectedValues = [];

      session.selectedValues.push({
        property: propertyName,
        value: valueName,
        valueId: valueId,
        hasDependentValue: hasDependentValue,
      });
      console.log("Added selectedValue:", {
        property: propertyName,
        value: valueName,
        hasDependentValue: hasDependentValue,
      });

      await processNextProperty(ctx);
    } else if (data.startsWith("select_dependent_value_")) {
      // Handle the selection of a dependent value
      const dependentValueName = data.split("_")[4];
      const dependentValueId = data.split("_")[3];
      const propertyId = data.split("_")[2];

      ctx.session.dependentValueId = dependentValueId;
      ctx.session.dependentValueName = dependentValueName;

      session.selectedValues.push({
        property: `${propertyId}`,
        value: dependentValueName,
        valueId: dependentValueId,
      });

      console.log("Added dependentValue:", {
        property: `Dependent of ${propertyId}`,
        value: dependentValueName,
      });
      measurement(ctx);
      //   await processNextProperty(ctx);
    } else if (data === "piece" || data === "quintal" || data === "m3") {
      session.metrics = data;
      ctx.reply("Please enter a quantity:");
      session.step = "waitingForQuantity";
    } else if (data === "editWithoutUser") {
      session.isNewUser = false;
      isEdit = true;
      await processEditChoices(ctx);
    } else if (data === "editWithUser") {
      session.isNewUser = true;
      await processEditChoices(ctx);
    } else if (data === "editUserToViewContact") {
      await EditUser(ctx);
    } else if (data === "edit_username_to_viewContact") {
      ctx.reply("Enter your full name: ");
      session.step = "waitingForEditedNameToViewContact";
    } else if (data === "edit_phoneNumber_to_viewContact") {
      ctx.reply("Enter your Phone number: ");
      session.step = "waitingForEditedPhoneToViewContact";
    } else if (data === "edit_businessType_to_viewContact") {
      BusinessTypeMenu(ctx);
      session.step = "waitingForEditedBusinessTypeToViewContact";
    } else if (data.startsWith("edit_property_")) {
      const propertyId = data.split("_")[2];
      const propertyName = data.split("_")[3];
      session.propertyNameEdit = propertyName;
      console.log("Property Name:", propertyName);
      console.log("Property Id:", propertyId);

      const propertyIndex = session.propertiesQueue
        ? session.propertiesQueue.findIndex(
            (p) => p.id.toString() === propertyId && p.name === propertyName
          )
        : -1;

      if (propertyIndex !== -1) {
        session.currentPropertyIndex = propertyIndex;
        await processProperty(ctx, propertyIndex, true);
      } else {
        ctx.reply(`${propertyName} property not found.`);
      }
    } else if (data.startsWith("edit_propertyWithuser_")) {
      const propertyId = data.split("_")[2];
      const propertyName = data.split("_")[3];
      session.propertyNameEdit = propertyName;
      console.log("Property Name:", propertyName);
      console.log("Property Id:", propertyId);

      const propertyIndex = session.propertiesQueue
        ? session.propertiesQueue.findIndex(
            (p) => p.id.toString() === propertyId && p.name === propertyName
          )
        : -1;

      if (propertyIndex !== -1) {
        session.currentPropertyIndex = propertyIndex;
        await processProperty(ctx, propertyIndex, true, true);
      } else {
        ctx.reply(`${propertyName} property not found.`);
      }
    } else if (data === "edit_metrics") {
      measurementForEdit(ctx);
      session.step = "waitingForMetricEditWithoutUser";
    } else if (data === "edit_metricsWithUser") {
      measurementForEdit(ctx);
      session.step = "waitingForMetricEditWithUser";
    } else if (session && session.step === "waitingForMetricEditWithoutUser") {
      session.metrics = data.split("_")[1];

      confirmEditDiscardWithoutUser(ctx, session);
      session.step = "waitingForConfirmationWithoutUser";
    } else if (session && session.step === "waitingForMetricEditWithUser") {
      session.metrics = data.split("_")[1];
      confirmEditDiscardWithUser(ctx, session);
      session.step = "waitingForConfirmationWithoutUser";
    } else if (data === "edit_quantity") {
      ctx.reply("enter the quantity");
      session.step = "waitingForQuantity";
    } else if (data === "edit_quantityWithUser") {
      ctx.reply("enter the quantity");
      session.step = "waitingForQuantityEdit";
    } else if (data === "edit_username") {
      ctx.reply("enter your full name");
      session.step = "waitingForNameEdit";
    } else if (data === "edit_username_to_viewContact") {
      ctx.reply("enter your full name");
      session.step = "waitingForNameEditToViewContact";
    } else if (data === "edit_phoneNumber") {
      ctx.reply("enter your Phone number");
      session.step = "waitingForPhoneEdit";
    } else if (data === "edit_businessType") {
      BusinessTypeMenu(ctx);
      session.step = "waitingForEditedBusiness";
    } else if (data === "discardWithoutUser") {
      ctx.reply("Discarded");
      resetSession(session);
    } else if (
      data === "Smallholder" ||
      data === "Commercial" ||
      data === "Akrabi" ||
      data === "Coop" ||
      data === "Exporter" ||
      data === "Buying Agent"
    ) {
      session.businessType = data;
      if (session.step === "waitingForEditedBusinessTypeToViewContact") {
        confirmEditDiscardOnlyUser(ctx, session);
      } else if (session.step === "waitingForEditedBusiness") {
        confirmEditDiscardWithUser(ctx, session);
      } else {
        ctx.reply("Accept terms and condition", {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Accept", callback_data: "acceptToViewContact" },
                { text: "Decline", callback_data: "decline" },
              ],
            ],
          },
        });
      }
    } else if (data.startsWith("viewDetails_")) {
      const user = await checkUser(ctx.chat.id);
      if (!user) {
        ctx.reply("Enter your name");
        session.step = "waitingForNameToViewContact";
      } else {
        await viewFullContact(bot, ctx);
      }
    }
    if (data === "accept") {
      try {
        confirmEditDiscardWithUser(ctx, session);
      } catch (error) {
        console.error("Error handling accept callback:", error);
        ctx.reply(
          "An error occurred while processing your request. Please try again later."
        );
      }
    }
    if (data === "acceptToViewContact") {
      try {
        confirmEditDiscardOnlyUser(ctx, session);

        session.step = "waitingForConfirmationWithUser";
      } catch (error) {
        console.error("Error handling accept callback:", error);
        ctx.reply(
          "An error occurred while processing your request. Please try again later."
        );
      }
    }
  });
  bot.on("text", async (ctx) => {
    const { text } = ctx.message;
    const { session } = ctx;

    if (
      session.step !== "waitingForQuantity" &&
      session.step !== "waitingForQuantityEdit" &&
      session.step != "waitingForName" &&
      session.step !== "waitingForNameToViewContact" &&
      session.step != "waitingForNameEdit" &&
      session.step != "waitingForEditedNameToViewContact" &&
      session.step != "waitingForNameEditToViewContact" &&
      session.step != "waitingForPhone" &&
      session.step != "waitingForEditedPhoneToViewContact" &&
      session.step != "waitingForPhoneToViewContact" &&
      session.step != "waitingForPhoneEdit"
    ) {
      ctx.reply("you cant enter a text");
    } else {
      if (session) {
        switch (session.step) {
          case "waitingForQuantity":
            const quantity = text;
            session.quantity = quantity;

            try {
              const user = await checkUser(ctx.chat.id);

              if (user) {
                session.businessType = user.business_type;
                session.username = user.name;
                session.phoneNumber = user.contact_information;
                confirmEditDiscardWithoutUser(ctx, session);
                session.step = "waitingForConfirmationWithoutUser";
              } else {
                ctx.reply("Enter your name");
                ctx.session.step = "waitingForName";
              }
            } catch (error) {
              console.error("Error checking user registration:", error);
              ctx.reply(
                "An error occurred while checking user registration. Please try again later."
              );
            }
            break;
          case "waitingForEditedNameToViewContact":
            session.name = text;
            confirmEditDiscardOnlyUser(ctx, session);
            session.step = "waitingForConfirmationWithoutUser";
            break;
          case "waitingForEditedPhoneToViewContact":
            session.phone = text;
            if (phoneNumRegExp.test(session.phone)) {
              confirmEditDiscardOnlyUser(ctx, session);
            } else {
              ctx.reply(
                "Phone number id Invalid. Please enter valid phone number"
              );
            }
            session.step = "waitingForConfirmationWithoutUser";
            break;
          case "waitingForNameEdit":
            session.name = text;

            confirmEditDiscardWithUser(ctx, session);
            session.step = "waitingForConfirmationWithoutUser";
            break;

          case "waitingForQuantityEdit":
            session.quantity = text;

            confirmEditDiscardWithUser(ctx, session);
            session.step = "waitingForConfirmationWithoutUser";

            break;

          case "waitingForName":
            session.name = text;
            ctx.reply("enter your Phone number");
            session.step = "waitingForPhone";
            break;
          case "waitingForPhone":
            session.phone = text;
            if (phoneNumRegExp.test(session.phone)) {
              BusinessTypeMenu(ctx);
              session.step = "waitingForBusinessType";
            } else {
              ctx.reply(
                "Phone number id Invalid. Please enter valid phone number"
              );
            }
            break;
          case "waitingForPhoneEdit":
            session.phone = text;
            if (phoneNumRegExp.test(session.phone)) {
              confirmEditDiscardWithUser(ctx, session);
              session.step = "waitingForConfirmationWithoutUser";
            } else {
              ctx.reply(
                "Phone number id Invalid. Please enter valid phone number"
              );
            }
            break;
          case "waitingForNameToViewContact":
            session.name = text;
            ctx.reply("enter your Phone number");
            session.step = "waitingForPhoneToViewContact";
            break;
          case "waitingForPhoneToViewContact":
            session.phone = text;
            if (phoneNumRegExp.test(session.phone)) {
              BusinessTypeMenu(ctx);
              session.step = "waitingForBusinessTypeToViewContact";
            } else {
              ctx.reply(
                "Phone number id Invalid. Please enter valid phone number"
              );
            }
            break;
        }
      }
    }
  });
}

module.exports = { command };
