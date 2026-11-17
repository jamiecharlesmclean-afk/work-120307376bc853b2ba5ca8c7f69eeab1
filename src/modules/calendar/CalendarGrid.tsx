// Month grid. Each day shows up to three coloured dots, one per event type on that day.
import { Pressable, Text, View } from "react-native";
import { CalendarEvent, WEEKDAYS, monthGrid } from "./model";
import { KIND_COLORS } from "./kinds";
import { styles } from "./styles";

export function CalendarGrid({
  year,
  month,
  selected,
  today,
  events,
  onSelect,
}: {
  year: number;
  month: number;
  selected: string;
  today: string;
  events: CalendarEvent[];
  onSelect: (date: string) => void;
}) {
  const cells = monthGrid(year, month);
  const byDate = new Map<string, CalendarEvent[]>();
  for (const event of events) byDate.set(event.date, [...(byDate.get(event.date) ?? []), event]);

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>{day}</Text>
        ))}
      </View>
      <View style={styles.gridWrap}>
        {cells.map((date, index) => {
          if (!date) return <View key={`blank-${index}`} style={styles.cell} />;
          const dayEvents = byDate.get(date) ?? [];
          const isSelected = date === selected;
          const isToday = date === today;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`${date}, ${dayEvents.length} events`}
              onPress={() => onSelect(date)}
              style={[styles.cell, isSelected && styles.cellSelected, isToday && !isSelected && styles.cellToday]}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{Number(date.slice(8))}</Text>
              <View style={styles.dots}>
                {dayEvents.slice(0, 3).map((event) => (
                  <View key={event.id} style={[styles.dot, { backgroundColor: isSelected ? "#ffffff" : KIND_COLORS[event.kind] }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
