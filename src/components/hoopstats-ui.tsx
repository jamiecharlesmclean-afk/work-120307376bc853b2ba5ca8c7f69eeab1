import { router, usePathname } from "expo-router";
import { ChartNoAxesColumnIncreasing, Home, Menu, UsersRound } from "./icons";
import { ReactNode, useState } from "react";
import { SideMenu } from "./side-menu";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useTeam } from "../lib/team";

export const COLORS = {
  navy: "#143765",
  navyDark: "#102e59",
  orange: "#ff690d",
  muted: "#637b9e",
  border: "#dbe2eb",
  background: "#ffffff",
};

export function Screen({ children, darkStatus = false }: { children: ReactNode; darkStatus?: boolean }) {
  return <SafeAreaView style={[styles.safe, darkStatus && styles.safeNavy]}>{children}</SafeAreaView>;
}

// The team name sits under the logo. Tapping it opens the team setup, unless teamLink is false.
export function HoopHeader({ navy = false, teamLink = true }: { navy?: boolean; teamLink?: boolean }) {
  const { team } = useTeam();
  const [menuOpen, setMenuOpen] = useState(false);
  const label = team.teamName.trim() ? team.teamName.trim().toUpperCase() : "SET UP YOUR TEAM";
  return (
    <View style={[styles.header, navy && styles.headerNavy]}>
      <Pressable accessibilityLabel="Open menu" accessibilityRole="button" hitSlop={8} onPress={() => setMenuOpen(true)} style={styles.menuButton}>
        <Menu color={navy ? "#fff" : COLORS.navy} size={24} />
      </Pressable>
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <View style={styles.logoRow}>
        {navy ? <Text style={styles.headerBall}>🏀</Text> : null}
        <Text style={[styles.logo, navy && styles.logoWhite]}><Text>Hoop</Text><Text style={styles.logoOrange}>Stats</Text></Text>
      </View>
      {teamLink ? (
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push("/setup")}>
          <Text numberOfLines={1} style={[styles.teamName, navy && styles.teamNameWhite]}>{label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function BottomNav({ active }: { active: "home" | "players" | "stats" }) {
  const pathname = usePathname();
  const items = [
    { key: "home" as const, label: "Home", path: "/", Icon: Home },
    { key: "players" as const, label: "Players", path: "/players", Icon: UsersRound },
    { key: "stats" as const, label: "Stats", path: "/stats", Icon: ChartNoAxesColumnIncreasing },
  ] as const;
  const selected = pathname === "/" ? active : pathname === "/players" ? "players" : pathname === "/stats" ? "stats" : active;

  return (
    <View style={styles.nav}>
      {items.map(({ key, label, path, Icon }) => {
        const isActive = selected === key;
        return (
          <Pressable accessibilityRole="button" accessibilityState={{ selected: isActive }} key={key} onPress={() => router.replace(path)} style={styles.navItem}>
            <Icon color={isActive ? COLORS.navy : COLORS.muted} fill={key === "home" && isActive ? (COLORS.navy) : "none"} size={24} strokeWidth={2.6} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: COLORS.background, flex: 1 },
  safeNavy: { backgroundColor: COLORS.navy },
  header: { alignItems: "center", justifyContent: "center", minHeight: 56, paddingVertical: 6 },
  menuButton: { left: 14, position: "absolute", top: 0, bottom: 0, justifyContent: "center", zIndex: 1 },
  headerNavy: { backgroundColor: COLORS.navy, minHeight: 66 },
  logoRow: { alignItems: "center", flexDirection: "row", justifyContent: "center" },
  teamName: { color: COLORS.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, marginTop: 2, maxWidth: 320 },
  teamNameWhite: { color: "#c9d6ea" },
  logo: { color: COLORS.navy, fontSize: 30, fontWeight: "800", letterSpacing: -1.2 },
  logoWhite: { color: "#fff", fontSize: 26 },
  logoOrange: { color: COLORS.orange },
  headerBall: { fontSize: 26, marginRight: 8 },
  nav: { borderTopColor: COLORS.border, borderTopWidth: 1, flexDirection: "row", height: 76, justifyContent: "space-around", paddingTop: 8 },
  navItem: { alignItems: "center", flex: 1, gap: 2, justifyContent: "center" },
  navLabel: { color: COLORS.muted, fontSize: 12 },
  navLabelActive: { color: COLORS.navy, fontWeight: "600" },
});
