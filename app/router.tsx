import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function createRouter() {
  return createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}

// Registreer het router type globaal zodat TanStack Router types klopt
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}

// Vereist door TanStack Start virtual module #tanstack-router-entry
export function getRouter() {
  return createRouter();
}
