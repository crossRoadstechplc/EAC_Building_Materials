const axios = require("axios");

//const spiceBaseUrl = "http://104.236.64.33:7050/api/UserService";

const preferenceBaseUrl = "http://localhost:7050/api/Preference";

async function setpreferenceuser(userId, categoryId, productId) {
  try {
    const response = await axios.post(`${preferenceBaseUrl}/savePreference`, {
      userId,
      categoryId,
      productId,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating preference:", error);
    throw error;
  }
}

async function getPreferenceProduct(categoryId) {
  try {
    const response = await axios.post(`${preferenceBaseUrl}/getproduct`, {
      categoryId,
    });
    console.log(response.data.products);

    return response.data.products;
  } catch (error) {
    console.error("getting somethin ledse");
  }
}

module.exports = {
  setpreferenceuser,
  getPreferenceProduct,
};
