import path from "path";

/**
 * True when `full` is `root` itself or inside it. Uses path.relative, so a sibling
 * like C:\proj-old is rejected for root C:\proj, and Windows drive-letter case is ignored.
 */
export function isInsideRoot(root, full) {
  const rel = path.relative(path.resolve(root), path.resolve(full));
  return !(rel === ".." || rel.startsWith(".." + path.sep) || path.isAbsolute(rel));
}
