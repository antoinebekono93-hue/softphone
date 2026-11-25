import { StyleSheet, View } from "react-native";
import { spacing } from "@/constants/theme";
import { NativeCallControlButton, type CallControlSpec } from "./NativeCallControlButton";

export function NativeCallControlGrid({
  rows,
  size,
}: {
  rows: CallControlSpec[][];
  size: number;
}) {
  return (
    <View style={styles.grid}>
      {rows.map((row, index) => (
        <View key={index} style={styles.row}>
          {row.map((spec) => (
            <NativeCallControlButton key={spec.key} spec={spec} size={size} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing[6],
    paddingHorizontal: spacing[5],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: spacing[5],
  },
});
