// src/utils/bkash.ts
import axios from 'axios';

export const bkashHeaders = async (idToken?: string) => {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    authorization: idToken ? idToken : "",
    "x-app-key": process.env.BKASH_APP_KEY!,
  };
};

export const getBkashToken = async () => {
  try {
    const { data } = await axios.post(
      `${process.env.BKASH_BASE_URL}/token/grant`,
      {
        app_key: process.env.BKASH_APP_KEY,
        app_secret: process.env.BKASH_APP_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: process.env.BKASH_USERNAME!,
          password: process.env.BKASH_PASSWORD!,
        },
      }
    );

    return data.id_token; // This is the access token
  } catch (error: any) {
    throw new Error("Failed to get bKash token: " + (error.response?.data?.msg || error.message));
  }
};