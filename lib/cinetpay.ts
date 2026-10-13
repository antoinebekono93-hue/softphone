import {
  CinetPayClient,
  COUNTRY_CODES,
  CURRENCIES,
  PAYMENT_METHODS_BY_COUNTRY,
  type CountryCode,
  type Currency,
} from "cinetpay-js";

/**
 * Intégration CinetPay (SDK officiel `cinetpay-js`, API v1).
 *
 * CinetPay est désormais le moyen de paiement principal de l'application.
 * Les anciens fournisseurs (Stripe / Flutterwave) ont été mis en commentaire.
 *
 * Configuration par variables d'environnement :
 *   CINETPAY_COUNTRY=CI                       (pays de repli, ISO alpha-2)
 *   CINETPAY_CURRENCY=XOF                     (devise de repli : XOF | XAF | GNF | CDF | USD)
 *   CINETPAY_EUR_RATE=655.957                 (unités de devise par EUR — surcharge optionnelle)
 *   CINETPAY_API_KEY_<CC>=sk_live_...         (credentials par pays)
 *   CINETPAY_API_PASSWORD_<CC>=...
 *
 * Fallback : CINETPAY_API_KEY / CINETPAY_API_PASSWORD appliqués au pays de repli.
 *
 * Détection du pays du client : `resolveClientCountry()` utilise, dans l'ordre,
 * un override explicite (formulaire), les en-têtes géo de l'hébergeur
 * (Cloudflare `cf-ipcountry`, Vercel `x-vercel-ip-country`, …), le fuseau horaire
 * du navigateur, puis l'en-tête `Accept-Language`. Le pays retenu est transmis à
 * `payment.initialize()`, ce qui restreint la passerelle aux opérateurs mobile
 * money de ce pays.
 */

/** Pays CinetPay de repli (déterminé au runtime, pas au build). */
export function getCinetPayCountry(): CountryCode {
  const value = (process.env.CINETPAY_COUNTRY || "CI").toUpperCase();
  return isCountryCode(value) ? value : "CI";
}

/** Vérifie qu'une valeur est un code pays CinetPay supporté. */
export function isCountryCode(value: unknown): value is CountryCode {
  return (
    typeof value === "string" &&
    (COUNTRY_CODES as readonly string[]).includes(value.toUpperCase())
  );
}

/** Devise de charge de repli (le wallet reste, lui, dans sa devise d'affichage). */
export function getCinetPayCurrency(): Currency {
  const value = (process.env.CINETPAY_CURRENCY || CURRENCIES.XOF).toUpperCase();
  return (Object.values(CURRENCIES) as string[]).includes(value)
    ? (value as Currency)
    : CURRENCIES.XOF;
}

/** Devise CinetPay associée à chaque pays (les 5 devises supportées). */
const CURRENCY_BY_COUNTRY: Record<CountryCode, Currency> = {
  CI: CURRENCIES.XOF,
  BF: CURRENCIES.XOF,
  ML: CURRENCIES.XOF,
  SN: CURRENCIES.XOF,
  TG: CURRENCIES.XOF,
  BJ: CURRENCIES.XOF,
  NE: CURRENCIES.XOF,
  CM: CURRENCIES.XAF,
  GN: CURRENCIES.GNF,
  CD: CURRENCIES.CDF,
};

/** Devise à utiliser pour un pays donné (repli sur la devise configurée). */
export function getCinetPayCurrencyForCountry(country: CountryCode): Currency {
  return CURRENCY_BY_COUNTRY[country] ?? getCinetPayCurrency();
}

/** Opérateurs mobile money disponibles pour un pays (ex: ['OM_CI', 'WAVE_CI']). */
export function getCinetPayOperators(country: CountryCode): readonly string[] {
  return PAYMENT_METHODS_BY_COUNTRY[country] ?? [];
}

const DEFAULT_RATES_PER_EUR: Record<string, number> = {
  XOF: 655.957,
  XAF: 655.957,
  GNF: 9500,
  CDF: 2800,
  USD: 0.92,
};

/** Nombre d'unités de la devise de charge pour 1 EUR. */
export function getEurRate(currency: Currency = getCinetPayCurrency()): number {
  const configured = Number(process.env.CINETPAY_EUR_RATE);
  if (Number.isFinite(configured) && configured > 0) return configured;
  return DEFAULT_RATES_PER_EUR[currency] ?? 655.957;
}

/**
 * Convertit un montant en EUR (devise du wallet affichée) vers le montant
 * entier attendu par l'API CinetPay (min 100 dans la devise de charge).
 */
export function toChargeAmount(
  amountEur: number,
  currency: Currency = getCinetPayCurrency(),
): number {
  const converted = Math.round(amountEur * getEurRate(currency));
  return Math.max(100, converted);
}

