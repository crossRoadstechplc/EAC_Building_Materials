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
    console.log(response.data);
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
    console.log("------------------------------------------------");
    console.log(response.data.products);

    return response.data.products;
  } catch (error) {
    console.error("Error getting Preference : ", error);
  }
}

async function fetchPreferences(userId) {
  try {
    const response = await axios.get(
      `${preferenceBaseUrl}/fetchPreference?userId=${userId}`
    );
    console.log(response.data.preferences);
    return response.data.preferences;
  } catch (error) {
    console.error("Error gettung preferences: ", error);
  }
}

async function deletePreference(preferenceId) {
  try {
    const response = await axios.post(
      `${preferenceBaseUrl}/deletePreference?id=${preferenceId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting preference: ", error);
  }
}

async function saveRating(rating_value, comment, userId, informationId) {
  try {
    const response = await axios.post(`${preferenceBaseUrl}/saveRating`, {
      rating_value,
      comment,
      userId,
      informationId,
    });
    console.log(rating_value, comment, userId, informationId);
    return response.data;
  } catch (error) {
    console.error("Error Saving rating", error);
  }
}

module.exports = {
  setpreferenceuser,
  getPreferenceProduct,
  fetchPreferences,
  deletePreference,
  saveRating,
};
