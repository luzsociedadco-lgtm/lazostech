import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function commandAvailable(command) {
  const extensions = process.platform === "win32" && !path.extname(command)
    ? ["", ".exe", ".cmd", ".bat"]
    : [""];
  return (process.env.PATH ?? "")
    .split(path.delimiter)
    .filter(Boolean)
    .some(directory => extensions.some(extension => existsSync(path.join(directory, `${command}${extension}`))));
}

function commandWorks(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 8_000,
    windowsHide: true,
  });
  return result.status === 0;
}

function linkedProjectRef() {
  const refPath = path.join(root, "supabase", ".temp", "project-ref");
  return existsSync(refPath) ? readFileSync(refPath, "utf8").trim() : "";
}

function targetIsIsolated(sourceRef) {
  const target = process.env.SUPABASE_RESTORE_TARGET_DB_URL;
  if (!target) return { passed: false, detail: "SUPABASE_RESTORE_TARGET_DB_URL is not set" };

  let url;
  try {
    url = new URL(target);
  } catch {
    return { passed: false, detail: "restore target is not a valid Postgres URL" };
  }
  if (!new Set(["postgres:", "postgresql:"]).has(url.protocol)) {
    return { passed: false, detail: "restore target must use postgres or postgresql" };
  }

  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  if (localHosts.has(url.hostname)) return { passed: true, detail: "local isolated target declared" };

  const targetRef = process.env.SUPABASE_RESTORE_TARGET_PROJECT_REF?.trim();
  if (!targetRef) {
    return { passed: false, detail: "remote target requires SUPABASE_RESTORE_TARGET_PROJECT_REF" };
  }
  if (sourceRef && targetRef === sourceRef) {
    return { passed: false, detail: "restore target matches the linked production project" };
  }
  return { passed: true, detail: "distinct remote target declared" };
}

const sourceRef = linkedProjectRef();
const dockerClientAvailable = commandAvailable("docker");
const dockerEngineAvailable =
  dockerClientAvailable && commandWorks("docker", ["version", "--format", "{{.Server.Version}}"]);
const hostPsqlAvailable = commandAvailable("psql");
const checks = [
  {
    id: "linked-project",
    passed: Boolean(sourceRef),
    detail: sourceRef ? "linked project metadata present" : "supabase/.temp/project-ref is missing",
  },
  {
    id: "supabase-cli",
    passed: existsSync(path.join(root, "node_modules", ".bin", process.platform === "win32" ? "supabase.cmd" : "supabase")),
    detail: "project-pinned Supabase CLI",
  },
  {
    id: "docker-client",
    passed: dockerClientAvailable,
    detail: "required by Supabase CLI db dump and the local target",
  },
  {
    id: "docker-engine",
    passed: dockerEngineAvailable,
    detail: "Docker engine must be reachable by the current user",
  },
  {
    id: "psql",
    passed: hostPsqlAvailable || dockerEngineAvailable,
    detail: hostPsqlAvailable
      ? "host psql available"
      : "use psql inside the disposable Supabase database container",
  },
  {
    id: "isolated-target",
    ...targetIsIsolated(sourceRef),
  },
];

const ready = checks.every(check => check.passed);
console.log(JSON.stringify({ ready, checks }, null, 2));
process.exitCode = ready ? 0 : 1;
