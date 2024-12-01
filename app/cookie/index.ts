import { createCookie } from "@remix-run/node";

export const cookie = await createCookie("goog_drv_token", {
  maxAge: 604_800,
});
