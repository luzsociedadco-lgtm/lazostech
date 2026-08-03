import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requestedTier = process.argv.find(argument => argument.startsWith("--tier="))?.split("=")[1] || "production";
const jsonOutput = process.argv.includes("--json");
const allowedTiers = new Set(["code", "predeploy", "production"]);

if (!allowedTiers.has(requestedTier)) {
  throw new Error("--tier must be code, predeploy, or production");
}

const tierRank = { code: 0, predeploy: 1, production: 2 };
const results = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function add(id, tier, passed, detail) {
  if (tierRank[tier] <= tierRank[requestedTier]) {
    results.push({ id, tier, passed: Boolean(passed), detail });
  }
}

function listFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap(entry => {
    const absolute = path.join(directory, entry);
    return statSync(absolute).isDirectory() ? listFiles(absolute) : [absolute];
  });
}

function isAddress(value) {
  return /^0x[a-fA-F0-9]{40}$/.test(value || "");
}

function git(args) {
  const windowsGit = "C:\\Program Files\\Git\\cmd\\git.exe";
  const command = process.platform === "win32" && existsSync(windowsGit) ? windowsGit : "git";
  return execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
}

const testFiles = listFiles(path.join(root, "test")).filter(file => file.endsWith(".t.sol"));
const executableTestFiles = testFiles.filter(file => /function\s+(test|testFuzz|invariant)/.test(readFileSync(file, "utf8")));
const ci = read(".github/workflows/ci.yml");
const ownership = read("src/facets/core/OwnershipFacet.sol");
const initializer = read("src/init/DiamondInit.sol");
const mainnetDeploy = read("script/DeployMainnetDiamond.s.sol");
const networkConfig = read("lazos-frontend/src/config/network.ts");
const frontendEnvExample = read("lazos-frontend/.env.example");

add("solidity-tests", "code", executableTestFiles.length > 0, `${executableTestFiles.length} executable Solidity test file(s)`);
add("ci-zero-test-guard", "code", ci.includes("Require Solidity tests"), "CI must fail when no Solidity tests exist");
add(
  "ownership-synchronized",
  "code",
  ownership.includes("LibDiamond.setContractOwner(newOwner)") && initializer.includes("LibDiamond.contractOwner()"),
  "business and diamond-cut ownership must move together",
);
add(
  "mainnet-chain-guard",
  "code",
  mainnetDeploy.includes("BASE_MAINNET_CHAIN_ID = 8_453") &&
    mainnetDeploy.includes("CONFIRM_MAINNET") &&
    mainnetDeploy.includes("DEPLOYER_ADDRESS"),
  "mainnet deployment requires chain 8453, an explicit sender and human confirmation",
);
add(
  "mainnet-safe-owner",
  "code",
  mainnetDeploy.includes("DIAMOND_OWNER") && mainnetDeploy.includes("owner must be a Safe/multisig"),
  "mainnet owner cannot remain the deployer EOA",
);
add(
  "mainnet-keystore-policy",
  "code",
  !mainnetDeploy.includes("PRIVATE_KEY") && !mainnetDeploy.includes("envUint"),
  "canonical mainnet deployment must use Foundry's encrypted keystore, not a raw key variable",
);
add(
  "frontend-network-switch",
  "code",
  networkConfig.includes("base.id") && networkConfig.includes("baseSepolia.id"),
  "frontend supports explicit Base Mainnet and Base Sepolia builds",
);
add(
  "frontend-mainnet-rpc-policy",
  "code",
  networkConfig.includes("requires a dedicated NEXT_PUBLIC_RPC_URL"),
  "public Base RPC is rejected for production builds",
);
add(
  "no-frontend-private-key",
  "code",
  !/^NEXT_PUBLIC_.*PRIVATE_KEY=/m.test(frontendEnvExample) && !/^PRIVATE_KEY=/m.test(frontendEnvExample),
  "frontend environment template must never expose or ambiguously name a private key",
);

const evidence = JSON.parse(read("config/mainnet-readiness.json"));

