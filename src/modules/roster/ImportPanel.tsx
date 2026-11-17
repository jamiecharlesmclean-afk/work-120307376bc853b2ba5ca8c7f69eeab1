// CSV import panel: explains the columns, offers the example, and imports a chosen file.
import { useState } from "react";
import { Text, View } from "react-native";
import { Download, FileUp } from "../../components/icons";
import { downloadFile } from "../../lib/download";
import { ActionButton } from "./controls";
import { EXAMPLE_ROSTER_CSV, Player, rosterFromCsv } from "./model";
import { pickRosterCsv } from "./storage";
import { styles } from "./styles";
import { PHONE_NOTE } from "./notes";

type Props = {
  players: Player[];
  onImported: (players: Player[], message: string) => void;
  onMessage: (message: string) => void;
};

export function ImportPanel({ players, onImported, onMessage }: Props) {
  const [errors, setErrors] = useState<string[]>([]);

  function downloadExample() {
    const saved = downloadFile("hoopstats-roster-example.csv", EXAMPLE_ROSTER_CSV, "text/csv;charset=utf-8");
    onMessage(saved ? "Example CSV saved." : PHONE_NOTE);
  }

  async function importRoster() {
    setErrors([]);
    try {
      const text = await pickRosterCsv();
      if (text === null) return;
      const result = rosterFromCsv(text, players);
      setErrors(result.errors);
      const count = result.added + result.updated;
      onImported(result.players, `Added ${result.added} and updated ${result.updated} player${count === 1 ? "" : "s"}.`);
    } catch (problem) {
      setErrors([problem instanceof Error ? problem.message : "The CSV could not be read."]);
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Import players from CSV</Text>
      <Text style={styles.hint}>
        The first row names the columns. first_name is required. Other columns: last_name, jersey_number (0 to 99), position (PG, SG, SF, PF or C), phone, date_of_birth (2012-05-31), contact_details, status (active or inactive). A row with the same first and last name updates that player.
      </Text>
      <Text style={styles.example}>{EXAMPLE_ROSTER_CSV}</Text>
      <View style={styles.actions}>
        <ActionButton label="Download example" Icon={Download} onPress={downloadExample} />
        <ActionButton label="Choose CSV file" Icon={FileUp} primary onPress={() => void importRoster()} />
      </View>
      {errors.map((item) => <Text key={item} style={styles.error}>{item}</Text>)}
    </View>
  );
}
