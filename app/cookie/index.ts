import { createCookie } from "@remix-run/node";

export const googleDriveToken = await createCookie("goog_drv_token", {
  maxAge: 604_800,
});
