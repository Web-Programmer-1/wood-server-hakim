



import axios from "axios";

export async function sendSMS(mobile: string, message: string) {
  const url = "https://smsp.piprahost.com/api/v2/SendSMS";

  const params = {
    SenderId: process.env.SMS_SENDER,
    Message: message,
    MobileNumbers: mobile,
    ApiKey: process.env.SMS_API_KEY,
    ClientId: process.env.SMS_CLIENT_ID,
  };

  const res = await axios.get(url, {
    params,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
  });

  return res.data;
}
