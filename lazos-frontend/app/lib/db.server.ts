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
  UserNotification,
  UserNotificationType,
  UserSnapshot
} from "@/app/lib/types";

const DB_PATH = path.join(process.cwd(), "app", "data", "app-db.json");
const UNIVALLE_EMAIL_DOMAIN = "@correounivalle.edu.co";
const UNIVALLE_UNIVERSITY_ID = 1000;
const UNIVALLE_DEFAULT_CAMPUS_ID = 1001;

function createNotification(input: {
  type: UserNotificationType;
  title: string;
  body: string;
  href: string | null;
  createdAt?: string;
}) {
  return {
    id: `ntf_${Math.random().toString(36).slice(2, 10)}`,
    type: input.type,
    title: input.title,
    body: input.body,
    createdAt: input.createdAt || new Date().toISOString(),
    isRead: false,
    href: input.href
  } satisfies UserNotification;
}

function buildNotificationSeed() {
  const now = Date.now();

  return [
    createNotification({
      type: "recycling",
      title: "Reciclaje validado",
      body: "Depositaste 4 unidades y recibiste 1.00 NUDOS.",
      href: "/reciclaje",
      createdAt: new Date(now - 1000 * 60 * 8).toISOString()
    }),
    createNotification({
      type: "tickets",
      title: "Tickets emitidos",
      body: "Se acreditaron 3 tickets a tu cuenta.",
      href: "/tickets",
      createdAt: new Date(now - 1000 * 60 * 21).toISOString()
    }),
    createNotification({
      type: "profile",
      title: "Actividad de perfil",
      body: "Tu perfil quedo listo para seguir operando en LazosTech.",
      href: null,
      createdAt: new Date(now - 1000 * 60 * 34).toISOString()
    }),
    createNotification({
      type: "dao",
      title: "Asamblea universitaria abierta",
      body: "Ya puedes entrar a la asamblea activa de tu DAO universitaria.",
      href: "/dao",
      createdAt: new Date(now - 1000 * 60 * 47).toISOString()
    })
  ];
}

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
  const parsed = JSON.parse(raw) as AppDatabase;
  let didMigrate = false;

  const users = parsed.users.map(user => {
    const legacyUser = user as AppUser & {
      balances?: {
        internal?: { tickets?: number };
      };
      tickets?: AppUser["tickets"];
      notifications?: UserNotification[];
    };

    if (legacyUser.tickets && !legacyUser.balances) {
      if (!legacyUser.notifications) {
        didMigrate = true;
        return {
          ...legacyUser,
          notifications: buildNotificationSeed()
        };
      }

      return legacyUser;
    }

    didMigrate = true;

    return {
      ...legacyUser,
      tickets: legacyUser.tickets ?? {
        available: legacyUser.balances?.internal?.tickets ?? 0,
        source: "ticket_system"
      },
      notifications: legacyUser.notifications ?? buildNotificationSeed()
    };
  });

  const normalizedDb = {
    users: users.map(({ balances, ...user }) => user)
  } as AppDatabase;

  if (didMigrate) {
    await writeDb(normalizedDb);
  }

  return normalizedDb;
}

export async function writeDb(db: AppDatabase) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export function getUniversityDirectory() {
  return directorySeed as UniversityDirectory;
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function hasUnivalleEmailDomain(email: string) {
  return normalizeText(email).endsWith(UNIVALLE_EMAIL_DOMAIN);
}

function applyInstitutionalDefaults(profile: ProfileRecord, email: string): ProfileRecord {
  if (!hasUnivalleEmailDomain(email)) {
    return profile;
  }

  return {
    ...profile,
    universityId: profile.universityId || UNIVALLE_UNIVERSITY_ID,
    campusId:
      profile.campusId && profile.campusId !== 1
        ? profile.campusId
        : UNIVALLE_DEFAULT_CAMPUS_ID
  };
}

export function buildEmptyProfile(email: string): ProfileRecord {
  return applyInstitutionalDefaults({
    ...EMPTY_PROFILE,
    firstName: email.split("@")[0] || ""
  }, email);
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
    tickets: user.tickets,
    notifications: [...user.notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
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

export async function createUser(input: Pick<AppUser, "email" | "authProvider"> & {
  id?: string;
  passwordHash?: string;
}) {
  const db = await readDb();
  const now = new Date().toISOString();

  const existing = db.users.find(user => normalizeText(user.email) === normalizeText(input.email));
  if (existing) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const directoryMatch = findDirectoryMatch({ email: input.email });
  const baseProfile = buildEmptyProfile(input.email);
  const initialProfile = directoryMatch
    ? mergeDirectoryProfile(baseProfile, directoryMatch)
    : applyInstitutionalDefaults(baseProfile, input.email);

  const user: AppUser = {
    id: input.id || `usr_${Math.random().toString(36).slice(2, 10)}`,
    email: input.email.trim(),
    passwordHash: input.passwordHash,
    authProvider: input.authProvider,
    createdAt: now,
    updatedAt: now,
    profile: initialProfile,
    linkedWallet: null,
    universityValidated: Boolean(directoryMatch),
    syncState: {
      directoryMatched: Boolean(directoryMatch),
      profileComplete: Boolean(directoryMatch),
      walletLinked: false,
      onchainProfileRegistered: false,
      onchainAffiliationSynced: false
    },
    tickets: {
      available: 0,
      source: "ticket_system"
    },
    notifications: buildNotificationSeed()
  };

  db.users.push(user);
  await writeDb(db);
  return user;
}

export async function getOrCreateUserFromAuth(input: {
  id: string;
  email: string;
  authProvider?: AppUser["authProvider"];
}) {
  const existingById = await getUserById(input.id);
  if (existingById) return existingById;

  const existingByEmail = await getUserByEmail(input.email);
  if (existingByEmail) return existingByEmail;

  return createUser({
    id: input.id,
    email: input.email,
    authProvider: input.authProvider ?? "email"
  });
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
    user.profile = applyInstitutionalDefaults(user.profile, user.email);
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
  user.syncState.onchainProfileRegistered = false;
  user.syncState.onchainAffiliationSynced = false;
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

export async function updateUserWalletSyncState(
  userId: string,
  syncState: Partial<Pick<AppUser["syncState"], "onchainProfileRegistered" | "onchainAffiliationSynced">>
) {
  const db = await readDb();
  const user = db.users.find(item => item.id === userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  user.syncState = {
    ...user.syncState,
    ...syncState
  };
  user.updatedAt = new Date().toISOString();

  await writeDb(db);
  return user;
}

export async function addUserNotification(
  userId: string,
  input: {
    type: UserNotificationType;
    title: string;
    body: string;
    href: string | null;
  }
) {
  const db = await readDb();
  const user = db.users.find(item => item.id === userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  user.notifications.unshift(createNotification(input));
  user.updatedAt = new Date().toISOString();
  await writeDb(db);
  return user;
}

export async function markUserNotificationRead(userId: string, notificationId: string) {
  const db = await readDb();
  const user = db.users.find(item => item.id === userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const notification = user.notifications.find(item => item.id === notificationId);
  if (!notification) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }

  notification.isRead = true;
  user.updatedAt = new Date().toISOString();
  await writeDb(db);
  return notification;
}
