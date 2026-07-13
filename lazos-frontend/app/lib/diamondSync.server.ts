import "server-only";

import { promises as fs } from "fs";
import path from "path";

import { Contract, JsonRpcProvider, Wallet } from "ethers";

import { NUDOS_DIAMOND_ADDRESS, profileFacetAbi, programFacetAbi } from "@/app/lib/diamondContracts";
import type { AppUser } from "@/app/lib/types";

const GENERIC_UNIVERSITY_ID = 0;
const GENERIC_CAMPUS_ID = 1;
const UNIVALLE_UNIVERSITY_ID = 1000;
const SAN_FERNANDO_CAMPUS_ID = 1001;
const MELENDEZ_CAMPUS_ID = 1002;

type EnvShape = {
  RPC_URL: string;
  PRIVATE_KEY: string;
  DIAMOND: string;
};

type AffiliationTarget = {
  universityId: number;
  campusId: number;
  programId: number;
  isGeneric: boolean;
};

type OnchainSyncResult = {
  onchainProfileRegistered: boolean;
  onchainAffiliationSynced: boolean;
  usedGenericAffiliation: boolean;
  affiliation: {
    universityId: number;
    campusId: number;
    programId: number;
  };
  message: string;
};

function parseEnv(raw: string) {
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#"))
      .map(line => line.replace(/^export\s+/, ""))
      .map(line => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^"(.*)"$/, "$1");
        return [key, value];
      })
  ) as Partial<EnvShape>;
}

async function loadRootEnv() {
  if (process.env.RPC_URL && process.env.PRIVATE_KEY) {
    return {
      RPC_URL: process.env.RPC_URL,
      PRIVATE_KEY: process.env.PRIVATE_KEY,
      DIAMOND: process.env.DIAMOND || NUDOS_DIAMOND_ADDRESS
    } satisfies EnvShape;
  }

  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    path.join(process.cwd(), "..", "..", ".env")
  ];

  for (const candidate of candidates) {
    try {
      const raw = await fs.readFile(candidate, "utf8");
      const parsed = parseEnv(raw);
      if (parsed.RPC_URL && parsed.PRIVATE_KEY) {
        return parsed as EnvShape;
      }
    } catch {
      continue;
    }
  }

  throw new Error("DIAMOND_SYNC_ENV_MISSING");
}

function normalizeAffiliation(user: AppUser): AffiliationTarget {
  if (user.profile.universityId === UNIVALLE_UNIVERSITY_ID) {
    return {
      universityId: UNIVALLE_UNIVERSITY_ID,
      campusId:
        user.profile.campusId === MELENDEZ_CAMPUS_ID ? MELENDEZ_CAMPUS_ID : SAN_FERNANDO_CAMPUS_ID,
      programId: user.profile.programId > 0 ? user.profile.programId : 0,
      isGeneric: false
    };
  }

  return {
    universityId: GENERIC_UNIVERSITY_ID,
    campusId: GENERIC_CAMPUS_ID,
    programId: 0,
    isGeneric: true
  };
}

function isProfileMissingError(error: unknown) {
  return error instanceof Error && /Profile not found/i.test(error.message);
}

function sameAffiliation(
  current: { universityId: number; campusId: number; programId: number },
  target: AffiliationTarget
) {
  return (
    current.universityId === target.universityId &&
    current.campusId === target.campusId &&
    current.programId === target.programId
  );
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureProfileExists(profileRead: Contract, walletAddress: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await profileRead.getProfile(walletAddress);
      return true;
    } catch (error) {
      if (!isProfileMissingError(error)) {
        throw error;
      }

      if (attempt < 2) {
        await sleep(1500);
      }
    }
  }

  return false;
}

export async function syncWalletToDiamond(user: AppUser): Promise<OnchainSyncResult> {
  if (!user.linkedWallet?.address) {
    throw new Error("WALLET_NOT_LINKED");
  }

  const env = await loadRootEnv();
  const provider = new JsonRpcProvider(env.RPC_URL);
  const operator = new Wallet(env.PRIVATE_KEY, provider);
  const diamondAddress = (env.DIAMOND || NUDOS_DIAMOND_ADDRESS) as `0x${string}`;

  const profileRead = new Contract(diamondAddress, profileFacetAbi, provider);
  const programRead = new Contract(diamondAddress, programFacetAbi, provider);
  const programWrite = new Contract(diamondAddress, programFacetAbi, operator);

  const profileExists = await ensureProfileExists(profileRead, user.linkedWallet.address);
  if (!profileExists) {
    return {
      onchainProfileRegistered: false,
      onchainAffiliationSynced: false,
      usedGenericAffiliation: false,
      affiliation: {
        universityId: 0,
        campusId: 0,
        programId: 0
      },
      message: "La wallet ya quedo enlazada localmente, pero aun falta registrar el perfil en Diamond."
    };
  }

  const target = normalizeAffiliation(user);
  const currentAffiliationRaw = await programRead.getProfileAffiliation(user.linkedWallet.address);
  const currentAffiliation = {
    universityId: Number(currentAffiliationRaw[0]),
    campusId: Number(currentAffiliationRaw[1]),
    programId: Number(currentAffiliationRaw[2])
  };

  if (!sameAffiliation(currentAffiliation, target)) {
    const tx = await programWrite.assignProfileAffiliation(
      user.linkedWallet.address,
      BigInt(target.universityId),
      BigInt(target.campusId),
      BigInt(target.programId)
    );
    await tx.wait();
  }

  const finalAffiliationRaw = await programRead.getProfileAffiliation(user.linkedWallet.address);
  const finalAffiliation = {
    universityId: Number(finalAffiliationRaw[0]),
    campusId: Number(finalAffiliationRaw[1]),
    programId: Number(finalAffiliationRaw[2])
  };
  const affiliationSynced = sameAffiliation(finalAffiliation, target);

  return {
    onchainProfileRegistered: true,
    onchainAffiliationSynced: affiliationSynced,
    usedGenericAffiliation: target.isGeneric,
    affiliation: finalAffiliation,
    message: affiliationSynced
      ? target.isGeneric
        ? "Wallet enlazada y perfil sincronizado con Diamond en afiliacion generica."
        : "Wallet enlazada y perfil sincronizado con Diamond con afiliacion institucional."
      : "El perfil quedo registrado en Diamond, pero la afiliacion aun no se pudo confirmar."
  };
}
