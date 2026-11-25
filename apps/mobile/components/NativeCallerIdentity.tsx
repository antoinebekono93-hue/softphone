import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/constants/theme";
import {
  callerPrimaryLabel,
  callerSecondaryLabel,
  type NativeCallPresentationState,
} from "@/lib/call/presentation";
import { NativeCallAvatar } from "./NativeCallAvatar";

export function NativeCallerIdentity({
  state,
  avatarSize,
}: {
  state: NativeCallPresentationState;
  avatarSize: number;
}) {
  const primary = callerPrimaryLabel(state);
  const secondary = callerSecondaryLabel(state);

  return (
    <View style={styles.container}>
      <NativeCallAvatar
        size={avatarSize}
        name={state.displayName}
        number={state.displayNumber}
        avatarUri={state.avatarUri}
      />
      <View style={styles.labels}>
        <Text
          style={styles.name}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          accessibilityRole="header"
        >
          {primary}
        </Text>
        {secondary ? (
          <Text style={styles.number} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  labels: {
    marginTop: spacing[5],
    paddingHorizontal: spacing[5],
    maxWidth: "100%",
  },
  name: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  number: {
    marginTop: spacing[2],
    color: colors.textSecondary,
    fontSize: typography.body.fontSize + 1,
    fontWeight: "400",
    textAlign: "center",
  },
});
