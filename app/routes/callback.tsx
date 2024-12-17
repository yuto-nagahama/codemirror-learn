import { HeadersFunction, LoaderFunction, redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/cookie";
import { encrypt } from "~/crypto/session.server";
import { getCredentials, getOAuthClient } from "~/oauth";

export const headers: HeadersFunction = () => ({
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
});

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());

  if ("code" in searchParams) {
    const oAuthClient = await getOAuthClient();
    const credentials = await getCredentials(oAuthClient, searchParams.code);
    const session = await getSession(request.headers.get("Cookie"));
    session.set("idToken", encrypt(credentials.id_token!));
    session.set("accessToken", encrypt(credentials.access_token!));

    return redirect("/", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  }

  return null;
};
