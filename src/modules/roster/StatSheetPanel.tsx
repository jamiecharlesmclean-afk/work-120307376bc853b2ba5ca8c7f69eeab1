// Stat-preparation panel: pick a template, download a blank stat sheet, or save a new template.
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Download, Plus } from "../../components/icons";
import { COLORS } from "../../components/hoopstats-ui";
import { downloadFile } from "../../lib/download";
import { ActionButton, Chip } from "./controls";
import { PHONE_NOTE } from "./notes";
import { Player, STAT_COLUMNS, STAT_KEYS, StatColumn, StatTemplate, statSheetCsv } from "./model";
import { styles } from "./styles";

type Props = {
  templates: StatTemplate[];
  // The players currently shown in the list; the sheet lists the active ones.
  players: Player[];
  onMessage: (message: string) => void;
  onTemplateAdded: (template: StatTemplate) => Promise<void>;
};

export function StatSheetPanel({ templates, players, onMessage, onTemplateAdded }: Props) {
  const [templateId, setTemplateId] = useState("game-sheet");
  const [newName, setNewName] = useState("");
  const [newColumns, setNewColumns] = useState<StatColumn[]>(["points", "rebounds", "assists"]);

  function download() {
    const template = templates.find((item) => item.id === templateId) ?? templates[0];
    const active = players.filter((player) => player.active);
    const saved = downloadFile(`stat-sheet-${template.name.toLowerCase().replace(/\s+/g, "-")}.csv`, statSheetCsv(players, template), "text/csv;charset=utf-8");
    onMessage(saved ? `Stat sheet saved for ${active.length} active players.` : PHONE_NOTE);
  }

  async function createTemplate() {
    const name = newName.trim();
    if (!name || newColumns.length === 0) {
      onMessage("Give the template a name and at least one stat.");
      return;
    }
    const template: StatTemplate = { id: `custom-${Date.now().toString(36)}`, name, columns: newColumns, builtIn: false };
    await onTemplateAdded(template);
    setTemplateId(template.id);
    setNewName("");
    onMessage(`Template "${name}" saved.`);
  }

  function toggleColumn(column: StatColumn) {
    setNewColumns((current) => (current.includes(column) ? current.filter((item) => item !== column) : [...current, column]));
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Stat-preparation templates</Text>
      <Text style={styles.hint}>A template picks the stat columns on a blank game sheet. The sheet lists the active players in the current list.</Text>
      <View style={styles.chips}>
        {templates.map((template) => (
          <Chip key={template.id} label={template.name} active={templateId === template.id} onPress={() => setTemplateId(template.id)} />
        ))}
      </View>
      <ActionButton label="Download stat sheet" Icon={Download} primary onPress={download} />

      <Text style={styles.subLabel}>NEW TEMPLATE</Text>
      <TextInput accessibilityLabel="Template name" onChangeText={setNewName} placeholder="Template name, e.g. Under 12 shooting" placeholderTextColor={COLORS.muted} style={styles.input} value={newName} />
      <View style={styles.chips}>
        {STAT_KEYS.map((column) => (
          <Chip key={column} label={STAT_COLUMNS[column]} active={newColumns.includes(column)} onPress={() => toggleColumn(column)} />
        ))}
      </View>
      <ActionButton label="Save template" Icon={Plus} onPress={() => void createTemplate()} />
    </View>
  );
}
