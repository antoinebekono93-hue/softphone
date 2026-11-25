import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/constants/theme";
import { NativeCallAcceptButton } from "./NativeCallAcceptButton";
import { NativeCallRejectButton } from "./NativeCallRejectButton";

export function NativeIncomingCallActions({
  onAccept,
  onDecline,
  size,
  disabled,
}: {
  onAccept: () => void;
  onDecline: () => void;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.action}>
        <NativeCallRejectButton onPress={onDecline} size={size} disabled={disabled} />
        <Text style={styles.rejectLabel}>Refuser</Text>
      </View>
      <View style={styles.action}>
        <NativeCallAcceptButton onPress={onAccept} size={size} disabled={disabled} />
        <Text style={styles.acceptLabel}>Accepter</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    gap: spacing[8],
    paddingHorizontal: spacing[5],
  },
  action: {
    alignItems: "center",
    gap: spacing[3],
    minWidth: 96,
  },
  rejectLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  acceptLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent,
  },
});
