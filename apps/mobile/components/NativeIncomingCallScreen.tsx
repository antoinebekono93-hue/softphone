import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, spacing } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import {
  callSourceLabel,
  isTerminalStatus,
  type NativeCallPresentationState,
} from "@/lib/call/presentation";
import { NativeCallerIdentity } from "./NativeCallerIdentity";
import { NativeCallStatus } from "./NativeCallStatus";
import { NativeIncomingCallActions } from "./NativeIncomingCallActions";
import { NativeDismissButton } from "./NativeDismissButton";

export interface NativeIncomingCallScreenProps {
  state: NativeCallPresentationState;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

export function NativeIncomingCallScreen({
  state,
  onAccept,
  onDecline,
  onDismiss,
}: NativeIncomingCallScreenProps) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { height } = useWindowDimensions();

  const compact = height < 700;
  const avatarSize = compact ? layout.avatarCompact : layout.avatarLarge;
  const actionSize = compact ? 68 : layout.incomingAction;

  const handleAccept = useCallback(() => {
    haptics.press();
    onAccept();
  }, [haptics, onAccept]);

  const handleDecline = useCallback(() => {
    haptics.press();
    onDecline();
  }, [haptics, onDecline]);

  const showActions = state.status === "INCOMING";
  const showDismiss = isTerminalStatus(state.status);

  return (
    <LinearGradient
      colors={[colors.bgGradientFrom, colors.bgGradientTo]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + spacing[6],
            paddingBottom: insets.bottom + spacing[6],
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.top}>
          <Text style={styles.source} numberOfLines={1}>
            {callSourceLabel(state)}
          </Text>
          <View style={styles.identity}>
            <NativeCallerIdentity state={state} avatarSize={avatarSize} />
          </View>
          <View style={styles.statusWrap}>
            <NativeCallStatus state={state} />
          </View>
        </View>

        <View style={styles.bottom}>
          {showActions ? (
            <NativeIncomingCallActions
              onAccept={handleAccept}
              onDecline={handleDecline}
              size={actionSize}
            />
          ) : null}
          {showDismiss ? <NativeDismissButton onPress={onDismiss} /> : null}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: 460,
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
  },
  source: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    textAlign: "center",
    paddingHorizontal: spacing[5],
  },
  identity: {
    marginTop: spacing[7],
  },
  statusWrap: {
    marginTop: spacing[5],
  },
  bottom: {
    gap: spacing[5],
    minHeight: 96,
    justifyContent: "flex-end",
  },
});
