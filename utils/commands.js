const { Telegraf, Markup, session } = require("telegraf");
const LocalSession = require("telegraf-session-local");
const { callbackQuery } = require("telegraf/filters");
const { GetProduct } = require("./GetProducts");
const { checkUser } = require("../services/userServices");
const { fetchPropertyByProduct } = require("../services/productServices");
const {
  processNextProperty,
  processProperty,
  processPropertyForEdit,
} = require("./GetProperties");
const {
  measurementForEdit,
  measurement,
  resetSession,
  BusinessTypeMenu,
  confirmEditDiscardOnlyUser,
  confirmEditDiscardWithoutUser,
  confirmEditDiscardWithUser,
  confirmEditDiscardOnlyUserForPerf,
} = require("./constants");
const { processEditChoices, EditUser } = require("./EditChoice");
const {
  confirmWithoutUser,
  confirmWithUser,
  confirmUser,
} = require("./Confirm");
const { viewContact, viewFullContact } = require("./ViewContact");
const {
  fetchDependentValue,
  fetchPropertyNamebyId,
} = require("../services/productServices");
const {
  setpreferenceuser,
  getPreferenceProduct,
  fetchPreferences,
  deletePreference,
  saveRating,
} = require("../services/preferenceServies");

let selectedProducts = [];
let selectedPreference = [];

const categoryId = 18;
// const categoryId = 2;

