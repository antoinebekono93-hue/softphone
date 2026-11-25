export const colors = {
  bg: "#f4f8fc",
  bgGradientFrom: "#f7fafd",
  bgGradientTo: "#eef3f9",

  surface: "#ffffff",
  surfaceTranslucent: "rgba(255, 255, 255, 0.85)",
  surfaceHover: "#e9e9ee",
  surfaceGlass: "rgba(255, 255, 255, 0.82)",
  surfaceCool: "#eef3f9",
  surfaceCoolPressed: "#e1e8f1",
  divider: "rgba(60, 60, 67, 0.14)",
  placeholder: "#9aa5b4",
  tagline: "#8496ad",

  // Dialer reference palette (navy ink + brand blue, from the Buster Call mock-up).
  ink: "#0e1b30",
  inkSoft: "#54657d",
  brandBlue: "#2f6bf6",
  brandBlueDeep: "#2457d6",
  brandBlueSoft: "#e3edfe",

  keySurface: "rgba(255, 255, 255, 0.9)",
  keySurfacePressed: "#e9e9ee",

  borderHairline: "rgba(60, 60, 67, 0.08)",
  borderKey: "rgba(60, 60, 67, 0.06)",
  borderSubtle: "rgba(60, 60, 67, 0.13)",
  borderStrong: "rgba(60, 60, 67, 0.22)",

  text: "#1c1c1e",
  textSecondary: "#6c6c70",
  textMuted: "#a1a1a6",
  textOnAccent: "#ffffff",

  accent: "#0a97b0",
  accentHover: "#0a87a0",
  accentActive: "#087f94",
  accentSoft: "rgba(10, 151, 176, 0.12)",

  success: "#34c759",
  successGlow: "rgba(52, 199, 89, 0.35)",
  danger: "#ff3b30",
  dangerSoft: "rgba(255, 59, 48, 0.08)",
  warning: "#ff9f0a",
  ai: "#6a5acd",
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 30,
  full: 9999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: "700" as const, letterSpacing: -0.7 },
  title: { fontSize: 17, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  tab: { fontSize: 12, fontWeight: "500" as const },

  headerTitle: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.5 },
  headerTagline: { fontSize: 10.5, fontWeight: "600" as const, letterSpacing: 1.9 },
  brandCaption: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 1.54 },

  keypadDigit: { fontSize: 46, fontWeight: "500" as const },
  keypadLetters: { fontSize: 12.5, fontWeight: "500" as const, letterSpacing: 1.3 },

  numberDisplay: { fontSize: 26, fontWeight: "400" as const, letterSpacing: -0.3 },
  numberPlaceholder: { fontSize: 17, fontWeight: "400" as const },

  segment: { fontSize: 14, fontWeight: "500" as const },
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  float: {
    shadowColor: colors.success,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  headerLogo: {
    shadowColor: colors.brandBlue,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  field: {
    shadowColor: "#274060",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  key: {
    shadowColor: "#274060",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  tabbar: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -1 },
    elevation: 12,
  },
} as const;

export const layout = {
  statusBarHeight: 44,

  headerLogo: 44,
  headerProfile: 46,
  numberFieldHeight: 56,

  keypadMaxWidth: 348,
  keypadPadding: 20,

  primaryButton: 78,
  secondaryButton: 50,
  iconButton: 44,
  touchTarget: 44,

  tabIconWidth: 52,
  tabIconHeight: 32,
  homeIndicatorWidth: 134,
  homeIndicatorHeight: 5,

  avatarLarge: 112,
  avatarCompact: 88,
  callControl: 68,
  hangupButton: 76,
  inCallKey: 58,
  incomingAction: 76,
} as const;

export const theme = { colors, spacing, radii, typography, shadows, layout } as const;

export type Theme = typeof theme;
