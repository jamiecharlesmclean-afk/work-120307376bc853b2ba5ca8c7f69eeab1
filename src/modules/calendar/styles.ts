import { StyleSheet } from "react-native";
import { COLORS } from "../../components/hoopstats-ui";
import { styles as rosterStyles } from "../roster/styles";

// Calendar styles on top of the shared panel, chip and button styles from the roster.
export const styles = {
  ...rosterStyles,
  ...StyleSheet.create({
    weekRow: { flexDirection: "row" },
    weekday: { color: COLORS.muted, fontSize: 11, fontWeight: "700", paddingVertical: 4, textAlign: "center", width: "14.2857%" },
    gridWrap: { flexDirection: "row", flexWrap: "wrap" },
    cell: { alignItems: "center", borderRadius: 8, justifyContent: "center", minHeight: 46, paddingTop: 5, width: "14.2857%" },
    cellSelected: { backgroundColor: COLORS.navy },
    cellToday: { borderColor: COLORS.orange, borderWidth: 1.5 },
    dayText: { color: COLORS.navy, fontSize: 14, fontWeight: "600" },
    dayTextSelected: { color: "#ffffff" },
    dots: { flexDirection: "row", gap: 3, height: 6, marginTop: 3 },
    dot: { borderRadius: 3, height: 5, width: 5 },
    monthNav: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
    monthLabel: { color: COLORS.navy, fontSize: 17, fontWeight: "800" },
    navButton: { alignItems: "center", borderColor: COLORS.border, borderRadius: 19, borderWidth: 1, height: 38, justifyContent: "center", width: 38 },
    legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
    legendItem: { alignItems: "center", flexDirection: "row", gap: 5 },
    legendDot: { borderRadius: 5, height: 9, width: 9 },
    legendText: { color: COLORS.muted, fontSize: 11 },
    dayHeading: { color: COLORS.navy, fontSize: 15, fontWeight: "800", marginTop: 18 },
    eventRow: { alignItems: "stretch", backgroundColor: "#ffffff", borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flexDirection: "row", gap: 10, marginTop: 8, overflow: "hidden" },
    kindBar: { width: 5 },
    eventCopy: { flex: 1, paddingVertical: 10 },
    eventTitle: { color: COLORS.navy, fontSize: 15, fontWeight: "700" },
    eventMeta: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
    fieldRow: { flexDirection: "row", gap: 10 },
    fieldHalf: { flex: 1 },
    multiline: { minHeight: 70, textAlignVertical: "top" },
    deleteButton: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginTop: 6 },
    openButton: { alignItems: "center", borderLeftColor: COLORS.border, borderLeftWidth: 1, justifyContent: "center", paddingHorizontal: 10, width: 96 },
    openText: { color: COLORS.orange, fontSize: 11, fontWeight: "800", marginBottom: 2, textAlign: "center" },
    deleteText: { color: "#c0392b", fontSize: 14, fontWeight: "700" },
  }),
};
