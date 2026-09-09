import { Prisma } from '@prisma/client';

export type TelnyxCostInformation = {
  upfront_cost?: unknown;
  monthly_cost?: unknown;
  currency?: unknown;
};

function finiteNonNegative(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * Price charged at acquisition. Telnyx is authoritative: if no price is
 * supplied by the provider, the number cannot be sold by this application.
 */
export function telnyxAcquisitionCost(info: TelnyxCostInformation | null | undefined): number | null {
  if (!info) return null;
  const upfront = finiteNonNegative(info.upfront_cost);
  if (upfront !== null && upfront > 0) return upfront;
  return finiteNonNegative(info.monthly_cost);
}

export function resellerNumberPrice(params: {
  costInformation: TelnyxCostInformation | null | undefined;
  multiplier: Prisma.Decimal | number;
  fixedMarkup: Prisma.Decimal | number;
}): number | null {
  const providerCost = telnyxAcquisitionCost(params.costInformation);
  if (providerCost === null) return null;
  const multiplier = Number(params.multiplier);
  const fixedMarkup = Number(params.fixedMarkup);
  if (!Number.isFinite(multiplier) || multiplier < 0 || !Number.isFinite(fixedMarkup) || fixedMarkup < 0) {
    return null;
  }
  return new Prisma.Decimal(providerCost)
    .mul(multiplier)
    .add(fixedMarkup)
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
    .toNumber();
}
