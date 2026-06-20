import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AppShell } from "~/components/layout/AppShell";
import "~/styles/global.css";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sollicitaties Overzicht" },
      { name: "description", content: "Dagelijks overzicht van frontend vacatures" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="nl">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell>
          <Outlet />
        </AppShell>
        <Scripts />
      </body>
    </html>
  );
}
