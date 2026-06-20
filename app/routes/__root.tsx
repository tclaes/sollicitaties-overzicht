import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AppShell } from "~/components/layout/AppShell";
import { getAlleDatums } from "~/server/vacatures";
import "~/styles/global.css";

export const Route = createRootRoute({
  loader: async () => {
    const datums = await getAlleDatums();
    return { datums };
  },
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
  const { datums } = Route.useLoaderData();
  return (
    <html lang="nl">
      <head>
        <HeadContent />
      </head>
      <body>
        <AppShell datums={datums}>
          <Outlet />
        </AppShell>
        <Scripts />
      </body>
    </html>
  );
}