function command(bot) {
  const phoneNumRegExp = /((^(\+251|0)(9|7)\d{2})-?\d{6})$/;
  const localSession = new LocalSession({ database: "session_db.json" });
  bot.use(localSession.middleware());

  bot.start(async (ctx) => {
    ctx.session = {};

    const startPayload = ctx.startPayload;
    ctx.session.offerId = startPayload;

    if (ctx.session.lastMessageId) {
      try {
        await ctx.telegram.deleteMessage(
          ctx.chat.id,
          ctx.session.lastMessageId
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
    } else if (ctx.chat.id != -1001737871127) {
      sentMessage = await ctx.reply(
        "Welcome to the commodities platform! To post a buy/sell offer, please select the button below / እንኳን ወደሸቀጦች መገበያያ መድረክ በደህና መጡ! ለመግዛት/ለመሸጥ፣ እባክዎ ከታች ያለውን ቁልፍ ይምረጡ:",
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

      const sentMessage = await ctx.reply(
        "Please choose the offer type / እባክዎ አይነቱን ይምረጡ:",
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "BUY", callback_data: "buy" },
                { text: "SELL", callback_data: "sell" },
              ],
            ],
          },
        }
      );

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
        "Sorry, there was an error processing your request. Please try again later. / ይቅርታ፣ ጥያቄዎ አልተሳካም። እባክዎ ትንሽ ቆይተው ይሞክሩ"
      );
    }
  });

  bot.command("set_preference", async (ctx) => {
    if (ctx.chat.id !== -1001737871127) {
      const preferenceProduct = await getPreferenceProduct(categoryId);

      if (preferenceProduct && preferenceProduct.length > 0) {
        const formattedProducts = preferenceProduct.map((product) => {
          const isSelected = selectedProducts.includes(product.id);
          return {
            text: `${isSelected ? "✅ " : ""}${product.name}`,
            callback_data: `Preference_product_${product.id}`,
          };
        });

        const formattedButtons = [];
        for (let i = 0; i < formattedProducts.length; i += 2) {
          formattedButtons.push(formattedProducts.slice(i, i + 2));
        }

        // Ensure the "Done" button is added correctly
        formattedButtons.push([{ text: "Done", callback_data: "done" }]);

        const inlineKeyboard = {
          reply_markup: {
            inline_keyboard: formattedButtons,
          },
        };

        await ctx.reply(
          "Please select a product for which you would like to receive information / እባክዎ መረጃ መቀበል ለሚፈልጉትን የምርት አይነት ይምረጡ።:",
          inlineKeyboard
        );
      }
    }
  });

  bot.command("remove_preference", async (ctx) => {
    if (ctx.chat.id !== -1001737871127) {
      try {
        const user = await checkUser(ctx.chat.id);
        if (!user) {
          return ctx.reply(
            "User not found. Please register first/እባክዎ ለመቀጠል መጀመሪያ ይመዝገቡ."
          );
        }
        session.userId = user.id;
        const preferenceList = await fetchPreferences(user.id, categoryId);
        if (!preferenceList || preferenceList.length === 0) {
          return ctx.reply(
            "No preferences found to remove/ለማስወገድ ምንም ምርጫዎች አልተገኙም."
          );
        }

        const formattedPreference = preferenceList.map((preference) => {
          const isSelected = selectedPreference.includes(preference.id);
          return {
            text: `${isSelected ? "✅ " : ""}${preference.product.name}`,
            callback_data: `Preference_selected_${preference.id}`,
          };
        });

        const formattedButtons = [];
        for (let i = 0; i < formattedPreference.length; i += 2) {
          formattedButtons.push(formattedPreference.slice(i, i + 2));
        }

        // Ensure the "Done" button is added correctly
        formattedButtons.push([{ text: "Done", callback_data: "doneDel" }]);

        const inlineKeyboard = {
          reply_markup: {
            inline_keyboard: formattedButtons,
          },
        };
        bot.command("set_preference", async (ctx) => {
          const preferenceProduct = await getPreferenceProduct(categoryId);

          if (preferenceProduct && preferenceProduct.length > 0) {
            const formattedProducts = preferenceProduct.map((product) => {
              const isSelected = selectedProducts.includes(product.id);
              return {
                text: `${isSelected ? "✅ " : ""}${product.name}`,
                callback_data: `Preference_product_${product.id}`,
              };
            });

            const formattedButtons = [];
            for (let i = 0; i < formattedProducts.length; i += 2) {
              formattedButtons.push(formattedProducts.slice(i, i + 2));
            }

            // Ensure the "Done" button is added correctly
            formattedButtons.push([{ text: "Done", callback_data: "done" }]);

            const inlineKeyboard = {
              reply_markup: {
                inline_keyboard: formattedButtons,
              },
            };

            await ctx.reply(
              "Please select a product for which you would like to receive information / መረጃ ሊቀበሉ የሚፈልጉትን ምርት ይምረጡ:",
              inlineKeyboard
            );
          }
        });

        bot.command("remove_preference", async (ctx) => {
          try {
            const user = await checkUser(ctx.chat.id);
            if (!user) {
              return ctx.reply(
                "User not found. Please register first. / እባክዎ ለመቀጠል መጀመሪያ ይመዝገቡ"
              );
            }
            session.userId = user.id;
            const preferenceList = await fetchPreferences(user.id, categoryId);
            if (!preferenceList || preferenceList.length === 0) {
              return ctx.reply(
                "No preferences found to remove. / ለማስወገድ ምንም ምርጫዎች አልተገኙም"
              );
            }

            const formattedPreference = preferenceList.map((preference) => {
              const isSelected = selectedPreference.includes(preference.id);
              return {
                text: `${isSelected ? "✅ " : ""}${preference.product.name}`,
                callback_data: `Preference_selected_${preference.id}`,
              };
            });

            const formattedButtons = [];
            for (let i = 0; i < formattedPreference.length; i += 2) {
              formattedButtons.push(formattedPreference.slice(i, i + 2));
            }

            // Ensure the "Done" button is added correctly
            formattedButtons.push([{ text: "Done", callback_data: "doneDel" }]);

            const inlineKeyboard = {
              reply_markup: {
                inline_keyboard: formattedButtons,
              },
            };

            await ctx.reply(
              "Choose a preference / ምርጫዎን ይምረጡ:",
              inlineKeyboard
            );
          } catch (error) {
            console.error("Error in remove_preference command:", error);
            ctx.reply(
              "An error occurred. Please try again later. / ችግር ስለተፈጠረ በድጋሚ ይሞክሩ"
            );
          }
        });

        await ctx.reply("Choose a preference/ምርጫዎን ይምረጡ:", inlineKeyboard);
      } catch (error) {
        console.error("Error in remove_preference command:", error);
        ctx.reply(
          "An error occurred. Please try again later/ይቅርታ፣ ጥያቄዎ አልተሳካም። እባክህ ትንሽ ቆይተው ይሞክሩ."
        );
      }
    }
  });

  bot.on("callback_query", async (ctx) => {
    const { data } = ctx.callbackQuery;
    const { session } = ctx;
    const chatId = ctx.callbackQuery.message.chat.id;
    const messageId = ctx.callbackQuery.message.message_id;
    if (data.startsWith("product_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      session.isValue = false;
      const productId = data.split("_")[1];
      const productName = data.split("_")[2];

      session.productName = productName;
      session.productId = productId;

      try {
        const properties = await fetchPropertyByProduct(session.productId);
        session.propertiesQueue = properties;
        session.currentPropertyIndex = 0;
        await processNextProperty(ctx);
      } catch (error) {
        ctx.reply("Failed to fetch property / መረጃውን ማግኛት አልተቻለም");
      }
    } else if (data.startsWith("Preference_product_")) {
      const productId = parseInt(data.split("_")[2], 10); // Convert productId to an integer

      session.preferenceProductId = productId;

      const preferenceProduct = await getPreferenceProduct(categoryId);

      if (selectedProducts.includes(productId)) {
        selectedProducts = selectedProducts.filter((id) => id !== productId); // Remove from selectedProducts
      } else {
        selectedProducts.push(productId); // Add to selectedProducts
      }

      const updatedProducts = preferenceProduct.map((product) => {
        const isSelected = selectedProducts.includes(product.id);
        return {
          text: `${isSelected ? "✅ " : ""}${product.name}`,
          callback_data: `Preference_product_${product.id}`,
        };
      });

      const updatedButtons = [];
      for (let i = 0; i < updatedProducts.length; i += 2) {
        updatedButtons.push(updatedProducts.slice(i, i + 2));
      }

      // Ensure the "Done" button is added correctly
      updatedButtons.push([{ text: "Done", callback_data: "done" }]);

      // Only update if the markup has changed
      try {
        const currentMarkup =
          ctx.callbackQuery.message.reply_markup.inline_keyboard;

        if (JSON.stringify(updatedButtons) !== JSON.stringify(currentMarkup)) {
          await ctx.editMessageReplyMarkup({
            inline_keyboard: updatedButtons,
          });
        }
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    } else if (data === "done") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const preferenceProduct = await getPreferenceProduct(categoryId);

      const user = await checkUser(ctx.chat.id);

      const selectedProductNames = preferenceProduct
        .filter((product) => selectedProducts.includes(product.id))
        .map((product) => product.name);

      session.preferenceProductNames = selectedProductNames;

      if (!user) {
        ctx.reply(
          "Register first and save preference. / በመጀመሪያ ይመዝገቡ፣ በመቀጠል ምርጫዎን ያስቀምጡ"
        );
        ctx.reply("Enter your name. / ስም ያስግቡ");
        session.step = "waitingForNameToSelectPreference";
      } else {
        session.UserID = user.id; // Ensure the session is updated with the user ID

        // Loop through selectedProducts and call setpreferenceuser for each one
        let allPreferencesSaved = true; // Flag to track if all preferences are saved
        let preferenceAlreadyExists = false; // Flag to track if any preference already exists

        for (const productId of selectedProducts) {
          try {
            await setpreferenceuser(user.id, categoryId, productId);
          } catch (error) {
            allPreferencesSaved = false; // Set the flag to false if an error occurs

            // Check if the error message contains 'Preference already exists'
            if (
              error.response &&
              error.response.data.message === "Preference already exists"
            ) {
              preferenceAlreadyExists = true; // Set flag to true if any preference exists
            } else {
              ctx.reply(
                `Error saving preference for product with ID ${productId}. / ለ${productId} መለያ ቁጥር የምርት የመመዝግብ ሂደቱ አልተሳካም`
              );
            }

            console.error("Error setting Preference: ", error);
          }
        }

        // After the loop, only send the success message if all preferences were saved successfully
        if (allPreferencesSaved) {
          ctx.reply(
            `Saved Preferences / የተመዘገቡ ምርጫዎች: ${selectedProductNames.join(
              ", "
            )}`
          );
        }

        // If any preference already existed, print the message once
        if (preferenceAlreadyExists) {
          ctx.reply(
            `One or more preferences already exist. / አንድ ወይም ከአንድ በላይ ምርጫዎች ከዚህ በፊት ተመዝግበዋል`
          );
        }
      }
    } else if (data.startsWith("Preference_selected_")) {
      const preferenceId = parseInt(data.split("_")[2], 10);

      const user = await checkUser(ctx.chat.id);
      if (!user) {
        return ctx.reply("User not found. Please register first.");
      }

      if (selectedPreference.includes(preferenceId)) {
        // Unselect the preference
        session.selectedPreference = selectedPreference.filter(
          (id) => id !== preferenceId
        );
      } else {
        // Select the preference
        selectedPreference.push(preferenceId);
      }

      // Update the inline keyboard
      const preferenceList = await fetchPreferences(user.id, categoryId);
      const updatedPreferences = preferenceList.map((preference) => {
        const isSelected = selectedPreference.includes(preference.id);
        return {
          text: `${isSelected ? "✅ " : ""}${preference.product.name}`,
          callback_data: `Preference_selected_${preference.id}`,
        };
      });

      const updatedButtons = [];
      for (let i = 0; i < updatedPreferences.length; i += 2) {
        updatedButtons.push(updatedPreferences.slice(i, i + 2));
      }

      updatedButtons.push([{ text: "Done", callback_data: "doneDel" }]);

      try {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: updatedButtons,
        });
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    } else if (data === "doneDel") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const user = await checkUser(ctx.chat.id);
      if (!user) {
        return ctx.reply("User not found. Please register first.");
      }
      // Delete unselected preferences
      const preferenceList = await fetchPreferences(user.id, categoryId);
      const selectedPreferences = preferenceList.filter((preference) =>
        selectedPreference.includes(preference.id)
      );

      for (const preference of selectedPreferences) {
        await deletePreference(preference.id);
      }

      ctx.reply(
        `Deleted Preferences / የተሰረዙ ምርጫዎች: ${selectedPreferences
          .map((pref) => pref.product.name)
          .join(", ")}`
      );
    } else if (
      data.startsWith("edit_value_") &&
      session.step === "waitingForPropertyValueEdit"
    ) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const propertyId = data.split("_")[2];
      const valueId = data.split("_")[3];
      const valueName = data.split("_")[4];
      const hasDependentValue = data.split("_")[5];
      const property = session.propertiesQueue[session.currentPropertyIndex];

      const existingPropertyIndex = session.selectedValues.findIndex(
        (item) => item.property === property.name
      );

      if (existingPropertyIndex !== -1) {
        session.selectedValues[existingPropertyIndex].value = valueName;
      } else {
        session.selectedValues.push({
          property: property.name,
          value: valueName,
        });
      }
      if (hasDependentValue === "true" || hasDependentValue === true) {
        const dependentValues = await fetchDependentValue(
          valueId,
          session.productId
        );

        if (dependentValues.length > 0) {
          const productPropertyId = dependentValues[0].productPropertyId;
          const propertyName = await fetchPropertyNamebyId(productPropertyId);
          const newPropertyNameValue =
            propertyName.length > 0 ? propertyName[0].name : null;

          const formattedDependentValues = dependentValues.map((value) => {
            const truncatedValue =
              Buffer.byteLength(value.value, "utf-8") > 40
                ? value.value.slice(0, Math.floor(40 / 2)) + "..."
                : value.value;

            let callbackData = `edit_dependent_value_${value.id}_${truncatedValue}`;

            if (Buffer.byteLength(callbackData, "utf-8") > 64) {
              callbackData = callbackData.slice(0, Math.floor(64 / 2));
            }

            return {
              text: truncatedValue,
              callback_data: callbackData,
            };
          });

          const inlineKeyboard = {
            reply_markup: {
              inline_keyboard: formattedDependentValues
                .map((v, i) =>
                  i % 2 === 0 ? formattedDependentValues.slice(i, i + 2) : null
                )
                .filter(Boolean),
            },
          };

          session.dependentValueName = newPropertyNameValue;

          const dependentMessage = await ctx.reply(
            `Please choose a dependent value for ${newPropertyNameValue}:`,
            inlineKeyboard
          );

          if (dependentMessage) {
            ctx.session.lastMessageId = dependentMessage.message_id;
          }
          return;
        }
      } else {
        // Handle case when there's no dependent value
        if (session.currentPropertyIndex >= session.propertiesQueue.length) {
          // If all properties have been processed, call measurement
          if (!session.quantity) {
            measurement(ctx);
            session.step = "waitingForMetric";
          } else {
            measurement(ctx);
            session.step = "waitingForMetric";
          }
        } else {
          confirmEditDiscardWithoutUser(ctx, session);
        }
      }
    } else if (
      data.startsWith("edit_value_") &&
      session.step === "waitingForPropertyValueEdit2"
    ) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const valueId = data.split("_")[3];
      const valueName = data.split("_")[4];
      const hasDependentValue = data.split("_")[5];
      const property = session.propertiesQueue[session.currentPropertyIndex];

      const existingPropertyIndex = session.selectedValues.findIndex(
        (item) => item.property === property.name
      );

      if (existingPropertyIndex !== -1) {
        session.selectedValues[existingPropertyIndex].value = valueName;
      } else {
        session.selectedValues.push({
          property: property.name,
          value: valueName,
        });
      }
      if (hasDependentValue) {
        const dependentValues = await fetchDependentValue(
          valueId,
          session.productId
        );

        if (dependentValues.length > 0) {
          const productPropertyId = dependentValues[0].productPropertyId;
          const propertyName = await fetchPropertyNamebyId(productPropertyId);
          const newPropertyNameValue =
            propertyName.length > 0 ? propertyName[0].name : null;

          const formattedDependentValues = dependentValues.map((value) => {
            const truncatedValue =
              Buffer.byteLength(value.value, "utf-8") > 40
                ? value.value.slice(0, Math.floor(40 / 2)) + "..."
                : value.value;

            let callbackData = `forNewUser_edit_dependent_value_${value.id}_${truncatedValue}`;

            if (Buffer.byteLength(callbackData, "utf-8") > 64) {
              callbackData = callbackData.slice(0, Math.floor(64 / 2));
            }

            return {
              text: truncatedValue,
              callback_data: callbackData,
            };
          });

          const inlineKeyboard = {
            reply_markup: {
              inline_keyboard: formattedDependentValues
                .map((v, i) =>
                  i % 2 === 0 ? formattedDependentValues.slice(i, i + 2) : null
                )
                .filter(Boolean),
            },
          };

          session.dependentValueName = newPropertyNameValue;

          const dependentMessage = await ctx.reply(
            `Please choose a dependent value for ${newPropertyNameValue}:`,
            inlineKeyboard
          );

          if (dependentMessage) {
            ctx.session.lastMessageId = dependentMessage.message_id;
          }
          return;
        }
      } else {
        confirmEditDiscardWithUser(ctx, session);
      }
    } else if (data.startsWith("select_value_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      session.isValue = true;
      const valueName = data.split("_")[4];
      const valueId = data.split("_")[3];
      const propertyId = data.split("_")[2];
      const hasDependentValue = data.split("_")[5];
      const propertyName = data.split("_")[6];

      ctx.session.valueId = valueId;
      ctx.session.valueName = valueName;
      ctx.session.propertyId = propertyId;

      // Ensure session.selectedValues is an array if not already
      session.selectedValues = session.selectedValues || [];

      // Push the new selection without resetting the array
      session.selectedValues.push({
        property: propertyName,
        value: valueName,
        valueId: valueId,
        hasDependentValue: hasDependentValue,
      });

      await processNextProperty(ctx);
    } else if (data.startsWith("select_dependent_value_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

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

      measurement(ctx);
    } else if (data.startsWith("edit_dependent_value_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const dependentValueName = data.split("_")[4];
      const dependentValueId = data.split("_")[3];
      const propertyId = data.split("_")[2];

      ctx.session.dependentValueId = dependentValueId;
      ctx.session.dependentValueName = dependentValueName;
      const existingIndex = session.selectedValues.findIndex(
        (item) => item.property === `${propertyId}`
      );

      if (existingIndex !== -1) {
        session.selectedValues[existingIndex] = {
          property: `${propertyId}`,
          value: dependentValueName,
          valueId: dependentValueId,
        };
      } else {
        session.selectedValues.push({
          property: `${propertyId}`,
          value: dependentValueName,
          valueId: dependentValueId,
        });
      }

      confirmEditDiscardWithoutUser(ctx, session);
    } else if (data.startsWith("forNewUser_edit_dependent_value_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const dependentValueName = data.split("_")[5];
      const dependentValueId = data.split("_")[4];
      const propertyId = data.split("_")[3];

      ctx.session.dependentValueId = dependentValueId;
      ctx.session.dependentValueName = dependentValueName;

      const existingIndex = session.selectedValues.findIndex(
        (item) => item.property === `${propertyId}`
      );

      if (existingIndex !== -1) {
        session.selectedValues[existingIndex] = {
          property: `${propertyId}`,
          value: dependentValueName,
          valueId: dependentValueId,
        };
      } else {
        session.selectedValues.push({
          property: `${propertyId}`,
          value: dependentValueName,
          valueId: dependentValueId,
        });
      }

      confirmEditDiscardWithUser(ctx, session);
    } else if (data === "piece" || data === "quintal" || data === "m3") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      session.metrics = data;
      ctx.reply("Please enter a quantity / እባክዎ መጠኑን ያስገቡ:");
      session.step = "waitingForQuantity";
    } else if (data === "editWithoutUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      session.isNewUser = false;
      await processEditChoices(ctx);
    } else if (data === "editWithUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      session.isNewUser = true;
      await processEditChoices(ctx);
    } else if (data === "editUserToViewContact") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      await EditUser(ctx);
    } else if (data === "edit_username_to_viewContact") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("Enter your full name / ሙሉ ስምዎን ያስገቡ: ");
      session.step = "waitingForEditedNameToViewContact";
    } else if (data === "edit_phoneNumber_to_viewContact") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("Enter your Phone number / ስልክ ቁጥርዎን ያስገቡ: ");
      session.step = "waitingForEditedPhoneToViewContact";
    } else if (data === "edit_businessType_to_viewContact") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      BusinessTypeMenu(ctx);
      session.step = "waitingForEditedBusinessTypeToViewContact";
    } else if (session.step === "waitingForBusinessTypeToSelectPreference") {
      confirmEditDiscardOnlyUserForPerf(ctx, session);
    } else if (data.startsWith("edit_property_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const propertyId = data.split("_")[2];
      const propertyName = data.split("_")[3];
      session.propertyNameEdit = propertyName;

      const propertyIndex = session.propertiesQueue
        ? session.propertiesQueue.findIndex(
            (p) => p.id.toString() === propertyId && p.name === propertyName
          )
        : -1;

      if (propertyIndex !== -1) {
        session.currentPropertyIndex = propertyIndex;
        await processPropertyForEdit(ctx, propertyIndex, true);
      } else {
        ctx.reply(
          `${propertyName} property not found. / የ${propertyName} መረጃ አልተገኘም`
        );
      }
    } else if (data.startsWith("edit_propertyWithuser_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const propertyId = data.split("_")[2];
      const propertyName = data.split("_")[3];
      session.propertyNameEdit = propertyName;

      const propertyIndex = session.propertiesQueue
        ? session.propertiesQueue.findIndex(
            (p) => p.id.toString() === propertyId && p.name === propertyName
          )
        : -1;

      if (propertyIndex !== -1) {
        session.currentPropertyIndex = propertyIndex;
        await processPropertyForEdit(ctx, propertyIndex, true, true);
      } else {
        ctx.reply(
          `${propertyName} property not found. / የ${propertyName} መረጃ አልተገኘም`
        );
      }
    } else if (data === "edit_metrics") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      measurementForEdit(ctx);
      session.step = "waitingForMetricEditWithoutUser";
    } else if (data === "edit_metricsWithUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      measurementForEdit(ctx);
      session.step = "waitingForMetricEditWithUser";
    } else if (session && session.step === "waitingForMetricEditWithoutUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      session.metrics = data.split("_")[1];

      confirmEditDiscardWithoutUser(ctx, session);
      session.step = "waitingForConfirmationWithoutUser";
    } else if (session && session.step === "waitingForMetricEditWithUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      session.metrics = data.split("_")[1];
      confirmEditDiscardWithUser(ctx, session);
      session.step = "waitingForConfirmationWithoutUser";
    } else if (data === "edit_quantity") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("enter the quantity / መጠን ያስገቡ");
      session.step = "waitingForQuantity";
    } else if (data === "edit_quantityWithUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("enter the quantity / መጠን ያስገቡ");
      session.step = "waitingForQuantityEdit";
    } else if (data === "edit_username") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("enter your full name / ሙሉ ስምዎን ያስገቡ:");
      session.step = "waitingForNameEdit";
    } else if (data === "edit_username_to_viewContact") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("enter your full name / ሙሉ ስምዎን ያስገቡ:");
      session.step = "waitingForNameEditToViewContact";
    } else if (data === "edit_phoneNumber") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("enter your Phone number / ስልክ ቁጥርዎን ያስገቡ: ");
      session.step = "waitingForPhoneEdit";
    } else if (data === "edit_businessType") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      BusinessTypeMenu(ctx);
      session.step = "waitingForEditedBusiness";
    } else if (data === "discardWithoutUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("Discarded / ተሰርዟል");
      resetSession(session);
    } else if (
      data === "Smallholder" ||
      data === "Commercial" ||
      data === "Akrabi" ||
      data === "Coop" ||
      data === "Exporter" ||
      data === "Buying Agent"
    ) {
      await ctx.telegram.deleteMessage(chatId, messageId);
      session.businessType = data;
      if (session.step === "waitingForEditedBusinessTypeToViewContact") {
        confirmEditDiscardOnlyUser(ctx, session);
      } else if (session.step === "waitingForEditedBusiness") {
        confirmEditDiscardWithUser(ctx, session);
      } else if (session.step === "waitingForBusinessTypeToViewContact") {
        ctx.reply(
          "Please accept our terms and conditions / እባክዎ ውል አና ሁኔታዎቻችንን ይቀበሉ\nhttps://telegra.ph/Terms-Conditions-and-Privacy-Statement-01-11",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Accept / ተቀበል",
                    callback_data: "acceptToViewContact",
                  },
                  { text: "Decline / ሰርዝ", callback_data: "decline" },
                ],
              ],
            },
          }
        );
      }
    } else if (data.startsWith("viewDetails_")) {
      await ctx.telegram.deleteMessage(chatId, messageId);

      const user = await checkUser(ctx.chat.id);
      if (!user) {
        ctx.reply("Enter your name. / ስም ያስግቡ");
        session.step = "waitingForNameToViewContact";
      } else {
        await viewFullContact(bot, ctx);
      }
    } else if (data.startsWith("rating_")) {
      const infoId = data.split("_")[1];
      const ratingValue = data.split("_")[2];

      session.infoId = infoId;
      session.ratingValue = ratingValue;

      // Remove the inline keyboard buttons by setting reply_markup to null
      await ctx.telegram.editMessageReplyMarkup(chatId, messageId, null, {
        reply_markup: null,
      });

      // Ask the user if they want to add an additional comment
      ctx.reply(
        "Do you want to add additional comment? / አስታየት ማክሰን ትፈልጋለህ? ",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Yes", callback_data: "WaitingForComment" }],
              [{ text: "No", callback_data: "NoComment" }],
            ],
          },
        }
      );
    } else if (data === "NoComment") {
      await ctx.telegram.deleteMessage(chatId, messageId);
      try {
        const user = await checkUser(ctx.chat.id);
        await saveRating(session.ratingValue, null, user.id, session.infoId);
        ctx.reply("Rating saved / አስታየት ተመዝግቧል");
      } catch (error) {
        console.error("Error Saving Rating", error);
      }
    } else if (data === "WaitingForComment") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      ctx.reply("Enter the comment you want to add / የፈለጉትን አስታየት ያስገቡ: ");
      session.step = "WaitingForCommentText";
    }
    if (data === "accept") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      try {
        confirmEditDiscardWithUser(ctx, session);
      } catch (error) {
        console.error("Error handling accept callback:", error);
        ctx.reply(
          "An error occurred while processing your request. Please try again later. / ችግር ስለተፈጠረ በድጋሚ ይሞክሩ"
        );
      }
    }
    if (data === "acceptToViewContact") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      try {
        confirmEditDiscardOnlyUser(ctx, session);

        session.step = "waitingForConfirmationWithUser";
      } catch (error) {
        console.error("Error handling accept callback:", error);
        ctx.reply(
          "An error occurred while processing your request. Please try again later. / ችግር ስለተፈጠረ በድጋሚ ይሞክሩ"
        );
      }
    } else if (data === "confirmWithoutUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      await confirmWithoutUser(ctx, session);
    } else if (data === "confirmWithUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      await confirmWithUser(ctx, session);
    } else if (data === "confirmUser") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      await confirmUser(ctx, session);
    } else if (data === "confirmUserToSetPref") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      await confirmUser(ctx, session);
      const user = await checkUser(ctx.chat.id);
      let allPreferencesSaved = true; // Flag to track if all preferences are saved
      let preferenceAlreadyExists = false; // Flag to track if any preference already exists

      for (const productId of selectedProducts) {
        try {
          await setpreferenceuser(user.id, categoryId, productId);
        } catch (error) {
          allPreferencesSaved = false; // Set the flag to false if an error occurs

          // Check if the error message contains 'Preference already exists'
          if (
            error.response &&
            error.response.data.message === "Preference already exists"
          ) {
            preferenceAlreadyExists = true; // Set flag to true if any preference exists
          } else {
            ctx.reply(
              `Error saving preference for product with ID ${productId}. / ለ${productId} መለያ ቁጥር የምርት የመመዝግብ ሂደቱ አልተሳካም`
            );
          }

          console.error("Error setting Preference: ", error);
        }
      }

      // After the loop, only send the success message if all preferences were saved successfully
      if (allPreferencesSaved) {
        ctx.reply(
          `Saved Preferences / የተመዘገቡ ምርጫዎች: ${session.preferenceProductNames.join(
            ", "
          )}`
        );
      }

      // If any preference already existed, print the message once
      if (preferenceAlreadyExists) {
        ctx.reply(
          `One or more preferences already exist. / አንድ ወይም ከአንድ በላይ ምርጫዎች ከዚህ በፊት ተመዝግበዋል`
        );
      }
    } else if (data === "confirmUserToViewContact") {
      await ctx.telegram.deleteMessage(chatId, messageId);

      await confirmUser(ctx, session);
      await viewFullContact(bot, ctx);
    } else if (session && session.step === "waitingForBusinessType") {
      // await ctx.telegram.deleteMessage(chatId, messageId);

      session.businessType = data;
      await ctx.reply(
        "Please accept our terms and conditions / እባክዎ ውል አና ሁኔታዎቻችንን ይቀበሉ\nhttps://telegra.ph/Terms-Conditions-and-Privacy-Statement-01-11",
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Accept / ተቀበል", callback_data: "accept" },
                { text: "Decline / ሰርዝ", callback_data: "decline" },
              ],
            ],
          },
        }
      );
      session.step = "accept";
    }
  });
  bot.on("text", async (ctx) => {
    if (ctx.chat.id !== -1001737871127) {
      //new one

      const { text } = ctx.message;
      const { session } = ctx;

      if (
        session.step !== "waitingForQuantity" &&
        session.step !== "waitingForQuantityEdit" &&
        session.step !== "WaitingForCommentText" &&
        session.step != "waitingForName" &&
        session.step !== "waitingForNameToViewContact" &&
        session.step !== "waitingForNameToSelectPreference" &&
        session.step !== "waitingForPhoneToSelectPreference" &&
        session.step != "waitingForNameEdit" &&
        session.step != "waitingForEditedNameToViewContact" &&
        session.step != "waitingForNameEditToViewContact" &&
        session.step != "waitingForPhone" &&
        session.step != "waitingForEditedPhoneToViewContact" &&
        session.step != "waitingForPhoneToViewContact" &&
        session.step != "waitingForPhoneEdit"
      ) {
        ctx.reply("You can't enter a text. / ፅሁፍ ማስገባት አይችሉም");
      } else {
        if (session) {
          switch (session.step) {
            case "WaitingForCommentText":
              session.comment = text;

              try {
                const user = await checkUser(ctx.chat.id);

                await saveRating(
                  session.ratingValue,
                  session.comment,
                  user.id,
                  session.infoId
                );
                ctx.reply("Rating Saved / አስታየት ተመዝግቧል");
              } catch (error) {
                console.error("Error Saving Rating", error);
              }
              break;
            case "waitingForQuantity":
              const quantity = text;

              if (isNaN(quantity)) {
                ctx.reply("Please enter only numbers. / ቁጥር ብቻ ያስገቡ");
                return; // Exit early if it's not a number
              }

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
                  ctx.reply("Enter your name. / ስም ያስግቡ");
                  ctx.session.step = "waitingForName";
                }
              } catch (error) {
                console.error("Error checking user registration:", error);
                ctx.reply(
                  "An error occurred while checking user registration. Please try again later. / ምዝገባለይ ችግር ስለተፈጠረ በድጋሚ ይሞክሩ"
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
                  "Phone number id Invalid. Please enter valid phone number / ያስገቡት ስልክ ቁጥር ትክክል አይደለም። እባኮን በድጋሚ ይሞክሩ"
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
              const quantity1 = text;

              // Check if the input is a valid number
              if (isNaN(quantity1)) {
                ctx.reply("Please enter only numbers. / ቁጥር ብቻ ያስገቡ");
                return; // Exit early if it's not a number
              }

              session.quantity = quantity1;

              confirmEditDiscardWithUser(ctx, session);
              session.step = "waitingForConfirmationWithoutUser";

              break;

            case "waitingForName":
              session.name = text;
              ctx.reply("enter your Phone number / ስልክ ቁጥርዎን ያስገቡ: ");
              session.step = "waitingForPhone";
              break;
            case "waitingForPhone":
              session.phone = text;
              if (phoneNumRegExp.test(session.phone)) {
                BusinessTypeMenu(ctx);
                session.step = "waitingForBusinessType";
              } else {
                ctx.reply(
                  "Phone number id Invalid. Please enter valid phone number / ያስገቡት ስልክ ቁጥር ትክክል አይደለም። እባኮን በድጋሚ ይሞክሩ"
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
                  "Phone number id Invalid. Please enter valid phone number / ያስገቡት ስልክ ቁጥር ትክክል አይደለም። እባኮን በድጋሚ ይሞክሩ"
                );
              }
              break;
            case "waitingForNameToViewContact":
              session.name = text;
              ctx.reply("enter your Phone number / ስልክ ቁጥርዎን ያስገቡ:");
              session.step = "waitingForPhoneToViewContact";
              break;
            case "waitingForNameToSelectPreference":
              session.name = text;
              ctx.reply("Enter Phone number. / ስልኮትን ያስገቡ");
              session.step = "waitingForPhoneToSelectPreference";
              break;
            case "waitingForPhoneToViewContact":
              session.phone = text;
              if (phoneNumRegExp.test(session.phone)) {
                BusinessTypeMenu(ctx);
                session.step = "waitingForBusinessTypeToViewContact";
              } else {
                ctx.reply(
                  "Phone number id Invalid. Please enter valid phone number / ያስገቡት ስልክ ቁጥር ትክክል አይደለም። እባኮን በድጋሚ ይሞክሩ"
                );
              }
              break;
            case "waitingForPhoneToSelectPreference":
              session.phone = text;
              if (phoneNumRegExp.test(session.phone)) {
                BusinessTypeMenu(ctx);
                session.step = "waitingForBusinessTypeToSelectPreference";
              } else {
                ctx.reply(
                  "Phone number id Invalid. Please enter valid phone number / ያስገቡት ስልክ ቁጥር ትክክል አይደለም። እባኮን በድጋሚ ይሞክሩ"
                );
              }
              break;
          }
        }
      }
    }
  });
}

module.exports = { command };
