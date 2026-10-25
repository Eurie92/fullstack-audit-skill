import fs from "fs";
import path from "path";
import { FULLSTACK_AUDIT_VERSION, FULLSTACK_AUDIT_ENGINE, getAtlasProvenanceHeader, AtlasIndexEntry } from "./constants.js";

/**
 * Universal Backend Atlas & Full-Stack Audit Engine (v2.15.0)
 * 
 * Generates docs/backend-atlas/:
 * 1. 01_API_ROUTES_AND_ENDPOINTS.md (Next.js App/Pages Router API, Express, Hono, Remix)
 * 2. 02_DATABASE_MODELS_AND_SCHEMA.md (Prisma schema.prisma, Drizzle schema.ts, Raw SQL)
 * 3. 03_SERVER_ACTIONS_AND_MUTATIONS.md ("use server" actions, mutation functions)
 * 4. 04_AUTH_AND_MIDDLEWARE_GUARDS.md (middleware.ts, public vs protected routes)
 * 5. 05_INTEGRATIONS_AND_WEBHOOKS.md (Stripe, Resend, Supabase, S3, Webhooks)
 * 6. 06_FULLSTACK_CROSS_REFERENCE_MAP.md (Bi-directional UI Trigger ➔ Backend Action / API ➔ Database Model)
 * 7. 07_ENV_AND_SECRETS_MAP.md (Client Secret Leak Radar & Undocumented Shadow Variables)
 */

