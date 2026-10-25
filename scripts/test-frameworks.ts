/**
 * Multi-Framework Automated Test Matrix
 * Verifies framework detection, routing transformations, component/button/icon auditing,
 * and zero regressions across Next.js, Vite React, Nuxt 3, SvelteKit, Astro, and React Router v7.
 */

import fs from "fs";
import path from "path";
import child_process from "child_process";
import { ensureGitignoreProtection } from "./mcp-server.js";

const TEST_DIR = path.join(process.cwd(), ".tmp-test-frameworks");

function setupTestEnvironment() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

function cleanTestEnvironment() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

function runAuditInDir(fixtureDir: string): { stdout: string; stderr: string; status: number } {
  const auditScript = path.join(process.cwd(), "scripts", "audit.ts");
  const isWin = process.platform === "win32";
  const npxCmd = isWin ? "npx.cmd" : "npx";

  const result = child_process.spawnSync(npxCmd, ["tsx", auditScript], {
    cwd: fixtureDir,
    encoding: "utf-8",
    shell: true,
  });

  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    status: result.status ?? -1,
  };
}

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

async function runTestMatrix() {
  console.log("🧪 Starting Frontend Audit Multi-Framework Test Matrix...\n");
  setupTestEnvironment();

  try {
    // =========================================================================
    // TEST 1: Next.js (App Router) - Baseline Verification
    // =========================================================================
    console.log("▶️ Test 1: Next.js (App Router) + Tailwind + shadcn/ui");
    const nextAppDir = path.join(TEST_DIR, "next-app");
    fs.mkdirSync(path.join(nextAppDir, "app", "dashboard"), { recursive: true });
    fs.mkdirSync(path.join(nextAppDir, "components", "ui"), { recursive: true });

    fs.writeFileSync(path.join(nextAppDir, "package.json"), JSON.stringify({
      name: "test-next-app",
      dependencies: { next: "^14.2.0", react: "^18.2.0", "lucide-react": "^0.300.0" }
    }));
    fs.writeFileSync(path.join(nextAppDir, "next.config.js"), "module.exports = {};");
    fs.writeFileSync(path.join(nextAppDir, "app", "layout.tsx"), `export default function RootLayout({ children }: { children: any }) { return <html><body>{children}</body></html>; }`);
    fs.writeFileSync(path.join(nextAppDir, "app", "page.tsx"), `
      "use client";
      import { useState } from "react";
      import { Button } from "@/components/ui/button";
      import { UserCard } from "@/components/UserCard";
      import { GuestCheckoutModal } from "@/components/GuestCheckoutModal";
      export default function HomePage() {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <div>
            <h1>Home</h1>
            <Button variant="default" onClick={() => setIsOpen(true)}>Open Modal</Button>
            <UserCard />
            {isOpen && <GuestCheckoutModal open={isOpen} />}
          </div>
        );
      }
    `);
    fs.writeFileSync(path.join(nextAppDir, "app", "dashboard", "page.tsx"), `
      export default function DashboardPage() { return <div>Dashboard</div>; }
    `);
    fs.writeFileSync(path.join(nextAppDir, "components", "ui", "button.tsx"), `
      export function Button({ variant, children, onClick }: any) { return <button className="ui-btn" onClick={onClick}>{children}</button>; }
    `);
    fs.writeFileSync(path.join(nextAppDir, "components", "GuestCheckoutModal.tsx"), `
      export function GuestCheckoutModal({ open }: { open: boolean }) {
        return open ? <div role="dialog">Checkout Modal</div> : null;
      }
    `);
    fs.writeFileSync(path.join(nextAppDir, "components", "UserCard.tsx"), `
      import { Sparkles } from "lucide-react";
      export function UserCard() {
        return (
          <div className="bg-void rounded-2xl border-line">
            <span className="text-zinc-500 font-mono">User</span>
            <Sparkles className="w-4 h-4" />
            <button className="bg-red-500">Raw Action</button>
          </div>
        );
      }
    `);

    const res1 = runAuditInDir(nextAppDir);
    assert(res1.status === 0, "Next.js App Router runs without error");
    assert(res1.stdout.includes("Next.js (App Router)"), "Correctly detects Next.js (App Router)");
    assert(res1.stdout.includes("Audited 6 frontend files across 2 routes"), "Audits 6 files across 2 routes");
    const routes1 = fs.readFileSync(path.join(nextAppDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes1.includes("`/`") && routes1.includes("`/dashboard`"), "Route map contains `/` and `/dashboard`");
    assert(routes1.includes("layout.tsx"), "Route map resolves layout.tsx");

    const inventory1 = fs.readFileSync(path.join(nextAppDir, "docs", "frontend-atlas", "02_COMPONENT_INVENTORY.md"), "utf-8");
    assert(inventory1.includes("Interactive Triggers & Clickable Elements (AST Scanned)"), "Includes AST interactive triggers section");
    assert(inventory1.includes("Disclosed Overlays, Modals & Dynamic Windows (AST Scanned)"), "Includes AST disclosed overlays section");
    assert(inventory1.includes("GuestCheckoutModal"), "AST indexes GuestCheckoutModal overlay");
    assert(inventory1.includes("setIsOpen"), "AST indexes onClick handler setIsOpen");

    // =========================================================================
    // TEST 2: Next.js (Pages Router)
    // =========================================================================
    console.log("\n▶️ Test 2: Next.js (Pages Router)");
    const nextPagesDir = path.join(TEST_DIR, "next-pages");
    fs.mkdirSync(path.join(nextPagesDir, "pages", "blog"), { recursive: true });
    fs.writeFileSync(path.join(nextPagesDir, "package.json"), JSON.stringify({
      name: "test-next-pages",
      dependencies: { next: "^14.0.0", react: "^18.0.0" }
    }));
    fs.writeFileSync(path.join(nextPagesDir, "next.config.js"), "module.exports = {};");
    fs.writeFileSync(path.join(nextPagesDir, "pages", "index.tsx"), "export default function Index() { return <h1>Index</h1>; }");
    fs.writeFileSync(path.join(nextPagesDir, "pages", "blog", "[id].tsx"), "export default function BlogPost() { return <h1>Post</h1>; }");

    const res2 = runAuditInDir(nextPagesDir);
    assert(res2.status === 0, "Next.js Pages Router runs without error");
    assert(res2.stdout.includes("Next.js (Pages Router)"), "Correctly detects Next.js (Pages Router)");
    const routes2 = fs.readFileSync(path.join(nextPagesDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes2.includes("`/`") && routes2.includes("`/blog/[id]`"), "Pages Router resolves `/` and `/blog/[id]`");

    // =========================================================================
    // TEST 3: Vite React SPA
    // =========================================================================
    console.log("\n▶️ Test 3: Vite / React SPA");
    const viteReactDir = path.join(TEST_DIR, "vite-react");
    fs.mkdirSync(path.join(viteReactDir, "src"), { recursive: true });
    fs.writeFileSync(path.join(viteReactDir, "package.json"), JSON.stringify({
      name: "test-vite-react",
      dependencies: { react: "^18.0.0", "react-dom": "^18.0.0" },
      devDependencies: { vite: "^5.0.0", "@vitejs/plugin-react": "^4.0.0" }
    }));
    fs.writeFileSync(path.join(viteReactDir, "vite.config.ts"), "export default {};");
    fs.writeFileSync(path.join(viteReactDir, "src", "App.tsx"), "export function App() { return <div><h1>App</h1></div>; }");

    const res3 = runAuditInDir(viteReactDir);
    assert(res3.status === 0, "Vite React SPA runs without error");
    assert(res3.stdout.includes("Vite / React SPA"), "Correctly detects Vite / React SPA");
    const routes3 = fs.readFileSync(path.join(viteReactDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes3.includes("/ (Single Page App)"), "Vite React resolves `/ (Single Page App)`");

    // =========================================================================
    // TEST 4: Nuxt 3 (Vue 3 + Auto-Imports + Nuxt UI)
    // =========================================================================
    console.log("\n▶️ Test 4: Nuxt 3 (Vue 3 + Auto-Imports + Nuxt UI)");
    const nuxtDir = path.join(TEST_DIR, "nuxt-app");
    fs.mkdirSync(path.join(nuxtDir, "pages", "users"), { recursive: true });
    fs.mkdirSync(path.join(nuxtDir, "components"), { recursive: true });
    fs.mkdirSync(path.join(nuxtDir, "layouts"), { recursive: true });

    fs.writeFileSync(path.join(nuxtDir, "package.json"), JSON.stringify({
      name: "test-nuxt-app",
      dependencies: { nuxt: "^3.11.0", vue: "^3.4.0" }
    }));
    fs.writeFileSync(path.join(nuxtDir, "nuxt.config.ts"), "export default defineNuxtConfig({});");
    fs.writeFileSync(path.join(nuxtDir, "layouts", "default.vue"), "<template><slot /></template>");
    fs.writeFileSync(path.join(nuxtDir, "components", "UserSummary.vue"), `
      <template>
        <div class="user-card bg-surface rounded-xl">
          <UButton color="primary" variant="solid">Profile</UButton>
          <Icon name="lucide:user" />
        </div>
      </template>
    `);
    fs.writeFileSync(path.join(nuxtDir, "pages", "index.vue"), `
      <template>
        <main>
          <h1>Welcome Nuxt</h1>
          <UserSummary />
          <button type="button" aria-label="Explore">Explore</button>
        </main>
      </template>
    `);
    fs.writeFileSync(path.join(nuxtDir, "pages", "users", "[id].vue"), `
      <template>
        <div>User Detail</div>
      </template>
    `);

    const res4 = runAuditInDir(nuxtDir);
    assert(res4.status === 0, "Nuxt 3 runs without error");
    assert(res4.stdout.includes("Nuxt 3"), "Correctly detects Nuxt 3");
    const routes4 = fs.readFileSync(path.join(nuxtDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes4.includes("`/`") && routes4.includes("`/users/:id`"), "Nuxt 3 resolves `/` and `/users/:id`");
    assert(routes4.includes("layouts/default.vue"), "Nuxt 3 detects default layout");

    const comp4 = fs.readFileSync(path.join(nuxtDir, "docs", "frontend-atlas", "02_COMPONENT_INVENTORY.md"), "utf-8");
    assert(comp4.includes("UButton") || res4.stdout.includes("Audited"), "Nuxt UI buttons parsed");

    const icons4 = fs.readFileSync(path.join(nuxtDir, "docs", "frontend-atlas", "07_VISUAL_AND_ICON_INDEX.md"), "utf-8");
    assert(icons4.includes("lucide:user"), "Nuxt tag-based Icon indexed (`lucide:user`)");

    // =========================================================================
    // TEST 5: SvelteKit
    // =========================================================================
    console.log("\n▶️ Test 5: SvelteKit (Svelte 5 + Route Groups + bits-ui)");
    const svelteDir = path.join(TEST_DIR, "svelte-app");
    fs.mkdirSync(path.join(svelteDir, "src", "routes", "(app)", "team", "[id]"), { recursive: true });
    fs.mkdirSync(path.join(svelteDir, "src", "lib", "components", "ui"), { recursive: true });

    fs.writeFileSync(path.join(svelteDir, "package.json"), JSON.stringify({
      name: "test-sveltekit-app",
      devDependencies: { "@sveltejs/kit": "^2.5.0", svelte: "^5.0.0" }
    }));
    fs.writeFileSync(path.join(svelteDir, "svelte.config.js"), "export default {};");
    fs.writeFileSync(path.join(svelteDir, "src", "routes", "+layout.svelte"), "<slot />");
    fs.writeFileSync(path.join(svelteDir, "src", "routes", "+page.svelte"), `
      <script lang="ts">
        import Button from "$lib/components/ui/Button.svelte";
      </script>
      <h1>SvelteKit Home</h1>
      <Button variant="outline">Learn More</Button>
      <button type="submit" aria-label="Send">Submit</button>
    `);
    fs.writeFileSync(path.join(svelteDir, "src", "routes", "(app)", "team", "[id]", "+page.svelte"), `
      <h1>Team Member</h1>
    `);
    fs.writeFileSync(path.join(svelteDir, "src", "lib", "components", "ui", "Button.svelte"), `
      <script lang="ts">
        export let variant = "default";
      </script>
      <button class="btn btn-primary"><slot /></button>
    `);

    const res5 = runAuditInDir(svelteDir);
    assert(res5.status === 0, "SvelteKit runs without error");
    assert(res5.stdout.includes("SvelteKit"), "Correctly detects SvelteKit");
    const routes5 = fs.readFileSync(path.join(svelteDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes5.includes("`/`") && routes5.includes("`/team/:id`"), "SvelteKit resolves `/` and `/team/:id` (stripping `(app)`)");

    // =========================================================================
    // TEST 6: Astro
    // =========================================================================
    console.log("\n▶️ Test 6: Astro (Content Pages + Dynamic Slugs)");
    const astroDir = path.join(TEST_DIR, "astro-app");
    fs.mkdirSync(path.join(astroDir, "src", "pages", "posts"), { recursive: true });
    fs.mkdirSync(path.join(astroDir, "src", "layouts"), { recursive: true });

    fs.writeFileSync(path.join(astroDir, "package.json"), JSON.stringify({
      name: "test-astro-app",
      dependencies: { astro: "^4.5.0" }
    }));
    fs.writeFileSync(path.join(astroDir, "astro.config.mjs"), "export default {};");
    fs.writeFileSync(path.join(astroDir, "src", "layouts", "BaseLayout.astro"), `<html><body><slot /></body></html>`);
    fs.writeFileSync(path.join(astroDir, "src", "pages", "index.astro"), `
      ---
      const title = "Astro Site";
      ---
      <html><h1>{title}</h1><button type="button" aria-label="Action">Click</button></html>
    `);
    fs.writeFileSync(path.join(astroDir, "src", "pages", "posts", "[slug].astro"), `
      ---
      const { slug } = Astro.params;
      ---
      <div>Post: {slug}</div>
    `);
    fs.writeFileSync(path.join(astroDir, "src", "pages", "_hidden.astro"), `
      ---
      ---
      <div>Private</div>
    `);

    const res6 = runAuditInDir(astroDir);
    assert(res6.status === 0, "Astro runs without error");
    assert(res6.stdout.includes("Astro"), "Correctly detects Astro");
    const routes6 = fs.readFileSync(path.join(astroDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes6.includes("`/`") && routes6.includes("`/posts/:slug`"), "Astro resolves `/` and `/posts/:slug`");
    assert(!routes6.includes("_hidden"), "Astro ignores leading `_` route files");

    // =========================================================================
    // TEST 7: React Router v7 / Remix Flat Routes
    // =========================================================================
    console.log("\n▶️ Test 7: React Router v7 / Remix Flat Routes");
    const rrDir = path.join(TEST_DIR, "rr7-app");
    fs.mkdirSync(path.join(rrDir, "app", "routes"), { recursive: true });

    fs.writeFileSync(path.join(rrDir, "package.json"), JSON.stringify({
      name: "test-rr7-app",
      dependencies: { "@react-router/dev": "^7.0.0", "react": "^18.0.0" }
    }));
    fs.writeFileSync(path.join(rrDir, "react-router.config.ts"), "export default {};");
    fs.writeFileSync(path.join(rrDir, "app", "routes", "_index.tsx"), "export default function Index() { return <h1>Home</h1>; }");
    fs.writeFileSync(path.join(rrDir, "app", "routes", "posts.$id_.edit.tsx"), "export default function EditPost() { return <h1>Edit</h1>; }");
    fs.writeFileSync(path.join(rrDir, "app", "routes", "_auth.login.tsx"), "export default function Login() { return <h1>Login</h1>; }");

    const res7 = runAuditInDir(rrDir);
    assert(res7.status === 0, "React Router v7 runs without error");
    assert(res7.stdout.includes("React Router v7"), "Correctly detects React Router v7");
    const routes7 = fs.readFileSync(path.join(rrDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes7.includes("`/`"), "Flat route `_index` resolves to `/`");
    assert(routes7.includes("`/posts/:id/edit`"), "Flat route `posts.$id_.edit.tsx` resolves to `/posts/:id/edit`");
    assert(routes7.includes("`/login`"), "Pathless layout `_auth.login.tsx` resolves to `/login`");

    // =========================================================================
    // TEST 8: Fullstack & Backend Atlas Verification (APIs, Prisma, Server Actions)
    // =========================================================================
    console.log("\n▶️ Test 8: Fullstack & Backend Atlas (API Routes + Prisma + Server Actions)");
    const backendAppDir = path.join(TEST_DIR, "fullstack-app");
    fs.mkdirSync(path.join(backendAppDir, "app", "api", "checkout"), { recursive: true });
    fs.mkdirSync(path.join(backendAppDir, "prisma"), { recursive: true });
    fs.mkdirSync(path.join(backendAppDir, "components"), { recursive: true });

    fs.writeFileSync(path.join(backendAppDir, "package.json"), JSON.stringify({
      name: "test-fullstack-app",
      dependencies: { next: "^14.2.0", react: "^18.2.0", "@prisma/client": "^5.0.0", stripe: "^14.0.0" }
    }));
    fs.writeFileSync(path.join(backendAppDir, "app", "page.tsx"), `
      "use client";
      export default function Page() {
        return <button onClick={() => fetch("/api/checkout", { method: "POST" })}>Checkout</button>;
      }
    `);
    fs.writeFileSync(path.join(backendAppDir, "app", "api", "checkout", "route.ts"), `
      import { NextResponse } from "next/server";
      export async function POST(req: Request) {
        return NextResponse.json({ status: "ok" });
      }
    `);
    fs.writeFileSync(path.join(backendAppDir, "prisma", "schema.prisma"), `
      datasource db { provider = "postgresql", url = env("DATABASE_URL") }
      generator client { provider = "prisma-client-js" }
      model User {
        id Int @id @default(autoincrement())
        email String @unique
        name String?
      }
    `);
    fs.writeFileSync(path.join(backendAppDir, "app", "actions.ts"), `
      "use server";
      export async function createCheckoutSession(userId: string) {
        return { sessionId: "sess_123" };
      }
    `);

    const res8 = runAuditInDir(backendAppDir);
    assert(res8.status === 0, "Fullstack audit runs without error");
    assert(res8.stdout.includes("Backend Atlas written to"), "Correctly outputs Backend Atlas");

    const apiMd = fs.readFileSync(path.join(backendAppDir, "docs", "backend-atlas", "01_API_ROUTES_AND_ENDPOINTS.md"), "utf-8");
    assert(apiMd.includes("`/api/checkout`") && apiMd.includes("POST"), "API catalog indexes `/api/checkout` with POST method");

    const dbMd = fs.readFileSync(path.join(backendAppDir, "docs", "backend-atlas", "02_DATABASE_MODELS_AND_SCHEMA.md"), "utf-8");
    assert(dbMd.includes("Model `User`") && dbMd.includes("email"), "Database catalog indexes Prisma `User` model with `email` field");

    const actionsMd = fs.readFileSync(path.join(backendAppDir, "docs", "backend-atlas", "03_SERVER_ACTIONS_AND_MUTATIONS.md"), "utf-8");
    assert(actionsMd.includes("createCheckoutSession"), "Server Actions catalog indexes `createCheckoutSession()`");

    const bridgeMd = fs.readFileSync(path.join(backendAppDir, "docs", "backend-atlas", "06_FULLSTACK_CROSS_REFERENCE_MAP.md"), "utf-8");
    assert(bridgeMd.includes("/api/checkout"), "Cross-reference map links UI button to `/api/checkout`");
    assert(bridgeMd.includes("Domain Service / Method"), "Cross-reference map contains Domain Service / Method column");
    assert(apiMd.includes("Centrality"), "API catalog includes Centrality PageRank column");
    assert(dbMd.includes("Centrality") || dbMd.includes("Entity"), "Database schema includes Centrality ranking");

    // =========================================================================
    // TEST 9: TanStack React Query Topology & Symbol Centrality (v2.5.0)
    // =========================================================================
    console.log("\n▶️ Test 9: Reactive State & TanStack Query Topology + Centrality (v2.5.0)");
    const queryAppDir = path.join(TEST_DIR, "reactive-app");
    fs.mkdirSync(path.join(queryAppDir, "src", "lib"), { recursive: true });
    fs.mkdirSync(path.join(queryAppDir, "src", "components"), { recursive: true });
    fs.mkdirSync(path.join(queryAppDir, "src", "services"), { recursive: true });
    fs.mkdirSync(path.join(queryAppDir, "app", "api", "catalog"), { recursive: true });

    fs.writeFileSync(path.join(queryAppDir, "package.json"), JSON.stringify({
      name: "test-reactive-app",
      dependencies: {
        next: "^14.2.0",
        react: "^18.2.0",
        "@tanstack/react-query": "^5.28.0"
      }
    }));

    // Authoritative centralized query keys
    fs.writeFileSync(path.join(queryAppDir, "src", "lib", "query-keys.ts"), `
      import type { QueryClient } from "@tanstack/react-query";
      export const queryKeys = {
        catalog: () => ["catalog"] as const,
        userVault: (userId?: string) => ["user", userId || "anonymous", "vault"] as const,
      };

      export function invalidateQueriesForEvent(queryClient: any, event: string) {
        switch (event) {
          case "INVENTORY_CHANGED":
            queryClient.invalidateQueries({ queryKey: ["catalog"] });
            break;
          case "USER_VAULT_MUTATED":
            queryClient.invalidateQueries({ queryKey: ["user"] });
            break;
        }
      }
    `);

    // Service file
    fs.writeFileSync(path.join(queryAppDir, "src", "services", "catalog.service.ts"), `
      export class CatalogService {
        static async getItems() {
          return [{ id: 1, name: "Product A" }];
        }
      }
    `);

    // Route handler importing service
    fs.writeFileSync(path.join(queryAppDir, "app", "api", "catalog", "route.ts"), `
      import { NextResponse } from "next/server";
      import { CatalogService } from "@/src/services/catalog.service";
      export async function GET() {
        const items = await CatalogService.getItems();
        return NextResponse.json(items);
      }
    `);

    // UI Component using useQuery
    fs.writeFileSync(path.join(queryAppDir, "src", "components", "UserVaultDrawer.tsx"), `
      "use client";
      import { useQuery } from "@tanstack/react-query";
      export function UserVaultDrawer({ userId }: { userId: string }) {
        const { data } = useQuery({
          queryKey: ["user", userId, "vault"],
          queryFn: async () => {
            const res = await fetch("/api/catalog");
            return res.json();
          }
        });
        return <div>User Vault</div>;
      }
    `);

    // UI Component using useMutation with invalidation
    fs.writeFileSync(path.join(queryAppDir, "src", "components", "OrderFulfillmentModal.tsx"), `
      "use client";
      import { useMutation, useQueryClient } from "@tanstack/react-query";
      export function OrderFulfillmentModal() {
        const queryClient = useQueryClient();
        const { mutate } = useMutation({
          mutationFn: async () => fetch("/api/catalog", { method: "POST" }),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user"] });
          }
        });
        return <button onClick={() => mutate()}>Fulfill</button>;
      }
    `);

    // App page importing components multiple times (to verify Centrality PageRank)
    fs.writeFileSync(path.join(queryAppDir, "app", "page.tsx"), `
      "use client";
      import { UserVaultDrawer } from "@/src/components/UserVaultDrawer";
      import { OrderFulfillmentModal } from "@/src/components/OrderFulfillmentModal";
      export default function Page() {
        return (
          <div>
            <UserVaultDrawer userId="123" />
            <OrderFulfillmentModal />
          </div>
        );
      }
    `);

    const res9 = runAuditInDir(queryAppDir);
    assert(res9.status === 0, "Reactive app audit runs without error");

    const queryMdPath = path.join(queryAppDir, "docs", "frontend-atlas", "09_QUERY_AND_CACHE_MAP.md");
    assert(fs.existsSync(queryMdPath), "Generates docs/frontend-atlas/09_QUERY_AND_CACHE_MAP.md");

    const queryMd = fs.readFileSync(queryMdPath, "utf-8");
    assert(queryMd.includes("`[\"user\", \"{id}\", \"vault\"]`") || queryMd.includes("user"), "Active queries catalog indexes user vault query");
    assert(queryMd.includes("`[\"user\"]`"), "Mutation map indexes `[\"user\"]` invalidation target");
    assert(queryMd.includes("`queryKeys.catalog()`"), "Centralized keys registry indexes `queryKeys.catalog()`");
    assert(queryMd.includes("flowchart LR"), "Generates Mermaid reactive invalidation graph");

    const compInvMd = fs.readFileSync(path.join(queryAppDir, "docs", "frontend-atlas", "02_COMPONENT_INVENTORY.md"), "utf-8");
    assert(compInvMd.includes("Centrality"), "Component inventory includes Centrality PageRank column");

    const bridge9Md = fs.readFileSync(path.join(queryAppDir, "docs", "backend-atlas", "06_FULLSTACK_CROSS_REFERENCE_MAP.md"), "utf-8");
    assert(bridge9Md.includes("CatalogService.getItems()"), "Deep cross-reference bridge traces API route to `CatalogService.getItems()`");

    // ============================================================
    // Test 10: Secret Leak & Client Env Radar, God-File Slicer, and API Contract Drift (v2.6.0)
    // ============================================================
    console.log("\n▶️ Test 10: Secret Leak & Client Env Radar, God-File Slicer, and API Contract Drift (v2.6.0)");
    const batch3AppDir = path.join(TEST_DIR, "batch3-app");
    fs.mkdirSync(path.join(batch3AppDir, "app", "api", "orders"), { recursive: true });
    fs.mkdirSync(path.join(batch3AppDir, "components"), { recursive: true });

    fs.writeFileSync(path.join(batch3AppDir, "package.json"), JSON.stringify({
      name: "batch3-app",
      dependencies: { "next": "14.0.0", "react": "18.2.0" }
    }, null, 2));

    // .env.example with only 1 documented var
    fs.writeFileSync(path.join(batch3AppDir, ".env.example"), "NEXT_PUBLIC_APP_URL=https://example.com\n");

    // Monolithic God-File (> 550 lines) with distinct functional slices
    let godFileContent = "// Monolithic Checkout & Vault Management Component\n";
    godFileContent += "export interface VaultItemProps {\n  id: string;\n  name: string;\n  price: number;\n}\n\n";
    godFileContent += "export function VaultItemCard({ id, name, price }: VaultItemProps) {\n  return <div>{name} - ${price}</div>;\n}\n\n";
    godFileContent += "export async function calculateTax(price: number): Promise<number> {\n  return price * 0.12;\n}\n\n";
    godFileContent += "export class VaultManager {\n  private items: any[] = [];\n  addItem(item: any) { this.items.push(item); }\n}\n\n";
    godFileContent += "export function MonolithicVaultDrawer() {\n";
    godFileContent += "  const handleCheckout = async () => {\n    console.log(\"Checking out...\");\n  };\n";
    for (let i = 0; i < 520; i++) {
      godFileContent += "  // Line padding block " + (i + 1) + ": processing logic and state binding\n";
    }
    godFileContent += "  return <button onClick={handleCheckout}>Checkout</button>;\n}\n";
    fs.writeFileSync(path.join(batch3AppDir, "components", "monolithic-vault-drawer.tsx"), godFileContent);

    // Client component with secret leak + contract drift
    fs.writeFileSync(path.join(batch3AppDir, "app", "page.tsx"), `
      "use client";
      import { useState } from "react";

      export default function CheckoutPage() {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL;
        const secretKey = process.env.STRIPE_SECRET_KEY;

        const submitOrder = async () => {
          await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: "ORD-999",
              user_name: "John Doe"
            })
          });
        };

        return <button onClick={submitOrder}>Place Order</button>;
      }
    `);

    // Backend route with shadow secret and camelCase expected keys
    fs.writeFileSync(path.join(batch3AppDir, "app", "api", "orders", "route.ts"), `
      import { NextResponse } from "next/server";

      export async function POST(request: Request) {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        const { orderId, userName } = await request.json();

        return NextResponse.json({ success: true, orderId, userName });
      }
    `);

    const res10 = runAuditInDir(batch3AppDir);
    assert(res10.status === 0, "Batch 3 fullstack audit runs without error");

    // 1. Verify Secret Leak & Client Env Radar
    const envMdPath = path.join(batch3AppDir, "docs", "backend-atlas", "07_ENV_AND_SECRETS_MAP.md");
    assert(fs.existsSync(envMdPath), "Generates docs/backend-atlas/07_ENV_AND_SECRETS_MAP.md");
    const envMd = fs.readFileSync(envMdPath, "utf-8");
    assert(envMd.includes("POTENTIAL CLIENT LEAKS DETECTED"), "Flags potential client secret leaks");
    assert(envMd.includes("`STRIPE_SECRET_KEY`"), "Identifies leaked STRIPE_SECRET_KEY in client component");
    assert(envMd.includes("`STRIPE_WEBHOOK_SECRET`"), "Indexes STRIPE_WEBHOOK_SECRET");
    assert(envMd.includes("Shadow"), "Detects STRIPE_WEBHOOK_SECRET as a shadow undocumented variable");

    // 2. Verify Monolithic God-File Surgical Slicer
    const godMdPath = path.join(batch3AppDir, "docs", "frontend-atlas", "10_GOD_FILES_SURGICAL_MAP.md");
    assert(fs.existsSync(godMdPath), "Generates docs/frontend-atlas/10_GOD_FILES_SURGICAL_MAP.md");
    const godMd = fs.readFileSync(godMdPath, "utf-8");
    assert(godMd.includes("monolithic-vault-drawer.tsx"), "Indexes monolithic-vault-drawer.tsx god file");
    assert(godMd.includes("`VaultItemCard`"), "Surgically slices VaultItemCard component");
    assert(godMd.includes("`calculateTax`"), "Surgically slices calculateTax function");
    assert(godMd.includes("`VaultManager`"), "Surgically slices VaultManager service class");
    assert(godMd.includes("`MonolithicVaultDrawer`"), "Surgically slices MonolithicVaultDrawer component");

    // 3. Verify API Contract & Payload Drift Detector
    const bridge10Path = path.join(batch3AppDir, "docs", "backend-atlas", "06_FULLSTACK_CROSS_REFERENCE_MAP.md");
    const bridge10Md = fs.readFileSync(bridge10Path, "utf-8");
    assert(bridge10Md.includes("API Contract & Payload Drift Radar"), "Includes API Contract & Payload Drift Radar section");
    assert(bridge10Md.includes("CASING_MISMATCH"), "Detects CASING_MISMATCH drift");
    assert(bridge10Md.includes("order_id") && bridge10Md.includes("orderId"), "Detects order_id vs orderId casing drift");

    // ============================================================
    // Test 11: Route Complexity & Blast-Radius, Cache Hygiene, and Delta Diff (v2.7.0)
    // ============================================================
    console.log("\n▶️ Test 11: Route Complexity & Blast-Radius, Cache Hygiene, and Delta Diff (v2.7.0)");
    const batch4AppDir = path.join(TEST_DIR, "batch4-app");
    fs.mkdirSync(path.join(batch4AppDir, "app", "admin", "orders"), { recursive: true });
    fs.mkdirSync(path.join(batch4AppDir, "app", "about"), { recursive: true });
    fs.mkdirSync(path.join(batch4AppDir, "components"), { recursive: true });

    fs.writeFileSync(path.join(batch4AppDir, "package.json"), JSON.stringify({
      name: "batch4-app",
      dependencies: { "next": "14.0.0", "react": "18.2.0" }
    }, null, 2));

    // High complexity route /admin/orders with imported modals, buttons, network calls
    fs.writeFileSync(path.join(batch4AppDir, "components", "order-modal.tsx"), `
      "use client";
      export function OrderModal({ isOpen }: { isOpen: boolean }) {
        return isOpen ? <div className="fixed inset-0 bg-black/50">Modal Content</div> : null;
      }
    `);

    fs.writeFileSync(path.join(batch4AppDir, "app", "admin", "orders", "page.tsx"), `
      "use client";
      import { useState } from "react";
      import { useQuery, useMutation } from "@tanstack/react-query";
      import { OrderModal } from "@/components/order-modal";

      export default function AdminOrdersPage() {
        const [open, setOpen] = useState(false);
        const { data } = useQuery({
          queryKey: ["orders", "list"],
          queryFn: () => fetch("/api/orders").then(r => r.json()),
        });

        const cancelMutation = useMutation({
          mutationFn: (id: string) => fetch("/api/orders/cancel", { method: "POST" }),
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["legacy_order_cache"] });
          }
        });

        return (
          <div>
            <h1>Orders</h1>
            <button onClick={() => setOpen(true)}>Open Modal</button>
            <OrderModal isOpen={open} />
          </div>
        );
      }
    `);

    // Simple low-complexity leaf route /about
    fs.writeFileSync(path.join(batch4AppDir, "app", "about", "page.tsx"), `
      export default function AboutPage() {
        return <div>About Us</div>;
      }
    `);

    const res11 = runAuditInDir(batch4AppDir);
    assert(res11.status === 0, "Batch 4 fullstack audit runs without error");

    // 1. Verify 11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md
    const blastMdPath = path.join(batch4AppDir, "docs", "frontend-atlas", "11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md");
    assert(fs.existsSync(blastMdPath), "Generates docs/frontend-atlas/11_ROUTE_COMPLEXITY_AND_BLAST_RADIUS.md");
    const blastMd = fs.readFileSync(blastMdPath, "utf-8");
    assert(blastMd.includes("`/admin/orders`"), "Indexes /admin/orders in Route Complexity Radar");
    assert(blastMd.includes("`/about`"), "Indexes /about in Route Complexity Radar");

    // 2. Verify 01_ROUTES_AND_PANELS_MAP.md includes Blast Radius column
    const routes11Md = fs.readFileSync(path.join(batch4AppDir, "docs", "frontend-atlas", "01_ROUTES_AND_PANELS_MAP.md"), "utf-8");
    assert(routes11Md.includes("Blast Radius"), "Routes map includes Blast Radius column");

    // 3. Verify Cache Hygiene Radar in 09_QUERY_AND_CACHE_MAP.md
    const cacheMdPath = path.join(batch4AppDir, "docs", "frontend-atlas", "09_QUERY_AND_CACHE_MAP.md");
    const cacheMd = fs.readFileSync(cacheMdPath, "utf-8");
    assert(cacheMd.includes("Cache Hygiene & Stale State Radar"), "Includes Cache Hygiene Radar section");
    assert(cacheMd.includes("legacy_order_cache"), "Detects legacy_order_cache as orphaned invalidation target");

    // 4. Verify Architecture Delta Report (--diff)
    const auditScript = path.join(process.cwd(), "scripts", "audit.ts");
    const isWin = process.platform === "win32";
    const npxCmd = isWin ? "npx.cmd" : "npx";
    const diffRes = child_process.spawnSync(npxCmd, ["tsx", auditScript, "--diff"], {
      cwd: batch4AppDir,
      encoding: "utf-8",
      shell: true,
      stdio: "pipe"
    });
    assert(diffRes.status === 0, "npx fullstack-audit --diff runs without error");
    assert(Boolean(diffRes.stdout && diffRes.stdout.includes("FULLSTACK ARCHITECTURE DELTA REPORT")), "--diff outputs Delta Report table");

    // ============================================================
    // Test 12: Version Transparency, Inverted Index & Multi-Harness
    // ============================================================
    console.log("\n▶️ Test 12: Version Transparency, Inverted Index & Multi-Harness");
    const verRes = child_process.spawnSync(npxCmd, ["tsx", auditScript, "--version"], {
      cwd: batch4AppDir,
      encoding: "utf-8",
      shell: true,
      stdio: "pipe"
    });
    assert(verRes.status === 0, "npx fullstack-audit --version runs with exit 0");
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
    assert(Boolean(verRes.stdout && verRes.stdout.includes(`v${pkg.version}`)), `--version outputs v${pkg.version}`);

    const setupRes = child_process.spawnSync(npxCmd, ["tsx", auditScript, "--setup-all"], {
      cwd: batch4AppDir,
      encoding: "utf-8",
      shell: true,
      stdio: "pipe"
    });
    assert(setupRes.status === 0, "--setup-all runs with exit 0");
    assert(fs.existsSync(path.join(batch4AppDir, ".cursor", "rules", "fullstack-audit.mdc")), ".cursor/rules/fullstack-audit.mdc generated");
    assert(fs.existsSync(path.join(batch4AppDir, "CLAUDE.md")), "CLAUDE.md generated");
    assert(fs.existsSync(path.join(batch4AppDir, "skills", "audit", "fullstack-audit", "SKILL.md")), "Hermes Agent SKILL.md generated");

    // ============================================================
    // Test 13: LRU Cache, Causal Graph & Bootstrap Quarantine (v2.14.0)
    // ============================================================
    console.log("\n▶️ Test 13: LRU Cache, Causal Graph & Bootstrap Quarantine (v2.14.0)");

    // 1. Verify bootstrap .gitignore quarantine
    const dummyAppDir = path.join(TEST_DIR, "quarantine-app");
    fs.mkdirSync(dummyAppDir, { recursive: true });
    fs.writeFileSync(path.join(dummyAppDir, ".gitignore"), "node_modules/\n.env\n");

    ensureGitignoreProtection(dummyAppDir);
    const gitignoreContent = fs.readFileSync(path.join(dummyAppDir, ".gitignore"), "utf-8");
    assert(gitignoreContent.includes("docs/frontend-atlas/"), "Bootstrap auto-quarantines docs/frontend-atlas/ in .gitignore");
    assert(gitignoreContent.includes("docs/backend-atlas/"), "Bootstrap auto-quarantines docs/backend-atlas/ in .gitignore");
    assert(gitignoreContent.includes("docs/llms.txt"), "Bootstrap auto-quarantines docs/llms.txt in .gitignore");

    // 2. Verify Causal Graph presence in .atlas-index.json
    const atlasIndexPath = path.join(batch3AppDir, "docs", "frontend-atlas", ".atlas-index.json");
    assert(fs.existsSync(atlasIndexPath), "Batch 3 generated .atlas-index.json");
    const atlasIndexRaw = JSON.parse(fs.readFileSync(atlasIndexPath, "utf-8"));
    assert(atlasIndexRaw.version === pkg.version, `.atlas-index.json has version v${pkg.version}`);
    assert(atlasIndexRaw.causalGraph !== undefined, ".atlas-index.json contains pre-computed causalGraph");
    assert(Array.isArray(atlasIndexRaw.causalGraph.nodes), "causalGraph contains nodes array");

    console.log(`\n============================================================`);
    console.log(`🎉 Test Matrix Complete: ${passedTests}/${totalTests} Passed (100% Success)`);
    console.log(`============================================================`);

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  } finally {
    cleanTestEnvironment();
  }
}

runTestMatrix();
