import fs from "fs";
import { ethers } from "ethers";

const ROOT = process.cwd();

function loadEnv() {
  const entries = fs
    .readFileSync(`${ROOT}\\.env`, "utf8")
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

function loadAbi(relativePath) {
  return JSON.parse(fs.readFileSync(`${ROOT}\\${relativePath}`, "utf8")).abi;
}

function bn(value) {
  return value == null ? null : value.toString();
}

function fmtImpact(impact) {
  return {
    aluminium: bn(impact.aluminium ?? impact[0]),
    plastic: bn(impact.plastic ?? impact[1]),
    cardboard: bn(impact.cardboard ?? impact[2]),
    glass: bn(impact.glass ?? impact[3]),
    totalActions: bn(impact.totalActions ?? impact[4]),
  };
}

async function sendTx(label, txPromise) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  console.log(`${label}: ${tx.hash}`);
  return receipt;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function contract(address, abiPath, runner) {
  return new ethers.Contract(address, loadAbi(abiPath), runner);
}

async function main() {
  const env = loadEnv();
  const provider = new ethers.JsonRpcProvider(env.RPC_URL);
  const owner = new ethers.Wallet(env.PRIVATE_KEY, provider);
  const user = new ethers.Wallet(env.PRIVATE_USER_TEST, provider);
  const diamond = env.DIAMOND;

  const ownership = contract(diamond, "out/OwnershipFacet.sol/OwnershipFacet.json", provider);
  const universityFacet = contract(diamond, "out/UniversityFacet.sol/UniversityFacet.json", owner);
  const campusFacet = contract(diamond, "out/CampusFacet.sol/CampusFacet.json", owner);
  const machineFacet = contract(diamond, "out/MachineFacet.sol/MachineFacet.json", owner);
  const profileFacetUser = contract(diamond, "out/ProfileFacet.sol/ProfileFacet.json", user);
  const rewardFacetOwner = contract(diamond, "out/RewardFacet.sol/RewardFacet.json", owner);
  const rewardFacetRead = contract(diamond, "out/RewardFacet.sol/RewardFacet.json", provider);
  const recycleFacetOracle = contract(diamond, "out/RecycleFacet.sol/RecycleFacet.json", user);
  const recycleFacetOwner = contract(diamond, "out/RecycleFacet.sol/RecycleFacet.json", owner);
  const recycleFacetRead = contract(diamond, "out/RecycleFacet.sol/RecycleFacet.json", provider);
  const credentialFacetOwner = contract(
    diamond,
    "out/ImpactCredentialFacet.sol/ImpactCredentialFacet.json",
    owner,
  );
  const credentialFacetRead = contract(
    diamond,
    "out/ImpactCredentialFacet.sol/ImpactCredentialFacet.json",
    provider,
  );
  const machineFacetRead = contract(diamond, "out/MachineFacet.sol/MachineFacet.json", provider);
  const campusFacetRead = contract(diamond, "out/CampusFacet.sol/CampusFacet.json", provider);
  const profileFacetRead = contract(diamond, "out/ProfileFacet.sol/ProfileFacet.json", provider);
  const universityFacetRead = contract(diamond, "out/UniversityFacet.sol/UniversityFacet.json", provider);

  const now = Date.now();
  const universityId = BigInt(`9${String(now).slice(-8)}`);
  const campusId = universityId + 1n;
  const testYear = 2026;

  console.log("=== Operative Layer E2E Check ===");
  console.log(`Diamond: ${diamond}`);
  console.log(`Owner: ${owner.address}`);
  console.log(`User/Oracle: ${user.address}`);
  console.log(`Chain owner(): ${await ownership.owner()}`);

  const initialCampusIds = await campusFacetRead.listCampusIds().catch(() => []);
  const initialProfiles = await profileFacetRead.listProfiles().catch(() => []);
  const initialMachines = await machineFacetRead.getMachines().catch(() => []);
  const initialUserImpact = fmtImpact(await recycleFacetRead.apiUserImpact(user.address));
  const initialNudos = await rewardFacetRead.getNudos(user.address);
  const initialCredentialIds = await credentialFacetRead.getUserCredentials(user.address).catch(() => []);
  const initialRateAL = await rewardFacetRead.getRecycleRate(0);

  console.log("\nInitial deployed state");
  console.log(
    JSON.stringify(
      {
        campusIds: initialCampusIds.map(bn),
        machineIds: initialMachines.map(bn),
        profiles: initialProfiles,
        userImpact: initialUserImpact,
        userNudos: bn(initialNudos),
        userCredentialIds: initialCredentialIds.map(bn),
        recycleRateAL: bn(initialRateAL),
      },
      null,
      2,
    ),
  );

  console.log("\nSeeding minimum operative entities");
  await sendTx("addUniversityStaff(owner)", universityFacet.addUniversityStaff(owner.address));

  let profileExists = true;
  try {
    await profileFacetRead.getProfile(user.address);
  } catch {
    profileExists = false;
  }

  await sendTx(
    "createUniversity",
    universityFacet.createUniversity(universityId, `E2E University ${universityId}`, "ipfs://e2e/university"),
  );

  let createdUniversityCheck = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    createdUniversityCheck = await universityFacetRead.getUniversity(universityId);
    if (createdUniversityCheck[0] === universityId) {
      break;
    }
    console.log(`Waiting for university visibility on RPC (attempt ${attempt})`);
    await sleep(2000);
  }

  if (!createdUniversityCheck || createdUniversityCheck[0] !== universityId) {
    throw new Error(`University ${universityId} was not readable after creation`);
  }

  let campusCreated = false;
  let campusAttempt = 0;
  while (!campusCreated && campusAttempt < 3) {
    campusAttempt += 1;
    try {
      await sendTx(
        `createCampus(attempt ${campusAttempt})`,
        campusFacet.createCampus(campusId, universityId, `E2E Campus ${campusId}`, "ipfs://e2e/campus"),
      );
      campusCreated = true;
    } catch (error) {
      if (campusAttempt >= 3) {
        throw error;
      }
      console.log(`createCampus retry after transient failure: ${error.shortMessage ?? error.message}`);
      await sleep(2500);
    }
  }

  if (!profileExists) {
    await sendTx(
      "registerProfile(user)",
      profileFacetUser.registerProfile("ipfs://e2e/profile", universityId, 1),
    );
  } else {
    console.log("registerProfile(user): skipped, profile already exists");
  }

  await sendTx("setRecycleRate(AL)", rewardFacetOwner.setRecycleRate(0, ethers.parseEther("0.25")));

  const registerReceipt = await sendTx(
    "registerMachine",
    machineFacet.registerMachine(campusId, "ipfs://e2e/machine", user.address),
  );

  const machineEvent = registerReceipt.logs
    .map((log) => {
      try {
        return machineFacet.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === "MachineRegistered");

  if (!machineEvent) {
    throw new Error("MachineRegistered event not found");
  }

  const machineId = machineEvent.args.machineId;
  console.log(`Machine created with id ${machineId}`);

  let createdMachineCheck = null;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    createdMachineCheck = await machineFacetRead.getMachine(machineId);
    if (createdMachineCheck.id === machineId) {
      break;
    }
    console.log(`Waiting for machine visibility on RPC (attempt ${attempt})`);
    await sleep(2000);
  }

  if (!createdMachineCheck || createdMachineCheck.id !== machineId) {
    throw new Error(`Machine ${machineId} was not readable after creation`);
  }

  try {
    await sendTx("unlinkOracle(user)", machineFacet.unlinkOracle(user.address));
  } catch (error) {
    console.log(`unlinkOracle(user): skipped, ${error.shortMessage ?? error.message}`);
  }

  let oracleLinked = false;
  let oracleAttempt = 0;
  while (!oracleLinked && oracleAttempt < 3) {
    oracleAttempt += 1;
    try {
      await sendTx(
        `linkOracleToMachine(attempt ${oracleAttempt})`,
        machineFacet.linkOracleToMachine(user.address, machineId),
      );
      oracleLinked = true;
    } catch (error) {
      if (oracleAttempt >= 3) {
        throw error;
      }
      console.log(`linkOracleToMachine retry after transient failure: ${error.shortMessage ?? error.message}`);
      await sleep(2500);
    }
  }

  await sendTx("setRecyclingOracle(user,true)", recycleFacetOwner.setRecyclingOracle(user.address, true));

  const beforeImpact = fmtImpact(await recycleFacetRead.apiUserImpact(user.address));
  const beforeNudos = await rewardFacetRead.getNudos(user.address);
  const beforeHistory = await recycleFacetRead.getRecycleHistory(user.address);

  let recycleReceipt = null;
  let recycleAttempt = 0;
  while (!recycleReceipt && recycleAttempt < 3) {
    recycleAttempt += 1;
    try {
      recycleReceipt = await sendTx(
        `recordRecycleFromOracle(attempt ${recycleAttempt})`,
        recycleFacetOracle.recordRecycleFromOracle(machineId, user.address, 4, 0, 0, 0),
      );
    } catch (error) {
      if (recycleAttempt >= 3) {
        throw error;
      }
      console.log(`recordRecycleFromOracle retry after transient failure: ${error.shortMessage ?? error.message}`);
      await sleep(2500);
    }
  }

  const rewardTriggered = recycleReceipt.logs
    .map((log) => {
      try {
        return recycleFacetOracle.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed?.name === "RewardTriggered");

  let afterImpactRaw = await recycleFacetRead.apiUserImpact(user.address);
  let recycleHistory = await recycleFacetRead.getRecycleHistory(user.address);
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const actionCountBefore = BigInt(beforeImpact.totalActions ?? "0");
    const actionCountAfter = BigInt(afterImpactRaw.totalActions ?? afterImpactRaw[4] ?? 0);
    if (actionCountAfter > actionCountBefore || recycleHistory.length > beforeHistory.length) {
      break;
    }
    console.log(`Waiting for recycle state visibility on RPC (attempt ${attempt})`);
    await sleep(2000);
    afterImpactRaw = await recycleFacetRead.apiUserImpact(user.address);
    recycleHistory = await recycleFacetRead.getRecycleHistory(user.address);
  }

  const afterImpact = fmtImpact(afterImpactRaw);
  const afterNudos = await rewardFacetRead.getNudos(user.address);

  let mintedCredentialId = null;
  let credentialMintError = null;
  const existingCredentialIds = await credentialFacetRead.getUserCredentials(user.address);
  const yearAlreadyMinted = await Promise.all(
    existingCredentialIds.map(async (id) => {
      const credential = await credentialFacetRead.getCredential(id);
      return Number(credential.year) === testYear;
    }),
  ).then((flags) => flags.some(Boolean));

  if (!yearAlreadyMinted) {
    try {
      const credentialReceipt = await sendTx(
        "mintImpactCredential",
        credentialFacetOwner.mintImpactCredential(user.address, testYear),
      );

      const mintedEvent = credentialReceipt.logs
        .map((log) => {
          try {
            return credentialFacetOwner.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed?.name === "ImpactCredentialMinted");

      mintedCredentialId = mintedEvent?.args?.tokenId?.toString() ?? null;
    } catch (error) {
      credentialMintError = error.shortMessage ?? error.message;
      console.log(`mintImpactCredential failed: ${credentialMintError}`);
    }
  } else {
    console.log(`mintImpactCredential: skipped, user already has a credential for year ${testYear}`);
  }

  const finalCredentialIds = await credentialFacetRead.getUserCredentials(user.address);
  const createdUniversity = await universityFacetRead.getUniversity(universityId);
  const createdCampus = await campusFacetRead.getCampus(campusId);
  const createdMachine = await machineFacetRead.getMachine(machineId);

  console.log("\nE2E result");
  console.log(
    JSON.stringify(
      {
        createdUniversity: {
          id: bn(createdUniversity[0]),
          name: createdUniversity[1],
          metadataURI: createdUniversity[2],
          campusIds: createdUniversity[3].map(bn),
        },
        createdCampus: {
          id: bn(createdCampus[0]),
          universityId: bn(createdCampus[1]),
          name: createdCampus[2],
          metadataURI: createdCampus[3],
          staffList: createdCampus[4],
        },
        createdMachine: {
          id: bn(createdMachine.id),
          campusId: bn(createdMachine.campusId),
          metadataURI: createdMachine.metadataURI,
          operator: createdMachine.operator,
          active: createdMachine.active,
        },
        beforeImpact,
        afterImpact,
        recycleHistoryBeforeCount: beforeHistory.length,
        recycleHistoryCount: recycleHistory.length,
        lastRecycleRecord:
          recycleHistory.length > 0
            ? {
                aluminium: bn(recycleHistory[recycleHistory.length - 1].record.aluminium),
                plastic: bn(recycleHistory[recycleHistory.length - 1].record.plastic),
                cardboard: bn(recycleHistory[recycleHistory.length - 1].record.cardboard),
                glass: bn(recycleHistory[recycleHistory.length - 1].record.glass),
                rewardBaseUnit: bn(recycleHistory[recycleHistory.length - 1].record.rewardBaseUnit),
              }
            : null,
        nudosBefore: bn(beforeNudos),
        nudosAfter: bn(afterNudos),
        rewardTriggered: rewardTriggered
          ? {
              user: rewardTriggered.args.user,
              amount: bn(rewardTriggered.args.amount),
            }
          : null,
        recycleLogCount: recycleReceipt.logs.length,
        credentialIdsBefore: existingCredentialIds.map(bn),
        credentialIdsAfter: finalCredentialIds.map(bn),
        mintedCredentialId,
        credentialMintError,
      },
      null,
      2,
    ),
  );

  if (afterNudos === beforeNudos) {
    console.log(
      "\nWARNING: Recycling impact was recorded but NUDOS balance did not increase. This strongly suggests the recycle reward path is not emitting economic rewards on the current deployment.",
    );
  }
}

main().catch((error) => {
  console.error("\nE2E check failed");
  console.error(error);
  process.exit(1);
});
