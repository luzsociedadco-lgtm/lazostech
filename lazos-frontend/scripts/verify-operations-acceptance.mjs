import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAddress, verifyMessage } from "ethers";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const evidenceDir = path.join(root, "docs", "evidence", "operations-acceptance");
const roster = "NUDOS-OPS-2026-08-13";
const safe = "0x780811229991222a77F10895371851ca0a388364";
const expected = [
  ["604D.json", "0xF8Cd6CA7E4ad04c5BF1b0F1E59AaB5fD0537604D", "incident-lead-safe-owner-604D"],
  ["54D6.json", "0xEfC99b9e1240fa74d1DC72fa0cF3f8E1eB7554D6", "backup-incident-lead-safe-owner-54D6"],
  ["05BD.json", "0x1915c7eC19c8167fb3388592449A7A438d9B05BD", "privacy-communications-safe-owner-05BD"],
  ["FBE9.json", "0x8Bae87ff96874175aa330dc287F412240d19Fbe9", "application-relayer-operator-FBE9"],
];

const sha256 = async (relativePath) =>
  createHash("sha256").update(await readFile(path.join(root, relativePath))).digest("hex");

const policyHash = await sha256(path.join("docs", "policies", "emergency-controls.md"));
const runbookHash = await sha256(path.join("docs", "runbooks", "incident-response.md"));

for (const [file, account, role] of expected) {
  const proof = JSON.parse(await readFile(path.join(evidenceDir, file), "utf8"));
  const recovered = getAddress(verifyMessage(proof.message, proof.signature));
  const requiredLines = [
    `Roster: ${roster}`,
    `Account: ${getAddress(account)}`,
    `Role: ${role}`,
    `Production Safe: ${safe}`,
    `Emergency policy SHA-256: ${policyHash}`,
    `Incident runbook SHA-256: ${runbookHash}`,
  ];
  if (proof.roster !== roster || proof.role !== role || getAddress(proof.account) !== getAddress(account)) {
    throw new Error(`${file}: roster, account or role mismatch`);
  }
  if (recovered !== getAddress(account) || getAddress(proof.recovered) !== recovered || proof.verified !== true) {
    throw new Error(`${file}: invalid signature recovery`);
  }
  if (!requiredLines.every((line) => proof.message.includes(line))) {
    throw new Error(`${file}: signed message does not match current policy/runbook hashes`);
  }
}

console.log(`NUDOS_OPERATIONS_ACCEPTANCE=PASS proofs=${expected.length} policy=${policyHash} runbook=${runbookHash}`);
