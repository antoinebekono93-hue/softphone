import { StyleSheet, Text } from "react-native";
import { colors, typography } from "@/constants/theme";
import { formatDuration } from "@/lib/call/presentation";
import { useCallDuration } from "@/hooks/useCallDuration";

export function NativeCallDuration({
  startedAt,
  active,
}: {
  startedAt?: number | null;
  active?: boolean;
}) {
  const seconds = useCallDuration(startedAt, active);
  return <Text style={styles.text}>{formatDuration(seconds)}</Text>;
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
    fontSize: typography.body.fontSize + 2,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
});
