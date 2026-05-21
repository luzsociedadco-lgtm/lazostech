export type AccessModule = "perfil" | "tickets" | "reciclaje" | "marketplace" | "dao";

export type UniversityProgram = {
  id: number;
  code: string;
  name: string;
};

export type UniversityCampus = {
  id: number;
  code: string;
  name: string;
  programs: UniversityProgram[];
};

export type UniversityRecord = {
  id: number;
  code: string;
  name: string;
  campuses: UniversityCampus[];
};

export type StudentDirectoryRecord = {
  email: string;
  studentCode: string;
  nationalId: string;
  phone: string;
  firstName: string;
  lastName: string;
  universityId: number;
  campusId: number;
  programId: number;
  studentType: string;
  benefitLabel: string;
};

export type ProfileRecord = {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  studentCode: string;
  universityId: number;
  campusId: number;
  programId: number;
  studentType: string;
  benefitLabel: string;
};

export type LinkedWallet = {
  address: string;
  linkedAt: string;
};

export type UserSyncState = {
  directoryMatched: boolean;
  profileComplete: boolean;
  walletLinked: boolean;
  onchainProfileRegistered: boolean;
  onchainAffiliationSynced: boolean;
};

export type UserTicketState = {
  available: number;
  source: "ticket_system";
};

export type UserNotificationType = "recycling" | "tickets" | "profile" | "dao";

export type UserNotification = {
  id: string;
  type: UserNotificationType;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  href: string | null;
};

export type AppUser = {
  id: string;
  email: string;
  passwordHash: string;
  authProvider: "email" | "google";
  createdAt: string;
  updatedAt: string;
  profile: ProfileRecord;
  linkedWallet: LinkedWallet | null;
  universityValidated: boolean;
  syncState: UserSyncState;
  tickets: UserTicketState;
  notifications: UserNotification[];
};

export type AuthSessionPayload = {
  userId: string;
  email: string;
  issuedAt: number;
};

export type FeatureAccess = {
  perfil: boolean;
  tickets: boolean;
  reciclaje: boolean;
  marketplace: boolean;
  dao: boolean;
};

export type UserSnapshot = {
  id: string;
  email: string;
  authProvider: "email" | "google";
  createdAt: string;
  updatedAt: string;
  profile: ProfileRecord;
  linkedWallet: LinkedWallet | null;
  universityValidated: boolean;
  syncState: UserSyncState;
  tickets: UserTicketState;
  notifications: UserNotification[];
  access: FeatureAccess;
  completion: {
    profileComplete: boolean;
    walletLinked: boolean;
  };
};

export type AppDatabase = {
  users: AppUser[];
};

export type UniversityDirectory = {
  universities: UniversityRecord[];
  students: StudentDirectoryRecord[];
};
