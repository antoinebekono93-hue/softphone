import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, radii, shadows, spacing, typography } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";

const KEYS: { digit: string; letters: string }[] = [
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
  { digit: "0", letters: "" },
  { digit: "#", letters: "" },
];

export function NativeInCallKeypad({
  visible,
  onClose,
  onKeyPress,
}: {
  visible: boolean;
  onClose: () => void;
  onKeyPress?: (digit: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Masquer le clavier">
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(spacing[5], insets.bottom + spacing[3]) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Clavier</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Masquer le clavier"
              style={styles.close}
            >
              <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {KEYS.map((key) => (
              <Pressable
                key={key.digit}
                onPress={() => {
                  haptics.digit();
                  onKeyPress?.(key.digit);
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  key.letters ? `Touche ${key.digit}, ${key.letters}` : `Touche ${key.digit}`
                }
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                <Text style={styles.digit}>{key.digit}</Text>
                {key.letters ? <Text style={styles.letters}>{key.letters}</Text> : null}
              </Pressable>
            ))}
          </View>

          <Text style={styles.note}>L’envoi DTMF sera disponible prochainement.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.32)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    ...shadows.lg,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
    alignSelf: "center",
    marginTop: spacing[2],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  title: {
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    color: colors.text,
  },
  close: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    columnGap: spacing[6],
    rowGap: spacing[3],
    paddingBottom: spacing[4],
  },
  key: {
    width: layout.inCallKey,
    height: layout.inCallKey,
    borderRadius: layout.inCallKey / 2,
    backgroundColor: colors.keySurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderKey,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  keyPressed: {
    backgroundColor: colors.keySurfacePressed,
    transform: [{ scale: 0.96 }],
  },
  digit: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "500",
    lineHeight: 26,
  },
  letters: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    lineHeight: 11,
  },
  note: {
    color: colors.textMuted,
    fontSize: typography.caption.fontSize,
    textAlign: "center",
    paddingHorizontal: spacing[5],
  },
});
