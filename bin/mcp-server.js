#!/usr/bin/env node
// Thin shim: the single source is scripts/mcp-server.ts, compiled to dist/ (npm run build).
import { startMcpServer } from "../dist/mcp-server.js";
startMcpServer();
