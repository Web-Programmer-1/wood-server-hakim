import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Change based on your email provider
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

// Business identity. We authenticate with the working Gmail account
// (EMAIL_USER/EMAIL_PASS) but present the company address everywhere.
//
// NOTE: Gmail's SMTP rewrites the From address to the authenticated account
// unless info@ is added as a verified "Send mail as" alias. To make sure all
// replies still land in the company inbox regardless, we ALWAYS set Reply-To
// to the business address. EMAIL_FROM is honoured first so that switching to a
// real info@ mailbox later requires only an env change.
const FROM_NAME = process.env.EMAIL_FROM_NAME || "WoodTech Solution BD";
const FROM_ADDRESS =
  process.env.EMAIL_FROM || process.env.EMAIL_USER || "info@woodtechsolutionbd.com";
const DEFAULT_REPLY_TO =
  process.env.EMAIL_REPLY_TO ||
  process.env.BUSINESS_EMAIL ||
  "info@woodtechsolutionbd.com";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendEmailOptions = {
  attachments?: EmailAttachment[];
  replyTo?: string;
};

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  options?: SendEmailOptions
) {
  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
      replyTo: options?.replyTo || DEFAULT_REPLY_TO,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
      attachments: options?.attachments,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email error:", error);
    throw new Error("Failed to send email");
  }
}

// Send OTP Email with better formatting
export async function sendOTPEmail(email: string, otp: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .otp-box { background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Email Verification</h2>
        <p>Your OTP code is:</p>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, "Verify Your Email", `Your OTP is: ${otp}`, html);
}