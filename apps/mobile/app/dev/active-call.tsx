import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/constants/theme";
import { useMockActiveCall } from "@/hooks/useMockActiveCall";
import {
  CALL_FIXTURES,
  DEFAULT_FIXTURE_ID,
  fixtureById,
  type CallFixture,
} from "@/lib/call/fixtures";
import { isTerminalStatus } from "@/lib/call/presentation";
import { NativeActiveCallScreen } from "@/components/NativeActiveCallScreen";

export default function DevActiveCallRoute() {
  const params = useLocalSearchParams<{ fixture?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!__DEV__) {
    return <Redirect href="/phone" />;
  }

  const requested = typeof params.fixture === "string" && params.fixture ? params.fixture : DEFAULT_FIXTURE_ID;
  const fixture = fixtureById(requested);

  return (
    <View style={styles.root}>
      <View style={[styles.bar, { paddingTop: insets.top + spacing[2] }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barContent}
        >
          {CALL_FIXTURES.map((item) => {
            const active = item.id === fixture.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => router.setParams({ fixture: item.id })}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ActiveCallPreview key={fixture.id} fixture={fixture} />
    </View>
  );
}

function ActiveCallPreview({ fixture }: { fixture: CallFixture }) {
  const { call, keypadOpen, actions } = useMockActiveCall(fixture.state);

  const handleHangup = () => {
    if (isTerminalStatus(call.status)) actions.reset();
    else actions.hangup();
  };

  return (
    <NativeActiveCallScreen
      state={call}
      keypadOpen={keypadOpen}
      onHangup={handleHangup}
      onToggleMute={actions.toggleMute}
      onToggleSpeaker={actions.toggleSpeaker}
      onOpenKeypad={actions.openKeypad}
      onCloseKeypad={actions.closeKeypad}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bar: {
    backgroundColor: colors.surfaceGlass,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderHairline,
  },
  barContent: {
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.full,
    backgroundColor: colors.surfaceHover,
  },
  chipActive: {
    backgroundColor: colors.accent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnAccent,
  },
});
