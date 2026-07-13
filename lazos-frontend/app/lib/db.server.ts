import "server-only";

import type { FeatureAccess, ProfileRecord, UniversityDirectory } from "@/app/lib/types";

const UNIVALLE_EMAIL_DOMAIN = "@correounivalle.edu.co";
const UNIVALLE_UNIVERSITY_ID = 1000;
const UNIVALLE_DEFAULT_CAMPUS_ID = 1001;

const EMPTY_PROFILE: ProfileRecord = {
  firstName: "",
  lastName: "",
  phone: "",
  nationalId: "",
  studentCode: "",
  universityId: 0,
  campusId: 1,
  programId: 0,
  studentType: "Pregrado",
  benefitLabel: "Almuerzo Regular"
};

const UNIVERSITY_CATALOG: UniversityDirectory = {
  universities: [
    {
      id: 0,
      code: "0000",
      name: "Generica",
      campuses: [{ id: 1, code: "0001", name: "GN", programs: [] }]
    },
    {
      id: 1000,
      code: "1000",
      name: "Universidad del Valle",
      campuses: [
        {
          id: 1001,
          code: "1001",
          name: "SF",
          programs: [
            { id: 1001101, code: "1001101", name: "Administracion de Empresas" },
            { id: 1001102, code: "1001102", name: "Administracion Publica" },
            { id: 1001103, code: "1001103", name: "Contaduria Publica" },
            { id: 1001104, code: "1001104", name: "Comercio Exterior" },
            { id: 1001105, code: "1001105", name: "Finanzas y Banca" },
            { id: 1001106, code: "1001106", name: "Administracion Turistica" },
            { id: 1001107, code: "1001107", name: "Gestion del Emprendimiento y la Innovacion" },
            { id: 1001201, code: "1001201", name: "Bacteriologia y Laboratorio Clinico" },
            { id: 1001202, code: "1001202", name: "Enfermeria" },
            { id: 1001203, code: "1001203", name: "Fisioterapia" },
            { id: 1001204, code: "1001204", name: "Fonoaudiologia" },
            { id: 1001205, code: "1001205", name: "Medicina y Cirugia" },
            { id: 1001206, code: "1001206", name: "Odontologia" },
            { id: 1001207, code: "1001207", name: "Terapia Ocupacional" },
            { id: 1001208, code: "1001208", name: "Tecnologia en Atencion Prehospitalaria" }
          ]
        },
        { id: 1002, code: "1002", name: "MLD", programs: [] }
      ]
    }
  ],
  students: []
};

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function hasUnivalleEmailDomain(email: string) {
  return normalizeText(email).endsWith(UNIVALLE_EMAIL_DOMAIN);
}

export function buildEmptyProfile(email: string): ProfileRecord {
  const isInstitutional = hasUnivalleEmailDomain(email);

  return {
    ...EMPTY_PROFILE,
    firstName: email.split("@")[0] || "",
    universityId: isInstitutional ? UNIVALLE_UNIVERSITY_ID : 0,
    campusId: isInstitutional ? UNIVALLE_DEFAULT_CAMPUS_ID : 1
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

export function computeAccess(input: {
  email: string;
  profile: ProfileRecord;
  universityValidated: boolean;
  walletLinked: boolean;
}): FeatureAccess {
  return {
    perfil: true,
    tickets:
      input.universityValidated ||
      isProfileComplete(input.profile) ||
      hasUnivalleEmailDomain(input.email),
    reciclaje: input.walletLinked,
    marketplace: input.walletLinked,
    dao: input.walletLinked
  };
}

export function getUniversityDirectory() {
  return UNIVERSITY_CATALOG;
}
