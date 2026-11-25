import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/constants/theme";

export interface CallControlSpec {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  accessibilityLabel: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
}

export function NativeCallControlButton({
  spec,
  size,
}: {
  spec: CallControlSpec;
  size: number;
}) {
  const { icon, label, accessibilityLabel, selected, disabled, onPress } = spec;
  const inactive = disabled || !onPress;

  const circleStyle = [
    styles.circle,
    { width: size, height: size, borderRadius: size / 2 },
    selected && styles.circleSelected,
    !selected && styles.circleDefault,
    inactive && styles.circleDisabled,
  ];

  const iconColor = selected ? colors.textOnAccent : colors.textSecondary;
  const labelColor = selected ? colors.accent : colors.textSecondary;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: Boolean(selected), disabled: Boolean(inactive) }}
        style={({ pressed }) => [circleStyle, pressed && !inactive && styles.pressed]}
      >
        <Ionicons name={icon} size={size * 0.4} color={iconColor} />
      </Pressable>
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    minWidth: 72,
    gap: spacing[2],
  },
  circle: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  circleDefault: {
    backgroundColor: colors.surface,
    borderColor: colors.borderHairline,
  },
  circleSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  circleDisabled: {
    opacity: 0.45,
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
