import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/AppShell";
import { getAlleDatums } from "~/lib/vacatures";

export const Route = createRootRoute({
  loader: async () => {
    const datums = await getAlleDatums();
    return { datums };
  },
  component: RootComponent,
});

function RootComponent() {
  const { datums } = Route.useLoaderData();
  return (
    <AppShell datums={datums}>
      <Outlet />
    </AppShell>
  );
}
