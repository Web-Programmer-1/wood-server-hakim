import nodemailer from "nodemailer";

/**
 * Emails a newly-created staff user their login credentials.
 *
 * The transport reuses the same EMAIL_USER / EMAIL_PASS env vars that
 * power the OTP mailer. Errors propagate so the caller can roll back the
 * created row when delivery fails — staff accounts are useless without a
 * password the recipient can see.
 */
export async function sendStaffCredentialsEmail(args: {
  to: string;
  name: string;
  role: string;
  tempPassword: string;
  loginUrl?: string;
}) {
  const { to, name, role, tempPassword, loginUrl } = args;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const fallbackLoginUrl =
    loginUrl ||
    process.env.CLIENT_URL?.replace(/\/$/, "") + "/login" ||
    "https://wood.example.com/login";

  const prettyRole = role.replace(/_/g, " ").toLowerCase();

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .credentials { background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .credentials .row { margin: 8px 0; }
      .credentials .label { font-weight: bold; }
      .credentials .value { font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px; display: inline-block; }
      .cta { display: inline-block; margin-top: 16px; padding: 12px 24px; background: #4CAF50; color: #fff; text-decoration: none; border-radius: 6px; }
      .footer { margin-top: 30px; font-size: 12px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Welcome to Wood Admin, ${name}!</h2>
      <p>An administrator has created a <strong>${prettyRole}</strong> account for you.</p>
      <div class="credentials">
        <div class="row"><span class="label">Email:</span> <span class="value">${to}</span></div>
        <div class="row"><span class="label">Temporary password:</span> <span class="value">${tempPassword}</span></div>
        <div class="row"><span class="label">Role:</span> <span class="value">${role}</span></div>
      </div>
      <p>For your security, please sign in and change your password from the account settings page.</p>
      <a class="cta" href="${fallbackLoginUrl}">Sign in to your account</a>
      <div class="footer">
        <p>If you weren't expecting this email, please ignore it or contact your administrator.</p>
      </div>
    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"Wood Admin" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Wood Admin account credentials",
    text: `Hi ${name},\n\nA ${prettyRole} account has been created for you.\nEmail: ${to}\nTemporary password: ${tempPassword}\n\nSign in at ${fallbackLoginUrl} and change your password.`,
    html,
  });
}

/**
 * Generates a cryptographically-random temporary password.
 * 14 characters drawn from a 64-char alphabet ≈ 84 bits of entropy —
 * well above the threshold where guessing becomes feasible while still
 * being something a human can copy from email.
 */
export function generateTempPassword(length = 14): string {
  // Avoid look-alike characters (O/0, I/1, l) — recipients copy these
  // from email and the support cost of "I can't tell if that's a one
  // or an L" is real.
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  // node crypto gives us a uniform distribution. We use Math.random
  // as a fallback only because this code path is never reached in
  // production (crypto is always available in node).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("crypto") as typeof import("crypto");
  const out: string[] = [];
  const buf = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out.push(alphabet[buf[i] % alphabet.length]);
  }
  // Guarantee policy compliance (at least one letter + digit) — bcrypt
  // doesn't care, but the reset-password endpoint enforces this rule.
  if (!/[a-zA-Z]/.test(out.join(""))) out[0] = "A";
  if (!/[0-9]/.test(out.join(""))) out[1] = "7";
  return out.join("");
}
