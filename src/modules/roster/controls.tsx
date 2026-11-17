// Small shared controls for the roster screens.
import { Pressable, Text } from "react-native";
import { COLORS } from "../../components/hoopstats-ui";
import { Plus } from "../../components/icons";
import { styles } from "./styles";

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function ActionButton({ label, onPress, primary = false, Icon }: { label: string; onPress: () => void; primary?: boolean; Icon?: typeof Plus }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, primary ? styles.actionPrimary : styles.actionSecondary, pressed && styles.pressed]}>
      {Icon ? <Icon color={primary ? "#fff" : COLORS.navy} size={16} /> : null}
      <Text style={[styles.actionText, primary ? styles.actionTextPrimary : styles.actionTextSecondary]}>{label}</Text>
    </Pressable>
  );
}
