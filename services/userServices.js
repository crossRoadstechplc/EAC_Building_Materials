const axios = require("axios");
// const spiceBaseUrl = "http://104.236.64.33:7050/api/UserService";
const spiceBaseUrl = "http://localhost:7050/api/UserService";

async function registerUser(
  name,
  business_type,
  termAndCondition,
  contact_information,
  chat_id
) {
  try {
    const response = await axios.post(`${spiceBaseUrl}/adduser`, {
      name,
      business_type,
      termAndCondition,
      contact_information,
      chat_id,
    });
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

async function checkUser(chat_id) {
  try {
    const response = await axios.get(
      `${spiceBaseUrl}/fetchuser?chat_id=${chat_id}`
    );

    console.log(response.data);
    if (response.data.exists) {
      return response.data.user;
    }
  } catch (error) {
    console.log("Error geting user: ", error);
    throw error;
  }
}

module.exports = {
  checkUser,
  registerUser,
};
