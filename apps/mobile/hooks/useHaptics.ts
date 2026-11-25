import { useCallback } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function useHaptics() {
  const enabled = Platform.OS === "ios" || Platform.OS === "android";

  const digit = useCallback(() => {
    if (!enabled) return;
    void Haptics.selectionAsync().catch(() => {});
  }, [enabled]);

  const press = useCallback(() => {
    if (!enabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [enabled]);

  const success = useCallback(() => {
    if (!enabled) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [enabled]);

  return { digit, press, success };
}
