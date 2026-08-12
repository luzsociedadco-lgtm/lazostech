import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checks = [];

function check(name, relativePath, pattern) {
  const target = path.join(root, relativePath);
  const exists = fs.existsSync(target);
  const content = exists ? fs.readFileSync(target, "utf8") : "";
  const ok = exists && (!pattern || pattern.test(content));
  checks.push({ name, ok, path: relativePath });
}

check("database-schema", "supabase/migrations/20260809035003_asset_layer_enterprise_pilot.sql", /asset_layer_outbox/);
check("database-rls", "supabase/migrations/20260809035003_asset_layer_enterprise_pilot.sql", /enable row level security/);
check("database-storage", "supabase/migrations/20260809035003_asset_layer_enterprise_pilot.sql", /asset-layer-evidence/);
check("remote-verifier", "tools/sql/verify-asset-layer-remote.sql", /transform_asset_layer_lot/);
check("operator-api", "lazos-frontend/app/api/asset-layer/route.ts", /requireAssetLayerContext/);
check("admin-access-api", "lazos-frontend/app/api/asset-layer/access/route.ts", /enterpriseAdmin/);
check("lifecycle-api", "lazos-frontend/app/api/asset-layer/[assetId]/actions/route.ts", /transform_asset_layer_lot/);
check("evidence-api", "lazos-frontend/app/api/asset-layer/[assetId]/evidence/route.ts", /15 \* 1024 \* 1024/);
check("bootstrap-api", "lazos-frontend/app/api/asset-layer/bootstrap/route.ts", /timingSafeEqual/);
check("relayer", "lazos-frontend/app/lib/asset-layer/relay.server.ts", /ASSET_LAYER_OPERATOR_WALLET/);
check("cron-route", "lazos-frontend/app/api/asset-layer/relay/route.ts", /CRON_SECRET/);
check("operator-console", "lazos-frontend/app/reciclaje/operacion/AssetLayerConsole.tsx", /Materiales circulares verificables/);
check("role-console", "lazos-frontend/app/reciclaje/operacion/roles/AssetLayerRoleSetup.tsx", /grantEnterpriseRole/);
check("public-passport", "lazos-frontend/app/reciclaje/lotes/[assetRef]/page.tsx", /Pasaporte digital verificable/);
check("testnet-root", "lazos-frontend/app/lib/asset-layer/config.ts", /6dbfbbe9-d271-4c10-a1bd-2cda227d2453/);
check("radian-excluded", "lazos-frontend/app/lib/asset-layer/config.ts", /assetMaterialProfiles/);

const failed = checks.filter(item => !item.ok);
for (const item of checks) console.log(`${item.ok ? "PASS" : "FAIL"} ${item.name} — ${item.path}`);
console.log(`\nLAZOSTECH_ASSET_LAYER_CODE ${failed.length ? "NOT READY" : "READY"} (${checks.length - failed.length}/${checks.length})`);
console.log("Scope: code and migration artifacts. Run verify:asset-layer:remote for live database evidence. Secrets, role bootstrap and live relayer remain deployment gates.");
process.exit(failed.length ? 1 : 0);
