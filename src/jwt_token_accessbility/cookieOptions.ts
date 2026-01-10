export const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === "true",
  sameSite: process.env.COOKIE_SAMESITE as
    | "lax"
    | "strict"
    | "none",
};
