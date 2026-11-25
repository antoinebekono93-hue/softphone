import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DIAL_COUNTRIES, type DialCountry } from "@buster/shared";
import { colors, radii, shadows, spacing } from "@/constants/theme";

export function NativeCountryPicker({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedCode: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer">
        <Pressable
          style={[styles.sheet, { paddingBottom: Math.max(spacing[4], insets.bottom) }]}
          onPress={() => {}}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Code pays</Text>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              style={styles.close}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
          <FlatList
            data={DIAL_COUNTRIES as readonly DialCountry[] as DialCountry[]}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => {
              const selected = item.code === selectedCode;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.label} (${item.code})`}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.code}>{item.code}</Text>
                  {selected && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                </Pressable>
              );
            }}
          />
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
    maxHeight: "72%",
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
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  close: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  rowPressed: {
    backgroundColor: colors.surfaceHover,
  },
  flag: {
    fontSize: 20,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  code: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
