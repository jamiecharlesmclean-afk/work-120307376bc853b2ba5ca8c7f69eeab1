import { router } from "expo-router";
import { ArrowLeft, RotateCcw } from "../components/icons";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { EMPTY_GAME, GAME_PLAYERS, GameEvent, GameState, StatKey, formatClock, gameApi, playerName, playerStats, teamScore } from "../lib/game";

const actions: { label: string; stat: StatKey; value?: string }[] = [
  { label: "2PT", stat: "twoMade", value: "+2" }, { label: "2PT Miss", stat: "twoMissed" },
  { label: "3PT", stat: "threeMade", value: "+3" }, { label: "3PT Miss", stat: "threeMissed" },
  { label: "FT Made", stat: "freeThrowMade", value: "+1" }, { label: "FT Miss", stat: "freeThrowMissed" },
  { label: "Rebound", stat: "rebounds" }, { label: "Assist", stat: "assists" },
  { label: "Steal", stat: "steals" }, { label: "Block", stat: "blocks" },
  { label: "Turnover", stat: "turnovers" }, { label: "Foul", stat: "fouls" },
];

export default function GameScreen() {
  const [game, setGame] = useState<GameState>(EMPTY_GAME);
  const [loaded, setLoaded] = useState(false);
  const [player, setPlayer] = useState(GAME_PLAYERS[0]!.id);
  const [clockRunning, setClockRunning] = useState(false);

  useEffect(() => { void gameApi.load().then((saved) => { setGame(saved); setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) void gameApi.save(game); }, [game, loaded]);
  useEffect(() => {
    if (!clockRunning) return;
    const interval = setInterval(() => setGame((current) => ({ ...current, seconds: Math.max(0, current.seconds - 1) })), 1000);
    return () => clearInterval(interval);
  }, [clockRunning]);

  function record(stat: StatKey) {
    const event: GameEvent = { id: `${Date.now()}-${Math.random()}`, player, stat, createdAt: Date.now() };
    setGame((current) => ({ ...current, events: [...current.events, event] }));
  }

  function undo() {
    setGame((current) => ({ ...current, events: current.events.slice(0, -1) }));
  }

  function resetGame() {
    Alert.alert("Start a new game?", "This clears the current score and box score.", [
      { text: "Cancel", style: "cancel" },
      { text: "New game", style: "destructive", onPress: () => { setClockRunning(false); setGame(EMPTY_GAME); } },
    ]);
  }

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><ArrowLeft color={COLORS.navy} size={19} /><Text style={styles.backText}>Dashboard</Text></Pressable>
        <View style={styles.scoreboard}>
          <Text style={styles.live}>●  LIVE GAME</Text>
          <Text style={styles.opponent}>HOOPSTATS  ·  {game.opponent.toUpperCase()}</Text>
          <View style={styles.scoreRow}>
            <View style={styles.scoreSide}><Text style={styles.teamLabel}>HOME</Text><Text style={styles.score}>{teamScore(game.events)}</Text></View>
            <View style={styles.clockWrap}>
              <Text style={styles.period}>PERIOD {game.period}</Text>
              <Pressable onPress={() => setClockRunning((running) => !running)}><Text style={styles.clock}>{formatClock(game.seconds)}</Text></Pressable>
              <Text style={styles.clockHint}>{clockRunning ? "TAP TO PAUSE" : "TAP TO START"}</Text>
            </View>
            <View style={styles.scoreSide}><Text style={styles.teamLabel}>{game.opponent.toUpperCase()}</Text><Text style={styles.score}>0</Text></View>
          </View>
          <View style={styles.periodControls}>
            <Pressable onPress={() => setGame((current) => ({ ...current, period: Math.max(1, current.period - 1) }))} style={styles.periodButton}><Text style={styles.periodButtonText}>−</Text></Pressable>
            <Text style={styles.periodControlLabel}>PERIOD</Text>
            <Pressable onPress={() => { setGame((current) => ({ ...current, period: current.period + 1, seconds: 600 })); setClockRunning(false); }} style={styles.periodButton}><Text style={styles.periodButtonText}>+</Text></Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>SELECT PLAYER</Text>
        <View style={styles.playerSelector}>
          {GAME_PLAYERS.map(({ id, name }) => <Pressable key={id} onPress={() => setPlayer(id)} style={[styles.playerChip, player === id && styles.playerChipActive]}><Text style={[styles.playerChipText, player === id && styles.playerChipTextActive]}>{name}</Text></Pressable>)}
        </View>
        <Text style={styles.sectionTitle}>LOG PLAY · {playerName(player).toUpperCase()}</Text>
        <View style={styles.actionGrid}>
          {actions.map(({ label, stat, value }) => <Pressable key={stat} onPress={() => record(stat)} style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}><Text style={styles.actionLabel}>{label}</Text>{value ? <Text style={styles.actionValue}>{value}</Text> : null}</Pressable>)}
        </View>

        <Text style={styles.sectionTitle}>BOX SCORE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.boxHeader}><Text style={[styles.boxCell, styles.boxName]}>PLAYER</Text>{["PTS", "REB", "AST", "STL", "BLK", "TO", "PF"].map((label) => <Text key={label} style={styles.boxCell}>{label}</Text>)}</View>
            {GAME_PLAYERS.map(({ id, name }) => {
              const stats = playerStats(game.events, id);
              const points = stats.twoMade * 2 + stats.threeMade * 3 + stats.freeThrowMade;
              return <View key={id} style={styles.boxRow}><Text style={[styles.boxCell, styles.boxName, styles.boxPlayer]}>{name}</Text>{[String(points), String(stats.rebounds), String(stats.assists), String(stats.steals), String(stats.blocks), String(stats.turnovers), String(stats.fouls)].map((value, index) => <Text key={`${id}-${index}`} style={styles.boxCell}>{value}</Text>)}</View>;
            })}
          </View>
        </ScrollView>
        <View style={styles.footerActions}>
          <Pressable onPress={undo} style={styles.footerButton}><RotateCcw color={COLORS.navy} size={16} /><Text style={styles.footerText}>Undo last play</Text></Pressable>
          <Pressable onPress={resetGame} style={styles.newGame}><Text style={styles.newGameText}>New game</Text></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignSelf: "center", maxWidth: 620, paddingBottom: 32, paddingHorizontal: 17, paddingTop: 12, width: "100%" },
  back: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginBottom: 11 },
  backText: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  scoreboard: { backgroundColor: COLORS.navy, borderRadius: 10, padding: 16 },
  live: { color: "#ffac7b", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  opponent: { color: "#c5d2e2", fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginTop: 8, textAlign: "center" },
  scoreRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 5 },
  scoreSide: { alignItems: "center", flex: 1 },
  teamLabel: { color: "#d6e0ec", fontSize: 10, fontWeight: "700", letterSpacing: 0.7 },
  score: { color: "#fff", fontSize: 44, fontWeight: "800", lineHeight: 52 },
  clockWrap: { alignItems: "center", borderColor: "#ffffff35", borderLeftWidth: 1, borderRightWidth: 1, paddingHorizontal: 18 },
  period: { color: "#ffac7b", fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  clock: { color: "#fff", fontSize: 28, fontVariant: ["tabular-nums"], fontWeight: "800", marginTop: 3 },
  clockHint: { color: "#c5d2e2", fontSize: 8, fontWeight: "700", marginTop: 1 },
  periodControls: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 17, marginTop: 8 },
  periodButton: { alignItems: "center", backgroundColor: "#ffffff20", borderRadius: 12, height: 24, justifyContent: "center", width: 28 },
  periodButtonText: { color: "#fff", fontSize: 18, fontWeight: "600", lineHeight: 22 },
  periodControlLabel: { color: "#c5d2e2", fontSize: 9, fontWeight: "700", letterSpacing: 0.7 },
  sectionTitle: { color: COLORS.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginBottom: 8, marginTop: 18 },
  playerSelector: { flexDirection: "row", gap: 8 },
  playerChip: { borderColor: COLORS.border, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8 },
  playerChipActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orange },
  playerChipText: { color: COLORS.navy, fontSize: 13, fontWeight: "600" },
  playerChipTextActive: { color: "#fff" },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: { alignItems: "center", backgroundColor: "#fff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flexBasis: "31%", flexGrow: 1, justifyContent: "center", minHeight: 56, paddingHorizontal: 5 },
  actionPressed: { backgroundColor: "#fff2e9", borderColor: COLORS.orange },
  actionLabel: { color: COLORS.navy, fontSize: 12, fontWeight: "700" },
  actionValue: { color: COLORS.orange, fontSize: 10, fontWeight: "800", marginTop: 2 },
  boxHeader: { alignItems: "center", backgroundColor: "#edf2f8", flexDirection: "row", height: 33 },
  boxRow: { alignItems: "center", borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: "row", height: 36 },
  boxCell: { color: COLORS.muted, fontSize: 10, fontWeight: "700", textAlign: "center", width: 42 },
  boxName: { textAlign: "left", width: 74 },
  boxPlayer: { color: COLORS.navy, fontSize: 11, fontWeight: "700" },
  footerActions: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
  footerButton: { alignItems: "center", flexDirection: "row", gap: 7, paddingVertical: 8 },
  footerText: { color: COLORS.navy, fontSize: 12, fontWeight: "600" },
  newGame: { borderColor: "#efc5c0", borderRadius: 6, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  newGameText: { color: "#a5463e", fontSize: 11, fontWeight: "700" },
});
