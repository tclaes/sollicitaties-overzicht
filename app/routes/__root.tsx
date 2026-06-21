import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/AppShell";
import { LoginPagina } from "~/components/LoginPagina";
import { useAuth } from "~/lib/useAuth";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginPagina />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
