import { promises as fs } from "fs";
import path from "path";

import directorySeed from "@/app/data/university-directory.json";
import type {
  AppDatabase,
  AppUser,
  FeatureAccess,
  ProfileRecord,
  StudentDirectoryRecord,
  TicketTurn,
  TicketTurnSnapshot,
  UniversityDirectory,
  UserNotification,
  UserNotificationType,
  UserSnapshot
} from "@/app/lib/types";

const DB_PATH = path.join(process.cwd(), "app", "data", "app-db.json");
const UNIVALLE_EMAIL_DOMAIN = "@correounivalle.edu.co";
const UNIVALLE_UNIVERSITY_ID = 1000;
const UNIVALLE_DEFAULT_CAMPUS_ID = 1001;
const LUNCH_TURN_QR_ID = "lazos-lunch-turns-v1";
const MONTHLY_TURN_REACTIVATION_LIMIT = 10;
const MONTHLY_SPECIAL_TURN_LIMIT = 5;
const TURN_DURATION_MINUTES = 30;
const SPECIAL_TURN_DURATION_MINUTES = 90;
const LUNCH_OPERATION_START_HOUR = 12;
const PEOPLE_SERVED_PER_MINUTE = 3;

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
      body: "Depositaste 4 unidades y recibiste 1.00 $NUDOS.",
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
  avatarUrl: "",
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
    users: users.map(({ balances, ...user }) => user),
    ticketTurns: parsed.ticketTurns ?? []
  } as AppDatabase;

  if (didMigrate) {
    await writeDb(normalizedDb);
  }

  return normalizedDb;
}

export async function writeDb(db: AppDatabase) {
  await fs.writeFile(DB_PATH, JSON.stringify({ ...db, ticketTurns: db.ticketTurns ?? [] }, null, 2), "utf8");
}

