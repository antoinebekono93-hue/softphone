import { useMemo } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { colors, layout, radii, shadows, typography } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";

interface KeyDef {
  digit: string;
  letters: string;
}

const KEYS: KeyDef[] = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

function clamp(min: number, value: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function NativeDialerKeypad({
  onDigit,
  onLongZero,
  availableWidth,
  availableHeight,
}: {
  onDigit: (digit: string) => void;
  onLongZero: () => void;
  availableWidth?: number;
  availableHeight?: number;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const haptics = useHaptics();

  const metrics = useMemo(() => {
    const measured = availableWidth && availableWidth > 0 ? availableWidth : windowWidth;
    const width = measured > 0 ? measured : 390;
    const containerWidth = Math.min(width, layout.keypadMaxWidth) - layout.keypadPadding * 2;
    const columnGap = clamp(20, width * 0.056, 24);
    const rowGap = clamp(5, width * 0.014, 8);
    const widthKey = Math.floor((containerWidth - columnGap * 2) / 3);
    const heightKey =
      availableHeight && availableHeight > 0
        ? Math.floor((availableHeight - rowGap * 3) / 4)
        : Number.POSITIVE_INFINITY;
    const keySize = Math.max(46, Math.min(widthKey, heightKey));
    const gridWidth = Math.min(containerWidth, keySize * 3 + columnGap * 2);
    return { columnGap, rowGap, keySize, gridWidth };
  }, [windowWidth, availableWidth, availableHeight]);

  return (
    <View
      style={[
        styles.grid,
        {
          width: metrics.gridWidth,
          columnGap: metrics.columnGap,
          rowGap: metrics.rowGap,
        },
      ]}
    >
      {KEYS.map((key) => (
        <Pressable
          key={key.digit}
          onPress={() => {
            haptics.digit();
            onDigit(key.digit);
          }}
          onLongPress={
            key.digit === "0"
              ? () => {
                  haptics.press();
                  onLongZero();
                }
              : undefined
          }
          delayLongPress={480}
          accessibilityRole="button"
          accessibilityLabel={key.letters ? `${key.digit}, ${key.letters}` : `Touche ${key.digit}`}
          style={({ pressed }) => [
            styles.key,
            { width: metrics.keySize, height: metrics.keySize, borderRadius: radii.full },
            pressed && styles.keyPressed,
          ]}
        >
          <Text style={styles.digit}>{key.digit}</Text>
          {key.letters ? <Text style={styles.letters}>{key.letters}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  key: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.key,
  },
  keyPressed: {
    backgroundColor: colors.keySurfacePressed,
    transform: [{ scale: 0.96 }],
  },
  digit: {
    color: colors.ink,
    fontSize: typography.keypadDigit.fontSize,
    fontWeight: typography.keypadDigit.fontWeight,
    lineHeight: typography.keypadDigit.fontSize * 0.95,
  },
  letters: {
    color: colors.inkSoft,
    fontSize: typography.keypadLetters.fontSize,
    fontWeight: typography.keypadLetters.fontWeight,
    letterSpacing: typography.keypadLetters.letterSpacing,
    textTransform: "uppercase",
    lineHeight: typography.keypadLetters.fontSize,
    marginTop: 3,
  },
});
