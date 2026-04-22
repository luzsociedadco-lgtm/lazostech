import { promises as fs } from "fs";
import path from "path";

import directorySeed from "@/app/data/university-directory.json";
import type {
  AppDatabase,
  AppUser,
  FeatureAccess,
  ProfileRecord,
  StudentDirectoryRecord,
  UniversityDirectory,
  UserSnapshot
} from "@/app/lib/types";

const DB_PATH = path.join(process.cwd(), "app", "data", "app-db.json");

const EMPTY_PROFILE: ProfileRecord = {
  firstName: "",
  lastName: "",
  phone: "",
  nationalId: "",
  studentCode: "",
  universityId: 0,
  campusId: 1,
  programId: 0,
  studentType: "",
  benefitLabel: ""
};

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
}

export async function readDb() {
  await ensureDb();
  const raw = await fs.readFile(DB_PATH, "utf8");
  return JSON.parse(raw) as AppDatabase;
}

export async function writeDb(db: AppDatabase) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function getUniversityDirectory() {
  return directorySeed as UniversityDirectory;
}

export function buildEmptyProfile(email: string): ProfileRecord {
  return {
    ...EMPTY_PROFILE,
    firstName: email.split("@")[0] || ""
  };
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function findDirectoryMatch(params: {
  email?: string;
  studentCode?: string;
  nationalId?: string;
}) {
  const directory = getUniversityDirectory();
  return (
    directory.students.find(student => {
      const byEmail =
        params.email && normalizeText(student.email) === normalizeText(params.email);
      const byStudentCode =
        params.studentCode && student.studentCode === params.studentCode.trim();
      const byNationalId =
        params.nationalId && student.nationalId === params.nationalId.trim();

      return Boolean(byEmail || byStudentCode || byNationalId);
    }) ?? null
  );
}

function mergeDirectoryProfile(existing: ProfileRecord, record: StudentDirectoryRecord): ProfileRecord {
  return {
    ...existing,
    firstName: record.firstName,
    lastName: record.lastName,
    phone: record.phone,
    nationalId: record.nationalId,
    studentCode: record.studentCode,
    universityId: record.universityId,
    campusId: record.campusId,
    programId: record.programId,
    studentType: record.studentType,
    benefitLabel: record.benefitLabel
  };
}

export function isProfileComplete(profile: ProfileRecord) {
  return Boolean(
    profile.firstName.trim() &&
      profile.lastName.trim() &&
      profile.phone.trim() &&
      profile.nationalId.trim()
  );
}

function buildSyncState(user: Pick<AppUser, "profile" | "linkedWallet" | "universityValidated" | "syncState">) {
  return {
    directoryMatched: user.universityValidated,
    profileComplete: isProfileComplete(user.profile),
    walletLinked: Boolean(user.linkedWallet?.address),
    onchainProfileRegistered: user.syncState.onchainProfileRegistered,
    onchainAffiliationSynced: user.syncState.onchainAffiliationSynced
  };
}

export function computeAccess(user: AppUser): FeatureAccess {
  const profileComplete = isProfileComplete(user.profile);
  const walletLinked = Boolean(user.linkedWallet?.address);

  return {
    perfil: true,
    tickets: user.universityValidated || profileComplete,
    reciclaje: walletLinked,
    marketplace: walletLinked,
    dao: walletLinked
  };
}

export function toUserSnapshot(user: AppUser): UserSnapshot {
  const syncState = buildSyncState(user);

  return {
    id: user.id,
    email: user.email,
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    profile: user.profile,
    linkedWallet: user.linkedWallet,
    universityValidated: user.universityValidated,
    syncState,
    balances: user.balances,
    access: computeAccess(user),
    completion: {
      profileComplete: syncState.profileComplete,
      walletLinked: syncState.walletLinked
    }
  };
}

export async function getUserByEmail(email: string) {
  const db = await readDb();
  return db.users.find(user => normalizeText(user.email) === normalizeText(email)) ?? null;
}

export async function getUserById(id: string) {
  const db = await readDb();
  return db.users.find(user => user.id === id) ?? null;
}

export async function createUser(input: Pick<AppUser, "email" | "passwordHash" | "authProvider">) {
  const db = await readDb();
  const now = new Date().toISOString();

  const existing = db.users.find(user => normalizeText(user.email) === normalizeText(input.email));
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const directoryMatch = findDirectoryMatch({ email: input.email });

  const user: AppUser = {
    id: `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: input.email.trim(),
    passwordHash: input.passwordHash,
    authProvider: input.authProvider,
    createdAt: now,
    updatedAt: now,
    profile: directoryMatch
      ? mergeDirectoryProfile(buildEmptyProfile(input.email), directoryMatch)
      : buildEmptyProfile(input.email),
    linkedWallet: null,
    universityValidated: Boolean(directoryMatch),
    syncState: {
      directoryMatched: Boolean(directoryMatch),
      profileComplete: Boolean(directoryMatch),
      walletLinked: false,
      onchainProfileRegistered: false,
      onchainAffiliationSynced: false
    },
    balances: {
      internal: {
        nudos: 0,
        tickets: 0,
        source: "diamond_internal"
      },
      wallet: {
        erc20Nudos: null,
        source: "erc20_wallet"
      }
    }
  };

  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<ProfileRecord>
) {
  const db = await readDb();
  const user = db.users.find(item => item.id === userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  user.profile = {
    ...user.profile,
    ...updates
  };

  const directoryMatch = findDirectoryMatch({
    email: user.email,
    studentCode: user.profile.studentCode,
    nationalId: user.profile.nationalId
  });

  if (directoryMatch) {
    user.profile = mergeDirectoryProfile(user.profile, directoryMatch);
    user.universityValidated = true;
  } else {
    if (user.profile.universityId === 0) {
      user.profile.campusId = 1;
      user.profile.programId = 0;
    }
    user.universityValidated = false;
  }

  user.syncState.directoryMatched = user.universityValidated;
  user.syncState.profileComplete = isProfileComplete(user.profile);
  if (!user.syncState.directoryMatched) {
    user.syncState.onchainAffiliationSynced = false;
  }

  user.updatedAt = new Date().toISOString();
  await writeDb(db);
  return user;
}

export async function linkUserWallet(userId: string, address: string) {
  const db = await readDb();
  const normalizedAddress = address.trim().toLowerCase();

  const duplicateOwner = db.users.find(
    user => user.linkedWallet?.address.toLowerCase() === normalizedAddress && user.id !== userId
  );
  if (duplicateOwner) {
    throw new Error("WALLET_ALREADY_LINKED");
  }

  const user = db.users.find(item => item.id === userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  user.linkedWallet = {
    address,
    linkedAt: new Date().toISOString()
  };
  user.syncState.walletLinked = true;
  user.updatedAt = new Date().toISOString();

  await writeDb(db);
  return user;
}

export async function unlinkUserWallet(userId: string) {
  const db = await readDb();
  const user = db.users.find(item => item.id === userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  user.linkedWallet = null;
  user.syncState.walletLinked = false;
  user.syncState.onchainProfileRegistered = false;
  user.syncState.onchainAffiliationSynced = false;
  user.updatedAt = new Date().toISOString();
  await writeDb(db);
  return user;
}
