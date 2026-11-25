import { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PhoneTab } from "@buster/shared";
import { colors } from "@/constants/theme";
import { NativeDialerHeader } from "./NativeDialerHeader";
import { NativeDialerScreen } from "./NativeDialerScreen";
import { NativeBottomTabBar } from "./NativeBottomTabBar";
import { ScreenPlaceholder } from "./ScreenPlaceholder";

const PLACEHOLDERS: Record<
  Exclude<PhoneTab, "dialer">,
  { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }
> = {
  favorites: {
    icon: "star-outline",
    title: "Favoris",
    description: "Vos contacts favoris apparaîtront ici.",
  },
  recents: {
    icon: "time-outline",
    title: "Récents",
    description: "L'historique de vos appels apparaîtra ici.",
  },
  contacts: {
    icon: "people-outline",
    title: "Contacts",
    description: "Votre carnet d'adresses apparaîtra ici.",
  },
  messages: {
    icon: "chatbubble-outline",
    title: "Messagerie",
    description: "Vos messages et transcriptions apparaîtront ici.",
  },
};

export function NativePhoneShell() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<PhoneTab>("dialer");

  const handleProfile = useCallback(() => {
    Alert.alert("Profil", "La gestion du compte arrive prochainement sur mobile.");
  }, []);

  return (
    <LinearGradient
      colors={[colors.bgGradientFrom, colors.bgGradientTo]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <NativeDialerHeader onProfilePress={handleProfile} />

      <View style={styles.content}>
        <View style={[styles.layer, tab !== "dialer" && styles.hidden]}>
          <NativeDialerScreen />
        </View>
        {tab !== "dialer" && (
          <ScreenPlaceholder
            icon={PLACEHOLDERS[tab].icon}
            title={PLACEHOLDERS[tab].title}
            description={PLACEHOLDERS[tab].description}
          />
        )}
      </View>

      <NativeBottomTabBar active={tab} onChange={setTab} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  layer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  hidden: {
    display: "none",
  },
});
