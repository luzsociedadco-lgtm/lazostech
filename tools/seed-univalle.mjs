import fs from "fs";
import path from "path";
import { ethers } from "ethers";
import { UNIVALLE_SEED } from "./univalle-seed-data.mjs";

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

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function sendTx(label, txPromise) {
  const tx = await txPromise;
  console.log(`${label}: ${tx.hash}`);
  await tx.wait();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const env = loadEnv();
  const provider = new ethers.JsonRpcProvider(env.RPC_URL);
  const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);
  const diamond = env.DIAMOND;

  const universityAbi = [
    "function listUniversityIds() view returns (uint256[])",
    "function getUniversity(uint256 universityId) view returns (uint256 id, string name, string metadataURI, uint256[] campusIds)",
    "function createUniversity(uint256 universityId, string name, string metadataURI)",
    "function addUniversityStaff(address staff)",
  ];
  const campusAbi = [
    "function listCampusIds() view returns (uint256[])",
    "function getCampus(uint256 campusId) view returns (uint256 id, uint256 universityId, string name, string metadataURI, address[] staffList)",
    "function createCampus(uint256 campusId, uint256 universityId, string name, string metadataURI)",
  ];
  const programAbi = [
    "function listProgramIds() view returns (uint256[])",
    "function getProgram(uint256 programId) view returns (uint256 id, uint256 campusId, string name, string metadataURI, address coordinator)",
    "function createProgram(uint256 programId, uint256 campusId, string name, string metadataURI, address coordinator)",
  ];

  const universityFacet = new ethers.Contract(diamond, universityAbi, wallet);
  const campusFacet = new ethers.Contract(diamond, campusAbi, wallet);
  const programFacet = new ethers.Contract(diamond, programAbi, wallet);

  await sendTx("addUniversityStaff(owner)", universityFacet.addUniversityStaff(wallet.address));

  const universityIds = await universityFacet.listUniversityIds();
  let universityId = null;

  for (const id of universityIds) {
    const university = await universityFacet.getUniversity(id);
    if (university.name === UNIVALLE_SEED.university.name) {
      universityId = id;
      break;
    }
  }

  if (universityId == null) {
    universityId = 7600001n;
    await sendTx(
      "createUniversity(Universidad del Valle)",
      universityFacet.createUniversity(
        universityId,
        UNIVALLE_SEED.university.name,
        UNIVALLE_SEED.university.metadataURI,
      ),
    );
  } else {
    console.log(`createUniversity(Universidad del Valle): skipped, existing id ${universityId}`);
  }

  const campusIds = await campusFacet.listCampusIds();
  const campusIndex = new Map();
  for (const id of campusIds) {
    const campus = await campusFacet.getCampus(id);
    campusIndex.set(`${campus.universityId}:${campus.name}`, id);
  }

  const existingProgramIds = await programFacet.listProgramIds();
  const programIndex = new Map();
  for (const id of existingProgramIds) {
    const program = await programFacet.getProgram(id);
    programIndex.set(`${program.campusId}:${program.name}`, id);
  }

  let nextCampusId = campusIds.reduce((max, id) => (id > max ? id : max), 7601000n) + 1n;
  let nextProgramId =
    existingProgramIds.reduce((max, id) => (id > max ? id : max), 7610000n) + 1n;

  for (const campusSeed of UNIVALLE_SEED.campuses) {
    let campusId = campusIndex.get(`${universityId}:${campusSeed.name}`);
    if (!campusId) {
      campusId = nextCampusId;
      nextCampusId += 1n;
      await sendTx(
        `createCampus(${campusSeed.name})`,
        campusFacet.createCampus(campusId, universityId, campusSeed.name, campusSeed.metadataURI),
      );
      campusIndex.set(`${universityId}:${campusSeed.name}`, campusId);
      await sleep(2500);
    } else {
      console.log(`createCampus(${campusSeed.name}): skipped, existing id ${campusId}`);
    }

    for (const programName of campusSeed.programs) {
      const key = `${campusId}:${programName}`;
      if (programIndex.has(key)) {
        continue;
      }

      const programId = nextProgramId;
      nextProgramId += 1n;

      let created = false;
      let attempt = 0;
      while (!created && attempt < 3) {
        attempt += 1;
        try {
          await sendTx(
            `createProgram(${programName}) attempt ${attempt}`,
            programFacet.createProgram(
              programId,
              campusId,
              programName,
              `univalle://program/${campusSeed.code.toLowerCase()}/${slugify(programName)}`,
              ethers.ZeroAddress,
            ),
          );
          created = true;
        } catch (error) {
          if (attempt >= 3) {
            throw error;
          }
          console.log(`createProgram(${programName}) retry: ${error.shortMessage ?? error.message}`);
          await sleep(2500);
        }
      }

      programIndex.set(key, programId);
    }
  }

  console.log("Universidad del Valle seed completed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
