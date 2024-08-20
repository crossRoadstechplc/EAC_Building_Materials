const { saveOffer } = require("../services/productServices");
const { sendItemToGroup } = require("./SendtoGroup");
const { registerUser } = require("../services/userServices");
const { resetSession } = require("./constants");

async function confirmWithoutUser(ctx, session) {
  try {
    console.log(session.productName);
    const classProperty = session.selectedValues.find(
      (val) => val.property === "Class"
    );
    const typeProperty = session.selectedValues.find(
      (val) => val.property === "Type"
    );
    const gradeProperty = session.selectedValues.find(
      (val) => val.property === "Grade"
    );
    const regionProperty = session.selectedValues.find(
      (val) => val.property === "Region"
    );

    console.log(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" +
        JSON.stringify(session)
    );

    const offerData = {
      product_name: session.productName,
      measurement: session.metrics,
      quantity: session.quantity,
      status: true,
      sent: false,
      offer_type: session.offerType,
      user_name: session.username,
      phone_number: session.phoneNumber,
      business_type: session.businessType,
      chat_id: ctx.chat.id,
    };
    console.log("Offer Data: ", offerData);

    if (classProperty) offerData.class = classProperty.value;
    if (typeProperty) offerData.type = typeProperty.value;
    if (gradeProperty) offerData.grade = gradeProperty.value;
    if (regionProperty) offerData.region = regionProperty.value;

    console.log("Offer Data: 12", offerData);

    const result = await saveOffer(offerData);

    console.log("Offer Data: 77", offerData);

    offerData.id = result.offer.id;

    await sendItemToGroup(ctx, offerData, session);

    await ctx.reply("Offer posted successfully!");

    resetSession(ctx);
  } catch (error) {
    console.error("Error posting offer:", error);
    await ctx.reply(
      "An error occurred while posting your offer. Please try again later."
    );
  }
}

async function confirmWithUser(ctx, session) {
  try {
    "name:", session.name;
    "business_type:", session.businessType;
    "contact_information:", session.contact_information;
    "chat_id:", ctx.chat.id;

    await registerUser(
      session.name,
      session.businessType,
      1,
      session.phone,
      ctx.chat.id
    );
    try {
      const classProperty = session.selectedValues.find(
        (val) => val.property === "Class"
      );
      const typeProperty = session.selectedValues.find(
        (val) => val.property === "Type"
      );
      const gradeProperty = session.selectedValues.find(
        (val) => val.property === "Grade"
      );
      const regionProperty = session.selectedValues.find(
        (val) => val.property === "Region"
      );
      const offerData = {
        product_name: session.productName,
        measurement: session.metrics,
        quantity: session.quantity,
        // price: session.price,
        status: true,
        sent: false,
        offer_type: session.offerType,
        user_name: session.name,
        phone_number: session.phone,
        business_type: session.businessType,
        chat_id: ctx.chat.id,
      };
      if (classProperty) offerData.class = classProperty.value;
      if (typeProperty) offerData.type = typeProperty.value;
      if (gradeProperty) offerData.grade = gradeProperty.value;
      if (regionProperty) offerData.region = regionProperty.value;

      const result = await saveOffer(offerData);
      result.offer["id"];

      offerData.id = result.offer["id"];

      await sendItemToGroup(ctx, offerData, session);
      ctx.reply("Offer posted successfully!");
      session.isNewUser = true;
      resetSession(ctx);
    } catch (error) {
      console.error("error posting offer");
    }
  } catch (error) {
    console.error("error registering user", error);
  }
}

async function confirmUser(ctx, session) {
  try {
    await registerUser(
      session.name,
      session.businessType,
      1,
      session.phone,
      ctx.chat.id
    );
  } catch (error) {
    console.error("error adding user ", error);
    ctx.reply("error registering user");
  }
}

module.exports = { confirmWithoutUser, confirmWithUser, confirmUser };
