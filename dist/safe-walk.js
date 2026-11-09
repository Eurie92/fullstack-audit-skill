import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
const gitCache = new Map();
function isLink(p) {
    try {
        return fs.lstatSync(p).isSymbolicLink();
    }
    catch {
        return true; // unreadable or vanished: treat as skip
    }
}
/** Candidate files (relative to dir) from git, or null if git/repo unavailable. Cached per dir. */
function gitList(dir) {
    if (gitCache.has(dir))
        return gitCache.get(dir);
    let out = null;
    try {
        const r = spawnSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
            cwd: dir, shell: false, encoding: "utf8", maxBuffer: 256 * 1024 * 1024, windowsHide: true,
        });
        if (!r.error && r.status === 0)
            out = r.stdout.split("\0").filter(Boolean);
    }
    catch { /* fall through */ }
    gitCache.set(dir, out);
    return out;
}
function manualWalk(dir, f, out) {
    let items;
    try {
        items = fs.readdirSync(dir);
    }
    catch {
        return;
    }
    for (const item of items) {
        const full = path.join(dir, item);
        let st;
        try {
            st = fs.lstatSync(full);
        }
        catch {
            continue;
        }
        if (st.isSymbolicLink())
            continue;
        if (st.isDirectory()) {
            if (item !== "cloned-repos" && !f.skipDir(item))
                manualWalk(full, f, out);
        }
        else if (f.acceptFile(item)) {
            out.push(full);
        }
    }
}
export function walkFiles(dir, f, fileList = []) {
    if (!fs.existsSync(dir))
        return fileList;
    const listed = gitList(dir);
    // Empty list = not a repo we can use (or the dir itself is gitignored): walk manually.
    if (!listed || listed.length === 0) {
        manualWalk(dir, f, fileList);
        return fileList;
    }
    for (const rel of listed) {
        const parts = rel.split("/");
        const name = parts[parts.length - 1];
        if (parts.slice(0, -1).some((d) => d === "cloned-repos" || f.skipDir(d)))
            continue;
        if (!f.acceptFile(name))
            continue;
        const full = path.join(dir, ...parts);
        if (isLink(full))
            continue;
        try {
            if (!fs.lstatSync(full).isFile())
                continue;
        }
        catch {
            continue;
        }
        fileList.push(full);
    }
    return fileList;
}
