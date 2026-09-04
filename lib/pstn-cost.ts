/**
 * Calculs de coût PSTN — logique PURE (aucune dépendance DB).
 * Séparée de `pstn-billing.ts` pour être testable sans connexion.
 */

const MINUTES_DIVISOR = 60;

/**
 * Calcule la répartition du coût d'un appel PSTN entre minutes incluses et wallet.
 *
 * @param durationSeconds  Durée réelle de l'appel en secondes.
 * @param costPerMinute    Tarif du wallet par minute (SystemSettings).
 * @param includedPerMinute Minutes incluses du plan (0 = aucunes).
 * @param usedThisMonth    Minutes incluses déjà consommées sur la période.
 */
export function computePstnCost(args: {
  durationSeconds: number;
  costPerMinute: number;
  includedPerMinute: number;
  usedThisMonth: number;
}): {
  durationMinutes: number;
  totalCost: number;
  includedMinutesUsed: number;
  walletMinutesUsed: number;
  walletCost: number;
} {
  const { durationSeconds, costPerMinute, includedPerMinute, usedThisMonth } = args;
  const durationMinutes = durationSeconds / MINUTES_DIVISOR;
  const remainingIncluded = Math.max(includedPerMinute - usedThisMonth, 0);

  const includedMinutesUsed = Math.min(remainingIncluded, durationMinutes);
  const walletMinutesUsed = Math.max(durationMinutes - includedMinutesUsed, 0);

  const totalCost = durationMinutes * costPerMinute;
  const walletCost = walletMinutesUsed * costPerMinute;

  return { durationMinutes, totalCost, includedMinutesUsed, walletMinutesUsed, walletCost };
}

/**
 * Réconciliation settlement ↔ réservation (logique PURE, testable sans DB).
 *
 * Au `hangup`, le coût RÉEL déjà imputé au wallet est `actualWalletCost`
 * (l'excédent après minutes incluses). Or `heldAmount` a été pré-déduit du
 * wallet à la réservation (`initiated`). Il faut donc ajuster :
 *
 *   actualWalletCost > heldAmount  → débit SUPPLEMENTAIRE (extraDebit) atomique
 *   actualWalletCost < heldAmount  → remboursement (refund) de la différence
 *   actualWalletCost = heldAmount → aucun ajustement
 *
 * `heldAmount` = argent réellement retenu ; si la réservation n'a rien retenu
 * (minutes incluses), heldAmount = 0 et l'ajustement est simplement le coût réel.
 */
export function computeSettleAdjustment(args: {
  heldAmount: number;
  actualWalletCost: number;
}): {
  extraDebit: number;
  refund: number;
} {
  const { heldAmount, actualWalletCost } = args;
  if (actualWalletCost > heldAmount) {
    return { extraDebit: actualWalletCost - heldAmount, refund: 0 };
  }
  if (actualWalletCost < heldAmount) {
    return { extraDebit: 0, refund: heldAmount - actualWalletCost };
  }
  return { extraDebit: 0, refund: 0 };
}
