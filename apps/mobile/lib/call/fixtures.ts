import type { NativeCallPresentationState } from "./presentation";

export interface CallFixture {
  id: string;
  label: string;
  state: NativeCallPresentationState;
}

const base = {
  avatarUri: null,
  muted: false,
  speaker: false,
} as const;

export const CALL_FIXTURES: CallFixture[] = [
  {
    id: "dialing",
    label: "Appel en cours",
    state: {
      ...base,
      status: "DIALING",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      callType: "APP_TO_PSTN",
    },
  },
  {
    id: "ringing",
    label: "Sonnerie",
    state: {
      ...base,
      status: "RINGING",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      callType: "APP_TO_APP",
    },
  },
  {
    id: "connecting",
    label: "Connexion",
    state: {
      ...base,
      status: "CONNECTING",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      callType: "APP_TO_APP",
    },
  },
  {
    id: "active",
    label: "En cours",
    state: {
      ...base,
      status: "ACTIVE",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      startedAt: Date.now() - 137_000,
      callType: "APP_TO_APP",
    },
  },
  {
    id: "unknown",
    label: "Numéro inconnu",
    state: {
      ...base,
      status: "ACTIVE",
      displayName: "",
      displayNumber: "+237 6 55 44 33 22",
      startedAt: Date.now() - 45_000,
      callType: "APP_TO_PSTN",
    },
  },
  {
    id: "failed",
    label: "Échec",
    state: {
      ...base,
      status: "FAILED",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      failureReason: "Le contact est injoignable pour le moment.",
    },
  },
  {
    id: "ended",
    label: "Terminé",
    state: {
      ...base,
      status: "ENDED",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
    },
  },
];

export const DEFAULT_FIXTURE_ID = "active";

export function fixtureById(id: string): CallFixture {
  return CALL_FIXTURES.find((fixture) => fixture.id === id) ?? CALL_FIXTURES[3];
}

const incomingBase = {
  avatarUri: null,
  muted: false,
  speaker: false,
  direction: "incoming",
} as const;

export const INCOMING_CALL_FIXTURES: CallFixture[] = [
  {
    id: "incoming-known",
    label: "Contact connu",
    state: {
      ...incomingBase,
      status: "INCOMING",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      callType: "APP_TO_APP",
    },
  },
  {
    id: "incoming-unknown",
    label: "Numéro inconnu",
    state: {
      ...incomingBase,
      status: "INCOMING",
      displayName: "",
      displayNumber: "+237 6 55 44 33 22",
      callType: "PSTN_TO_APP",
    },
  },
  {
    id: "incoming-app-to-app",
    label: "Buster Call",
    state: {
      ...incomingBase,
      status: "INCOMING",
      displayName: "Karim Diallo",
      displayNumber: "+237 6 90 11 22 33",
      callType: "APP_TO_APP",
    },
  },
  {
    id: "incoming-pstn",
    label: "Appel téléphonique",
    state: {
      ...incomingBase,
      status: "INCOMING",
      displayName: "Support Buster",
      displayNumber: "+33 1 84 80 00 00",
      callType: "PSTN_TO_APP",
    },
  },
  {
    id: "incoming-accepting",
    label: "Connexion",
    state: {
      ...incomingBase,
      status: "ACCEPTING",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      callType: "APP_TO_APP",
    },
  },
  {
    id: "incoming-declining",
    label: "Refus",
    state: {
      ...incomingBase,
      status: "DECLINING",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      callType: "APP_TO_APP",
    },
  },
  {
    id: "incoming-missed",
    label: "Manqué",
    state: {
      ...incomingBase,
      status: "MISSED",
      displayName: "Marie Dupont",
      displayNumber: "+33 6 12 34 56 78",
      callType: "APP_TO_APP",
    },
  },
  {
    id: "incoming-failed",
    label: "Échec",
    state: {
      ...incomingBase,
      status: "FAILED",
      displayName: "",
      displayNumber: "+237 6 55 44 33 22",
      callType: "PSTN_TO_APP",
      failureReason: "Impossible de traiter cet appel.",
    },
  },
  {
    id: "incoming-long-name",
    label: "Nom long",
    state: {
      ...incomingBase,
      status: "INCOMING",
      displayName: "Alexandrine de la Rochefoucauld-Montmirail",
      displayNumber: "+33 6 98 76 54 32",
      callType: "APP_TO_APP",
    },
  },
];

export const DEFAULT_INCOMING_FIXTURE_ID = "incoming-known";

export function incomingFixtureById(id: string): CallFixture {
  return INCOMING_CALL_FIXTURES.find((fixture) => fixture.id === id) ?? INCOMING_CALL_FIXTURES[0];
}
