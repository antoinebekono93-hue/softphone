import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDisplayNumber, countryByDialCode } from "@buster/shared";
import { colors, layout, radii, shadows, spacing } from "@/constants/theme";

export function NativeDialerNumberField({
  number,
  dialCode,
  isInternational,
  onOpenCountry,
  onBackspace,
  onChangeNumber,
}: {
  number: string;
  dialCode: string;
  isInternational: boolean;
  onOpenCountry: () => void;
  onBackspace: () => void;
  onChangeNumber: (value: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  const country = countryByDialCode(dialCode);
  const iso = isInternational ? undefined : country.iso;
  const display = number ? formatDisplayNumber(number, iso) : "";

  return (
    <View style={styles.field}>
      {!isInternational && (
        <>
          <Pressable
            onPress={onOpenCountry}
            accessibilityRole="button"
            accessibilityLabel={`Pays : ${country.label} (${country.code})`}
            style={({ pressed }) => [styles.country, pressed && styles.pressed]}
          >
            <Text style={styles.flag}>{country.flag}</Text>
            <Text style={styles.code}>{country.code}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.inkSoft} />
          </Pressable>
          <View style={styles.divider} />
        </>
      )}

      <TextInput
        value={focused ? number : display}
        onChangeText={onChangeNumber}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Saisir un numéro..."
        placeholderTextColor={colors.placeholder}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        selectionColor={colors.accent}
        underlineColorAndroid="transparent"
        accessibilityLabel="Numéro de téléphone"
        style={styles.input}
      />

      <Pressable
        onPress={onBackspace}
        disabled={!number}
        accessibilityRole="button"
        accessibilityState={{ disabled: !number }}
        accessibilityLabel="Effacer le dernier chiffre"
        style={({ pressed }) => [
          styles.backspace,
          !number && styles.backspaceIdle,
          pressed && number && styles.pressed,
        ]}
      >
        <Ionicons name="backspace-outline" size={25} color={colors.inkSoft} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    height: layout.numberFieldHeight,
    marginHorizontal: spacing[4],
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    paddingLeft: spacing[3],
    paddingRight: spacing[1],
    ...shadows.field,
  },
  country: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
  },
  flag: {
    fontSize: 19,
    lineHeight: 23,
  },
  code: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: colors.divider,
    marginHorizontal: spacing[1],
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.ink,
    fontSize: 17,
    fontWeight: "400",
    letterSpacing: -0.1,
    paddingVertical: 0,
    paddingHorizontal: spacing[2],
  },
  backspace: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  backspaceIdle: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.55,
  },
});
