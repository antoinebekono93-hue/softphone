import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, radii, shadows, spacing } from "@/constants/theme";

export function NativeCallActions({
  onAddContact,
  onCall,
  onVideo,
  callDisabled,
  callBusy,
}: {
  onAddContact?: () => void;
  onCall: () => void;
  onVideo?: () => void;
  callDisabled?: boolean;
  callBusy?: boolean;
}) {
  const callInactive = callDisabled || callBusy;

  return (
    <View style={styles.row}>
      <SecondaryButton icon="person-add-outline" label="Ajouter un contact" onPress={onAddContact} />

      <Pressable
        onPress={onCall}
        disabled={callInactive}
        accessibilityRole="button"
        accessibilityLabel="Appeler"
        accessibilityState={{ disabled: Boolean(callInactive), busy: Boolean(callBusy) }}
        style={({ pressed }) => [
          styles.call,
          callInactive && styles.callInactive,
          pressed && !callInactive && styles.pressed,
        ]}
      >
        <Ionicons name="call" size={36} color={colors.textOnAccent} />
      </Pressable>

      <SecondaryButton icon="videocam-outline" label="Appel vidéo" onPress={onVideo} />
    </View>
  );
}

function SecondaryButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.secondary,
        !onPress && styles.secondaryDisabled,
        pressed && onPress && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={24} color={colors.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 46,
    paddingTop: spacing[2],
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[2],
  },
  call: {
    width: layout.primaryButton,
    height: layout.primaryButton,
    borderRadius: radii.full,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.float,
  },
  callInactive: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  secondary: {
    width: layout.secondaryButton,
    height: layout.secondaryButton,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceCool,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  secondaryDisabled: {
    opacity: 0.5,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
