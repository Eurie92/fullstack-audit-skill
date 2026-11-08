// Pure causalGraph helpers for fullstack_impact, fullstack_path and activeFile ranking.
import type { AtlasIndex, CausalGraph, CausalGraphNode } from "./constants.js";

type Node = CausalGraphNode & { source?: string; line?: number };
export interface Dependent { node: Node; depth: number; via: string }

/** Resolve a query to nodes: exact id/label first, then prefix, then substring (case-insensitive). */
export function findNodes(g: CausalGraph, query: string): Node[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const tiers: ((s: string) => boolean)[] = [s => s === q, s => s.startsWith(q), s => s.includes(q)];
  for (const ok of tiers) {
    const hit = g.nodes.filter(n => ok(n.id.toLowerCase()) || ok((n.label || "").toLowerCase()));
    if (hit.length) return hit as Node[];
  }
  return [];
}

/** Reverse BFS: everything that links (directly or transitively) to `startId`. */
export function dependentsOf(g: CausalGraph, startId: string, maxDepth = 3, maxNodes = 60): { items: Dependent[]; truncated: boolean } {
  const byId = new Map(g.nodes.map(n => [n.id, n as Node]));
  const incoming = new Map<string, { source: string; type: string }[]>();
  for (const l of g.links) {
    if (!incoming.has(l.target)) incoming.set(l.target, []);
    incoming.get(l.target)!.push(l);
  }
  const seen = new Set([startId]);
  const items: Dependent[] = [];
  let frontier = [startId];
  for (let depth = 1; depth <= maxDepth && frontier.length; depth++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const l of incoming.get(id) || []) {
        if (seen.has(l.source)) continue;
        seen.add(l.source);
        if (items.length >= maxNodes) return { items, truncated: true };
        items.push({ node: byId.get(l.source) || { id: l.source, type: "unknown" }, depth, via: l.type });
        next.push(l.source);
      }
    }
    frontier = next;
  }
  return { items, truncated: false };
}

/** Shortest directed path (BFS), capped at `maxHops` links. Returns node ids and the link type per hop. */
export function shortestPath(g: CausalGraph, from: string, to: string, maxHops = 8): { ids: string[]; types: string[] } | null {
  const out = new Map<string, { target: string; type: string }[]>();
  for (const l of g.links) {
    if (!out.has(l.source)) out.set(l.source, []);
    out.get(l.source)!.push(l);
  }
  const prev = new Map<string, { id: string; type: string; hops: number }>();
  const seen = new Set([from]);
  const queue = [{ id: from, hops: 0 }];
  while (queue.length) {
    const { id, hops } = queue.shift()!;
    if (id === to) {
      const ids = [id], types: string[] = [];
      for (let c = id; c !== from; ) { const p = prev.get(c)!; ids.unshift(p.id); types.unshift(p.type); c = p.id; }
      return { ids, types };
    }
    if (hops >= maxHops) continue;
    for (const l of out.get(id) || []) {
      if (seen.has(l.target)) continue;
      seen.add(l.target);
      prev.set(l.target, { id, type: l.type, hops: hops + 1 });
      queue.push({ id: l.target, hops: hops + 1 });
    }
  }
  return null;
}

/** Files that share a graph edge with `file` (either direction, nodes carry their `source` file). */
export function neighborFiles(g: CausalGraph | undefined, file: string): Set<string> {
  const out = new Set<string>();
  if (!g) return out;
  const fileOf = new Map(g.nodes.map(n => [n.id, ((n as Node).source || "").replace(/\\/g, "/")]));
  for (const l of g.links) {
    const a = fileOf.get(l.source), b = fileOf.get(l.target);
    if (!a || !b || a === b) continue;
    if (a === file) out.add(b);
    else if (b === file) out.add(a);
  }
  return out;
}

/** Score boost for a hit near the active file: same file 12, graph neighbour 8, same dir 4; scaled by score/100. */
export function proximityBoost(hitFile: string, active: string, neighbors: Set<string>, score: number): number {
  const f = hitFile.replace(/\\/g, "/");
  const dir = (p: string) => p.slice(0, Math.max(0, p.lastIndexOf("/")));
  const base = f === active ? 12 : neighbors.has(f) ? 8 : dir(f) === dir(active) ? 4 : 0;
  return (base * Math.min(score, 100)) / 100;
}

export function hasFileEdges(index: AtlasIndex): boolean {
  const g = index.causalGraph;
  return !!g && g.nodes.some(n => (n as Node).source);
}
