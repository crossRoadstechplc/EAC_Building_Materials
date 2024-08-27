const {
  fetchValueByProperty,
  fetchDependentValue,
  fetchPropertyNamebyId,
} = require("../services/productServices");
const { measurement } = require("./constants");

async function processProperty(
  ctx,
  propertyIndex,
  isEdit = false,
  isEdit2 = false
) {
  const { session } = ctx;
  const property = session.propertiesQueue[propertyIndex];

  try {
    console.log("PROPERTY DETAILS : ", property);
    const values = await fetchValueByProperty(session.productId, property.id);

    console.log("Dependent value:  ", values.dependentValue);

    const formattedValues = values.map((value) => {
      const truncatedValue =
        Buffer.byteLength(value.value, "utf-8") > 40
          ? value.value.slice(0, Math.floor(40 / 2)) + "..."
          : value.value;

      let callbackData = `select_value_${property.id}_${value.id}_${truncatedValue}_${value.hasDependentValue}_${property.name}`;
      console.log(callbackData);
      if (Buffer.byteLength(callbackData, "utf-8") > 64) {
        callbackData = callbackData.slice(0, Math.floor(64 / 2));
      }

      return {
        text: truncatedValue, // Display truncated value if necessary
        callback_data: callbackData,
      };
    });

    const formattedButtons = [];
    for (let i = 0; i < formattedValues.length; i += 2) {
      formattedButtons.push(formattedValues.slice(i, i + 2));
    }

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: formattedButtons,
      },
    };

    const sentMessage = await ctx.reply(
      `Choose a value for ${property.name}:`,
      inlineKeyboard
    );
    session.propertyName = property.name;
    if (sentMessage) {
      ctx.session.lastMessageId = sentMessage.message_id;
    }

    if (isEdit && isEdit2) {
      session.step = "waitingForPropertyValueEdit2";
    } else if (isEdit) {
      console.log("RRRRRRR");
      session.step = "waitingForPropertyValueEdit";
    } else {
      session.step = "waitingForPropertyValue";
    }
  } catch (error) {
    console.error("Failed to fetch property values:", error);
    ctx.reply(
      `An error occurred while fetching values . Please try again later.`
    );
  }
}

async function processPropertyForEdit(
  ctx,
  propertyIndex,
  isEdit = false,
  isEdit2 = false
) {
  const { session } = ctx;
  const property = session.propertiesQueue[propertyIndex];
  console.log("property: ", property);

  try {
    console.log("PROPERTY DETAILS : ", property);
    const values = await fetchValueByProperty(session.productId, property.id);
    console.log("values: ", values);
    const formattedValues = values.map((value) => {
      const truncatedValue =
        Buffer.byteLength(value.value, "utf-8") > 40
          ? value.value.slice(0, Math.floor(40 / 2)) + "..."
          : value.value;

      let callbackData = `edit_value_${property.id}_${value.id}_${truncatedValue}_${value.hasDependentValue}_${property.name}`;
      console.log(callbackData);
      if (Buffer.byteLength(callbackData, "utf-8") > 64) {
        callbackData = callbackData.slice(0, Math.floor(64 / 2));
      }

      return {
        text: truncatedValue, // Display truncated value if necessary
        callback_data: callbackData,
      };
    });

    const formattedButtons = [];
    for (let i = 0; i < formattedValues.length; i += 2) {
      formattedButtons.push(formattedValues.slice(i, i + 2));
    }

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: formattedButtons,
      },
    };

    const sentMessage = await ctx.reply(
      `Choose a value for ${property.name}:`,
      inlineKeyboard
    );
    session.propertyName = property.name;
    if (sentMessage) {
      ctx.session.lastMessageId = sentMessage.message_id;
    }

    if (isEdit && isEdit2) {
      console.log("TTTTTTTTTT");
      session.step = "waitingForPropertyValueEdit2";
    } else if (isEdit) {
      console.log("RRRRRRR");
      session.step = "waitingForPropertyValueEdit";
    } else {
      session.step = "waitingForPropertyValue";
    }
  } catch (error) {
    console.error("Failed to fetch property values:", error);
    ctx.reply(
      `An error occurred while fetching values . Please try again later.`
    );
  }
}

async function processNextProperty(ctx) {
  const { session } = ctx;

  if (session.isValue === true) {
    const lastSelectedValue =
      session.selectedValues[session.selectedValues.length - 1];
    console.log("LAST SELECTED VALUE: ", lastSelectedValue);

    if (lastSelectedValue) {
      const hasDependentValue =
        lastSelectedValue.hasDependentValue === "true" ||
        lastSelectedValue.hasDependentValue === true;

      if (hasDependentValue) {
        console.log("VALUE ID : ", ctx.session.valueId);
        console.log("PRODUCT ID : ", ctx.session.productId);

        if (session.currentPropertyIndex > session.propertiesQueue.length) {
          if (!session.quantity) {
            measurement(ctx);
            session.step = "waitingForMetric";
          } else {
            measurement(ctx);
            session.step = "waitingForMetric";
          }
          return;
        }

        const dependentValues = await fetchDependentValue(
          ctx.session.valueId,
          session.productId
        );
        console.log("DEPENDENT VALUES : ", dependentValues);

        if (dependentValues.length > 0) {
          const productPropertyId = dependentValues[0].productPropertyId;
          const propertyName = await fetchPropertyNamebyId(productPropertyId);
          const propertyNameValue =
            propertyName.length > 0 ? propertyName[0].name : null;

          const formattedDependentValues = dependentValues.map((value) => {
            const truncatedValue =
              Buffer.byteLength(value.value, "utf-8") > 40
                ? value.value.slice(0, Math.floor(40 / 2)) + "..."
                : value.value;

            let callbackData = `select_dependent_value_${value.id}_${truncatedValue}`;

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

          console.log("PropertyNAMe : ", propertyNameValue);
          session.dependentValueName = propertyNameValue;

          const dependentMessage = await ctx.reply(
            `Please choose a dependent value for ${propertyNameValue}:`,
            inlineKeyboard
          );

          if (dependentMessage) {
            ctx.session.lastMessageId = dependentMessage.message_id;
          }
          return;
        }
      }

      console.log("NO DEPENDENT VALUE");
    }

    if (session.currentPropertyIndex >= session.propertiesQueue.length) {
      if (!session.quantity) {
        measurement(ctx);
        session.step = "waitingForMetric";
      } else {
        measurement(ctx);
        session.step = "waitingForMetric";
      }
      return;
    }
  } else {
    if (session.currentPropertyIndex >= session.propertiesQueue.length) {
      if (!session.quantity) {
        measurement(ctx);
        session.step = "waitingForMetric";
      } else {
        measurement(ctx);
        session.step = "waitingForMetric";
      }
      return;
    }

    const property = session.propertiesQueue[session.currentPropertyIndex];
    session.currentPropertyIndex++;

    sentMessage = await processProperty(ctx, session.currentPropertyIndex - 1);

    if (sentMessage) {
      ctx.session.lastMessageId = sentMessage.message_id;
    }
  }
}

module.exports = {
  processProperty,
  processNextProperty,
  processPropertyForEdit,
};
