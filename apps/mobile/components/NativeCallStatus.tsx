import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/constants/theme";
import {
  callStatusLabel,
  isDurationVisible,
  type NativeCallPresentationState,
} from "@/lib/call/presentation";
import { NativeCallDuration } from "./NativeCallDuration";

export function NativeCallStatus({ state }: { state: NativeCallPresentationState }) {
  if (isDurationVisible(state)) {
    return (
      <View style={styles.container}>
        <NativeCallDuration startedAt={state.startedAt} active />
      </View>
    );
  }

  const label = callStatusLabel(state);
  if (!label) return <View style={styles.container} />;

  const failed = state.status === "FAILED";

  return (
    <View style={styles.container}>
      <Text style={[styles.label, failed && styles.failed]} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: spacing[7],
    paddingHorizontal: spacing[5],
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize + 2,
    fontWeight: "500",
    textAlign: "center",
  },
  failed: {
    color: colors.danger,
  },
});
