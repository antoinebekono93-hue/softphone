import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/theme";
import { initialsFromName } from "@/lib/call/presentation";

export function NativeCallAvatar({
  size,
  name,
  number,
  avatarUri,
}: {
  size: number;
  name: string;
  number: string;
  avatarUri?: string | null;
}) {
  const initials = initialsFromName(name || number);
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUri) {
    return <Image source={{ uri: avatarUri }} style={[styles.image, dimension]} />;
  }

  return (
    <View style={[styles.fallback, dimension]}>
      {initials ? (
        <Text style={[styles.initials, { fontSize: size * 0.34 }]} numberOfLines={1}>
          {initials}
        </Text>
      ) : (
        <Ionicons name="person" size={size * 0.42} color={colors.accent} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceHover,
  },
  fallback: {
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: colors.accent,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
