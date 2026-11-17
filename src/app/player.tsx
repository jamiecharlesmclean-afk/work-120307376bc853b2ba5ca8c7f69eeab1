import { router } from "expo-router";
import { CalendarDays, CircleDot, Percent, Target } from "../components/icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomNav, COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";

const stats = [
  { label: "Points Per Game", value: "18.2", Icon: CircleDot },
  { label: "Rebounds", value: "6.1", Icon: Target },
  { label: "Assists", value: "4.3", Icon: CircleDot },
  { label: "Field Goal Percentage", value: "52%", Icon: Percent },
];

export default function PlayerScreen() {
  return (
    <Screen darkStatus>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profile}>
          <View style={styles.avatar}><Text style={styles.avatarNumber}>12</Text></View>
          <View>
            <Text style={styles.name}>Jaylen</Text>
            <Text style={styles.meta}>#12  ·  Forward</Text>
          </View>
        </View>
        <View style={styles.statList}>
          {stats.map(({ label, value, Icon }) => (
            <View key={label} style={styles.statRow}>
              <Icon color={COLORS.orange} size={31} strokeWidth={1.8} />
              <Text style={styles.statLabel}>{label}</Text>
              <Text style={styles.statValue}>{value}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => router.push("/game")} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <CalendarDays color="#fff" size={24} />
          <Text style={styles.actionText}>Log Game Stats</Text>
        </Pressable>
      </ScrollView>
      <BottomNav active="home" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 500, paddingBottom: 22, paddingHorizontal: 20, paddingTop: 20, width: "100%" },
  profile: { alignItems: "center", borderBottomColor: "#e7ebf0", borderBottomWidth: 1, flexDirection: "row", gap: 20, marginBottom: 20, paddingBottom: 19 },
  avatar: { alignItems: "center", backgroundColor: COLORS.navy, borderColor: COLORS.orange, borderRadius: 50, borderWidth: 2, height: 92, justifyContent: "center", width: 92 },
  avatarNumber: { color: "#fff", fontSize: 28, fontWeight: "800" },
  name: { color: COLORS.navyDark, fontSize: 28, fontWeight: "800" },
  meta: { color: COLORS.muted, fontSize: 16, fontWeight: "500", marginTop: 3 },
  statList: { gap: 10 },
  statRow: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 16, height: 70, paddingHorizontal: 15 },
  statLabel: { color: COLORS.muted, flex: 1, fontSize: 14, fontWeight: "600" },
  statValue: { color: COLORS.navyDark, fontSize: 31, fontWeight: "800", letterSpacing: -0.7 },
  action: { alignItems: "center", backgroundColor: COLORS.orange, borderRadius: 8, flexDirection: "row", gap: 12, height: 52, justifyContent: "center", marginTop: 16 },
  actionText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.78 },
});
