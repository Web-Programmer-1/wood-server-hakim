// import https from "https";

// export const sslCommerzHttpsAgent = new https.Agent({
//   rejectUnauthorized: false,
// });





import https from "https";

export const sslCommerzHttpsAgent =
  process.env.NODE_ENV === "production"
    ? undefined
    : new https.Agent({
        rejectUnauthorized: false,
      });
