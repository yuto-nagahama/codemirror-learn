import { useEffect, useRef, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import "./tailwind.css";
import pollingWorker from "./worker/polling-worker?worker";

export const links: LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const worker = useRef<Worker | null>(null);
  const [isSwInstalling, setIsSwInstalling] = useState(true);

  useEffect(() => {
    const workerStandby = async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration == null) {
          await navigator.serviceWorker.register("/sw.js");
          setIsSwInstalling(false);
        } else {
          await registration.update();
          setIsSwInstalling(false);
        }
      }

      if (worker.current == null) {
        worker.current = new pollingWorker({ name: "polling-worker" });
      }
    };
    workerStandby();

    return () => {
      worker.current?.terminate();
      worker.current = null;
    };
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="w-screen h-screen box-border p-8">
        {!isSwInstalling && children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
