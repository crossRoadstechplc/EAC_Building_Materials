const axios = require("axios");
const buildingBaseUrl = "http://104.236.64.33:7050/api/BuildingMaterials";
// const buildingBaseUrl = "http://localhost:7051/api/BuildingMaterials";

async function saveOffer(
  product_name,
  brand_name,
  status,
  type,
  size,
  measurement,
  quantity,
  price,
  offer_type,
  user_name,
  phone_number,
  business_type,
  chat_id
) {
  try {
    const response = await axios.post(
      `${buildingBaseUrl}/postOffer`,
      product_name,
      brand_name,
      status,
      type,
      size,
      measurement,
      quantity,
      price,
      offer_type,
      user_name,
      phone_number,
      business_type,
      chat_id
    );
    return response.data;
  } catch (error) {
    console.error("Error posting offer:", error);
    throw error;
  }
}

async function fetchOffer(offerId) {
  try {
    const response = await axios.get(
      `${buildingBaseUrl}/fetchOffers?offerId=${offerId}`
    );

    if (response.status === 200) {
      return response.data;
    } else if (response.status === 404) {
      return null;
    } else {
    }
  } catch (error) {
    throw error;
  }
}
async function fetchProperty() {
  try {
    const response = await axios.get(`${buildingBaseUrl}/fetchProduct`);
    return response.data;
  } catch (error) {
    console.error("error fetching property: ", error);
  }
}

async function fetchPropertyByProduct(productId) {
  try {
    const response = await axios.get(
      `${buildingBaseUrl}/fetchPropertyByProduct?productId=${productId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching property for product ", error);
  }
}

async function fetchValueByProperty(productId, ProductPropertyId) {
  try {
    const response = await axios.get(
      `${buildingBaseUrl}/fetchPropertyValue?productId=${productId}&ProductPropertyId=${ProductPropertyId}`
    );
    return response.data;
  } catch (error) {
    console.error("error fetching value: ", error);
  }
}

async function fetchProduct() {
  try {
    const response = await axios.get(`${buildingBaseUrl}/fetchProduct`);
    return response.data;
  } catch (error) {
    console.error("error fetching product", error);
  }
}

async function saveInteraction(
  poster_name,
  poster_phone_number,
  poster_business_type,
  poster_chat_id,
  viewer_name,
  viewer_phone_number,
  viewer_business_type,
  viewer_chat_id,
  offerId
) {
  try {
    const response = await axios.post(`${buildingBaseUrl}/createInteraction`, {
      poster_name,
      poster_phone_number,
      poster_business_type,
      poster_chat_id,
      viewer_name,
      viewer_phone_number,
      viewer_business_type,
      viewer_chat_id,
      offerId,
    });
    return response.data;
  } catch (error) {
    console.error("Can't add to Interaction table :", error);
  }
}

async function fetchDependentValue(productPropertyValueId, productId) {
  try {
    const response = await axios.get(
      `${buildingBaseUrl}/fetchDependentPropertyValues?productPropertyValueId=${productPropertyValueId}&productId=${productId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting dependent value: ", error);
  }
}

async function fetchPropertyNamebyId(productPropertyId) {
  try {
    const response = await axios.get(
      `${buildingBaseUrl}/fetchPropertyNameById?productPropertyId=${productPropertyId}`
    );
    return response.data;
  } catch (error) {
    console.error("error getting property name :", error);
  }
}

module.exports = {
  saveOffer,
  fetchOffer,
  fetchProperty,
  fetchValueByProperty,
  fetchProduct,
  fetchPropertyByProduct,
  saveInteraction,
  fetchDependentValue,
  fetchPropertyNamebyId,
};
