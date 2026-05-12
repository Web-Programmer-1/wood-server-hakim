



import axios from "axios";

export async function sendSMS(mobile: string, message: string) {
  const url = "https://console.smsq.global/api/v2/SendSMS";

  const senderId = process.env.SMS_SENDER;
  const apiKey = process.env.SMS_API_KEY;
  const clientId = process.env.SMS_CLIENT_ID;

  if (!senderId || !apiKey || !clientId) {
    throw new Error(
      `SMS provider not configured (missing ${[
        !senderId && "SMS_SENDER",
        !apiKey && "SMS_API_KEY",
        !clientId && "SMS_CLIENT_ID",
      ]
        .filter(Boolean)
        .join(", ")})`
    );
  }

  const params = {
    SenderId: senderId,
    Message: message,
    MobileNumbers: mobile,
    ApiKey: apiKey,
    ClientId: clientId,
  };

  try {
    const res = await axios.get(url, {
      params,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      timeout: 15_000,
    });

    // smsq.global returns ErrorCode !== 0 on failure even with HTTP 200,
    // so unwrap the provider response and throw if the message wasn't
    // accepted — otherwise the caller has no way to know the OTP didn't
    // actually go out.
    const data = res.data as { ErrorCode?: number; ErrorDescription?: string };
    if (data && typeof data === "object" && "ErrorCode" in data && data.ErrorCode !== 0) {
      throw new Error(
        `SMS provider rejected request (code ${data.ErrorCode}): ${
          data.ErrorDescription ?? "no description"
        }`
      );
    }

    console.log(`[sendSMS] OK → ${mobile}`, data);
    return data;
  } catch (err: any) {
    const providerMsg =
      err?.response?.data?.ErrorDescription ||
      (typeof err?.response?.data === "string" ? err.response.data : null) ||
      err?.message;
    console.error(`[sendSMS] FAILED → ${mobile}: ${providerMsg}`);
    throw new Error(`SMS send failed: ${providerMsg}`);
  }
}





// comment