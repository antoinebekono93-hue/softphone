import { useCallback, useMemo, useState } from "react";
import { Alert, Keyboard, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { callErrorMessage } from "@buster/shared";
import { api } from "@/lib/client";
import { ApiError } from "@/lib/api";
import { NATIVE_CALL_EXECUTION, createNativeCallService } from "@/lib/call/native-call-service";
import { useDialerState } from "@/hooks/useDialerState";
import { useHaptics } from "@/hooks/useHaptics";
import { spacing } from "@/constants/theme";
import { NativeDialerNumberField } from "./NativeDialerNumberField";
import { NativeDialerKeypad } from "./NativeDialerKeypad";
import { NativeCallActions } from "./NativeCallActions";
import { NativeCountryPicker } from "./NativeCountryPicker";

export function NativeDialerScreen() {
  const dialer = useDialerState("+237");
  const haptics = useHaptics();
  const callService = useMemo(() => createNativeCallService(api), []);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [keypadSize, setKeypadSize] = useState({ width: 0, height: 0 });

  const onKeypadLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setKeypadSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  const handleCall = useCallback(async () => {
    if (!dialer.canCall || busy) return;
    setBusy(true);
    haptics.press();
    try {
      const route = await callService.resolveRoute(dialer.outbound);
      haptics.success();
      const label =
        route.type === "APP_TO_APP" ? "Buster Call vers Buster Call" : "Appel vers le réseau";
      const note =
        NATIVE_CALL_EXECUTION === "WIRED"
          ? ""
          : "\n\nL'exécution audio native (WebRTC) n'est pas encore activée sur mobile.";
      Alert.alert("Appel prêt", `${label} : ${route.destination}${note}`);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : undefined;
      Alert.alert("Appel impossible", callErrorMessage(code));
    } finally {
      setBusy(false);
    }
  }, [busy, callService, dialer.canCall, dialer.outbound, haptics]);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <NativeDialerNumberField
          number={dialer.number}
          dialCode={dialer.dialCode}
          isInternational={dialer.isInternational}
          onOpenCountry={() => setPickerVisible(true)}
          onBackspace={dialer.backspace}
          onChangeNumber={dialer.setNumber}
        />
      </View>

      <View style={styles.keypadWrap} onLayout={onKeypadLayout}>
        <NativeDialerKeypad
          onDigit={(digit) => {
            Keyboard.dismiss();
            dialer.append(digit);
          }}
          onLongZero={() => {
            Keyboard.dismiss();
            dialer.append("+");
          }}
          availableWidth={keypadSize.width}
          availableHeight={keypadSize.height}
        />
      </View>

      <NativeCallActions
        onCall={handleCall}
        callDisabled={!dialer.canCall}
        callBusy={busy}
        onAddContact={() =>
          Alert.alert("Bientôt disponible", "L'ajout de contact arrive prochainement.")
        }
        onVideo={() => Alert.alert("Bientôt disponible", "L'appel vidéo arrive prochainement.")}
      />

      <NativeCountryPicker
        visible={pickerVisible}
        selectedCode={dialer.dialCode}
        onSelect={dialer.setDialCode}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  top: {
    paddingTop: spacing[2],
  },
  keypadWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
