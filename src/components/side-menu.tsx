// Side menu: opens from the header and lists every module of the app.
import { router, usePathname } from "expo-router";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BookOpen, CalendarDays, ChartNoAxesColumnIncreasing, ChevronRight, Dumbbell, FileText, Home, Megaphone, PencilRuler, Radio, Target, UsersRound, X } from "./icons";
import { COLORS } from "./hoopstats-ui";
import type { ComponentType } from "react";

type Item = { label: string; description: string; path: string; Icon: ComponentType<{ color?: string; size?: number }> };
type Group = { title: string; items: Item[] };

// Every module of the app, grouped the same way as the dashboard.
export const MENU_GROUPS: Group[] = [
  {
    title: "TEAM",
    items: [
      { label: "Home", description: "Dashboard and next game", path: "/", Icon: Home },
      { label: "Calendar", description: "Games, practices and events", path: "/calendar", Icon: CalendarDays },
      { label: "Announcements", description: "Team news linked to events", path: "/announcements", Icon: Megaphone },
      { label: "Roster", description: "Players, profiles and stat sheets", path: "/players", Icon: UsersRound },
      { label: "Team details", description: "Name, season, staff", path: "/setup", Icon: Target },
    ],
  },
  {
    title: "COACHING TOOLKIT",
    items: [
      { label: "Team Playbook", description: "Plays, sets & situations", path: "/playbook", Icon: BookOpen },
      { label: "Drill Book", description: "Practice plans & skill work", path: "/drills", Icon: Dumbbell },
      { label: "Documents Library", description: "Plans, scouting, policies & notes", path: "/library", Icon: FileText },
      { label: "Whiteboard", description: "Draw and save a play diagram", path: "/whiteboard", Icon: PencilRuler },
      { label: "Training Planner", description: "Build this week's practice schedule", path: "/planner", Icon: CalendarDays },
    ],
  },
  {
    title: "GAME",
    items: [
      { label: "In-Game Stats", description: "Live score, clock & box score", path: "/game", Icon: Radio },
      { label: "Stats", description: "Season statistics", path: "/stats", Icon: ChartNoAxesColumnIncreasing },
    ],
  },
];

export function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const styles = makeStyles();
  const pathname = usePathname();

  function open(path: string) {
    onClose();
    if (path !== pathname) router.replace(path as never);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close menu" accessibilityRole="button" onPress={onClose} style={styles.scrim} />
        <View accessibilityRole="menu" style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.logo}><Text>Hoop</Text><Text style={styles.logoOrange}>Stats</Text></Text>
            <Pressable accessibilityLabel="Close menu" accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <X color={COLORS.navy} size={22} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {MENU_GROUPS.map((group) => (
              <View key={group.title} style={styles.group}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.items.map(({ label, description, path, Icon }) => {
                  const current = pathname === path;
                  return (
                    <Pressable
                      key={path}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected: current }}
                      onPress={() => open(path)}
                      style={({ pressed }) => [styles.item, current && styles.itemCurrent, pressed && styles.pressed]}
                    >
                      <View style={[styles.iconWrap, current && styles.iconWrapCurrent]}>
                        <Icon color={current ? "#fff" : COLORS.navy} size={18} />
                      </View>
                      <View style={styles.itemCopy}>
                        <Text style={styles.itemLabel}>{label}</Text>
                        <Text style={styles.itemDescription}>{description}</Text>
                      </View>
                      <ChevronRight color={COLORS.muted} size={18} />
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// Built on render, not at load: hoopstats-ui imports this file, so COLORS may not exist yet at load time.
const makeStyles = () => StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  scrim: { backgroundColor: "rgba(10, 25, 47, 0.45)", flex: 1 },
  panel: { backgroundColor: "#fff", maxWidth: 320, paddingTop: 48, width: "82%" },
  panelHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingBottom: 12, paddingHorizontal: 18 },
  logo: { color: COLORS.navyDark, fontSize: 22, fontWeight: "900" },
  logoOrange: { color: COLORS.orange },
  list: { gap: 16, paddingBottom: 32, paddingHorizontal: 12 },
  group: { gap: 6 },
  groupTitle: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, paddingHorizontal: 8, paddingTop: 4 },
  item: { alignItems: "center", borderRadius: 9, flexDirection: "row", gap: 12, minHeight: 56, paddingHorizontal: 8 },
  itemCurrent: { backgroundColor: "#f4f7fb" },
  pressed: { opacity: 0.75 },
  iconWrap: { alignItems: "center", backgroundColor: "#f4f7fb", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  iconWrapCurrent: { backgroundColor: COLORS.navy },
  itemCopy: { flex: 1 },
  itemLabel: { color: COLORS.navyDark, fontSize: 15, fontWeight: "700" },
  itemDescription: { color: COLORS.muted, fontSize: 12, marginTop: 1 },
});
