import { createCookieSessionStorage } from "@remix-run/node";

const sessionCookie = await createCookieSessionStorage({
  cookie: {
    name: "goog_drv_token",
    sameSite: "strict",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 604_800,
    secrets: ["secrets"],
  },
});

export const { getSession, commitSession, destroySession } = sessionCookie;
