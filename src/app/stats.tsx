import { ChartNoAxesColumnIncreasing } from "../components/icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { teamSubtitle, useTeam } from "../lib/team";

const leaders = [
  { label: "Points per game", value: "13.5", width: "82%" as const },
  { label: "Rebounds per game", value: "5.4", width: "64%" as const },
  { label: "Assists per game", value: "3.6", width: "48%" as const },
];

export default function StatsScreen() {
  const { team } = useTeam();
  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Team Stats</Text>
        <Text style={styles.subtitle}>{teamSubtitle(team, "2024–25 Season")}</Text>
        <View style={styles.recordCard}>
          <Text style={styles.recordLabel}>TEAM RECORD</Text>
          <View style={styles.recordRow}>
            <View style={styles.recordCell}><Text style={styles.recordValue}>8</Text><Text style={styles.recordCaption}>WINS</Text></View>
            <View style={styles.divider} />
            <View style={styles.recordCell}><Text style={styles.recordValue}>3</Text><Text style={styles.recordCaption}>LOSSES</Text></View>
            <View style={styles.divider} />
            <View style={styles.recordCell}><Text style={styles.recordValue}>72.4</Text><Text style={styles.recordCaption}>PPG</Text></View>
          </View>
        </View>
        <View style={styles.sectionTitle}><ChartNoAxesColumnIncreasing color={COLORS.orange} size={21} /><Text style={styles.sectionText}>Team Averages</Text></View>
        <View style={styles.averages}>
          {leaders.map((item) => (
            <View key={item.label} style={styles.average}>
              <View style={styles.averageTop}><Text style={styles.averageLabel}>{item.label}</Text><Text style={styles.averageValue}>{item.value}</Text></View>
              <View style={styles.track}><View style={[styles.bar, { width: item.width }]} /></View>
            </View>
          ))}
        </View>
        <View style={styles.nextGame}>
          <Text style={styles.recordLabel}>UP NEXT</Text>
          <Text style={styles.gameTitle}>Riverside High</Text>
          <Text style={styles.gameDetail}>Friday · 7:00 PM</Text>
        </View>
      </ScrollView>
      <BottomNav active="stats" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 500, paddingBottom: 22, paddingHorizontal: 19, paddingTop: 20, width: "100%" },
  title: { color: COLORS.navyDark, fontSize: 28, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 15, marginTop: 3 },
  recordCard: { backgroundColor: COLORS.navy, borderRadius: 8, marginTop: 19, padding: 17 },
  recordLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "600", letterSpacing: 0.3 },
  recordRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-around", marginTop: 13 },
  recordCell: { alignItems: "center", flex: 1 },
  recordValue: { color: "#fff", fontSize: 27, fontWeight: "800" },
  recordCaption: { color: "#dce5f0", fontSize: 10, fontWeight: "600", marginTop: 2 },
  divider: { backgroundColor: "#ffffff55", height: 36, width: 1 },
  sectionTitle: { alignItems: "center", flexDirection: "row", gap: 8, marginBottom: 12, marginTop: 24 },
  sectionText: { color: COLORS.navyDark, fontSize: 18, fontWeight: "700" },
  averages: { backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, gap: 17, padding: 15 },
  average: { gap: 8 },
  averageTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  averageLabel: { color: COLORS.muted, fontSize: 14, fontWeight: "600" },
  averageValue: { color: COLORS.navyDark, fontSize: 16, fontWeight: "800" },
  track: { backgroundColor: "#edf1f5", borderRadius: 4, height: 7, overflow: "hidden" },
  bar: { backgroundColor: COLORS.orange, borderRadius: 4, height: "100%" },
  nextGame: { backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, marginTop: 16, padding: 16 },
  gameTitle: { color: COLORS.navyDark, fontSize: 18, fontWeight: "700", marginTop: 7 },
  gameDetail: { color: COLORS.muted, fontSize: 14, marginTop: 3 },
});
