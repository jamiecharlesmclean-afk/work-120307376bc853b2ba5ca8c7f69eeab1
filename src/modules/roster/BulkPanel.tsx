// Bulk edit actions for the players selected in the list.
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Trash2 } from "../../components/icons";
import { Chip } from "./controls";
import { POSITIONS, Player, Position } from "./model";
import { styles } from "./styles";

type Props = {
  selectedCount: number;
  onUpdate: (patch: Partial<Player>) => void;
  onRemove: () => void;
};

export function BulkPanel({ selectedCount, onUpdate, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);

  // Any change to the selection cancels a pending remove.
  useEffect(() => setConfirming(false), [selectedCount]);

  const none = selectedCount === 0;

  function remove() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    onRemove();
  }

  return (
    <View style={styles.bulkPanel}>
      <Text style={styles.bulkTitle}>{selectedCount} selected</Text>
      <Text style={styles.hint}>Tap players in the list to select them.</Text>
      <View style={styles.chips}>
        <Chip label="Set active" active={false} onPress={() => !none && onUpdate({ active: true })} />
        <Chip label="Set inactive" active={false} onPress={() => !none && onUpdate({ active: false })} />
      </View>
      <Text style={styles.subLabel}>SET POSITION</Text>
      <View style={styles.chips}>
        {POSITIONS.map((item) => (
          <Chip key={item} label={item} active={false} onPress={() => !none && onUpdate({ position: item as Position })} />
        ))}
      </View>
      <Pressable accessibilityRole="button" disabled={none} onPress={remove} style={[styles.deleteButton, none && styles.disabled]}>
        <Trash2 color="#fff" size={16} />
        <Text style={styles.deleteText}>{confirming ? `Tap again to remove ${selectedCount}` : "Remove selected"}</Text>
      </Pressable>
    </View>
  );
}