/** Fuseau horaire (IANA) → pays CinetPay. Signal fiable pour l'Afrique de l'Ouest/Centre. */
const COUNTRY_BY_TIMEZONE: Record<string, CountryCode> = {
  "Africa/Abidjan": "CI",
  "Africa/Dakar": "SN",
  "Africa/Lome": "TG",
  "Africa/Porto-Novo": "BJ",
  "Africa/Bamako": "ML",
  "Africa/Ouagadougou": "BF",
  "Africa/Niamey": "NE",
  "Africa/Douala": "CM",
  "Africa/Conakry": "GN",
  "Africa/Kinshasa": "CD",
  "Africa/Lubumbashi": "CD",
};

/** En-têtes de géolocalisation posés par les hébergeurs (Cloudflare, Vercel, …). */
const GEO_COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-country-code",
  "x-client-geo-country",
  "x-geo-country",
] as const;

/**
 * Détermine le pays du client à présenter à CinetPay.
 *
 * Le pays retourné est toujours un pays CinetPay supporté ET configuré
 * (`configured`), sinon on retombe sur le pays par défaut. Ainsi la passerelle
 * n'affiche que les opérateurs mobile money du pays détecté.
 */
export function resolveClientCountry(options: {
  /** Pays explicitement fourni par le client (ex: sélecteur de formulaire). */
  override?: string | null;
  /** En-têtes de la requête HTTP (géolocalisation IP, Accept-Language). */
  headers?: Headers;
  /** Fuseau horaire IANA du navigateur (ex: "Africa/Abidjan"). */
  timeZone?: string | null;
  /** Pays pour lesquels des credentials CinetPay existent. */
  configured?: readonly string[];
}): CountryCode {
  const configured =
    options.configured && options.configured.length > 0
      ? options.configured
      : (COUNTRY_CODES as readonly string[]);

  const accept = (value: string | null | undefined): CountryCode | null => {
    if (!value) return null;
    const upper = value.trim().toUpperCase();
    if (!isCountryCode(upper) || !configured.includes(upper)) return null;
    return upper;
  };

  // 1. Choix explicite du client (le plus fiable).
  const fromOverride = accept(options.override);
  if (fromOverride) return fromOverride;

  // 2. Géolocalisation IP via les en-têtes de l'hébergeur, puis Accept-Language.
  if (options.headers) {
    for (const header of GEO_COUNTRY_HEADERS) {
      const candidate = accept(options.headers.get(header));
      if (candidate) return candidate;
    }

    const languages = options.headers.get("accept-language");
    if (languages) {
      for (const entry of languages.split(",")) {
        const match = /^[a-zA-Z]{2,3}-([a-zA-Z]{2})/.exec(entry.trim());
        const candidate = accept(match?.[1] ?? null);
        if (candidate) return candidate;
      }
    }
  }

  // 3. Fuseau horaire du navigateur.
  if (options.timeZone) {
    const candidate = accept(COUNTRY_BY_TIMEZONE[options.timeZone]);
    if (candidate) return candidate;
  }

  // 4. Pays par défaut, sinon premier pays configuré.
  const fallback = accept(getCinetPayCountry());
  if (fallback) return fallback;

  const firstConfigured = configured.find(isCountryCode);
  return (firstConfigured as CountryCode) ?? getCinetPayCountry();
}

function collectCredentials(): Record<string, { apiKey: string; apiPassword: string }> {
  const credentials: Record<string, { apiKey: string; apiPassword: string }> = {};

  for (const country of COUNTRY_CODES) {
    const apiKey = process.env[`CINETPAY_API_KEY_${country}`];
    const apiPassword = process.env[`CINETPAY_API_PASSWORD_${country}`];
    if (apiKey && apiPassword) {
      credentials[country] = { apiKey, apiPassword };
    }
  }

  const country = getCinetPayCountry();
  if (
    !credentials[country] &&
    process.env.CINETPAY_API_KEY &&
    process.env.CINETPAY_API_PASSWORD
  ) {
    credentials[country] = {
      apiKey: process.env.CINETPAY_API_KEY,
      apiPassword: process.env.CINETPAY_API_PASSWORD,
    };
  }

  return credentials;
}

let client: CinetPayClient | null = null;

/** Retourne (et met en cache) le client CinetPay configuré. */
export function getCinetPayClient(): CinetPayClient {
  if (!client) {
    const credentials = collectCredentials();
    if (Object.keys(credentials).length === 0) {
      throw new Error(
        "CinetPay n'est pas configuré. Renseignez CINETPAY_API_KEY_<CC> et CINETPAY_API_PASSWORD_<CC>.",
      );
    }
    client = new CinetPayClient({
      credentials,
      forceIPv4: true,
      debug: process.env.NODE_ENV !== "production",
    });
  }
  return client;
}
