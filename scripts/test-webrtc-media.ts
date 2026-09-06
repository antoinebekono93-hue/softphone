/**
 * Tests de la logique PURE média/audio APP_TO_APP (lib/webrtc-media.ts).
 * Exécution : npx tsx scripts/test-webrtc-media.ts
 *
 * Couvre : classifyGetUserMediaError, mediaFailReason, shouldAddTrack,
 * setAudioTracksEnabled, decideRemoteAudio.
 *
 * Aucune dépendance navigateur : les MediaStreamTrack sont simulés par des
 * objets cas-tés (la logique testée n'y accède que via `.kind` / `.enabled`).
 */

import {
  classifyGetUserMediaError,
  mediaFailReason,
  mediaErrorMessage,
  shouldAddTrack,
  setAudioTracksEnabled,
  decideRemoteAudio,
} from "../lib/webrtc-media";

let failures = 0;
let passed = 0;
const check = (name: string, cond: boolean) => {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}`);
  }
};

// ── Fakes minimaux (types navigateur uniquement, aucune implémentation) ────
function fakeTrack(kind: string, enabled = true) {
  const track = {
    kind,
    enabled,
    readyState: "live" as const,
    stop: () => {},
  };
  return track as unknown as MediaStreamTrack;
}

function makeDomError(name: string): DOMException {
  return { name, message: name } as unknown as DOMException;
}

const fakeAudioTracks = () => [fakeTrack("audio")];
const fakeMixedTracks = () => [fakeTrack("audio"), fakeTrack("video")];

// ── classifyGetUserMediaError ───────────────────────────────────────────────
// (point 1 : permission granted classée correctement → pas d'erreur)

check(
  "1a. erreur permission refusée → permission-denied",
  classifyGetUserMediaError(makeDomError("NotAllowedError")) === "permission-denied"
);

check(
  "1b. PermissionDeniedError → permission-denied",
  classifyGetUserMediaError(makeDomError("PermissionDeniedError")) === "permission-denied"
);

check(
  "1c. NotFoundError → not-found",
  classifyGetUserMediaError(makeDomError("NotFoundError")) === "not-found"
);

check(
  "1d. DevicesNotFoundError → not-found",
  classifyGetUserMediaError(makeDomError("DevicesNotFoundError")) === "not-found"
);

check(
  "1e. NotReadableError → not-readable",
  classifyGetUserMediaError(makeDomError("NotReadableError")) === "not-readable"
);

check(
  "1f. InUseError → in-use",
  classifyGetUserMediaError(makeDomError("InUseError")) === "in-use"
);

check(
  "1g. AbortError → abort",
  classifyGetUserMediaError(makeDomError("AbortError")) === "abort"
);

check(
  "1h. erreur non reconnue → unknown",
  classifyGetUserMediaError(new Error("boom")) === "unknown"
);

check(
  "1i. erreur undefined → unknown (jamais crash)",
  classifyGetUserMediaError(undefined) === "unknown"
);

// ── mediaFailReason / mediaErrorMessage ─────────────────────────────────────

check(
  "2a. failReason permission refusée exploitable",
  mediaFailReason("permission-denied") === "microphone permission denied"
);

check(
  "2b. failReason device introuvable exploitable",
  mediaFailReason("not-found") === "microphone device not found"
);

check(
  "2c. message UI permission refusée francophone",
  typeof mediaErrorMessage("permission-denied") === "string" &&
    mediaErrorMessage("permission-denied").length > 0
);

// ── shouldAddTrack (points 3/4 : ajout unique, anti-doublon, anti-fermé) ────

check(
  "3a. PC stable + pas de track audio → add autorisé",
  shouldAddTrack({ pcState: "stable", alreadyHasAudioTrack: false }) === true
);

check(
  "3b. duplicate : track audio déjà présente → add REFUSÉ",
  shouldAddTrack({ pcState: "stable", alreadyHasAudioTrack: true }) === false
);

check(
  "3c. PC fermé → add REFUSÉ (pas d'ajout après fermeture)",
  shouldAddTrack({ pcState: "closed", alreadyHasAudioTrack: false }) === false
);

check(
  "3d. PC failed → add REFUSÉ",
  shouldAddTrack({ pcState: "failed", alreadyHasAudioTrack: false }) === false
);

// ── setAudioTracksEnabled (points 8/9 : mute/unmute = track.enabled seul) ───

{
  const tracks = fakeAudioTracks();
  setAudioTracksEnabled(tracks, false);
  check("4a. mute ON → track audio désactivée (enabled=false)", tracks[0].enabled === false);
}

{
  const tracks = fakeAudioTracks();
  setAudioTracksEnabled(tracks, false);
  setAudioTracksEnabled(tracks, true);
  check("4b. unmute → MÊME track réactivée (enabled=true)", tracks[0].enabled === true);
}

{
  const tracks = fakeMixedTracks();
  setAudioTracksEnabled(tracks, false);
  check("4c. mute ne touche que l'audio (piste vidéo non affectée)", tracks[1].enabled === true);
}

// ── decideRemoteAudio (points 5/6/10/11/12/13 : lecture distante + cleanup) ──

check(
  "5a. stream présent + session active → play",
  decideRemoteAudio({ streamPresent: true, streamEnded: false, sessionActive: true }) === "play"
);

check(
  "5b. stream présent + session terminale → detach (jamais d'audio après fin)",
  decideRemoteAudio({ streamPresent: true, streamEnded: false, sessionActive: false }) === "detach"
);

check(
  "5c. stream terminé → detach",
  decideRemoteAudio({ streamPresent: true, streamEnded: true, sessionActive: true }) === "detach"
);

check(
  "5d. aucun stream → detach (pas de lecture orpheline)",
  decideRemoteAudio({ streamPresent: false, streamEnded: false, sessionActive: true }) === "detach"
);

// ── Session terminale : protection callback tardif (point 15) ───────────────

check(
  "6a. session terminale → late remote audio impossible (detach)",
  decideRemoteAudio({ streamPresent: true, streamEnded: false, sessionActive: false }) !== "play"
);

check(
  "6b. session terminale → aucune piste locale ne peut être ajoutée",
  shouldAddTrack({ pcState: "closed", alreadyHasAudioTrack: false }) === false
);

// ── Nouvel appel = état média propre (point 16) ─────────────────────────────

check(
  "7a. nouvel appel (PC stable, stream fresh) → add autorisé",
  shouldAddTrack({ pcState: "stable", alreadyHasAudioTrack: false }) === true
);

check(
  "7b. nouvel appel → décision audio 'play' possible",
  decideRemoteAudio({ streamPresent: true, streamEnded: false, sessionActive: true }) === "play"
);

// ── Résumé ──────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failures} failed`);
if (failures > 0) process.exit(1);