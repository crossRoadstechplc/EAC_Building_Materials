const axios = require("axios");

const preferenceBaseUrl = "http://104.236.64.33:7050/api/Preference";

// const preferenceBaseUrl = "http://localhost:7050/api/Preference";

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

    return response.data.products;
  } catch (error) {
    console.error("Error getting Preference : ", error);
  }
}

async function fetchPreferences(userId, categoryId) {
  try {
    const response = await axios.get(
      `${preferenceBaseUrl}/fetchPreference?userId=${userId}&categoryId=${categoryId}`
    );
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
