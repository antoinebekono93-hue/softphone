import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "@/constants/theme";

export function NativeDismissButton({
  onPress,
  label = "Fermer",
}: {
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: spacing[7],
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  pressed: {
    backgroundColor: colors.surfaceHover,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.accent,
  },
});
