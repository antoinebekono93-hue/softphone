import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BRAND_NAME, BRAND_TAGLINE } from "@buster/shared";
import { colors, layout, radii, shadows, spacing, typography } from "@/constants/theme";

export function NativeDialerHeader({ onProfilePress }: { onProfilePress?: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <LinearGradient
          colors={[colors.brandBlue, colors.brandBlueDeep]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.logo}
        >
          <View style={styles.logoHighlight} />
          <Ionicons name="call" size={23} color={colors.textOnAccent} />
        </LinearGradient>
      </View>

      <View style={styles.brand}>
        <Text style={styles.title} numberOfLines={1}>
          {BRAND_NAME}
        </Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {BRAND_TAGLINE}
        </Text>
      </View>

      <Pressable
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Profil et compte"
        style={({ pressed }) => [styles.profile, pressed && styles.profilePressed]}
      >
        <Ionicons name="person-outline" size={22} color={colors.inkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingTop: spacing[2],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  logoWrap: {
    width: layout.headerLogo,
    height: layout.headerLogo,
    borderRadius: 14,
    ...shadows.headerLogo,
  },
  logo: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  logoHighlight: {
    position: "absolute",
    top: -12,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  brand: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: colors.ink,
    fontSize: typography.headerTitle.fontSize,
    fontWeight: typography.headerTitle.fontWeight,
    letterSpacing: typography.headerTitle.letterSpacing,
    lineHeight: typography.headerTitle.fontSize * 1.15,
  },
  tagline: {
    color: colors.tagline,
    fontSize: typography.headerTagline.fontSize,
    fontWeight: typography.headerTagline.fontWeight,
    letterSpacing: typography.headerTagline.letterSpacing,
    textTransform: "uppercase",
    marginTop: 3,
  },
  profile: {
    width: layout.headerProfile,
    height: layout.headerProfile,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceCool,
    alignItems: "center",
    justifyContent: "center",
  },
  profilePressed: {
    opacity: 0.6,
  },
});
