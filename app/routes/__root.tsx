import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/AppShell";
import { LoginPage } from "~/components/LoginPage";
import { useAuth } from "~/lib/useAuth";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginPage />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
