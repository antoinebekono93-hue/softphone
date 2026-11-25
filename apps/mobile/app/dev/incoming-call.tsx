import { useEffect } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radii, spacing } from "@/constants/theme";
import { useMockIncomingCall } from "@/hooks/useMockIncomingCall";
import {
  DEFAULT_INCOMING_FIXTURE_ID,
  INCOMING_CALL_FIXTURES,
  incomingFixtureById,
  type CallFixture,
} from "@/lib/call/fixtures";
import { NativeIncomingCallScreen } from "@/components/NativeIncomingCallScreen";

export default function DevIncomingCallRoute() {
  const params = useLocalSearchParams<{ fixture?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!__DEV__) {
    return <Redirect href="/phone" />;
  }

  const requested =
    typeof params.fixture === "string" && params.fixture
      ? params.fixture
      : DEFAULT_INCOMING_FIXTURE_ID;
  const fixture = incomingFixtureById(requested);

  return (
    <View style={styles.root}>
      <View style={[styles.bar, { paddingTop: insets.top + spacing[2] }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.barContent}
        >
          {INCOMING_CALL_FIXTURES.map((item) => {
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

      <IncomingCallPreview key={fixture.id} fixture={fixture} />
    </View>
  );
}

function IncomingCallPreview({ fixture }: { fixture: CallFixture }) {
  const { call, actions } = useMockIncomingCall(fixture.state);

  useEffect(() => {
    if (call.status === "ACCEPTING") {
      const id = setTimeout(() => actions.advanceConnecting(), 1200);
      return () => clearTimeout(id);
    }
    if (call.status === "DECLINING") {
      const id = setTimeout(() => actions.advanceEnded(), 900);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [call.status, actions]);

  return (
    <NativeIncomingCallScreen
      state={call}
      onAccept={actions.accept}
      onDecline={actions.decline}
      onDismiss={actions.dismiss}
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
