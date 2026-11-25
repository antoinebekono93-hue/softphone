import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "@/constants/theme";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Introuvable" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Écran introuvable</Text>
        <Link href="/phone" style={styles.link}>
          Retour au clavier
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
    backgroundColor: colors.bg,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
  },
  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: "600",
  },
});
