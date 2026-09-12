import { useEffect, useRef } from "react";
import { createRootRoute, Outlet, useRouter } from "@tanstack/react-router";
import { AppShell } from "~/components/layout/AppShell";
import { LoginPage } from "~/components/login/LoginPage";
import { useAuth } from "~/lib/useAuth";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    // The router's loaders can run before sign-in completes (e.g. the very
    // first, unauthenticated app boot). Once auth actually resolves, force a
    // reload of the current route's data instead of leaving that stale/empty
    // pre-login result in place.
    if (user && !wasAuthenticated.current) {
      wasAuthenticated.current = true;
      void router.invalidate();
    }
    if (!user) {
      wasAuthenticated.current = false;
    }
  }, [user, router]);

  if (loading) return null;
  if (!user) return <LoginPage />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
