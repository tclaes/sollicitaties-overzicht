/// <reference types="vitest/config" />
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {TanStackRouterVite} from "@tanstack/router-plugin/vite";

export default defineConfig({
    plugins: [
        TanStackRouterVite({
            routesDirectory: "app/routes",
            generatedRouteTree: "app/routeTree.gen.ts",
        }),
        react(),
    ],
    build: {
        outDir: "dist"
    },
    resolve: {
        tsconfigPaths: true
    },
    test: {
        environment: "jsdom",
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        exclude: ["**/node_modules/**", "e2e/**"],
    },
});