function escapeRegex(str: string): string {
  return (str || "").replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

const ROOT_DIR = process.cwd();
const BACKEND_OUTPUT_DIR = path.join(ROOT_DIR, "docs", "backend-atlas");

// Data Interfaces
export interface ApiEndpoint {
  urlPath: string;
  framework: string;
  filePath: string;
  relativePath: string;
  line: number;
  methods: string[];
  isProtected: boolean;
  authGuard?: string;
  sourceSnippet: string;
  centralityScore?: number;
  centralityBadge?: string;
}

export interface DbField {
  name: string;
  type: string;
  isId?: boolean;
  isUnique?: boolean;
  isOptional?: boolean;
  isArray?: boolean;
  relationTarget?: string;
}

export interface DbModel {
  name: string;
  orm: "Prisma" | "Drizzle" | "TypeORM" | "Mongoose" | "SQL / Supabase";
  filePath: string;
  relativePath: string;
  line: number;
  tableName: string;
  fields: DbField[];
  centralityScore?: number;
  centralityBadge?: string;
}

export interface ServerAction {
  name: string;
  filePath: string;
  relativePath: string;
  line: number;
  params: string;
  dbOperations: string[];
  externalServices: string[];
  snippet: string;
}

export interface AuthGuard {
  filePath: string;
  relativePath: string;
  line: number;
  matcherPatterns: string[];
  authProvider: string;
  protectedRoutes: string[];
  publicRoutes: string[];
}

export interface IntegrationService {
  name: string;
  category: "Payment" | "Email" | "Database / BaaS" | "Storage" | "AI / LLM" | "SMS / Auth";
  clientImports: string[];
  webhookRoutes: string[];
  detectedFiles: { file: string; line: number; snippet: string }[];
}

export type EnvSensitivity = "CRITICAL_SECRET" | "AUTH_KEY" | "DATABASE" | "CONFIG" | "PUBLIC";

export interface EnvVariableOccurrence {
  filePath: string;
  relativePath: string;
  line: number;
  snippet: string;
  isClientScope: boolean;
}

export interface EnvAuditItem {
  name: string;
  scope: "Client ⚡" | "Server 🖥️" | "Hybrid (Client & Server)";
  sensitivity: EnvSensitivity;
  isPublicVar: boolean;
  isDocumented: boolean;
  occurrences: EnvVariableOccurrence[];
  hasLeakRisk: boolean;
  leakMessage?: string;
}

export interface EnvAuditReport {
  totalUniqueVars: number;
  documentedVarsCount: number;
  shadowVarsCount: number;
  leakWarningsCount: number;
  documentedKeys: string[];
  items: EnvAuditItem[];
}

export interface ContractDriftWarning {
  backendTarget: string,
  targetType: "API Route" | "Server Action";
  frontendFile: string;
  frontendLine: number;
  backendFile: string;
  backendLine: number;
  driftType: "CASING_MISMATCH" | "MISSING_KEY" | "UNUSED_PAYLOAD_KEY";
  severity: "HIGH" | "MEDIUM" | "LOW";
  clientKey?: string;
  serverKey?: string;
  message: string;
}

export interface FullstackBridgeItem {
  frontendFile: string;
  frontendLine: number;
  uiTriggerSnippet: string;
  backendTarget: string; // e.g. "/api/checkout" or "createCheckoutSession"
  targetType: "API Route" | "Server Action";
  httpMethod?: string;
  connectedModels: string[];
  externalService?: string;
  domainServices?: string[];
  serviceCalls?: string[];
}

export interface BackendAuditResult {
  endpoints: ApiEndpoint[];
  models: DbModel[];
  serverActions: ServerAction[];
  authGuards: AuthGuard[];
  integrations: IntegrationService[];
  bridgeItems: FullstackBridgeItem[];
  contractDriftWarnings?: ContractDriftWarning[];
  envAudit?: EnvAuditReport;
}

function escapeMarkdownSnippet(text: string, maxLen = 50): string {
  return text
    .replace(/`/g, "'")
    .replace(/\|/g, "\\|")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, " ")
    .trim()
    .slice(0, maxLen);
}

function makeFileLink(relativePath: string, line?: number, displayText?: string): string {
  const cleanPath = relativePath.replace(/\\/g, "/");
  const relHref = `../../${cleanPath}${line ? `#L${line}` : ""}`;
  const label = displayText || (line ? `${cleanPath}:${line}` : cleanPath);
  return `[${label}](${relHref})`;
}

function getSourceFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (
      item === "node_modules" ||
      item.startsWith(".next") ||
      item.startsWith(".agent") ||
      item === ".git" ||
      item === "dist" ||
      item === "build" ||
      item === ".turbo" ||
      item === ".cache" ||
      item === "coverage" ||
      item === "docs" ||
      item === "evidence" ||
      item === "screenshots"
    ) {
      continue;
    }
    const fullPath = path.join(dir, item);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getSourceFiles(fullPath, fileList);
      } else if (/\.(tsx|jsx|ts|js|mjs|cjs|prisma|sql)$/.test(item)) {
        fileList.push(fullPath);
      }
    } catch {
      continue;
    }
  }
  return fileList;
}

// 1. Static API Route Parser
export function parseApiRoutes(files: string[], rootDir: string = ROOT_DIR): ApiEndpoint[] {
  const endpoints: ApiEndpoint[] = [];

  files.forEach(filePath => {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");

    // Next.js App Router Route Handlers: app/**/route.(ts|js|mjs)
    if (relPath.match(/(?:^|\/)(?:src\/)?app\/(.+?)\/route\.(ts|js|mjs)$/)) {
      const match = relPath.match(/(?:^|\/)(?:src\/)?app\/(.+?)\/route\.(ts|js|mjs)$/)!;
      let routePath = "/" + match[1];
      // Convert (group) syntax -> stripped
      routePath = routePath.replace(/\/\([^)]+\)/g, "");

      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      const methods: string[] = [];
      const httpVerbs = ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"];

      let isProtected = false;
      let authGuard: string | undefined;

      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        httpVerbs.forEach(verb => {
          const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${verb}\\b`);
          if (regex.test(line)) {
            methods.push(verb);
          }
        });

        if (/\b(?:auth|getServerSession|currentUser|verifyToken|requireAuth|authenticate)\b/.test(line)) {
          isProtected = true;
          authGuard = line.trim().slice(0, 40);
        }
      });

      if (methods.length > 0) {
        endpoints.push({
          urlPath: routePath,
          framework: "Next.js (App Router)",
          filePath,
          relativePath: relPath,
          line: 1,
          methods,
          isProtected,
          authGuard,
          sourceSnippet: `export function ${methods.join(", ")}`,
        });
      }
    }

    // Next.js Pages Router API: pages/api/**/*.(ts|js)
    if (relPath.match(/(?:^|\/)(?:src\/)?pages\/api\/(.+?)\.(ts|js|mjs)$/)) {
      const match = relPath.match(/(?:^|\/)(?:src\/)?pages\/api\/(.+?)\.(ts|js|mjs)$/)!;
      const sub = match[1];
      const routePath = "/api/" + (sub === "index" ? "" : sub.replace(/\/index$/, ""));

      const content = fs.readFileSync(filePath, "utf-8");
      const methods: string[] = [];
      if (/req\.method\s*===?\s*['"]GET['"]/i.test(content)) methods.push("GET");
      if (/req\.method\s*===?\s*['"]POST['"]/i.test(content)) methods.push("POST");
      if (/req\.method\s*===?\s*['"]PUT['"]/i.test(content)) methods.push("PUT");
      if (/req\.method\s*===?\s*['"]DELETE['"]/i.test(content)) methods.push("DELETE");
      if (/req\.method\s*===?\s*['"]PATCH['"]/i.test(content)) methods.push("PATCH");
      if (methods.length === 0) methods.push("ALL");

      const isProtected = /\b(?:auth|getSession|verifyToken|authenticate)\b/.test(content);

      endpoints.push({
        urlPath: routePath,
        framework: "Next.js (Pages Router API)",
        filePath,
        relativePath: relPath,
        line: 1,
        methods,
        isProtected,
        sourceSnippet: `default handler (${methods.join(", ")})`,
      });
    }

    // Express / Hono routes: app.get, router.post, etc.
    if (!relPath.includes("app/") && !relPath.includes("pages/")) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const match = line.match(/\b(?:app|router|route)\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/i);
        if (match) {
          const method = match[1].toUpperCase();
          const routeUrl = match[2];
          const isProtected = /auth|verify|guard|protect/i.test(line);
          endpoints.push({
            urlPath: routeUrl,
            framework: "Express / Hono",
            filePath,
            relativePath: relPath,
            line: lineNum,
            methods: [method],
            isProtected,
            sourceSnippet: line.trim().slice(0, 60),
          });
        }
      });
    }
  });

  return endpoints;
}

// 2. Static Database Schema Parser (Prisma & Drizzle)
export function parseDatabaseModels(files: string[], rootDir: string = ROOT_DIR): DbModel[] {
  const models: DbModel[] = [];

  // 1. Prisma schema parser (schema.prisma)
  const prismaFiles = files.filter(f => f.endsWith(".prisma"));
  prismaFiles.forEach(filePath => {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let currentModel: DbModel | null = null;

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      const modelMatch = trimmed.match(/^model\s+([A-Za-z0-9_]+)\s*\{/);
      if (modelMatch) {
        currentModel = {
          name: modelMatch[1],
          tableName: modelMatch[1],
          orm: "Prisma",
          filePath,
          relativePath: relPath,
          line: lineNum,
          fields: [],
        };
        models.push(currentModel);
        return;
      }

      if (currentModel && trimmed.startsWith("}")) {
        currentModel = null;
        return;
      }

      if (currentModel && trimmed.startsWith("@@map")) {
        const mapMatch = trimmed.match(/@@map\(\s*["']([^"']+)["']\s*\)/);
        if (mapMatch) {
          currentModel.tableName = mapMatch[1];
        }
        return;
      }

      if (currentModel && trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("@@")) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const fieldName = parts[0];
          const rawType = parts[1];
          const isId = trimmed.includes("@id");
          const isUnique = trimmed.includes("@unique");
          const isOptional = rawType.endsWith("?");
          const isArray = rawType.endsWith("[]");
          const cleanType = rawType.replace(/[?\[\]]/g, "");

          let relationTarget: string | undefined;
          const relationMatch = trimmed.match(/@relation\([^)]*\)/);
          if (relationMatch || (!["String", "Int", "Boolean", "DateTime", "Float", "Json", "BigInt", "Bytes", "Decimal"].includes(cleanType))) {
            relationTarget = cleanType;
          }

          currentModel.fields.push({
            name: fieldName,
            type: rawType,
            isId,
            isUnique,
            isOptional,
            isArray,
            relationTarget,
          });
        }
      }
    });
  });

  // 2. Drizzle schema parser (schema.ts / db/schema.ts)
  const drizzleFiles = files.filter(f =>
    f.endsWith("schema.ts") ||
    f.endsWith("schema.js") ||
    f.includes("db/schema") ||
    f.includes("src/db/schema")
  );

  drizzleFiles.forEach(filePath => {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const tableMatch = line.match(/(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:pgTable|mysqlTable|sqliteTable)\s*\(\s*["']([^"']+)["']/);
      if (tableMatch) {
        const modelVarName = tableMatch[1];
        const tableName = tableMatch[2];
        models.push({
          name: modelVarName,
          tableName,
          orm: "Drizzle",
          filePath,
          relativePath: relPath,
          line: lineNum,
          fields: [],
        });
      }
    });
  });

  // 3. Raw SQL & Supabase Migration Schema Parser (*.sql)
  const sqlFiles = files.filter(f => f.endsWith(".sql"));
  const tableMap = new Map<string, DbModel>();

  // Helper to split SQL definitions inside CREATE TABLE (...) respecting nested parentheses and strings
  function splitSqlDefinitions(body: string): string[] {
    const defs: string[] = [];
    let depth = 0;
    let current = "";
    let inSingleQuote = false;
    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (char === "'" && (i === 0 || body[i - 1] !== "\\")) {
        inSingleQuote = !inSingleQuote;
        current += char;
      } else if (!inSingleQuote && char === "(") {
        depth++;
        current += char;
      } else if (!inSingleQuote && char === ")") {
        depth--;
        current += char;
      } else if (!inSingleQuote && char === "," && depth === 0) {
        if (current.trim()) defs.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) defs.push(current.trim());
    return defs;
  }

  sqlFiles.forEach(filePath => {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    let rawContent = "";
    try {
      rawContent = fs.readFileSync(filePath, "utf-8");
    } catch {
      return;
    }

    // Strip comments
    const stripped = rawContent
      .replace(/\/\*[\s\S]*?\*\//g, "") // remove block comments
      .replace(/--[^\r\n]*/g, "");       // remove line comments

    // Match CREATE TABLE [IF NOT EXISTS] [schema.]<tableName> ( ... )
    const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_"]+)\s*\(([\s\S]*?)\);/gi;
    let match: RegExpExecArray | null;

    while ((match = createTableRegex.exec(stripped)) !== null) {
      const rawTableName = match[2].replace(/"/g, "");
      const tableBody = match[3];
      const modelKey = rawTableName.toLowerCase();

      // Estimate line number in original file
      const offset = match.index;
      const lineNum = rawContent.slice(0, offset).split("\n").length;

      let model = tableMap.get(modelKey);
      if (!model) {
        model = {
          name: rawTableName,
          tableName: rawTableName,
          orm: "SQL / Supabase",
          filePath,
          relativePath: relPath,
          line: lineNum,
          fields: [],
        };
        tableMap.set(modelKey, model);
      }

      const definitions = splitSqlDefinitions(tableBody);
      definitions.forEach(def => {
        const trimmed = def.trim();
        if (!trimmed) return;

        // Check if table-level PRIMARY KEY constraint
        const pkMatch = trimmed.match(/^(?:CONSTRAINT\s+[a-zA-Z0-9_]+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          const pkCols = pkMatch[1].split(",").map(c => c.trim().replace(/"/g, "").toLowerCase());
          model!.fields.forEach(f => {
            if (pkCols.includes(f.name.toLowerCase())) f.isId = true;
          });
          return;
        }

        // Check if table-level FOREIGN KEY constraint
        const fkMatch = trimmed.match(/^(?:CONSTRAINT\s+[a-zA-Z0-9_]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/i);
        if (fkMatch) {
          const fkCols = fkMatch[1].split(",").map(c => c.trim().replace(/"/g, "").toLowerCase());
          const targetTable = fkMatch[2].replace(/"/g, "");
          model!.fields.forEach(f => {
            if (fkCols.includes(f.name.toLowerCase())) f.relationTarget = targetTable;
          });
          return;
        }

        if (/^(?:CONSTRAINT\s+[a-zA-Z0-9_]+\s+)?(?:CHECK|UNIQUE)\b/i.test(trimmed)) {
          return;
        }

        // Standard column definition: <name> <type> [modifiers...]
        const colMatch = trimmed.match(/^"?([a-zA-Z0-9_]+)"?\s+([a-zA-Z0-9_]+(?:\s*\([^)]*\))?(?:\[\])?)([\s\S]*)$/i);
        if (colMatch) {
          const colName = colMatch[1];
          const colType = colMatch[2].trim();
          const rest = colMatch[3] || "";

          // Skip if reserved SQL keyword as column (e.g. PARTITION BY)
          if (/^(?:PARTITION|CONSTRAINT|INHERITS|PRIMARY|FOREIGN)\b/i.test(colName)) return;

          const isId = /\bPRIMARY\s+KEY\b/i.test(rest);
          const isUnique = /\bUNIQUE\b/i.test(rest);
          const isOptional = !/\bNOT\s+NULL\b/i.test(rest) && !isId;
          const isArray = colType.endsWith("[]") || /\bARRAY\b/i.test(rest);

          let relationTarget: string | undefined;
          const inlineRef = rest.match(/\bREFERENCES\s+(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/i);
          if (inlineRef) {
            relationTarget = inlineRef[1].replace(/"/g, "");
          }

          const existingField = model!.fields.find(f => f.name.toLowerCase() === colName.toLowerCase());
          if (!existingField) {
            model!.fields.push({
              name: colName,
              type: colType,
              isId,
              isUnique,
              isOptional,
              isArray,
              relationTarget,
            });
          }
        }
      });
    }

    // Also parse ALTER TABLE ... ADD COLUMN ...
    const alterTableRegex = /ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:([a-zA-Z0-9_]+)\.)?([a-zA-Z0-9_"]+)\s+ADD\s+COLUMN(?:\s+IF\s+NOT\s+EXISTS)?\s+"?([a-zA-Z0-9_]+)"?\s+([a-zA-Z0-9_]+(?:\s*\([^)]*\))?(?:\[\])?)([\s\S]*?);/gi;
    let alterMatch: RegExpExecArray | null;

    while ((alterMatch = alterTableRegex.exec(stripped)) !== null) {
      const rawTableName = alterMatch[2].replace(/"/g, "");
      const colName = alterMatch[3];
      const colType = alterMatch[4].trim();
      const rest = alterMatch[5] || "";
      const modelKey = rawTableName.toLowerCase();

      let model = tableMap.get(modelKey);
      if (!model) {
        const offset = alterMatch.index;
        const lineNum = rawContent.slice(0, offset).split("\n").length;
        model = {
          name: rawTableName,
          tableName: rawTableName,
          orm: "SQL / Supabase",
          filePath,
          relativePath: relPath,
          line: lineNum,
          fields: [],
        };
        tableMap.set(modelKey, model);
      }

      const existingField = model.fields.find(f => f.name.toLowerCase() === colName.toLowerCase());
      if (!existingField) {
        const isId = /\bPRIMARY\s+KEY\b/i.test(rest);
        const isUnique = /\bUNIQUE\b/i.test(rest);
        const isOptional = !/\bNOT\s+NULL\b/i.test(rest) && !isId;
        const isArray = colType.endsWith("[]") || /\bARRAY\b/i.test(rest);

        let relationTarget: string | undefined;
        const inlineRef = rest.match(/\bREFERENCES\s+(?:[a-zA-Z0-9_]+\.)?([a-zA-Z0-9_]+)/i);
        if (inlineRef) {
          relationTarget = inlineRef[1].replace(/"/g, "");
        }

        model.fields.push({
          name: colName,
          type: colType,
          isId,
          isUnique,
          isOptional,
          isArray,
          relationTarget,
        });
      }
    }
  });

  tableMap.forEach(m => models.push(m));

  return models;
}

// 3. Static Server Actions Parser ("use server")
export function parseServerActions(files: string[], rootDir: string = ROOT_DIR): ServerAction[] {
  const actions: ServerAction[] = [];

  files.forEach(filePath => {
    if (!/\.(tsx|ts|js|jsx)$/.test(filePath)) return;
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf-8");

    const hasFileLevelUseServer = /^\s*["']use server["']/m.test(content);
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Check exported async functions
      const fnMatch = trimmed.match(/export\s+async\s+function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (fnMatch) {
        const actionName = fnMatch[1];
        const params = fnMatch[2].trim();

        // Check if file is "use server" or if function body starts with "use server"
        const nextLines = lines.slice(idx, idx + 5).join(" ");
        const isAction = hasFileLevelUseServer || /["']use server["']/.test(nextLines);

        if (isAction) {
          // Detect DB or service operations inside function body
          const fnBody = lines.slice(idx, Math.min(lines.length, idx + 35)).join("\n");
          const dbOperations: string[] = [];
          if (/prisma\.[a-zA-Z0-9_]+\.(create|update|delete|find|upsert)/.test(fnBody)) dbOperations.push("Prisma ORM");
          if (/db\.(insert|update|delete|select)/.test(fnBody)) dbOperations.push("Drizzle ORM");

          const externalServices: string[] = [];
          if (/stripe\./i.test(fnBody)) externalServices.push("Stripe");
          if (/resend\./i.test(fnBody)) externalServices.push("Resend");
          if (/supabase\./i.test(fnBody)) externalServices.push("Supabase");

          actions.push({
            name: actionName,
            filePath,
            relativePath: relPath,
            line: lineNum,
            params: params || "()",
            dbOperations,
            externalServices,
            snippet: trimmed.slice(0, 60),
          });
        }
      }
    });
  });

  return actions;
}

// 4. Static Auth & Middleware Guards Parser
export function parseAuthGuards(files: string[], rootDir: string = ROOT_DIR): AuthGuard[] {
  const guards: AuthGuard[] = [];

  const middlewareFiles = files.filter(f =>
    f.endsWith("middleware.ts") ||
    f.endsWith("middleware.js") ||
    f.endsWith("src/middleware.ts")
  );

  middlewareFiles.forEach(filePath => {
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    let authProvider = "Custom Middleware";
    if (/@clerk\/nextjs/.test(content)) authProvider = "Clerk Auth";
    else if (/next-auth/.test(content)) authProvider = "NextAuth / Auth.js";
    else if (/@supabase\/auth/.test(content) || /@supabase\/ssr/.test(content)) authProvider = "Supabase Auth";
    else if (/lucia/.test(content)) authProvider = "Lucia Auth";

    const matcherPatterns: string[] = [];
    const matcherMatch = content.match(/matcher:\s*\[([\s\S]*?)\]/);
    if (matcherMatch) {
      const items = matcherMatch[1].match(/["']([^"']+)["']/g);
      if (items) {
        items.forEach(it => matcherPatterns.push(it.replace(/['"]/g, "")));
      }
    }

    guards.push({
      filePath,
      relativePath: relPath,
      line: 1,
      matcherPatterns,
      authProvider,
      protectedRoutes: matcherPatterns.filter(p => !p.includes("public") && !p.includes("favicon") && !p.includes("api/webhooks")),
      publicRoutes: matcherPatterns.filter(p => p.includes("public") || p.includes("api/webhooks")),
    });
  });

  return guards;
}

// 5. Integrations & Webhooks Parser
export function parseIntegrations(files: string[], rootDir: string = ROOT_DIR): IntegrationService[] {
  const serviceDefs: { name: string; category: IntegrationService["category"]; importRegex: RegExp }[] = [
    { name: "Stripe Payments", category: "Payment", importRegex: /["'](?:stripe|@stripe\/stripe-js)["']/ },
    { name: "Resend Emails", category: "Email", importRegex: /["']resend["']/ },
    { name: "Supabase BaaS", category: "Database / BaaS", importRegex: /["']@supabase\/(?:supabase-js|ssr)["']/ },
    { name: "AWS S3 Storage", category: "Storage", importRegex: /["']@aws-sdk\/client-s3["']/ },
    { name: "OpenAI AI SDK", category: "AI / LLM", importRegex: /["'](?:openai|ai)["']/ },
    { name: "Anthropic AI SDK", category: "AI / LLM", importRegex: /["']@anthropic-ai\/sdk["']/ },
    { name: "Twilio SMS", category: "SMS / Auth", importRegex: /["']twilio["']/ },
  ];

  const results: IntegrationService[] = [];

  serviceDefs.forEach(def => {
    const detectedFiles: { file: string; line: number; snippet: string }[] = [];
    const webhookRoutes: string[] = [];

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, "utf-8");
      if (def.importRegex.test(content)) {
        const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
        const lines = content.split("\n");
        lines.forEach((line, idx) => {
          if (def.importRegex.test(line)) {
            detectedFiles.push({
              file: relPath,
              line: idx + 1,
              snippet: line.trim().slice(0, 70),
            });
          }
        });

        if (relPath.includes("webhook") || relPath.includes("api/webhooks")) {
          webhookRoutes.push(relPath);
        }
      }
    });

    if (detectedFiles.length > 0) {
      results.push({
        name: def.name,
        category: def.category,
        clientImports: Array.from(new Set(detectedFiles.map(d => d.file))),
        webhookRoutes: Array.from(new Set(webhookRoutes)),
        detectedFiles,
      });
    }
  });

  return results;
}

// Payload and Contract Drift Extraction Helpers
function extractClientPayloadKeys(lines: string[], startIdx: number): string[] {
  const keys: string[] = [];
  const snippet = lines.slice(startIdx, Math.min(lines.length, startIdx + 15)).join("\n");

  const jsonMatch = snippet.match(/JSON\.stringify\s*\(\s*\{([^}]+)\}/);
  if (jsonMatch) {
    const bodyStr = jsonMatch[1];
    const keyMatches = bodyStr.matchAll(/([a-zA-Z0-9_]+)\s*:/g);
    for (const km of keyMatches) {
      if (!keys.includes(km[1])) keys.push(km[1]);
    }
    const shorthandMatches = bodyStr.split(",").map(s => s.trim().split(/\s*:/)[0].trim());
    shorthandMatches.forEach(k => {
      if (/^[a-zA-Z0-9_]+$/.test(k) && !keys.includes(k) && !["method", "headers", "body", "cache"].includes(k)) {
        keys.push(k);
      }
    });
  }

  const directObjMatch = snippet.match(/(?:\.post|\.put|\.patch|\b[A-Za-z0-9_]+\s*)\s*\([^,]+,\s*\{([^}]+)\}/);
  if (directObjMatch) {
    const bodyStr = directObjMatch[1];
    const keyMatches = bodyStr.matchAll(/([a-zA-Z0-9_]+)\s*:/g);
    for (const km of keyMatches) {
      if (!keys.includes(km[1])) keys.push(km[1]);
    }
  }

  return keys;
}

function extractBackendExpectedKeys(epContent: string): { keys: string[]; lines: Map<string, number> } {
  const keys: string[] = [];
  const linesMap = new Map<string, number>();
  const epLines = epContent.split("\n");

  epLines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const destructureMatch = line.match(/(?:const|let|var)\s+\{([^}]+)\}\s*=\s*(?:await\s+[^.]+\.json\(\)|body|data|payload)/);
    if (destructureMatch) {
      const parts = destructureMatch[1].split(",");
      parts.forEach(p => {
        const k = p.trim().split(/\s*:\s*/)[0].split(/\s*=/)[0].trim();
        if (/^[a-zA-Z0-9_]+$/.test(k) && !keys.includes(k)) {
          keys.push(k);
          linesMap.set(k, lineNum);
        }
      });
    }

    const propMatches = line.matchAll(/\b(?:body|data|payload|json)\.([a-zA-Z0-9_]+)\b/g);
    for (const pm of propMatches) {
      const k = pm[1];
      if (!keys.includes(k) && !["catch", "then", "length", "toString", "slice"].includes(k)) {
        keys.push(k);
        if (!linesMap.has(k)) linesMap.set(k, lineNum);
      }
    }

    const zodMatch = line.match(/([a-zA-Z0-9_]+)\s*:\s*z\./);
    if (zodMatch) {
      const k = zodMatch[1];
      if (!keys.includes(k)) {
        keys.push(k);
        if (!linesMap.has(k)) linesMap.set(k, lineNum);
      }
    }
  });

  return { keys, lines: linesMap };
}

function detectContractDrift(
  clientKeys: string[],
  serverKeysInfo: { keys: string[]; lines: Map<string, number> },
  frontendFile: string, frontendLine: number, backendFile: string, backendTarget: string,
  targetType: "API Route" | "Server Action"
): ContractDriftWarning[] {
  const warnings: ContractDriftWarning[] = [];
  const serverKeys = serverKeysInfo.keys;

  function normalize(k: string) {
    return k.toLowerCase().replace(/[-_]/g, "");
  }

  clientKeys.forEach(ck => {
    const normCk = normalize(ck);
    const matchedSk = serverKeys.find(sk => normalize(sk) === normCk);
    if (matchedSk && matchedSk !== ck) {
      const backendLine = serverKeysInfo.lines.get(matchedSk) || 1;
      warnings.push({
        backendTarget,
        targetType,
        frontendFile,
        frontendLine,
        backendFile,
        backendLine,
        driftType: "CASING_MISMATCH",
        severity: "HIGH",
        clientKey: ck,
        serverKey: matchedSk,
        message: "Casing mismatch: Client sends '" + ck + "' but Server expects '" + matchedSk + "'!",
      });
    }
  });

  return warnings;
}

// 6. Fullstack Cross-Reference Bridge (Frontend UI ➔ Backend Actions / APIs)
export function buildFullstackBridge(
  files: string[],
  endpoints: ApiEndpoint[],
  actions: ServerAction[],
  models: DbModel[],
  rootDir: string = ROOT_DIR,
  driftCollector?: ContractDriftWarning[]
): FullstackBridgeItem[] {
  const bridgeItems: FullstackBridgeItem[] = [];
  const contentCache = new Map<string, string>();

  function getFileContentCached(filePath: string): string {
    if (contentCache.has(filePath)) return contentCache.get(filePath)!;
    try {
      const c = fs.readFileSync(filePath, "utf-8");
      contentCache.set(filePath, c);
      return c;
    } catch {
      contentCache.set(filePath, "");
      return "";
    }
  }

  function resolveImportPath(importPath: string, fromFile: string): string | null {
    const extensions = [".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.js"];
    let base = "";
    if (importPath.startsWith("@/")) {
      base = path.join(rootDir, importPath.slice(2));
    } else if (importPath.startsWith("~/")) {
      base = path.join(rootDir, importPath.slice(2));
    } else if (importPath.startsWith(".")) {
      base = path.resolve(path.dirname(fromFile), importPath);
    } else {
      return null;
    }

    if (fs.existsSync(base) && !fs.statSync(base).isDirectory()) return base;
    const cleanBase = base.replace(/\.js$/, "");
    for (const ext of extensions) {
      const candidate = cleanBase + ext;
      if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) return candidate;
    }
    if (importPath.startsWith("@/")) {
      const srcBase = path.join(rootDir, "src", importPath.slice(2)).replace(/\.js$/, "");
      for (const ext of extensions) {
        const candidate = srcBase + ext;
        if (fs.existsSync(candidate) && !fs.statSync(candidate).isDirectory()) return candidate;
      }
    }
    return null;
  }

  function extractDomainServices(content: string, filePath: string): { services: string[]; serviceCalls: string[]; extraContents: string[] } {
    const services: string[] = [];
    const serviceCalls: string[] = [];
    const extraContents: string[] = [];

    const importRegex = /import\s+(?:\{([^}]+)\}|([A-Za-z0-9_]+))\s+from\s+["']([^"']+)["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const rawNames = match[1] || match[2] || "";
      const importPath = match[3];
      const names = rawNames.split(",").map(n => n.trim().split(/\s+as\s+/)[0]).filter(Boolean);

      names.forEach(name => {
        if (
          /Service\b/i.test(name) ||
          /Store\b/i.test(name) ||
          /Sync\b/i.test(name) ||
          /Manager\b/i.test(name) ||
          /Client\b/i.test(name) ||
          importPath.includes("/services/") ||
          importPath.includes("/server/")
        ) {
          if (!services.includes(name)) services.push(name);
          const resolved = resolveImportPath(importPath, filePath);
          if (resolved) {
            const svcContent = getFileContentCached(resolved);
            if (svcContent) extraContents.push(svcContent);
          }
        }
      });
    }

    services.forEach(svc => {
      const escapedSvc = escapeRegex(svc);
      const methodRegex = new RegExp(`\\b${escapedSvc}\\.([a-zA-Z0-9_]+)\\s*\\(`, "g");
      let mm;
      let hadMethod = false;
      while ((mm = methodRegex.exec(content)) !== null) {
        hadMethod = true;
        const callSig = `${svc}.${mm[1]}()`;
        if (!serviceCalls.includes(callSig)) serviceCalls.push(callSig);
      }
      if (!hadMethod) {
        const directRegex = new RegExp(`\\b${escapedSvc}\\s*\\(`, "g");
        if (directRegex.test(content)) {
          const callSig = `${svc}()`;
          if (!serviceCalls.includes(callSig)) serviceCalls.push(callSig);
        }
      }
    });

    return { services, serviceCalls, extraContents };
  }

  files.forEach(filePath => {
    // Only inspect UI components
    const relPath = path.relative(rootDir, filePath).replace(/\\/g, "/");
    if (!relPath.endsWith(".tsx") && !relPath.endsWith(".jsx") && !relPath.endsWith(".svelte") && !relPath.endsWith(".vue")) {
      return;
    }

    let content = "";
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      return;
    }

    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();

      // Check fetch("/api/...") or axios.post("/api/...")
      const fetchMatch = trimmed.match(/\b(?:fetch|axios\.(?:get|post|put|delete|patch))\s*\(\s*["'`]([^"'`]*\/api\/[^"'`]+)["'`]/);
      if (fetchMatch) {
        const rawTarget = fetchMatch[1];
        const matchingEndpoint = endpoints.find(e => rawTarget.startsWith(e.urlPath) || e.urlPath.startsWith(rawTarget));
        const method = trimmed.match(/method:\s*["'](GET|POST|PUT|DELETE|PATCH)["']/i)?.[1]?.toUpperCase() ||
          trimmed.match(/axios\.(get|post|put|delete|patch)/i)?.[1]?.toUpperCase() ||
          (matchingEndpoint?.methods[0] || "GET");

        let connectedModels: string[] = [];
        let domainServices: string[] = [];
        let serviceCalls: string[] = [];

        if (matchingEndpoint) {
          const epContent = getFileContentCached(matchingEndpoint.filePath);
          const svcInfo = extractDomainServices(epContent, matchingEndpoint.filePath);
          domainServices = svcInfo.services;
          serviceCalls = svcInfo.serviceCalls;
          const combinedContent = [epContent, ...svcInfo.extraContents].join("\n");

          if (driftCollector && matchingEndpoint.filePath) {
            const clientKeys = extractClientPayloadKeys(lines, idx);
            if (clientKeys.length > 0) {
              const serverKeysInfo = extractBackendExpectedKeys(epContent);
              const drifts = detectContractDrift(
                clientKeys,
                serverKeysInfo,
                relPath,
                lineNum,
                matchingEndpoint.relativePath,
                rawTarget,
                "API Route"
              );
              drifts.forEach(d => driftCollector.push(d));
            }
          }

          connectedModels = models
            .filter(m => {
              const nameRegex = new RegExp(`\\b${escapeRegex(m.name)}\\b|\\b${escapeRegex(m.tableName)}\\b`, "i");
              return matchingEndpoint.filePath.toLowerCase().includes(m.name.toLowerCase()) || nameRegex.test(combinedContent);
            })
            .map(m => m.name);
        }

        bridgeItems.push({
          frontendFile: relPath,
          frontendLine: lineNum,
          uiTriggerSnippet: trimmed.slice(0, 60),
          backendTarget: rawTarget,
          targetType: "API Route",
          httpMethod: method,
          connectedModels,
          domainServices,
          serviceCalls,
          externalService: rawTarget.includes("stripe") ? "Stripe" : rawTarget.includes("resend") ? "Resend" : undefined,
        });
      }

      // Check Server Action calls
      actions.forEach(action => {
        const actionCallRegex = new RegExp(`\\b${escapeRegex(action.name)}\\s*\\(`);
        if (actionCallRegex.test(trimmed) && relPath !== action.relativePath) {
          const actionFull = path.resolve(rootDir, action.filePath);
          const actionContent = getFileContentCached(actionFull);
          const svcInfo = extractDomainServices(actionContent, actionFull);
          const combinedAction = [actionContent, ...svcInfo.extraContents].join("\n");

          const connectedModels = models
            .filter(m => {
              const nameRegex = new RegExp(`\\b${escapeRegex(m.name)}\\b|\\b${escapeRegex(m.tableName)}\\b`, "i");
              return nameRegex.test(combinedAction);
            })
            .map(m => m.name)
            .slice(0, 3);

          bridgeItems.push({
            frontendFile: relPath,
            frontendLine: lineNum,
            uiTriggerSnippet: trimmed.slice(0, 60),
            backendTarget: `${action.name}()`,
            targetType: "Server Action",
            httpMethod: "POST",
            connectedModels,
            domainServices: svcInfo.services,
            serviceCalls: svcInfo.serviceCalls,
            externalService: action.externalServices[0],
          });
        }
      });
    });
  });

  return bridgeItems;
}

// 7. Environment Variables & Secret Leak Radar
export function auditEnvAndSecrets(
  files: string[],
  rootDir: string = ROOT_DIR
): EnvAuditReport {
  const documentedKeys = new Set<string>();
  const envExampleCandidates = [
    ".env.example",
    ".env.sample",
    ".env.template",
    ".env.local.example",
    ".env.staging.example"
  ];
  for (const cand of envExampleCandidates) {
    const full = path.join(rootDir, cand);
    if (fs.existsSync(full)) {
      try {
        const lines = fs.readFileSync(full, "utf-8").split("\n");
        lines.forEach(l => {
          const m = l.trim().match(/^#?\s*([A-Za-z0-9_]+)=/);
          if (m) documentedKeys.add(m[1]);
        });
      } catch {}
    }
  }

  const varMap = new Map<string, EnvVariableOccurrence[]>();
  const envRegex = /\b(?:process\.env(?:\.([A-Za-z0-9_]+)|\[["']([A-Za-z0-9_]+)["']\])|import\.meta\.env(?:\.([A-Za-z0-9_]+)|\[["']([A-Za-z0-9_]+)["']\]))/g;

  files.forEach(filePath => {
    const rel = path.relative(rootDir, filePath).replace(/\\/g, "/");
    let content = "";
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      return;
    }

    const lines = content.split("\n");
    const isScriptOrTool = rel.startsWith("scripts/") || rel.startsWith("bin/") || rel.includes("test/") || rel.includes("tests/") || rel.startsWith("scratch/");
    const hasClientDirective = lines.slice(0, 10).some(l => /^\s*["']use client["']/.test(l.trim()));
    const isClientScope = !isScriptOrTool && (
      hasClientDirective ||
      rel.includes("components/ui/") ||
      rel.includes("components/public/") ||
      (rel.includes("app/") && !rel.includes("app/api/") && hasClientDirective)
    );
    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      let match;
      envRegex.lastIndex = 0;
      while ((match = envRegex.exec(line)) !== null) {
        const varName = match[1] || match[2] || match[3] || match[4];
        if (!varName) continue;
        if (!varMap.has(varName)) varMap.set(varName, []);
        varMap.get(varName)!.push({
          filePath,
          relativePath: rel,
          line: lineNum,
          snippet: line.trim().slice(0, 70),
          isClientScope,
        });
      }
    });
  });

  const SYSTEM_VARS = new Set([
    "NODE_ENV", "PORT", "VERCEL", "VERCEL_URL", "VERCEL_ENV", "NEXT_RUNTIME", "CI", "DEBUG", "HOME", "USERPROFILE", "PATH", "PWD", "HOSTNAME", "SHELL", "TEMP", "TMP"
  ]);

  const items: EnvAuditItem[] = [];
  let shadowCount = 0;
  let leakWarningsCount = 0;

  varMap.forEach((occurrences, varName) => {
    const hasClient = occurrences.some(o => o.isClientScope);
    const hasServer = occurrences.some(o => !o.isClientScope);
    const scope = hasClient && hasServer ? "Hybrid (Client & Server)" : hasClient ? "Client ⚡" : "Server 🖥️";

    const isPublicVar = varName.startsWith("NEXT_PUBLIC_") || varName.startsWith("VITE_") || varName.startsWith("PUBLIC_");
    const isDoc = documentedKeys.has(varName) || SYSTEM_VARS.has(varName);
    if (!isDoc) shadowCount++;

    let sensitivity: EnvSensitivity = "CONFIG";
    if (isPublicVar) {
      sensitivity = "PUBLIC";
    } else if (/(?:SECRET|PASSWORD|PRIVATE|CREDENTIAL|SIGNING|ENCRYPTION|SERVICE_ROLE)/i.test(varName)) {
      sensitivity = "CRITICAL_SECRET";
    } else if (/(?:KEY|TOKEN|AUTH|BEARER)/i.test(varName)) {
      sensitivity = "AUTH_KEY";
    } else if (/(?:DATABASE|DB_|SUPABASE|REDIS|POSTGRES|PRISMA)/i.test(varName)) {
      sensitivity = "DATABASE";
    }

    let hasLeakRisk = false;
    let leakMessage: string | undefined = undefined;

    if (hasClient && !isPublicVar && !SYSTEM_VARS.has(varName)) {
      hasLeakRisk = true;
      leakWarningsCount++;
      if (sensitivity === "CRITICAL_SECRET" || sensitivity === "AUTH_KEY" || sensitivity === "DATABASE") {
        leakMessage = "🚨 CRITICAL: Sensitive secret '" + varName + "' accessed in Client Component! High risk of credential exposure.";
      } else {
        leakMessage = "⚠️ WARNING: Private environment variable '" + varName + "' accessed in Client Component (evaluates to undefined in client bundle).";
      }
    }

    items.push({
      name: varName,
      scope,
      sensitivity,
      isPublicVar,
      isDocumented: isDoc,
      occurrences,
      hasLeakRisk,
      leakMessage,
    });
  });

  items.sort((a, b) => {
    if (a.hasLeakRisk !== b.hasLeakRisk) return a.hasLeakRisk ? -1 : 1;
    if (a.isDocumented !== b.isDocumented) return a.isDocumented ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return {
    totalUniqueVars: items.length,
    documentedVarsCount: documentedKeys.size,
    shadowVarsCount: shadowCount,
    leakWarningsCount,
    documentedKeys: Array.from(documentedKeys),
    items,
  };
}

// Writers for docs/backend-atlas/
export function writeBackendAtlas(result: BackendAuditResult, rootDir: string = ROOT_DIR) {
  const outputDir = path.join(rootDir, "docs", "backend-atlas");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. 01_API_ROUTES_AND_ENDPOINTS.md
  let md01 = getAtlasProvenanceHeader(
    "🌐 Backend API Routes & HTTP Endpoints",
    "Complete registry of all API endpoints, route handlers, HTTP methods, and auth protection."
  );
  md01 += `## 📊 Endpoints Summary: **${result.endpoints.length}** Endpoints Detected\n\n`;
  md01 += `| Route URL | Centrality | HTTP Methods | Framework | Auth Guard | Source File |\n`;
  md01 += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  if (result.endpoints.length === 0) {
    md01 += `| _No API endpoints found_ | — | — | — | — | — |\n`;
  } else {
    result.endpoints.forEach(e => {
      const fileLink = makeFileLink(e.relativePath, e.line, `${e.relativePath}:${e.line}`);
      const methodsBadge = e.methods.map(m => `\`${m}\``).join(" ");
      const authBadge = e.isProtected ? `🔒 \`Protected\` (${e.authGuard || "Guarded"})` : `🔓 \`Public\``;
      const centralityBadge = e.centralityBadge || "📌 Standard";
      md01 += `| \`${e.urlPath}\` | ${centralityBadge} | ${methodsBadge} | ${e.framework} | ${authBadge} | ${fileLink} |\n`;
    });
  }
  fs.writeFileSync(path.join(outputDir, "01_API_ROUTES_AND_ENDPOINTS.md"), md01);

  // 2. 02_DATABASE_MODELS_AND_SCHEMA.md
  let md02 = getAtlasProvenanceHeader(
    "🗄️ Database Models & Schema Registry",
    "Statically cataloged tables, fields, types, and foreign key relations from Prisma, Drizzle, and Raw SQL / Supabase Migrations."
  );
  md02 += `## 📊 Models Summary: **${result.models.length}** Database Models Detected\n\n`;

  if (result.models.length === 0) {
    md02 += `_No database schema files detected (Prisma schema.prisma, Drizzle schema.ts, or SQL migrations)._\n`;
  } else {
    result.models.forEach(model => {
      const fileLink = makeFileLink(model.relativePath, model.line, `${model.relativePath}:${model.line}`);
      const centralityBadge = model.centralityBadge ? ` — ${model.centralityBadge}` : "";
      md02 += `### 📦 Model \`${model.name}\` (${model.orm})${centralityBadge}\n\n`;
      md02 += `- **Table Name**: \`${model.tableName}\`\n`;
      md02 += `- **Centrality**: ${model.centralityBadge || "📌 Standard Entity"}\n`;
      md02 += `- **Source**: ${fileLink}\n`;
      md02 += `- **Total Fields**: **${model.fields.length}**\n\n`;

      if (model.fields.length > 0) {
        md02 += `| Field Name | Type | Attributes | Relation Target |\n`;
        md02 += `| :--- | :--- | :--- | :--- |\n`;
        model.fields.forEach(f => {
          const attrs: string[] = [];
          if (f.isId) attrs.push("`@id`");
          if (f.isUnique) attrs.push("`@unique`");
          if (f.isOptional) attrs.push("`optional?`");
          if (f.isArray) attrs.push("`array[]`");
          const attrStr = attrs.length > 0 ? attrs.join(" ") : "_none_";
          const relStr = f.relationTarget ? `➔ \`${f.relationTarget}\`` : "—";
          md02 += `| \`${f.name}\` | \`${f.type}\` | ${attrStr} | ${relStr} |\n`;
        });
        md02 += `\n`;
      }
    });
  }
  fs.writeFileSync(path.join(outputDir, "02_DATABASE_MODELS_AND_SCHEMA.md"), md02);

  // 3. 03_SERVER_ACTIONS_AND_MUTATIONS.md
  let md03 = getAtlasProvenanceHeader(
    "⚡ Server Actions & Mutations Map",
    "Inventory of Next.js Server Actions (`\"use server\"`), parameter signatures, and DB mutations."
  );
  md03 += `## 📊 Server Actions Summary: **${result.serverActions.length}** Actions Detected\n\n`;
  md03 += `| Action Function | Parameters | Connected ORM / DB | Services | File : Line |\n`;
  md03 += `| :--- | :--- | :--- | :--- | :--- |\n`;

  if (result.serverActions.length === 0) {
    md03 += `| _No server actions found_ | — | — | — | — |\n`;
  } else {
    result.serverActions.forEach(a => {
      const fileLink = makeFileLink(a.relativePath, a.line, `${a.relativePath}:${a.line}`);
      const dbStr = a.dbOperations.length > 0 ? a.dbOperations.join(", ") : "_Direct Mutation_";
      const srvStr = a.externalServices.length > 0 ? a.externalServices.join(", ") : "_None_";
      md03 += `| \`${a.name}()\` | \`${a.params}\` | ${dbStr} | ${srvStr} | ${fileLink} |\n`;
    });
  }
  fs.writeFileSync(path.join(outputDir, "03_SERVER_ACTIONS_AND_MUTATIONS.md"), md03);

  // 4. 04_AUTH_AND_MIDDLEWARE_GUARDS.md
  let md04 = getAtlasProvenanceHeader(
    "🛡️ Auth & Middleware Route Guards",
    "Audit of middleware matchers, route protection rules, and authentication providers."
  );

  if (result.authGuards.length === 0) {
    md04 += `_No middleware.ts file detected in project root or src/._\n`;
  } else {
    result.authGuards.forEach(g => {
      const fileLink = makeFileLink(g.relativePath, g.line, `${g.relativePath}:${g.line}`);
      md04 += `## 🔐 Active Middleware: \`${g.authProvider}\`\n\n`;
      md04 += `- **Source**: ${fileLink}\n`;
      md04 += `- **Configured Matchers**: \`${g.matcherPatterns.join("`, `") || "All Routes"}\`\n\n`;

      md04 += `### 🔒 Protected Route Patterns\n\n`;
      if (g.protectedRoutes.length > 0) {
        g.protectedRoutes.forEach(r => md04 += `- \`${r}\` (Requires Authentication)\n`);
      } else {
        md04 += `_No explicitly protected patterns in matcher array._\n`;
      }
    });
  }
  fs.writeFileSync(path.join(outputDir, "04_AUTH_AND_MIDDLEWARE_GUARDS.md"), md04);

  // 5. 05_INTEGRATIONS_AND_WEBHOOKS.md
  let md05 = getAtlasProvenanceHeader(
    "🔌 External Integrations & Webhooks",
    "Map of third-party SDK clients (Stripe, Resend, Supabase, S3) and incoming webhook handlers."
  );
  md05 += `## 📊 Integrations Summary: **${result.integrations.length}** Active Integrations\n\n`;

  if (result.integrations.length === 0) {
    md05 += `_No third-party client integrations detected in package dependencies or code._\n`;
  } else {
    result.integrations.forEach(i => {
      md05 += `### 🚀 ${i.name} (\`${i.category}\`)\n\n`;
      md05 += `- **Total Client Imports**: **${i.clientImports.length}** files\n`;
      if (i.webhookRoutes.length > 0) {
        md05 += `- **Incoming Webhook Handlers**: \`${i.webhookRoutes.join("`, `")}\`\n`;
      }
      md05 += `\n| File | Line | Snippet Preview |\n`;
      md05 += `| :--- | :--- | :--- |\n`;
      i.detectedFiles.slice(0, 8).forEach(d => {
        const fileLink = makeFileLink(d.file, d.line, `${d.file}:${d.line}`);
        md05 += `| ${fileLink} | ${d.line} | \`${escapeMarkdownSnippet(d.snippet, 55)}\` |\n`;
      });
      md05 += `\n`;
    });
  }
  fs.writeFileSync(path.join(outputDir, "05_INTEGRATIONS_AND_WEBHOOKS.md"), md05);

  // 6. 06_FULLSTACK_CROSS_REFERENCE_MAP.md
  let md06 = getAtlasProvenanceHeader(
    "🌉 Fullstack Cross-Reference Bridge",
    "Bi-directional bridge linking Frontend UI triggers directly to Backend APIs, Domain Services, Server Actions, and Database Models."
  );
  md06 += `## 📊 Fullstack Connections: **${result.bridgeItems.length}** Linked Triggers\n\n`;
  md06 += `| Frontend UI Trigger | Action / API Target | Domain Service / Method | Type | Method | Connected Database Models | Service |\n`;
  md06 += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  if (result.bridgeItems.length === 0) {
    md06 += `| _No direct cross-boundary triggers detected_ | — | — | — | — | — | — |\n`;
  } else {
    result.bridgeItems.forEach(b => {
      const fileLink = makeFileLink(b.frontendFile, b.frontendLine, `${path.basename(b.frontendFile)}:${b.frontendLine}`);
      const modelsStr = b.connectedModels.length > 0 ? b.connectedModels.map(m => `\`${m}\``).join(", ") : "_Direct / Dynamic_";
      const serviceStr = b.externalService ? `\`${b.externalService}\`` : "—";
      const serviceCallsStr = b.serviceCalls && b.serviceCalls.length > 0
        ? b.serviceCalls.slice(0, 2).map(s => `\`${s}\``).join(", ")
        : "_Direct Route Handler_";
      md06 += `| ${fileLink} | \`${b.backendTarget}\` | ${serviceCallsStr} | \`${b.targetType}\` | \`${b.httpMethod || "POST"}\` | ${modelsStr} | ${serviceStr} |\n`;
    });
  }
    // Append API Contract & Payload Drift Radar to 06
  md06 += "\n## ⚠️ API Contract & Payload Drift Radar\n\n";
  md06 += "> Detects casing mismatches (e.g. `order_id` vs `orderId`) between Frontend request bodies and Backend route handlers.\n\n";

  const drifts = result.contractDriftWarnings || [];
  if (drifts.length === 0) {
    md06 += "_✅ No API contract or casing drift detected across verified triggers._\n\n";
  } else {
    md06 += "### 🚨 Detected Contract Drifts (**" + drifts.length + "** issues)\n\n";
    md06 += "| Target API / Action | Frontend Caller | Backend Endpoint | Drift Type | Severity | Details |\n";
    md06 += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";
    drifts.forEach(d => {
      const frontLink = makeFileLink(d.frontendFile, d.frontendLine, path.basename(d.frontendFile) + ":" + d.frontendLine);
      const backLink = makeFileLink(d.backendFile, d.backendLine, path.basename(d.backendFile) + ":" + d.backendLine);
      md06 += "| `" + d.backendTarget + "` | " + frontLink + " | " + backLink + " | `" + d.driftType + "` | " + (d.severity === "HIGH" ? "🚨 High" : "⚠️ Medium") + " | " + d.message + " |\n";
    });
    md06 += "\n";
  }
  fs.writeFileSync(path.join(outputDir, "06_FULLSTACK_CROSS_REFERENCE_MAP.md"), md06);

  // 7. 07_ENV_AND_SECRETS_MAP.md
  const envReport = result.envAudit || { totalUniqueVars: 0, documentedVarsCount: 0, shadowVarsCount: 0, leakWarningsCount: 0, documentedKeys: [], items: [] };
  let md07 = getAtlasProvenanceHeader(
    "🔐 Environment Variables & Secret Leak Radar",
    "Static analysis of environment variables, client-side exposure risks, and undocumented shadow keys."
  );

  if (envReport.leakWarningsCount > 0) {
    md07 += "> [!CAUTION]\n> 🚨 **" + envReport.leakWarningsCount + " POTENTIAL CLIENT LEAKS DETECTED**: Sensitive environment variables referenced inside Client Components!\n\n";
  } else {
    md07 += "> [!NOTE]\n> 🛡️ **0 CLIENT SECRET LEAKS DETECTED**: All client-side environment variable accesses use public prefixes or runtime defaults.\n\n";
  }

  md07 += "## 📊 Environment Summary\n\n";
  md07 += "- **Total Unique Variables Referenced**: **" + envReport.totalUniqueVars + "**\n";
  md07 += "- **Documented in .env.example**: **" + envReport.documentedVarsCount + "**\n";
  md07 += "- **Shadow (Undocumented) Variables**: **" + envReport.shadowVarsCount + "**\n";
  md07 += "- **Client Component Exposure Warnings**: **" + envReport.leakWarningsCount + "**\n\n";

  if (envReport.leakWarningsCount > 0) {
    md07 += "### 🚨 Critical Client Leaks & Warnings\n\n";
    md07 += "| Variable Name | Sensitivity | Scope | Source File | Risk Notice |\n";
    md07 += "| :--- | :--- | :--- | :--- | :--- |\n";
    envReport.items.filter(i => i.hasLeakRisk).forEach(i => {
      const firstOcc = i.occurrences[0];
      const link = firstOcc ? makeFileLink(firstOcc.relativePath, firstOcc.line, firstOcc.relativePath + ":" + firstOcc.line) : "—";
      md07 += "| `" + i.name + "` | `" + i.sensitivity + "` | `" + i.scope + "` | " + link + " | " + (i.leakMessage || "Exposure Risk") + " |\n";
    });
    md07 += "\n";
  }

  if (envReport.shadowVarsCount > 0) {
    md07 += "### 👻 Shadow (Undocumented) Variables\n\n";
    md07 += "> Variables used in code but missing from `.env.example`. Add these to prevent missing variable crashes in deployment!\n\n";
    md07 += "| Variable Name | Scope | Sensitivity | Primary Usage File |\n";
    md07 += "| :--- | :--- | :--- | :--- |\n";
    envReport.items.filter(i => !i.isDocumented).forEach(i => {
      const firstOcc = i.occurrences[0];
      const link = firstOcc ? makeFileLink(firstOcc.relativePath, firstOcc.line, firstOcc.relativePath + ":" + firstOcc.line) : "—";
      md07 += "| `" + i.name + "` | `" + i.scope + "` | `" + i.sensitivity + "` | " + link + " |\n";
    });
    md07 += "\n";
  }

  md07 += "### 📋 Master Environment Variable Registry\n\n";
  md07 += "| Variable Name | Scope | Sensitivity | Documented? | Total References |\n";
  md07 += "| :--- | :--- | :--- | :--- | :--- |\n";
  envReport.items.forEach(i => {
    const docBadge = i.isDocumented ? "✅ Documented" : "👻 Shadow";
    md07 += "| `" + i.name + "` | " + i.scope + " | `" + i.sensitivity + "` | " + docBadge + " | **" + i.occurrences.length + "** usages |\n";
  });
  md07 += "\n";

  fs.writeFileSync(path.join(outputDir, "07_ENV_AND_SECRETS_MAP.md"), md07);

  // 8. README.md
  let mdReadme = getAtlasProvenanceHeader(
    "📖 Backend Atlas & Architecture Catalog",
    "Statically cataloged backend infrastructure for this project.\n> Run `npx fullstack-audit --backend` or `npm run audit:backend` to refresh."
  );
  mdReadme += `## 📊 Backend Statistics\n\n`;
  mdReadme += `- **HTTP API Endpoints**: **${result.endpoints.length}**\n`;
  mdReadme += `- **Database Models / Tables**: **${result.models.length}**\n`;
  mdReadme += `- **Server Actions ("use server")**: **${result.serverActions.length}**\n`;
  mdReadme += `- **Auth Middleware Guards**: **${result.authGuards.length > 0 ? result.authGuards[0].authProvider : "None"}**\n`;
  mdReadme += `- **External Integrations**: **${result.integrations.length}** services\n`;
  mdReadme += `- **Fullstack Cross-Reference Links**: **${result.bridgeItems.length}** connected triggers\n\n`;

  if (result.envAudit) {
    mdReadme += "- **Client Secret Leaks**: **" + result.envAudit.leakWarningsCount + "**\n";
    mdReadme += "- **Shadow (Undocumented) Env Vars**: **" + result.envAudit.shadowVarsCount + "**\n";
  }
  mdReadme += "\n## 📑 Backend Atlas Documents\n\n";
  mdReadme += "1. **[01_API_ROUTES_AND_ENDPOINTS.md](./01_API_ROUTES_AND_ENDPOINTS.md)**: HTTP API routes, methods, and parameters.\n";
  mdReadme += "2. **[02_DATABASE_MODELS_AND_SCHEMA.md](./02_DATABASE_MODELS_AND_SCHEMA.md)**: Prisma and Drizzle models, fields, and relations.\n";
  mdReadme += "3. **[03_SERVER_ACTIONS_AND_MUTATIONS.md](./03_SERVER_ACTIONS_AND_MUTATIONS.md)**: Server Actions, parameters, and mutations.\n";
  mdReadme += "4. **[04_AUTH_AND_MIDDLEWARE_GUARDS.md](./04_AUTH_AND_MIDDLEWARE_GUARDS.md)**: Middleware matchers and route protection.\n";
  mdReadme += "5. **[05_INTEGRATIONS_AND_WEBHOOKS.md](./05_INTEGRATIONS_AND_WEBHOOKS.md)**: Stripe, Resend, Supabase, and S3 clients.\n";
  mdReadme += "6. **[06_FULLSTACK_CROSS_REFERENCE_MAP.md](./06_FULLSTACK_CROSS_REFERENCE_MAP.md)**: Cross-boundary link from UI button to backend database & Contract Drift Radar.\n";
  mdReadme += "7. **[07_ENV_AND_SECRETS_MAP.md](./07_ENV_AND_SECRETS_MAP.md)**: Environment variable registry, client secret leaks, and undocumented shadow keys.\n\n";

  fs.writeFileSync(path.join(outputDir, "README.md"), mdReadme);

  // 8. Generate .backend-index.json for sub-3ms lookup
  const backendEntries: AtlasIndexEntry[] = [];
  result.endpoints.forEach(e => {
    backendEntries.push({
      symbol: `${e.methods.join("/")} ${e.urlPath}`,
      category: "api",
      file: e.relativePath,
      line: e.line,
      meta: `${e.framework} [Auth: ${e.authGuard || "Public"}]`,
      atlasRef: `docs/backend-atlas/01_API_ROUTES_AND_ENDPOINTS.md`,
    });
  });

  result.models.forEach(m => {
    backendEntries.push({
      symbol: m.name,
      category: "model",
      file: m.relativePath,
      line: m.line,
      meta: `${m.orm} (${m.fields.length} fields)`,
      atlasRef: `docs/backend-atlas/02_DATABASE_MODELS_AND_SCHEMA.md`,
    });
    if (m.tableName && m.tableName !== m.name) {
      backendEntries.push({
        symbol: m.tableName,
        category: "model",
        file: m.relativePath,
        line: m.line,
        meta: `Table: ${m.tableName} ➔ ${m.orm} Model: ${m.name}`,
        atlasRef: `docs/backend-atlas/02_DATABASE_MODELS_AND_SCHEMA.md`,
      });
    }
    backendEntries.push({
      symbol: `table:${m.tableName || m.name.toLowerCase()}`,
      category: "model",
      file: m.relativePath,
      line: m.line,
      meta: `Table: ${m.tableName || m.name} (${m.orm})`,
      atlasRef: `docs/backend-atlas/02_DATABASE_MODELS_AND_SCHEMA.md`,
    });
  });

  result.serverActions.forEach(a => {
    backendEntries.push({
      symbol: a.name,
      category: "action",
      file: a.relativePath,
      line: a.line,
      meta: `Mutations: ${a.dbOperations.join(", ") || "None"}`,
      atlasRef: `docs/backend-atlas/03_SERVER_ACTIONS_AND_MUTATIONS.md`,
    });
  });

  result.authGuards.forEach(g => {
    backendEntries.push({
      symbol: g.matcherPatterns.join(", ") || "middleware.ts",
      category: "api",
      file: g.relativePath,
      line: g.line,
      meta: `Auth Guard (${g.authProvider})`,
      atlasRef: `docs/backend-atlas/04_AUTH_AND_MIDDLEWARE_GUARDS.md`,
    });
  });

  result.integrations.forEach(i => {
    const firstHit = i.detectedFiles[0];
    backendEntries.push({
      symbol: i.name,
      category: "api",
      file: firstHit ? firstHit.file : "package.json",
      line: firstHit ? firstHit.line : 1,
      meta: `${i.category} (${i.clientImports.join(", ")})`,
      atlasRef: `docs/backend-atlas/05_INTEGRATIONS_AND_WEBHOOKS.md`,
    });
  });

  const nodeMap = new Map<string, { id: string; label: string; type: string }>();
  const links: { source: string; target: string; type: string }[] = [];

  const addNode = (id: string, label: string, type: string) => {
    if (!id || id === "-") return;
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, type });
    }
  };

  result.bridgeItems.forEach(b => {
    const uiName = path.basename(b.frontendFile).replace(/\.[^/.]+$/, "");
    addNode(uiName, uiName, "component");
    addNode(b.backendTarget, b.backendTarget, b.targetType === "Server Action" ? "server_action" : "api_endpoint");
    links.push({ source: uiName, target: b.backendTarget, type: "calls" });

    (b.serviceCalls || []).forEach(s => {
      addNode(s, s, "service");
      links.push({ source: b.backendTarget, target: s, type: "delegates" });
    });

    (b.connectedModels || []).forEach(m => {
      addNode(m, m, "db_model");
      links.push({ source: b.backendTarget, target: m, type: "mutates" });
    });

    if (b.externalService) {
      addNode(b.externalService, b.externalService, "integration");
      links.push({ source: b.backendTarget, target: b.externalService, type: "uses" });
    }
  });

  const causalGraph = {
    nodes: Array.from(nodeMap.values()),
    links,
  };

  const backendIndex = {
    version: FULLSTACK_AUDIT_VERSION,
    engine: FULLSTACK_AUDIT_ENGINE,
    generatedAt: new Date().toISOString(),
    totalEntries: backendEntries.length,
    entries: backendEntries,
    causalGraph,
  };
  fs.writeFileSync(path.join(outputDir, ".backend-index.json"), JSON.stringify(backendIndex, null, 2), "utf-8");

  const fIndexCandidate1 = path.join(path.dirname(outputDir), "frontend-atlas", ".atlas-index.json");
  const fIndexCandidate2 = path.join(rootDir, "docs", "frontend-atlas", ".atlas-index.json");
  const frontendIndexPath = fs.existsSync(fIndexCandidate1) ? fIndexCandidate1 : (fs.existsSync(fIndexCandidate2) ? fIndexCandidate2 : null);
  if (frontendIndexPath) {
    try {
      const fIndex = JSON.parse(fs.readFileSync(frontendIndexPath, "utf-8"));
      fIndex.causalGraph = causalGraph;
      fs.writeFileSync(frontendIndexPath, JSON.stringify(fIndex, null, 2), "utf-8");
    } catch {}
  }

  console.log(`✨ Backend Atlas written to: ${path.relative(rootDir, outputDir)}`);
}

// Main execution function
export async function runUniversalBackendAudit(rootDir: string = ROOT_DIR): Promise<BackendAuditResult> {
  console.log(`🛡️ Initializing Universal Backend Atlas Engine (v${FULLSTACK_AUDIT_VERSION})...`);
  const allFiles: string[] = [];
  getSourceFiles(rootDir, allFiles);
  const uniqueFiles = Array.from(new Set(allFiles));

  const endpoints = parseApiRoutes(uniqueFiles, rootDir);
  const models = parseDatabaseModels(uniqueFiles, rootDir);
  const serverActions = parseServerActions(uniqueFiles, rootDir);
  const authGuards = parseAuthGuards(uniqueFiles, rootDir);
  const integrations = parseIntegrations(uniqueFiles, rootDir);
  const contractDriftWarnings: ContractDriftWarning[] = [];
  const bridgeItems = buildFullstackBridge(uniqueFiles, endpoints, serverActions, models, rootDir, contractDriftWarnings);
  const envAudit = auditEnvAndSecrets(uniqueFiles, rootDir);

  // Symbol Centrality PageRank Calculation
  // 1. Calculate Endpoint Centrality (caller count + in-code mentions)
  const fileContents = new Map<string, string>();
  uniqueFiles.forEach(f => {
    try {
      fileContents.set(f, fs.readFileSync(f, "utf-8"));
    } catch {
      fileContents.set(f, "");
    }
  });

  endpoints.forEach(ep => {
    const triggerCallers = bridgeItems.filter(b => b.backendTarget.startsWith(ep.urlPath) || ep.urlPath.startsWith(b.backendTarget)).length;
    let codeMentions = 0;
    fileContents.forEach(content => {
      if (content.includes(ep.urlPath)) codeMentions++;
    });
    ep.centralityScore = Math.max(triggerCallers, codeMentions);
    ep.centralityBadge = ep.centralityScore >= 5
      ? `🔥 High Traffic (${ep.centralityScore} callers)`
      : ep.centralityScore >= 2
      ? `⭐ Common (${ep.centralityScore} callers)`
      : `📌 Standard (${ep.centralityScore} callers)`;
  });
  // Sort endpoints: highest centrality first, then alphabetical
  endpoints.sort((a, b) => (b.centralityScore || 0) - (a.centralityScore || 0) || a.urlPath.localeCompare(b.urlPath));

  // 2. Calculate Database Model Centrality (occurrences across endpoints, actions, bridge, and service code)
  models.forEach(m => {
    let refCount = 0;
    const nameRegex = new RegExp(`\\b${m.name}\\b|\\b${m.tableName}\\b`, "i");
    fileContents.forEach(content => {
      if (nameRegex.test(content)) refCount++;
    });
    m.centralityScore = refCount;
    m.centralityBadge = refCount >= 10
      ? `🔥 Core Entity (${refCount} refs)`
      : refCount >= 4
      ? `⭐ Active Entity (${refCount} refs)`
      : `📌 Standard Entity (${refCount} refs)`;
  });
  // Sort models: highest centrality first, then alphabetical
  models.sort((a, b) => (b.centralityScore || 0) - (a.centralityScore || 0) || a.name.localeCompare(b.name));

  const result: BackendAuditResult = {
    endpoints,
    models,
    serverActions,
    authGuards,
    integrations,
    bridgeItems,
    contractDriftWarnings,
    envAudit,
  };

  writeBackendAtlas(result, rootDir);
  return result;
}

// Standalone execution if invoked directly
if (process.argv[1] && process.argv[1].includes("audit-backend")) {
  runUniversalBackendAudit();
}
