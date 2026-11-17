import { router, useFocusEffect } from "expo-router";
import { Check, ChevronDown, ChevronRight, ChevronUp, Download, FileUp, Plus, Search } from "../components/icons";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BottomNav, COLORS, HoopHeader, Screen } from "../components/hoopstats-ui";
import { downloadFile } from "../lib/download";
import { teamEyebrow, useTeam } from "../lib/team";
import {
  ActionButton, BulkPanel, Chip, ImportPanel, PHONE_NOTE, POSITIONS, Player, SortBy, StatSheetPanel,
  fullName, rosterStyles as styles, rosterToCsv, useRoster, visiblePlayers,
} from "../modules/roster";

const POSITION_FILTERS = ["all", ...POSITIONS] as const;

export default function PlayersScreen() {
  const { team } = useTeam();
  const { players, templates, refresh, persist, addTemplate } = useRoster();
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<(typeof POSITION_FILTERS)[number]>("all");
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("jersey");
  const [descending, setDescending] = useState(false);

  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);
  const [panel, setPanel] = useState<"none" | "import" | "stats">("none");
  const [message, setMessage] = useState("");

  // Reload each time the screen is shown, so edits from a profile appear here.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const visible = visiblePlayers(players, { query, position, showInactive, sortBy, descending });
  const activeCount = players.filter((player) => player.active).length;

  function toggleSelected(id: number) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function bulkUpdate(patch: Partial<Player>) {
    persist(players.map((player) => (selected.includes(player.id) ? { ...player, ...patch } : player)));
    setMessage(`Updated ${selected.length} player${selected.length === 1 ? "" : "s"}.`);
  }

  function bulkRemove() {
    persist(players.filter((player) => !selected.includes(player.id)));
    setMessage(`Removed ${selected.length} player${selected.length === 1 ? "" : "s"}.`);
    setSelected([]);
  }

  function endSelecting() {
    setSelecting(false);
    setSelected([]);
  }

  function exportRoster() {
    const saved = downloadFile(`hoopstats-roster-${new Date().toISOString().slice(0, 10)}.csv`, rosterToCsv(players), "text/csv;charset=utf-8");
    setMessage(saved ? "Roster CSV saved." : PHONE_NOTE);
  }

  return (
    <Screen>
      <HoopHeader navy />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>{teamEyebrow(team, "ROSTER")}</Text>
            <Text style={styles.title}>Players</Text>
          </View>
          <Text style={styles.count}>{activeCount} active · {players.length} total</Text>
        </View>

        <View style={styles.searchBox}>
          <Search color={COLORS.muted} size={18} />
          <TextInput accessibilityLabel="Search players" onChangeText={setQuery} placeholder="Search name, number, position, phone" placeholderTextColor={COLORS.muted} style={styles.searchInput} value={query} />
        </View>

        <View style={styles.chips}>
          {POSITION_FILTERS.map((item) => (
            <Chip key={item} active={position === item} label={item === "all" ? "All positions" : item} onPress={() => setPosition(item)} />
          ))}
        </View>

        <View style={styles.sortRow}>
          <Chip active={sortBy === "jersey"} label="Jersey #" onPress={() => setSortBy("jersey")} />
          <Chip active={sortBy === "name"} label="Name" onPress={() => setSortBy("name")} />
          <Pressable accessibilityLabel="Reverse sort order" accessibilityRole="button" onPress={() => setDescending((value) => !value)} style={styles.iconChip}>
            {descending ? <ChevronDown color={COLORS.navy} size={16} /> : <ChevronUp color={COLORS.navy} size={16} />}
          </Pressable>
          <Chip active={showInactive} label="Show inactive" onPress={() => setShowInactive((value) => !value)} />
        </View>

        <View style={styles.actions}>
          <ActionButton label={selecting ? "Done selecting" : "Bulk edit"} onPress={() => (selecting ? endSelecting() : setSelecting(true))} />
          <ActionButton label="Add player" primary Icon={Plus} onPress={() => router.push({ pathname: "/roster-player", params: { id: "new" } })} />
        </View>

        {selecting ? (
          <BulkPanel selectedCount={selected.length} onUpdate={bulkUpdate} onRemove={bulkRemove} />
        ) : null}

        <View style={styles.list}>
          {visible.map((player) => {
            const isSelected = selected.includes(player.id);
            return (
              <Pressable
                key={player.id}
                accessibilityRole="button"
                onPress={() => (selecting ? toggleSelected(player.id) : router.push({ pathname: "/roster-player", params: { id: String(player.id) } }))}
                style={({ pressed }) => [styles.row, !player.active && styles.rowInactive, isSelected && styles.rowSelected, pressed && styles.pressed]}
              >
                {selecting ? (
                  <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>{isSelected ? <Check color="#fff" size={14} strokeWidth={3} /> : null}</View>
                ) : null}
                <View style={styles.jersey}><Text style={styles.jerseyText}>{player.jerseyNumber ?? "–"}</Text></View>
                <View style={styles.rowCopy}>
                  <Text style={styles.name}>{fullName(player) || "Unnamed"}</Text>
                  <Text style={styles.meta}>{[player.position || "No position", player.active ? "" : "Inactive"].filter(Boolean).join(" · ")}</Text>
                </View>
                {selecting ? null : <ChevronRight color={COLORS.muted} size={22} />}
              </Pressable>
            );
          })}
          {visible.length === 0 ? <Text style={styles.empty}>{players.length ? "No players match these filters." : "No players yet. Add one or import a CSV."}</Text> : null}
        </View>

        {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}

        <View style={styles.actions}>
          <ActionButton label="Import CSV" Icon={FileUp} onPress={() => setPanel(panel === "import" ? "none" : "import")} />
          <ActionButton label="Export CSV" Icon={Download} onPress={exportRoster} />
        </View>

        {panel === "import" ? (
          <ImportPanel players={players} onMessage={setMessage} onImported={(next, text) => { persist(next); setMessage(text); }} />
        ) : null}

        <View style={styles.actions}>
          <ActionButton label={panel === "stats" ? "Hide stat sheets" : "Stat sheets"} onPress={() => setPanel(panel === "stats" ? "none" : "stats")} />
        </View>

        {panel === "stats" ? (
          <StatSheetPanel templates={templates} players={visible} onMessage={setMessage} onTemplateAdded={addTemplate} />
        ) : null}
      </ScrollView>
      <BottomNav active="players" />
    </Screen>
  );
}