add(
  "safe-configured",
  "predeploy",
  isAddress(evidence.safe.address) && evidence.safe.owners >= 3 && evidence.safe.threshold >= 2,
  "provide a Base Safe address with at least 3 owners and a threshold of at least 2",
);
add("safe-recovery-tested", "predeploy", evidence.safe.recoveryTested, "execute and document a Safe recovery/signing rehearsal");
add(
  "dedicated-rpc",
  "predeploy",
  evidence.rpc.provider && evidence.rpc.dedicatedEndpointConfigured,
  "configure a dedicated Base RPC provider without committing its credential",
);
add("rpc-failover", "predeploy", evidence.rpc.failoverTested, "test a secondary RPC or documented failover procedure");
add("token-policy", "predeploy", evidence.token.policyApproved, "approve minting, cap, supply, vesting and distribution policy");
add("token-source", "predeploy", evidence.token.sourceActivated, "activate and test the canonical NUDOS ERC20 source");
add(
  "token-distribution",
  "predeploy",
  evidence.token.supplyAndDistributionDocumented && evidence.token.treasuryFundingPlanApproved,
  "document allocations and how the Diamond reward treasury is funded",
);
add(
  "external-audit",
  "predeploy",
  evidence.audit.status === "approved" && evidence.audit.reportPath && evidence.audit.criticalFindingsOpen === 0 && evidence.audit.highFindingsOpen === 0,
  "attach an approved external audit with zero open critical/high findings",
);
add(
  "testing-evidence",
  "predeploy",
  Boolean(evidence.testing.coverageReportPath) &&
    evidence.testing.criticalFlowsCovered &&
    evidence.testing.invariantSuiteApproved,
  "archive coverage evidence and approve critical-flow and invariant suites",
);
add(
  "operations-ready",
  "predeploy",
  evidence.operations.monitoringConfigured &&
    evidence.operations.alertsTested &&
    evidence.operations.emergencyControlPolicyApproved &&
    evidence.operations.operatorCustodyApproved &&
    evidence.operations.operatorRotationTested &&
    evidence.operations.incidentRunbookApproved &&
    evidence.operations.rollbackRehearsed,
  "configure monitoring, test alerts, approve emergency/incident controls and rehearse rollback",
);
add(
  "supabase-ready",
  "predeploy",
  evidence.supabase.migrationHistoryVerified &&
    evidence.supabase.securityAdvisorsReviewed &&
    evidence.supabase.backupRestoreTested,
  "verify migrations/advisors and perform a backup restore drill",
);
add(
  "legal-ready",
  "predeploy",
  evidence.legal.tokenAndPrivacyReviewApproved && evidence.legal.termsAndPrivacyPublished,
  "complete token/privacy legal review and publish terms/privacy notices",
);

let gitStatus = "unknown";
try {
  gitStatus = git(["status", "--porcelain"]);
} catch (error) {
  gitStatus = `unavailable: ${error instanceof Error ? error.message : String(error)}`;
}
add("clean-release-worktree", "predeploy", gitStatus === "", gitStatus === "" ? "worktree is clean" : gitStatus);

add(
  "mainnet-addresses",
  "production",
  isAddress(evidence.deployment.diamondAddress) && isAddress(evidence.deployment.tokenAddress),
  "record deployed Diamond and token addresses",
);
add(
  "deployment-transaction",
  "production",
  /^0x[a-fA-F0-9]{64}$/.test(evidence.deployment.transactionHash || ""),
  "record the Base Mainnet deployment transaction hash",
);
add("contracts-verified", "production", evidence.deployment.contractsVerified, "verify all contracts on a Base explorer");
add("mainnet-e2e", "production", evidence.deployment.mainnetE2EPassed, "run the frontend-to-contract E2E check on chain 8453");

const passed = results.filter(result => result.passed).length;
const failed = results.length - passed;
const report = { tier: requestedTier, ready: failed === 0, summary: { total: results.length, passed, failed }, results };

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`NUDOS ${requestedTier} readiness: ${report.ready ? "READY" : "NOT READY"} (${passed}/${results.length})`);
  for (const result of results) {
    console.log(`${result.passed ? "PASS" : "FAIL"} [${result.tier}] ${result.id}: ${result.detail}`);
  }
}

process.exitCode = report.ready ? 0 : 1;