export function getUniversityDirectory() {
  return directorySeed as UniversityDirectory;
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function hasUnivalleEmailDomain(email: string) {
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
    tickets: user.universityValidated || profileComplete || hasUnivalleEmailDomain(user.email),
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

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function isLiveTurn(turn: TicketTurn, now = new Date()) {
  return (turn.status === "active" || turn.status === "reserved") && new Date(turn.expiresAt) > now;
}

function sameMonth(value: string, now = new Date()) {
  const date = new Date(value);
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

function turnPrefixFromIndex(index: number) {
  let value = index;
  let prefix = "";

  do {
    prefix = String.fromCharCode(65 + (value % 26)) + prefix;
    value = Math.floor(value / 26) - 1;
  } while (value >= 0);

  return prefix;
}

function nextTurnNumber(turns: TicketTurn[], now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const countToday = turns.filter(turn => turn.createdAt.slice(0, 10) === today).length;
  const prefix = turnPrefixFromIndex(Math.floor(countToday / 100));
  return `${prefix}-${String(countToday % 100).padStart(2, "0")}`;
}

function getLunchStart(now = new Date()) {
  const start = new Date(now);
  start.setHours(LUNCH_OPERATION_START_HOUR, 0, 0, 0);
  return start;
}

function formatEstimatedTime(minutes: number, now = new Date()) {
  const estimated = addMinutes(getLunchStart(now), minutes);
  return estimated.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function getMonthlyReactivationCount(userId: string, turns: TicketTurn[], now = new Date()) {
  return turns
    .filter(turn => turn.userId === userId)
    .flatMap(turn => turn.reactivationEvents ?? [])
    .filter(timestamp => sameMonth(timestamp, now)).length;
}

function toTicketTurnSnapshot(turn: TicketTurn, turns: TicketTurn[], now = new Date()): TicketTurnSnapshot {
  const liveTurns = turns
    .filter(item => isLiveTurn(item, now))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const index = liveTurns.findIndex(item => item.id === turn.id);
  const queuePosition = index >= 0 ? index + 1 : 0;
  const estimatedMinutes = queuePosition > 0 ? Math.ceil(Math.max(0, queuePosition - 1) / PEOPLE_SERVED_PER_MINUTE) : 0;
  const monthlyReactivationsUsed = getMonthlyReactivationCount(turn.userId, turns, now);

  return {
    ...turn,
    queuePosition,
    estimatedMinutes,
    estimatedTimeLabel: formatEstimatedTime(estimatedMinutes, now),
    reactivationsAvailable: Math.max(0, MONTHLY_TURN_REACTIVATION_LIMIT - monthlyReactivationsUsed),
    monthlyReactivationsUsed,
    monthlyReactivationsLimit: MONTHLY_TURN_REACTIVATION_LIMIT,
    monthlyReservationsUsed: turns.filter(
      item => item.userId === turn.userId && item.type === "special" && sameMonth(item.createdAt, now)
    ).length,
    monthlyReservationsLimit: MONTHLY_SPECIAL_TURN_LIMIT
  };
}

export async function getTicketTurnState(userId: string) {
  const db = await readDb();
  const now = new Date();
  let didUpdate = false;

  for (const turn of db.ticketTurns ?? []) {
    if ((turn.status === "active" || turn.status === "reserved") && new Date(turn.expiresAt) <= now) {
      turn.status = "expired";
      turn.updatedAt = now.toISOString();
      didUpdate = true;
    }
  }

  if (didUpdate) {
    await writeDb(db);
  }

  const activeTurn = (db.ticketTurns ?? [])
    .filter(turn => turn.userId === userId && isLiveTurn(turn, now))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return activeTurn ? toTicketTurnSnapshot(activeTurn, db.ticketTurns ?? [], now) : null;
}

export async function requestTicketTurn(userId: string, type: TicketTurn["type"], qrCodeId: string) {
  const db = await readDb();
  const user = db.users.find(item => item.id === userId);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (qrCodeId !== LUNCH_TURN_QR_ID) {
    throw new Error("INVALID_TURN_QR");
  }

  if (!computeAccess(user).tickets) {
    throw new Error("TICKETS_LOCKED");
  }

  const now = new Date();
  const existingTurn = (db.ticketTurns ?? []).find(turn => turn.userId === userId && isLiveTurn(turn, now));
  if (existingTurn) {
    return toTicketTurnSnapshot(existingTurn, db.ticketTurns ?? [], now);
  }

  if (type === "special") {
    const reservationsUsed = (db.ticketTurns ?? []).filter(
      turn => turn.userId === userId && turn.type === "special" && sameMonth(turn.createdAt, now)
    ).length;
    if (reservationsUsed >= MONTHLY_SPECIAL_TURN_LIMIT) {
      throw new Error("SPECIAL_TURN_LIMIT_REACHED");
    }
  }

  const createdAt = now.toISOString();
  const expiresAt = addMinutes(
    now,
    type === "special" ? SPECIAL_TURN_DURATION_MINUTES : TURN_DURATION_MINUTES
  ).toISOString();
  const turn: TicketTurn = {
    id: `trn_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    number: nextTurnNumber(db.ticketTurns ?? [], now),
    status: type === "special" ? "reserved" : "active",
    type,
    qrCodeId,
    createdAt,
    updatedAt: createdAt,
    expiresAt,
    reactivationsUsed: 0,
    reactivationEvents: []
  };

  db.ticketTurns = [...(db.ticketTurns ?? []), turn];
  user.updatedAt = createdAt;
  user.notifications.unshift(createNotification({
    type: "tickets",
    title: type === "special" ? "Reserva de almuerzo creada" : "Turno asignado",
    body:
      type === "special"
        ? `Tu reserva especial quedo asignada con el turno ${turn.number}.`
        : `Tu turno ${turn.number} quedo activo para la fila de almuerzo.`,
    href: "/tickets"
  }));

  await writeDb(db);
  return toTicketTurnSnapshot(turn, db.ticketTurns, now);
}

export async function reactivateTicketTurn(userId: string) {
  const db = await readDb();
  const now = new Date();
  const turn = (db.ticketTurns ?? [])
    .filter(item => item.userId === userId && item.status !== "completed" && item.status !== "cancelled")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (!turn) {
    throw new Error("TURN_NOT_FOUND");
  }

  const monthlyReactivationsUsed = getMonthlyReactivationCount(userId, db.ticketTurns ?? [], now);
  if (monthlyReactivationsUsed >= MONTHLY_TURN_REACTIVATION_LIMIT) {
    throw new Error("TURN_REACTIVATION_LIMIT_REACHED");
  }

  turn.status = turn.type === "special" ? "reserved" : "active";
  turn.reactivationsUsed += 1;
  turn.reactivationEvents = [...(turn.reactivationEvents ?? []), now.toISOString()];
  turn.updatedAt = now.toISOString();
  turn.expiresAt = addMinutes(now, 10).toISOString();
  await writeDb(db);
  return toTicketTurnSnapshot(turn, db.ticketTurns ?? [], now);
}
