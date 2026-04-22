import fs from "fs";
import path from "path";
import solc from "solc";
import { ethers } from "ethers";

const ROOT = process.cwd();

function loadEnv() {
  const entries = fs
    .readFileSync(path.join(ROOT, ".env"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^export\s+/, ""))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    });

  return Object.fromEntries(entries);
}

const ENTRY_FILES = [
  "src/facets/economy/RewardFacet.sol",
  "src/facets/impact/ImpactCredentialFacet.sol",
  "src/facets/recycling/RecycleFacet.sol",
  "src/facets/recycling/ProgramFacet.sol",
  "src/facets/recycling/UniversityFacet.sol",
  "src/facets/machines/MachineFacet.sol",
];

function compileContracts() {
  const sources = {};
  const visited = new Set();
  const importRegex = /import\s+[^"']*["']([^"']+)["'];/g;

  function resolveImport(fromFile, imp) {
    if (imp.startsWith("src/")) return imp.replace(/\\/g, "/");
    if (imp.startsWith("./") || imp.startsWith("../")) {
      return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), imp));
    }
    if (imp.startsWith("lib/")) return imp.replace(/\\/g, "/");
    return imp.replace(/\\/g, "/");
  }

  function addFile(rel) {
    rel = rel.replace(/\\/g, "/");
    if (visited.has(rel)) return;
    visited.add(rel);

    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing import: ${rel}`);
    }

    const content = fs.readFileSync(abs, "utf8");
    sources[rel] = { content };

    for (const match of content.matchAll(importRegex)) {
      addFile(resolveImport(rel, match[1]));
    }
  }

  for (const file of ENTRY_FILES) {
    addFile(file);
  }

  const input = {
    language: "Solidity",
    sources,
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors || []).filter((err) => err.severity === "error");
  if (errors.length) {
    throw new Error(JSON.stringify(errors, null, 2));
  }

  return output.contracts;
}

function getCompiledContract(compiled, sourcePath, contractName) {
  const contract = compiled[sourcePath]?.[contractName];
  if (!contract) {
    throw new Error(`Compiled contract not found: ${sourcePath}:${contractName}`);
  }
  return contract;
}

function getSelectors(abi) {
  const iface = new ethers.Interface(abi);
  return abi
    .filter((item) => item.type === "function")
    .map((item) => iface.getFunction(item.name).selector);
}

async function deployFacet(wallet, artifact, label) {
  const factory = new ethers.ContractFactory(artifact.abi, artifact.evm.bytecode.object, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`${label} deployed: ${address}`);
  return address;
}

async function main() {
  const env = loadEnv();
  const provider = new ethers.JsonRpcProvider(env.RPC_URL);
  const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);
  const diamond = env.DIAMOND;

  const compiled = compileContracts();
  const loupeAbi = JSON.parse(
    fs.readFileSync(path.join(ROOT, "out", "DiamondLoupeFacet.sol", "DiamondLoupeFacet.json"), "utf8"),
  ).abi;
  const diamondCutAbi = JSON.parse(
    fs.readFileSync(path.join(ROOT, "out", "IDiamondCut.sol", "IDiamondCut.json"), "utf8"),
  ).abi;
  const loupe = new ethers.Contract(diamond, loupeAbi, provider);
  const diamondCut = new ethers.Contract(diamond, diamondCutAbi, wallet);

  const facetSpecs = [
    {
      sourcePath: "src/facets/economy/RewardFacet.sol",
      contractName: "RewardFacet",
      label: "RewardFacet",
    },
    {
      sourcePath: "src/facets/impact/ImpactCredentialFacet.sol",
      contractName: "ImpactCredentialFacet",
      label: "ImpactCredentialFacet",
    },
    {
      sourcePath: "src/facets/recycling/RecycleFacet.sol",
      contractName: "RecycleFacet",
      label: "RecycleFacet",
    },
    {
      sourcePath: "src/facets/recycling/ProgramFacet.sol",
      contractName: "ProgramFacet",
      label: "ProgramFacet",
    },
    {
      sourcePath: "src/facets/recycling/UniversityFacet.sol",
      contractName: "UniversityFacet",
      label: "UniversityFacet",
    },
    {
      sourcePath: "src/facets/machines/MachineFacet.sol",
      contractName: "MachineFacet",
      label: "MachineFacet",
    },
  ];

  const cuts = [];

  for (const spec of facetSpecs) {
    const artifact = getCompiledContract(compiled, spec.sourcePath, spec.contractName);
    const selectors = getSelectors(artifact.abi);
    const addSelectors = [];
    const replaceSelectors = [];
    const facetAddress = await deployFacet(wallet, artifact, spec.label);

    for (const selector of selectors) {
      const existingFacet = await loupe.facetAddress(selector);
      if (existingFacet === ethers.ZeroAddress) {
        addSelectors.push(selector);
      } else {
        replaceSelectors.push(selector);
      }
    }

    if (addSelectors.length > 0) {
      cuts.push({
        facetAddress,
        action: 0,
        functionSelectors: addSelectors,
      });
    }

    if (replaceSelectors.length > 0) {
      cuts.push({
        facetAddress,
        action: 1,
        functionSelectors: replaceSelectors,
      });
    }
  }

  if (cuts.length === 0) {
    console.log("No diamond cut changes detected.");
  } else {
    const tx = await diamondCut.diamondCut(cuts, ethers.ZeroAddress, "0x");
    console.log(`diamondCut tx: ${tx.hash}`);
    await tx.wait();
  }

  const rewardArtifact = getCompiledContract(
    compiled,
    "src/facets/economy/RewardFacet.sol",
    "RewardFacet",
  );
  const rewardFacet = new ethers.Contract(diamond, rewardArtifact.abi, wallet);
  const currentBaseUnit = await rewardFacet.getRewardBaseUnit().catch(() => 0n);
  if (currentBaseUnit === 0n) {
    const tx = await rewardFacet.setRewardBaseUnit(1);
    console.log(`setRewardBaseUnit tx: ${tx.hash}`);
    await tx.wait();
  }

  console.log("Operative layer upgrade completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
