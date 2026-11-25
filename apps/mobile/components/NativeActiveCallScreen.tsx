import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, layout, spacing } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";
import {
  isTerminalStatus,
  type NativeCallPresentationState,
} from "@/lib/call/presentation";
import { NativeCallerIdentity } from "./NativeCallerIdentity";
import { NativeCallStatus } from "./NativeCallStatus";
import { NativeCallControlGrid } from "./NativeCallControlGrid";
import type { CallControlSpec } from "./NativeCallControlButton";
import { NativeHangupButton } from "./NativeHangupButton";
import { NativeInCallKeypad } from "./NativeInCallKeypad";

export interface NativeActiveCallScreenProps {
  state: NativeCallPresentationState;
  keypadOpen: boolean;
  onHangup: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onOpenKeypad: () => void;
  onCloseKeypad: () => void;
  onPressKey?: (digit: string) => void;
}

export function NativeActiveCallScreen({
  state,
  keypadOpen,
  onHangup,
  onToggleMute,
  onToggleSpeaker,
  onOpenKeypad,
  onCloseKeypad,
  onPressKey,
}: NativeActiveCallScreenProps) {
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const { height, width } = useWindowDimensions();

  const compact = height < 700;
  const avatarSize = compact ? layout.avatarCompact : layout.avatarLarge;
  const controlSize = compact ? 60 : layout.callControl;

  const terminal = isTerminalStatus(state.status);

  const handleToggleMute = useCallback(() => {
    haptics.digit();
    onToggleMute();
  }, [haptics, onToggleMute]);

  const handleToggleSpeaker = useCallback(() => {
    haptics.digit();
    onToggleSpeaker();
  }, [haptics, onToggleSpeaker]);

  const handleOpenKeypad = useCallback(() => {
    haptics.digit();
    onOpenKeypad();
  }, [haptics, onOpenKeypad]);

  const handleHangup = useCallback(() => {
    haptics.press();
    onHangup();
  }, [haptics, onHangup]);

  const rows = useMemo<CallControlSpec[][]>(
    () => [
      [
        {
          key: "mute",
          icon: state.muted ? "mic-off" : "mic-outline",
          label: "Micro",
          accessibilityLabel: "Couper le microphone",
          selected: state.muted,
          disabled: terminal,
          onPress: terminal ? undefined : handleToggleMute,
        },
        {
          key: "keypad",
          icon: "keypad",
          label: "Clavier",
          accessibilityLabel: "Afficher le clavier",
          selected: false,
          disabled: terminal,
          onPress: terminal ? undefined : handleOpenKeypad,
        },
        {
          key: "speaker",
          icon: state.speaker ? "volume-high" : "volume-medium-outline",
          label: "Haut-parleur",
          accessibilityLabel: "Activer le haut-parleur",
          selected: state.speaker,
          disabled: terminal,
          onPress: terminal ? undefined : handleToggleSpeaker,
        },
      ],
      [
        {
          key: "add",
          icon: "person-add-outline",
          label: "Ajouter",
          accessibilityLabel: "Ajouter un appel",
          disabled: true,
        },
        {
          key: "video",
          icon: "videocam-outline",
          label: "Vidéo",
          accessibilityLabel: "Appel vidéo",
          disabled: true,
        },
        {
          key: "contacts",
          icon: "people-outline",
          label: "Contacts",
          accessibilityLabel: "Contacts",
          disabled: true,
        },
      ],
    ],
    [
      state.muted,
      state.speaker,
      terminal,
      handleToggleMute,
      handleOpenKeypad,
      handleToggleSpeaker,
    ],
  );

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
            maxWidth: 460,
            width: "100%",
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.top}>
          <NativeCallerIdentity state={state} avatarSize={avatarSize} />
          <View style={styles.statusWrap}>
            <NativeCallStatus state={state} />
          </View>
        </View>

        <View style={[styles.bottom, width < 360 && styles.bottomNarrow]}>
          <NativeCallControlGrid rows={rows} size={controlSize} />
          <View style={styles.hangupWrap}>
            <NativeHangupButton onPress={handleHangup} />
          </View>
        </View>
      </ScrollView>

      <NativeInCallKeypad visible={keypadOpen} onClose={onCloseKeypad} onKeyPress={onPressKey} />
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
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
  },
  statusWrap: {
    marginTop: spacing[5],
  },
  bottom: {
    gap: spacing[7],
  },
  bottomNarrow: {
    gap: spacing[5],
  },
  hangupWrap: {
    alignItems: "center",
  },
});
