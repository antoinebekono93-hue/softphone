import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PHONE_TABS, type PhoneTab } from "@buster/shared";
import { colors, layout, radii, shadows, spacing, typography } from "@/constants/theme";
import { useHaptics } from "@/hooks/useHaptics";

const TAB_ICONS: Record<
  PhoneTab,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  favorites: { active: "star", inactive: "star-outline" },
  recents: { active: "time", inactive: "time-outline" },
  contacts: { active: "person", inactive: "person-outline" },
  dialer: { active: "keypad", inactive: "keypad-outline" },
  messages: { active: "chatbubble", inactive: "chatbubble-outline" },
};

export function NativeBottomTabBar({
  active,
  onChange,
  badges,
}: {
  active: PhoneTab;
  onChange: (tab: PhoneTab) => void;
  badges?: Partial<Record<PhoneTab, number>>;
}) {
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(spacing[2], insets.bottom) }]}>
      {PHONE_TABS.map((tab) => {
        const isActive = tab.id === active;
        const icons = TAB_ICONS[tab.id];
        const badge = badges?.[tab.id] ?? 0;
        return (
          <Pressable
            key={tab.id}
            onPress={() => {
              if (tab.id === active) return;
              haptics.digit();
              onChange(tab.id);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={styles.tab}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Ionicons
                name={isActive ? icons.active : icons.inactive}
                size={20}
                color={isActive ? colors.brandBlue : colors.inkSoft}
              />
              {badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
                </View>
              )}
            </View>
            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingTop: spacing[2],
    paddingHorizontal: spacing[1],
    marginHorizontal: spacing[3],
    marginBottom: spacing[2],
    ...shadows.tabbar,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingTop: spacing[2],
    paddingBottom: spacing[1],
  },
  iconWrap: {
    width: layout.tabIconWidth,
    height: layout.tabIconHeight,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.brandBlueSoft,
  },
  label: {
    color: colors.inkSoft,
    fontSize: typography.tab.fontSize,
    fontWeight: typography.tab.fontWeight,
    lineHeight: typography.tab.fontSize,
  },
  labelActive: {
    color: colors.brandBlue,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: radii.full,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.textOnAccent,
    fontSize: 10,
    fontWeight: "600",
    lineHeight: 14,
  },
});
